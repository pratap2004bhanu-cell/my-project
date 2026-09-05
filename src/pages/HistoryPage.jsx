import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, FiClock, FiMapPin, FiUsers, FiTarget,
  FiCheckCircle, FiXCircle, FiDownload, FiArrowRight
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDateLabel } from '../utils/normalize';

const HistoryPage = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState('all');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await api.get('/api/activities');
        const all = res.data.activities || [];
        const mine = all.filter((a) =>
          a.status === 'completed' || a.status === 'cancelled' ||
          a.isCreator || (a.participants || []).some((p) => p.user && String(p.user._id || p.user) === String(user?.id))
        );
        if (cancelled) return;
        const mapped = mine.map((a) => {
          const feedbackRatings = (a.feedback || []).map((f) => f.rating).filter(Boolean);
          return {
            id: a._id,
            title: a.title,
            category: a.category,
            emoji: a.emoji || '🎯',
            date: formatDateLabel(a.date, ''),
            time: a.time,
            location: a.location?.address || 'Location TBA',
            role: a.isCreator ? 'host' : 'participant',
            status: a.status || 'upcoming',
            participants: (a.participants || []).length,
            rating: feedbackRatings.length
              ? Math.round(feedbackRatings.reduce((s, r) => s + r, 0) / feedbackRatings.length)
              : null,
          };
        });
        setHistory(mapped);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.error || 'Failed to load history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = {
    totalActivities: history.length || (user?.stats?.activitiesJoined || 0),
    completed: history.filter((h) => h.status === 'completed').length,
    cancelled: history.filter((h) => h.status === 'cancelled').length,
    hostCount: history.filter((h) => h.role === 'host').length,
    participantCount: user?.stats?.connections || 0,
    avgRating: user?.stats?.rating || 0,
    totalHours: history.filter((h) => h.status === 'completed').length * 2,
    favoriteCategory: (() => {
      const counts = {};
      history.forEach((h) => { counts[h.category] = (counts[h.category] || 0) + 1; });
      const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
      return best ? best[0].charAt(0).toUpperCase() + best[0].slice(1) : '—';
    })(),
  };

  const filteredHistory = filter === 'all' 
    ? history 
    : filter === 'hosted'
      ? history.filter(h => h.role === 'host')
      : history.filter(h => h.status === filter);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Activity History
          </h1>
          <p className="text-dark-400">Your past activities and stats</p>
        </div>
        <button className="btn-outline flex items-center gap-2">
          <FiDownload className="w-4 h-4" />
          Export
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="card text-center py-12 mb-6">
          <span className="text-4xl mb-3 block">⚠️</span>
          <p className="text-dark-300">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary mt-4">Retry</button>
        </div>
      ) : (
      <>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-white mb-1">{stats.totalActivities}</div>
          <div className="text-sm text-dark-400">Total Activities</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-lime-400 mb-1">{stats.completed}</div>
          <div className="text-sm text-dark-400">Completed</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-electric-400 mb-1">{stats.hostCount}</div>
          <div className="text-sm text-dark-400">Hosted</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-3xl font-bold text-amber-400 mb-1">{stats.totalHours}h</div>
          <div className="text-sm text-dark-400">Total Time</div>
        </div>
      </div>

      {/* More Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-lime-500/20 rounded-xl flex items-center justify-center">
              <FiTarget className="w-6 h-6 text-lime-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.favoriteCategory}</div>
              <div className="text-sm text-dark-400">Favorite Category</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <FiCheckCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.avgRating}</div>
              <div className="text-sm text-dark-400">Avg Rating</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-electric-500/20 rounded-xl flex items-center justify-center">
              <FiUsers className="w-6 h-6 text-electric-400" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stats.participantCount}</div>
              <div className="text-sm text-dark-400">People Met</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', name: 'All' },
          { id: 'completed', name: 'Completed' },
          { id: 'cancelled', name: 'Cancelled' },
          { id: 'hosted', name: 'Hosted' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              filter === f.id
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.map((item) => (
          <Link key={item.id} to={`/activities/${item.id}`} className="card flex flex-col sm:flex-row gap-4 p-4 block group hover:border-lime-500/40 transition-colors">
            <div className={`w-full sm:w-16 h-16 bg-gradient-to-br ${item.category === 'cricket' ? 'from-green-500/20 to-emerald-600/20' : 'from-lime-500/20 to-electric-500/20'} rounded-2xl flex items-center justify-center text-3xl flex-shrink-0`}>
              {item.emoji}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-white group-hover:text-lime-400 transition-colors">{item.title}</h3>
                  <p className="text-sm text-dark-400 flex items-center gap-1">
                    <FiMapPin className="w-3 h-3" />
                    {item.location}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  item.status === 'completed' 
                    ? 'bg-lime-500/20 text-lime-400'
                    : item.status === 'cancelled'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-electric-500/20 text-electric-400'
                }`}>
                  {item.status}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-dark-400">
                <span className="flex items-center gap-1">
                  <FiCalendar className="w-3 h-3" />
                  {item.date}
                </span>
                <span className="flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {item.time}
                </span>
                <span className="flex items-center gap-1">
                  <FiUsers className="w-3 h-3" />
                  {item.participants} people
                </span>
                {item.role === 'host' && (
                  <span className="px-2 py-0.5 bg-electric-500/20 text-electric-400 rounded text-xs">
                    Host
                  </span>
                )}
                {item.rating && (
                  <span className="text-amber-400">
                    {'★'.repeat(item.rating)}
                  </span>
                )}
                <FiArrowRight className="w-4 h-4 ml-auto text-dark-600 group-hover:text-lime-400 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">📋</span>
          <h3 className="text-xl font-bold text-white mb-2">No activities found</h3>
          <p className="text-dark-400 mb-6">Try a different filter</p>
          <button onClick={() => setFilter('all')} className="btn-primary">
            Show All
          </button>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default HistoryPage;