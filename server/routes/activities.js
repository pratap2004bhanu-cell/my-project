import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { notify } from '../utils/notify.js';
import { refreshActivityStatuses, scheduledAt } from '../utils/lifecycle.js';
import { filterValidImages } from '../utils/uploads.js';

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

// Access control: public -> everyone; friends -> creator + their friends + participants;
// private -> creator + participants only.
const accessFilter = (myId, friendIds) => ({
  $or: [
    { activityType: 'public' },
    { activityType: { $exists: false } },
    { activityType: 'friends', creator: { $in: [myId, ...friendIds] } },
    { activityType: 'private', creator: myId },
    { activityType: 'private', 'participants.user': myId },
  ],
});

const canViewActivity = (activity, myId, friendIds) => {
  if (!activity) return false;
  const creatorId = String(activity.creator?._id || activity.creator);
  if (activity.activityType === 'friends') {
    return creatorId === myId || friendIds.includes(creatorId) ||
      (activity.participants || []).some((p) => String(p.user) === String(myId));
  }
  if (activity.activityType === 'private') {
    return creatorId === myId ||
      (activity.participants || []).some((p) => String(p.user) === String(myId));
  }
  return true;
};

const isMember = (activity, myId) =>
  String(activity.creator?._id || activity.creator) === String(myId) ||
  joinedMembers(activity).some((p) => String(p.user) === String(myId));

// Participants that actually joined (excludes pending requests)
const joinedMembers = (activity) =>
  (activity.participants || []).filter((p) => p.status !== 'pending' && p.status !== 'left');

const isHost = (activity, myId) => String(activity.creator?._id || activity.creator) === String(myId);

// Bump activity-engagement stats (streak + joined count) for a user
const bumpEngagement = async (userId) => {
  const u = await User.findById(userId);
  if (!u) return;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = u.stats.lastActivityAt ? new Date(u.stats.lastActivityAt) : null;
  if (last) {
    last.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today - last) / 86400000);
    if (diffDays === 1) u.stats.streak = (u.stats.streak || 0) + 1;
    else if (diffDays > 1) u.stats.streak = 1;
  } else {
    u.stats.streak = 1;
  }
  u.stats.lastActivityAt = new Date();
  u.stats.activitiesJoined = (u.stats.activitiesJoined || 0) + 1;
  await u.save();
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
      query['participants.status'] = 'joined';
    }

    if (authored === '1') {
      query.creator = req.user._id;
    }

    const near = query._nearby;
    delete query._nearby;

    const me = await User.findById(req.user._id).select('friends savedActivities');
    const friendIds = (me.friends || []).map(String);
    const myId = req.user._id.toString();
    if (!query.$or) query.$or = accessFilter(myId, friendIds).$or;

    const activities = await Activity.find(query)
      .populate('creator', 'name avatar')
      .populate('participants.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    const savedIds = new Set((me.savedActivities || []).map((s) => s.activity.toString()));
    const savedAtMap = {};
    (me.savedActivities || []).forEach((s) => { savedAtMap[s.activity.toString()] = s.savedAt; });

    let list = activities.map((a) => {
      const plain = a.toObject ? a.toObject() : a;
      plain.saved = savedIds.has(a._id.toString());
      if (plain.saved && savedAtMap[a._id.toString()]) plain.savedAt = savedAtMap[a._id.toString()];
      plain.joined = (a.participants || []).some((p) => {
        const uid = p.user && typeof p.user === 'object' ? p.user._id : p.user;
        return uid && uid.toString() === myId && p.status !== 'pending';
      });
      plain.requested = (a.participants || []).some((p) => {
        const uid = p.user && typeof p.user === 'object' ? p.user._id : p.user;
        return uid && uid.toString() === myId && p.status === 'pending';
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

    const me = await User.findById(req.user._id).select('friends savedActivities');
    const friendIds = (me.friends || []).map(String);
    if (!canViewActivity(activity, req.user._id.toString(), friendIds)) {
      return res.status(403).json({ success: false, error: 'This activity is not open to you' });
    }

    const savedIds = new Set((me.savedActivities || []).map((s) => s.activity.toString()));
    const myId = req.user._id.toString();

    const plain = activity.toObject ? activity.toObject() : activity;
    plain.saved = savedIds.has(activity._id.toString());
    plain.joined = (activity.participants || []).some((p) => {
      const uid = p.user && typeof p.user === 'object' ? p.user._id : p.user;
      return uid && uid.toString() === myId && p.status !== 'pending';
    });
    plain.requested = (activity.participants || []).some((p) => {
      const uid = p.user && typeof p.user === 'object' ? p.user._id : p.user;
      return uid && uid.toString() === myId && p.status === 'pending';
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
      approvalRequired: req.body.approvalRequired === true,
      requirements: typeof req.body.requirements === 'string' ? req.body.requirements.trim() : '',
      location: location && Array.isArray(location.coordinates) 
        ? location 
        : { type: 'Point', coordinates: [0, 0], address: location?.address || '' },
    });

    await bumpEngagement(req.user._id);

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

    const allowed = ['title', 'description', 'category', 'emoji', 'date', 'time', 'location', 'maxParticipants', 'activityType', 'recurring', 'requirements'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }
    if (req.body.approvalRequired !== undefined) patch.approvalRequired = req.body.approvalRequired === true;

    const updated = await Activity.findByIdAndUpdate(req.params.id, patch, { new: true, runValidators: true })
      .populate('creator', 'name avatar');

    const io = req.app.get('io');
    if (io) io.to('activity:' + req.params.id).emit('activity:updated', { id: req.params.id });

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

    const me = await User.findById(req.user._id).select('friends');
    const friendIds = (me.friends || []).map(String);
    const myId = req.user._id.toString();
    const creatorId = String(activity.creator);
    const existing = activity.participants.find((p) => p.user.toString() === myId);
    const requesting = activity.approvalRequired && activity.creator.toString() !== myId;

    const canJoin =
      !activity.activityType || activity.activityType === 'public' ||
      requesting ||
      (activity.activityType === 'friends' && (creatorId === myId || friendIds.includes(creatorId))) ||
      (activity.activityType === 'private' && !!existing);

    if (!canJoin) {
      return res.status(403).json({ success: false, error: 'This activity is not open to join' });
    }

    if (existing && existing.status !== 'left') {
      return res.status(400).json({
        success: false,
        error: existing.status === 'pending' ? 'Request already sent — waiting for host approval' : 'Already joined',
      });
    }

    if (joinedMembers(activity).length >= activity.maxParticipants) {
      return res.status(400).json({ success: false, error: 'Activity is full' });
    }

    // Activities that require host approval: join as a pending request
    if (activity.approvalRequired && activity.creator.toString() !== myId) {
      if (existing) {
        existing.status = 'pending';
      } else {
        activity.participants.push({ user: req.user._id, status: 'pending' });
      }
      await activity.save();

      const io = req.app.get('io');
      await notify(io, {
        recipient: activity.creator,
        actor: req.user._id,
        type: 'activity',
        text: `requested to join "${activity.title}"`,
        activity: activity._id,
        link: `/activities/${activity._id}`,
      });

      return res.json({ success: true, activity });
    }

    if (existing) {
      existing.status = 'joined';
    } else {
      activity.participants.push({ user: req.user._id, status: 'joined' });
    }
    await activity.save();

    await bumpEngagement(req.user._id);

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

// Approve a pending join request (host only)
router.post('/:id/approve/:userId', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, error: 'Activity not found' });
    if (!isHost(activity, req.user._id.toString())) return res.status(403).json({ success: false, error: 'Only the host can approve requests' });

    const entry = activity.participants.find((p) =>
      p.user.toString() === req.params.userId.toString() && p.status === 'pending'
    );
    if (!entry) return res.status(400).json({ success: false, error: 'No pending request from this user' });
    if (joinedMembers(activity).length >= activity.maxParticipants) {
      return res.status(400).json({ success: false, error: 'Activity is full' });
    }

    entry.status = 'joined';
    await activity.save();
    await bumpEngagement(req.params.userId);

    const io = req.app.get('io');
    await notify(io, {
      recipient: req.params.userId,
      actor: req.user._id,
      type: 'activity',
      text: `approved your request to join "${activity.title}"`,
      activity: activity._id,
      link: `/activities/${activity._id}`,
    });
    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reject a pending join request (host only)
router.post('/:id/reject/:userId', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, error: 'Activity not found' });
    if (!isHost(activity, req.user._id.toString())) return res.status(403).json({ success: false, error: 'Only the host can reject requests' });

    const idx = activity.participants.findIndex((p) =>
      p.user.toString() === req.params.userId.toString() && p.status === 'pending'
    );
    if (idx === -1) return res.status(400).json({ success: false, error: 'No pending request from this user' });

    const [removed] = activity.participants.splice(idx, 1);
    await activity.save();

    const io = req.app.get('io');
    await notify(io, {
      recipient: req.params.userId,
      actor: req.user._id,
      type: 'activity',
      text: `did not approve your request to join "${activity.title}"`,
      activity: activity._id,
      link: `/activities/${activity._id}`,
    });
    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Cancel an activity (host only)
router.post('/:id/cancel', protect, async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, error: 'Activity not found' });
    if (!isHost(activity, req.user._id.toString())) return res.status(403).json({ success: false, error: 'Not authorized' });
    if (activity.status === 'cancelled') return res.status(400).json({ success: false, error: 'Activity is already cancelled' });

    activity.status = 'cancelled';
    await activity.save();

    const io = req.app.get('io');
    const userIds = [activity.creator, ...joinedMembers(activity).map((p) => p.user)];
    for (const uid of new Set(userIds.map(String))) {
      await notify(io, {
        recipient: uid,
        actor: req.user._id,
        type: 'activity',
        text: `cancelled "${activity.title}"`,
        activity: activity._id,
        link: `/activities/${activity._id}`,
      });
    }
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
    if (!isMember(activity, req.user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Join the activity first' });
    }

    const alreadyCheckedIn = activity.checkIns.some(
      (c) => c.user.toString() === req.user._id.toString()
    );
    if (alreadyCheckedIn) {
      return res.status(400).json({ success: false, error: 'Already checked in' });
    }

    // Check-in is only allowed on the activity's calendar day
    const scheduled = scheduledAt(activity);
    const sameDay = scheduled.toDateString() === new Date().toDateString();
    if (!sameDay) {
      const label = scheduled.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
      return res.status(400).json({ success: false, error: `Check-in opens on the day of the activity (${label})` });
    }

    // If both the activity and the user report coordinates, require proximity (<= 2km)
    const venueCoords = activity.location?.coordinates;
    const userCoords = req.body.location?.coordinates;
    if (venueCoords && Array.isArray(venueCoords) && venueCoords.length === 2
      && userCoords && Array.isArray(userCoords) && userCoords.length === 2) {
      const dist = haversineMeters(userCoords[1], userCoords[0], venueCoords[1], venueCoords[0]);
      if (dist > 2000) {
        return res.status(400).json({ success: false, error: 'You seem far from the activity venue. Check in only works nearby.' });
      }
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
    if (!isMember(activity, req.user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Join the activity first' });
    }
    const amount = Number(req.body.amount);
    const description = typeof req.body.description === 'string' ? req.body.description.trim() : '';
    if (!description) {
      return res.status(400).json({ success: false, error: 'Expense description is required' });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Expense amount must be greater than zero' });
    }

    activity.expenses.push({
      description,
      amount,
      paidBy: req.user._id,
      splitAmong: Array.isArray(req.body.splitAmong) ? req.body.splitAmong : [],
    });
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
    if (!isMember(activity, req.user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Join the activity first' });
    }
    const rating = Math.min(5, Math.max(1, Number(req.body.rating) || 0));
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : '';

    activity.feedback.push({ rating, comment, user: req.user._id });
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
    if (!isMember(activity, req.user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Only participants can add photos' });
    }
    const valid = filterValidImages(req.files || []);
    if (valid.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid image files uploaded' });
    }
    const urls = valid.map((f) => `/uploads/${f.filename}`);
    activity.photos.push(...urls);
    await activity.save();
    res.json({ success: true, photos: activity.photos });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;