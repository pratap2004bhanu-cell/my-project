import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiChevronRight, FiMapPin, FiUsers } from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import JourneyMap from '../components/map/JourneyMap';
import { RoundAvatar, Logo } from '../components/common';
import { JOURNEY_FILTERS, JOURNEY_LABELS, bucketMeta } from '../data/journeyCategories';

const EMPTY = {
  stats: { places: 0, activities: 0, hosted: 0, people: 0, trails: 0, byCategory: {} },
  places: [],
  memories: [],
  people: [],
  trails: [],
};

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const formatDay = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });
};

/* Counts up once on mount. Purely decorative, and skipped entirely when
   the user prefers reduced motion. */
function useCountUp(target) {
  const [value, setValue] = useState(0);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);

  useEffect(() => {
    const to = Number(target) || 0;
    if (reduced.current || to === 0) {
      setValue(to);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const dur = 480;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(to * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return value;
}

const StatChip = ({ label, value, isPrimary }) => {
  const shown = useCountUp(value);
  return (
    <div className={`journey-stat${isPrimary ? ' journey-stat-primary' : ''}`}>
      <p className="journey-stat-value journey-count">{shown}</p>
      <p className="journey-stat-label">{label}</p>
    </div>
  );
};

const MemoryCard = ({ memory, onOpen }) => {
  const photo = memory.photos?.[0];
  return (
    <button
      type="button"
      onClick={() => onOpen?.(memory)}
      className="journey-memory w-full text-left flex gap-3 p-3"
    >
      {photo ? (
        <img
          src={photo}
          alt=""
          loading="lazy"
          className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl grid place-items-center text-2xl bg-white/5 flex-shrink-0">
          {memory.emoji}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate" style={{ color: '#E8EDF2' }}>
          {memory.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8FA0B5' }}>
          {JOURNEY_LABELS[memory.bucket] || 'Activity'}
          {memory.occurredAt ? ` · ${formatDate(memory.occurredAt)}` : ''}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {memory.participants?.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: '#7A8899' }}>
              <FiUsers className="w-3 h-3" />
              {memory.participants.length} with you
            </span>
          )}
          {memory.hosted && (
            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(124,255,107,0.12)', color: '#7CFF6B' }}>
              Hosted
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

const PlaceSheet = ({ place, memories, onClose, onViewMemories }) => {
  if (!place) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/55"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-x-0 bottom-0 z-[61] journey-sheet max-h-[78vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="journey-sheet-grab" />
        <div className="px-5 pt-3 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider" style={{ color: '#7A8899' }}>
                {place.momentCount} {place.momentCount === 1 ? 'moment' : 'moments'} here
              </p>
              <h3 className="text-xl font-bold mt-1 truncate" style={{ color: '#F2F5F8' }}>
                {place.label}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.06)', color: '#B6C0CC' }}
            >
              <FiArrowLeft className="w-4 h-4 rotate-90" />
            </button>
          </div>

          {place.breakdown?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {place.breakdown.map((b) => {
                const meta = bucketMeta(b.bucket);
                return (
                  <span key={b.bucket} className="journey-chip !py-1 !px-2.5 !text-xs">
                    <span>{meta.emoji}</span>
                    <span>{JOURNEY_LABELS[b.bucket] || 'Other'}</span>
                    <span style={{ color: '#7A8899' }}>{b.count}</span>
                  </span>
                );
              })}
            </div>
          )}

          {place.hasCoords && (
            <p className="flex items-center gap-1.5 text-xs mt-3" style={{ color: '#8FA0B5' }}>
              <FiMapPin className="w-3.5 h-3.5" />
              Saved from your activity history
            </p>
          )}

          <div className="space-y-2 mt-4">
            {memories.map((m) => (
              <MemoryCard key={m.activityId} memory={m} />
            ))}
          </div>

          <button
            type="button"
            onClick={onViewMemories}
            className="w-full mt-4 h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            style={{ background: '#7CFF6B', color: '#0B0F14' }}
          >
            View Memories
            <FiChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
};

const JourneyPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [memoriesOpen, setMemoriesOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/api/journey')
      .then((res) => {
        if (!cancelled) {
          setData(res.data || EMPTY);
          setError('');
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.response?.data?.error || 'Could not load your journey');
          setData(EMPTY);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  // Only the current user's own position is ever used here, and it is
  // derived during render rather than stored — there is nothing to sync.
  const me = useMemo(() => {
    const coords = user?.location?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    const [lng, lat] = coords;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
    if (lat === 0 && lng === 0) return null; // the model's default placeholder
    return [lat, lng];
  }, [user]);

  const filteredMemories = useMemo(() => {
    const all = data?.memories || [];
    if (filter === 'all') return all;
    return all.filter((m) => m.bucket === filter);
  }, [data, filter]);

  const visiblePlaces = useMemo(() => {
    const all = data?.places || [];
    if (filter === 'all') return all;
    const keep = new Set(filteredMemories.map((m) => m.activityId));
    return all
      .map((p) => ({
        ...p,
        activities: p.activities.filter((a) => keep.has(a)),
      }))
      .filter((p) => p.activities.length > 0);
  }, [data, filter, filteredMemories]);

  const selectedMemories = useMemo(() => {
    if (!selected) return [];
    return filteredMemories.filter((m) => selected.activities.includes(m.activityId));
  }, [selected, filteredMemories]);

  const selectPlace = useCallback((place) => {
    setMemoriesOpen(false);
    setSelected(place);
  }, []);

  const visibleTrails = useMemo(() => {
    if (filter === 'all') return data?.trails || [];
    return (data?.trails || []).filter((t) => t.stops.some((s) => s.bucket === filter));
  }, [data, filter]);

  const isEmpty = !loading && (data?.memories?.length || 0) === 0;

  if (loading) {
    return (
      <div className="journey-shell min-h-screen grid place-items-center">
        <p className="text-sm" style={{ color: '#8FA0B5' }}>Tracing your journey…</p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="journey-shell min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-3xl grid place-items-center mb-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <FiMapPin className="w-8 h-8" style={{ color: '#7CFF6B' }} />
        </div>
        <h1 className="text-2xl font-bold" style={{ color: '#F2F5F8' }}>
          Your Kiky Journey starts here.
        </h1>
        <p className="mt-2 text-sm max-w-sm" style={{ color: '#8FA0B5' }}>
          Join your first activity and your map will begin to grow.
        </p>
        <Link
          to="/nearby"
          className="mt-6 h-12 px-6 rounded-xl font-semibold text-sm inline-flex items-center"
          style={{ background: '#7CFF6B', color: '#0B0F14' }}
        >
          Discover Activities
        </Link>
        {error && <p className="mt-4 text-xs" style={{ color: '#8FA0B5' }}>{error}</p>}
      </div>
    );
  }

  const stats = data.stats;
  const recent = filteredMemories.slice(0, 8);

  return (
    <div className="journey-shell min-h-screen">
      {/* Header */}
      <header className="px-4 sm:px-6 pt-4 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="w-10 h-10 rounded-xl grid place-items-center flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.05)', color: '#B6C0CC' }}
            >
              <FiArrowLeft className="w-4 h-4" />
            </button>
            <Logo size={96} className="hidden sm:block" style={{ color: '#F2F5F8', width: 84, height: 28 }} />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold mt-4" style={{ color: '#F2F5F8', letterSpacing: '-0.02em' }}>
          Your Kiky Journey
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8FA0B5' }}>
          Every plan becomes a memory.
        </p>
      </header>

      {/* Statistics — horizontal scroll on mobile, so the map keeps the screen */}
      <div className="px-4 sm:px-6">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4">
          <StatChip label="Places Explored" value={stats.places} isPrimary />
          <StatChip label="Activities" value={stats.activities} />
          <StatChip label="Social Plans" value={stats.byCategory?.social || 0} />
          <StatChip label="Gaming" value={stats.byCategory?.gaming || 0} />
          <StatChip label="Hosted" value={stats.hosted} />
          <StatChip label="People Met" value={stats.people} />
        </div>
      </div>

      {/* Map + content: stacked on mobile, side-by-side on desktop */}
      <div className="px-4 sm:px-6 pb-8 mt-3 lg:grid lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-6 lg:items-start">
        {/* Left column on desktop: filters, memories, people, trails */}
        <div className="lg:order-1 space-y-5">
          <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-wrap">
            {JOURNEY_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => { setFilter(f.id); setSelected(null); }}
                className={`journey-chip ${filter === f.id ? 'journey-chip-active' : ''}`}
              >
                <span>{f.emoji}</span>
                <span>{f.label}</span>
              </button>
            ))}
          </div>

          {recent.length > 0 && (
            <section>
              <p className="journey-heading mb-2">
                {filter === 'all' ? 'Recent Memories' : `${JOURNEY_LABELS[filter]} Memories`}
              </p>
              <div className="space-y-2">
                {recent.map((m) => (
                  <MemoryCard key={m.activityId} memory={m} onOpen={(mem) => {
                    const place = (data.places || []).find((p) => p.activities.includes(mem.activityId));
                    if (place) selectPlace(place);
                  }} />
                ))}
              </div>
            </section>
          )}

          {visibleTrails.length > 0 && (
            <section>
              <p className="journey-heading mb-2">Your Trails</p>
              <div className="space-y-2">
                {visibleTrails.slice(0, 4).map((trail) => (
                  <div key={trail.key} className="journey-memory p-3">
                    <p className="text-sm font-semibold" style={{ color: '#E8EDF2' }}>
                      Your {trail.weekday} Trail
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#8FA0B5' }}>
                      {formatDay(trail.date)}
                    </p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                      {trail.stops.map((s, i) => (
                        <span key={s.activityId} className="flex items-center gap-1.5">
                          {i > 0 && <span style={{ color: '#5A6675' }}>→</span>}
                          <span className="text-xs" title={s.title} style={{ color: '#B6C0CC' }}>
                            {s.emoji}
                          </span>
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] mt-2" style={{ color: '#7A8899' }}>
                      {trail.activityCount} activities · {trail.peopleCount}{' '}
                      {trail.peopleCount === 1 ? 'person' : 'people'} · 1 day
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(data.people?.length || 0) > 0 && (
            <section>
              <p className="journey-heading mb-2">
                People I've Met · {data.people.length}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {data.people.slice(0, 24).map((p) => (
                  <Link
                    key={p.userId}
                    to={`/users/${p.userId}`}
                    className="flex flex-col items-center gap-1.5 w-14 flex-shrink-0"
                  >
                    <RoundAvatar
                      src={p.avatar}
                      name={p.name}
                      className="w-11 h-11 text-sm"
                      gradient="from-lime-500 to-electric-500"
                    />
                    <span className="text-[10px] truncate w-full text-center" style={{ color: '#8FA0B5' }}>
                      {p.name?.split(' ')[0]}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right column on desktop, hero on mobile */}
        <div className="lg:order-2">
          <div className="h-[58vh] min-h-[380px] lg:h-[calc(100vh-220px)] lg:sticky lg:top-6">
            <JourneyMap
              places={visiblePlaces}
              memories={filteredMemories}
              selectedKey={selected?.key}
              onSelectPlace={selectPlace}
              me={me}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>

      {selected && (
        <PlaceSheet
          place={selected}
          memories={selectedMemories}
          onClose={() => setSelected(null)}
          onViewMemories={() => setMemoriesOpen(true)}
        />
      )}

      {memoriesOpen && selected && (
        <div className="fixed inset-0 z-[62] overflow-y-auto journey-shell">
          <div className="max-w-3xl mx-auto px-4 py-5">
            <button
              type="button"
              onClick={() => setMemoriesOpen(false)}
              className="inline-flex items-center gap-2 text-sm"
              style={{ color: '#B6C0CC' }}
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to map
            </button>
            <h2 className="text-2xl font-bold mt-4" style={{ color: '#F2F5F8' }}>
              {selected.label}
            </h2>
            <p className="text-sm mt-1 mb-5" style={{ color: '#8FA0B5' }}>
              Your memories here
            </p>
            <div className="space-y-2">
              {selectedMemories.map((m) => (
                <MemoryCard key={m.activityId} memory={m} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyPage;