import { Router } from 'express';
import multer from 'multer';
import Message from '../models/Message.js';
import { protect } from '../middleware/auth.js';
import { notify } from '../utils/notify.js';
import { storeFile } from '../config/gridfs.js';

const router = Router();

const chatUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Upload a chat attachment (any file type, max 10MB) -> stored in MongoDB GridFS
router.post('/upload', protect, (req, res) => {
  chatUpload.single('file')(req, res, async (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 10MB)' : err.message;
      return res.status(400).json({ success: false, error: msg });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    try {
      const id = await storeFile({
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
      });
      res.json({
        success: true,
        url: `/uploads/${id}`,
        name: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      });
    } catch (e) {
      console.error('Upload failed:', e);
      res.status(500).json({ success: false, error: 'Upload failed' });
    }
  });
});

// Get conversations list
router.get('/conversations', protect, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      { $match: { $or: [{ sender: req.user._id }, { receiver: req.user._id }] } },
      { $sort: { createdAt: -1 } },
      { $group: {
        _id: {
          $cond: [{ $eq: ['$sender', req.user._id] }, '$receiver', '$sender'],
        },
        lastMessage: { $first: '$$ROOT' },
        unread: { $sum: { $cond: [{ $and: [{ $eq: ['$receiver', req.user._id] }, { $eq: ['$read', false] }] }, 1, 0] } },
      }},
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 1, lastMessage: 1, unread: 1, 'user.name': 1, 'user.avatar': 1 } },
    ]);

    res.json({ success: true, conversations: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get messages with a user
router.get('/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.user._id },
      ],
    })
      .populate('sender', 'name avatar')
      .populate('receiver', 'name avatar')
      .sort({ createdAt: 1 });

    // Mark as read
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get activity group messages
router.get('/activity/:activityId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ activity: req.params.activityId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get community group messages
router.get('/community/:communityId', protect, async (req, res) => {
  try {
    const messages = await Message.find({ community: req.params.communityId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send community message (REST fallback)
router.post('/community/:communityId', protect, async (req, res) => {
  try {
    const message = await Message.create({
      sender: req.user._id,
      community: req.params.communityId,
      content: req.body.content || '',
      attachment: req.body.attachment,
    });

    const populated = await message.populate('sender', 'name avatar');
    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send message (REST fallback)
router.post('/', protect, async (req, res) => {
  try {
    const message = await Message.create({
      sender: req.user._id,
      receiver: req.body.receiver,
      activity: req.body.activity,
      content: req.body.content || '',
      attachment: req.body.attachment,
    });

    const populated = await message.populate('sender', 'name avatar');
    res.status(201).json({ success: true, message: populated });

    if (req.body.receiver && req.body.receiver !== req.user._id.toString()) {
      const io = req.app.get('io');
      await notify(io, {
        recipient: req.body.receiver,
        actor: req.user._id,
        type: 'message',
        text: 'sent you a message',
        link: `/chat/${req.user._id}`,
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;