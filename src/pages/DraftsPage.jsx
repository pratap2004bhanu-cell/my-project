import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiArrowLeft, FiFileText, FiCalendar, FiMapPin, FiClock, FiUsers } from 'react-icons/fi';
import api from '../api';

const DraftsPage = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDrafts = () => {
    api.get('/api/drafts')
      .then((res) => setDrafts(res.data.drafts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const deleteDraft = async (id) => {
    setDrafts(drafts.filter((d) => d._id !== id));
    try {
      await api.delete(`/api/drafts/${id}`);
    } catch (e) {
      loadDrafts();
    }
  };

  const draft = (d) => d.data || {};

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/create-activity" className="btn-icon">
          <FiArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            My Drafts
          </h1>
          <p className="text-dark-400">Unfinished activities you can resume anytime</p>
        </div>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-dark-400">Loading your drafts...</div>
      ) : drafts.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="text-xl font-bold text-white mb-2">No drafts yet</h2>
          <p className="text-dark-400 mb-6">Start creating an activity and save it as a draft to find it here.</p>
          <Link to="/create-activity" className="btn-primary inline-flex items-center gap-2">
            <FiFileText className="w-4 h-4" />
            Create an Activity
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((d) => (
            <div key={d._id} className="glass-strong rounded-2xl p-5 hover-lift">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {draft(d).title || 'Untitled Activity'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-dark-400">
                    {draft(d).category && (
                      <span className="text-lime-400">{draft(d).category}</span>
                    )}
                    {draft(d).date && (
                      <span className="flex items-center gap-1.5">
                        <FiCalendar className="w-3.5 h-3.5" />
                        {draft(d).date} {draft(d).time}
                      </span>
                    )}
                    {draft(d).location && (
                      <span className="flex items-center gap-1.5">
                        <FiMapPin className="w-3.5 h-3.5" />
                        {draft(d).location}
                      </span>
                    )}
                    {draft(d).maxParticipants && (
                      <span className="flex items-center gap-1.5">
                        <FiUsers className="w-3.5 h-3.5" />
                        Up to {draft(d).maxParticipants}
                      </span>
                    )}
                  </div>
                  {draft(d).recurring && draft(d).recurring !== 'none' && (
                    <span className="badge-electric text-xs mt-3 inline-block">
                      Repeats {draft(d).recurring}
                    </span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-dark-500">Saved</p>
                  <p className="text-xs text-dark-400 mb-3">
                    {d.updatedAt ? new Date(d.updatedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      to={`/create-activity?draft=${d._id}`}
                      className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                    >
                      <FiEdit2 className="w-3 h-3" />
                      Resume
                    </Link>
                    <button
                      onClick={() => deleteDraft(d._id)}
                      className="btn-icon w-10 h-10 text-red-400 hover:text-red-300"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DraftsPage;