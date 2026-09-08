import { VIBE_MAP } from '../data/eventCategories';

const CATEGORY_COLORS = {
  cricket: 'from-green-500 to-emerald-600', coffee: 'from-amber-500 to-orange-600',
  gaming: 'from-violet-500 to-purple-600', gym: 'from-rose-500 to-red-600',
  movies: 'from-pink-500 to-rose-600', walking: 'from-emerald-500 to-teal-600',
  running: 'from-orange-500 to-red-600', food: 'from-yellow-500 to-amber-600',
  coding: 'from-cyan-500 to-blue-600', music: 'from-fuchsia-500 to-purple-600',
  travel: 'from-sky-500 to-indigo-600', art: 'from-pink-500 to-fuchsia-600',
};

export const categoryColor = (category) =>
  CATEGORY_COLORS[String(category).toLowerCase()] || 'from-lime-500 to-electric-500';

export const getMatchScore = (activity) => {
  const count = Array.isArray(activity?.participants) ? activity.participants.length : 0;
  return Math.min(99, 55 + Math.floor(count * 5) + ((activity?.category?.length || 0) % 6));
};

export const formatDateLabel = (iso, time) => {
  if (!iso) return time ? `Today, ${time}` : 'Today';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const base = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  return time ? `${base}, ${time}` : base;
};

export const formatDistance = (km) =>
  km == null ? null : km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;

export const normalizeActivity = (a, meId = null) => {
  const participants = Array.isArray(a.participants)
    ? a.participants.filter((p) => p && p.status !== 'left')
    : [];
  const joined = participants.filter((p) => p.status !== 'pending');
  const pendingRequests = participants.filter((p) => p.status === 'pending');
  const host = a.creator && typeof a.creator === 'object' ? a.creator : { _id: a.creator, name: a.hostName || 'Someone', avatar: null };
  const distance = formatDistance(a.distance);
  return {
    id: a._id,
    title: a.title,
    description: a.description || '',
    category: a.category,
    emoji: a.emoji || '🎯',
    date: a.date,
    time: formatDateLabel(a.date, a.time),
    timeRaw: a.time,
    dateRaw: a.date,
    distance: distance,
    distanceLabel: distance || a.location?.address || 'Location TBA',
    address: a.location?.address || 'Location TBA',
    coordinates: a.location?.coordinates
      ? [a.location.coordinates[1], a.location.coordinates[0]]
      : null,
    participants: joined.length,
    pendingCount: pendingRequests.length,
    maxParticipants: a.maxParticipants || 10,
    requirements: a.requirements || '',
    approvalRequired: a.approvalRequired === true,
    match: getMatchScore(a),
    color: categoryColor(a.category),
    host: host.name,
    hostAvatar: host.avatar || null,
    creatorId: host._id || a.creator,
    activityType: a.activityType || 'public',
    recurring: a.recurring || 'none',
    status: a.status || 'upcoming',
    isCreator: a.isCreator === true,
    joined: a.joined === true,
    requested: a.requested === true || (meId ? participants.some((p) =>
      String(p.user?._id || p.user) === String(meId) && p.status === 'pending') : false),
    saved: a.saved === true,
    checkIns: a.checkIns || [],
    expenses: a.expenses || [],
    feedback: a.feedback || [],
    attendees: participants.map((p) => ({
      id: p.user?._id || p.user,
      name: p.user?.name || 'Member',
      avatar: p.user?.avatar || null,
      status: p.status,
    })),
  };
};

export const normalizeUser = (u, extra = {}) => {
  return {
    id: u._id || u.id,
    name: u.name,
    avatar: u.avatar || null,
    bio: u.bio || '',
    interests: u.interests || [],
    location: u.location?.address || (typeof u.location === 'string' ? u.location : ''),
    distance: formatDistance(extra.distance ?? u.distance),
    compatibility: extra.compatibility ?? u.compatibility ?? null,
    rating: u.stats?.rating ?? u.rating ?? 0,
    activitiesCount: u.stats?.activitiesJoined ?? u.activitiesCount ?? 0,
    status: u.status?.current || 'offline',
    friends: u.friends || [],
    isFriend: u.isFriend === true,
    requestSent: u.requestSent === true,
    requestReceived: u.requestReceived === true,
    gradient: extra.gradient || 'bg-gradient-to-br from-lime-500 to-electric-500',
    createdAt: u.createdAt,
  };
};

