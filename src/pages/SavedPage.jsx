import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiBookmark, FiCalendar, FiMapPin, FiUsers, FiTarget,
  FiX, FiExternalLink, FiClock, FiMessageCircle
} from 'react-icons/fi';
import { normalizeActivity, getMatchScore } from '../utils/normalize';
import { RoundAvatar } from '../components/common';
import api from '../api';

const PLACE_EMOJI = {
  coffee: '☕', food: '🍽️', walking: '🌳', running: '🌳', travel: '🌳',
  gym: '🏋️', movies: '🎬', cricket: '🏏', gaming: '🎮', art: '🎨',
  'default': '📍',
};

const SavedPage = () => {
  const [savedActivities, setSavedActivities] = useState([]);
  const [savedRaw, setSavedRaw] = useState([]);
  const [connections, setConnections] = useState([]);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activities');

  const loadSaved = () => {
    return api.get('/api/activities?saved=1')
      .then((res) => {
        const raw = res.data.activities || [];
        setSavedRaw(raw);
        const list = raw.map((a) => {
          const n = normalizeActivity(a);
          return {
            id: n.id,
            title: n.title,
            category: n.category,
            emoji: n.emoji,
            distance: n.distanceLabel,
            date: n.time,
            participants: `${n.participants}/${n.maxParticipants}`,
            match: getMatchScore(n),
            host: n.host,
            savedDate: 'Recently',
          };
        });
        setSavedActivities(list);
        return raw;
      })
      .catch(() => []);
  };

  useEffect(() => {
    Promise.all([
      loadSaved(),
      api.get('/api/users/me/connections').catch(() => ({ data: { connections: [] } })),
    ]).then(([raw, conns]) => {
      setConnections(conns.data.connections || []);
      // Derive saved places from the locations of bookmarked activities
      const groups = {};
      for (const a of raw) {
        const address = (a.location?.address || '').trim();
        if (!address || address === 'Location TBA') continue;
        const key = address.toLowerCase();
        groups[key] = groups[key] || { address, emoji: '📍', count: 0, cats: {} };
        groups[key].count += 1;
        groups[key].cats[a.category] = (groups[key].cats[a.category] || 0) + 1;
      }
      setSavedPlaces(
        Object.values(groups).map((g) => {
          const dominant = Object.entries(g.cats).sort((x, y) => y[1] - x[1])[0]?.[0];
          return { address: g.address, emoji: PLACE_EMOJI[dominant] || PLACE_EMOJI.default, count: g.count, domain: dominant };
        })
      );
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeSaved = async (id) => {
    const prev = savedActivities;
    setSavedActivities(savedActivities.filter(a => a.id !== id));
    try {
      await api.post(`/api/activities/${id}/save`);
    } catch (e) {
      setSavedActivities(prev);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Saved
        </h1>
        <p className="text-dark-400">Your bookmarked activities and places</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'activities', label: 'Activities' },
          { id: 'people', label: 'People' },
          { id: 'places', label: 'Places' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activities */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          {loading ? (
            <div className="card p-8 text-center text-dark-400">Loading your saved activities...</div>
          ) : (
            savedActivities.map((activity) => (
              <div key={activity.id} className="card-glow flex flex-col sm:flex-row gap-4 p-4 group">
                <div className="w-full sm:w-20 h-20 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                  {activity.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-dark-400 capitalize">by {activity.host}</p>
                    </div>
                    <button
                      onClick={() => removeSaved(activity.id)}
                      className="p-1 text-dark-400 hover:text-red-400 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400 mb-3">
                    <span className="flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {activity.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      {activity.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiUsers className="w-3 h-3" />
                      {activity.participants}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="badge-lime flex items-center gap-1">
                        <FiTarget className="w-3 h-3" />
                        {activity.match}%
                      </span>
                      <span className="text-xs text-dark-400 flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        Saved {activity.savedDate}
                      </span>
                    </div>
                    <Link
                      to={`/activities/${activity.id}`}
                      className="btn-primary text-sm flex items-center gap-1"
                    >
                      View <FiExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}

          {!loading && savedActivities.length === 0 && (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">🔖</span>
              <h3 className="text-xl font-bold text-white mb-2">No saved activities</h3>
              <p className="text-dark-400 mb-6">Bookmark activities to save them for later</p>
              <Link to="/explore" className="btn-primary">
                Explore Activities
              </Link>
            </div>
          )}
        </div>
      )}

      {/* People */}
      {activeTab === 'people' && (
        <div>
          {loading ? (
            <div className="card p-8 text-center text-dark-400">Loading your people...</div>
          ) : connections.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">👥</span>
              <h3 className="text-xl font-bold text-white mb-2">No connections yet</h3>
              <p className="text-dark-400 mb-6">Connect with people to see them here</p>
              <Link to="/people" className="btn-primary">
                Discover People
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {connections.map((person) => (
                <div key={person._id} className="card-glow flex flex-wrap items-center gap-4 p-4">
                  <div className="relative flex-shrink-0">
                    <RoundAvatar
                      name={person.name}
                      src={person.avatar}
                      className="w-12 h-12"
                    />
                    {person.status?.current !== 'offline' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-dark-900" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white">{person.name}</h3>
                    <p className="text-xs text-dark-400 truncate">
                      {person.location?.address || 'No location set'}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(person.interests || []).slice(0, 3).map((i) => (
                        <span key={i} className="badge-lime text-xs">{i}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
                    <Link to={`/chat/${person._id}`} className="btn-icon">
                      <FiMessageCircle className="w-5 h-5" />
                    </Link>
                    <Link to={`/people`} className="btn-primary text-sm px-4 py-2">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Places */}
      {activeTab === 'places' && (
        <div>
          {loading ? (
            <div className="card p-8 text-center text-dark-400">Loading your places...</div>
          ) : savedPlaces.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">📍</span>
              <h3 className="text-xl font-bold text-white mb-2">No saved places</h3>
              <p className="text-dark-400 mb-6">The locations of your bookmarked activities appear here</p>
              <Link to="/explore" className="btn-primary">
                Explore Activities
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {savedPlaces.map((place) => (
                <div key={place.address} className="card-glow p-5 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-dark-800 flex items-center justify-center text-3xl flex-shrink-0">
                    {place.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{place.address}</h3>
                    <p className="text-xs text-dark-400 mt-1">
                      {place.count} saved {place.count === 1 ? 'activity' : 'activities'} here
                    </p>
                  </div>
                  <Link to="/nearby" className="btn-outline text-xs px-3 py-2 flex items-center gap-1 flex-shrink-0">
                    <FiMapPin className="w-3 h-3" />
                    Places
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedPage;