import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import User from '../models/User.js';
import { generateToken, protect } from '../middleware/auth.js';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${req.user._id}-${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({
  storage,
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
  avatar: u.avatar,
  bio: u.bio,
  interests: u.interests,
  location: u.location,
  status: u.status,
  stats: u.stats,
  preferences: u.preferences,
  notifications: u.notifications,
  privacy: u.privacy,
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
    const token = generateToken(user._id);
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

    const token = generateToken(user._id);
    res.json({ success: true, token, user: cleanUser(user) });
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
  passport.authenticate('google', { session: false, callbackURL: googleCallbackUrl(req) }, (err, user) => {
    if (err || !user) {
      return res.redirect('/login?oauth_error=1');
    }
    const token = generateToken(user._id);
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
    const allowed = ['name', 'bio', 'interests', 'avatar', 'location', 'status', 'preferences', 'notifications', 'privacy'];
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

// Upload avatar
router.post('/me/avatar', protect, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const avatar = `/uploads/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true });
    res.json({ success: true, avatar: user.avatar });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
