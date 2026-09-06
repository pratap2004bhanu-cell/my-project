import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  FiBell, FiSearch, FiMapPin, FiMenu
} from 'react-icons/fi';
import ThemeToggle from '../common/ThemeToggle';
import { Logo, RoundAvatar } from '../common';
import MobileMenu from './MobileMenu';
import api from '../../api';

const Header = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [query, setQuery] = useState('');
  const [mobileSearch, setMobileSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = useCallback(() => setMenuOpen(true), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
    else navigate('/search');
    setMobileSearch(false);
  };

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/notifications');
        if (!cancelled) setUnread(res.data.unreadCount || 0);
      } catch { /* ignore */ }
    };
    load();
    return () => { cancelled = true; };
  }, [user, location.pathname]);

  useEffect(() => {
    if (!socket) return;
    const handler = (n) => {
      if (n.user?._id?.toString() === user?.id) {
        setUnread((u) => u + 1);
      }
    };
    socket.on('notification:new', handler);
    return () => { socket.off('notification:new', handler); };
  }, [socket, user?.id]);

  return (
    <header className="sticky top-0 z-40 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16 lg:h-20">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <Logo size={96} className="text-white w-16 sm:w-24" />
        </Link>

        {/* Search - Desktop */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
          <form onSubmit={submitSearch} className="relative w-full group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-lime-500/50 via-electric-500/50 to-hotpink-500/50 rounded-xl opacity-0 group-focus-within:opacity-100 blur-sm transition-opacity"></div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activities, people..."
              className="relative w-full pl-10 pr-4 py-2.5 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-transparent transition-colors"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 group-focus-within:text-lime-400 transition-colors" />
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* Mobile menu */}
          <button
            onClick={openMenu}
            className="lg:hidden btn-icon"
            aria-label="Open menu"
          >
            <FiMenu className="w-5 h-5" />
          </button>

          {/* Theme Toggle (hidden on very small phones — available in the menu) */}
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {/* Search - Mobile toggle */}
          <button
            onClick={() => setMobileSearch((v) => !v)}
            className={`lg:hidden btn-icon ${mobileSearch ? 'text-lime-400' : ''}`}
            aria-label="Search"
          >
            <FiSearch className="w-5 h-5" />
          </button>

          {/* Location */}
          <button
            onClick={() => navigate('/location')}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-dark-800/50 border border-dark-700/50 rounded-xl text-dark-300 hover:text-white hover:border-dark-600 transition-all"
          >
            <FiMapPin className="w-4 h-4" />
            <span className="text-sm">
              {typeof user?.location === 'string' ? user.location : (user?.location?.address || user?.location?.label || 'Set location')}
            </span>
          </button>
          
          {/* Notifications */}
          <Link to="/notifications" className="relative btn-icon">
            <FiBell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-hotpink-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>

          {/* Profile */}
          <Link to="/profile" className="flex items-center gap-3">
            <div className="relative">
              <RoundAvatar
                name={user?.name}
                src={user?.avatar}
                gradient="from-lime-500 to-electric-500"
                className="w-10 h-10"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-lime-400 rounded-full border-2 border-dark-950"></span>
            </div>
          </Link>
        </div>
      </div>

      {/* Search - Mobile (collapsible) */}
      {mobileSearch && (
        <div className="lg:hidden px-4 pb-3">
          <form onSubmit={submitSearch} className="relative">
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search activities, people..."
              className="w-full pl-10 pr-4 py-2.5 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          </form>
        </div>
      )}

      <MobileMenu isOpen={menuOpen} onClose={closeMenu} />
    </header>
  );
};

export default Header;