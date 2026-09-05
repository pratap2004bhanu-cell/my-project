import { Router } from 'express';
import Report from '../models/Report.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

// My reports (empty state detection + for showing report history)
router.get('/me', async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .populate('reported', 'name avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit a report
router.post('/', async (req, res) => {
  try {
    const { reported, type, details } = req.body;
    if (!reported || !type) {
      return res.status(400).json({ success: false, error: 'reported and type are required' });
    }
    if (reported === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot report yourself' });
    }
    const report = await Report.create({ reporter: req.user._id, reported, type, details: details || '' });
    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
