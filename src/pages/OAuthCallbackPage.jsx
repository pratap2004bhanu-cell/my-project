import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiShield, FiChevronLeft } from 'react-icons/fi';
import { Logo } from '../components/common';

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const { completeOAuth, complete2FALogin, get2FAChallenge } = useAuth();
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const params = new URLSearchParams(window.location.hash.slice(1));
  const token = params.get('token');
  const needs2FA = params.get('2fa') === '1';

  useEffect(() => {
    if (!token) {
      setError('No token received from Google sign-in.');
      return;
    }

    if (needs2FA) {
      setChallenge({ loading: true });
      get2FAChallenge(token).then((res) => {
        if (res.success) {
          setChallenge({
            emailConfigured: res.emailConfigured,
            email: res.email,
            devCode: res.devCode,
          });
        } else {
          setChallenge(null);
          setError(res.error || 'Could not start two-factor challenge.');
        }
      });
      return;
    }

    completeOAuth(token).then((res) => {
      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitCode = async (e) => {
    e.preventDefault();
    setError('');
    setVerifying(true);
    const res = await complete2FALogin(code, token);
    if (res.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(res.error);
    }
    setVerifying(false);
  };

  if (challenge) {
    return (
      <div className="auth-container">
        <div className="auth-bg"></div>
        <div className="auth-card animate-scale-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Logo size={120} className="text-white" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <FiShield className="w-5 h-5 text-lime-400" />
              <h1 className="text-xl font-bold text-white">Two-factor check</h1>
            </div>
            <p className="text-dark-400 text-sm">
              {challenge.loading
                ? 'Preparing your security code...'
                : `A 6-digit code was emailed to ${challenge.email || 'your account'}`}
            </p>
          </div>

          {!challenge.loading && (
            <form onSubmit={submitCode} className="space-y-5">
              {challenge.devCode && (
                <div className="bg-lime-500/10 border border-lime-500/30 text-lime-300 px-4 py-3 rounded-xl text-sm">
                  Email delivery is not configured — use the dev code below:
                  <span className="block mt-2 font-mono text-lg tracking-widest text-white">
                    {challenge.devCode}
                  </span>
                </div>
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                autoFocus
                required
                className="input-field text-center font-mono tracking-widest"
              />
              <button
                type="submit"
                disabled={verifying || code.length < 6}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {verifying ? (
                  <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    Verify & Sign In
                    <FiArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      {!error ? (
        <>
          <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-dark-300">Completing sign-in...</p>
        </>
      ) : (
        <>
          <span className="text-6xl mb-4">❌</span>
          <h1 className="text-xl font-bold text-white mb-2">Sign-in failed</h1>
          <p className="text-dark-400 mb-6 max-w-md">{error}</p>
          <button onClick={() => navigate('/login')} className="btn-primary inline-flex items-center gap-2">
            <FiChevronLeft className="w-4 h-4" /> Back to Login
          </button>
        </>
      )}
    </div>
  );
};

export default OAuthCallbackPage;