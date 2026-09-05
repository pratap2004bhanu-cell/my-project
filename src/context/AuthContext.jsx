import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const completeOAuth = async (token) => {
    try {
      localStorage.setItem('token', token);
      const res = await api.get('/auth/me');
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      localStorage.removeItem('token');
      return { success: false, error: error.response?.data?.error || 'OAuth login failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = async (userData) => {
    try {
      const res = await api.put('/auth/me', userData);
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to update profile' };
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete('/api/users/me');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Failed to delete account' };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    completeOAuth,
    logout,
    updateUser,
    deleteAccount,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};