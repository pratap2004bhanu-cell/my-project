import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiTarget, FiTrendingUp, FiUsers, FiMapPin, 
  FiCalendar, FiArrowRight, FiZap, FiStar,
  FiFilter, FiRefreshCw, FiCheck, FiHeart
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { normalizeActivity, getMatchScore } from '../utils/normalize';
import api from '../api';

const haversineKm = (la1, lo1, la2, lo2) => {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(la2 - la1);
  const dLng = toRad(lo2 - lo1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(la1)) * Math.cos(toRad(la2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const GRADIENTS = ['from-lime-500 to-emerald-500', 'from-pink-500 to-rose-500', 'from-electric-500 to-cyan-500', 'from-purple-500 to-violet-500', 'from-sunset-500 to-orange-500'];
const gradientFor = (name) => GRADIENTS[(name || '?').charCodeAt(0) % GRADIENTS.length];

const MatchingPage = () => {
  const { user } = useAuth();
  const [matchType, setMatchType] = useState('activities');
  const [matchedActivities, setMatchedActivities] = useState([]);
  const [matchedPeople, setMatchedPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState({});
  const [liked, setLiked] = useState({});

  const myInterests = (user?.interests || []).map((i) => i.toLowerCase());
  const myDays = user?.status?.days || [];
  const myCoords = user?.location?.coordinates || null;

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/activities'),
      api.get(`/api/users/match/${user?.id}`),
    ]).then(([a, p]) => {
      const myLat = myCoords ? myCoords[1] : null;
      const myLng = myCoords ? myCoords[0] : null;

      const activities = (a.data.activities || [])
        .map(normalizeActivity)
        .filter((x) => x.participants < x.maxParticipants)
        .map((x) => {
          let score = getMatchScore(x);
          if (myInterests.includes(x.category)) score += 4;
          if (x.dateRaw && myDays.includes(new Date(x.dateRaw).toLocaleDateString('en-US', { weekday: 'short' }))) score += 2;
          score = Math.min(99, score);
          return { ...x, score };
        })
        .sort((x, y) => y.score - x.score)
        .slice(0, 6)
        .map((x) => {
          const reasons = [];
          if (myInterests.includes(x.category)) reasons.push(`Matches your ${x.category} interest`);
          if (x.dateRaw) {
            const day = new Date(x.dateRaw).toLocaleDateString('en-US', { weekday: 'short' });
            if (myDays.includes(day)) reasons.push(`Free on ${day}s`);
          }
          if (x.distanceLabel && x.distanceLabel !== 'Location TBA') reasons.push(`${x.distanceLabel} away`);
          if (x.score >= 90) reasons.push('Great community size');
          while (reasons.length < 2) reasons.push('Recommended for you');
          return {
            id: x.id,
            title: x.title,
            category: x.category,
            emoji: x.emoji,
            matchScore: x.score,
            reasons: reasons.slice(0, 3),
            distance: x.distanceLabel,
            time: x.time,
            participants: `${x.participants}/${x.maxParticipants}`,
            host: x.host,
          };
        });

      const people = (p.data.matches || []).map((person) => {
        const sharedInterests = (person.interests || []).filter((i) => myInterests.includes(String(i).toLowerCase()));
        let distance = null;
        const c = person.location?.coordinates;
        if (myLat != null && c) distance = haversineKm(myLat, myLng, c[1], c[0]);
        const daysOverlap = myDays.filter((d) => (person.status?.days || []).includes(d)).length;
        let compat = 55 + sharedInterests.length * 8 + Math.min(person.stats?.activitiesJoined || 0, 5);
        if (person.stats?.rating > 0) compat += 3;
        compat = Math.min(99, Math.round(compat));
        const factors = [
          { factor: 'Shared Interests', score: Math.min(99, 40 + sharedInterests.length * 15) },
          { factor: 'Activity Overlap', score: Math.min(99, 40 + Math.min(person.stats?.activitiesJoined || 0, 6) * 9) },
          { factor: 'Location Proximity', score: distance != null ? Math.max(40, 99 - Math.round(distance * 10)) : 70 },
          { factor: 'Schedule Compatibility', score: daysOverlap > 0 ? Math.min(99, 50 + daysOverlap * 15) : 60 },
        ];
        return {
          id: person._id,
          name: person.name,
          avatar: person.avatar || person.name?.charAt(0),
          gradient: gradientFor(person.name),
          compatibility: compat,
          sharedInterests: sharedInterests.slice(0, 4),
          matchReasons: factors,
          distance: distance != null ? (distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)} km`) : 'Nearby',
          activities: person.stats?.activitiesJoined || 0,
        };
      }).sort((x, y) => y.compatibility - x.compatibility);

      setMatchedActivities(activities);
      setMatchedPeople(people);
    }).catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const connect = async (id) => {
    try {
      await api.post(`/api/users/${id}/friend`);
      setConnected((c) => ({ ...c, [id]: true }));
    } catch (e) {}
  };

  const likeUser = async (id) => {
    try {
      const res = await api.post(`/api/users/${id}/like`);
      setLiked((l) => ({ ...l, [id]: true }));
      if (res.data.matched) {
        setConnected((c) => ({ ...c, [id]: true }));
        alert('It is a match! Go say hi in chat.');
      }
    } catch (e) {}
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Smart Matching
          </h1>
          <p className="text-dark-400">Find your perfect matches based on interests and availability</p>
        </div>
        <button onClick={load} className="btn-outline flex items-center gap-2">
          <FiRefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Match Type Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMatchType('activities')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            matchType === 'activities'
              ? 'bg-lime-500 text-dark-900 font-semibold'
              : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
          }`}
        >
          <FiTarget className="w-4 h-4" />
          Activity Matches
        </button>
        <button
          onClick={() => setMatchType('people')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            matchType === 'people'
              ? 'bg-lime-500 text-dark-900 font-semibold'
              : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
          }`}
        >
          <FiUsers className="w-4 h-4" />
          People Matches
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-dark-400">Finding your matches...</div>
      ) : matchType === 'activities' ? (
        matchedActivities.length > 0 ? (
          <div className="space-y-4">
            {matchedActivities.map((activity) => (
              <Link
                key={activity.id}
                to={`/activities/${activity.id}`}
                className="card-glow flex flex-col sm:flex-row gap-4 p-4 block group"
              >
                {/* Match Score Circle */}
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 flex flex-col items-center justify-center text-dark-900">
                    <span className="text-2xl font-bold">{activity.matchScore}</span>
                    <span className="text-[10px] font-medium">MATCH</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{activity.emoji}</span>
                      <div>
                        <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors text-lg">
                          {activity.title}
                        </h3>
                        <p className="text-sm text-dark-400">by {activity.host}</p>
                      </div>
                    </div>
                  </div>

                  {/* Match Reasons */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {activity.reasons.map((reason, idx) => (
                      <span key={idx} className="badge-lime text-xs flex items-center gap-1">
                        <FiZap className="w-3 h-3" />
                        {reason}
                      </span>
                    ))}
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
                    <span className="flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {activity.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3" />
                      {activity.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiUsers className="w-3 h-3" />
                      {activity.participants}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <div className="flex items-center">
                  <span className="btn-primary text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    JOIN <FiArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🎯</span>
            <h3 className="text-xl font-bold text-white mb-2">No matches found</h3>
            <p className="text-dark-400 mb-6">Try joining open activities or update your interests</p>
            <Link to="/explore" className="btn-primary">Explore Activities</Link>
          </div>
        )
      ) : (
        matchedPeople.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matchedPeople.map((person) => (
              <div key={person.id} className="card-glow p-6">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${person.gradient} flex items-center justify-center text-white text-xl font-bold overflow-hidden`}>
                    {person.avatar && typeof person.avatar === 'string' && person.avatar.startsWith('/') ? (
                      <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                    ) : (
                      person.avatar
                    )}
                  </div>
                  <div>
                    <Link to={`/users/${person.id}`} className="font-bold text-white text-lg hover:text-lime-400 transition-colors">
                      {person.name}
                    </Link>
                    <p className="text-sm text-dark-400 flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {person.distance}
                    </p>
                  </div>
                </div>

                {/* Compatibility Score */}
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-lime-500/20 to-emerald-500/20 rounded-xl">
                    <FiTarget className="w-5 h-5 text-lime-400" />
                    <span className="text-3xl font-bold text-lime-400">{person.compatibility}%</span>
                  </div>
                  <p className="text-sm text-dark-400 mt-2">Compatibility Score</p>
                </div>

                {/* Match Factors */}
                <div className="space-y-2 mb-4">
                  {person.matchReasons.map((reason, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-dark-300">{reason.factor}</span>
                        <span className="text-lime-400 font-semibold">{reason.score}%</span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full"
                          style={{ width: `${reason.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shared Interests */}
                {person.sharedInterests.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-dark-400 mb-2">Shared Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {person.sharedInterests.map((interest) => (
                        <span key={interest} className="badge-lime text-xs capitalize">{interest}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => likeUser(person.id)}
                    disabled={liked[person.id] || connected[person.id]}
                    className={`flex-1 text-sm flex items-center justify-center gap-2 py-2 rounded-xl transition-all ${
                      liked[person.id]
                        ? 'bg-pink-500/20 text-pink-400'
                        : 'btn-outline hover:border-pink-500/50 hover:text-pink-400'
                    }`}
                  >
                    <FiHeart className={`w-4 h-4 ${liked[person.id] ? 'fill-current' : ''}`} />
                    {liked[person.id] ? 'Liked' : 'Like'}
                  </button>
                  <button
                    onClick={() => connect(person.id)}
                    disabled={connected[person.id]}
                    className={`flex-1 text-sm flex items-center justify-center gap-2 ${
                      connected[person.id] ? 'btn-outline opacity-60' : 'btn-primary'
                    }`}
                  >
                    {connected[person.id] ? <><FiCheck className="w-4 h-4" /> Connected</> : 'Connect'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🎯</span>
            <h3 className="text-xl font-bold text-white mb-2">No matches found</h3>
            <p className="text-dark-400 mb-6">Add interests to your profile to find like-minded people</p>
            <button className="btn-primary">Update Preferences</button>
          </div>
        )
      )}
    </div>
  );
};

export default MatchingPage;