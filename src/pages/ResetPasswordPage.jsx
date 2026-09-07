import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { FiLock, FiMail, FiKey, FiCheckCircle, FiChevronLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { Logo } from '../components/common';
import api from '../api';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const body = token ? { token, newPassword: password } : { email, code, newPassword: password };
    try {
      const res = await api.post('/auth/reset-password', body);
      if (res.data?.success) {
        setDone(true);
      } else {
        setError(res.data?.error || 'Could not reset password');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not reset password');
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="auth-container">
        <div className="auth-bg"></div>
        <div className="auth-card animate-scale-in">
          <div className="text-center mb-8">
            <FiCheckCircle className="w-14 h-14 text-lime-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Password updated</h1>
            <p className="text-dark-400">You can now sign in with your new password.</p>
          </div>
          <button onClick={() => navigate('/login')} className="w-full btn-primary flex items-center justify-center gap-2">
            Go to Login
            <FiChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-bg"></div>

      <div className="absolute top-20 left-10 w-20 h-20 bg-lime-500/10 rounded-2xl rotate-12 animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-electric-500/10 rounded-full animate-float-delayed"></div>

      <div className="auth-card animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <Logo size={120} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Set a new password</h1>
          <p className="text-dark-400 mt-2">
            {token ? 'Use your reset link to set a new password' : 'Enter the code from your email along with your email address'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-slide-down">
              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}

          {!token && (
            <>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input-field pl-12"
                />
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              </div>

              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="6-digit reset code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="input-field pl-12 text-center font-mono tracking-widest"
                />
                <FiKey className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
              </div>
            </>
          )}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="input-field pl-12 pr-12"
            />
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            >
              {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="input-field pl-12 pr-12"
            />
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Reset Password'
            )}
          </button>

          <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-dark-300 hover:text-white transition-colors">
            <FiChevronLeft className="w-4 h-4" /> Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;