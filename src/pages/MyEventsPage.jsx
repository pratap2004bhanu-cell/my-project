import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar, FiPlus, FiUsers, FiEye, FiHeart,
  FiTrash2, FiRepeat, FiEdit,
} from 'react-icons/fi';
import api from '../api';
import { normalizeEvent } from '../utils/normalize';
import EventCard from '../components/events/EventCard';

const MyEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/api/events?mine=1');
      setEvents((data.events || []).map(normalizeEvent));
      try {
        const s = await api.get('/api/events/organizer/stats');
        setStats(s.data.stats);
      } catch {
        setStats(null);
      }
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load your events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (event) => {
    if (!window.confirm(`Cancel "${event.title}"? This tells attendees the event is off.`)) return;
    try {
      await api.put(`/api/events/${event.id}`, { status: 'cancelled' });
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not cancel event');
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white flex items-center gap-2">
            <FiCalendar className="text-lime-400" />
            My events
          </h1>
          <p className="text-dark-400 mt-1">Everything you're hosting on KIKY.</p>
        </div>
        <Link to="/events/new" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-lime-500 text-dark-900 font-bold text-sm hover:bg-lime-400 transition-colors">
          <FiPlus className="w-4 h-4" /> New event
        </Link>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total events', value: stats.total, icon: <FiCalendar className="w-4 h-4 text-lime-400" /> },
            { label: 'Upcoming', value: stats.upcoming, icon: <FiRepeat className="w-4 h-4 text-electric-300" /> },
            { label: 'Going', value: stats.going, icon: <FiUsers className="w-4 h-4 text-hotpink-400" /> },
            { label: 'Interested', value: stats.interested, icon: <FiHeart className="w-4 h-4 text-sunset-400" /> },
          ].map((s) => (
            <div key={s.label} className="card p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-dark-800 flex items-center justify-center">{s.icon}</div>
              <div>
                <p className="text-xl font-bold text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-dark-400 mt-1">{s.label}</p>
              </div>
            </div>
          ))}
          {stats.views > 0 && (
            <div className="card p-4 flex items-center gap-3 col-span-2 sm:col-span-4">
              <div className="w-9 h-9 rounded-xl bg-dark-800 flex items-center justify-center"><FiEye className="w-4 h-4 text-electric-300" /></div>
              <p className="text-sm text-dark-300"><span className="text-xl font-bold text-white">{stats.views}</span> total views across your events</p>
            </div>
          )}
        </div>
      )}

      {error && <div className="card p-4 mb-4 border border-red-500/30 bg-red-500/10"><p className="text-sm text-red-400">{error}</p></div>}

      {events.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">🎪</span>
          <h3 className="text-xl font-bold text-white mb-2">You haven't hosted anything yet</h3>
          <p className="text-dark-400 mb-6">Start with a small thing — a jam, a market stall, a match.</p>
          <Link to="/events/new" className="btn-primary">Create your first event</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div key={event.id}>
              <EventCard event={event} />
              <div className="flex items-center gap-2 mt-2 px-1">
                {event.status === 'cancelled' ? (
                  <span className="text-xs text-hotpink-400 font-semibold">Cancelled</span>
                ) : event.status === 'completed' ? (
                  <span className="text-xs text-electric-300 font-semibold">Completed</span>
                ) : event.status === 'draft' ? (
                  <>
                    <span className="text-xs text-dark-400 font-semibold">Draft</span>
                    <Link to={`/events/edit/${event.id}`} className="text-xs text-lime-400 hover:underline">Publish now →</Link>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-lime-400 font-semibold">Live</span>
                    <span className="text-xs text-dark-500">· {event.goingCount} going · {event.interestedCount} interested</span>
                  </>
                )}
                <div className="ml-auto flex gap-2">
                  <Link to={`/events/edit/${event.id}`} className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center text-dark-300 hover:text-white transition-colors" title="Edit">
                    <FiEdit className="w-4 h-4" />
                  </Link>
                  {!['cancelled', 'completed'].includes(event.status) && (
                    <button onClick={() => cancel(event)} className="w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center text-hotpink-400 hover:bg-hotpink-500/10 transition-colors" title="Cancel event">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEventsPage;