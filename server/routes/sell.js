import express from 'express';
import Product from '../models/Product.js';
import ProductInventory from '../models/ProductInventory.js';
import SaleRecord from '../models/SaleRecord.js';
import { requireSeller } from '../middleware/auth.js';

const router = express.Router();

// GET /api/sell/products — seller sees full data including stock & cost
router.get('/products', requireSeller, async (req, res) => {
  try {
    const { search, category, page = 1, limit = 100 } = req.query;
    let query = {}; // Seller sees all products, active or hidden
    if (category && category !== 'All') query.category = category;

    let products;
    if (search && search.trim()) {
      products = await Product.find({ ...query, $text: { $search: search.trim() } }, { score: { $meta: 'textScore' } })
        .sort({ isPinned: -1, score: { $meta: 'textScore' } }).limit(parseInt(limit));
      if (!products.length) {
        products = await Product.find({
          ...query,
          $or: [
            { name: { $regex: search.trim(), $options: 'i' } },
            { description: { $regex: search.trim(), $options: 'i' } },
            { tags: { $in: [new RegExp(search.trim(), 'i')] } }
          ]
        }).sort({ isPinned: -1, createdAt: -1 }).limit(parseInt(limit));
      }
    } else {
      products = await Product.find(query).sort({ isPinned: -1, createdAt: -1 }).limit(parseInt(limit));
    }

    // Join inventory
    const ids = products.map(p => p._id);
    const inventories = await ProductInventory.find({ product: { $in: ids } });
    const invMap = {};
    inventories.forEach(inv => { invMap[inv.product.toString()] = inv; });

    const result = products.map(p => {
      const obj = p.toObject();
      const inv = invMap[p._id.toString()];
      obj.stock = inv?.stock ?? 0;
      obj.costPrice = inv?.costPrice ?? 0;
      return obj;
    });

    res.json({ products: result, total: result.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/sell/mark-sold
router.post('/mark-sold', requireSeller, async (req, res) => {
  const { items, note, amountPaid } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'No items provided' });

  const session = await Product.startSession();
  session.startTransaction();
  try {
    const saleItems = [];
    let totalAmount = 0, totalCost = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) { await session.abortTransaction(); return res.status(404).json({ message: `Product not found: ${item.productId}` }); }

      const inv = await ProductInventory.findOne({ product: item.productId }).session(session);
      if (!inv) { await session.abortTransaction(); return res.status(404).json({ message: `Inventory not found for: ${product.name}` }); }

      const newStock = Math.max(0, inv.stock - item.quantity);
      inv.stock = newStock;
      await inv.save({ session });

      product.totalSold += item.quantity;
      await product.save({ session });

      const subtotal = item.quantity * product.sellingPrice;
      const cost = item.quantity * inv.costPrice;
      totalAmount += subtotal;
      totalCost += cost;

      saleItems.push({
        product: product._id, productName: product.name,
        quantity: item.quantity, sellingPrice: product.sellingPrice,
        costPrice: inv.costPrice, subtotal, profit: subtotal - cost
      });
    }

    const paid = (amountPaid != null && amountPaid !== '') ? Number(amountPaid) : totalAmount;
    const paymentDiff = paid - totalAmount;
    // Profit = what was actually received minus total cost
    const totalProfit = paid - totalCost;

    const saleRecord = new SaleRecord({
      items: saleItems, totalAmount, totalProfit, totalCost,
      soldBy: req.user.username,
      note: note || '',
      amountPaid: paid,
      paymentDiff
    });
    await saleRecord.save({ session });
    await session.commitTransaction();
    res.json({ message: 'Sale recorded!', sale: saleRecord });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

// POST /api/sell/return — return items (increase stock, add negative sale record)
router.post('/return', requireSeller, async (req, res) => {
  const { items, note } = req.body;
  if (!items || !items.length) return res.status(400).json({ message: 'No items provided' });

  const session = await Product.startSession();
  session.startTransaction();
  try {
    const returnItems = [];
    let totalAmount = 0, totalProfit = 0, totalCost = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) { await session.abortTransaction(); return res.status(404).json({ message: `Product not found` }); }

      const inv = await ProductInventory.findOne({ product: item.productId }).session(session);
      if (!inv) { await session.abortTransaction(); return res.status(404).json({ message: `Inventory not found` }); }

      inv.stock += item.quantity;
      await inv.save({ session });

      product.totalSold = Math.max(0, product.totalSold - item.quantity);
      await product.save({ session });

      const subtotal = -(item.quantity * product.sellingPrice);
      const cost = -(item.quantity * inv.costPrice);
      const profit = subtotal - cost;
      totalAmount += subtotal;
      totalCost += cost;
      totalProfit += profit;

      returnItems.push({
        product: product._id, productName: product.name,
        quantity: -item.quantity, sellingPrice: product.sellingPrice,
        costPrice: inv.costPrice, subtotal, profit
      });
    }

    const record = new SaleRecord({
      items: returnItems, totalAmount, totalProfit, totalCost,
      soldBy: req.user.username,
      note: `RETURN: ${note || ''}`
    });
    await record.save({ session });
    await session.commitTransaction();
    res.json({ message: 'Return recorded!', record });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally {
    session.endSession();
  }
});

// GET /api/sell/today
router.get('/today', requireSeller, async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const sales = await SaleRecord.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 });
    const totalRevenue = sales.reduce((s, r) => s + r.totalAmount, 0);
    const totalTransactions = sales.filter(s => s.totalAmount > 0).length;
    // No profit exposed to seller
    res.json({ sales, totalRevenue, totalTransactions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
