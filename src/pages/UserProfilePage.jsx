import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiStar, FiUserPlus, FiCheck, FiClock, FiUsers
} from 'react-icons/fi';
import api from '../api';
import { normalizeUser } from '../utils/normalize';
import { RoundAvatar } from '../components/common';

const UserProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [restricted, setRestricted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get(`/api/users/${id}`)
      .then((res) => {
        if (cancelled) return;
        setProfile(normalizeUser(res.data.user));
        setRestricted(res.data.restricted === true);
      })
      .catch(() => { if (!cancelled) setError('Could not load profile'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [id]);

  const sendRequest = async () => {
    setActionLoading(true);
    try {
      const res = await api.post(`/api/users/${id}/friend`);
      if (res.data && res.data.alreadyFriends) return;
      setProfile((prev) => prev ? { ...prev, requestSent: true } : prev);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not send request');
    } finally {
      setActionLoading(false);
    }
  };

  const acceptRequest = async () => {
    setActionLoading(true);
    try {
      await api.post(`/api/users/${id}/friend/accept`);
      setProfile((prev) => prev ? { ...prev, isFriend: true, requestReceived: false } : prev);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not accept request');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-4 lg:p-6 max-w-2xl mx-auto text-center py-16">
        <span className="text-6xl mb-4 block">😕</span>
        <h3 className="text-xl font-bold text-white mb-2">User not found</h3>
        <p className="text-dark-400 mb-6">{error}</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Go back</button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="btn-icon w-8 h-8 mb-4">
        <FiArrowLeft className="w-4 h-4" />
      </button>

      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4">
          <RoundAvatar
            name={profile.name}
            src={profile.avatar}
            gradient={profile.gradient}
            className="w-20 h-20 text-2xl"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{profile.name}</h1>
            <p className="text-sm text-dark-400 flex items-center gap-1 mt-1">
              <FiClock className="w-3 h-3" />
              {profile.status === 'online' ? 'Online now' : 'Offline'}
              <span>•</span>
              <FiMapPin className="w-3 h-3" />
              {profile.location || 'Location hidden'}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-dark-400">
              <span className="flex items-center gap-1">
                <FiUsers className="w-3 h-3" />
                {profile.activitiesCount} activities
              </span>
              {profile.rating > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <FiStar className="w-3 h-3 fill-current" />
                  {profile.rating}
                </span>
              )}
              {typeof profile.compatibility === 'number' && (
                <span className="badge-lime">{profile.compatibility}% match</span>
              )}
            </div>
          </div>
        </div>

        {profile.bio && <p className="text-dark-300 mt-4">{profile.bio}</p>}

        {profile.interests?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.interests.map((tag) => (
              <span key={tag} className="px-3 py-1 bg-dark-800 rounded-full text-xs text-lime-400">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5">
          {profile.isFriend ? (
            <span className="badge-lime flex items-center gap-1">
              <FiCheck className="w-4 h-4" />
              Friends
            </span>
          ) : profile.requestReceived ? (
            <button onClick={acceptRequest} disabled={actionLoading} className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-60">
              <FiUserPlus className="w-4 h-4" />
              {actionLoading ? 'Accepting...' : 'Accept Request'}
            </button>
          ) : profile.requestSent ? (
            <span className="badge text-sm">Request Sent</span>
          ) : (
            <button onClick={sendRequest} disabled={actionLoading} className="btn-primary text-sm px-4 py-2 flex items-center gap-2 disabled:opacity-60">
              <FiUserPlus className="w-4 h-4" />
              {actionLoading ? 'Sending...' : 'Add Friend'}
            </button>
          )}
        </div>
      </div>

      {restricted && (
        <div className="card p-6 text-center">
          <span className="text-4xl mb-3 block">🔒</span>
          <h3 className="text-lg font-bold text-white mb-2">Private Profile</h3>
          <p className="text-dark-400 text-sm">
            This user keeps their profile private. Connect with them to see the full profile.
          </p>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;