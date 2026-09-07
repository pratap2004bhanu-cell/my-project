import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiArrowRight, FiMapPin, FiUsers, FiCalendar, 
  FiZap, FiPlus
} from 'react-icons/fi';
import api from '../api';
import { normalizeActivity, normalizeUser } from '../utils/normalize';
import { hasRealCoords, getPosition, browserPos } from '../utils/location';

const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [happeningNearYou, setHappeningNearYou] = useState([]);
  const [recommendedForYou, setRecommendedForYou] = useState([]);
  const [peopleYouMayLike, setPeopleYouMayLike] = useState([]);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const profileCoords = user?.location?.coordinates;
      const pos = await getPosition(user);

      const actRes = pos
        ? await api.get('/api/activities', { params: { nearby: 1, lat: pos.lat, lng: pos.lng, radius: 25 } })
        : await api.get('/api/activities');
      const acts = ((actRes.data.activities || []).map(normalizeActivity))
        .filter((a) => a.status === 'upcoming' || a.status === 'ongoing');
      setHappeningNearYou(acts.slice(0, 3));
      setRecommendedForYou(acts.slice(3, 6));
      setNeedsLocation(!pos);

      if (pos && !hasRealCoords(profileCoords)) {
        // Persist the browser location so future logins show nearby activities
        updateUser({
          location: {
            type: 'Point',
            coordinates: [pos.lng, pos.lat],
            address: profileCoords ? '' : 'My current location',
          },
          privacy: { ...(user?.privacy || {}), showLocation: true },
        }).catch(() => {});
      }

      if (pos) {
        const pplRes = await api.get('/api/users/nearby', {
          params: { lat: pos.lat, lng: pos.lng, radius: 25 },
        });
        setPeopleYouMayLike((pplRes.data.people || []).map((p) => {
          const n = normalizeUser(p);
          return { ...n, compatibility: 60 + (n.name.length % 35) };
        }).slice(0, 3));
      }
    } catch (err) {
      // Dashboard renders empty states gracefully; no hard error UI needed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleShareLocation = async () => {
    setSavingLocation(true);
    const pos = await browserPos();
    if (!pos) {
      setSavingLocation(false);
      alert('Could not get your location. Please allow location access and try again, or set it in Settings.');
      return;
    }
    const ok = await updateUser({
      location: {
        type: 'Point',
        coordinates: [pos.lng, pos.lat],
        address: 'My current location',
      },
      privacy: { ...(user?.privacy || {}), showLocation: true },
    });
    setSavingLocation(false);
    if (ok.success) load();
  };

  const quickActions = [
    { emoji: '🏏', name: 'Cricket', color: 'from-green-500 to-emerald-600' },
    { emoji: '☕', name: 'Coffee', color: 'from-amber-500 to-orange-600' },
    { emoji: '🎮', name: 'Gaming', color: 'from-violet-500 to-purple-600' },
    { emoji: '🏋️', name: 'Gym', color: 'from-red-500 to-pink-600' },
    { emoji: '🎬', name: 'Movie', color: 'from-pink-500 to-rose-600' },
    { emoji: '🚶', name: 'Walking', color: 'from-teal-500 to-cyan-600' },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/15 text-lime-300 text-[11px] font-semibold uppercase tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
              Live
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-electric-500/15 text-electric-300 text-[11px] font-semibold uppercase tracking-widest">
              Nearby
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-extrabold text-white leading-tight">
            Good morning,{' '}
            <span className="gradient-text">{user?.name?.split(' ')[0]}</span>{' '}
            👋
          </h1>
          <p className="text-dark-400 mt-2">Let's find something fun happening near you today</p>
        </div>
        <button
          onClick={() => navigate('/create-activity')}
          className="btn-primary hidden sm:flex items-center gap-2 text-sm px-5 py-3 flex-shrink-0"
        >
          <FiPlus className="w-4 h-4" />
          Create Activity
        </button>
      </div>

      {/* Location prompt for new users without a saved location */}
      {needsLocation && (
        <div className="card p-5 mb-8 flex flex-col sm:flex-row sm:items-center gap-4 border border-lime-500/30">
          <div className="w-12 h-12 rounded-2xl bg-lime-500/15 flex items-center justify-center flex-shrink-0">
            <FiMapPin className="w-6 h-6 text-lime-400" />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-white">See what's happening near you</h2>
            <p className="text-sm text-dark-400 mt-0.5">
              Share your location to find activities and people in your area.
            </p>
          </div>
          <button
            onClick={handleShareLocation}
            disabled={savingLocation}
            className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 disabled:opacity-60"
          >
            <FiMapPin className="w-4 h-4" />
            {savingLocation ? 'Locating...' : 'Use My Location'}
          </button>
        </div>
      )}

      {/* KIKY Now Card - cleaner gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-lime-500 via-electric-500 to-hotpink-500 p-[1.5px] mb-12">
        <div className="relative bg-dark-900 rounded-[calc(1.5rem-1.5px)] p-8 lg:p-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-lime-500/15 rounded-full blur-[80px]"></div>
          <div className="relative flex flex-col lg:flex-row items-center gap-6">
            <div className="flex-1">
              <h2 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
                KIKY Now! 🚀
              </h2>
              <p className="text-dark-300">Find people for activities happening right now</p>
            </div>
            <button onClick={() => navigate('/kiky')} className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              <FiZap className="w-5 h-5" />
              Start Now
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-12">
        <h2 className="text-base font-semibold text-white mb-5">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.slice(0, 4).map((action) => (
            <Link
              key={action.name}
              to={`/create-activity?category=${action.name.toLowerCase()}`}
              className="flex items-center gap-4 p-5 rounded-2xl glass-strong hover-lift group"
            >
              <span className="text-3xl group-hover:scale-125 transition-transform">{action.emoji}</span>
              <span className="text-sm text-white/85 font-medium">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Happening Near You */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Happening near you</h2>
              <Link to="/explore" className="text-sm text-lime-400 hover:text-lime-300 font-medium flex items-center gap-1">
                See all <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center gap-3 p-4 text-dark-400 text-sm">
                  <div className="w-5 h-5 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                  Loading nearby activities...
                </div>
              ) : happeningNearYou.length === 0 ? (
                <p className="text-dark-400 text-sm p-2">No upcoming activities yet. Create one to get started!</p>
              ) : happeningNearYou.map((activity) => (
                <Link
                  key={activity.id}
                  to={`/activities/${activity.id}`}
                  className="flex items-center gap-5 p-5 rounded-2xl glass-strong hover-lift"
                >
                  <div className={`w-12 h-12 bg-gradient-to-br ${activity.color} rounded-2xl flex items-center justify-center text-2xl flex-shrink-0`}>
                    {activity.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-white truncate min-w-0">{activity.title}</h3>
                      <span className="text-lime-400 text-xs font-medium flex-shrink-0">{activity.match}% match</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-dark-400">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <FiMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate max-w-36">{activity.distanceLabel}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5" />
                        {activity.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FiUsers className="w-3.5 h-3.5" />
                        {activity.participants}/{activity.maxParticipants}
                      </span>
                    </div>
                  </div>
                  <span className="text-lime-400 text-sm font-semibold flex-shrink-0">Join →</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recommended For You */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-white">Recommended for you</h2>
              <Link to="/explore" className="text-sm text-lime-400 hover:text-lime-300 font-medium flex items-center gap-1">
                See all <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-5">
              {loading ? (
                <p className="text-dark-400 text-sm p-2 col-span-3 flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                  Loading recommendations...
                </p>
              ) : recommendedForYou.length === 0 ? (
                <p className="text-dark-400 text-sm p-2 col-span-3">More suggestions will appear here.</p>
              ) : recommendedForYou.map((activity) => (
                <Link
                  key={activity.id}
                  to={`/activities/${activity.id}`}
                  className="glass-strong p-5 rounded-2xl hover-lift"
                >
                  <div className={`w-full h-20 bg-gradient-to-br ${activity.color} rounded-xl flex items-center justify-center text-3xl mb-4`}>
                    {activity.emoji}
                  </div>
                  <h3 className="font-semibold text-white mb-1.5 truncate">{activity.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-dark-400 min-w-0">
                    <FiMapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{activity.distanceLabel}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mt-3 pt-3 border-t border-white/10">
                    <span className="flex items-center gap-1.5 text-sm text-dark-400">
                      <FiUsers className="w-3.5 h-3.5" />
                      {activity.participants} joined
                    </span>
                    <span className="text-lime-400 text-sm font-medium">{activity.match}%</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* People You May Like */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-5">People you may like</h2>
            
            <div className="space-y-5">
              {peopleYouMayLike.length === 0 ? (
                <p className="text-dark-400 text-sm">
                  {loading ? 'Finding people near you...' : 'No people nearby yet. Check back soon!'}
                </p>
              ) : peopleYouMayLike.map((person) => (
                <div key={person.id} className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {person.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{person.name}</p>
                    <p className="text-xs text-dark-400 truncate mt-0.5">{(person.interests || []).join(' • ') || 'Exploring'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-dark-400">{person.distance || person.location}</span>
                      <span className="text-xs text-lime-400">{person.compatibility}% match</span>
                    </div>
                  </div>
                  <Link to={`/chat/${person.id}`} className="btn-icon w-10 h-10">
                    <FiPlus className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
            
            <Link to="/explore" className="block text-center text-sm text-lime-400 hover:text-lime-300 font-medium mt-6">
              Discover more people
            </Link>
          </div>

          {/* Your Stats */}
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-5">Your journey</h2>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-6">
              {[
                { label: 'Activities', value: user?.stats?.activitiesJoined ?? 0, icon: '🎯' },
                { label: 'Connections', value: user?.stats?.connections ?? 0, icon: '🤝' },
                { label: 'Streak', value: user?.stats?.streak ?? 0, icon: '🔥' },
                { label: 'Rating', value: user?.stats?.rating ? `${user.stats.rating}⭐` : 'New', icon: '⭐' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <span className="text-2xl">{stat.icon}</span>
                  <p className="text-xl font-bold text-white mt-2">{stat.value}</p>
                  <p className="text-xs text-dark-400 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;