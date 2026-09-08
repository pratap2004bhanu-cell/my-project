import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Event from '../models/Event.js';
import EventSquad from '../models/EventSquad.js';
import EventMoment from '../models/EventMoment.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
import { protect } from '../middleware/auth.js';
import { notify } from '../utils/notify.js';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `event-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const uploadCover = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});
const uploadPhotos = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// Extensible category system (mirrored on the client in src/data/eventCategories.js)
export const EVENT_CATEGORIES = [
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'sports', label: 'Sports', emoji: '🏏' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'college', label: 'College', emoji: '🎓' },
  { id: 'technology', label: 'Technology', emoji: '💻' },
  { id: 'art', label: 'Art', emoji: '🎨' },
  { id: 'food', label: 'Food', emoji: '🍔' },
  { id: 'movies', label: 'Movies', emoji: '🎬' },
  { id: 'fitness', label: 'Fitness', emoji: '🏃' },
  { id: 'travel', label: 'Travel', emoji: '🌎' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎭' },
  { id: 'community', label: 'Community', emoji: '🤝' },
  { id: 'education', label: 'Education', emoji: '📚' },
  { id: 'other', label: 'Other', emoji: '🔥' },
];

const isAdmin = (req) =>
  process.env.ADMIN_EMAIL && req.user?.email === process.env.ADMIN_EMAIL.trim().toLowerCase();

// multer's multipart parser delivers JSON-ish fields as strings; coerce them when needed
const parseJSON = (v, fallback) => {
  if (v === null || v === undefined || v === '') return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};

const validCoords = (loc) =>
  loc?.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2 &&
  !(loc.coordinates[0] === 0 && loc.coordinates[1] === 0);

const haversineMeters = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Map event -> { status } for the current user across a set of events (cheap, no big payloads)
const myStatuses = async (ids, meId, event) => {
  const hits = await event.find({ _id: { $in: ids }, 'attendees.user': meId })
    .select({ _id: 1, 'attendees.$': 1 })
    .lean();
  const map = {};
  for (const h of hits) {
    if (h.attendees?.[0]) map[String(h._id)] = h.attendees[0].status;
  }
  return map;
};

const serializeList = (e, origin, meId, myStatus) => {
  const doc = e.toObject ? e.toObject() : e;
  const coords = doc.venue?.location?.coordinates;
  const distance = origin && validCoords(doc.venue?.location)
    ? haversineMeters(origin.lat, origin.lng, coords[1], coords[0]) / 1000
    : null;
  const going = doc.counts?.going ?? 0;
  const organizer = doc.organizer && typeof doc.organizer === 'object'
    ? { _id: doc.organizer._id, name: doc.organizer.name, avatar: doc.organizer.avatar }
    : { _id: doc.organizer, name: doc.organizerName || 'Organizer', avatar: null };
  return {
    _id: doc._id,
    title: doc.title,
    description: doc.description,
    category: doc.category,
    emoji: doc.emoji,
    coverImage: doc.coverImage,
    organizer,
    organizerName: doc.organizerName,
    date: doc.date,
    startTime: doc.startTime,
    endTime: doc.endTime,
    venue: doc.venue,
    price: doc.price,
    capacity: doc.capacity,
    interestedCount: doc.counts?.interested ?? 0,
    goingCount: going,
    myStatus,
    isOrganizer: organizer._id ? String(organizer._id) === String(meId) : false,
    remainingSpots: doc.capacity && doc.capacity > 0 ? Math.max(0, doc.capacity - going) : null,
    distance: distance == null ? (doc.distance ?? null) : Math.round(distance * 10) / 10,
    status: doc.status,
    moderationStatus: doc.moderationStatus,
    createdAt: doc.createdAt,
    counts: doc.counts || { interested: 0, going: 0 },
  };
};

const serializeDetail = (e, meId, origin) => {
  const doc = e.toObject ? e.toObject() : e;
  const coords = doc.venue?.location?.coordinates;
  const distance = origin && validCoords(doc.venue?.location)
    ? haversineMeters(origin.lat, origin.lng, coords[1], coords[0]) / 1000
    : null;
  const attendees = (doc.attendees || []).filter((a) => a.status !== 'left');
  const interestedCount = attendees.filter((a) => a.status === 'interested').length;
  const goingCount = attendees.filter((a) => a.status === 'going').length;
  const me = attendees.find((a) => String(a.user?._id || a.user) === String(meId));
  return {
    ...doc,
    distance: distance == null ? null : Math.round(distance * 10) / 10,
    interestedCount,
    goingCount,
    remainingSpots: doc.capacity && doc.capacity > 0 ? Math.max(0, doc.capacity - goingCount) : null,
    myStatus: me ? me.status : null,
    isOrganizer: String(doc.organizer?._id || doc.organizer) === String(meId),
    people: attendees.map((a) => {
      const u = a.user && typeof a.user === 'object' ? a.user : { _id: a.user, name: 'Member', avatar: null, interests: [] };
      return {
        id: u._id,
        name: u.name,
        avatar: u.avatar,
        interests: u.interests || [],
        status: a.status,
      };
    }),
  };
};

const isParticipant = (e, meId) => {
  if (String(e.organizer?._id || e.organizer) === String(meId)) return true;
  return (e.attendees || []).some(
    (a) => a.status !== 'left' && String(a.user?._id || a.user) === String(meId)
  );
};

const updateCounts = async (id) => {
  const event = await Event.findById(id);
  if (!event) return null;
  const interested = (event.attendees || []).filter((a) => a.status === 'interested').length;
  const going = (event.attendees || []).filter((a) => a.status === 'going').length;
  event.counts = { interested, going };
  await event.save();
  return event;
};

// Protected area
router.use(protect);

// Categories (shared registry)
router.get('/categories', (req, res) => {
  res.json({ success: true, categories: EVENT_CATEGORIES });
});

// Minimal moderator view (ADMIN_EMAIL only) — mirrors the suggestions route pattern
router.get('/moderation', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ success: false, error: 'Not authorized' });
    const events = await Event.find({})
      .select('-attendees')
      .populate('organizer', 'name avatar email')
      .sort({ createdAt: -1 })
      .limit(100);
    const reports = await Report.find({ event: { $exists: true }, status: 'open' })
      .populate('reporter', 'name avatar')
      .populate('reported', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, events, reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple organizer stats for My Events
router.get('/organizer/stats', async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).select('status counts stats date');
    const active = events.filter((e) => e.status === 'published');
    const squads = await EventSquad.countDocuments({ event: { $in: events.map((e) => e._id) } });
    res.json({
      success: true,
      stats: {
        total: events.length,
        upcoming: active.filter((e) => new Date(e.date) >= new Date()).length,
        published: active.length,
        cancelled: events.filter((e) => e.status === 'cancelled').length,
        interested: active.reduce((s, e) => s + (e.counts?.interested || 0), 0),
        going: active.reduce((s, e) => s + (e.counts?.going || 0), 0),
        views: active.reduce((s, e) => s + (e.stats?.views || 0), 0),
        squads,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List events with filters + pagination
router.get('/', async (req, res) => {
  try {
    const {
      page = 1, limit = 20, q, category, filter, free, mine,
      nearby, lat, lng, radius = 25, byFriends, attending,
    } = req.query;
    const meId = req.user._id.toString();
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * Math.min(50, parseInt(limit, 10) || 20);

    const match = {};
    if (mine === '1') {
      match.organizer = req.user._id;
    } else {
      match.status = 'published';
      match.moderationStatus = { $ne: 'rejected' };
    }
    if (category) match.category = category;
    if (free === '1') match['price.amount'] = 0;

    const clean = (s) => String(s || '').trim();
    const sq = clean(q);
    if (sq) {
      const rx = { $regex: sq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      match.$or = [{ title: rx }, { 'venue.name': rx }, { 'venue.address': rx }, { organizerName: rx }, { description: rx }];
    }
    const sCity = clean(req.query.city);
    if (sCity) match['venue.address'] = { $regex: sCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const dayMs = 86400000;
    if (filter === 'today') {
      match.date = { $gte: todayStart, $lt: new Date(todayStart.getTime() + dayMs) };
    } else if (filter === 'thisWeek') {
      match.date = { $gte: todayStart, $lt: new Date(todayStart.getTime() + 7 * dayMs) };
    } else if (filter === 'upcoming') {
      match.date = { $gte: todayStart };
    }

    if (attending === '1') match['attendees'] = { $elemMatch: { user: req.user._id, status: 'going' } };
    if (byFriends === '1') {
      const me = await User.findById(req.user._id).select('friends');
      const fids = (me?.friends || []).map(String);
      if (fids.length) match['attendees'] = { $elemMatch: { user: { $in: fids }, status: 'going' } };
      else match._id = { $in: [] };
    }

    const hasCoords = lat && lng;
    const origin = hasCoords ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
    const useGeoNear = nearby === '1' && origin;
    const total = await Event.countDocuments(match);

    let raw;
    if (useGeoNear) {
      const geoMatch = { ...match };
      delete geoMatch['venue.location'];
      const pipeline = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [origin.lng, origin.lat] },
            distanceField: 'geoDist',
            maxDistance: (parseFloat(radius) || 25) * 1000,
            query: geoMatch,
            spherical: true,
          },
        },
        { $sort: { geoDist: 1 } },
        { $skip: skip },
        { $limit: Math.min(50, parseInt(limit, 10) || 20) },
        { $lookup: { from: 'users', localField: 'organizer', foreignField: '_id', as: 'organizer' } },
        { $project: { attendees: 0, __v: 0 } },
      ];
      raw = await Event.aggregate(pipeline);
      raw = raw.map((e) => ({ ...e, distance: Math.round((e.geoDist / 1000) * 10) / 10, organizer: e.organizer[0] || e.organizer }));
    } else {
      const sort = filter === 'popular'
        ? { 'counts.going': -1, date: 1 }
        : (mine === '1' ? { createdAt: -1 } : { date: 1 });
      const q2 = Event.find(match)
        .select('-attendees')
        .populate('organizer', 'name avatar')
        .sort(sort)
        .skip(skip)
        .limit(Math.min(50, parseInt(limit, 10) || 20))
        .lean();
      raw = await q2;
    }

    const ids = raw.map((e) => e._id);
    const myMap = ids.length ? await myStatuses(ids, meId, Event) : {};
    const events = raw
      .filter((e) => e.moderationStatus !== 'rejected' || mine === '1')
      .map((e) => serializeList(e, origin, meId, myMap[String(e._id)] || null));

    res.json({
      success: true,
      events,
      pagination: { page: Math.max(1, parseInt(page, 10) || 1), limit: Math.min(50, parseInt(limit, 10) || 20), total },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Event detail
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name avatar bio email')
      .populate('attendees.user', 'name avatar interests');
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    if (event.moderationStatus === 'rejected' && !isAdmin(req)) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    const { lat, lng } = req.query;
    const origin = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
    Event.findByIdAndUpdate(event._id, { $inc: { 'stats.views': 1 } }).catch(() => {});
    res.json({ success: true, event: serializeDetail(event, req.user._id.toString(), origin) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create event
router.post('/', uploadCover.single('coverImage'), async (req, res) => {
  try {
    const { title, description, category, emoji, date, startTime, endTime, capacity, ageRestriction, organizerName, organizerContact, coverImage, status } = req.body;
    const venue = parseJSON(req.body.venue, null);
    const price = parseJSON(req.body.price, {});
    const vibe = parseJSON(req.body.vibe, []);
    const rules = parseJSON(req.body.rules, []);
    const schedule = parseJSON(req.body.schedule, []);
    const socialLinks = parseJSON(req.body.socialLinks, []);
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Event name must be at least 3 characters' });
    }
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ success: false, error: 'A category is required' });
    }
    if (!date || Number.isNaN(Date.parse(date))) {
      return res.status(400).json({ success: false, error: 'A valid date is required' });
    }
    if (!startTime || typeof startTime !== 'string') {
      return res.status(400).json({ success: false, error: 'A start time is required' });
    }

    const eventStatus = status === 'published' ? 'published' : 'draft';
    const loc = venue && venue.location && Array.isArray(venue.location.coordinates)
      ? { name: venue.name || '', address: venue.address || '', location: venue.location }
      : { name: venue?.name || '', address: venue?.address || '', location: { type: 'Point', coordinates: [0, 0] } };

    const event = await Event.create({
      title: title.trim(),
      description: typeof description === 'string' ? description : '',
      category,
      emoji: emoji || '🎟️',
      coverImage: req.file ? `/uploads/${req.file.filename}` : (typeof coverImage === 'string' ? coverImage : ''),
      organizer: req.user._id,
      organizerName: organizerName || req.user.name || '',
      organizerContact: organizerContact || '',
      socialLinks: Array.isArray(socialLinks) ? socialLinks : [],
      date,
      startTime,
      endTime: endTime || '',
      venue: loc,
      price: {
        amount: Number(price?.amount) || 0,
        currency: price?.currency || 'INR',
        ticketUrl: price?.ticketUrl || '',
      },
      capacity: Math.max(0, parseInt(capacity, 10) || 0),
      ageRestriction: Math.max(0, parseInt(ageRestriction, 10) || 0),
      vibe: Array.isArray(vibe) ? vibe : [],
      rules: Array.isArray(rules) ? rules : [],
      schedule: Array.isArray(schedule) ? schedule : [],
      attendees: [],
      counts: { interested: 0, going: 0 },
      status: eventStatus,
      moderationStatus: 'approved',
    });

    const populated = await event.populate('organizer', 'name avatar');
    const io = req.app.get('io');
    if (io) io.emit('event:created', { event: serializeList(populated, null, req.user._id.toString(), null) });
    res.status(201).json({ success: true, event: serializeDetail(populated, req.user._id.toString(), null) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update event (organizer or admin)
router.put('/:id', uploadCover.single('coverImage'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const canEdit = isAdmin(req) || String(event.organizer) === String(req.user._id);
    if (!canEdit) return res.status(403).json({ success: false, error: 'Not authorized' });

    const { title, description, category, emoji, date, startTime, endTime, capacity, ageRestriction, organizerName, organizerContact, status } = req.body;
    const venue = parseJSON(req.body.venue, null);
    const price = parseJSON(req.body.price, {});
    const vibe = parseJSON(req.body.vibe, []);
    const rules = parseJSON(req.body.rules, []);
    const schedule = parseJSON(req.body.schedule, []);
    const socialLinks = parseJSON(req.body.socialLinks, []);
    if (title !== undefined && (typeof title !== 'string' || title.trim().length < 3)) {
      return res.status(400).json({ success: false, error: 'Event name must be at least 3 characters' });
    }
    if (date !== undefined && Number.isNaN(Date.parse(date))) {
      return res.status(400).json({ success: false, error: 'A valid date is required' });
    }
    if (capacity !== undefined && Number(capacity) >= 0 && Number(capacity) < event.goingCount()) {
      return res.status(400).json({ success: false, error: 'Capacity cannot be lower than the number of people going' });
    }
    if (status !== undefined && !['draft', 'published', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    if (req.file) event.coverImage = `/uploads/${req.file.filename}`;
    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description;
    if (category !== undefined) event.category = category;
    if (emoji !== undefined) event.emoji = emoji;
    if (date !== undefined) event.date = date;
    if (startTime !== undefined) event.startTime = startTime;
    if (endTime !== undefined) event.endTime = endTime;
    if (venue !== undefined && venue && typeof venue === 'object') {
      event.venue = {
        name: venue.name || event.venue.name,
        address: venue.address || event.venue.address,
        location: venue.location && Array.isArray(venue.location.coordinates)
          ? venue.location
          : event.venue.location,
      };
    }
    if (price !== undefined && price && typeof price === 'object') {
      event.price = {
        amount: Number(price.amount) >= 0 ? Number(price.amount) : event.price.amount,
        currency: price.currency || event.price.currency,
        ticketUrl: price.ticketUrl !== undefined ? price.ticketUrl : event.price.ticketUrl,
      };
    }
    if (capacity !== undefined) event.capacity = Math.max(0, parseInt(capacity, 10) || 0);
    if (ageRestriction !== undefined) event.ageRestriction = Math.max(0, parseInt(ageRestriction, 10) || 0);
    if (vibe !== undefined) event.vibe = Array.isArray(vibe) ? vibe : event.vibe;
    if (rules !== undefined) event.rules = Array.isArray(rules) ? rules : event.rules;
    if (schedule !== undefined) event.schedule = Array.isArray(schedule) ? schedule : event.schedule;
    if (organizerName !== undefined) event.organizerName = organizerName;
    if (organizerContact !== undefined) event.organizerContact = organizerContact;
    if (socialLinks !== undefined) event.socialLinks = Array.isArray(socialLinks) ? socialLinks : event.socialLinks;
    if (status !== undefined && String(event.organizer) === String(req.user._id)) event.status = status;
    if (event.status === 'published' && event.moderationStatus === 'none') event.moderationStatus = 'approved';

    await event.save();
    const populated = await event.populate('organizer', 'name avatar');
    res.json({ success: true, event: serializeDetail(populated, req.user._id.toString(), null) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Moderate (admin only)
router.post('/:id/moderate', async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ success: false, error: 'Not authorized' });
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'action must be approve or reject' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    event.moderationStatus = action === 'approve' ? 'approved' : 'rejected';
    if (action === 'reject') event.status = 'cancelled';
    await event.save();
    res.json({ success: true, event: { _id: event._id, status: event.status, moderationStatus: event.moderationStatus } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete event (organizer or admin)
router.delete('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const canDelete = isAdmin(req) || String(event.organizer) === String(req.user._id);
    if (!canDelete) return res.status(403).json({ success: false, error: 'Not authorized' });
    await Event.findByIdAndDelete(req.params.id);
    await Promise.all([
      EventSquad.deleteMany({ event: event._id }),
      EventMoment.deleteMany({ event: event._id }),
      Message.deleteMany({ event: event._id }),
      Report.deleteMany({ event: event._id }),
    ]);
    const io = req.app.get('io');
    if (io) io.to('event:' + req.params.id).emit('event:deleted', { id: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark interest (idempotent-ish toggle; going -> interested downgrade allowed)
router.post('/:id/interested', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const meId = req.user._id.toString();
    const existing = (event.attendees || []).find((a) => String(a.user._id || a.user) === meId);

    if (existing && existing.status === 'interested') {
      return res.status(400).json({ success: false, error: 'Already interested' });
    }
    if (existing && existing.status === 'left') {
      existing.status = 'interested';
      existing.joinedAt = new Date();
    } else if (existing) {
      existing.status = 'interested';
    } else {
      event.attendees.push({ user: req.user._id, status: 'interested' });
    }
    await event.save();
    await updateCounts(event._id);

    if (String(event.organizer) !== meId) {
      await notify(req.app.get('io'), {
        recipient: event.organizer,
        actor: req.user._id,
        type: 'event',
        text: `is interested in "${event.title}"`,
        event: event._id,
        link: `/events/${event._id}`,
      });
    }

    res.json({ success: true, myStatus: 'interested', interestedCount: event.interestedCount(), goingCount: event.goingCount() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove my interest
router.delete('/:id/interested', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const meId = req.user._id.toString();
    event.attendees = (event.attendees || []).filter(
      (a) => String(a.user._id || a.user) !== meId || a.status !== 'interested'
    );
    await event.save();
    await updateCounts(event._id);
    res.json({ success: true, myStatus: null, interestedCount: event.interestedCount(), goingCount: event.goingCount() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join event / mark going
router.post('/:id/join', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const meId = req.user._id.toString();
    if (event.status !== 'published' && String(event.organizer) !== meId) {
      return res.status(400).json({ success: false, error: 'This event is not open for joining' });
    }
    const going = event.goingCount();
    if (event.capacity && event.capacity > 0 && going >= event.capacity) {
      return res.status(400).json({ success: false, error: 'Event is full' });
    }
    const existing = (event.attendees || []).find((a) => String(a.user._id || a.user) === meId);
    if (existing && existing.status === 'going') {
      return res.status(400).json({ success: false, error: 'Already going' });
    }

    if (existing) existing.status = 'going';
    else event.attendees.push({ user: req.user._id, status: 'going' });
    await event.save();
    await updateCounts(event._id);

    if (String(event.organizer) !== meId) {
      await notify(req.app.get('io'), {
        recipient: event.organizer,
        actor: req.user._id,
        type: 'event',
        text: `is going to "${event.title}" 🎟️`,
        event: event._id,
        link: `/events/${event._id}`,
      });
    }

    res.json({ success: true, myStatus: 'going', interestedCount: event.interestedCount(), goingCount: event.goingCount() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leave event
router.delete('/:id/leave', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const meId = req.user._id.toString();
    event.attendees = (event.attendees || []).filter((a) => String(a.user._id || a.user) !== meId);
    await event.save();
    await updateCounts(event._id);
    res.json({ success: true, myStatus: null, interestedCount: event.interestedCount(), goingCount: event.goingCount() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// People attending / interested (with shared interests + friendship)
router.get('/:id/attendees', async (req, res) => {
  try {
    const { status = 'going', page = 1 } = req.query;
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const me = await User.findById(req.user._id).select('interests friends');
    const myInterests = new Set((me?.interests || []).map(String));

    let users = (await Event.findById(req.params.id)
      .select('attendees')
      .populate({
        path: 'attendees.user',
        select: 'name avatar interests',
        match: { _id: { $ne: req.user._id } },
      })
      .lean()).attendees
      .filter((a) => a.status === status && a.user)
      .map((a) => a.user);

    const total = users.length;
    users = users.slice((Math.max(1, parseInt(page, 10) || 1) - 1) * limit, (Math.max(1, parseInt(page, 10) || 1) - 1) * limit + limit);

    const friendIds = new Set((me?.friends || []).map(String));
    const result = users.map((u) => ({
      id: u._id,
      name: u.name,
      avatar: u.avatar,
      interests: u.interests || [],
      sharedInterests: (u.interests || []).filter((i) => myInterests.has(String(i))),
      isFriend: friendIds.has(String(u._id)),
    }));

    res.json({ success: true, users: result, total, page: Math.max(1, parseInt(page, 10) || 1), limit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---- Squads ----

// Create squad
router.post('/:id/squads', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const { name, maxSize, preferences } = req.body;
    const existing = await EventSquad.findOne({ event: event._id, createdBy: req.user._id });
    if (existing) return res.status(400).json({ success: false, error: 'You already have a squad for this event' });

    const squad = await EventSquad.create({
      event: event._id,
      createdBy: req.user._id,
      name: typeof name === 'string' ? name.trim() : '',
      maxSize: Math.min(20, Math.max(2, parseInt(maxSize, 10) || 5)),
      preferences: Array.isArray(preferences) ? preferences : [],
      members: [{ user: req.user._id }],
    });
    const populated = await squad.populate('members.user', 'name avatar');
    res.status(201).json({ success: true, squad: populated });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, error: 'You already have a squad for this event' });
    res.status(500).json({ success: false, error: error.message });
  }
});

// List squads for an event
router.get('/:id/squads', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const meId = req.user._id.toString();
    const squads = await EventSquad.find({ event: event._id })
      .populate('createdBy', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort({ createdAt: 1 });
    res.json({
      success: true,
      squads: squads.map((s) => ({
        _id: s._id,
        name: s.name,
        createdBy: s.createdBy,
        members: (s.members || []).map((m) => ({ user: m.user, joinedAt: m.joinedAt })),
        memberCount: (s.members || []).length,
        maxSize: s.maxSize,
        preferences: s.preferences,
        status: s.status,
        mine: String(s.createdBy._id || s.createdBy) === meId,
        iAmIn: (s.members || []).some((m) => String(m.user._id || m.user) === meId),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update squad (creator only)
router.put('/:id/squads/:squadId', async (req, res) => {
  try {
    const squad = await EventSquad.findById(req.params.squadId);
    if (!squad) return res.status(404).json({ success: false, error: 'Squad not found' });
    if (String(squad.createdBy) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Not authorized' });
    const { name, maxSize, preferences } = req.body;
    if (name !== undefined) squad.name = String(name).trim();
    if (maxSize !== undefined) {
      const size = Math.min(20, Math.max(2, parseInt(maxSize, 10) || 5));
      if (size < (squad.members || []).length) return res.status(400).json({ success: false, error: 'Size cannot be below current members' });
      squad.maxSize = size;
    }
    if (preferences !== undefined) squad.preferences = Array.isArray(preferences) ? preferences : squad.preferences;
    squad.status = (squad.members || []).length >= squad.maxSize ? 'full' : 'open';
    await squad.save();
    res.json({ success: true, squad });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join a squad
router.post('/:id/squads/:squadId/join', async (req, res) => {
  try {
    const squad = await EventSquad.findById(req.params.squadId);
    if (!squad) return res.status(404).json({ success: false, error: 'Squad not found' });
    const meId = req.user._id.toString();
    if ((squad.members || []).some((m) => String(m.user._id || m.user) === meId)) {
      return res.status(400).json({ success: false, error: 'Already in this squad' });
    }
    if ((squad.members || []).length >= squad.maxSize || squad.status === 'full') {
      return res.status(400).json({ success: false, error: 'Squad is full' });
    }
    squad.members.push({ user: req.user._id });
    squad.status = (squad.members || []).length >= squad.maxSize ? 'full' : 'open';
    await squad.save();
    const populated = await squad.populate('members.user', 'name avatar');

    if (String(squad.createdBy) !== meId) {
      await notify(req.app.get('io'), {
        recipient: squad.createdBy,
        actor: req.user._id,
        type: 'squad',
        text: `joined your event squad 🚀`,
        event: squad.event,
        link: `/events/${squad.event}`,
      });
    }

    res.json({ success: true, squad: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leave a squad
router.delete('/:id/squads/:squadId/leave', async (req, res) => {
  try {
    const squad = await EventSquad.findById(req.params.squadId);
    if (!squad) return res.status(404).json({ success: false, error: 'Squad not found' });
    const meId = req.user._id.toString();
    squad.members = (squad.members || []).filter((m) => String(m.user._id || m.user) !== meId);
    squad.status = (squad.members || []).length >= squad.maxSize ? 'full' : 'open';
    await squad.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete squad (creator only)
router.delete('/:id/squads/:squadId', async (req, res) => {
  try {
    const squad = await EventSquad.findById(req.params.squadId);
    if (!squad) return res.status(404).json({ success: false, error: 'Squad not found' });
    if (String(squad.createdBy) !== String(req.user._id)) return res.status(403).json({ success: false, error: 'Not authorized' });
    await squad.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---- Event chat (rest fallback for the socket path) ----

router.get('/:id/messages', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select('organizer attendees');
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    if (!isParticipant(event, req.user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Join or mark yourself interested to chat' });
    }
    const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);
    const q = req.query.before ? { event: event._id, _id: { $lt: req.query.before } } : { event: event._id };
    const messages = await Message.find(q)
      .populate('sender', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, messages: messages.reverse(), hasMore: messages.length === limit });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/messages', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    if (!isParticipant(event, req.user._id.toString())) {
      return res.status(403).json({ success: false, error: 'Join or mark yourself interested to chat' });
    }
    const message = await Message.create({
      sender: req.user._id,
      event: event._id,
      content: req.body.content || '',
      attachment: req.body.attachment,
    });
    const populated = await message.populate('sender', 'name avatar');
    const io = req.app.get('io');
    if (io) io.to('event:' + event._id).emit('event:message', populated);
    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---- Moments ----

router.post('/:id/moments', uploadPhotos.array('photos', 6), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const meId = req.user._id.toString();
    const going = (event.attendees || []).some(
      (a) => a.status === 'going' && String(a.user._id || a.user) === meId
    );
    if (!going && String(event.organizer) !== meId) {
      return res.status(403).json({ success: false, error: 'Only attendees can share moments' });
    }
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, error: 'Add some text or a photo' });
    }
    const moment = await EventMoment.create({
      event: event._id,
      user: req.user._id,
      text,
      rating: Math.min(5, Math.max(0, Number(req.body.rating) || 0)),
      photos: (req.files || []).map((f) => `/uploads/${f.filename}`),
    });
    const populated = await moment.populate('user', 'name avatar');
    res.status(201).json({ success: true, moment: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/moments', async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
    const moments = await EventMoment.find({ event: req.params.id })
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ success: true, moments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:id/moments/:momentId/like', async (req, res) => {
  try {
    const moment = await EventMoment.findById(req.params.momentId);
    if (!moment) return res.status(404).json({ success: false, error: 'Moment not found' });
    const meId = req.user._id.toString();
    if ((moment.likes || []).some((l) => String(l) === meId)) {
      moment.likes = moment.likes.filter((l) => String(l) !== meId);
    } else {
      moment.likes.push(req.user._id);
    }
    await moment.save();
    res.json({ success: true, liked: (moment.likes || []).some((l) => String(l) === meId), count: (moment.likes || []).length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Comment on a moment
router.post('/:id/moments/:momentId/comments', async (req, res) => {
  try {
    const moment = await EventMoment.findById(req.params.momentId);
    if (!moment) return res.status(404).json({ success: false, error: 'Moment not found' });
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : '';
    if (!text) return res.status(400).json({ success: false, error: 'Comment cannot be empty' });
    moment.comments.push({ user: req.user._id, text: text.slice(0, 300), createdAt: new Date() });
    await moment.save();
    const populated = await moment.populate('comments.user', 'name avatar');
    res.status(201).json({ success: true, moment: populated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Report an event
router.post('/:id/report', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
    const { type = 'event', details = '' } = req.body;
    if (String(event.organizer) === String(req.user._id)) {
      return res.status(400).json({ success: false, error: 'You cannot report your own event' });
    }
    const existing = await Report.findOne({ reporter: req.user._id, event: event._id, status: 'open' });
    if (existing) return res.status(400).json({ success: false, error: 'You already reported this event' });
    await Report.create({ reporter: req.user._id, reported: event.organizer, event: event._id, type, details });
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;