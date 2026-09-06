import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ProductInventory from '../models/ProductInventory.js';

const router = express.Router();

async function withStockStatus(products) {
  const ids = products.map(p => p._id);
  const inventories = await ProductInventory.find({ product: { $in: ids } });
  const invMap = {};
  inventories.forEach(inv => { invMap[inv.product.toString()] = inv.stock; });
  return products.map(p => {
    const obj = p.toObject();
    const stock = invMap[p._id.toString()] ?? 0;
    obj.inStock = stock > 0;
    return obj;
  });
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    let query = { isActive: true };
    if (category && category !== 'All') query.category = category;

    let products;
    if (search && search.trim()) {
      products = await Product.find({ ...query, $text: { $search: search.trim() } }, { score: { $meta: 'textScore' } })
        .sort({ isPinned: -1, score: { $meta: 'textScore' } })
        .skip((page - 1) * limit).limit(parseInt(limit));
      if (!products.length) {
        products = await Product.find({
          ...query,
          $or: [
            { name: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } },
            { tags: { $in: [new RegExp(search.trim(), 'i')] } }
          ]
        }).sort({ isPinned: -1, createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit));
      }
    } else {
      products = await Product.find(query)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip((page - 1) * limit).limit(parseInt(limit));
    }

    const total = await Product.countDocuments(query);
    const withStock = await withStockStatus(products);

    // Sort: pinned first, then in-stock, then out-of-stock — within each group keep original order
    const sorted = [
      ...withStock.filter(p => p.isPinned && p.inStock),
      ...withStock.filter(p => p.isPinned && !p.inStock),
      ...withStock.filter(p => !p.isPinned && p.inStock),
      ...withStock.filter(p => !p.isPinned && !p.inStock),
    ];

    // Strip exact stock count for public
    const publicProducts = sorted.map(({ stock, ...p }) => p);

    res.json({ products: publicProducts, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(categories);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    // Accept either the short 6-digit productId (e.g. 042817) or the long Mongo _id
    const { id } = req.params;
    const isShortId = /^\d{6}$/.test(id);
    const product = isShortId
      ? await Product.findOne({ productId: id })
      : (mongoose.Types.ObjectId.isValid(id) ? await Product.findById(id) : null);
    if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found' });
    const inv = await ProductInventory.findOne({ product: product._id });
    const obj = product.toObject();
    obj.inStock = (inv?.stock ?? 0) > 0;
    res.json(obj);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
