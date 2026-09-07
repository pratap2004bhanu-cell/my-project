import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import { getDeviceName } from '../utils/deviceInfo';

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
      const res = await api.post('/auth/login', { email, password, deviceName: getDeviceName() });
      if (res.data.twoFactorRequired) {
        return {
          success: false,
          twoFactorRequired: true,
          emailConfigured: res.data.emailConfigured,
          devCode: res.data.devCode,
        };
      }
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Login failed' };
    }
  };

  const complete2FALogin = async (email, code) => {
    try {
      const res = await api.post('/auth/login/2fa', { email, code, deviceName: getDeviceName() });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Could not verify code' };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', { ...userData, deviceName: getDeviceName() });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Registration failed' };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/me/password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Could not change password' };
    }
  };

  const get2FA = async () => {
    try {
      const res = await api.get('/auth/me/2fa');
      return { success: true, ...res.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Could not load 2FA status' };
    }
  };

  const send2FACode = async (action) => {
    try {
      const res = await api.post('/auth/me/2fa/send', { action });
      return { success: true, ...res.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Could not send code' };
    }
  };

  const confirm2FA = async (action, code) => {
    try {
      const res = await api.post('/auth/me/2fa/confirm', { action, code });
      if (res.data.success) {
        setUser((u) => (u ? { ...u, twoFactorEnabled: !!res.data.enabled } : u));
      }
      return res.data;
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Could not verify code' };
    }
  };

  const getDevices = async () => {
    try {
      const res = await api.get('/auth/me/devices');
      return { success: true, devices: res.data.devices };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Could not load sessions' };
    }
  };

  const revokeDevice = async (deviceId) => {
    try {
      const res = await api.delete(`/auth/me/devices/${deviceId}`);
      return { success: true, devices: res.data.devices };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Could not revoke session' };
    }
  };

  const exportData = async () => {
    try {
      const res = await api.get('/auth/me/export');
      return { success: true, data: res.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.error || 'Could not export data' };
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
    complete2FALogin,
    register,
    completeOAuth,
    logout,
    updateUser,
    changePassword,
    get2FA,
    send2FACode,
    confirm2FA,
    getDevices,
    revokeDevice,
    exportData,
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