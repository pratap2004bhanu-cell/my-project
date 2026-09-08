import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiShield, FiArrowLeft, FiCheck, FiX, FiFlag, FiRefreshCw,
} from 'react-icons/fi';
import api from '../api';
import { RoundAvatar } from '../components/common';

const StatusPill = ({ moderationStatus, status }) => {
  if (status === 'cancelled') return <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-hotpink-500/15 text-hotpink-400">Cancelled</span>;
  const meta = {
    pending: ['bg-amber-500/15 text-amber-300', 'Pending review'],
    approved: ['bg-lime-500/15 text-lime-400', 'Approved'],
    rejected: ['bg-red-500/15 text-red-400', 'Rejected'],
  };
  const [cls, label] = meta[moderationStatus] || [meta.pending[0], moderationStatus];
  return <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${cls}`}>{label}</span>;
};

const AdminEventsPage = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notAdmin, setNotAdmin] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/events/moderation');
      setEvents(res.data.events || []);
      setReports(res.data.reports || []);
    } catch (err) {
      if (err?.response?.status === 403) setNotAdmin(true);
      else setError(err?.response?.data?.error || 'Could not load moderation queue');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { load(); }, []);

  const moderate = async (id, status) => {
    try {
      await api.post(`/api/events/${id}/moderate`, { status });
      await load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not update');
    }
  };

  if (notAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <span className="text-6xl block mb-4">🛡️</span>
        <h1 className="text-2xl font-bold text-white mb-2">Admins only</h1>
        <p className="text-dark-400 mb-6">This area is for KIKY event moderators.</p>
        <button onClick={() => navigate('/my-events')} className="btn-outline px-4 py-2.5 text-sm">Back to my events</button>
      </div>
    );
  }

  if (loading) return <div className="p-8 flex justify-center"><div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const pending = events.filter((e) => e.moderationStatus === 'pending');
  const rest = events.filter((e) => e.moderationStatus !== 'pending');

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-400 hover:text-white mb-4 text-sm">
        <FiArrowLeft /> Back
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white flex items-center gap-2">
            <FiShield className="text-lime-400" /> Event moderation
          </h1>
          <p className="text-dark-400 mt-1">Approve, reject and triage event reports.</p>
        </div>
        <button onClick={load} className="btn-outline text-sm px-4 py-2.5 flex items-center gap-2">
          <FiRefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <div className="card p-4 mb-4 border border-red-500/30 bg-red-500/10"><p className="text-sm text-red-400">{error}</p></div>}

      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-white mb-4">Pending review ({pending.length})</h2>
          <div className="space-y-3">
            {pending.map((e) => (
              <div key={e._id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-lime-500 to-electric-600 flex items-center justify-center text-xl shrink-0">
                  {e.emoji || '🎟️'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-white truncate">{e.title}</h3>
                    <StatusPill moderationStatus={e.moderationStatus} status={e.status} />
                  </div>
                  <p className="text-xs text-dark-400 mt-0.5 truncate">
                    by {e.organizer?.name || e.organizerName} · {e.date ? new Date(e.date).toDateString() : ''} · {e.counts?.going || 0} going
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => moderate(e._id, 'approved')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-lime-500 text-dark-900 text-sm font-semibold">
                    <FiCheck className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => moderate(e._id, 'rejected')} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 text-red-400 text-sm font-semibold border border-red-500/25">
                    <FiX className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reports.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FiFlag className="text-hotpink-400" /> Open reports ({reports.length})
          </h2>
          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r._id} className="card p-4">
                <div className="flex items-center gap-3 mb-2">
                  <RoundAvatar name={r.reporter?.name || '?'} src={r.reporter?.avatar} className="w-8 h-8 text-xs" />
                  <div className="flex-1 min-w-0 text-sm">
                    <span className="text-white font-medium">{r.reporter?.name}</span>{' '}
                    <span className="text-dark-400">reported</span>{' '}
                    <span className="text-white font-medium">
                      {r.reported?.name ? <Link to={`/users/${r.reported._id}`} className="hover:text-lime-400">{r.reported.name}</Link> : 'someone'}
                    </span>
                    <span className="text-dark-400"> on an event</span>
                  </div>
                </div>
                <p className="text-sm text-dark-300">{r.details || 'No details provided.'}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-white mb-4">Recent events</h2>
          <div className="space-y-2">
            {rest.map((e) => (
              <div key={e._id} className="card p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">{e.emoji || '🎟️'}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{e.title}</p>
                  <p className="text-xs text-dark-400">{new Date(e.date).toDateString()} · {e.counts?.going || 0} going · {e.counts?.interested || 0} interested</p>
                </div>
                <StatusPill moderationStatus={e.moderationStatus} status={e.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 && reports.length === 0 && (
        <div className="text-center py-16">
          <span className="text-6xl block mb-4">🛡️</span>
          <h3 className="text-xl font-bold text-white mb-2">All clear</h3>
          <p className="text-dark-400">No events or reports waiting on you.</p>
        </div>
      )}
    </div>
  );
};

export default AdminEventsPage;