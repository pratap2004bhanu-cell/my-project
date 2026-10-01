import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiZap, FiCalendar, FiCheckCircle, FiTag } from 'react-icons/fi';

/* Colour pairs are theme-aware: on the light canvas a lime fill needs
   dark ink (white on lime is 2.0:1), while the deeper accents keep
   white. Hence `color` per theme rather than one hardcoded string. */
const actions = [
  {
    to: '/create-activity',
    icon: FiTag,
    label: 'New Activity',
    color: 'bg-lime-500 text-dark-900 md:bg-lime-500 md:text-dark-900',
  },
  {
    to: '/kiky',
    icon: FiZap,
    label: 'KIKY Now',
    color: 'bg-signal-500 text-white md:bg-electric-500 md:text-white',
  },
  {
    to: '/checkin',
    icon: FiCheckCircle,
    label: 'Check In',
    color: 'bg-ocean-500 text-white',
  },
  {
    to: '/calendar',
    icon: FiCalendar,
    label: 'Calendar',
    color: 'bg-signal-600 text-white md:bg-hotpink-500 md:text-white',
  },
];

const Fab = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanding actions */}
      <div
        className={`flex flex-col items-end gap-3 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0 translate-y-2 pointer-events-none'
        }`}
      >
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => { navigate(action.to); setOpen(false); }}
            className={`flex items-center gap-3 ${action.color} pl-4 pr-5 py-2.5 rounded-full font-semibold text-sm shadow-lg transition-colors`}
          >
            <span className="whitespace-nowrap">{action.label}</span>
            <action.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Main FAB: ink on lime, so it stays legible on either canvas */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Quick actions"
        aria-expanded={open}
        className={`w-14 h-14 rounded-full bg-lime-500 text-dark-900 flex items-center justify-center shadow-lg transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
      >
        <FiPlus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Fab;