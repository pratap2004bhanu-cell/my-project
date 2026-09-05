import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiMapPin, FiCalendar, FiUsers, FiTarget,
  FiHeart, FiShare2, FiFlag, FiArrowLeft, FiMessageCircle,
  FiCheck, FiStar, FiNavigation, FiCheckCircle, FiDollarSign, FiEdit3, FiX
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { RoundAvatar } from '../components/common';
import { normalizeActivity } from '../utils/normalize';

const cap = (s = '') => s.charAt(0).toUpperCase() + s.slice(1);

const userIdOf = (u) => (u && typeof u === 'object' ? u._id || u.id : u);

const ActivityDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [joining, setJoining] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [shareCopied, setShareCopied] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/api/activities/${id}`);
        const normalized = normalizeActivity(res.data.activity);
        const userId = user?.id;
        const joined = normalized.attendees.some((a) => a.id === userId) || normalized.isCreator;

        let hostProfile = {};
        try {
          const hostRes = await api.get(`/api/users/${normalized.creatorId}`);
          hostProfile = hostRes.data.user || {};
        } catch { /* host profile optional */ }
        const hostRatings = hostProfile.rating || [];

        setActivity({
          ...normalized,
          tags: [cap(normalized.category), cap(normalized.activityType), cap(normalized.recurring !== 'none' ? normalized.recurring : '')].filter(Boolean),
          longDescription: normalized.description || 'No description provided yet.',
          requirements: ['Come with enthusiasm', 'Bring a water bottle', 'Good vibes'],
          date: normalized.time || normalized.dateRaw,
          time: normalized.timeRaw || '',
          location: normalized.address,
          distance: normalized.distanceLabel,
          host: {
            name: normalized.host,
            avatar: normalized.hostAvatar || normalized.host[0] || '?',
            gradient: 'from-lime-500 to-emerald-500',
            rating: hostProfile.stats?.rating || 0,
            ratingCount: hostRatings.length,
            activities: hostProfile.stats?.activitiesJoined || 0,
            bio: hostProfile.bio || 'Activity host',
          },
          reviews: (normalized.feedback || []).map((f) => ({
            user: f.user?.name || 'Member',
            rating: f.rating || 5,
            comment: f.comment || '',
            date: f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
          })),
          isJoined: joined,
          checkIns: normalized.checkIns || [],
          feedback: normalized.feedback || [],
          photos: res.data.activity.photos || [],
        });
        setIsSaved(!!normalized.saved);
        const isCheckedIn = (normalized.checkIns || []).some((c) => userIdOf(c.user) === user?.id);
        setCheckedIn(isCheckedIn);
      } catch (err) {
        setError(err?.response?.data?.error || 'Activity not found');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleJoin = async () => {
    if (!activity) return;
    setJoining(true);
    try {
      if (activity.isJoined) {
        const res = await api.post(`/api/activities/${id}/leave`);
        setActivity((a) => ({ ...a, isJoined: false, participants: res.data.activity.participants.filter((p) => p.status !== 'left').length }));
      } else {
        const res = await api.post(`/api/activities/${id}/join`);
        setActivity((a) => ({ ...a, isJoined: true, participants: res.data.activity.participants.filter((p) => p.status !== 'left').length }));
      }
    } catch (err) {
      alert(err?.response?.data?.error || 'Something went wrong');
    } finally {
      setJoining(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/activities/${id}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleDirections = () => {
    const a = activity;
    if (a?.coordinates) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${a.coordinates[0]},${a.coordinates[1]}`, '_blank');
    } else {
      const q = a?.address && a.address !== 'Location TBA' ? a.address : a?.title;
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank');
    }
  };

  const handleReport = async () => {
    if (activity.isCreator) {
      alert("You can't report your own activity.");
      return;
    }
    const reason = window.prompt('What would you like to report about this activity?');
    if (!reason || !reason.trim()) return;
    try {
      await api.post('/api/reports', {
        reported: activity.creatorId,
        type: 'inappropriate',
        details: `Activity "${activity.title}": ${reason.trim()}`,
      });
      alert('Report submitted. Thank you for keeping the community safe.');
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not submit report');
    }
  };

  const handleToggleSave = async () => {
    try {
      const res = await api.post(`/api/activities/${id}/save`);
      setIsSaved(res.data.saved === true);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not update saved');
    }
  };

  const handleMessageHost = () => {
    if (activity?.creatorId) {
      navigate(`/chat/${activity.creatorId}`);
    }
  };

  const handleCheckIn = async () => {
    if (!activity) return;
    setCheckingIn(true);
    try {
      let coords = null;
      await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve();
        navigator.geolocation.getCurrentPosition(
          (p) => { coords = [p.coords.longitude, p.coords.latitude]; resolve(); },
          () => resolve(),
          { timeout: 5000 }
        );
      });
      await api.post(`/api/activities/${id}/checkin`, coords
        ? { location: { type: 'Point', coordinates: coords } }
        : {});
      setCheckedIn(true);
      setActivity((a) => a ? { ...a, checkIns: [...a.checkIns, { user: user?.id }] } : a);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not check in');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleUploadPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('photos', f));
      const res = await api.post(`/api/activities/${id}/photos`, form);
      setActivity((a) => ({ ...a, photos: res.data.photos || [] }));
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not upload photos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <span className="text-6xl mb-4">❌</span>
        <h1 className="text-xl font-bold text-white mb-2">Activity not found</h1>
        <p className="text-dark-400 mb-6">{error}</p>
        <button onClick={() => navigate('/explore')} className="btn-primary">Back to Explore</button>
      </div>
    );
  }

  const isActivityToday = new Date(activity.date).toDateString() === new Date().toDateString();
  const canCheckIn = activity.isJoined && !checkedIn && isActivityToday && activity.status !== 'cancelled';
  const isCompleted = activity.status === 'completed';
  const hasMyFeedback = (activity.feedback || []).some((f) => userIdOf(f.user) === user?.id);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link to="/nearby" className="inline-flex items-center gap-2 text-dark-400 hover:text-white mb-6 transition-colors">
        <FiArrowLeft className="w-4 h-4" />
        Back to Nearby
      </Link>

      {/* Hero Section */}
      <div className="card-glow overflow-hidden mb-6">
        <div className="bg-gradient-to-br from-lime-500/20 via-dark-800 to-electric-500/20 p-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-lime-500 to-emerald-500 rounded-3xl flex items-center justify-center text-5xl flex-shrink-0">
              {activity.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
                    {activity.title}
                  </h1>
                  <div className="flex items-center gap-2">
                    {activity.status === 'ongoing' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></span>
                        Live now
                      </span>
                    ) : activity.status === 'completed' ? (
                      <span className="inline-flex items-center px-3 py-1 bg-dark-700/50 text-dark-300 rounded-full text-xs font-semibold">
                        Completed
                      </span>
                    ) : activity.status === 'cancelled' ? (
                      <span className="inline-flex items-center px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-semibold">
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 bg-lime-500 text-dark-900 rounded-full text-xs font-semibold">
                        Upcoming
                      </span>
                    )}
                  </div>
                  <p className="text-dark-400 mt-1">Hosted by {activity.host.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleToggleSave}
                    className={`p-2 rounded-xl transition-all ${isSaved ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-800/50 text-dark-400 hover:text-white'}`}
                  >
                    <FiHeart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                  <button onClick={handleShare} className={`p-2 rounded-xl transition-all ${shareCopied ? 'bg-lime-500/20 text-lime-400' : 'bg-dark-800/50 text-dark-400 hover:text-white'}`}>
                    {shareCopied ? <FiCheck className="w-5 h-5" /> : <FiShare2 className="w-5 h-5" />}
                  </button>
                  <button onClick={handleReport} className="p-2 bg-dark-800/50 text-dark-400 hover:text-red-400 rounded-xl transition-all">
                    <FiFlag className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Match Score */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-lime-500/20 rounded-xl mb-4">
                <FiTarget className="w-5 h-5 text-lime-400" />
                <span className="text-2xl font-bold text-lime-400">{activity.match}%</span>
                <span className="text-dark-300">match</span>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {activity.tags.map((tag) => (
                  <span key={tag} className="badge-lime">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2">
            {['details', 'photos', 'attendees', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-lime-500 text-dark-900 font-semibold'
                    : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">About this activity</h2>
              <div className="text-dark-300 whitespace-pre-wrap leading-relaxed">
                {activity.longDescription}
              </div>

              <div className="mt-6 pt-6 border-t border-dark-700/50">
                <h3 className="font-semibold text-white mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {activity.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-dark-300">
                      <FiCheck className="w-4 h-4 text-lime-400" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Photos ({(activity.photos || []).length})
                </h2>
                {(activity.isJoined || activity.isCreator) && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleUploadPhotos}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="btn-primary text-sm px-4 py-2 disabled:opacity-60"
                    >
                      {uploading ? 'Uploading...' : '+ Add Photos'}
                    </button>
                  </>
                )}
              </div>

              {(activity.photos || []).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(activity.photos || []).map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightbox(photo)}
                      className="aspect-square rounded-xl overflow-hidden bg-dark-800 group relative"
                    >
                      <img
                        src={photo}
                        alt={`${activity.title} ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-5xl mb-3 block">📸</span>
                  <p className="text-dark-400">
                    No photos yet{activity.isJoined || activity.isCreator ? ' — be the first to add one' : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'attendees' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Attendees ({activity.participants}/{activity.maxParticipants})
              </h2>
              <div className="space-y-3">
                {activity.attendees.length > 0 ? activity.attendees.map((attendee, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                    <RoundAvatar
                      src={attendee.avatar}
                      name={attendee.name}
                      gradient={attendee.gradient || 'from-lime-500 to-emerald-500'}
                      className="w-10 h-10"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{attendee.name}</h4>
                      <p className="text-xs text-dark-400 capitalize">{attendee.status}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      attendee.status === 'joined' 
                        ? 'bg-lime-500/20 text-lime-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {attendee.status}
                    </span>
                  </div>
                )) : (
                  <p className="text-dark-400 text-center py-8">No one has joined yet. Be the first!</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Reviews</h2>
              {activity.reviews.length > 0 ? (
                <div className="space-y-4">
                  {activity.reviews.map((review, idx) => (
                    <div key={idx} className="p-4 bg-dark-800/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{review.user}</span>
                        <span className="text-sm text-dark-400">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <FiStar 
                            key={i} 
                            className={`w-4 h-4 ${i < review.rating ? 'text-amber-400 fill-current' : 'text-dark-600'}`} 
                          />
                        ))}
                      </div>
                      <p className="text-dark-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-center py-8">No reviews yet</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="card p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FiCalendar className="w-5 h-5 text-lime-400" />
                <div>
                  <p className="text-white font-medium">{activity.date}</p>
                  <p className="text-sm text-dark-400">{activity.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiMapPin className="w-5 h-5 text-lime-400" />
                <div>
                  <p className="text-white font-medium">{activity.location}</p>
                  <p className="text-sm text-dark-400">{activity.distance}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FiUsers className="w-5 h-5 text-lime-400" />
                <div>
                  <p className="text-white font-medium">{activity.participants}/{activity.maxParticipants} joined</p>
                  <p className="text-sm text-dark-400">{activity.maxParticipants - activity.participants} spots left</p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full"
                  style={{ width: `${(activity.participants / activity.maxParticipants) * 100}%` }}
                />
              </div>
            </div>

            {/* Join Button */}
            {!activity.isCreator && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className={`w-full mt-4 py-3 rounded-xl font-bold transition-all disabled:opacity-60 ${
                  activity.isJoined
                    ? 'bg-dark-700 text-dark-300 border border-dark-600'
                    : 'btn-primary'
                }`}
              >
                {joining ? 'Updating...' : activity.isJoined ? 'Leave Activity' : 'Join Activity'}
              </button>
            )}

            {activity.isCreator ? (
              <button className="w-full mt-2 py-3 rounded-xl font-medium bg-dark-700 text-dark-300 border border-dark-600 transition-all">
                You're hosting this
              </button>
            ) : (
              <button onClick={handleMessageHost} className="w-full mt-2 py-3 rounded-xl font-medium text-dark-400 hover:text-white hover:bg-dark-700/50 transition-all flex items-center justify-center gap-2">
                <FiMessageCircle className="w-4 h-4" />
                Message Host
              </button>
            )}
          </div>

          {/* Activity Actions */}
            {(activity.isJoined || activity.isCreator) && (
              <div className="mt-4 space-y-2">
                {canCheckIn && (
                  <button
                    onClick={handleCheckIn}
                    disabled={checkingIn}
                    className="w-full py-3 rounded-xl font-semibold bg-electric-500/90 text-white flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    {checkingIn ? 'Checking In...' : 'Check In Now'}
                  </button>
                )}
                {checkedIn && (
                  <div className="w-full py-2 rounded-xl text-sm font-medium bg-lime-500/15 text-lime-400 flex items-center justify-center gap-2">
                    <FiCheck className="w-4 h-4" />
                    Checked In
                  </div>
                )}
                {isCompleted && !hasMyFeedback && activity.isJoined && (
                  <button
                    onClick={() => navigate('/feedback')}
                    className="w-full py-3 rounded-xl font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-2"
                  >
                    <FiEdit3 className="w-4 h-4" />
                    Rate Experience
                  </button>
                )}
                {isCompleted && hasMyFeedback && (
                  <div className="w-full py-2 rounded-xl text-sm font-medium bg-dark-800/50 text-dark-300 flex items-center justify-center gap-2">
                    <FiStar className="w-4 h-4 text-amber-400 fill-current" />
                    Rated
                  </div>
                )}
                <button
                  onClick={() => navigate('/expenses')}
                  className="w-full py-2 rounded-xl text-sm font-medium bg-dark-700/50 text-dark-300 hover:text-white hover:bg-dark-700/70 flex items-center justify-center gap-2 transition-colors"
                >
                  <FiDollarSign className="w-4 h-4" />
                  Split Expenses
                </button>
                <button
                  onClick={() => navigate(`/group-chat/${activity.id}`)}
                  className="w-full py-2 rounded-xl text-sm font-medium bg-lime-500/15 text-lime-400 border border-lime-500/30 hover:bg-lime-500/25 flex items-center justify-center gap-2 transition-colors"
                >
                  <FiUsers className="w-4 h-4" />
                  Open Group Chat
                </button>
              </div>
            )}

          {/* Host Card */}
          <div className="card p-6">
            <h3 className="font-semibold text-white mb-4">Host</h3>
            <div className="flex items-center gap-3 mb-4">
              <RoundAvatar
                src={activity.host.avatar}
                name={activity.host.name}
                gradient={activity.host.gradient}
                className="w-12 h-12"
              />
              <div>
                <h4 className="font-medium text-white">{activity.host.name}</h4>
                <div className="flex items-center gap-1 text-sm text-dark-400">
                  <FiStar className="w-3 h-3 text-amber-400 fill-current" />
                  {activity.host.rating > 0 ? (
                    <>
                      {activity.host.rating.toFixed(1)}
                      <span>•</span>
                      {activity.host.ratingCount} {activity.host.ratingCount === 1 ? 'rating' : 'ratings'}
                    </>
                  ) : (
                    'New host'
                  )}
                  <span>•</span>
                  {activity.host.activities || 0} activities
                </div>
              </div>
            </div>
            <p className="text-sm text-dark-400">{activity.host.bio}</p>
          </div>

          {/* Map Preview */}
          <div className="card overflow-hidden">
            <div className="h-40 bg-dark-800 flex items-center justify-center">
              <div className="text-center">
                <FiMapPin className="w-8 h-8 text-lime-400 mx-auto mb-2" />
                <p className="text-sm text-dark-400">{activity.location}</p>
                <button onClick={handleDirections} className="text-sm text-lime-400 hover:text-lime-300 mt-2 flex items-center gap-1 mx-auto">
                  <FiNavigation className="w-3 h-3" />
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img src={lightbox} alt="Activity photo" className="max-h-[90vh] max-w-full rounded-xl object-contain" />
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityDetailsPage;