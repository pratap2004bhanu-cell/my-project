import { Router } from 'express';
import Community from '../models/Community.js';
import Activity from '../models/Activity.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { notify } from '../utils/notify.js';

const router = Router();

// List communities
router.get('/', protect, async (req, res) => {
  try {
    const { q, mine } = req.query;
    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
      ];
    }
    if (mine === '1') {
      filter['members.user'] = req.user._id;
    }

    const communities = await Community.find(filter)
      .populate('creator', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(100);

    const joined = await Community.find({ 'members.user': req.user._id }).select('_id');
    const joinedIds = joined.map((c) => c._id.toString());

    res.json({
      success: true,
      communities: communities.map((c) => ({
        id: c._id,
        name: c.name,
        description: c.description,
        emoji: c.emoji,
        tags: c.tags,
        isPublic: c.isPublic,
        maxMembers: c.maxMembers,
        memberCount: c.members.length,
        joined: joinedIds.includes(c._id.toString()),
        isAdmin: c.creator?._id?.toString() === req.user._id.toString() || c.members.some((m) => m.user.toString() === req.user._id.toString() && m.role === 'admin'),
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get community detail
router.get('/:id', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('creator', 'name avatar')
      .populate('members.user', 'name avatar');
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }

    const activityPromises = community.activities.map((a) => Activity.findById(a).select('title emoji date time location'));
    const activities = (await Promise.all(activityPromises)).filter(Boolean);

    res.json({
      success: true,
      community: {
        id: community._id,
        name: community.name,
        description: community.description,
        emoji: community.emoji,
        tags: community.tags,
        isPublic: community.isPublic,
        maxMembers: community.maxMembers,
        creator: community.creator,
        members: community.members,
        activities: activities.map((a) => ({
          id: a._id,
          title: a.title,
          emoji: a.emoji,
          date: a.date,
          time: a.time,
          location: a.location?.address || '',
        })),
        memberCount: community.members.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create community
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, emoji, tags, isPublic, maxMembers } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, error: 'Community name is required' });
    }
    const community = await Community.create({
      name,
      description: description || '',
      emoji: emoji || '👥',
      tags: Array.isArray(tags) ? tags : [],
      isPublic: isPublic !== false,
      maxMembers: maxMembers || 100,
      creator: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    res.status(201).json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Join community
router.post('/:id/join', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }
    if (community.members.some((m) => m.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ success: false, error: 'Already a member' });
    }
    if (community.members.length >= community.maxMembers) {
      return res.status(400).json({ success: false, error: 'Community is full' });
    }
    community.members.push({ user: req.user._id, role: 'member' });
    await community.save();

    const me = await User.findById(req.user._id).select('name avatar');
    if (community.creator.toString() !== req.user._id.toString()) {
      const io = req.app.get('io');
      await notify(io, {
        recipient: community.creator,
        actor: req.user._id,
        type: 'community',
        text: `${me.name} joined ${community.name}`,
        community: community._id,
        link: '/communities',
      });
    }

    res.json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Leave community
router.post('/:id/leave', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, error: 'Community not found' });
    }
    community.members = community.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );
    await community.save();
    res.json({ success: true, community });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;