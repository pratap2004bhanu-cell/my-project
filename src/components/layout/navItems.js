import {
  FiHome, FiCompass, FiHeart, FiMessageCircle,
  FiCalendar, FiUser, FiTarget, FiMapPin,
  FiSearch, FiBell, FiZap, FiUsers, FiShield, FiAward,
  FiBookmark, FiClock, FiSettings, FiTrendingUp,
  FiGrid, FiStar, FiCopy, FiCheckCircle, FiDollarSign,
  FiImage, FiMap, FiFileText, FiSun, FiCircle,
  FiCloud, FiPenTool
} from 'react-icons/fi';

export const mainNavItems = [
  { to: '/dashboard', icon: FiHome, label: 'Home' },
  { to: '/nearby', icon: FiMapPin, label: 'Nearby' },
  { to: '/trending', icon: FiTrendingUp, label: 'Trending' },
  { to: '/events', icon: FiCalendar, label: 'Events' },
  { to: '/matching', icon: FiTarget, label: 'Matches' },
  { to: '/chat', icon: FiMessageCircle, label: 'Messages' },
  { to: '/lets-go', icon: FiZap, label: "KIKY" },
];

export const secondaryNavItems = [
  { to: '/people', icon: FiUsers, label: 'People' },
  { to: '/communities', icon: FiHeart, label: 'Communities' },
  { to: '/location', icon: FiMap, label: 'Live Location' },
  { to: '/status', icon: FiCircle, label: 'Status' },
  { to: '/weather', icon: FiSun, label: 'Weather' },
  { to: '/calendar', icon: FiCalendar, label: 'Calendar' },
  { to: '/checkin', icon: FiCheckCircle, label: 'Check In' },
  { to: '/expenses', icon: FiDollarSign, label: 'Expenses' },
  { to: '/gallery', icon: FiImage, label: 'Gallery' },
  { to: '/places', icon: FiMap, label: 'Places' },
  { to: '/drafts', icon: FiFileText, label: 'Drafts' },
  { to: '/templates', icon: FiCopy, label: 'Templates' },
];

export const bottomNavItems = [
  { to: '/ideas', icon: FiPenTool, label: 'Share an Idea' },
  { to: '/notifications', icon: FiBell, label: 'Notifications' },
  { to: '/analytics', icon: FiTrendingUp, label: 'Analytics' },
  { to: '/safety', icon: FiShield, label: 'Safety' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
];