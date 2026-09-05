import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiUsers, FiLock, FiPlus, FiUserMinus,
  FiMessageCircle, FiCalendar, FiMapPin
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { RoundAvatar } from '../components/common';

const CommunityPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const res = await api.get(`/api/communities/${id}`);
      setCommunity(res.data.community);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load community');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const joined = community?.members?.some((m) => String(m.user?._id || m.user) === String(user?.id));

  const handleToggle = async (join) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.post(`/api/communities/${community.id}/${join ? 'join' : 'leave'}`);
      if (join) {
        const detail = await api.get(`/api/communities/${community.id}`);
        setCommunity(detail.data.community);
      } else {
        setCommunity({ ...community, members: res.data.community?.members || [] });
        navigate('/communities');
      }
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not update membership');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto text-center py-16">
        <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-dark-400">Loading community...</p>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="p-4 lg:p-6 max-w-3xl mx-auto text-center py-16">
        <span className="text-6xl mb-4 block">👥</span>
        <h3 className="text-xl font-bold text-white mb-2">Community not found</h3>
        <p className="text-dark-400 mb-6">{error}</p>
        <button onClick={() => navigate('/communities')} className="btn-primary">Back to Communities</button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <button onClick={() => navigate('/communities')} className="flex items-center gap-2 text-dark-300 hover:text-white mb-4 transition-colors">
        <FiArrowLeft className="w-4 h-4" />
        All Communities
      </button>

      {/* Banner */}
      <div className="relative h-40 rounded-3xl bg-gradient-to-br from-lime-500 via-electric-500 to-hotpink-500 overflow-hidden mb-6">
        <span className="absolute inset-0 flex items-center justify-center text-7xl drop-shadow-lg">{community.emoji}</span>
        {!community.isPublic && (
          <span className="absolute top-4 right-4 p-2 bg-dark-900/50 rounded-xl">
            <FiLock className="w-4 h-4 text-white" />
          </span>
        )}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">{community.name}</h1>
          <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-dark-400">
            <span className="flex items-center gap-1">
              <FiUsers className="w-4 h-4" />
              {community.memberCount} members
            </span>
            {community.isPublic ? (
              <span className="px-2 py-0.5 bg-lime-500/20 text-lime-400 rounded-md text-xs font-medium">Public</span>
            ) : (
              <span className="px-2 py-0.5 bg-dark-800 rounded-md text-xs font-medium">Private</span>
            )}
            {community.creator && (
              <span className="text-xs text-dark-400">
                Created by <span className="text-white">{community.creator.name}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {joined ? (
            <>
              <Link to={`/communities/${community.id}/chat`} className="btn-primary flex items-center gap-2">
                <FiMessageCircle className="w-4 h-4" />
                Open Group Chat
              </Link>
              <button onClick={() => handleToggle(false)} disabled={busy} className="btn-outline items-center gap-2">
                <FiUserMinus className="w-4 h-4" />
                Leave
              </button>
            </>
          ) : (
            <button onClick={() => handleToggle(true)} disabled={busy} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Join Community
            </button>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-3">About</h3>
        <p className="text-dark-300">{community.description || 'No description yet.'}</p>
        {community.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {community.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-dark-800/60 rounded-md text-xs text-dark-300">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Members ({community.memberCount})</h3>
        <div className="flex flex-wrap gap-3">
          {community.members?.map((m) => {
            const mem = m.user || m;
            return (
              <div key={String(mem._id || mem.id || mem)} className="flex items-center gap-2 p-2 pr-4 bg-dark-800/50 rounded-xl">
                <RoundAvatar src={mem.avatar} name={mem.name} className="w-8 h-8 text-xs" />
                <span className="text-sm text-white">{mem.name}</span>
                {m.role === 'admin' && <span className="text-xs text-lime-400">Admin</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activities */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Community Activities</h3>
        {community.activities?.length > 0 ? (
          <div className="space-y-3">
            {community.activities.map((a) => (
              <Link
                key={a.id}
                to={`/activities/${a.id}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors"
              >
                <span className="text-2xl">{a.emoji || '📅'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{a.title}</p>
                  <p className="text-xs text-dark-400 flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1"><FiCalendar className="w-3 h-3" /> {a.date ? new Date(a.date).toLocaleDateString() : 'Anytime'}</span>
                    <span className="flex items-center gap-1"><FiMapPin className="w-3 h-3" /> {a.location || 'TBA'}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-dark-400">No activities linked to this community yet.</p>
        )}
      </div>

      {joined && (
        <Link to={`/communities/${community.id}/chat`} className="block w-full btn-primary mt-6 text-center">
          <FiMessageCircle className="w-4 h-4 inline mr-2" />
          Open Group Chat
        </Link>
      )}
    </div>
  );
};

export default CommunityPage;