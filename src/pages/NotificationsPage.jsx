import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  FiBell, FiUserPlus, FiMessageCircle, FiCalendar, 
  FiHeart, FiStar, FiCheck, FiX,
  FiTrash2, FiUsers, FiSmartphone
} from 'react-icons/fi';
import api from '../api';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'connection':
      return <FiUserPlus className="w-4 h-4" />;
    case 'message':
      return <FiMessageCircle className="w-4 h-4" />;
    case 'activity':
      return <FiCalendar className="w-4 h-4" />;
    case 'community':
      return <FiUsers className="w-4 h-4" />;
    case 'achievement':
      return <FiStar className="w-4 h-4 text-amber-500" />;
    case 'like':
      return <FiHeart className="w-4 h-4 text-pink-500" />;
    default:
      return <FiBell className="w-4 h-4" />;
  }
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pushState, setPushState] = useState('checking');

  const getVapidKey = async () => {
    try {
      const res = await api.get('/api/users/push-config');
      const key = res.data.publicKey;
      if (!key) return null;
      const base64 = key.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const raw = atob(padded);
      return Uint8Array.from(raw, (c) => c.charCodeAt(0));
    } catch {
      return null;
    }
  };

  const enablePush = async () => {
    setError(null);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setError('Push notifications are not supported by this browser.');
        setPushState('unsupported');
        return;
      }
      let reg = await navigator.serviceWorker.getRegistration();
      if (!reg) reg = await navigator.serviceWorker.register('/sw.js');
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      const applicationServerKey = await getVapidKey();
      if (!applicationServerKey) {
        setError('Push is not configured on the server.');
        setPushState('unavailable');
        return;
      }
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      await api.post('/api/users/me/push-subscription', {
        endpoint: subscription.endpoint,
        keys: subscription.toJSON().keys,
        device: navigator.userAgent,
      });
      setPushState('enabled');
    } catch (err) {
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setPushState('denied');
      } else {
        setError(err?.message || 'Could not enable push notifications.');
      }
    }
  };

  const disablePush = async () => {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      if (sub) {
        try { await api.delete('/api/users/me/push-subscription', { data: { endpoint: sub.endpoint } }); } catch { /* best effort */ }
        await sub.unsubscribe();
      }
      setPushState('off');
    } catch {
      setPushState('off');
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (mounted) setPushState('unsupported');
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg && (await reg.pushManager.getSubscription());
        if (mounted) setPushState(sub ? 'enabled' : 'off');
      } catch {
        if (mounted) setPushState('off');
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/notifications');
        if (cancelled) return;
        setNotifications(res.data.notifications || []);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || 'Could not load notifications');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (notification) => {
      // Only show notifications for the current user
      if (notification.user?._id?.toString() === user?.id) {
        setNotifications((prev) => [notification, ...prev.filter((n) => n._id !== notification._id)]);
      }
    };
    socket.on('notification:new', handler);
    return () => { socket.off('notification:new', handler); };
  }, [socket, user?.id]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id) => {
    setNotifications(notifications.map((n) => (n._id === id ? { ...n, read: true } : n)));
    try { await api.post(`/api/notifications/${id}/read`); } catch { /* best effort */ }
  };

  const markAllAsRead = async () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    try { await api.post('/api/notifications/read-all'); } catch { /* best effort */ }
  };

  const clearNotification = async (id) => {
    setNotifications(notifications.filter((n) => n._id !== id));
    try { await api.delete(`/api/notifications/${id}`); } catch { /* best effort */ }
  };

  const clearAll = async () => {
    setNotifications([]);
    try { await api.delete('/api/notifications'); } catch { /* best effort */ }
  };

  const actorName = (n) => n.actor?.name || 'Someone';

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Notifications
          </h1>
          <p className="text-dark-400">
            {loading ? 'Loading...' : unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn-outline text-sm">
            <FiCheck className="w-4 h-4 mr-1" />
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Push notifications card */}
      {(pushState === 'enabled' || pushState === 'off' || pushState === 'denied') && (
        <div className="card p-4 mb-6 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-lime-500/15 flex items-center justify-center flex-shrink-0">
            <FiSmartphone className="w-5 h-5 text-lime-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">
              {pushState === 'enabled' ? 'Push notifications on' : 'Push notifications'}
            </h3>
            <p className="text-xs text-dark-400">
              {pushState === 'enabled'
                ? 'Get notified instantly even when the app is closed.'
                : pushState === 'denied'
                ? 'Notifications are blocked in your browser. Enable them in site settings to receive push alerts.'
                : 'Turn on alerts for messages, likes, matches and activity updates.'}
            </p>
          </div>
          {pushState === 'enabled' ? (
            <button onClick={disablePush} className="btn-outline text-sm">
              <FiX className="w-4 h-4 mr-1" />
              Turn off
            </button>
          ) : (
            <button onClick={enablePush} className="btn-primary text-sm" disabled={pushState === 'denied'}>
              <FiBell className="w-4 h-4 mr-1" />
              Enable
            </button>
          )}
        </div>
      )}

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification._id}
            className={`card flex items-start gap-4 p-4 group ${
              !notification.read ? 'border-lime-500/50 bg-lime-500/5' : ''
            }`}
            onClick={() => markAsRead(notification._id)}
          >
            {/* Avatar/Icon */}
            <div className="relative flex-shrink-0">
              {notification.actor?.avatar ? (
                <img src={notification.actor.avatar} alt={notification.actor.name} className="w-12 h-12 rounded-full object-cover" />
              ) : notification.actor ? (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-white font-bold">
                  {notification.actor.name.charAt(0)}
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center text-2xl">
                  ⚡
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-dark-800 rounded-full flex items-center justify-center">
                {getNotificationIcon(notification.type)}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm">
                <span className="font-semibold">{actorName(notification)}</span>{' '}
                <span className="text-dark-300">{notification.text}</span>
              </p>
              {notification.activity && (
                <Link
                  to={`/activities/${notification.activity}`}
                  className="text-sm text-lime-400 hover:text-lime-300 font-medium mt-0.5 inline-block"
                >
                  View activity →
                </Link>
              )}
              <p className="text-sm text-dark-400 mt-1">{timeAgo(notification.createdAt)}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notification.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification._id);
                  }}
                  className="p-1.5 text-dark-400 hover:text-white hover:bg-dark-700 rounded-lg transition-colors"
                >
                  <FiCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearNotification(notification._id);
                }}
                className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            {!notification.read && (
              <div className="w-2 h-2 bg-lime-500 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-dark-400">
          <div className="w-5 h-5 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mr-3"></div>
          Loading...
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">🔔</span>
          <h3 className="text-xl font-bold text-white mb-2">No notifications</h3>
          <p className="text-dark-400">You're all caught up!</p>
        </div>
      ) : (
        <div className="mt-6 text-center">
          <button onClick={clearAll} className="text-dark-400 hover:text-red-400 text-sm flex items-center gap-2 mx-auto">
            <FiTrash2 className="w-4 h-4" />
            Clear all notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;