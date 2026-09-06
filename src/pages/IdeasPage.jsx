import { useState, useEffect } from 'react';
import {
  FiCheck, FiSend, FiPenTool, FiClock
} from 'react-icons/fi';
import api from '../api';

const CATEGORIES = [
  { id: 'Feature', emoji: '🚀', label: 'New Feature' },
  { id: 'Improvement', emoji: '✨', label: 'Improvement' },
  { id: 'Bug', emoji: '🐞', label: 'Bug Report' },
  { id: 'Other', emoji: '💬', label: 'Something Else' },
];

const STATUS_MAP = {
  new: { label: 'Received', cls: 'bg-electric-500/15 text-electric-300' },
  in_review: { label: 'In review', cls: 'bg-amber-500/15 text-amber-300' },
  shipped: { label: 'Shipped', cls: 'bg-lime-500/15 text-lime-400' },
  rejected: { label: 'Not planned', cls: 'bg-dark-700 text-dark-300' },
};

const formatWhen = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const IdeasPage = () => {
  const [category, setCategory] = useState('Feature');
  const [idea, setIdea] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/suggestions');
        setItems(res.data.suggestions || []);
        setIsAdmin(res.data.isAdmin === true);
      } catch (err) {
        console.error('Failed to load ideas:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idea.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post('/api/suggestions', { category, idea: idea.trim() });
      setItems((prev) => [res.data.suggestion, ...prev]);
      setIdea('');
      setJustSent(true);
      setTimeout(() => setJustSent(false), 4000);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not send your idea');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/api/suggestions/${id}`, { status });
      setItems((prev) => prev.map((s) => (s._id === id ? res.data.suggestion : s)));
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not update status');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white flex items-center gap-2">
          <FiPenTool className="w-7 h-7 text-amber-400" />
          Share an Idea
        </h1>
        <p className="text-dark-400">
          What should we add or improve? We read every single idea.
        </p>
      </div>

      {/* Submit card */}
      {justSent ? (
        <div className="card p-8 text-center animate-slide-up mb-6">
          <div className="w-20 h-20 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck className="w-10 h-10 text-dark-900" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Idea sent!</h2>
          <p className="text-dark-400">Thanks for helping make KIKY better 🤝</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4">
          {/* Category chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all flex flex-col items-center gap-1 ${
                  category === c.id
                    ? 'border-lime-500/60 bg-lime-500/15 text-lime-400'
                    : 'border-dark-700 bg-dark-800/50 text-dark-300 hover:border-dark-500'
                }`}
              >
                <span className="text-xl">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>

          {/* Idea text */}
          <div>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Tell us about your idea — what would you add, improve or fix?"
              maxLength={2000}
              className="w-full h-32 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50 resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-dark-500">{idea.length}/2000</span>
              <button
                type="submit"
                disabled={!idea.trim() || submitting}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiSend className="w-4 h-4" />
                {submitting ? 'Sending...' : 'Send Idea'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Ideas list */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">
          {isAdmin ? 'All ideas' : 'Your ideas'}
        </h2>
        {isAdmin && (
          <span className="text-xs px-3 py-1 rounded-full bg-lime-500/15 text-lime-400 font-medium">
            Owner view — manage status
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 card">
          <span className="text-6xl mb-4 block">💡</span>
          <h3 className="text-xl font-bold text-white mb-2">No ideas yet</h3>
          <p className="text-dark-400">Be the first to share what you'd love to see</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const cat = CATEGORIES.find((c) => c.id === item.category) || CATEGORIES[3];
            const status = STATUS_MAP[item.status] || STATUS_MAP.new;
            return (
              <div key={item._id} className="card p-4 flex items-start gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {cat.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${status.cls}`}>
                      {status.label}
                    </span>
                    <span className="text-xs text-dark-500 flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {formatWhen(item.createdAt)}
                    </span>
                    {isAdmin && (
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item._id, e.target.value)}
                        className="ml-auto text-xs bg-dark-800 border border-dark-700 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-lime-500/50"
                      >
                        <option value="new">Received</option>
                        <option value="in_review">In review</option>
                        <option value="shipped">Shipped</option>
                        <option value="rejected">Not planned</option>
                      </select>
                    )}
                  </div>
                  <p className="text-white text-sm break-words">{item.idea}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IdeasPage;