import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiZap, FiMapPin, FiClock, FiUsers, FiTarget,
  FiRefreshCw, FiCheck, FiX
} from 'react-icons/fi';
import api from '../api';
import { RoundAvatar } from '../components/common';
import { useAuth } from '../context/AuthContext';
import { getMatchScore } from '../utils/normalize';

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

const ACTIVITY_OPTIONS = [
  { id: 'coffee', name: 'Coffee', emoji: '☕', color: 'from-amber-500 to-orange-500' },
  { id: 'food', name: 'Food', emoji: '🍕', color: 'from-red-500 to-pink-500' },
  { id: 'movies', name: 'Movie', emoji: '🎬', color: 'from-purple-500 to-violet-500' },
  { id: 'walking', name: 'Walk', emoji: '🚶', color: 'from-emerald-500 to-teal-500' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮', color: 'from-pink-500 to-rose-500' },
  { id: 'gym', name: 'Gym', emoji: '🏋️', color: 'from-blue-500 to-cyan-500' },
];

const PALETTE = ['from-pink-500 to-rose-500', 'from-purple-500 to-violet-500', 'from-electric-500 to-cyan-500', 'from-lime-500 to-emerald-500'];

const LetsGoNowPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isActive, setIsActive] = useState(false);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [searchRadius, setSearchRadius] = useState(2);
  const [pulse, setPulse] = useState(false);
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dismissed, setDismissed] = useState([]);

  const myLocation = user?.location?.coordinates;
  const hasLocation = myLocation && myLocation.length === 2 && !(myLocation[0] === 0 && myLocation[1] === 0);

  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => setPulse((prev) => !prev), 2000);
      return () => clearInterval(interval);
    }
  }, [isActive]);

  const loadMatches = () => {
    setSearching(true);
    api.get('/api/activities', { params: { status: 'upcoming' } })
      .then((res) => {
        const all = res.data.activities || [];
        const cats = new Set(selectedActivities.length ? selectedActivities : ACTIVITY_OPTIONS.map((o) => o.id));
        const anon = all
          .filter((a) => cats.has(a.category))
          .filter((a) => !dismissed.includes(a._id))
          .map((a) => {
            const loc = a.location?.coordinates;
            let distance = null;
            if (hasLocation && loc && loc.length === 2 && !(loc[0] === 0 && loc[1] === 0)) {
              distance = haversine(myLocation[1], myLocation[0], loc[1], loc[0]);
            }
            const participants = (a.participants || []).map((p) => {
              const pu = typeof p.user === 'object' ? p.user : { name: 'Member', avatar: null };
              return { name: pu.name || 'Member', avatar: pu.avatar };
            });
            const base = getMatchScore(a) || 45;
            const distanceBonus = distance != null ? Math.max(0, 25 - distance * 5) : 10;
            const peopleBonus = Math.min(15, participants.length * 3);
            const matchScore = Math.max(20, Math.min(98, Math.round(base + distanceBonus + peopleBonus)));
            return { ...a, participants, distance, matchScore };
          })
          .filter((a) => a.distance == null || a.distance <= searchRadius)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10);
        setMatches(anon);
      })
      .catch(() => setMatches([]))
      .finally(() => setSearching(false));
  };

  useEffect(() => {
    if (isActive) loadMatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, searchRadius, dismissed.length]);

  const toggleActivity = (id) => {
    setSelectedActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const joins = async (activity) => {
    if (activity.joined) {
      navigate(`/activities/${activity._id}`);
      return;
    }
    try {
      await api.post(`/api/activities/${activity._id}/join`);
      navigate(`/activities/${activity._id}`);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to join activity.');
    }
  };

  const dismiss = (id) => setDismissed((prev) => [...prev, id]);

  const fmtDistance = (d) => (d == null ? 'Near you' : d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)} km`);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-lime-500/20 to-electric-500/20 rounded-full mb-4">
          <FiZap className="w-5 h-5 text-lime-400" />
          <span className="text-lime-400 font-semibold">Instant Mode</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold text-white mb-2">
          KIKY Now
        </h1>
        <p className="text-dark-400 max-w-md mx-auto">
          Find people nearby who want to do the same thing right now
        </p>
      </div>

      {/* Main Toggle */}
      <div className="text-center mb-8">
        <button
          onClick={() => setIsActive(!isActive)}
          className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${
            isActive
              ? 'bg-gradient-to-br from-lime-500 to-emerald-500 text-dark-900 scale-110 shadow-lg shadow-lime-500/30'
              : 'bg-dark-800 border-4 border-dark-700 text-dark-400 hover:border-lime-500/50'
          }`}
        >
          {isActive && (
            <div className={`absolute inset-0 rounded-full bg-lime-500/30 animate-ping ${pulse ? 'opacity-100' : 'opacity-0'}`} />
          )}
          <div className="text-center z-10">
            <FiZap className={`w-10 h-10 mx-auto mb-2 ${isActive ? 'text-dark-900' : ''}`} />
            <span className="font-bold text-lg">
              {isActive ? 'STOP' : 'START'}
            </span>
          </div>
        </button>
        <p className={`mt-4 font-semibold ${isActive ? 'text-lime-400' : 'text-dark-400'}`}>
          {isActive ? (searching ? 'Searching for matches...' : 'Searching for matches...') : 'Tap to start searching'}
        </p>
      </div>

      {/* Activity Selection */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">What do you want to do?</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACTIVITY_OPTIONS.map((activity) => (
            <button
              key={activity.id}
              onClick={() => toggleActivity(activity.id)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all ${
                selectedActivities.includes(activity.id)
                  ? `bg-gradient-to-br ${activity.color} text-white`
                  : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
              }`}
            >
              <span className="text-2xl">{activity.emoji}</span>
              <span className="text-xs font-medium">{activity.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Radius */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Search Radius</h2>
          <span className="text-lime-400 font-bold">{searchRadius} km</span>
        </div>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={searchRadius}
          onChange={(e) => setSearchRadius(Number(e.target.value))}
          className="w-full accent-lime-500"
        />
        <div className="flex justify-between text-xs text-dark-400 mt-2">
          <span>500m</span>
          <span>5 km</span>
          <span>10 km</span>
        </div>
      </div>

      {/* Available Matches */}
      {isActive && (
        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Available Now ({matches.length})
            </h2>
            <button onClick={loadMatches} className="btn-outline text-sm flex items-center gap-2">
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {matches.length === 0 ? (
            <div className="card text-center py-12 text-dark-400">
              No activities nearby right now. Try a wider radius or check back soon.
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div key={match._id} className="card-glow p-4 animate-scale-in">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                      {match.emoji || '🎯'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-white text-lg">{match.title}</h3>
                          <p className="text-sm text-dark-400 flex items-center gap-1">
                            <FiMapPin className="w-3 h-3" />
                            {match.location?.address || 'Location TBA'} • {fmtDistance(match.distance)}
                          </p>
                        </div>
                        <span className="badge-lime flex items-center gap-1">
                          <FiTarget className="w-3 h-3" />
                          {match.matchScore}%
                        </span>
                      </div>

                      {/* People */}
                      {match.participants.length > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex -space-x-2">
                            {match.participants.slice(0, 5).map((person, idx) => (
                              <RoundAvatar
                                key={idx}
                                name={person.name}
                                src={person.avatar}
                                gradient={PALETTE[idx % PALETTE.length]}
                                className="w-8 h-8 text-xs border-2 border-dark-900"
                              />
                            ))}
                          </div>
                          <span className="text-sm text-dark-400">
                            {match.participants.slice(0, 3).map((p) => p.name).join(', ')}
                            {match.participants.length > 3 ? ` +${match.participants.length - 3} more` : ''} ready
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-sm text-dark-400 mb-3">
                        <span className="flex items-center gap-1">
                          <FiUsers className="w-3 h-3" />
                          {match.participants.length}/{match.maxParticipants}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {match.time ? new Date(match.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Soon'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => joins(match)}
                          className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                          {match.joined ? <FiCheck className="w-4 h-4" /> : <FiZap className="w-4 h-4" />}
                          {match.joined ? 'View Activity' : "KIKY!"}
                        </button>
                        <button onClick={() => dismiss(match._id)} className="btn-outline px-4">
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State when not active */}
      {!isActive && (
        <div className="text-center py-8">
          <span className="text-6xl mb-4 block">⚡</span>
          <h3 className="text-xl font-bold text-white mb-2">Ready when you are</h3>
          <p className="text-dark-400">
            {hasLocation ? 'Tap the button above to find people nearby' : 'Add your location in Settings to search nearby'}
          </p>
        </div>
      )}
    </div>
  );
};

export default LetsGoNowPage;