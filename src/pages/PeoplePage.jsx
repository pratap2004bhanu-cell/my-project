import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiHeart, FiMapPin, FiTarget, FiUsers, FiMessageCircle,
  FiUserPlus, FiCheck, FiArrowRight, FiStar
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { normalizeUser } from '../utils/normalize';
import { RoundAvatar } from '../components/common';

const PeoplePage = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('suggestions');
  const [people, setPeople] = useState([]);
  const [connections, setConnections] = useState(() => (user?.friends || []).map(String));
  const [liked, setLiked] = useState({});
  const [busyTarget, setBusyTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requests, setRequests] = useState([]);
  const [requestedIds, setRequestedIds] = useState(() => (user?.requestsSent || []).map(String));

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        let fetched;
        const pos = await new Promise((resolve) => {
          if (!navigator.geolocation) return resolve(null);
          navigator.geolocation.getCurrentPosition(
            (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve(null),
            { timeout: 4000 }
          );
        });

        if (pos) {
          const res = await api.get('/api/users/nearby', { params: { lat: pos.lat, lng: pos.lng, radius: 25 } });
          fetched = res.data.people || [];
        } else {
          const res = await api.get(`/api/users/match/${user?.id}`);
          fetched = res.data.matches || [];
        }
        if (cancelled) return;
        setPeople(fetched.map((p) => {
          const n = normalizeUser(p, { distance: p.distance });
          const shared = (user?.interests || []).filter((i) => (n.interests || []).includes(i)).length;
          if (n.requestSent) setRequestedIds((prev) => (prev.includes(String(n.id)) ? prev : [...prev, String(n.id)]));
          return {
            ...n,
            compatibility: Math.min(99, 55 + shared * 12),
            activities: n.activitiesCount,
            rating: n.rating ? n.rating.toFixed(1) : 'New',
            mutualConnections: 0,
            isFriend: n.isFriend,
            requestSent: n.requestSent,
            requestReceived: n.requestReceived,
          };
        }));
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || 'Failed to load people');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    api.get('/api/users/me/connection-requests')
      .then((res) => {
        if (cancelled) return;
        setRequests((res.data.requests || []).map((r) => normalizeUser(r)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const friends = connections;

  const filteredPeople = filter === 'suggestions'
    ? people
    : filter === 'connected'
      ? people.filter((p) => friends.includes(String(p.id)))
      : people.filter((p) => !friends.includes(String(p.id)));

  const handleConnect = async (personId) => {
    const pid = String(personId);
    if (friends.includes(pid) || requestedIds.includes(pid) || busyTarget === personId) return;
    setBusyTarget(personId);
    setRequestedIds((prev) => (prev.includes(pid) ? prev : [...prev, pid]));
    try {
      const res = await api.post(`/api/users/${personId}/friend`);
      if (res.data.alreadyFriends) {
        setConnections((prev) => (prev.includes(pid) ? prev : [...prev, pid]));
      }
    } catch (err) {
      setRequestedIds((prev) => prev.filter((id) => id !== pid));
      alert(err?.response?.data?.error || 'Could not send request');
    } finally {
      setBusyTarget(null);
    }
  };

  const handleCancelRequest = async (personId) => {
    const pid = String(personId);
    if (busyTarget === personId) return;
    setBusyTarget(personId);
    setRequestedIds((prev) => prev.filter((id) => id !== pid));
    try {
      await api.delete(`/api/users/${personId}/friend`);
    } catch (err) {
      setRequestedIds((prev) => (prev.includes(pid) ? prev : [...prev, pid]));
    } finally {
      setBusyTarget(null);
    }
  };

  const handleAccept = async (person) => {
    const pid = String(person.id);
    if (busyTarget === pid) return;
    setBusyTarget(pid);
    try {
      await api.post(`/api/users/${pid}/friend/accept`);
      setRequests((prev) => prev.filter((r) => String(r.id) !== pid));
      setConnections((prev) => (prev.includes(pid) ? prev : [...prev, pid]));
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not accept request');
    } finally {
      setBusyTarget(null);
    }
  };

  const handleDecline = async (person) => {
    const pid = String(person.id);
    if (busyTarget === pid) return;
    setBusyTarget(pid);
    try {
      await api.post(`/api/users/${pid}/friend/decline`);
      setRequests((prev) => prev.filter((r) => String(r.id) !== pid));
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not decline request');
    } finally {
      setBusyTarget(null);
    }
  };

  const handleLike = async (personId) => {
    const pid = String(personId);
    if (liked[personId] || friends.includes(pid) || busyTarget === personId) return;
    setLiked((prev) => ({ ...prev, [personId]: true }));
    setBusyTarget(personId);
    try {
      const res = await api.post(`/api/users/${personId}/like`);
      if (res.data.matched) {
        setConnections((prev) => (prev.includes(pid) ? prev : [...prev, pid]));
        alert('It is a match! You can now chat with them.');
      }
    } catch (err) {
      setLiked((prev) => ({ ...prev, [personId]: false }));
      alert(err?.response?.data?.error || 'Could not like');
    } finally {
      setBusyTarget(null);
    }
  };

  const handleUnfriend = async (personId, personName) => {
    const pid = String(personId);
    if (busyTarget === personId) return;
    if (!window.confirm(`Remove ${personName} from your connections?`)) return;
    setBusyTarget(personId);
    setConnections((prev) => prev.filter((id) => id !== pid));
    try {
      await api.delete(`/api/users/${personId}/friend`);
    } catch (err) {
      setConnections((prev) => (prev.includes(pid) ? prev : [...prev, pid]));
      alert(err?.response?.data?.error || 'Could not remove connection');
    } finally {
      setBusyTarget(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Discover People
          </h1>
          <p className="text-dark-400">Find people with similar interests nearby</p>
        </div>
        <div className="flex items-center gap-2">
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'suggestions', name: 'Suggestions', icon: FiTarget },
          { id: 'connected', name: 'Connected', icon: FiHeart },
          { id: 'pending', name: 'Pending', icon: FiUserPlus },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              filter === tab.id
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {/* People Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-400">Finding compatible people...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">⚠️</span>
          <h3 className="text-xl font-bold text-white mb-2">Couldn't load people</h3>
          <p className="text-dark-400 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
      ) : filter === 'pending' ? (
        requests.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">📥</span>
            <h3 className="text-xl font-bold text-white mb-2">No pending requests</h3>
            <p className="text-dark-400">When someone wants to connect, their request shows up here.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map((person) => (
              <div key={person.id} className="card-glow p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <RoundAvatar
                      name={person.name}
                      src={person.avatar}
                      gradient="from-lime-500 via-electric-500 to-hotpink-500"
                      className="w-16 h-16 text-xl"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg">{person.name}</h3>
                    <p className="text-sm text-dark-400 flex items-center gap-1">
                      <FiMapPin className="w-3 h-3" />
                      {person.location || 'Nearby'}
                    </p>
                  </div>
                </div>
                <p className="text-dark-300 text-sm mb-4 line-clamp-2">{person.bio || 'No bio yet.'}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(person.interests || []).slice(0, 3).map((interest) => (
                    <span key={interest} className="badge-lime text-xs">{interest}</span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(person)}
                    disabled={busyTarget === person.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiCheck className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleDecline(person)}
                    disabled={busyTarget === person.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all btn-outline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Decline
                  </button>
                  <Link to={`/chat/${person.id}`} className="btn-icon">
                    <FiMessageCircle className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPeople.map((person) => (
          <div key={person.id} className="card-glow p-6">
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="relative">
                <RoundAvatar
                  name={person.name}
                  src={person.avatar}
                  gradient="from-lime-500 via-electric-500 to-hotpink-500"
                  className="w-16 h-16 text-xl"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-dark-900"></div>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">{person.name}</h3>
                <p className="text-sm text-dark-400 flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" />
                  {person.location}{person.distance ? ` • ${person.distance}` : ''}
                </p>
              </div>
            </div>

            {/* Compatibility */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-dark-800/50 rounded-xl">
              <FiTarget className="w-5 h-5 text-lime-400" />
              <span className="text-lg font-bold text-lime-400">{person.compatibility}%</span>
              <span className="text-sm text-dark-400">compatible</span>
            </div>

            {/* Bio */}
            <p className="text-dark-300 text-sm mb-4 line-clamp-2">{person.bio || 'No bio yet.'}</p>

            {/* Interests */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(person.interests || []).map((interest) => (
                <span key={interest} className="badge-lime text-xs">
                  {interest}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
              <span className="flex items-center gap-1">
                <FiUsers className="w-4 h-4" />
                {person.activities} activities
              </span>
              <span className="flex items-center gap-1">
                <FiStar className="w-4 h-4 text-amber-400" />
                {person.rating}
              </span>
              <span className="flex items-center gap-1">
                <FiHeart className="w-4 h-4 text-pink-400" />
                {person.mutualConnections} mutual
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {friends.includes(person.id) ? (
                <>
                  <button
                    onClick={() => handleUnfriend(person.id, person.name)}
                    disabled={busyTarget === person.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiUserPlus className="w-4 h-4 -rotate-45" />
                    Unfriend
                  </button>
                  <Link
                    to={`/chat/${person.id}`}
                    className="btn-icon"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                  </Link>
                </>
              ) : requestedIds.includes(person.id) ? (
                <>
                  <button
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold bg-lime-500/15 text-lime-400 border border-lime-500/40"
                  >
                    <FiCheck className="w-4 h-4" />
                    Request Sent
                  </button>
                  <button
                    onClick={() => handleCancelRequest(person.id)}
                    disabled={busyTarget === person.id}
                    className="btn-outline px-3 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <Link
                    to={`/chat/${person.id}`}
                    className="btn-icon"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleLike(person.id)}
                    disabled={liked[person.id] || busyTarget === person.id}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all ${
                      liked[person.id]
                        ? 'bg-pink-500/20 text-pink-400 border border-pink-500/40'
                        : 'btn-outline'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <FiHeart className={`w-4 h-4 ${liked[person.id] ? 'fill-current' : ''}`} />
                    {liked[person.id] ? 'Liked' : 'Like'}
                  </button>
                  <button
                    onClick={() => handleConnect(person.id)}
                    disabled={busyTarget === person.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold transition-all btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiUserPlus className="w-4 h-4" />
                    Connect
                  </button>
                  <Link
                    to={`/chat/${person.id}`}
                    className="btn-icon"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredPeople.length === 0 && (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">👥</span>
          <h3 className="text-xl font-bold text-white mb-2">No people to show</h3>
          <p className="text-dark-400 mb-6">
            {filter === 'connected'
              ? 'Start connecting with people to see them here'
              : filter === 'pending'
                ? 'No pending connection requests right now'
                : 'Check back later for new suggestions'
            }
          </p>
          {filter === 'connected' && (
            <button onClick={() => setFilter('suggestions')} className="btn-primary">
              Discover People
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PeoplePage;