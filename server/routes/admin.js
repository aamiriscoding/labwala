import express from 'express';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import ProductInventory from '../models/ProductInventory.js';
import SaleRecord from '../models/SaleRecord.js';
import ShopConfig from '../models/ShopConfig.js';
import QnA from '../models/QnA.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Resolves a route param to a product using either the short 6-digit productId
// or the long Mongo _id, so the API is easy to hit with either identifier.
async function findProductByAnyId(idParam) {
  if (/^\d{6}$/.test(idParam)) return Product.findOne({ productId: idParam });
  if (mongoose.Types.ObjectId.isValid(idParam)) return Product.findById(idParam);
  return null;
}

// ─── SHOP CONFIG ──────────────────────────────────────────────
router.get('/config', requireAdmin, async (req, res) => {
  try {
    let config = await ShopConfig.findOne({ singleton: 'config' });
    if (!config) config = await ShopConfig.create({ singleton: 'config' });
    res.json(config);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/config', requireAdmin, async (req, res) => {
  try {
    const config = await ShopConfig.findOneAndUpdate(
      { singleton: 'config' }, req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json(config);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.get('/config/public', async (req, res) => {
  try {
    let config = await ShopConfig.findOne({ singleton: 'config' });
    if (!config) config = await ShopConfig.create({ singleton: 'config' });
    res.json({
      location: config.location,
      shopName: 'LabWala',
      tagline: config.tagline,
      whatsappNumber: config.whatsappNumber,
      telegramLink: config.telegramLink,
      schedule: config.schedule,
      services: config.services.filter(s => s.isVisible),
      homeStats: config.homeStats || [],
      homeFeatures: config.homeFeatures || [],
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── ANALYTICS ───────────────────────────────────────────────
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);
    const weekStart  = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0,0,0,0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const aggregate = async (start, end) => {
      const match = end ? { createdAt: { $gte: start, $lte: end } } : { createdAt: { $gte: start } };
      const result = await SaleRecord.aggregate([
        { $match: match },
        { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' }, cost: { $sum: '$totalCost' }, transactions: { $sum: 1 } } }
      ]);
      return result[0] || { revenue: 0, profit: 0, cost: 0, transactions: 0 };
    };

    const [today, week, month, allTime] = await Promise.all([
      aggregate(todayStart, todayEnd), aggregate(weekStart), aggregate(monthStart), aggregate(new Date(0))
    ]);

    const topProducts = await SaleRecord.aggregate([
      { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.productName' }, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.subtotal' }, profit: { $sum: '$items.profit' } } },
      { $sort: { totalSold: -1 } }, { $limit: 5 }
    ]);

    // Chart data — build based on period
    const buildChartData = async (periodKey) => {
      const points = [];
      if (periodKey === 'today') {
        // Hourly breakdown for today
        for (let h = 0; h < 24; h++) {
          const hStart = new Date(now); hStart.setHours(h, 0, 0, 0);
          const hEnd   = new Date(now); hEnd.setHours(h, 59, 59, 999);
          const r = await SaleRecord.aggregate([
            { $match: { createdAt: { $gte: hStart, $lte: hEnd } } },
            { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }
          ]);
          if (r[0]?.revenue > 0) points.push({ date: `${h}:00`, revenue: r[0]?.revenue || 0, profit: r[0]?.profit || 0 });
        }
      } else if (periodKey === 'week') {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now); d.setDate(d.getDate() - i);
          const dStart = new Date(d); dStart.setHours(0,0,0,0);
          const dEnd   = new Date(d); dEnd.setHours(23,59,59,999);
          const r = await SaleRecord.aggregate([
            { $match: { createdAt: { $gte: dStart, $lte: dEnd } } },
            { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }
          ]);
          points.push({ date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }), revenue: r[0]?.revenue || 0, profit: r[0]?.profit || 0 });
        }
      } else if (periodKey === 'month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const dStart = new Date(now.getFullYear(), now.getMonth(), d, 0, 0, 0);
          const dEnd   = new Date(now.getFullYear(), now.getMonth(), d, 23, 59, 59);
          const r = await SaleRecord.aggregate([
            { $match: { createdAt: { $gte: dStart, $lte: dEnd } } },
            { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }
          ]);
          points.push({ date: `${d}`, revenue: r[0]?.revenue || 0, profit: r[0]?.profit || 0 });
        }
      } else {
        // All time — monthly breakdown for last 12 months
        for (let m = 11; m >= 0; m--) {
          const mStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
          const mEnd   = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59);
          const r = await SaleRecord.aggregate([
            { $match: { createdAt: { $gte: mStart, $lte: mEnd } } },
            { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }
          ]);
          points.push({ date: mStart.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), revenue: r[0]?.revenue || 0, profit: r[0]?.profit || 0 });
        }
      }
      return points;
    };

    const chartData = await buildChartData('week'); // default

    const lowInv = await ProductInventory.find({ stock: { $gt: 0, $lte: 5 } }).populate('product', 'name category');
    const lowStock = lowInv.map(inv => ({ name: inv.product?.name, stock: inv.stock, category: inv.product?.category }));
    const outOfStock = await ProductInventory.countDocuments({ stock: 0 });
    const totalProducts = await Product.countDocuments({ isActive: true });

    res.json({ today, week, month, allTime, topProducts, chartData, inventory: { lowStock, outOfStock, totalProducts } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/admin/chart-data?period=today|week|month|allTime
router.get('/chart-data', requireAdmin, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    const now = new Date();
    const points = [];

    if (period === 'today') {
      for (let h = 0; h < 24; h++) {
        const hStart = new Date(now); hStart.setHours(h, 0, 0, 0);
        const hEnd   = new Date(now); hEnd.setHours(h, 59, 59, 999);
        const r = await SaleRecord.aggregate([
          { $match: { createdAt: { $gte: hStart, $lte: hEnd } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }
        ]);
        points.push({ date: `${h}:00`, revenue: r[0]?.revenue || 0, profit: r[0]?.profit || 0 });
      }
    } else if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        const dStart = new Date(d); dStart.setHours(0,0,0,0);
        const dEnd   = new Date(d); dEnd.setHours(23,59,59,999);
        const r = await SaleRecord.aggregate([
          { $match: { createdAt: { $gte: dStart, $lte: dEnd } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }
        ]);
        points.push({ date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }), revenue: r[0]?.revenue || 0, profit: r[0]?.profit || 0 });
      }
    } else if (period === 'month') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dStart = new Date(now.getFullYear(), now.getMonth(), d, 0, 0, 0);
        const dEnd   = new Date(now.getFullYear(), now.getMonth(), d, 23, 59, 59);
        const r = await SaleRecord.aggregate([
          { $match: { createdAt: { $gte: dStart, $lte: dEnd } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }
        ]);
        points.push({ date: `${d}`, revenue: r[0]?.revenue || 0, profit: r[0]?.profit || 0 });
      }
    } else {
      for (let m = 11; m >= 0; m--) {
        const mStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const mEnd   = new Date(now.getFullYear(), now.getMonth() - m + 1, 0, 23, 59, 59);
        const r = await SaleRecord.aggregate([
          { $match: { createdAt: { $gte: mStart, $lte: mEnd } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, profit: { $sum: '$totalProfit' } } }
        ]);
        points.push({ date: mStart.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), revenue: r[0]?.revenue || 0, profit: r[0]?.profit || 0 });
      }
    }
    res.json(points);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── SALES RECORDS ────────────────────────────────────────────
