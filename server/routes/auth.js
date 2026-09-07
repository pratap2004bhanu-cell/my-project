import { Router } from 'express';
import multer from 'multer';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken, generateChallengeToken, protect } from '../middleware/auth.js';
import { storeFile } from '../config/gridfs.js';
import { sendOtpMail, isEmailConfigured } from '../utils/email.js';

const router = Router();

const clientIp = (req) => {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return String(fwd).split(',')[0].trim();
  return req.socket?.remoteAddress || '';
};

const deviceInfo = (req) => {
  const ua = String(req.headers['user-agent'] || 'Unknown device');
  const short = ua.length > 120 ? `${ua.slice(0, 120)}…` : ua;
  return {
    name: String(req.body.deviceName || req.body.device || short).trim().slice(0, 200),
    ip: clientIp(req),
  };
};

// Register a device against the user (or update its lastActive). Returns the
// deviceId which is embedded in the JWT so sessions can be revoked.
const touchDevice = async (user, info) => {
  const name = info.name || `${info.ip || 'New'} session`;
  let device = (user.devices || []).find(
    (d) => d.name && d.name === name && (!d.ip || d.ip === info.ip)
  );
  if (!device) {
    user.devices.push({ name, ip: info.ip, lastActive: new Date() });
    device = user.devices[user.devices.length - 1];
  }
  device.lastActive = new Date();
  await user.save();
  return device._id;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/image\/(jpeg|png|webp|gif)/.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

const cleanUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  avatar: u.avatar,
  bio: u.bio,
  interests: u.interests,
  location: u.location,
  status: u.status,
  stats: u.stats,
  preferences: u.preferences,
  notifications: u.notifications,
  privacy: u.privacy,
  twoFactorEnabled: !!u.twoFactor?.enabled,
  friends: u.friends || [],
  requestsSent: u.requestsSent || [],
  requestsReceived: u.requestsReceived || [],
  likes: u.likes || [],
  likedBy: u.likedBy || [],
  gallery: u.gallery || [],
  createdAt: u.createdAt,
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Name must be at least 2 characters' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address' });
    }
    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const deviceId = await touchDevice(user, deviceInfo(req));
    const token = generateToken(user._id, deviceId);
    res.status(201).json({ success: true, token, user: cleanUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    // If 2FA is enabled, issue a short-lived challenge token and email an OTP.
    if (user.twoFactor?.enabled) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      user.twoFactor.otp = otp;
      user.twoFactor.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      const emailed = await sendOtpMail({
        to: user.email,
        name: user.name,
        otp,
        purpose: 'two-factor login to your KIKY account',
      });
      const challengeToken = generateChallengeToken(user._id);
      const emailConfigured = isEmailConfigured();
      const payload = { success: true, twoFactorRequired: true, challengeToken, emailConfigured };
      if (!emailed) payload.devCode = otp;
      return res.json(payload);
    }

    const deviceId = await touchDevice(user, deviceInfo(req));
    const token = generateToken(user._id, deviceId);
    res.json({ success: true, token, user: cleanUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete a 2FA login with the emailed OTP. Identity comes from the
// challengeToken issued at login/Google OAuth (email fallback for legacy calls).
router.post('/login/2fa', async (req, res) => {
  try {
    const { code, challengeToken, email, deviceName, device } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Email and code are required' });
    }

    let user;
    if (challengeToken) {
      try {
        const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
        if (decoded.purpose !== '2fa' || !decoded.id) {
          return res.status(401).json({ success: false, error: 'Invalid challenge' });
        }
        user = await User.findById(decoded.id);
      } catch {
        return res.status(401).json({ success: false, error: 'Sign-in challenge expired. Please sign in again.' });
      }
    } else {
      if (!email) return res.status(400).json({ success: false, error: 'Email and code are required' });
      user = await User.findOne({ email });
    }
    if (!user) return res.status(401).json({ success: false, error: 'Invalid email or code' });

    const t = user.twoFactor;
    if (!t?.otp || !t.otpExpires || new Date(t.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, error: 'Code expired. Please sign in again to get a new one.' });
    }
    if (String(code).trim() !== t.otp) {
      return res.status(401).json({ success: false, error: 'Incorrect code.' });
    }

    t.otp = '';
    t.otpExpires = null;
    const deviceId = await touchDevice(user, deviceInfo(req));
    const token = generateToken(user._id, deviceId);
    res.json({ success: true, token, user: cleanUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch challenge metadata for a pending 2FA sign-in (used by the OAuth
// callback page so codes never need to live in the redirect URL).
router.post('/2fa/challenge', async (req, res) => {
  try {
    const { challengeToken } = req.body;
    if (!challengeToken) {
      return res.status(400).json({ success: false, error: 'Missing challenge token' });
    }
    let user;
    try {
      const decoded = jwt.verify(challengeToken, process.env.JWT_SECRET);
      if (decoded.purpose !== '2fa' || !decoded.id) {
        return res.status(401).json({ success: false, error: 'Invalid challenge' });
      }
      user = await User.findById(decoded.id);
    } catch {
      return res.status(401).json({ success: false, error: 'Sign-in challenge expired. Please sign in again.' });
    }
    if (!user) return res.status(401).json({ success: false, error: 'Invalid challenge' });

    const emailConfigured = isEmailConfigured();
    const payload = { success: true, emailConfigured, email: user.email };
    if (!emailConfigured && user.twoFactor?.otp) payload.devCode = user.twoFactor.otp;
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Google OAuth - initiate
const getOrigin = (req) => `https://${req.get('host')}`;
const googleCallbackUrl = (req) => `${getOrigin(req)}/auth/google/callback`;

router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    callbackURL: googleCallbackUrl(req),
  })(req, res, next);
});

// Google OAuth - callback
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false, callbackURL: googleCallbackUrl(req) }, async (err, user) => {
    if (err || !user) {
      return res.redirect('/login?oauth_error=1');
    }
    // If the user has 2FA enabled, require a code before issuing a session.
    if (user.twoFactor?.enabled) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      user.twoFactor.otp = otp;
      user.twoFactor.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpMail({
        to: user.email,
        name: user.name,
        otp,
        purpose: 'two-factor login to your KIKY account',
      });
      const challengeToken = generateChallengeToken(user._id);
      return res.redirect(`${getOrigin(req)}/oauth/callback?2fa=1&token=${challengeToken}`);
    }
    const deviceId = await touchDevice(user, deviceInfo(req));
    const token = generateToken(user._id, deviceId);
    res.redirect(`${getOrigin(req)}/oauth/callback?token=${token}`);
  })(req, res, next);
});

// Get current user
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: cleanUser(req.user) });
});

