import { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft, FiCalendar, FiClock, FiMapPin, FiUsers,
  FiHeart, FiShare2, FiFlag, FiLink, FiEdit, FiX, FiStar, FiTrash2,
} from 'react-icons/fi';
import api from '../api';
import { normalizeEvent, normalizeMoment } from '../utils/normalize';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { categoryMeta, EVENT_CATEGORY_GRADIENTS } from '../data/eventCategories';
import EventChatPanel from '../components/events/EventChatPanel';
import PeopleGoing from '../components/events/PeopleGoing';
import SquadList from '../components/events/SquadCard';
import SquadForm from '../components/events/SquadForm';
import ShareEvent from '../components/events/ShareEvent';
import EventMomentCard from '../components/events/EventMomentCard';

const EventMap = lazy(() => import('../components/events/EventMap'));

const MapLoading = () => (
  <div className="w-full h-48 lg:h-64 bg-dark-800 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const StatusBadge = ({ status }) => {
  const meta = {
    draft: ['text-gray-400', 'Draft'],
    cancelled: ['text-hotpink-400', 'Cancelled'],
    completed: ['text-electric-300', 'Ended'],
    rejected: ['text-red-400', 'Not approved'],
    live: ['text-lime-400', 'Live'],
  };
  const [cls, label] = meta[status] || meta.live;
  return <span className={`text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-white/5 ${cls}`}>{label}</span>;
};

const EventDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const socket = useSocket();
  const meId = user?.id;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const [squads, setSquads] = useState([]);
  const [moments, setMoments] = useState([]);
  const [attendees, setAttendees] = useState([]);

  const [showShare, setShowShare] = useState(false);
  const [showSquadForm, setShowSquadForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportText, setReportText] = useState('');
  const [commentsMoment, setCommentsMoment] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [toast, setToast] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      const c = user?.location?.coordinates;
      if (c && c[0] !== 0 && c[1] !== 0) {
        params.lat = c[1];
        params.lng = c[0];
      }
      const [{ data: d }, { data: s }, { data: m }, { data: a }] = await Promise.all([
        api.get(`/api/events/${id}`, { params }),
        api.get(`/api/events/${id}/squads`),
        api.get(`/api/events/${id}/moments`),
        api.get(`/api/events/${id}/attendees`),
      ]);
      setEvent(normalizeEvent(d.event));
      setSquads(s.squads || []);
      setMoments((m.moments || []).map((x) => normalizeMoment(x, meId)));
      setAttendees((a.users || []).map((u) => ({ ...u, _id: u.id })));
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load this event');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, meId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const act = async (method, path, body) => {
    setBusy(true);
    try {
      const res = await api({ method, url: path, data: body });
      const updated = res.data.myStatus != null ? { ...event, myStatus: res.data.myStatus, interestedCount: res.data.interestedCount, goingCount: res.data.goingCount } : null;
      if (updated) setEvent(normalizeEvent({ ...updated, _id: event.id }));
      loadDetail();
      return res.data;
    } catch (err) {
      showToast(err?.response?.data?.error || 'Something went wrong');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const toggleInterest = () => act('post', `/api/events/${id}/interested`);
  const removeInterest = () => act('delete', `/api/events/${id}/interested`);
  const join = () => act('post', `/api/events/${id}/join`);
  const leave = () => act('delete', `/api/events/${id}/leave`);

  const createSquad = async (body) => {
    const res = await act('post', `/api/events/${id}/squads`, body);
    if (res?.squad) return true;
    return false;
  };

  const removeEvent = async () => {
    if (!window.confirm(`Delete "${event?.title}"? This permanently removes the event, squads, moments and messages. This cannot be undone.`)) return;
    try {
      await api.delete(`/api/events/${id}`);
      showToast('Event deleted');
      navigate('/my-events');
    } catch (err) {
      showToast(err?.response?.data?.error || 'Could not delete event');
    }
  };
  const joinSquad = (squad) => act('post', `/api/events/${id}/squads/${squad._id}/join`).then((r) => r && loadDetail());
  const leaveSquad = (squad) => act('delete', `/api/events/${id}/squads/${squad._id}/leave`).then((r) => r && loadDetail());
  const deleteSquad = (squad) => act('delete', `/api/events/${id}/squads/${squad._id}`).then((r) => r && loadDetail());

  const likeMoment = (moment) =>
    act('post', `/api/events/${id}/moments/${moment.id}/like`);

  const addComment = async () => {
    const text = commentText.trim();
    if (!text || !commentsMoment) return;
    const r = await act('post', `/api/events/${id}/moments/${commentsMoment.id}/comments`, { text });
    if (r?.moment) {
      setMoments((prev) => prev.map((x) => (x.id === commentsMoment.id ? normalizeMoment(r.moment, meId) : x)));
      setCommentText('');
    }
  };

  const report = async () => {
    if (!reportText.trim()) return;
    const r = await act('post', `/api/events/${id}/report`, { details: reportText });
    if (r) {
      setShowReport(false);
      setReportText('');
      showToast('Thanks — we will review this event.');
    }
  };

  if (loading && !event) return <div className="p-8 flex justify-center"><div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (error && !event) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-400 hover:text-white mb-4"><FiArrowLeft /> Back</button>
        <div className="card p-6 text-center">
          <span className="text-5xl block mb-3">🎪</span>
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const meta = categoryMeta(event.category);
  const gradient = EVENT_CATEGORY_GRADIENTS[event.category] || 'from-lime-500 to-electric-600';
  const isGoing = event.myStatus === 'going';
  const isInterested = event.myStatus === 'interested';

  const actions = event.isOrganizer ? null : isGoing ? (
    <div className="flex gap-2 w-full">
      <button onClick={leave} disabled={busy} className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-dark-800 text-hotpink-400 border border-hotpink-500/30 hover:bg-hotpink-500/10 transition-colors">
        Can't make it
      </button>
      <button onClick={() => setShowShare(true)} className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl text-sm font-bold btn-primary flex-1">
        <FiShare2 className="w-4 h-4" /> Invite friends
      </button>
    </div>
  ) : (
    <div className="flex gap-2 w-full">
      <button
        onClick={join}
        disabled={busy || event.isFull}
        className="flex-1 py-3.5 rounded-2xl text-sm font-bold btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isInterested ? "I'm going ✓" : "I'm going"}
      </button>
      {isInterested ? (
        <button onClick={removeInterest} disabled={busy} className="px-4 py-3.5 rounded-2xl text-sm font-semibold bg-dark-800 text-dark-300 border border-dark-700 hover:text-white transition-colors" title="Remove interest">
          <FiX className="w-4 h-4" />
        </button>
      ) : (
        <button onClick={toggleInterest} disabled={busy} className="flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-2xl text-sm font-semibold bg-dark-800 text-hotpink-400 border border-hotpink-500/20 hover:bg-hotpink-500/10 transition-colors">
          <FiHeart className={`w-4 h-4 ${isInterested ? 'fill-hotpink-400' : ''}`} />
          Interested
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 lg:p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-400 hover:text-white mb-4 text-sm">
        <FiArrowLeft /> Back
      </button>

      {/* Cover */}
      <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${gradient} h-44 sm:h-56 lg:h-72 flex items-center justify-center`}>
        {event.coverImage ? (
          <img
            src={event.coverImage}
            alt={event.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <span className="text-7xl lg:text-8xl drop-shadow-xl">{event.emoji || meta.emoji}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent"></div>
        <div className="absolute top-3 right-3 flex gap-2">
          <StatusBadge status={event.moderationStatus === 'approved' ? 'live' : event.moderationStatus} />
          {event.isFull && <span className="text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-hotpink-500 text-white">Full</span>}
        </div>
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-white text-2xl sm:text-3xl lg:text-4xl leading-tight">{event.title}</h1>
            <p className="text-white/80 text-sm mt-1">{meta.emoji} {meta.label} · {event.dateLabel}</p>
          </div>
          <label className="text-2xl font-extrabold bg-white/95 text-dark-900 px-3 py-1.5 rounded-2xl shrink-0">{event.priceLabel}</label>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action row */}
          <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-electric-500 to-lime-500 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
                {event.organizer?.avatar ? (
                  <img src={event.organizer.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  (event.organizerName || '?')[0]
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-dark-400">Hosted by</p>
                <p className="font-semibold text-white truncate">{event.organizerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowShare(true)} className="btn-outline px-4 py-2.5 text-sm flex items-center gap-1.5">
                <FiShare2 className="w-4 h-4" /> Share
              </button>
              {event.isOrganizer && (
                <Link to={`/events/edit/${event.id}`} className="btn-outline px-4 py-2.5 text-sm flex items-center gap-1.5">
                  <FiEdit className="w-4 h-4" /> Edit
                </Link>
              )}
              {event.isOrganizer && (
                <button onClick={removeEvent} className="btn-outline px-4 py-2.5 text-sm flex items-center gap-1.5 text-hotpink-400 hover:bg-hotpink-500/10">
                  <FiTrash2 className="w-4 h-4" /> Delete
                </button>
              )}
              {!event.isOrganizer && (
                <button onClick={() => setShowReport(true)} className="btn-outline px-4 py-2.5 text-sm flex items-center gap-1.5 text-hotpink-400">
                  <FiFlag className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => setMapOpen(true)} className="btn-outline px-4 py-2.5 text-sm flex items-center gap-1.5">
                <FiMapPin className="w-4 h-4" /> Map
              </button>
            </div>
          </div>

          {/* CTA + stats */}
          <div className="card p-5">
            {event.status === 'cancelled' ? (
              <p className="text-hotpink-400 font-semibold text-center py-2">This event has been cancelled by the host.</p>
            ) : (
              actions
            )}
            <div className="flex items-center justify-around mt-5 pt-4 border-t border-dark-800 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{event.goingCount}</p>
                <p className="text-xs text-dark-400">going</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-hotpink-400">{event.interestedCount}</p>
                <p className="text-xs text-dark-400">interested</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-electric-300">{event.remainingSpots == null ? '∞' : event.remainingSpots}</p>
                <p className="text-xs text-dark-400">spots left</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4 text-lg">Event details</h2>
            {event.description ? (
              <p className="text-dark-200 whitespace-pre-line leading-relaxed">{event.description}</p>
            ) : (
              <p className="text-dark-400">The host hasn't added a description yet.</p>
            )}

            {event.schedule?.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3"><FiClock className="text-lime-400" /> Schedule</h3>
                <div className="space-y-2">
                  {event.schedule.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm bg-dark-800/40 rounded-xl px-4 py-2.5">
                      <span className="text-lime-400 font-bold shrink-0">{item.time}</span>
                      <span className="text-dark-200">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.rules?.length > 0 && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-white mb-3">Rules</h3>
                <ul className="space-y-1.5 text-sm text-dark-300 list-disc list-inside">
                  {event.rules.map((rule, i) => <li key={i}>{rule}</li>)}
                </ul>
              </div>
            )}

            {event.organizerContact && (
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-white mb-2">Contact host</h3>
                <p className="text-sm text-dark-300 flex items-center gap-2">
                  <FiLink className="w-4 h-4 text-lime-400" /> {event.organizerContact}
                </p>
              </div>
            )}
          </div>

          {/* Info chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/" className="card p-4 text-center group">
              <FiMapPin className="w-5 h-5 mx-auto mb-2 text-lime-400" />
              <p className="text-xs text-dark-400 truncate">{event.distance || event.venueName}</p>
            </Link>
            <div className="card p-4 text-center">
              <FiCalendar className="w-5 h-5 mx-auto mb-2 text-electric-300" />
              <p className="text-xs text-dark-400 truncate">{event.dateLabel}</p>
            </div>
            <div className="card p-4 text-center">
              <FiUsers className="w-5 h-5 mx-auto mb-2 text-hotpink-400" />
              <p className="text-xs text-dark-400">{event.capacity > 0 ? `Up to ${event.capacity} people` : 'Open to all'}</p>
            </div>
            <div className="card p-4 text-center">
              <FiClock className="w-5 h-5 mx-auto mb-2 text-sunset-400" />
              <p className="text-xs text-dark-400">{event.startTime}{event.endTime ? ` – ${event.endTime}` : ''}</p>
            </div>
          </div>

          {/* Map */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-3">Where it's happening</h2>
            <Suspense fallback={<MapLoading />}>
              <div className="h-52 lg:h-64 relative">
                <EventMap
                  events={[event]}
                  center={event.coordinates || [28.6139, 77.2090]}
                  zoom={13}
                  height="h-full"
                />
              </div>
            </Suspense>
            <div className="flex items-start gap-2 mt-3 text-sm text-dark-300">
              <FiMapPin className="w-4 h-4 text-lime-400 shrink-0 mt-0.5" />
              <span className="break-words text-xs">
                <span className="font-semibold text-white">{event.venueName}</span> — {event.address}
              </span>
            </div>
            {event.price?.ticketUrl && (
              <a
                href={event.price.ticketUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-electric-500 text-white hover:bg-electric-400 transition-colors"
              >
                <FiLink className="w-4 h-4" /> Get tickets
              </a>
            )}
          </div>

          {/* Enjoyed? / moments */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <FiStar className="text-sunset-400" /> Moments
              </h2>
              {isGoing && (
                <button
                  onClick={async () => {
                    const text = window.prompt('Share a moment from this event 💛');
                    if (text && text.trim()) {
                      const r = await act('post', `/api/events/${id}/moments`, { text: text.trim() });
                      if (r?.moment) {
                        setMoments((prev) => [normalizeMoment(r.moment, meId), ...prev]);
                        showToast('Moment shared!');
                      }
                    }
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-lime-500 text-dark-900"
                >
                  + Share moment
                </button>
              )}
            </div>
            {moments.length === 0 ? (
              <p className="text-sm text-dark-400 py-6 text-center">
                {isGoing
                  ? 'You went! Drop a moment so everyone remembers.'
                  : 'No moments yet. Moments unlock for people who joined.'}
              </p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {moments.map((moment) => (
                  <EventMomentCard
                    key={moment.id}
                    moment={moment}
                    onLike={likeMoment}
                    onOpenComments={setCommentsMoment}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* People going */}
          <div className="card p-5">
            {attendees.length > 0 ? (
              <>
                <PeopleGoing people={attendees} meInterests={user?.interests || []} />
                {attendees.length > 12 && (
                  <Link to={`/events/${id}/attendees`} className="block text-center text-xs text-lime-400 mt-3 hover:underline">
                    View all {attendees.length}
                  </Link>
                )}
              </>
            ) : (
              <p className="text-sm text-dark-400 text-center py-4">No one's joined yet — be the first!</p>
            )}
          </div>

          {/* Squads */}
          <div className="card p-5">
            <SquadList
              squads={squads}
              meId={meId}
              onJoin={joinSquad}
              onLeave={leaveSquad}
              onDelete={deleteSquad}
              onCreate={() => setShowSquadForm(true)}
              onMemberClick={(uid) => navigate(`/users/${uid}`)}
              onChat={null}
            />
          </div>

          {/* Chat */}
          <EventChatPanel
            eventId={id}
            me={user}
            socket={socket}
            sendEnabled={isGoing || isInterested || event.isOrganizer}
          />
        </div>
      </div>

      {/* Modals */}
      <ShareEvent isOpen={showShare} onClose={() => setShowShare(false)} eventId={id} />
      <SquadForm isOpen={showSquadForm} onClose={() => setShowSquadForm(false)} onCreate={createSquad} />

      {showReport && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Report this event</h3>
              <button onClick={() => setShowReport(false)} className="text-gray-400 hover:text-gray-600"><FiX /></button>
            </div>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              placeholder="Tell us what's wrong (spam, misleading info, safety...)"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 focus:outline-none focus:border-lime-400 h-24"
              maxLength={500}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={() => setShowReport(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600">Cancel</button>
              <button onClick={report} disabled={!reportText.trim()} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white disabled:opacity-50">Report</button>
            </div>
          </div>
        </div>
      )}

      {mapOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2">
          <div className="w-full max-w-2xl h-[70vh] relative">
            <button onClick={() => setMapOpen(false)} className="absolute top-3 right-3 z-[600] bg-dark-950/80 w-9 h-9 rounded-full flex items-center justify-center text-white">
              <FiX className="w-5 h-5" />
            </button>
            <Suspense fallback={<MapLoading />}>
              <div className="h-full w-full">
                <EventMap events={[event]} center={event.coordinates || [28.6139, 77.2090]} zoom={14} height="h-full" />
              </div>
            </Suspense>
          </div>
        </div>
      )}

      {commentsMoment && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Comments</h3>
              <button onClick={() => { setCommentsMoment(null); setCommentText(''); }} className="text-gray-400 hover:text-gray-600">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(commentsMoment.comments || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">No comments yet. Start the conversation.</p>
              ) : commentsMoment.comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
                    {c.avatar ? <img src={c.avatar} alt="" className="w-full h-full object-cover" /> : (c.user || '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-800">{c.user}</p>
                      <span className="text-[10px] text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }}
                placeholder="Add a comment..."
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-lime-400"
                maxLength={300}
              />
              <button
                onClick={addComment}
                disabled={!commentText.trim()}
                className="px-4 py-2.5 rounded-xl bg-lime-500 text-dark-900 text-sm font-semibold disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[900] bg-dark-900 border border-dark-700 px-5 py-3 rounded-full text-sm text-white shadow-xl animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
};

export default EventDetailsPage;