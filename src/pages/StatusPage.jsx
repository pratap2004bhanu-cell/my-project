import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { FiCheck, FiClock, FiCalendar, FiZap } from 'react-icons/fi';

const statusOptions = [
  { id: 'online', label: 'Online', sub: 'Looking to hang out now', color: 'bg-lime-400', emoji: '🟢' },
  { id: 'available', label: 'Available', sub: 'Free to join activities', color: 'bg-electric-400', emoji: '🔵' },
  { id: 'away', label: 'Away', sub: 'Briefly away', color: 'bg-amber-400', emoji: '🟡' },
  { id: 'busy', label: 'Do Not Disturb', sub: 'Not accepting invites', color: 'bg-red-400', emoji: '🔴' },
  { id: 'offline', label: 'Offline', sub: 'Show as offline', color: 'bg-dark-500', emoji: '⚫' },
];

const availabilityDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const StatusPage = () => {
  const { user, updateUser } = useAuth();
  const socket = useSocket();
  const [status, setStatus] = useState(() => ({
    current: 'available',
    days: [],
    start: '09:00',
    end: '18:00',
    spontaneous: false,
    ...(user?.status || {}),
  }));
  const [saved, setSaved] = useState(false);

  const updateStatus = (patch) => {
    const next = { ...status, ...patch };
    setStatus(next);
    setSaved(false);
    updateUser({ status: next }).then((res) => {
      if (res.success) setSaved(true);
    });
    if (socket) socket.emit('user:status', next);
  };

  const currentOption = statusOptions.find(s => s.id === status.current) || statusOptions[0];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Your Status
          </h1>
          <p className="text-dark-400">Let others know when you're up for activities</p>
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium ${saved ? 'text-lime-400' : 'text-transparent'}`}>
          {saved && <FiCheck className="w-4 h-4" />}
          {saved && 'Saved'}
        </span>
      </div>

      {/* Current status */}
      <div className="glass-strong rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-2xl font-bold overflow-hidden">
              {user?.avatar ? (
                <img src={user.avatar} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0) || 'U'
              )}
            </div>
            <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-dark-900 ${currentOption.color}`}></span>
          </div>
          <div>
            <p className="text-xl font-bold text-white">{user?.name}</p>
            <p className="text-dark-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${currentOption.color}`}></span>
              {currentOption.label}
              {status.days?.length > 0 && (
                <span className="text-dark-500">• free {status.days.join(', ')}</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Set status */}
      <div className="card mb-8">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiZap className="w-5 h-5 text-lime-400" />
          Set your status
        </h2>
        <div className="space-y-3">
          {statusOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => updateStatus({ current: option.id })}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 ${
                status.current === option.id
                  ? 'bg-lime-500/10 border-2 border-lime-500'
                  : 'bg-dark-800/50 border-2 border-dark-700/50 hover:border-dark-600'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-full ${option.color}`}></span>
              <div className="flex-1 text-left">
                <p className="font-semibold text-white">{option.label}</p>
                <p className="text-sm text-dark-400">{option.sub}</p>
              </div>
              {status.current === option.id && (
                <FiCheck className="w-5 h-5 text-lime-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div className="card">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiClock className="w-5 h-5 text-electric-400" />
          Your availability
        </h2>
        <p className="text-sm text-dark-400 mb-5">Pick when you're usually free to meet up. This helps matching.</p>

        {/* Days */}
        <div className="flex flex-wrap gap-2 mb-5">
          {availabilityDays.map((day) => {
            const selected = (status.days || []).includes(day);
            return (
              <button
                key={day}
                onClick={() => {
                  const days = status.days || [];
                  const nextDays = selected ? days.filter(d => d !== day) : [...days, day];
                  updateStatus({ days: nextDays });
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selected
                    ? 'bg-lime-500 text-dark-900'
                    : 'bg-dark-800/50 text-dark-300 border border-dark-700/50 hover:border-dark-600'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Hours */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Available from</label>
            <input
              type="time"
              value={status.start || '09:00'}
              onChange={(e) => updateStatus({ start: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Available until</label>
            <input
              type="time"
              value={status.end || '18:00'}
              onChange={(e) => updateStatus({ end: e.target.value })}
              className="input-field"
            />
          </div>
        </div>

        {/* Open to */}
        <div>
          <label className="block text-sm font-medium text-dark-300 mb-2 flex items-center gap-1.5">
            <FiCalendar className="w-4 h-4" />
            Open to last-minute plans
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => updateStatus({ spontaneous: true })}
              className={`flex-1 p-4 rounded-2xl text-center transition-all ${
                status.spontaneous
                  ? 'bg-sunset-500/20 border-2 border-sunset-500'
                  : 'bg-dark-800/50 border-2 border-dark-700/50 hover:border-dark-600'
              }`}
            >
              <span className="text-2xl mb-1 block">⚡</span>
              <p className="text-sm font-semibold text-white">Yes, call me</p>
              <p className="text-xs text-dark-400 mt-1">Hanglly Now will flag you</p>
            </button>
            <button
              onClick={() => updateStatus({ spontaneous: false })}
              className={`flex-1 p-4 rounded-2xl text-center transition-all ${
                status.spontaneous === false
                  ? 'bg-dark-800/50 border-2 border-dark-500'
                  : 'bg-dark-800/50 border-2 border-dark-700/50 hover:border-dark-600'
              }`}
            >
              <span className="text-2xl mb-1 block">🕐</span>
              <p className="text-sm font-semibold text-white">Plan ahead</p>
              <p className="text-xs text-dark-400 mt-1">Prefer scheduled only</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusPage;