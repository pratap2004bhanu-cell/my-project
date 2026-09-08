/* eslint-disable react/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../api';

const NotificationContext = createContext({ unreadCount: 0 });

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [unreadCount, setUnreadCount] = useState(0);

  // Seed the badge once per login (Header used to re-poll on every navigation)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    api.get('/api/notifications')
      .then((res) => {
        if (!cancelled) setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => { /* ignore */ });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handler = (n) => {
      if (n.user?._id?.toString() === user?.id) {
        setUnreadCount((u) => u + 1);
      }
    };
    socket.on('notification:new', handler);
    return () => { socket.off('notification:new', handler); };
  }, [socket, user?.id]);

  const value = useMemo(() => ({
    unreadCount,
    setUnread: setUnreadCount,
    refresh: async () => {
      try {
        const res = await api.get('/api/notifications');
        setUnreadCount(res.data.unreadCount || 0);
      } catch { /* ignore */ }
    },
  }), [unreadCount]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};