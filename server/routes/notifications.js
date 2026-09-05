import { Router } from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Get my notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('actor', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark all as read
router.post('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark one as read
router.post('/:id/read', protect, async (req, res) => {
  try {
    await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete one
router.delete('/:id', protect, async (req, res) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clear all
router.delete('/', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;