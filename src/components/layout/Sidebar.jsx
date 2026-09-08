import { NavLink } from 'react-router-dom';
import {
  FiPlus, FiTarget
} from 'react-icons/fi';
import { mainNavItems, secondaryNavItems, bottomNavItems } from './navItems';
import { useMessageUnread } from '../../context/MessageUnreadContext';

const Sidebar = () => {
  const { total: chatUnread } = useMessageUnread();

  return (
    <aside className="sidebar sidebar-glass overflow-y-auto">
      <div className="flex flex-col min-h-full">
        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
              {item.to === '/chat' && chatUnread > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-hotpink-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Secondary Navigation */}
        <nav className="px-4 py-4 space-y-1">
          {secondaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Create Activity Button */}
        <div className="px-4 py-4">
          <NavLink
            to="/create-activity"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-lime-500 to-electric-500 text-dark-900 rounded-xl font-bold hover:from-lime-400 hover:to-electric-400 transition-all duration-300 shadow-lg hover:shadow-glow-lime"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create Activity</span>
          </NavLink>
        </div>

        {/* Bottom Navigation */}
        <div className="px-4 py-4 border-t border-dark-800">
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="relative overflow-hidden rounded-2xl glass-strong mx-4 mb-4 p-4 border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-500/20 via-electric-500/15 to-hotpink-500/20 pointer-events-none"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <FiTarget className="w-4 h-4 text-lime-400" />
              <span className="text-sm font-medium text-white">Your Progress</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
      </div>
    </aside>
  );
};

export default Sidebar;