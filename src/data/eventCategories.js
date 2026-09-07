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

export const categoryMeta = (id) =>
  EVENT_CATEGORIES.find((c) => c.id === id) || EVENT_CATEGORIES[EVENT_CATEGORIES.length - 1];

export const EVENT_CATEGORY_GRADIENTS = {
  music: 'from-fuchsia-500 to-purple-700',
  sports: 'from-green-500 to-emerald-700',
  gaming: 'from-violet-500 to-purple-700',
  college: 'from-sky-500 to-indigo-700',
  technology: 'from-cyan-500 to-blue-700',
  art: 'from-pink-500 to-fuchsia-700',
  food: 'from-yellow-500 to-amber-700',
  movies: 'from-rose-500 to-red-700',
  fitness: 'from-orange-500 to-sunset-600',
  travel: 'from-teal-500 to-ocean-600',
  entertainment: 'from-purple-500 to-sunset-600',
  community: 'from-lime-500 to-electric-600',
  education: 'from-indigo-500 to-electric-700',
  other: 'from-slate-500 to-dark-600',
};

export const EVENT_VIBES = [
  { id: 'chill', label: 'Chill', emoji: '🍹' },
  { id: 'lively', label: 'Lively', emoji: '🔥' },
  { id: 'party', label: 'Party', emoji: '🪩' },
  { id: 'networking', label: 'Networking', emoji: '💼' },
  { id: 'health', label: 'Wellness', emoji: '🧘' },
];

export const VIBE_MAP = {
  music: ['party', 'lively', 'chill'],
  sports: ['health', 'lively'],
  gaming: ['lively', 'chill'],
  college: ['networking', 'lively'],
  technology: ['networking'],
  art: ['chill'],
  food: ['chill', 'party'],
  movies: ['chill'],
  fitness: ['health'],
  travel: ['lively', 'chill'],
  entertainment: ['party', 'lively'],
  community: ['networking', 'chill'],
  education: ['networking'],
  other: ['lively'],
};

export const EVENT_FILTERS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'today', label: 'Today' },
  { id: 'weekend', label: 'This Weekend' },
  { id: 'popular', label: 'Popular' },
];