import { FiSun, FiMoon, FiEdit2 } from 'react-icons/fi';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const { user, updateUser } = useAuth();

  const themeMeta = {
    dark: { icon: FiSun, active: 'bg-dark-800 text-amber-400 hover:bg-dark-700', label: 'light mode' },
    light: { icon: FiMoon, active: 'bg-gray-100 text-blue-600 hover:bg-gray-200', label: 'doodle mode' },
    doodle: { icon: FiEdit2, active: 'doodle-theme-btn bg-lime-100 text-pink-600 hover:bg-lime-200', label: 'dark mode' },
  };

  const meta = themeMeta[theme];

  const cycle = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(next);
    if (user && updateUser) {
      updateUser({ preferences: { ...user.preferences, theme: next } }).catch(() => {});
    }
  };

  return (
    <button
      onClick={cycle}
      className={`p-2 rounded-xl transition-all duration-200 ${meta.active} ${className}`}
      aria-label={`Switch to ${meta.label}`}
      title={`Switch to ${meta.label}`}
    >
      <meta.icon className="w-5 h-5" />
    </button>
  );
};

export default ThemeToggle;