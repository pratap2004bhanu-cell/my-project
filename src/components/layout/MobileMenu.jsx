import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, NavLink } from 'react-router-dom';
import { FiX, FiPlus, FiTarget } from 'react-icons/fi';
import { Logo } from '../common';
import { mainNavItems, secondaryNavItems, bottomNavItems } from './navItems';

const MobileMenu = ({ isOpen, onClose }) => {
  const location = useLocation();

  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  const renderItem = (item) => (
    <NavLink
      key={item.to}
      to={item.to}
      onClick={onClose}
      className={({ isActive }) =>
        `nav-item ${isActive ? 'nav-item-active' : ''}`
      }
    >
      <item.icon className="w-5 h-5" />
      <span>{item.label}</span>
    </NavLink>
  );

  const renderGroup = (items) => (
    <nav className="px-4 py-4 space-y-1">{items.map(renderItem)}</nav>
  );

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-dark-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-[70] w-72 max-w-[85vw] flex flex-col bg-dark-950/95 border-r border-dark-700/50 backdrop-blur-2xl transition-transform duration-300 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-dark-800 flex-shrink-0">
          <Logo size={96} className="text-white" />
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close menu"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto pb-8">
          {renderGroup(mainNavItems)}
          <div className="px-4 pt-3"><div className="h-px bg-dark-800 mb-4"></div></div>
          {renderGroup(secondaryNavItems)}
          {renderGroup(bottomNavItems)}

          {/* Create Activity */}
          <div className="px-4 py-4">
            <NavLink
              to="/create-activity"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-lime-500 to-electric-500 text-dark-900 rounded-xl font-bold shadow-lg"
            >
              <FiPlus className="w-5 h-5" />
              <span>Create Activity</span>
            </NavLink>
          </div>

          {/* Quick Stats */}
          <div className="relative overflow-hidden rounded-2xl glass-strong mx-4 p-4 border border-white/10">
            <div className="relative flex items-center gap-2 mb-3">
              <FiTarget className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-medium text-white">Your Progress</span>
            </div>
            <div className="grid grid-cols-2 gap-3 relative">
              <div className="text-center">
                <p className="text-lg font-bold gradient-text-flow">12</p>
                <p className="text-xs text-dark-300">Activities</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold gradient-text-flow">7🔥</p>
                <p className="text-xs text-dark-300">Streak</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
};

export default MobileMenu;