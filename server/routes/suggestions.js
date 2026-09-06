import { Router } from 'express';
import Suggestion from '../models/Suggestion.js';
import { protect } from '../middleware/auth.js';
import { sendIdeaMail, isEmailConfigured } from '../utils/email.js';

const router = Router();

const isAdmin = (req) => process.env.ADMIN_EMAIL && req.user.email === process.env.ADMIN_EMAIL.trim().toLowerCase();

// Submit an idea (emails the admin inbox too)
router.post('/', protect, async (req, res) => {
  try {
    const { category, idea } = req.body;
    if (!idea || !String(idea).trim()) {
      return res.status(400).json({ success: false, error: 'Please write your idea first' });
    }
    const suggestion = await Suggestion.create({
      user: req.user._id,
      category: category || 'Feature',
      idea: String(idea).trim(),
    });

    const emailed = await sendIdeaMail({
      fromName: req.user.name,
      fromEmail: req.user.email,
      category: category || 'Feature',
      idea: String(idea).trim(),
    });

    const populated = await suggestion.populate('user', 'name avatar');

    res.status(201).json({
      success: true,
      suggestion: populated,
      emailed,
      emailConfigured: isEmailConfigured(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List ideas — admins see everything, regular users see their own
router.get('/', protect, async (req, res) => {
  try {
    const admin = isAdmin(req);
    const filter = admin ? {} : { user: req.user._id };
    const suggestions = await Suggestion.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('user', 'name avatar');
    res.json({ success: true, suggestions, isAdmin: admin });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update idea status (admins only)
router.patch('/:id', protect, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ success: false, error: 'Only the app owner can update idea status' });
    }
    const { status } = req.body;
    if (!status || !['new', 'in_review', 'shipped', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('user', 'name avatar');
    if (!suggestion) {
      return res.status(404).json({ success: false, error: 'Idea not found' });
    }
    res.json({ success: true, suggestion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;