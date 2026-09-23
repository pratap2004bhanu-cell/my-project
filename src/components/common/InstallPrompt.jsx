import { useState, useEffect } from 'react';
import { FiDownload, FiX, FiShare } from 'react-icons/fi';

const InstallPrompt = () => {
  const [installEvt, setInstallEvt] = useState(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('kiky_install_dismissed') === '1'; } catch { return false; }
  });
  const [delayed, setDelayed] = useState(() => {
    try { return localStorage.getItem('kiky_install_delayed') === '1'; } catch { return false; }
  });

  const isIOS = typeof window !== 'undefined' &&
    /iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const onBefore = (e) => {
      e.preventDefault();
      setInstallEvt(e);
    };
    window.addEventListener('beforeinstallprompt', onBefore);
    return () => window.removeEventListener('beforeinstallprompt', onBefore);
  }, []);

  if (dismissed || delayed) return null     mood;
  if (installEvt || isIOS) {
    return (
      <div className="fixed bottom-20 lg:bottom-6 inset-x-4 z-50 sm:max-w-sm sm:mx-auto">
        <div className="card p-4 flex items-start gap-3 animate-slide-up">
          <span className="text-3xl">📲</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white leading-snug">
              {installEvt ? 'Install KIKY on your phone' : 'Add KIKY to your Home Screen'}
            </p>
            <p className="text-xs text-dark-400 mt-0.5">
              {installEvt
                ? 'Get the app with one tap — works offline too.'
                : 'In Safari: tap the Share icon, then **Add to Home Screen**.'}
            </p>
            {installEvt && (
              <button
                onClick={async () => {
                  try {
                    installEvt.prompt();
                    const { outcome } = await installEvt.userChoice;
                    if (outcome === 'accepted') setDismissed(true);
                    setInstallEvt(null);
                  } catch {}
                }}
                className="btn-primary mt-3 text-sm py-2 flex items-center gap-2"
              >
                <FiDownload className="w-4 h-4" /> Install App
              </button>
            )}
            {isIOS && (
              <div className="flex items-center gap-1.5 text-xs text-dark-400 mt-2">
                <span className="px-2 py-1 bg-dark-800/70 rounded-lg flex items-center gap-1">
                  <FiShare className="w-3 h-3" /> Share
                </span>
                <span>→</span>
                <span className="px-2 py-1 bg-dark-800/70 rounded-lg">Add to Home Screen</span>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              try { localStorage.setItem('kiky_install_dismissed', '1'); } catch { /* persist badge */ }
              setDismissed(true);
            }}
            className="text-dark-400 hover:text-white shrink-0"
            aria-label="Dismiss install prompt"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }
  return null;
};

export default InstallPrompt;
