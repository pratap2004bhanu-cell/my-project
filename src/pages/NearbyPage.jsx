import { useState, lazy, Suspense, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMapPin, FiList, FiFilter, FiSearch, 
  FiCalendar, FiUsers, FiTarget, FiArrowRight,
  FiNavigation, FiLayers
} from 'react-icons/fi';
import api from '../api';
import { normalizeActivity } from '../utils/normalize';
import { getPosition } from '../utils/location';
import { useAuth } from '../context/AuthContext';

// Dynamic import for map (no SSR)
const ActivityMap = lazy(() => import('../components/map/ActivityMap'));

const MapLoading = () => (
  <div className="w-full h-full bg-dark-800 rounded-2xl flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-dark-400">Loading map...</p>
    </div>
  </div>
);

const NearbyPage = () => {
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('map');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [radius, setRadius] = useState(5);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async (lat, lng) => {
      setLoading(true);
      setError(null);
      try {
        const params = lat && lng
          ? { nearby: 1, lat, lng, radius }
          : {};
        const res = await api.get('/api/activities', { params });
        if (!cancelled) setActivities((res.data.activities || []).map(normalizeActivity));
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || 'Failed to load nearby activities');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const getPositionLocal = () => getPosition(user);

    (async () => {
      const pos = await getPositionLocal();
      await load(pos?.lat, pos?.lng);
    })();

    return () => { cancelled = true; };
  }, [radius, user]);

  const categories = [
    { id: 'all', name: 'All', emoji: '🔥' },
    { id: 'cricket', name: 'Cricket', emoji: '🏏' },
    { id: 'coffee', name: 'Coffee', emoji: '☕' },
    { id: 'gaming', name: 'Gaming', emoji: '🎮' },
    { id: 'gym', name: 'Gym', emoji: '🏋️' },
    { id: 'movies', name: 'Movies', emoji: '🎬' },
    { id: 'food', name: 'Food', emoji: '🍕' },
  ];

  const filteredActivities = activities.filter(activity => 
    selectedCategory === 'all' || activity.category === selectedCategory
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Nearby Activities
          </h1>
          <p className="text-dark-400 flex items-center gap-2 mt-1">
            <FiNavigation className="w-4 h-4" />
            Showing activities within {radius} km
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-dark-800/50 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              viewMode === 'map'
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'text-dark-300 hover:text-white'
            }`}
          >
            <FiMapPin className="w-4 h-4" />
            Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'text-dark-300 hover:text-white'
            }`}
          >
            <FiList className="w-4 h-4" />
            List
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-lime-500 text-dark-900 font-semibold'
                  : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
              }`}
            >
              <span>{category.emoji}</span>
              <span className="text-sm">{category.name}</span>
            </button>
          ))}
        </div>
        
        {/* Radius Filter */}
        <div className="flex items-center gap-3 bg-dark-800/50 border border-dark-700/50 rounded-xl px-4 py-2">
          <FiLayers className="w-4 h-4 text-dark-400" />
          <select
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
            className="bg-transparent text-white text-sm focus:outline-none"
          >
            <option value={1}>1 km</option>
            <option value={2}>2 km</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-24">
          <div className="w-12 h-12 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-400">Finding activities near you...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h3 className="text-xl font-bold text-white mb-2">Couldn't load nearby activities</h3>
          <p className="text-dark-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
      ) : viewMode === 'map' ? (
        <div className="h-[600px] rounded-2xl overflow-hidden border border-dark-700/50">
          <Suspense fallback={<MapLoading />}>
            <ActivityMap activities={filteredActivities} />
          </Suspense>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities.map((activity) => (
            <Link
              key={activity.id}
              to={`/activities/${activity.id}`}
              className="card-glow overflow-hidden block group"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-xl flex items-center justify-center text-2xl">
                    {activity.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-dark-400">{activity.host}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-dark-400 mb-3">
                  <span className="flex items-center gap-1">
                    <FiMapPin className="w-3 h-3" />
                    {activity.distanceLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-3 h-3" />
                    {activity.time}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-sm text-dark-400">
                    <FiUsers className="w-4 h-4" />
                    {activity.participants}/{activity.maxParticipants}
                  </span>
                  <span className="badge-lime flex items-center gap-1">
                    <FiTarget className="w-3 h-3" />
                    {activity.match}%
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredActivities.length === 0 && (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">📍</span>
          <h3 className="text-xl font-bold text-white mb-2">No activities nearby</h3>
          <p className="text-dark-400 mb-6">Try increasing the radius or check back later</p>
          <button 
            onClick={() => setRadius(25)}
            className="btn-primary"
          >
            Expand Search Area
          </button>
        </div>
      )}
    </div>
  );
};

export default NearbyPage;