import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { notify } from '../utils/notify.js';
import { getPublicKey } from '../utils/push.js';
import { sendVerificationOtp, isEmailConfigured } from '../utils/email.js';
import { filterValidImages } from '../utils/uploads.js';

// Fields a viewer is never allowed to see on another user's profile.
const SENSITIVE_SELECT = '-password -fcmToken -phone -email -emergencyContacts -devices -pushSubscriptions -verification -twoFactor -resetPassword -likes -likedBy -requestsSent -requestsReceived -savedActivities -blockedUsers -googleId';

// Minimal profile shown when privacy settings block the full profile.
const MINIMAL_PROFILE = (user) => ({
  _id: user._id,
  name: user.name,
  avatar: user.avatar,
  bio: user.bio,
  interests: user.interests,
  status: { current: user.status?.current, spontaneous: user.status?.spontaneous },
  stats: user.stats,
});

// In-memory guard for OTP verification attempts (per account, 15-min window).
const otpAttempts = new Map();
const tryOtpAttempt = (key) => {
  const now = Date.now();
  const rec = otpAttempts.get(key);
  if (!rec || now > rec.resetAt) {
    otpAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  rec.count += 1;
  return rec.count <= 5;
};

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

// Friend lists per user id (used to compute mutual connections cheaply)
const buildMutualMap = async (ids, meFriends) => {
  if (!ids.length) return {};
  const users = await User.find({ _id: { $in: ids } }).select('_id friends');
  const map = {};
  users.forEach((u) => { map[String(u._id)] = (u.friends || []).map(String); });
  return map;
};

// Annotate user documents with friendship/request state relative to `me`
const annotateList = (me, users, mutualMap = null) => {
  const friends = (me?.friends || []).map(String);
  const sent = (me?.requestsSent || []).map(String);
  const received = (me?.requestsReceived || []).map(String);
  return users.map((u) => {
    const id = String(u._id);
    const obj = typeof u.toObject === 'function' ? u.toObject() : { ...u };
    return {
      ...obj,
      isFriend: friends.includes(id),
      requestSent: sent.includes(id),
      requestReceived: received.includes(id),
      ...(mutualMap ? { mutuals: (mutualMap[id] || []).filter((f) => friends.includes(f)).length } : {}),
    };
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `user-${uniqueSuffix}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// Get VAPID public key for push subscription (no auth required)
router.get('/push-config', (req, res) => {
  res.json({ success: true, publicKey: getPublicKey() });
});

// Save/update a web push subscription for the current user
router.post('/me/push-subscription', protect, async (req, res) => {
  try {
    const { endpoint, keys, device } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ success: false, error: 'endpoint and keys are required' });
    }
    await User.updateOne(
      { _id: req.user._id, 'pushSubscriptions.endpoint': endpoint },
      { $set: { 'pushSubscriptions.$.keys': keys, 'pushSubscriptions.$.device': device || '' } }
    );
    const exists = await User.countDocuments({ _id: req.user._id, 'pushSubscriptions.endpoint': endpoint });
    if (!exists) {
      await User.updateOne(
        { _id: req.user._id },
        { $push: { pushSubscriptions: { endpoint, keys, device: device || '' } } }
      );
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove a web push subscription for the current user
router.delete('/me/push-subscription', protect, async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ success: false, error: 'endpoint is required' });
    await User.updateOne(
      { _id: req.user._id },
      { $pull: { pushSubscriptions: { endpoint } } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete my account
router.delete('/me', protect, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get nearby people
router.get('/nearby', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: 'lat and lng required' });
    }

    const people = await User.find({
      _id: { $ne: req.user._id },
      'privacy.showLocation': true,
      'privacy.profileVisibility': { $ne: 'private' },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: radius * 1000,
        },
      },
    }).select('name avatar bio interests location status stats');
    const me = await User.findById(req.user._id).select('friends requestsSent requestsReceived');

    const mutualMap = await buildMutualMap(people.map((p) => p._id), (me.friends || []).map(String));
    res.json({ success: true, people: annotateList(me, people, mutualMap) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leaderboard (top by activity participation)
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const users = await User.find({ 'privacy.profileVisibility': { $ne: 'private' } })
      .select('name avatar bio interests location status stats')
      .sort({ 'stats.activitiesJoined': -1, 'stats.streak': -1 })
      .limit(20);
    const me = await User.findById(req.user._id).select('friends requestsSent requestsReceived');
    const mutualMap = await buildMutualMap(users.map((u) => u._id), (me.friends || []).map(String));
    res.json({ success: true, users: annotateList(me, users, mutualMap) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// My connections (friends) with profile info
router.get('/me/connections', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate('friends', 'name avatar bio interests location status stats');
    res.json({ success: true, connections: annotateList(me, me.friends || []) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// My blocked users (with profile info)
router.get('/me/blocked', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate('blockedUsers', 'name avatar');
    res.json({ success: true, blocked: me.blockedUsers || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verification status
router.get('/me/verification', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    res.json({
      success: true,
      verified: !!me?.verification?.emailVerified,
      emailConfigured: isEmailConfigured(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send an email verification OTP
router.post('/me/verification/send', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (user.verification?.emailVerified) {
      return res.json({ success: true, verified: true, alreadyVerified: true });
    }
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verification.emailOtp = otp;
    user.verification.emailOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    const emailed = await sendVerificationOtp({ to: user.email, name: user.name, otp });
    const emailConfigured = isEmailConfigured();

    // When email isn't configured (no SMTP creds), surface the code in the
    // response so verification still works for development/demo purposes.
    const payload = { success: true, sent: emailed, emailConfigured };
    if (!emailed) payload.devCode = emailConfigured ? undefined : otp;
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Confirm the email verification OTP
router.post('/me/verification/confirm', protect, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, error: 'Enter the verification code' });
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    if (!tryOtpAttempt(String(user._id))) {
      return res.status(429).json({ success: false, error: 'Too many attempts. Request a new code in a little while.' });
    }
    const v = user.verification;
    if (!v?.emailOtp || !v.emailOtpExpires || new Date(v.emailOtpExpires) < new Date()) {
      return res.status(400).json({ success: false, error: 'Code expired. Request a new one.' });
    }
    if (String(code).trim() !== v.emailOtp) {
      return res.status(400).json({ success: false, error: 'Incorrect code. Try again.' });
    }
    user.verification.emailVerified = true;
    user.verification.emailOtp = '';
    user.verification.emailOtpExpires = null;
    await user.save();
    res.json({ success: true, verified: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// My emergency contacts
router.get('/me/emergency-contacts', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    res.json({ success: true, contacts: me.emergencyContacts || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add an emergency contact
router.post('/me/emergency-contacts', protect, async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, error: 'Contact name is required' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ success: false, error: 'Contact phone is required' });
    }
    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ success: false, error: 'User not found' });
    const contact = {
      name: String(name).trim(),
      relation: String(req.body.relation || '').trim(),
      phone: String(phone).trim(),
      email: String(req.body.email || '').trim().toLowerCase(),
    };
    if ((me.emergencyContacts || []).length >= 5) {
      return res.status(400).json({ success: false, error: 'You can add up to 5 emergency contacts' });
    }
    me.emergencyContacts = [...(me.emergencyContacts || []), contact];
    await me.save();
    res.status(201).json({ success: true, contact, contacts: me.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove an emergency contact
router.delete('/me/emergency-contacts/:index', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ success: false, error: 'User not found' });
    const index = Number(req.params.index);
    if (!Number.isInteger(index) || index < 0 || index >= (me.emergencyContacts || []).length) {
      return res.status(400).json({ success: false, error: 'Invalid contact' });
    }
    me.emergencyContacts.splice(index, 1);
    await me.save();
    res.json({ success: true, contacts: me.emergencyContacts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user profile (privacy-aware)
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const viewerId = req.user._id.toString();
    const isSelf = String(user._id) === viewerId;
    const privacy = user.privacy || {};
    const isFriend = (user.friends || []).map(String).includes(viewerId);
    const restrict =
      privacy.profileVisibility === 'private' ||
      (privacy.profileVisibility === 'connections' && !isSelf && !isFriend);

    if (restrict && !isSelf) {
      const idStr2 = String(user._id);
      return res.json({
        success: true,
        user: {
          ...MINIMAL_PROFILE(user),
          isFriend: (req.user.friends || []).map(String).includes(idStr2),
          requestSent: (req.user.requestsSent || []).map(String).includes(idStr2),
          requestReceived: (req.user.requestsReceived || []).map(String).includes(idStr2),
        },
        restricted: true,
      });
    }

    const full = await User.findById(req.params.id)
      .select(SENSITIVE_SELECT)
      .populate('rating.rater', 'name avatar');
    if (!full) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const idStr = String(full._id);
    res.json({
      success: true,
      user: {
        ...(typeof full.toObject === 'function' ? full.toObject() : full),
        isFriend: (req.user.friends || []).map(String).includes(idStr),
        requestSent: (req.user.requestsSent || []).map(String).includes(idStr),
        requestReceived: (req.user.requestsReceived || []).map(String).includes(idStr),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get matching people (based on interests)
router.get('/match/:userId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if ((user.privacy || {}).profileVisibility === 'private') {
      return res.json({ success: true, matches: [] });
    }

    const matches = await User.find({
      _id: { $ne: user._id },
      'privacy.profileVisibility': { $ne: 'private' },
      interests: { $in: user.interests },
    })
      .select('name avatar bio interests location status stats')
      .limit(20);
    const me = await User.findById(req.user._id).select('friends requestsSent requestsReceived');
    const mutualMap = await buildMutualMap(matches.map((m) => m._id), (me.friends || []).map(String));

    res.json({ success: true, matches: annotateList(me, matches, mutualMap) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Like a user (mutual likes become a match + connection)
router.post('/:id/like', protect, async (req, res) => {
  try {
    const me = req.user._id.toString();
    const targetId = req.params.id;
    if (me === targetId) {
      return res.status(400).json({ success: false, error: 'You cannot like yourself' });
    }
    const user = await User.findById(me);
    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let matched = !!target.likes.map(String).includes(me);

    if (!user.likes.map(String).includes(targetId)) {
      user.likes.push(targetId);
      await user.save();
    }
    if (!target.likedBy.map(String).includes(me)) {
      target.likedBy.push(me);
      await target.save();
    }

    const io = req.app.get('io');

    if (matched) {
      // Make them connections + bump counts for both
      if (!user.friends.map(String).includes(targetId)) {
        user.friends.push(targetId);
        user.stats.connections = (user.stats.connections || 0) + 1;
        await user.save();
      }
      if (!target.friends.map(String).includes(me)) {
        target.friends.push(me);
        target.stats.connections = (target.stats.connections || 0) + 1;
        await target.save();
      }
      await notify(io, {
        recipient: me,
        actor: targetId,
        type: 'like',
        text: 'liked you back — you matched!',
        link: '/people',
      });
      await notify(io, {
        recipient: targetId,
        actor: me,
        type: 'like',
        text: 'liked you back — you matched!',
        link: '/people',
      });
    } else {
      await notify(io, {
        recipient: targetId,
        actor: me,
        type: 'like',
        text: 'liked you',
        link: '/people',
      });
    }

    res.json({ success: true, matched });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// My incoming connection requests (with profile info)
router.get('/me/connection-requests', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id).populate('requestsReceived', 'name avatar bio interests location status stats');
    res.json({ success: true, requests: me.requestsReceived || [] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send a connection request (not instant-add)
router.post('/:id/friend', protect, async (req, res) => {
  try {
    const meId = req.user._id;
    const targetId = req.params.id;
    if (String(meId) === String(targetId)) {
      return res.status(400).json({ success: false, error: 'You cannot connect with yourself' });
    }
    const user = await User.findById(meId);
    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    const idStr = String(targetId);

    if (user.friends.some((f) => String(f) === idStr)) {
      return res.json({ success: true, alreadyFriends: true });
    }
    if (user.requestsSent.some((r) => String(r) === idStr)) {
      return res.json({ success: true, pending: true, alreadyRequested: true });
    }

    user.requestsSent.push(targetId);
    target.requestsReceived.push(meId);
    await user.save();
    await target.save();

    const io = req.app.get('io');
    await notify(io, {
      recipient: targetId,
      actor: meId,
      type: 'connection',
      text: 'sent you a connection request',
      link: '/people',
    });

    res.json({ success: true, pending: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Accept a connection request
router.post('/:id/friend/accept', protect, async (req, res) => {
  try {
    const meId = req.user._id;
    const targetId = req.params.id;
    const meStr = String(meId);
    const idStr = String(targetId);
    if (meStr === idStr) {
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }
    const user = await User.findById(meId);
    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.requestsReceived.some((r) => String(r) === idStr)) {
      return res.status(400).json({ success: false, error: 'No pending request from this user' });
    }

    user.requestsReceived = user.requestsReceived.filter((r) => String(r) !== idStr);
    target.requestsSent = target.requestsSent.filter((r) => String(r) !== meStr);

    if (!user.friends.some((f) => String(f) === idStr)) {
      user.friends.push(targetId);
      user.stats.connections = (user.stats.connections || 0) + 1;
    }
    if (!target.friends.some((f) => String(f) === meStr)) {
      target.friends.push(meId);
      target.stats.connections = (target.stats.connections || 0) + 1;
    }
    await user.save();
    await target.save();

    const io = req.app.get('io');
    await notify(io, {
      recipient: targetId,
      actor: meId,
      type: 'connection',
      text: 'accepted your connection request',
      link: '/people',
    });

    res.json({ success: true, connected: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Decline a connection request
router.post('/:id/friend/decline', protect, async (req, res) => {
  try {
    const meId = req.user._id;
    const targetId = req.params.id;
    const meStr = String(meId);
    const idStr = String(targetId);
    if (meStr === idStr) {
      return res.status(400).json({ success: false, error: 'Invalid request' });
    }
    const user = await User.findById(meId);
    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.requestsReceived.some((r) => String(r) === idStr)) {
      return res.status(400).json({ success: false, error: 'No pending request from this user' });
    }

    user.requestsReceived = user.requestsReceived.filter((r) => String(r) !== idStr);
    target.requestsSent = target.requestsSent.filter((r) => String(r) !== meStr);
    await user.save();
    await target.save();

    const io = req.app.get('io');
    await notify(io, {
      recipient: targetId,
      actor: meId,
      type: 'connection',
      text: 'declined your connection request',
      link: '/people',
    });

    res.json({ success: true, declined: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unfriend, cancel a request I sent, or withdraw an incoming request
router.delete('/:id/friend', protect, async (req, res) => {
  try {
    const meStr = String(req.user._id);
    const idStr = String(req.params.id);
    const user = await User.findById(req.user._id);
    const target = await User.findById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    let action = 'none';

    if (user.friends.some((f) => String(f) === idStr)) {
      user.friends = user.friends.filter((f) => String(f) !== idStr);
      user.stats.connections = Math.max(0, (user.stats.connections || 0) - 1);
      action = 'unfriended';
    }
    if (user.requestsSent.some((r) => String(r) === idStr)) {
      user.requestsSent = user.requestsSent.filter((r) => String(r) !== idStr);
      target.requestsReceived = target.requestsReceived.filter((r) => String(r) !== meStr);
      action = 'cancelled';
    } else if (user.requestsReceived.some((r) => String(r) === idStr)) {
      user.requestsReceived = user.requestsReceived.filter((r) => String(r) !== idStr);
      target.requestsSent = target.requestsSent.filter((r) => String(r) !== meStr);
      action = 'cancelled';
    }

    await Promise.all([user.save(), target.save()]);
    res.json({ success: true, action });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Block user
router.post('/:id/block', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot block yourself' });
    }
    if (!user.blockedUsers.map(String).includes(req.params.id)) {
      user.blockedUsers.push(req.params.id);
      await user.save();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Unblock user
router.delete('/:id/block', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.blockedUsers = user.blockedUsers.filter((b) => b.toString() !== req.params.id);
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rate a user (per-user rating, one per rater+activity)
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const { rating, activity, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: 'Rating must be between 1 and 5' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot rate yourself' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (activity) {
      const dup = user.rating.some(
        (r) => r.activity && r.activity.toString() === activity.toString() && r.rater.toString() === req.user._id.toString()
      );
      if (dup) {
        return res.status(400).json({ success: false, error: 'You already rated this person for this activity' });
      }
    }

    user.rating.push({ rater: req.user._id, rating, activity: activity || undefined, comment: comment || '' });
    user.stats.rating = Math.round((user.rating.reduce((s, r) => s + r.rating, 0) / user.rating.length) * 10) / 10;
    await user.save();

    const created = user.rating[user.rating.length - 1];
    res.json({ success: true, rating: created, avgRating: user.stats.rating });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload photos to my gallery
router.post('/me/gallery', protect, upload.array('photos', 12), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }
    const valid = filterValidImages(req.files);
    if (valid.length === 0) {
      return res.status(400).json({ success: false, error: 'The uploaded files are not valid images' });
    }
    const user = await User.findById(req.user._id);
    const urls = valid.map((f) => `/uploads/${f.filename}`);
    user.gallery.push(...urls);
    await user.save();
    res.json({ success: true, gallery: user.gallery });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove a photo from my gallery
router.delete('/me/gallery', protect, async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) {
      return res.status(400).json({ success: false, error: 'photo is required' });
    }
    const user = await User.findById(req.user._id);
    user.gallery = user.gallery.filter((g) => g !== photo);
    await user.save();
    res.json({ success: true, gallery: user.gallery });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;