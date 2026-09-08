import { Router } from 'express';
import Template from '../models/Template.js';
import { protect } from '../middleware/auth.js';

const router = Router();

const POPULAR = [
  { name: 'Morning Yoga', emoji: '🧘', category: 'fitness', description: 'Start your day with yoga', duration: '1 hour', maxParticipants: 15, location: 'Cubbon Park', isDefault: true, uses: 2340 },
  { name: 'Book Club', emoji: '📚', category: 'art', description: 'Monthly book discussion', duration: '2 hours', maxParticipants: 10, location: 'Community Library', isDefault: true, uses: 1856 },
  { name: 'Running Group', emoji: '🏃', category: 'running', description: 'Group run in the park', duration: '1 hour', maxParticipants: 20, location: 'Cubbon Park', isDefault: true, uses: 3421 },
  { name: 'Movie Night', emoji: '🎬', category: 'movies', description: 'Watch a movie together', duration: '3 hours', maxParticipants: 8, location: 'Local Theater', isDefault: true, uses: 2890 },
  { name: 'Coffee Meetup', emoji: '☕', category: 'coffee', description: 'Casual coffee and chat', duration: '1.5 hours', maxParticipants: 6, location: 'Third Wave Coffee', isDefault: true, uses: 1980 },
  { name: 'Board Game Night', emoji: '🎲', category: 'gaming', description: 'Board games and snacks', duration: '3 hours', maxParticipants: 8, location: 'Community Hall', isDefault: true, uses: 1420 },
  { name: 'Evening Cricket', emoji: '🏏', category: 'cricket', description: 'Weekly cricket match with friends', duration: '2 hours', maxParticipants: 12, location: 'City Park Ground', isDefault: true, uses: 3120 },
  { name: 'Photography Walk', emoji: '📸', category: 'walking', description: 'Guided photo walk downtown', duration: '2 hours', maxParticipants: 12, location: 'Downtown', isDefault: true, uses: 980 },
];

const POPULAR_FIELDS = ['name', 'emoji', 'category', 'description', 'duration', 'maxParticipants', 'location'];

// Seed popular templates if none exist
const ensurePopular = async () => {
  const count = await Template.countDocuments({ isDefault: true });
  if (count === 0) {
    await Template.insertMany(POPULAR);
  }
};

router.use(protect);

// Get templates (my + popular)
router.get('/', async (req, res) => {
  try {
    await ensurePopular();
    const { scope = 'all' } = req.query;
    let filter = {};
    if (scope === 'my') filter = { owner: req.user._id };
    if (scope === 'popular') filter = { isDefault: true };
    const templates = await Template.find(filter).sort({ isDefault: -1, uses: -1, createdAt: -1 });
    res.json({ success: true, templates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single template (own, or public/default templates)
router.get('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    if (!template.isDefault && String(template.owner || '') !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    res.json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create template
router.post('/', async (req, res) => {
  try {
    const template = await Template.create({ ...req.body, owner: req.user._id, isDefault: false });
    res.status(201).json({ success: true, template });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update template (only owner's own templates)
router.put('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    if (template.isDefault || template.owner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    const updated = await Template.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, template: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete template (owner only)
router.delete('/:id', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    if (template.isDefault || template.owner?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    await Template.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log a "use" of a template (increments counter, sets lastUsed). Anyone may
// bump a default/popular template, but only owners bump their own.
router.post('/:id/use', async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, error: 'Template not found' });
    if (!template.isDefault && String(template.owner || '') !== String(req.user._id)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    const updated = await Template.findByIdAndUpdate(
      req.params.id,
      { $inc: { uses: 1 }, lastUsedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, template: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