router.get('/sales', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortDir = 'desc', dateFrom, dateTo, period } = req.query;
    const parsedLimit = parseInt(limit);
    const parsedPage  = parseInt(page);

    // Date filter
    let dateMatch = {};
    if (period === 'today') {
      const s = new Date(); s.setHours(0,0,0,0);
      const e = new Date(); e.setHours(23,59,59,999);
      dateMatch = { createdAt: { $gte: s, $lte: e } };
    } else if (period === 'week') {
      const s = new Date(); s.setDate(s.getDate() - s.getDay() + 1); s.setHours(0,0,0,0);
      dateMatch = { createdAt: { $gte: s } };
    } else if (period === 'month') {
      const s = new Date(); s.setDate(1); s.setHours(0,0,0,0);
      dateMatch = { createdAt: { $gte: s } };
    } else if (dateFrom || dateTo) {
      dateMatch.createdAt = {};
      if (dateFrom) dateMatch.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   { const e = new Date(dateTo); e.setHours(23,59,59,999); dateMatch.createdAt.$lte = e; }
    }

    // Sort
    const sortField = ['totalAmount','totalProfit','totalCost','createdAt'].includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = sortDir === 'asc' ? 1 : -1;

    const sales = await SaleRecord.find(dateMatch)
      .sort({ [sortField]: sortOrder })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);
    const total = await SaleRecord.countDocuments(dateMatch);
    res.json({ sales, total, page: parsedPage, pages: Math.ceil(total / parsedLimit), limit: parsedLimit });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/sales/:id', requireAdmin, async (req, res) => {
  const session = await SaleRecord.startSession();
  session.startTransaction();
  try {
    const sale = await SaleRecord.findById(req.params.id).session(session);
    if (!sale) { await session.abortTransaction(); return res.status(404).json({ message: 'Sale not found' }); }
    for (const item of sale.items) {
      const inv = await ProductInventory.findOne({ product: item.product }).session(session);
      if (inv) { inv.stock += item.quantity; await inv.save({ session }); }
      await Product.findByIdAndUpdate(item.product, { $inc: { totalSold: -item.quantity } }, { session });
    }
    await SaleRecord.findByIdAndDelete(req.params.id, { session });
    await session.commitTransaction();
    res.json({ message: 'Sale record deleted and stock restored' });
  } catch (err) {
    await session.abortTransaction();
    res.status(500).json({ message: err.message });
  } finally { session.endSession(); }
});

// ─── EXPORT ──────────────────────────────────────────────────
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { type, format = 'json', period, dateFrom, dateTo } = req.query;

    let data = [];

    if (type === 'products') {
      const products = await Product.find().sort({ createdAt: -1 });
      const ids = products.map(p => p._id);
      const inventories = await ProductInventory.find({ product: { $in: ids } });
      const invMap = {};
      inventories.forEach(inv => { invMap[inv.product.toString()] = inv; });
      data = products.map(p => {
        const inv = invMap[p._id.toString()];
        return {
          id: p._id, productId: p.productId, name: p.name, category: p.category,
          sellingPrice: p.sellingPrice, costPrice: inv?.costPrice ?? 0,
          marketPrice: p.marketPrice || '', stock: inv?.stock ?? 0,
          totalSold: p.totalSold, isActive: p.isActive, isPinned: p.isPinned,
          tags: (p.tags || []).join(', '), adminNotes: p.adminNotes,
          createdAt: p.createdAt,
        };
      });
    } else if (type === 'sales') {
      let dateMatch = {};
      if (period === 'today') {
        const s = new Date(); s.setHours(0,0,0,0);
        const e = new Date(); e.setHours(23,59,59,999);
        dateMatch = { createdAt: { $gte: s, $lte: e } };
      } else if (period === 'week') {
        const s = new Date(); s.setDate(s.getDate() - s.getDay() + 1); s.setHours(0,0,0,0);
        dateMatch = { createdAt: { $gte: s } };
      } else if (period === 'month') {
        const s = new Date(); s.setDate(1); s.setHours(0,0,0,0);
        dateMatch = { createdAt: { $gte: s } };
      } else if (dateFrom || dateTo) {
        dateMatch.createdAt = {};
        if (dateFrom) dateMatch.createdAt.$gte = new Date(dateFrom);
        if (dateTo)   { const e = new Date(dateTo); e.setHours(23,59,59,999); dateMatch.createdAt.$lte = e; }
      }
      const sales = await SaleRecord.find(dateMatch).sort({ createdAt: -1 });
      data = sales.flatMap(s =>
        s.items.map(item => ({
          saleId: s._id, date: s.createdAt, soldBy: s.soldBy, note: s.note,
          product: item.productName, quantity: item.quantity,
          sellingPrice: item.sellingPrice, costPrice: item.costPrice,
          subtotal: item.subtotal, profit: item.profit,
          saleTotal: s.totalAmount, saleProfit: s.totalProfit,
        }))
      );
    }

    if (format === 'csv') {
      if (!data.length) { res.setHeader('Content-Type', 'text/csv'); return res.send('No data'); }
      const headers = Object.keys(data[0]);
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => {
          const val = row[h] ?? '';
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(','))
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export.csv"`);
      return res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${type}_export.json"`);
      return res.send(JSON.stringify(data, null, 2));
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── PRODUCT CRUD ─────────────────────────────────────────────
router.get('/products', requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(search.trim(), 'i')] } }
      ];
    }
    const products = await Product.find(query).sort({ isPinned: -1, createdAt: -1 });
    const ids = products.map(p => p._id);
    const inventories = await ProductInventory.find({ product: { $in: ids } });
    const invMap = {};
    inventories.forEach(inv => { invMap[inv.product.toString()] = inv; });
    const result = products.map(p => {
      const obj = p.toObject();
      const inv = invMap[p._id.toString()];
      obj.stock = inv?.stock ?? 0;
      obj.costPrice = inv?.costPrice ?? 0;
      obj.inventoryId = inv?._id;
      return obj;
    });
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/products', requireAdmin, async (req, res) => {
  try {
    const { stock = 0, costPrice = 0, ...productData } = req.body;
    const product = new Product(productData);
    await product.save();
    await ProductInventory.create({ product: product._id, stock, costPrice });
    const obj = product.toObject();
    obj.stock = stock; obj.costPrice = costPrice;
    res.status(201).json(obj);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/products/:id', requireAdmin, async (req, res) => {
  try {
    const { stock, costPrice, inventoryId, productId, ...productData } = req.body;
    const existing = await findProductByAnyId(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    const product = await Product.findByIdAndUpdate(existing._id, productData, { new: true, runValidators: true });
    const inv = await ProductInventory.findOneAndUpdate(
      { product: existing._id },
      { stock: stock ?? 0, costPrice: costPrice ?? 0 },
      { new: true, upsert: true }
    );
    const obj = product.toObject();
    obj.stock = inv.stock; obj.costPrice = inv.costPrice;
    res.json(obj);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/products/:id', requireAdmin, async (req, res) => {
  try {
    const existing = await findProductByAnyId(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    const product = await Product.findByIdAndUpdate(existing._id, { isActive: false }, { new: true });
    res.json({ message: 'Product deactivated', product });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/products/:id/permanent', requireAdmin, async (req, res) => {
  try {
    const existing = await findProductByAnyId(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Product not found' });
    await Product.findByIdAndDelete(existing._id);
    await ProductInventory.deleteOne({ product: existing._id });
    res.json({ message: 'Product permanently deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ─── QNA (admin full CRUD) ────────────────────────────────────
router.get('/qna', requireAdmin, async (req, res) => {
  try {
    const items = await QnA.find().sort({ order: 1, createdAt: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/qna', requireAdmin, async (req, res) => {
  try {
    const item = new QnA(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/qna/:id', requireAdmin, async (req, res) => {
  try {
    const item = await QnA.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/qna/:id', requireAdmin, async (req, res) => {
  try {
    await QnA.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
