import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiMapPin, FiNavigation, FiUsers, FiClock,
  FiShare2, FiSettings, FiEye, FiEyeOff, FiRefreshCw
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { RoundAvatar } from '../components/common';
import { reverseGeocode, formatCoords } from '../utils/location';

const LiveMap = lazy(() => import('../components/map/LiveMap'));

const MapLoading = () => (
  <div className="w-full h-full bg-dark-800 rounded-2xl flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-dark-400">Loading map...</p>
    </div>
  </div>
);

const toRad = (deg) => (deg * Math.PI) / 180;

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const LocationPage = () => {
  const { user, updateUser } = useAuth();
  const [isSharing, setIsSharing] = useState(() => user?.privacy?.showLocation !== false);
  const [showOthers, setShowOthers] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [nearbyFriends, setNearbyFriends] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [center, setCenter] = useState(() =>
    user?.location?.coordinates && user.location.coordinates[0] !== 0
      ? [user.location.coordinates[1], user.location.coordinates[0]]
      : null
  );
  const mapRef = useRef(null);
  const [locAddress, setLocAddress] = useState('');
  const centerKey = center ? center.join(',') : '';

  useEffect(() => {
    let cancelled = false;
    const label = async () => {
      if (!center) return;
      const a = await reverseGeocode(center[0], center[1]);
      if (!cancelled) setLocAddress(a);
    };
    label();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerKey]);

  const loadFriends = () => {
    api.get('/api/users/me/connections')
      .then((res) => {
        const conns = res.data.connections || [];
        const [myLat, myLng] = center || [0, 0];
        if (myLat === 0 || myLng === 0) {
          setNearbyFriends([]);
          return;
        }
        setNearbyFriends(
          conns.map((f) => {
            const coords = f.location?.coordinates;
            if (!coords || coords.length < 2 || (coords[0] === 0 && coords[1] === 0)) return null;
            const dist = haversine(myLat, myLng, coords[1], coords[0]);
            const online = f.status?.current !== 'offline';
            return {
              _id: f._id,
              name: f.name,
              avatar: f.avatar,
              distance: dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`,
              activity: f.interests?.[0] || 'Exploring',
              online,
              coords: [coords[1], coords[0]],
            };
          }).filter(Boolean).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        );
      })
      .catch(() => setNearbyFriends([]));
  };

  useEffect(() => {
    loadFriends();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setLastUpdated(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const refresh = () => {
    setLastUpdated(new Date());
    loadFriends();
  };

  const toggleSharing = async () => {
    const next = !isSharing;
    setUpdating(true);
    setLastUpdated(new Date());
    const ok = await updateUser({ privacy: { ...user?.privacy, showLocation: next } });
    if (ok.success) setIsSharing(next);
    setUpdating(false);
  };

  const flyTo = (coords) => {
    if (mapRef.current?.flyTo) mapRef.current.flyTo(coords, 14);
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Live Location
          </h1>
          <p className="text-dark-400 flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSharing}
            disabled={updating}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all disabled:opacity-60 ${
              isSharing
                ? 'bg-lime-500 text-dark-900'
                : 'bg-dark-800/50 text-dark-300 border border-dark-700/50'
            }`}
          >
            <FiShare2 className="w-4 h-4" />
            {isSharing ? 'Sharing On' : 'Share Location'}
          </button>
          <Link to="/settings" className="btn-icon">
            <FiSettings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="h-[300px] sm:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden border border-dark-700/50">
            <Suspense fallback={<MapLoading />}>
              <LiveMap ref={mapRef} center={center} friends={showOthers ? nearbyFriends : []} />
            </Suspense>
          </div>

          {/* Map Controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowOthers(!showOthers)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  showOthers ? 'bg-lime-500/20 text-lime-400' : 'bg-dark-800/50 text-dark-400'
                }`}
              >
                {showOthers ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
                Show Others
              </button>
              <button
                onClick={() => center && flyTo(center)}
                className="flex items-center gap-2 px-3 py-2 bg-dark-800/50 text-dark-400 rounded-lg text-sm"
              >
                <FiNavigation className="w-4 h-4" />
                My Location
              </button>
            </div>
            <button
              onClick={refresh}
              className="flex items-center gap-2 px-3 py-2 bg-dark-800/50 text-dark-400 rounded-lg text-sm"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Sharing Status */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Location Sharing</h2>
            <div className={`p-4 rounded-xl ${isSharing ? 'bg-lime-500/10 border border-lime-500/30' : 'bg-dark-800/50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isSharing ? 'bg-lime-500 animate-pulse' : 'bg-dark-500'}`} />
                <span className={`font-medium ${isSharing ? 'text-lime-400' : 'text-dark-400'}`}>
                  {isSharing ? 'Sharing with friends' : 'Sharing off'}
                </span>
              </div>
              {isSharing && (
                <p className="text-sm text-dark-400 mt-2">
                  Your location is visible to your connections
                </p>
              )}
            </div>
            {center && (
              <div className="mt-4">
                {locAddress && (
                  <p className="font-semibold text-white leading-snug">{locAddress}</p>
                )}
                <p className="text-sm text-dark-400 font-mono mt-1">
                  {formatCoords(center[0], center[1])}
                </p>
              </div>
            )}
          </div>

          {/* Nearby Friends */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Nearby Friends ({nearbyFriends.filter((f) => f.online).length} online)
            </h2>
            {nearbyFriends.length === 0 ? (
              <p className="text-dark-400 text-center py-4 text-sm">
                No connections with locations nearby.{'\n'}
                Add your location in Settings to find friends.
              </p>
            ) : (
              <div className="space-y-3">
                {nearbyFriends.map((friend) => (
                  <div key={friend._id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                    <div className="relative">
                      <RoundAvatar
                        name={friend.name}
                        src={friend.avatar}
                        gradient="from-electric-500 to-cyan-500"
                        className="w-10 h-10"
                      />
                      {friend.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-dark-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{friend.name}</h4>
                      <p className="text-xs text-dark-400">{friend.distance} • {friend.activity}</p>
                    </div>
                    <button
                      onClick={() => friend.coords && flyTo(friend.coords)}
                      className="p-2 text-dark-400 hover:text-lime-400 rounded-lg hover:bg-dark-700/50 transition-colors"
                    >
                      <FiNavigation className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Share */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Share</h2>
            <p className="text-sm text-dark-400 mb-4">Share your live location with specific people</p>
            <button
              onClick={toggleSharing}
              disabled={updating}
              className="w-full btn-primary disabled:opacity-60"
            >
              <FiShare2 className="w-4 h-4 mr-2" />
              {isSharing ? 'Stop Sharing' : 'Share with Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPage;