import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { completeOAuth } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('No token received from Google sign-in.');
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
          <p className="text-dark-400 mb-6">{error}</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Back to Login
          </button>
        </>
      )}
    </div>
  );
};

export default OAuthCallbackPage;