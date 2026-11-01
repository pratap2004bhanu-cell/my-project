/* Journey vocabulary. Mirrors the server's CATEGORY_BUCKET map so the
   filter row, the map markers and the stats all speak the same language.
   Anything the server bucketed as 'other' lands here too. */

export const JOURNEY_FILTERS = [
  { id: 'all', label: 'All', emoji: '✨' },
  { id: 'sports', label: 'Sports', emoji: '🏏' },
  { id: 'social', label: 'Social', emoji: '☕' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮' },
  { id: 'fitness', label: 'Fitness', emoji: '🏋️' },
  { id: 'movies', label: 'Movies', emoji: '🎬' },
  { id: 'study', label: 'Study', emoji: '📚' },
  { id: 'other', label: 'Other', emoji: '✨' },
];

export const JOURNEY_LABELS = {
  sports: 'Sports',
  social: 'Social',
  gaming: 'Gaming',
  fitness: 'Fitness',
  movies: 'Movies',
  study: 'Study',
  other: 'Other',
};

export const bucketMeta = (bucket) =>
  JOURNEY_FILTERS.find((f) => f.id === bucket) || JOURNEY_FILTERS[JOURNEY_FILTERS.length - 1];