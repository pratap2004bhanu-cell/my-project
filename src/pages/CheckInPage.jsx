import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCheckCircle, FiMapPin, FiCamera, FiClock,
  FiUsers, FiStar, FiShare2, FiArrowRight, FiNavigation
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const isToday = (iso) => {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
};

const userIdOf = (c) => (c && typeof c === 'object' ? c._id || c.id : c);

const CheckInPage = () => {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [checkedInActivityId, setCheckedInActivityId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [activeId, setActiveId] = useState(null);
  const [nowChecking, setNowChecking] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/activities');
        if (cancelled) return;
        const mine = (res.data.activities || []).filter((a) =>
          a.isCreator || (a.participants || []).some((p) => String(userIdOf(p.user)) === String(user?.id))
        );
        setActivities(mine);
      } catch (err) {
        if (!cancelled) setError('Failed to load activities');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const todayActivities = activities
    .filter((a) => isToday(a.date) && a.status !== 'cancelled')
    .map((a) => {
      const checkIns = a.checkIns || [];
      const mine = checkIns.some((c) => String(userIdOf(c.user)) === String(user?.id));
      return {
        id: a._id,
        title: a.title,
        emoji: a.emoji || '🎯',
        time: a.time || '',
        location: a.location?.address || 'Location TBA',
        distance: '',
        participants: (a.participants || []).length,
        checkedInCount: checkIns.length,
        canCheckIn: !mine,
        status: a.status,
        checkedIn: mine,
      };
    });

  const recentCheckIns = activities
    .filter((a) => {
      const checkIns = a.checkIns || [];
      return checkIns.some((c) => String(userIdOf(c.user)) === String(user?.id));
    })
    .slice(0, 8)
    .map((a) => {
      const myFeedback = (a.feedback || []).find((f) => String(userIdOf(f.user)) === String(user?.id));
      return {
        id: a._id,
        title: a.title,
        emoji: a.emoji || '🎯',
        date: a.date ? new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : '',
        location: a.location?.address || 'Location TBA',
        rating: myFeedback?.rating || 0,
      };
    });

  const handleCheckIn = async (activityId) => {
    let coords = null;
    await new Promise((resolve) => {
      if (!navigator.geolocation) return resolve();
      navigator.geolocation.getCurrentPosition(
        (p) => { coords = [p.coords.longitude, p.coords.latitude]; resolve(); },
        () => resolve(),
        { timeout: 5000 }
      );
    });
    setNowChecking(true);
    setActiveId(activityId);
    try {
      await api.post(`/api/activities/${activityId}/checkin`, coords
        ? { location: { type: 'Point', coordinates: coords } }
        : {});
      setActivities((prev) => prev.map((a) => {
        if (a._id !== activityId) return a;
        const checkIns = a.checkIns || [];
        return { ...a, checkIns: [...checkIns, { user: user?.id }] };
      }));
      setCheckedIn(true);
      setCheckedInActivityId(activityId);
      setShowCamera(true);
      setTimeout(() => setShowCamera(false), 2500);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not check in');
    } finally {
      setNowChecking(false);
      setActiveId(null);
      setCheckedIn(false);
    }
  };

  const openNav = (activity) => {
    const { coordinates } = activity.location || {};
    if (coordinates && coordinates.length === 2 && (coordinates[0] !== 0 || coordinates[1] !== 0)) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location?.address || activity.title)}`, '_blank');
    }
  };

  const handleAddPhoto = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !checkedInActivityId) return;
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append('photos', f));
      await api.post(`/api/activities/${checkedInActivityId}/photos`, form);
      alert('Photo added to the activity!');
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not upload photo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const shareCheckIn = () => {
    if (!checkedInActivityId) return;
    const url = `${window.location.origin}/activities/${checkedInActivityId}`;
    if (navigator.share) {
      navigator.share({ title: 'Check-in', url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => alert('Check-in link copied!')).catch(() => {});
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Check In
        </h1>
        <p className="text-dark-400">Mark your arrival at activities</p>
      </div>

      {/* Today's Activities */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Today's Activities</h2>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="card text-center py-10">
            <p className="text-dark-300 mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
          </div>
        ) : todayActivities.length === 0 ? (
          <div className="card text-center py-12">
            <span className="text-5xl mb-3 block">📅</span>
            <h3 className="text-lg font-bold text-white mb-2">No activities today</h3>
            <p className="text-dark-400 mb-5">Join or create an activity for today to check in.</p>
            <Link to="/explore" className="btn-primary inline-flex items-center gap-2">
              Find Activities <FiArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
        <div className="space-y-4">
          {todayActivities.map((activity) => (
            <div key={activity.id} className="card-glow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                  {activity.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-bold text-white text-lg">{activity.title}</h3>
                      <p className="text-sm text-dark-400 flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {activity.time}
                        <span>•</span>
                        <FiMapPin className="w-3 h-3" />
                        {activity.location}
                      </p>
                    </div>
                    <span className="text-sm text-dark-400">{activity.distance}</span>
                  </div>

                  {/* Check-in Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-dark-400">
                        <FiUsers className="w-4 h-4 inline mr-1" />
                        {activity.checkedInCount}/{activity.participants} checked in
                      </span>
                      <span className="text-lime-400">
                        {activity.participants > 0 ? Math.round((activity.checkedInCount / activity.participants) * 100) : 0}%
                      </span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-lime-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${activity.participants > 0 ? (activity.checkedInCount / activity.participants) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    {activity.checkedIn ? (
                      <span className="badge-lime flex items-center gap-1">
                        <FiCheckCircle className="w-4 h-4" />
                        Checked In
                      </span>
                    ) : activity.canCheckIn ? (
                      <>
                        <button
                          onClick={() => handleCheckIn(activity.id)}
                          disabled={nowChecking && activeId === activity.id}
                          className="btn-primary flex items-center gap-2 disabled:opacity-60"
                        >
                          <FiCheckCircle className="w-4 h-4" />
                          {activeId === activity.id && nowChecking ? 'Checking in...' : 'Check In'}
                        </button>
                        <button onClick={() => openNav(activity)} className="btn-outline flex items-center gap-2">
                          <FiNavigation className="w-4 h-4" />
                          Navigate
                        </button>
                      </>
                    ) : (
                      <span className="badge-lime">
                        {activity.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Check-in Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-dark-900/90 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6 animate-scale-in">
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle className="w-10 h-10 text-dark-900" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Checked In!</h3>
              <p className="text-dark-400">You've arrived — let everyone know</p>
            </div>

            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleAddPhoto}
              />
              <button onClick={() => fileInputRef.current?.click()} className="w-full btn-outline flex items-center justify-center gap-2">
                <FiCamera className="w-4 h-4" />
                {uploading ? 'Uploading...' : 'Add Photo'}
              </button>
              <button onClick={shareCheckIn} className="w-full btn-outline flex items-center justify-center gap-2">
                <FiShare2 className="w-4 h-4" />
                Share Check-in
              </button>
              <button 
                onClick={() => setShowCamera(false)}
                className="w-full btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Check-ins */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Check-ins</h2>
        <div className="space-y-3">
          {recentCheckIns.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-dark-400">No check-ins yet. Check in at your next activity!</p>
            </div>
          ) : recentCheckIns.map((item) => (
            <Link key={item.id} to={`/activities/${item.id}`} className="card flex items-center gap-4 p-4 block group hover:border-lime-500/40 transition-colors">
              <div className="w-12 h-12 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-xl flex items-center justify-center text-2xl">
                {item.emoji}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors">{item.title}</h3>
                <p className="text-sm text-dark-400 flex items-center gap-1">
                  <FiMapPin className="w-3 h-3" />
                  {item.location}
                  <span>•</span>
                  {item.date}
                </p>
              </div>
              {item.rating > 0 && (
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(item.rating)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CheckInPage;