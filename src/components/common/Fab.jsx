import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiZap, FiCalendar, FiCheckCircle, FiTag } from 'react-icons/fi';

const Fab = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const actions = [
    { to: '/create-activity', icon: FiTag, label: 'New Activity', color: 'bg-lime-500 text-dark-900', glow: 'shadow-glow-lime' },
    { to: '/kiky', icon: FiZap, label: "KIKY Now", color: 'bg-electric-500 text-white', glow: 'shadow-glow-electric' },
    { to: '/checkin', icon: FiCheckCircle, label: 'Check In', color: 'bg-ocean-500 text-white', glow: 'shadow-lg' },
    { to: '/calendar', icon: FiCalendar, label: 'Calendar', color: 'bg-hotpink-500 text-white', glow: 'shadow-glow-pink' },
  ];

  return (
    <div className="fixed bottom-24 lg:bottom-8 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanding actions */}
      <div className={`flex flex-col items-end gap-3 transition-all duration-300 ${open ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => { navigate(action.to); setOpen(false); }}
            className={`group flex items-center gap-3 ${action.color} ${action.glow} pl-4 pr-5 py-3 rounded-full font-semibold text-sm hover:scale-105 transition-transform`}
          >
            <span className="whitespace-nowrap">{action.label}</span>
            <action.icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Quick actions"
        className={`w-14 h-14 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 text-dark-900 flex items-center justify-center shadow-glow-lime transition-all duration-300 hover:scale-110 ${open ? 'rotate-45' : ''}`}
      >
        <FiPlus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Fab;