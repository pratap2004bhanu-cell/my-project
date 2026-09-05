import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  FiSearch, FiFilter, FiMapPin, FiCalendar, 
  FiClock, FiUsers, FiTarget, FiX, FiChevronDown,
  FiTrendingUp, FiArrowRight
} from 'react-icons/fi';
import api from '../api';
import { normalizeActivity, formatDateLabel, formatDistance } from '../utils/normalize';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    distance: 10,
    date: 'any',
    time: 'any',
    minParticipants: 0,
    maxParticipants: 100,
    activityType: 'all',
    sortBy: 'relevance',
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const params = {};
        if (filters.category !== 'all') params.category = filters.category;
        const pos = await new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve(null),
            { timeout: 4000 }
          );
        });
        if (pos) {
          params.nearby = 1;
          params.lat = pos.lat;
          params.lng = pos.lng;
          params.radius = 50;
        }
        const res = await api.get('/api/activities', { params });
        if (cancelled) return;
        setActivities((res.data.activities || []).map((a) => ({
          ...normalizeActivity(a),
          distanceNum: a.distance,
          dateLabel: formatDateLabel(a.date, ''),
          timeLabel: a.time || '',
          distDisplay: a.distance != null
            ? formatDistance(a.distance)
            : (a.location?.address || 'Location TBA'),
        })));
      } catch (err) {
        if (!cancelled) setError('Failed to load activities');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.category]);

  const categories = [
    { id: 'all', name: 'All Activities', emoji: '🎯' },
    { id: 'cricket', name: 'Cricket', emoji: '🏏' },
    { id: 'coffee', name: 'Coffee', emoji: '☕' },
    { id: 'gaming', name: 'Gaming', emoji: '🎮' },
    { id: 'gym', name: 'Fitness', emoji: '🏋️' },
    { id: 'movies', name: 'Movies', emoji: '🎬' },
    { id: 'food', name: 'Food', emoji: '🍕' },
    { id: 'outdoor', name: 'Outdoor', emoji: '⛰️' },
    { id: 'tech', name: 'Tech', emoji: '💻' },
    { id: 'music', name: 'Music', emoji: '🎵' },
  ];

  const timeOptions = [
    { id: 'any', name: 'Any Time' },
    { id: 'morning', name: 'Morning (6 AM - 12 PM)' },
    { id: 'afternoon', name: 'Afternoon (12 PM - 5 PM)' },
    { id: 'evening', name: 'Evening (5 PM - 9 PM)' },
    { id: 'night', name: 'Night (9 PM - 12 AM)' },
  ];

  const dateOptions = [
    { id: 'any', name: 'Any Date' },
    { id: 'today', name: 'Today' },
    { id: 'tomorrow', name: 'Tomorrow' },
    { id: 'this-week', name: 'This Week' },
    { id: 'this-weekend', name: 'This Weekend' },
    { id: 'next-week', name: 'Next Week' },
  ];

  const sortOptions = [
    { id: 'relevance', name: 'Most Relevant' },
    { id: 'distance', name: 'Nearest First' },
    { id: 'time', name: 'Soonest' },
    { id: 'popular', name: 'Most Popular' },
    { id: 'match', name: 'Best Match' },
  ];

  const timeOfDay = (t) => {
    if (!t) return '';
    const [h] = String(t).split(':').map(Number);
    if (h >= 6 && h < 12) return 'morning';
    if (h >= 12 && h < 17) return 'afternoon';
    if (h >= 17 && h < 21) return 'evening';
    if (h >= 21) return 'night';
    return '';
  };

  const dateBucket = (iso) => {
    if (!iso) return 'any';
    const d = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOf = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    const dayDiff = Math.round((startOf(d) - startOfToday) / 86400000);
    if (dayDiff === 0) return 'today';
    if (dayDiff === 1) return 'tomorrow';
    if (dayDiff >= 2 && dayDiff <= 6) return d.getDay() === 0 || d.getDay() === 6 ? 'this-weekend' : 'this-week';
    if (dayDiff >= 7 && dayDiff <= 13) return 'next-week';
    return '';
  };

  const filteredActivities = activities
    .filter((activity) => {
      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const haystack = `${activity.title} ${activity.description} ${activity.category} ${activity.host}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.category !== 'all' && activity.category !== filters.category) return false;
      if (filters.date !== 'any' && activity.dateRaw) {
        const bucket = dateBucket(activity.dateRaw);
        if (bucket !== filters.date) return false;
      }
      if (filters.time !== 'any' && timeOfDay(activity.timeRaw) !== filters.time) return false;
      if (activity.participants < filters.minParticipants || activity.participants > filters.maxParticipants) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'distance':
          return (a.distanceNum ?? Infinity) - (b.distanceNum ?? Infinity);
        case 'time':
          return new Date(a.dateRaw) - new Date(b.dateRaw);
        case 'popular':
          return b.participants - a.participants;
        case 'match':
          return b.match - a.match;
        default:
          return 0;
      }
    });

  const activeFilterCount = Object.entries(filters)
    .filter(([k, v]) => k !== 'sortBy' && k !== 'activityType')
    .filter(([, v]) => filterIsActive(v))
    .length;

  function filterIsActive(v) {
    if (v === 'all' || v === 'any' || v === 10 || v === 0 || v === 100 || v === 'relevance') return false;
    return true;
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
          Search Activities
        </h1>
        <p className="text-dark-400">Find the perfect activity for you</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search activities, people, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12 pr-10"
          />
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
            >
              <FiX className="w-5 h-5" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`btn-outline flex items-center gap-2 relative ${showFilters ? 'bg-lime-500/10 border-lime-500' : ''}`}
        >
          <FiFilter className="w-5 h-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-lime-500 text-dark-900 rounded-full text-xs font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="card mb-6 animate-slide-down">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="input-field"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Distance: {filters.distance} km
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={filters.distance}
                onChange={(e) => setFilters({ ...filters, distance: Number(e.target.value) })}
                className="w-full accent-lime-500"
              />
              <div className="flex justify-between text-xs text-dark-400">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Date</label>
              <select
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="input-field"
              >
                {dateOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Time</label>
              <select
                value={filters.time}
                onChange={(e) => setFilters({ ...filters, time: e.target.value })}
                className="input-field"
              >
                {timeOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>

            {/* Participants */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                Participants: {filters.minParticipants} - {filters.maxParticipants}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max={filters.maxParticipants}
                  value={filters.minParticipants}
                  onChange={(e) => setFilters({ ...filters, minParticipants: Number(e.target.value) })}
                  className="input-field flex-1"
                  placeholder="Min"
                />
                <input
                  type="number"
                  min={filters.minParticipants}
                  max="100"
                  value={filters.maxParticipants}
                  onChange={(e) => setFilters({ ...filters, maxParticipants: Number(e.target.value) })}
                  className="input-field flex-1"
                  placeholder="Max"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                className="input-field"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-dark-700/50">
            <button
              onClick={() => setFilters({
                category: 'all',
                distance: 10,
                date: 'any',
                time: 'any',
                minParticipants: 0,
                maxParticipants: 100,
                activityType: 'all',
                sortBy: 'relevance',
              })}
              className="text-dark-400 hover:text-white text-sm"
            >
              Clear all filters
            </button>
            <button className="btn-primary text-sm">
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-dark-400">
          {loading ? 'Searching...' : (
            <>
              <span className="font-semibold text-white">{filteredActivities.length}</span> activities found
            </>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h3 className="text-xl font-bold text-white mb-2">Couldn't load activities</h3>
          <p className="text-dark-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
      ) : (
      /* Activities List */
      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <Link
            key={activity.id}
            to={`/activities/${activity.id}`}
            className="card-glow flex flex-col sm:flex-row gap-4 p-4 block group"
          >
            <div className={`w-full sm:w-24 h-24 bg-gradient-to-br ${activity.color} bg-opacity-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0`}>
              {activity.emoji}
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors text-lg">
                    {activity.title}
                  </h3>
                  <p className="text-sm text-dark-400">by {activity.host}</p>
                </div>
                <span className="badge-lime flex items-center gap-1">
                  <FiTarget className="w-3 h-3" />
                  {activity.match}% match
                </span>
              </div>
              
              <p className="text-dark-300 text-sm mb-3 line-clamp-1">{activity.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
                <span className="flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" />
                  {activity.distDisplay}
                </span>
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {activity.dateLabel}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {activity.timeLabel}
                </span>
                <span className="flex items-center gap-1">
                  <FiUsers className="w-3 h-3" />
                  {activity.participants}/{activity.maxParticipants}
                </span>
              </div>
            </div>
            
            <div className="flex items-center">
              <span className="btn-primary text-sm">JOIN</span>
            </div>
          </Link>
        ))}
      </div>
      )}

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">🔍</span>
          <h3 className="text-xl font-bold text-white mb-2">No activities found</h3>
          <p className="text-dark-400 mb-6">Try adjusting your search or filters</p>
          <button 
            onClick={() => { setSearchQuery(''); setFilters({ ...filters, category: 'all' }); }}
            className="btn-primary"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchPage;