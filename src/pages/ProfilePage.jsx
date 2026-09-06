import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { normalizeActivity } from '../utils/normalize';
import { RoundAvatar } from '../components/common';
import { 
  FiEdit2, FiMapPin, FiCalendar, FiHeart, 
  FiActivity, FiStar, FiSettings, FiLogOut,
  FiTarget, FiTrendingUp, FiUsers, FiCheck,
  FiCamera, FiImage, FiX
} from 'react-icons/fi';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('activities');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState(() => user?.gallery || []);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!user?.id) return;
        const res = await api.get('/api/activities');
        if (cancelled) return;
        setActivities((res.data.activities || [])
          .filter((a) => a.creator?.toString() === user.id.toString() || (a.participants || []).some((p) => p.user?.toString() === user.id.toString() && p.status !== 'left'))
          .map((a) => {
            const n = normalizeActivity(a);
            const isCompleted = n.status === 'completed';
            return {
              id: n.id,
              title: n.title,
              emoji: n.emoji,
              date: n.time,
              status: isCompleted ? 'completed' : 'upcoming',
              rating: isCompleted ? (n.feedback?.find((f) => f.user?.toString() === user.id)?.rating || null) : null,
              participants: n.participants,
              photos: Array.isArray(a.photos) ? a.photos : [],
            };
          }));
      } catch { /* graceful */ } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  useEffect(() => { setGallery(user?.gallery || []); }, [user?.gallery]);

  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('photos', f));
      const res = await api.post('/api/users/me/gallery', form);
      setGallery(res.data.gallery || []);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not upload photos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGalleryRemove = async (photo) => {
    try {
      const res = await api.delete('/api/users/me/gallery', { data: { photo } });
      setGallery(res.data.gallery || []);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not remove photo');
    }
  };

  const interests = user?.interests || ['Cricket', 'Coffee', 'Gaming'];
  
  const stats = [
    { label: 'Activities', value: user?.stats?.activitiesJoined ?? 0, icon: FiActivity },
    { label: 'Connections', value: user?.stats?.connections ?? 0, icon: FiUsers },
    { label: 'Rating', value: user?.stats?.rating ? (Number(user.stats.rating)).toFixed(1) : 'New', icon: FiStar },
  ];

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : 'New member';

  const statVals = {
    activities: user?.stats?.activitiesJoined ?? 0,
    streak: user?.stats?.streak ?? 0,
    connections: user?.stats?.connections ?? 0,
    hosted: activities.filter((a) => String(a.creatorId) === String(user?.id)).length,
    gallery: gallery.length,
    photos: activities.reduce((s, a) => s + (a.photos || []).length, 0),
  };

  const badges = [
    { name: 'First Step', emoji: '🏆', desc: 'Join or create your first activity', goal: 1, value: statVals.activities },
    { name: 'Streak Spirit', emoji: '🔥', desc: 'Reach a 3-day activity streak', goal: 3, value: statVals.streak },
    { name: 'Community Builder', emoji: '👥', desc: 'Make your first connection', goal: 1, value: statVals.connections },
    { name: 'Social Butterfly', emoji: '🦋', desc: 'Make 5 connections', goal: 5, value: statVals.connections },
    { name: 'The Host', emoji: '🎯', desc: 'Create your first activity', goal: 1, value: statVals.hosted },
    { name: 'Photographer', emoji: '📸', desc: 'Add 3 photos to your gallery', goal: 3, value: statVals.gallery },
    { name: 'Explorer', emoji: '🌍', desc: 'Join or host 5 activities', goal: 5, value: statVals.activities },
  ].map((b) => ({ ...b, earned: b.value >= b.goal }));

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <RoundAvatar
              src={user?.avatar}
              name={user?.name}
              gradient="from-lime-500 via-electric-500 to-hotpink-500"
              className="w-28 h-28 text-4xl shadow-lg border-2 border-dark-700"
            />
            <Link
              to="/profile/edit"
              className="absolute bottom-0 right-0 w-8 h-8 bg-dark-800 border-2 border-dark-700 rounded-full flex items-center justify-center hover:bg-dark-700 transition-colors"
            >
              <FiEdit2 className="w-4 h-4 text-white" />
            </Link>
          </div>
          
          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-display font-bold text-white mb-1">
              {user?.name || 'User'}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-dark-400 mb-3">
              <span className="flex items-center gap-1">
                <FiMapPin className="w-4 h-4" />
                {(typeof user?.location === 'string'
                  ? user.location
                  : (user?.location?.address || user?.location?.label || 'Location not set'))}
              </span>
              <span className="flex items-center gap-1">
                <FiCalendar className="w-4 h-4" />
                Joined {joined}
              </span>
            </div>
            <p className="text-dark-300 mb-4">
              {user?.bio || 'Hey! I love playing cricket and trying new coffee shops. Looking for activity buddies!'}
            </p>
            
            {/* Interests */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {interests.map((interest) => (
                <span key={interest} className="badge-lime">
                  {interest}
                </span>
              ))}
            </div>
          </div>
          
          {/* Edit Button */}
          <Link to="/profile/edit" className="btn-outline">
            <FiEdit2 className="w-4 h-4 mr-2" />
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="card text-center">
            <stat.icon className="w-6 h-6 text-lime-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-dark-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['activities', 'gallery', 'badges', 'connections'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-lime-500 text-dark-900'
                : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiActivity className="w-5 h-5 text-lime-400" />
            Your Activities
          </h2>
          
          {loading ? (
            <div className="flex items-center gap-3 p-4 text-dark-400 text-sm">
              <div className="w-5 h-5 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
              Loading your activities...
            </div>
          ) : activities.length === 0 ? (
            <div className="card text-center py-10">
              <FiActivity className="w-10 h-10 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400 mb-4">No activities yet. Join or create your first one!</p>
              <Link to="/explore" className="btn-primary inline-flex items-center gap-2">
                Explore Activities
              </Link>
            </div>
          ) : activities.map((activity) => (
            <div key={activity.id} className="card flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center text-2xl">
                {activity.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{activity.title}</h3>
                <p className="text-sm text-dark-400">{activity.date}</p>
              </div>
              <div className="text-right">
                {activity.status === 'completed' ? (
                  <div className="flex items-center gap-1 text-lime-400">
                    <FiCheck className="w-4 h-4" />
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                ) : (
                  <span className="badge-electric">Upcoming</span>
                )}
                {activity.rating && (
                  <div className="flex items-center gap-1 text-amber-400 mt-1">
                    <FiStar className="w-3 h-3 fill-amber-400" />
                    <span className="text-sm">{activity.rating}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'gallery' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FiImage className="w-5 h-5 text-lime-400" />
              Your Gallery
            </h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleGalleryUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-outline flex items-center gap-2 text-sm"
            >
              <FiCamera className="w-4 h-4" />
              {uploading ? 'Uploading...' : '+ Add Photos'}
            </button>
          </div>

          {/* Profile photos */}
          {gallery.length > 0 && (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {gallery.map((photo) => (
                  <div key={photo} className="relative group aspect-square rounded-xl overflow-hidden bg-dark-800">
                    <img src={photo} alt="Gallery" className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleGalleryRemove(photo)}
                      className="absolute top-2 right-2 w-7 h-7 bg-dark-900/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Photos from activities you joined */}
          <h3 className="text-sm font-semibold text-dark-300">
            From your activities
          </h3>
          {activities.some((a) => a.photos.length > 0) ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {activities.filter((a) => a.photos.length > 0).map((a) =>
                a.photos.map((photo) => (
                  <Link
                    key={`${a.id}-${photo}`}
                    to={`/activities/${a.id}`}
                    className="aspect-square rounded-xl overflow-hidden bg-dark-800"
                  >
                    <img src={photo} alt={a.title} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                  </Link>
                ))
              )}
            </div>
          ) : (
            <p className="text-sm text-dark-400">
              No photos yet. Add photos to an activity you are in and they will appear here.
            </p>
          )}

          {gallery.length === 0 && !activities.some((a) => a.photos.length > 0) && (
            <p className="text-sm text-dark-400">
              No photos yet. Click "+ Add Photos" to build your gallery.
            </p>
          )}
        </div>
      )}

      {activeTab === 'badges' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiTarget className="w-5 h-5 text-hotpink-400" />
            Your Badges
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {badges.map((badge) => (
              <div 
                key={badge.name} 
                className={`card text-center ${!badge.earned ? 'opacity-60' : ''}`}
              >
                <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-3xl ${badge.earned ? 'bg-gradient-to-br from-lime-500/25 to-emerald-500/25' : 'bg-dark-800/50 grayscale'}`}>
                  {badge.emoji}
                </div>
                <p className="font-bold text-white">{badge.name}</p>
                <p className="text-xs text-dark-400 mt-1 mb-2">{badge.desc}</p>
                <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden mb-1">
                  <div
                    className={`h-full rounded-full ${badge.earned ? 'bg-gradient-to-r from-lime-500 to-emerald-500' : 'bg-dark-500'}`}
                    style={{ width: `${Math.min(100, Math.round((badge.value / badge.goal) * 100))}%` }}
                  />
                </div>
                {!badge.earned && (
                  <p className="text-[10px] text-dark-500">
                    {Math.min(badge.value, badge.goal)}/{badge.goal}
                  </p>
                )}
                {badge.earned && (
                  <p className="text-[10px] text-lime-400 font-semibold">Earned</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'connections' && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-electric-400" />
            Your Connections
          </h2>
          
          <div className="card text-center py-12">
            <FiUsers className="w-12 h-12 text-dark-600 mx-auto mb-4" />
            <p className="text-dark-400 mb-4">Start connecting with people!</p>
            <Link to="/explore" className="btn-primary inline-flex items-center gap-2">
              Discover People
            </Link>
          </div>
        </div>
      )}

      {/* Settings & Logout */}
      <div className="mt-8 space-y-4">
        <Link to="/settings" className="card flex items-center gap-4 hover:border-dark-600 transition-colors">
          <div className="w-10 h-10 bg-dark-800 rounded-xl flex items-center justify-center">
            <FiSettings className="w-5 h-5 text-dark-400" />
          </div>
          <span className="font-medium text-white">Settings</span>
        </Link>
        
        <button 
          onClick={logout}
          className="card w-full flex items-center gap-4 hover:border-red-500/30 transition-colors"
        >
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <FiLogOut className="w-5 h-5 text-red-400" />
          </div>
          <span className="font-medium text-red-400">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;