import { NavLink } from 'react-router-dom';
import { useMessageUnread } from '../../context/MessageUnreadContext';
import { mainNavItems } from './navItems';

const MobileNav = () => {
  const { total: chatUnread } = useMessageUnread();

  return (
    <nav className="mobile-nav" aria-label="Primary">
      <div className="grid grid-cols-5 py-1.5">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg transition-colors ${
                isActive ? 'text-lime-400' : 'text-dark-400'
              }`
            }
          >
            <span className="relative">
              <item.icon className="w-5 h-5" />
              {item.to === '/chat' && chatUnread > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 bg-lime-500 text-[9px] font-bold text-dark-950 rounded-full flex items-center justify-center">
                  {chatUnread > 9 ? '9+' : chatUnread}
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium leading-none">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;