import { NavLink } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { mainNavItems, navGroups, bottomNavItems } from './navItems';
import { useMessageUnread } from '../../context/MessageUnreadContext';

const NavGroup = ({ heading, items, onNavigate }) => (
  <div className="mt-6">
    <p className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-dark-500">
      {heading}
    </p>
    <nav className="space-y-0.5 px-3">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            `nav-item ${isActive ? 'nav-item-active' : ''}`
          }
        >
          <item.icon className="w-5 h-5 shrink-0" />
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  </div>
);

const Sidebar = () => {
  const { total: chatUnread } = useMessageUnread();

  return (
    <aside className="sidebar sidebar-glass overflow-y-auto">
      <div className="flex flex-col min-h-full pb-6">
        {/* Primary destinations, always visible */}
        <nav className="px-3 pt-5 space-y-0.5">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'nav-item-active' : ''}`
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
              {item.to === '/chat' && chatUnread > 0 && (
                <span className="ml-auto h-5 min-w-5 px-1.5 rounded-full bg-lime-500 text-[10px] font-bold text-dark-950 flex items-center justify-center">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* One primary action, placed right where the eye lands */}
        <div className="px-3 mt-5">
          <NavLink
            to="/create-activity"
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-lime-500 text-dark-950 rounded-xl font-semibold hover:bg-lime-400 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            <span>New activity</span>
          </NavLink>
        </div>

        {/* Everything else, grouped and labelled */}
        {navGroups.map((group) => (
          <NavGroup key={group.heading} heading={group.heading} items={group.items} />
        ))}

        {/* Account-level, below a divider */}
        <div className="mt-6 pt-4 border-t border-dark-800">
          <nav className="space-y-0.5 px-3">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'nav-item-active' : ''}`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;