// Update profile
router.put('/me', protect, async (req, res) => {
  try {
    const allowed = ['name', 'bio', 'interests', 'avatar', 'location', 'status', 'preferences', 'notifications', 'privacy', 'phone'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: cleanUser(user) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload avatar -> stored in MongoDB GridFS
router.post('/me/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const id = await storeFile({
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
    });
    const avatar = `/uploads/${id}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
    res.json({ success: true, avatar: user.avatar });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Change password
router.put('/me/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Current and new password are required' });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters' });
    }
    if (req.user.googleId && !req.user.password) {
      return res.status(400).json({ success: false, error: 'Set a password first to use password login' });
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Two-Factor Auth control
router.get('/me/2fa', protect, async (req, res) => {
  res.json({ success: true, enabled: !!req.user.twoFactor?.enabled, emailConfigured: isEmailConfigured() });
});

// Request an OTP to enable or disable 2FA
router.post('/me/2fa/send', protect, async (req, res) => {
  try {
    const { action } = req.body; // 'enable' or 'disable'
    if (!['enable', 'disable'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Invalid action' });
    }
    const user = req.user;
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.twoFactor.otp = otp;
    user.twoFactor.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    const emailed = await sendOtpMail({
      to: user.email,
      name: user.name,
      otp,
      purpose: action === 'enable' ? 'enable two-factor authentication on your KIKY account' : 'disable two-factor authentication on your KIKY account',
    });
    const emailConfigured = isEmailConfigured();
    const payload = { success: true, emailed, emailConfigured, action };
    if (!emailed) payload.devCode = otp;
    res.json(payload);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Confirm the 2FA OTP, toggling 2FA on or off
router.post('/me/2fa/confirm', protect, async (req, res) => {
  try {
    const { action, code } = req.body;
    if (!['enable', 'disable'].includes(action) || !code) {
      return res.status(400).json({ success: false, error: 'Action and code are required' });
    }
    const user = req.user;
    const t = user.twoFactor;
    if (!t?.otp || !t.otpExpires || new Date(t.otpExpires) < new Date()) {
      return res.status(400).json({ success: false, error: 'Code expired. Request a new one.' });
    }
    if (String(code).trim() !== t.otp) {
      return res.status(400).json({ success: false, error: 'Incorrect code.' });
    }
    if (action === 'enable' && !user.email) {
      return res.status(400).json({ success: false, error: 'An email is required to enable two-factor auth' });
    }
    t.enabled = action === 'enable';
    t.otp = '';
    t.otpExpires = null;
    await user.save();
    res.json({ success: true, enabled: t.enabled });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Active sessions (devices)
router.get('/me/devices', protect, async (req, res) => {
  const devices = (req.user.devices || []).map((d) => ({
    id: d._id.toString(),
    name: d.name || 'Unknown device',
    ip: d.ip || '',
    lastActive: d.lastActive,
    current: d._id.toString() === String(req.deviceId || ''),
  }));
  res.json({ success: true, devices });
});

// Revoke a device / active session
router.delete('/me/devices/:deviceId', protect, async (req, res) => {
  try {
    const user = req.user;
    const id = req.params.deviceId;
    user.devices = (user.devices || []).filter((d) => d._id.toString() !== id);
    await user.save();
    res.json({ success: true, devices: user.devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export user data (GDPR-style)
router.get('/me/export', protect, async (req, res) => {
  try {
    const u = req.user;
    const data = {
      exportedAt: new Date().toISOString(),
      profile: {
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        phone: u.phone || '',
        bio: u.bio,
        interests: u.interests,
        location: u.location,
        avatar: u.avatar,
        gallery: u.gallery,
        createdAt: u.createdAt,
      },
      preferences: u.preferences,
      notifications: u.notifications,
      privacy: u.privacy,
      stats: u.stats,
      emergencyContacts: u.emergencyContacts || [],
      devices: (u.devices || []).map((d) => ({ name: d.name, ip: d.ip, lastActive: d.lastActive })),
    };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="kiky-export-${u._id}.json"`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
