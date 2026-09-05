import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiFilter, FiMapPin, FiCalendar, 
  FiUsers, FiHeart, FiTarget, FiArrowRight,
  FiTrendingUp, FiClock
} from 'react-icons/fi';
import api from '../api';
import { normalizeActivity } from '../utils/normalize';
import { getPosition } from '../utils/location';
import { useAuth } from '../context/AuthContext';

const ExplorePage = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nearFirst, setNearFirst] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const pos = await getPosition(user);
        const res = await api.get('/api/activities', {
          params: pos ? { nearby: 1, lat: pos.lat, lng: pos.lng, radius: 50 } : {},
        });
        if (!cancelled) setActivities((res.data.activities || []).map(normalizeActivity));
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || 'Failed to load activities');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  const categories = [
    { id: 'all', name: 'All', emoji: '🔥' },
    { id: 'sports', name: 'Sports', emoji: '🏏' },
    { id: 'fitness', name: 'Fitness', emoji: '🏋️' },
    { id: 'social', name: 'Social', emoji: '☕' },
    { id: 'gaming', name: 'Gaming', emoji: '🎮' },
    { id: 'movies', name: 'Movies', emoji: '🎬' },
    { id: 'outdoor', name: 'Outdoor', emoji: '⛰️' },
    { id: 'food', name: 'Food', emoji: '🍕' },
    { id: 'tech', name: 'Tech', emoji: '💻' },
    { id: 'creative', name: 'Creative', emoji: '🎨' },
    { id: 'music', name: 'Music', emoji: '🎵' },
    { id: 'study', name: 'Study', emoji: '📚' },
  ];

  const filteredActivities = activities.filter(activity => {
    const matchesCategory = selectedCategory === 'all' || activity.category === selectedCategory;
    const matchesSearch = activity.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (!nearFirst) return 0;
    const ad = typeof a.distance === 'number' ? a.distance : Infinity;
    const bd = typeof b.distance === 'number' ? b.distance : Infinity;
    return ad - bd;
  });

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
          Explore Activities
        </h1>
        <p className="text-dark-400">Discover what's happening around you</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12"
          />
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
        </div>
<button
          onClick={() => setNearFirst((v) => !v)}
          className={`btn-outline flex items-center gap-2 ${nearFirst ? 'border-lime-500 text-lime-400' : ''}`}
        >
          <FiFilter className="w-4 h-4" />
          {nearFirst ? 'Near Me On' : 'Near Me'}
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4 lg:mx-0 lg:px-0">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 ${
              selectedCategory === category.id
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
            }`}
          >
            <span>{category.emoji}</span>
            <span>{category.name}</span>
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-dark-400">
          <span className="font-semibold text-white">{filteredActivities.length}</span> activities found
        </p>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode('grid')}
            className={`btn-icon w-10 h-10 ${viewMode === 'grid' ? 'bg-lime-500/20 text-lime-400' : ''}`}
          >
            <FiTarget className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`btn-icon w-10 h-10 ${viewMode === 'list' ? 'bg-lime-500/20 text-lime-400' : ''}`}
          >
            <FiTrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Activities Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-400">Loading activities...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h3 className="text-xl font-bold text-white mb-2">Couldn't load activities</h3>
          <p className="text-dark-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
      ) : (
      <div className={`grid ${viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-4`}>
        {filteredActivities.map((activity) => (
          <Link
            key={activity.id}
            to={`/activities/${activity.id}`}
            className="card-glow overflow-hidden block group"
          >
            {/* Activity Image/Color */}
            <div className={`h-32 bg-gradient-to-br ${activity.color} flex items-center justify-center text-5xl relative`}>
              {activity.emoji}
              <div className="absolute top-3 right-3">
                <span className="badge-lime flex items-center gap-1">
                  <FiTarget className="w-3 h-3" />
                  {activity.match}% match
                </span>
              </div>
            </div>
            
            {/* Activity Info */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors">{activity.title}</h3>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-dark-400 mb-3">
                <span className="flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" />
                  {activity.distanceLabel}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {activity.time}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-white text-xs font-bold">
                    {activity.host[0]}
                  </div>
                  <span className="text-sm text-dark-300">{activity.host}</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-dark-400">
                  <FiUsers className="w-4 h-4" />
                  {activity.participants}/{activity.maxParticipants}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredActivities.length === 0 && (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">🔍</span>
          <h3 className="text-xl font-bold text-white mb-2">No activities found</h3>
          <p className="text-dark-400 mb-6">Try adjusting your search or filters — or create the first one!</p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
            className="btn-primary"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Create Activity CTA */}
      <div className="mt-8 card-glow text-center p-8">
        <span className="text-4xl mb-4 block">🚀</span>
        <h3 className="text-xl font-bold text-white mb-2">Don't see what you're looking for?</h3>
        <p className="text-dark-400 mb-6">Create your own activity and invite others to join!</p>
        <Link to="/create-activity" className="btn-primary inline-flex items-center gap-2">
          Create Activity
          <FiArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
};

export default ExplorePage;