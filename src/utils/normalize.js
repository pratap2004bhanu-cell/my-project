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

export const normalizeActivity = (a) => {
  const participants = Array.isArray(a.participants)
    ? a.participants.filter((p) => p && p.status !== 'left')
    : [];
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
    participants: participants.length,
    maxParticipants: a.maxParticipants || 10,
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
});