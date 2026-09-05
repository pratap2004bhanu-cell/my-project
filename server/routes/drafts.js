import { Router } from 'express';
import Draft from '../models/Draft.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// Get all my drafts
router.get('/', async (req, res) => {
  try {
    const drafts = await Draft.find({ owner: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, drafts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single draft
router.get('/:id', async (req, res) => {
  try {
    const draft = await Draft.findOne({ _id: req.params.id, owner: req.user._id });
    if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
    res.json({ success: true, draft });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create draft
router.post('/', async (req, res) => {
  try {
    const draft = await Draft.create({ owner: req.user._id, data: req.body.data || {} });
    res.status(201).json({ success: true, draft });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update draft
router.put('/:id', async (req, res) => {
  try {
    const draft = await Draft.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { data: req.body.data || {} },
      { new: true, runValidators: true }
    );
    if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
    res.json({ success: true, draft });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete draft
router.delete('/:id', async (req, res) => {
  try {
    const draft = await Draft.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
