import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, FiClock, FiMapPin, FiUsers, FiPlus,
  FiChevronLeft, FiChevronRight, FiTarget
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { normalizeActivity } from '../utils/normalize';
import api from '../api';

const CalendarPage = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/api/activities?joined=1')
      .then((res) => {
        if (!mounted) return;
        const list = (res.data.activities || [])
          .map(normalizeActivity)
          .filter((a) => a.dateRaw)
          .map((a) => ({
            id: a.id,
            title: a.title,
            emoji: a.emoji,
            date: new Date(a.dateRaw),
            time: a.timeRaw || '',
            location: a.address,
            participants: a.participants,
            color: a.color,
          }));
        setActivities(list);
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getActivityForDate = (date) => {
    if (!date) return [];
    return activities.filter(a => 
      a.date.getDate() === date.getDate() &&
      a.date.getMonth() === date.getMonth() &&
      a.date.getFullYear() === date.getFullYear()
    );
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    if (!date) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const upcomingActivities = activities
    .filter(a => a.date >= new Date())
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  const monthActivities = activities.filter((a) =>
    a.date.getMonth() === selectedDate.getMonth() &&
    a.date.getFullYear() === selectedDate.getFullYear()
  );
  const hoursPlanned = monthActivities.length * 2;
  const peopleMeeting = monthActivities.reduce((sum, a) => sum + (a.participants || 0), 0);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Calendar
          </h1>
          <p className="text-dark-400">View and manage your activities</p>
        </div>
        <Link to="/create-activity" className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          New Activity
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button 
                onClick={() => navigateMonth(-1)}
                className="btn-icon"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white">
                {selectedDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <button 
                onClick={() => navigateMonth(1)}
                className="btn-icon"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-sm font-medium text-dark-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(selectedDate).map((date, idx) => {
                const dayActivities = getActivityForDate(date);
                return (
                  <button
                    key={idx}
                    onClick={() => date && setSelectedDate(date)}
                    disabled={!date}
                    className={`relative aspect-square p-1 rounded-xl transition-all ${
                      !date ? 'cursor-default' :
                      isSelected(date) ? 'bg-lime-500 text-dark-900' :
                      isToday(date) ? 'bg-lime-500/20 text-lime-400' :
                      'hover:bg-dark-800/50 text-white'
                    }`}
                  >
                    {date && (
                      <>
                        <span className={`text-sm font-medium ${isSelected(date) ? 'text-dark-900' : ''}`}>
                          {date.getDate()}
                        </span>
                        {dayActivities.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {dayActivities.slice(0, 3).map((a, i) => (
                              <span key={i} className="w-1.5 h-1.5 bg-lime-500 rounded-full" />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Activities */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Activities on {selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric' })}
            </h3>
            {loading ? (
              <div className="card p-8 text-center text-dark-400">Loading your activities...</div>
            ) : getActivityForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getActivityForDate(selectedDate).map((activity) => (
                  <Link
                    key={activity.id}
                    to={`/activities/${activity.id}`}
                    className="card flex items-center gap-4 p-4 block group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-xl flex items-center justify-center text-2xl">
                      {activity.emoji}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-white group-hover:text-lime-400 transition-colors">
                        {activity.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-dark-400">
                        <span className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {activity.time || 'Anytime'}
                        </span>
                        <span className="flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" />
                          {activity.location}
                        </span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-sm text-dark-400">
                      <FiUsers className="w-4 h-4" />
                      {activity.participants}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="card p-6 text-center">
                <span className="text-4xl mb-2 block">📅</span>
                <p className="text-dark-400">No activities scheduled</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Upcoming */}
        <div>
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upcoming Activities</h3>
            {upcomingActivities.length > 0 ? (
              <div className="space-y-3">
                {upcomingActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-lg flex items-center justify-center text-xl">
                      {activity.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white text-sm truncate">{activity.title}</h4>
                      <p className="text-xs text-dark-400">
                        {activity.date.toLocaleDateString('default', { month: 'short', day: 'numeric' })} • {activity.time || 'Anytime'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-dark-400 text-sm">No upcoming activities yet.</p>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card p-6 mt-6">
            <h3 className="text-lg font-semibold text-white mb-4">This Month</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-dark-400">Total Activities</span>
                <span className="text-white font-bold">{monthActivities.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">Hours Planned</span>
                <span className="text-white font-bold">{hoursPlanned}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dark-400">People Meeting</span>
                <span className="text-white font-bold">{peopleMeeting}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;