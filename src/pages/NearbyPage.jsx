import { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMapPin, FiNavigation, FiRefreshCw, FiLayers,
  FiCalendar, FiUsers, FiTarget, FiMaximize2
} from 'react-icons/fi';
import api from '../api';
import { normalizeActivity } from '../utils/normalize';
import { getPosition, browserPos, reverseGeocode, formatCoords, hasRealCoords } from '../utils/location';
import { useAuth } from '../context/AuthContext';

// Dynamic import for map (no SSR)
const ActivityMap = lazy(() => import('../components/map/ActivityMap'));

const MapLoading = () => (
  <div className="w-full h-full bg-dark-800 flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-dark-400 text-sm">Loading map...</p>
    </div>
  </div>
);

const posKey = (p) => (p ? `${p.lat.toFixed(5)},${p.lng.toFixed(5)}` : 'none');

const NearbyPage = () => {
  const { user, updateUser } = useAuth();
  const [position, setPosition] = useState(() => {
    const c = user?.location?.coordinates;
    return hasRealCoords(c) ? { lat: c[1], lng: c[0] } : null;
  });
  const [address, setAddress] = useState(() => {
    const a = user?.location?.address;
    return a && a !== 'Location not set' ? a : '';
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [radius, setRadius] = useState(5);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingLoc, setUpdatingLoc] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [geocodeDone, setGeocodeDone] = useState(false);

  // Resolve the user's saved location on mount (fallback: browser geolocation)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pos = await getPosition(user);
      if (!cancelled && pos) setPosition((prev) => (posKey(prev) === posKey(pos) ? prev : pos));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reverse-geocode the current position (best effort) for a friendly label
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!position) {
        setAddress('');
        setGeocodeDone(true);
        return;
      }
      const label = await reverseGeocode(position.lat, position.lng);
      if (!cancelled) {
        setAddress(label);
        setGeocodeDone(true);
      }
    };
    run();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posKey(position)]);

  const loadActivities = useCallback(async (pos) => {
    setLoading(true);
    setError(null);
    try {
      const params = pos ? { nearby: 1, lat: pos.lat, lng: pos.lng, radius } : {};
      const res = await api.get('/api/activities', { params });
      setActivities((res.data.activities || []).map(normalizeActivity));
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load nearby activities');
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
    }
  }, [radius]);

  useEffect(() => {
    loadActivities(position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadActivities, posKey(position)]);

  const refresh = () => {
    loadActivities(position);
  };

  const updateLocation = async () => {
    setUpdatingLoc(true);
    const pos = await browserPos();
    if (!pos) {
      setError('Could not get your current location. Check browser permissions or set it in Settings.');
      setUpdatingLoc(false);
      return;
    }
    const label = await reverseGeocode(pos.lat, pos.lng);
    const ok = await updateUser({
      location: { type: 'Point', coordinates: [pos.lng, pos.lat], address: label || 'Current location' },
    });
    if (ok.success) {
      setPosition({ lat: pos.lat, lng: pos.lng });
      setAddress(label);
    } else {
      setError('Could not save your location. Please try again.');
    }
    setUpdatingLoc(false);
    setLastUpdated(new Date());
  };

  const categories = [
    { id: 'all', name: 'All', emoji: '🔥' },
    { id: 'cricket', name: 'Cricket', emoji: '🏏' },
    { id: 'coffee', name: 'Coffee', emoji: '☕' },
    { id: 'gaming', name: 'Gaming', emoji: '🎮' },
    { id: 'gym', name: 'Gym', emoji: '🏋️' },
    { id: 'movies', name: 'Movies', emoji: '🎬' },
    { id: 'food', name: 'Food', emoji: '🍕' },
  ];

  const filteredActivities = activities.filter((activity) =>
    selectedCategory === 'all' || activity.category === selectedCategory
  );

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white flex items-center gap-2">
            <FiMapPin className="text-lime-400" />
            Nearby
          </h1>
          <p className="text-dark-400 flex items-center gap-2 mt-1">
            <FiRefreshCw className="w-4 h-4" />
            Updated {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-dark-800/50 text-dark-300 hover:text-white border border-dark-700/50 text-sm disabled:opacity-60 transition-colors"
        >
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Map + Current Location */}
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {/* Compact map */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden border border-dark-700/50 h-48 sm:h-60 lg:h-[340px]">
          <Suspense fallback={<MapLoading />}>
            <ActivityMap
              activities={filteredActivities}
              center={position ? [position.lat, position.lng] : [28.6139, 77.2090]}
              zoom={13}
              userPosition={position ? [position.lat, position.lng] : null}
            />
          </Suspense>
          {/* Floating current-location chip */}
          <div className="absolute top-3 left-3 z-[500] flex items-center gap-1.5 bg-dark-950/80 backdrop-blur px-3 py-1.5 rounded-full border border-lime-500/30">
            <span className="relative flex w-2 h-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full w-2 h-2 bg-lime-500"></span>
            </span>
            <span className="text-xs font-medium text-white">You are here</span>
          </div>
        </div>

        {/* Current location info */}
        <div className="card p-5 lg:p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white">Your Location</h2>
          {address ? (
            <p className="text-xl lg:text-2xl font-bold text-white mt-2 leading-snug">{address}</p>
          ) : (
            <p className="text-dark-400 mt-2 leading-snug">
              {geocodeDone
                ? 'Location not set yet.'
                : 'Figuring out where you are...'}
            </p>
          )}
          {position && (
            <p className="text-sm text-dark-400 mt-2 font-mono">
              {formatCoords(position.lat, position.lng)}
            </p>
          )}

          <div className="flex items-center gap-3 bg-dark-800/50 border border-dark-700/50 rounded-xl px-4 py-2.5 mt-4">
            <FiLayers className="w-4 h-4 text-dark-400 flex-shrink-0" />
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="bg-transparent text-white text-sm focus:outline-none flex-1 py-1"
            >
              <option value={1}>1 km</option>
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
            </select>
            <span className="text-xs text-dark-400 flex-shrink-0">away</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              onClick={updateLocation}
              disabled={updatingLoc}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm btn-primary disabled:opacity-60"
            >
              <FiNavigation className="w-4 h-4" />
              {updatingLoc ? 'Updating...' : 'Update Location'}
            </button>
            <Link
              to="/location"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm btn-outline"
            >
              <FiMaximize2 className="w-4 h-4" />
              Live Map
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-dark-400 mt-4">
            <FiUsers className="w-4 h-4" />
            {activities.length} {activities.length === 1 ? 'activity' : 'activities'} within {radius} km
          </div>
        </div>
      </div>

      {error && (
        <div className="card p-4 mb-6 flex items-center justify-between gap-3 border border-red-500/30 bg-red-500/10">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={refresh} className="btn-outline text-sm px-3 py-1.5 flex-shrink-0">Retry</button>
        </div>
      )}

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
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

      {/* Activity list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">
          Nearby Activities
          <span className="ml-2 text-sm font-medium text-dark-400">({filteredActivities.length})</span>
        </h2>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="card-glow p-4 animate-pulse">
              <div className="h-12 w-12 rounded-xl bg-dark-700/60 mb-3"></div>
              <div className="h-4 bg-dark-700/60 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-dark-700/40 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">📍</span>
          <h3 className="text-xl font-bold text-white mb-2">No activities nearby</h3>
          <p className="text-dark-400 mb-6">Try increasing the radius or check back later</p>
          <button onClick={() => setRadius(25)} className="btn-primary">Expand Search Area</button>
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
                  <div className="w-12 h-12 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {activity.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors truncate">
                      {activity.title}
                    </h3>
                    <p className="text-sm text-dark-400 truncate">{activity.host}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dark-400 mb-3">
                  <span className="flex items-center gap-1">
                    <FiMapPin className="w-3 h-3 flex-shrink-0" />
                    {activity.distanceLabel}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiCalendar className="w-3 h-3 flex-shrink-0" />
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
    </div>
  );
};

export default NearbyPage;