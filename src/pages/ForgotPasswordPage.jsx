import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowRight, FiChevronLeft } from 'react-icons/fi';
import { Logo } from '../components/common';
import api from '../api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [devCode, setDevCode] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setDevCode(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data?.success) {
        setInfo(res.data.devCode
          ? 'If that email is registered, a reset code was generated. Email delivery is not configured, so use the dev code below.'
          : 'If that email is registered, a password reset link has been sent.');
        if (res.data.devCode) setDevCode(res.data.devCode);
      } else {
        setError(res.data?.error || 'Could not request a password reset');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Could not request a password reset');
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <div className="auth-bg"></div>

      <div className="absolute top-20 left-10 w-20 h-20 bg-lime-500/10 rounded-2xl rotate-12 animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-electric-500/10 rounded-full animate-float-delayed"></div>
      <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-hotpink-500/10 rounded-xl -rotate-12 animate-float"></div>

      <div className="auth-card animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <Logo size={120} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Reset your password</h1>
          <p className="text-dark-400 mt-2">Enter your email and we'll send you a reset link</p>
        </div>

        {!info ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-slide-down">
                <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 text-xs font-bold">!</span>
                </div>
                {error}
              </div>
            )}

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

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Send Reset Link
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <Link to="/login" className="flex items-center justify-center gap-2 text-sm text-dark-300 hover:text-white transition-colors">
              <FiChevronLeft className="w-4 h-4" /> Back to Login
            </Link>
          </form>
        ) : (
          <div className="space-y-5 text-center">
            <div className="bg-lime-500/10 border border-lime-500/30 text-lime-300 px-4 py-3 rounded-xl text-sm leading-relaxed">
              {info}
            </div>
            {devCode && (
              <div className="bg-lime-500/10 border border-lime-500/30 rounded-xl p-4">
                <p className="text-sm text-lime-300 mb-2">Dev code (enter on the next page):</p>
                <span className="font-mono text-2xl tracking-widest text-white">{devCode}</span>
              </div>
            )}
            <Link to="/reset-password" className="w-full btn-primary flex items-center justify-center gap-2">
              {devCode ? 'Continue with Code' : 'Go to Reset Page'}
              <FiArrowRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;