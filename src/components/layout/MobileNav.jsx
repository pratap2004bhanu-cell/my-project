import { NavLink } from 'react-router-dom';
import { 
  FiHome, FiMapPin, FiTarget, FiMessageCircle, FiZap
} from 'react-icons/fi';

const MobileNav = () => {
  const navItems = [
    { to: '/dashboard', icon: FiHome, label: 'Home' },
    { to: '/nearby', icon: FiMapPin, label: 'Nearby' },
    { to: '/matching', icon: FiTarget, label: 'Matches' },
    { to: '/chat', icon: FiMessageCircle, label: 'Chat' },
    { to: '/lets-go', icon: FiZap, label: "KIKY" },
  ];

  return (
    <nav className="mobile-nav">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-lime-400'
                  : 'text-dark-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-2 rounded-xl ${isActive ? 'bg-lime-500/20' : ''}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;