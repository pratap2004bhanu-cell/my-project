/* eslint-disable react/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import api from '../api';

const MessageUnreadContext = createContext({ total: 0 });

export const useMessageUnread = () => useContext(MessageUnreadContext);

export const MessageUnreadProvider = ({ children }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [total, setTotal] = useState(0);

  const refresh = useMemo(() => async () => {
    try {
      const res = await api.get('/api/messages/conversations');
      const sum = (res.data.conversations || []).reduce((s, c) => s + (c.unread || 0), 0);
      setTotal(sum);
    } catch { /* ignore */ }
  }, []);

  // Seed once per login
  useEffect(() => {
    if (!user) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Live DM unread total
  useEffect(() => {
    if (!socket) return;
    const handler = (m) => {
      if (m.sender?._id && String(m.sender._id) !== String(user?.id)) {
        setTotal((t) => t + 1);
      }
    };
    socket.on('message:receive', handler);
    return () => { socket.off('message:receive', handler); };
  }, [socket, user?.id]);

  const value = useMemo(() => ({ total, refresh }), [total, refresh]);

  return (
    <MessageUnreadContext.Provider value={value}>
      {children}
    </MessageUnreadContext.Provider>
  );
};