import { useEffect, useMemo, useState, lazy, Suspense, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMapPin, FiCalendar, FiZap, FiSearch, FiPlus, FiFilter,
} from 'react-icons/fi';
import api from '../api';
import { normalizeEvent } from '../utils/normalize';
import { getPosition } from '../utils/location';
import { useAuth } from '../context/AuthContext';
import { EVENT_CATEGORIES, EVENT_FILTERS, categoryMeta } from '../data/eventCategories';
import EventCard from '../components/events/EventCard';

const posKey = (p) => (p ? `${p.lat.toFixed(5)},${p.lng.toFixed(5)}` : 'none');

const EventMap = lazy(() => import('../components/events/EventMap'));

const MapLoading = () => (
  <div className="w-full h-full bg-dark-800 flex items-center justify-center">
    <div className="text-center">
      <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-dark-400 text-sm">Loading map...</p>
    </div>
  </div>
);

const EventsPage = () => {
  const { user } = useAuth();
  const [position, setPosition] = useState(() => {
    const c = user?.location?.coordinates;
    return c && c[0] !== 0 && c[1] !== 0 ? { lat: c[1], lng: c[0] } : null;
  });
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('all');
  const [filter, setFilter] = useState('upcoming');
  const [radius, setRadius] = useState(25);
  const [nearby, setNearby] = useState(true);
  const [events, setEvents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pos = await getPosition(user);
      if (!cancelled && pos) setPosition((prev) => (posKey(prev) === posKey(pos) ? prev : pos));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentPos = useMemo(() => position, [position]);

  const load = useCallback(async (opts = {}) => {
    setLoading(true);
    setError(null);
    const params = {
      q: opts.q ?? q,
      category: opts.category ?? category,
      filter: opts.filter ?? filter,
      range: opts.range ?? radius,
      page: opts.page ?? page,
    };
    if (params.category === 'all') delete params.category;
    if (params.filter === 'upcoming') delete params.filter;
    const useNearby = nearby && currentPos;
    if (useNearby) {
      params.nearby = 1;
      params.lat = currentPos.lat;
      params.lng = currentPos.lng;
    }
    Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
    try {
      const res = await api.get('/api/events', { params });
      setEvents((res.data.events || []).map(normalizeEvent));
      setTotal(res.data.pagination?.total || 0);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [q, category, filter, radius, page, nearby, currentPos]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const selectedCategory = category === 'all' ? null : categoryMeta(category);

  const chips = useMemo(() => [null, ...EVENT_CATEGORIES].slice(0, 15), []);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white flex items-center gap-2">
            <FiCalendar className="text-lime-400" />
            KIKY Events
          </h1>
          <p className="text-dark-400 mt-1">
            Festivals, jams, market days and more — show up, meet people, make memories.
          </p>
        </div>
        <Link
          to="/events/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-lime-500 text-dark-900 font-bold text-sm hover:bg-lime-400 transition-colors"
        >
          <FiPlus className="w-4 h-4" /> Create an event
        </Link>
      </div>

      {/* Search + filters bar */}
      <div className="card p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search events, venues, vibes..."
              className="w-full bg-dark-800/50 border border-dark-700/50 rounded-xl py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-lime-500/40"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-dark-400 font-medium shrink-0">
              <FiMapPin className="w-3.5 h-3.5" /> within
            </span>
            <select
              value={radius}
              onChange={(e) => { setRadius(Number(e.target.value)); setPage(1); }}
              className="bg-dark-800/50 border border-dark-700/50 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
            >
              <option value={1}>1 km</option>
              <option value={2}>2 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={25}>25 km</option>
              <option value={50}>50 km</option>
            </select>
          </div>

          <button
            onClick={() => { setNearby((n) => !n); setPage(1); }}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors ${
              nearby
                ? 'bg-electric-500/10 border-electric-500/30 text-electric-300'
                : 'bg-dark-800/50 border-dark-700/50 text-dark-400'
            }`}
          >
            <FiMapPin className="w-3.5 h-3.5" />
            {nearby ? 'Nearby on' : 'Nearby off'}
          </button>

          <button className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-dark-800/50 border border-dark-700/50 text-dark-300 lg:hidden">
            <FiFilter className="w-3.5 h-3.5" /> Filters
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3 -mx-1 px-1">
          {EVENT_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id); setPage(1); }}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                filter === f.id
                  ? 'bg-lime-500 text-dark-900'
                  : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50'
              }`}
            >
              {f.label}
            </button>
          ))}
          <Link
            to="/my-events"
            className="px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold bg-dark-800/50 text-electric-300 border border-electric-500/20 hover:bg-electric-500/10"
          >
            My events →
          </Link>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 mt-3 -mx-1 px-1">
          {chips.map((c) => {
            if (!c) {
              return (
                <button
                  key="all"
                  onClick={() => { setCategory('all'); setPage(1); }}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                    category === 'all'
                      ? 'bg-lime-500 text-dark-900'
                      : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50'
                  }`}
                >
                  <span>🔥</span> All
                </button>
              );
            }
            return (
              <button
                key={c.id}
                onClick={() => { setCategory(c.id); setPage(1); }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full whitespace-nowrap text-xs font-semibold transition-all ${
                  category === c.id
                    ? 'bg-lime-500 text-dark-900'
                    : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50'
                }`}
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="card p-4 mb-5 flex items-center justify-between gap-3 border border-red-500/30 bg-red-500/10">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={() => load()} className="btn-outline text-sm px-3 py-1.5 flex-shrink-0">Retry</button>
        </div>
      )}

      {/* Map preview */}
      <div className="rounded-2xl overflow-hidden border border-dark-700/50 h-44 sm:h-52 lg:h-64 mb-6 relative">
        <Suspense fallback={<MapLoading />}>
          <EventMap
            events={events}
            center={currentPos ? [currentPos.lat, currentPos.lng] : [28.6139, 77.2090]}
            zoom={currentPos ? 12 : 5}
            userPosition={currentPos ? [currentPos.lat, currentPos.lng] : null}
          />
        </Suspense>
        <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-1.5 bg-dark-950/80 backdrop-blur px-3 py-1.5 rounded-full border border-lime-500/30">
          <span className="relative flex w-2 h-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full w-2 h-2 bg-lime-500"></span>
          </span>
          <span className="text-xs font-medium text-white">
            {events.filter((e) => e.coordinates).length} on map
          </span>
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          {selectedCategory ? (
            <>{selectedCategory.emoji} {selectedCategory.label} events</>
          ) : (
            <><FiZap className="text-lime-400" /> Events for you</>
          )}
          <span className="text-sm font-medium text-dark-400">({total})</span>
        </h2>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="card-glow p-4 animate-pulse">
              <div className="h-28 bg-dark-700/60 rounded-xl mb-3"></div>
              <div className="h-4 bg-dark-700/60 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-dark-700/40 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">🎪</span>
          <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
          <p className="text-dark-400 mb-6">Widen your search or be the first to start one.</p>
          <Link to="/events/new" className="btn-primary">Create an event</Link>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          {total > events.length && (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => setPage((p) => p + 1)}
                className="btn-outline"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EventsPage;