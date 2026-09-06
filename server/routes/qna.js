import express from 'express';
import QnA from '../models/QnA.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/qna — public, visible only
router.get('/', async (req, res) => {
  try {
    const items = await QnA.find({ isVisible: true }).sort({ order: 1, createdAt: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET /api/qna/all — admin, all including hidden
router.get('/all', requireAdmin, async (req, res) => {
  try {
    const items = await QnA.find().sort({ order: 1, createdAt: 1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST /api/qna — admin create
router.post('/', requireAdmin, async (req, res) => {
  try {
    const item = new QnA(req.body);
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// PUT /api/qna/:id — admin update
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await QnA.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(400).json({ message: err.message }); }
});

// DELETE /api/qna/:id — admin delete
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await QnA.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

export default router;
