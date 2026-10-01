import {
  FiHome, FiCompass, FiMessageCircle, FiCalendar, FiZap,
  FiUsers, FiHeart, FiMapPin, FiSun, FiClock, FiImage,
  FiBell, FiShield, FiTrendingUp, FiPenTool, FiSettings,
  FiTarget, FiDollarSign
} from 'react-icons/fi';

/* Navigation is grouped by intent, and every group carries a visible
   heading. 24 items dumped into one list with no labels is the single
   biggest reason this nav reads as clutter. */
export const mainNavItems = [
  { to: '/dashboard', icon: FiHome, label: 'Home' },
  { to: '/nearby', icon: FiCompass, label: 'Discover' },
  { to: '/matching', icon: FiTarget, label: 'Matches' },
  { to: '/chat', icon: FiMessageCircle, label: 'Messages' },
  { to: '/kiky', icon: FiZap, label: 'KIKY' },
];

export const navGroups = [
  {
    heading: 'Explore',
    items: [
      { to: '/trending', icon: FiTrendingUp, label: 'Trending' },
      { to: '/events', icon: FiCalendar, label: 'Events' },
      { to: '/people', icon: FiUsers, label: 'People' },
      { to: '/communities', icon: FiHeart, label: 'Communities' },
    ],
  },
  {
    heading: 'You',
    items: [
      { to: '/location', icon: FiMapPin, label: 'Live Location' },
      { to: '/status', icon: FiClock, label: 'Status' },
      { to: '/gallery', icon: FiImage, label: 'Gallery' },
      { to: '/weather', icon: FiSun, label: 'Weather' },
    ],
  },
  {
    heading: 'Plan',
    items: [
      { to: '/calendar', icon: FiCalendar, label: 'Calendar' },
      { to: '/checkin', icon: FiTarget, label: 'Check In' },
      { to: '/expenses', icon: FiDollarSign, label: 'Expenses' },
      { to: '/ideas', icon: FiPenTool, label: 'Share an Idea' },
    ],
  },
];

export const bottomNavItems = [
  { to: '/notifications', icon: FiBell, label: 'Notifications' },
  { to: '/analytics', icon: FiTrendingUp, label: 'Analytics' },
  { to: '/safety', icon: FiShield, label: 'Safety' },
  { to: '/settings', icon: FiSettings, label: 'Settings' },
];