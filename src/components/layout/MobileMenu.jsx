import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, NavLink } from 'react-router-dom';
import { FiX, FiPlus } from 'react-icons/fi';
import { Logo } from '../common';
import ThemeToggle from '../common/ThemeToggle';
import { mainNavItems, navGroups, bottomNavItems } from './navItems';

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

  const navClass = ({ isActive }) =>
    `nav-item ${isActive ? 'nav-item-active' : ''}`;

  const groupClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-dark-300 hover:bg-dark-800/70 hover:text-white transition-colors ${
      isActive ? 'text-lime-400 bg-lime-500/10 font-semibold' : ''
    }`;

  const renderItem = (item, cls = navClass) => (
    <NavLink key={item.to} to={item.to} onClick={onClose} className={cls}>
      <item.icon className="w-5 h-5 shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[60] bg-dark-950/70 transition-opacity duration-200 lg:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-[70] w-72 max-w-[85vw] flex flex-col bg-dark-950 border-r border-dark-800 transition-transform duration-200 lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-dark-800 flex-shrink-0">
          <Logo size={96} className="text-white" />
          <button onClick={onClose} className="btn-icon" aria-label="Close menu">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable nav */}
        <div className="flex-1 overflow-y-auto pb-6">
          <div className="flex items-center justify-between px-4 py-3 border-b border-dark-800">
            <span className="text-sm text-dark-300">Theme</span>
            <ThemeToggle />
          </div>

          <div className="pt-4 px-4">
            <NavLink
              to="/create-activity"
              onClick={onClose}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-lime-500 text-dark-950 rounded-xl font-semibold hover:bg-lime-400 transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              <span>New activity</span>
            </NavLink>
          </div>

          <nav className="px-4 mt-5 space-y-0.5">
            {mainNavItems.map((item) => renderItem(item))}
          </nav>

          {navGroups.map((group) => (
            <div key={group.heading} className="mt-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-dark-500">
                {group.heading}
              </p>
              <nav className="space-y-0.5">
                {group.items.map((item) => renderItem(item, groupClass))}
              </nav>
            </div>
          ))}

          <div className="mt-6 pt-4 border-t border-dark-800">
            <nav className="space-y-0.5">
              {bottomNavItems.map((item) => renderItem(item, groupClass))}
            </nav>
          </div>
        </div>
      </aside>
    </>,
    document.body
  );
};

export default MobileMenu;