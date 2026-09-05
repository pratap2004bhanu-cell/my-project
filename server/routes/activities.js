import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { notify } from '../utils/notify.js';
import { refreshActivityStatuses } from '../utils/lifecycle.js';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `photo-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// Distance in meters between two lon/lat pairs (GeoJSON order: lon, lat)
const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Get all activities (with filters)
router.get('/', protect, async (req, res) => {
  try {
    await refreshActivityStatuses(req.app.get('io'));
    const { category, status, nearby, lat, lng, radius = 10, saved, joined, authored } = req.query;
    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;

    if (nearby && lat && lng) {
      query._nearby = { lat: parseFloat(lat), lng: parseFloat(lng), radius: parseFloat(radius) || 10 };
    }

    if (saved === '1') {
      const me = await User.findById(req.user._id).select('savedActivities');
      const ids = (me.savedActivities || []).map((s) => s.activity);
      query._id = { $in: ids };
    }

    if (joined === '1') {
      query['participants.user'] = req.user._id;
    }

    if (authored === '1') {
      query.creator = req.user._id;
    }

    const near = query._nearby;
    delete query._nearby;

    const activities = await Activity.find(query)
      .populate('creator', 'name avatar')
      .populate('participants.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    const me = await User.findById(req.user._id).select('savedActivities');
    const savedIds = new Set((me.savedActivities || []).map((s) => s.activity.toString()));
    const myId = req.user._id.toString();

    let list = activities.map((a) => {
      const plain = a.toObject ? a.toObject() : a;
      plain.saved = savedIds.has(a._id.toString());
      plain.joined = (a.participants || []).some((p) => {
        const uid = p.user && typeof p.user === 'object' ? p.user._id : p.user;
        return uid && uid.toString() === myId;
      });
      plain.isCreator = a.creator && a.creator._id ? a.creator._id.toString() === myId : a.creator?.toString() === myId;
      return plain;
    });

    if (near) {
      // Haversine distance from the user; keep address-only activities but push them to the end
      const located = [];
      const unlocated = [];
      for (const a of list) {
        const c = a.location?.coordinates;
        if (c && Array.isArray(c) && c.length === 2) {
          a.distance = haversineMeters(near.lat, near.lng, c[1], c[0]) / 1000;
          located.push(a);
        } else {
          unlocated.push(a);
        }
      }
      const within = located.filter((a) => a.distance <= near.radius * 1000);
      within.sort((x, y) => x.distance - y.distance);
      list = [...within, ...unlocated];
    }

    res.json({ success: true, activities: list });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single activity
router.get('/:id', protect, async (req, res) => {
  try {
    await refreshActivityStatuses(req.app.get('io'));
    const activity = await Activity.findById(req.params.id)
      .populate('creator', 'name avatar bio')
      .populate('participants.user', 'name avatar')
      .populate('checkIns.user', 'name avatar')
      .populate('feedback.user', 'name avatar')
      .populate('expenses.paidBy', 'name avatar')
      .populate('expenses.splitAmong', 'name avatar');

    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    const me = await User.findById(req.user._id).select('savedActivities');
    const savedIds = new Set((me.savedActivities || []).map((s) => s.activity.toString()));
    const myId = req.user._id.toString();

    const plain = activity.toObject ? activity.toObject() : activity;
    plain.saved = savedIds.has(activity._id.toString());
    plain.joined = (activity.participants || []).some((p) => {
      const uid = p.user && typeof p.user === 'object' ? p.user._id : p.user;
      return uid && uid.toString() === myId;
    });
    plain.isCreator = activity.creator && activity.creator._id ? activity.creator._id.toString() === myId : activity.creator?.toString() === myId;

    res.json({ success: true, activity: plain });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create activity
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, category, date, time, location } = req.body;
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Title must be at least 3 characters' });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ success: false, error: 'A category is required' });
    }
    if (!date || Number.isNaN(Date.parse(date))) {
      return res.status(400).json({ success: false, error: 'A valid date is required' });
    }
    if (!time || typeof time !== 'string') {
      return res.status(400).json({ success: false, error: 'A time is required' });
    }
    const activity = await Activity.create({
      ...req.body,
      title: title.trim(),
      description: typeof description === 'string' ? description : '',
      creator: req.user._id,
      participants: [{ user: req.user._id, status: 'joined' }],
      location: location && Array.isArray(location.coordinates) 
        ? location 
        : { type: 'Point', coordinates: [0, 0], address: location?.address || '' },
    });

    const creator = await User.findById(req.user._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = creator.stats.lastActivityAt ? new Date(creator.stats.lastActivityAt) : null;
    if (last) {
      last.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today - last) / 86400000);
      if (diffDays === 1) creator.stats.streak = (creator.stats.streak || 0) + 1;
      else if (diffDays > 1) creator.stats.streak = 1;
    } else {
      creator.stats.streak = 1;
    }
    creator.stats.lastActivityAt = new Date();
    creator.stats.activitiesJoined = (creator.stats.activitiesJoined || 0) + 1;
    await creator.save();

    const populated = await activity.populate('creator', 'name avatar');
    res.status(201).json({ success: true, activity: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update activity
router.put('/:id', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    if (activity.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const updated = await Activity.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('creator', 'name avatar');

    res.json({ success: true, activity: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join activity
router.post('/:id/join', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    const alreadyJoined = activity.participants.some(
      (p) => p.user.toString() === req.user._id.toString()
    );
    if (alreadyJoined) {
      return res.status(400).json({ success: false, error: 'Already joined' });
    }

    if (activity.participants.length >= activity.maxParticipants) {
      return res.status(400).json({ success: false, error: 'Activity is full' });
    }

    activity.participants.push({ user: req.user._id, status: 'joined' });
    await activity.save();

    const joiner = await User.findById(req.user._id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last = joiner.stats.lastActivityAt ? new Date(joiner.stats.lastActivityAt) : null;
    if (last) {
      last.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today - last) / 86400000);
      if (diffDays === 1) joiner.stats.streak = (joiner.stats.streak || 0) + 1;
      else if (diffDays > 1) joiner.stats.streak = 1;
    } else {
      joiner.stats.streak = 1;
    }
    joiner.stats.lastActivityAt = new Date();
    joiner.stats.activitiesJoined = (joiner.stats.activitiesJoined || 0) + 1;
    await joiner.save();

    // Notify creator (unless creator is joining their own activity)
    if (activity.creator.toString() !== req.user._id.toString()) {
      const io = req.app.get('io');
      await notify(io, {
        recipient: activity.creator,
        actor: req.user._id,
        type: 'activity',
        text: `joined your activity "${activity.title}"`,
        activity: activity._id,
        link: `/activities/${activity._id}`,
      });
    }

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leave activity
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    activity.participants = activity.participants.filter(
      (p) => p.user.toString() !== req.user._id.toString()
    );
    await activity.save();

    const leaver = await User.findById(req.user._id);
    leaver.stats.activitiesJoined = Math.max(0, (leaver.stats.activitiesJoined || 0) - 1);
    await leaver.save();

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete activity (creator only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    if (activity.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    await Activity.findByIdAndDelete(req.params.id);
    const io = req.app.get('io');
    if (io) io.to('activity:' + req.params.id).emit('activity:deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save / unsave an activity
router.post('/:id/save', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }
    const me = await User.findById(req.user._id);
    const exists = me.savedActivities.some(
      (s) => s.activity.toString() === req.params.id.toString()
    );
    let saved;
    if (exists) {
      me.savedActivities = me.savedActivities.filter(
        (s) => s.activity.toString() !== req.params.id.toString()
      );
      saved = false;
    } else {
      me.savedActivities.push({ activity: req.params.id });
      saved = true;
    }
    await me.save();
    res.json({ success: true, saved });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check in to activity
router.post('/:id/checkin', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    const alreadyCheckedIn = activity.checkIns.some(
      (c) => c.user.toString() === req.user._id.toString()
    );
    if (alreadyCheckedIn) {
      return res.status(400).json({ success: false, error: 'Already checked in' });
    }

    activity.checkIns.push({ user: req.user._id, location: req.body.location });
    await activity.save();

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add expense
router.post('/:id/expenses', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    activity.expenses.push({ ...req.body, paidBy: req.user._id });
    await activity.save();

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add feedback
router.post('/:id/feedback', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, error: 'Activity not found' });
    }

    activity.feedback.push({ ...req.body, user: req.user._id });
    await activity.save();

    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload photos to an activity
router.post('/:id/photos', protect, upload.array('photos', 10), async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, error: 'Activity not found' });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }
    const urls = req.files.map((f) => `/uploads/${f.filename}`);
    activity.photos.push(...urls);
    await activity.save();
    res.json({ success: true, photos: activity.photos });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;