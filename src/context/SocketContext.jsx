import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const newSocket = io(import.meta.env.VITE_API_URL || window.location.origin, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};