export const normalizeMessage = (m) => ({
  id: m._id,
  text: m.content,
  senderId: m.sender?._id || m.sender,
  senderName: m.sender?.name || 'You',
  senderAvatar: m.sender?.avatar || null,
  read: m.read,
  createdAt: m.createdAt,
  time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : '',
  attachment: m.attachment?.url ? {
    url: m.attachment.url,
    name: m.attachment.name || 'Attachment',
    type: m.attachment.type || '',
    size: m.attachment.size || 0,
  } : null,
  image: m.attachment?.url && String(m.attachment.type || '').startsWith('image/') ? m.attachment.url : null,
});

export const messagePreview = (m) => {
  if (m?.content) return m.content;
  if (!m?.attachment?.url) return '';
  return String(m.attachment.type || '').startsWith('image/') ? '📷 Photo' : `📎 ${m.attachment.name || 'Attachment'}`;
};

export const formatEventDate = (iso, startTime) => {
  if (!iso) return startTime ? `Today, ${startTime}` : 'Today';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const base = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const t = startTime ? startTime : d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${base}, ${t}`;
};

export const formatPrice = (price) => {
  if (!price || price.amount == null) return 'Free';
  const n = Number(price.amount);
  if (n <= 0) return 'Free';
  const c = price.currency || 'INR';
  if (c === 'INR') return `₹${n === Math.floor(n) ? n : n.toFixed(2)}`;
  if (c === 'USD') return `$${n === Math.floor(n) ? n : n.toFixed(2)}`;
  return `${n} ${c}`;
};

export const EVENT_ATTENDEE_LABELS = {
  interested: 'Interested',
  going: 'Going',
  left: 'Left',
};

export const normalizeEvent = (e) => {
  const coords = e.venue?.location?.coordinates;
  return {
    id: e._id,
    title: e.title,
    description: e.description || '',
    category: e.category,
    emoji: e.emoji || '🎉',
    coverImage: e.coverImage || '',
    organizer: e.organizer || { _id: e.organizerId, name: e.organizerName },
    organizerName: e.organizerName || e.organizer?.name || 'Organizer',
    isOrganizer: e.isOrganizer === true,
    date: e.date,
    dateLabel: formatEventDate(e.date, e.startTime),
    startTime: e.startTime,
    endTime: e.endTime,
    venueName: e.venue?.name || 'Venue TBA',
    address: e.venue?.address || 'Location TBA',
    coordinates: coords ? [coords[1], coords[0]] : null,
    price: e.price?.amount != null && e.price.amount > 0
      ? e.price
      : { amount: 0, currency: e.price?.currency || 'INR', ticketUrl: e.price?.ticketUrl || '' },
    priceLabel: formatPrice(e.price?.amount != null && e.price.amount > 0 ? e.price : { amount: 0, currency: e.price?.currency }),
    capacity: e.capacity || 0,
    rules: e.rules || [],
    schedule: e.schedule || [],
    interestedCount: e.interestedCount ?? e.counts?.interested ?? 0,
    goingCount: e.goingCount ?? e.counts?.going ?? 0,
    remainingSpots: e.remainingSpots ?? null,
    distance: e.distance == null ? null : formatDistance(e.distance),
    myStatus: e.myStatus || null,
    moderationStatus: e.moderationStatus || 'pending',
    status: e.status || 'published',
    createdAt: e.createdAt,
    people: (e.people || []).map((p) => ({
      id: p.id || p._id,
      name: p.name,
      avatar: p.avatar || null,
      interests: p.interests || [],
      status: p.status,
    })),
    organizerContact: e.organizerContact || '',
    socialLinks: e.socialLinks || [],
    vibe: (e.vibe || VIBES_FOR(e.category)).map((v) => v),
    isFull: e.remainingSpots != null && e.remainingSpots <= 0 && (e.interestedCount ?? 0) >= (e.capacity || Infinity),
  };
};

const VIBES_FOR = (category) => VIBE_MAP[category] || [];

export const normalizeMoment = (m, meId) => {
  const u = m.user && typeof m.user === 'object' ? m.user : { _id: m.user, name: 'Member', avatar: null };
  return {
    id: m._id,
    text: m.text,
    rating: m.rating || 0,
    photos: m.photos || [],
    likes: (m.likes || []).map((l) => (typeof l === 'object' ? l.user || l._id : l)),
    liked: (m.likes || []).some((l) => String(typeof l === 'object' ? l.user || l._id : l) === String(meId)),
    comments: (m.comments || []).map((c) => ({
      id: c._id,
      user: c.user?.name || 'Member',
      avatar: c.user?.avatar || null,
      text: c.text,
      createdAt: c.createdAt,
    })),
    author: u.name,
    authorId: u._id,
    avatar: u.avatar || null,
    createdAt: m.createdAt,
    time: m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
  };
};