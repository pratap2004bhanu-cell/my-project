import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiPlus, FiCopy, FiEdit2, FiTrash2, FiClock,
  FiUsers, FiMapPin, FiStar, FiMoreVertical,
  FiZap, FiX
} from 'react-icons/fi';
import api from '../api';

const CATEGORIES = [
  { id: 'cricket', name: 'Cricket', emoji: '🏏' },
  { id: 'coffee', name: 'Coffee', emoji: '☕' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮' },
  { id: 'gym', name: 'Gym', emoji: '🏋️' },
  { id: 'movies', name: 'Movies', emoji: '🎬' },
  { id: 'walking', name: 'Walking', emoji: '🚶' },
  { id: 'running', name: 'Running', emoji: '🏃' },
  { id: 'food', name: 'Food', emoji: '🍕' },
  { id: 'coding', name: 'Coding', emoji: '💻' },
  { id: 'music', name: 'Music', emoji: '🎵' },
  { id: 'travel', name: 'Travel', emoji: '✈️' },
  { id: 'art', name: 'Art', emoji: '🎨' },
  { id: 'fitness', name: 'Fitness', emoji: '💪' },
  { id: 'learning', name: 'Learning', emoji: '📚' },
  { id: 'social', name: 'Social', emoji: '🤝' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎪' },
];

const EMPTY_FORM = {
  name: '',
  emoji: '🎯',
  category: 'cricket',
  description: '',
  duration: '1 hour',
  maxParticipants: 10,
  location: '',
};

const TemplatesPage = () => {
  const [activeTab, setActiveTab] = useState('my');
  const [myTemplates, setMyTemplates] = useState([]);
  const [popularTemplates, setPopularTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadTemplates = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/templates?scope=my').catch(() => ({ data: { templates: [] } })),
      api.get('/api/templates?scope=popular').catch(() => ({ data: { templates: [] } })),
    ]).then(([mine, pop]) => {
      setMyTemplates(mine.data.templates || []);
      setPopularTemplates(pop.data.templates || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const recentlyUsed = (myTemplates.length ? myTemplates : popularTemplates)
    .filter((t) => t.lastUsedAt)
    .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      name: t.name,
      emoji: t.emoji,
      category: t.category,
      description: t.description || '',
      duration: t.duration || '1 hour',
      maxParticipants: t.maxParticipants || 10,
      location: t.location || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category) {
      alert('Please fill in the name and category.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        emoji: form.emoji,
        category: form.category,
        description: form.description,
        duration: form.duration,
        maxParticipants: Number(form.maxParticipants) || 10,
        location: form.location,
      };
      if (editing) {
        await api.put(`/api/templates/${editing._id}`, payload);
      } else {
        await api.post('/api/templates', payload);
      }
      setShowModal(false);
      loadTemplates();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to save template.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete "${t.name}"?`)) return;
    try {
      await api.delete(`/api/templates/${t._id}`);
      loadTemplates();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to delete template.');
    }
  };

  const handleUse = (t) => {
    api.post(`/api/templates/${t._id}/use`).catch(() => {});
  };

  const categoryName = (id) => CATEGORIES.find((c) => c.id === id)?.name || id;
  const formatLastUsed = (iso) => {
    if (!iso) return 'Never';
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 864e5);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 30) return `${days} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Activity Templates
          </h1>
          <p className="text-dark-400">Create activities faster with templates</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'my', name: 'My Templates' },
          { id: 'popular', name: 'Popular Templates' },
          { id: 'recent', name: 'Recently Used' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-dark-400">Loading templates...</div>
      ) : (
        <>
          {/* My Templates */}
          {activeTab === 'my' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myTemplates.map((template) => (
                <div key={template._id} className="card-glow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center text-3xl">
                        {template.emoji || '🎯'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{template.name}</h3>
                        <span className="badge-lime text-xs">{categoryName(template.category)}</span>
                      </div>
                    </div>
                    <button className="btn-icon w-8 h-8" onClick={() => openEdit(template)}>
                      <FiMoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-dark-400 mb-4">{template.description}</p>

                  <div className="space-y-2 text-sm text-dark-400 mb-4">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4" />
                      {template.duration}
                    </div>
                    <div className="flex items-center gap-2">
                      <FiUsers className="w-4 h-4" />
                      Up to {template.maxParticipants} people
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-4 h-4" />
                      {template.location || 'Location TBA'}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-dark-400 mb-4">
                    <span>Used {template.uses} times</span>
                    <span>Last used {formatLastUsed(template.lastUsedAt)}</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/create-activity?template=${template._id}`}
                      onClick={() => handleUse(template)}
                      className="flex-1 btn-primary text-sm flex items-center justify-center gap-1"
                    >
                      <FiZap className="w-4 h-4" />
                      Use
                    </Link>
                    <button className="btn-outline px-3" onClick={() => openEdit(template)}>
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      className="btn-outline px-3 text-red-400 border-red-500/50 hover:bg-red-500/10"
                      onClick={() => handleDelete(template)}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Create New Template Card */}
              <button
                onClick={openCreate}
                className="card border-dashed border-2 border-dark-700 hover:border-lime-500/50 p-6 flex flex-col items-center justify-center min-h-[300px] transition-colors group"
              >
                <div className="w-14 h-14 bg-dark-800 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-lime-500/20 transition-colors">
                  <FiPlus className="w-6 h-6 text-dark-400 group-hover:text-lime-400" />
                </div>
                <span className="font-medium text-dark-400 group-hover:text-white transition-colors">
                  Create New Template
                </span>
              </button>
            </div>
          )}

          {/* Popular Templates */}
          {activeTab === 'popular' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularTemplates.map((template) => (
                <div key={template._id} className="card-glow p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center text-3xl">
                      {template.emoji || '🎯'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{template.name}</h3>
                      <span className="badge-lime text-xs">{categoryName(template.category)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-dark-400 mb-4">{template.description}</p>

                  <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {template.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiUsers className="w-3 h-3" />
                      {template.maxParticipants}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiStar className="w-3 h-3 text-amber-400" />
                      4.9
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-dark-400 mb-4">
                    <span>{template.uses.toLocaleString()} uses</span>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      to={`/create-activity?template=${template._id}`}
                      onClick={() => handleUse(template)}
                      className="flex-1 btn-primary text-sm flex items-center justify-center gap-1"
                    >
                      <FiCopy className="w-4 h-4" />
                      Use Template
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recently Used */}
          {activeTab === 'recent' && (
            <div className="space-y-4">
              {recentlyUsed.length === 0 ? (
                <div className="card text-center py-12 text-dark-400">
                  No templates used yet. Use one to see it here.
                </div>
              ) : (
                recentlyUsed.map((template) => (
                  <div key={template._id} className="card flex items-center gap-4 p-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-xl flex items-center justify-center text-2xl">
                      {template.emoji || '🎯'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{template.name}</h3>
                      <p className="text-sm text-dark-400">
                        {template.description} · {formatLastUsed(template.lastUsedAt)}
                      </p>
                    </div>
                    <Link
                      to={`/create-activity?template=${template._id}`}
                      onClick={() => handleUse(template)}
                      className="btn-primary text-sm"
                    >
                      Use Again
                    </Link>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowModal(false)} />
          <div className="relative card-glow w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                {editing ? 'Edit Template' : 'Create Template'}
              </h2>
              <button className="btn-icon w-9 h-9" onClick={() => setShowModal(false)}>
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Evening Cricket Match"
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Emoji</label>
                  <input
                    type="text"
                    value={form.emoji}
                    onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                    placeholder="🎯"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What does this activity involve?"
                  rows={3}
                  className="input-field resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Duration</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="1 hour"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Max Participants</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxParticipants}
                    onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Koramangala Ground"
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button className="btn-ghost flex-1" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : editing ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesPage;