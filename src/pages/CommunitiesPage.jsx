import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiLock, FiPlus, FiSearch, FiCheck,
  FiX, FiUserMinus, FiMessageCircle, FiArrowRight
} from 'react-icons/fi';
import api from '../api';

const CommunityCard = ({ community, onToggleJoin, onOpen }) => {
  return (
    <div className="card-glow overflow-hidden cursor-pointer group">
      {/* Banner */}
      <div
        onClick={() => onOpen(community)}
        className="h-24 bg-gradient-to-br from-lime-500 via-electric-500 to-hotpink-500 flex items-center justify-center relative"
      >
        <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform">{community.emoji}</span>
        {!community.isPublic && (
          <div className="absolute top-3 right-3 p-1.5 bg-dark-900/50 rounded-lg">
            <FiLock className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4" onClick={() => onOpen(community)}>
        <h3 className="font-bold text-white text-lg mb-1 flex items-center justify-between">
          {community.name}
          <span className="text-dark-400 group-hover:text-lime-400 transition-colors flex items-center gap-1 text-sm">
            Open <FiArrowRight className="w-4 h-4" />
          </span>
        </h3>
        <p className="text-sm text-dark-400 mb-3 line-clamp-2 min-h-[2.5rem]">{community.description}</p>

        {/* Tags */}
        {community.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {community.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-dark-800/60 rounded-md text-xs text-dark-300">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-sm text-dark-400 mb-4">
          <span className="flex items-center gap-1">
            <FiUsers className="w-4 h-4" />
            {community.memberCount} members
          </span>
          {community.isAdmin && (
            <span className="px-2 py-0.5 bg-lime-500/20 text-lime-400 rounded-md text-xs font-medium">
              Admin
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4">
        {community.joined ? (
          <div className="flex gap-2">
            <button
              onClick={() => onOpen(community)}
              className="flex-1 btn-primary text-sm"
            >
              <FiMessageCircle className="w-4 h-4 mr-1" />
              Open Chat
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleJoin(community, false); }}
              className="flex-1 btn-outline text-sm"
            >
              <FiUserMinus className="w-4 h-4 mr-1" />
              Leave
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleJoin(community, true); }}
            className="w-full btn-primary text-sm"
          >
            <FiPlus className="w-4 h-4 mr-1" />
            Join Community
          </button>
        )}
      </div>
    </div>
  );
};

const CreateCommunityModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name: '', description: '', emoji: '👥', tags: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    await onCreate({
      name: form.name.trim(),
      description: form.description.trim(),
      emoji: form.emoji || '👥',
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8),
    });
    setSaving(false);
  };

  const emojiOptions = ['👥', '🏏', '☕', '💻', '⛰️', '🎬', '🏋️', '🎮', '🚴', '🍜', '📚', '🎨'];

  return (
    <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50 p-4">
      <div className="card max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Create Community</h3>
          <button onClick={onClose} className="btn-icon">
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
              placeholder="e.g. Koramangala Cricket Club"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What is this community about?"
              className="input-field min-h-[80px] resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Emoji</label>
            <div className="flex flex-wrap gap-2">
              {emojiOptions.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm({ ...form, emoji: e })}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    form.emoji === e ? 'bg-lime-500/20 ring-2 ring-lime-500' : 'bg-dark-800 hover:bg-dark-700'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Tags (comma separated)</label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="cricket, weekend, koramangala"
              className="input-field"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim() || saving}
            className="flex-1 btn-primary"
          >
            {saving ? 'Creating...' : 'Create Community'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CommunitiesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('joined');
  const [search, setSearch] = useState('');
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = activeTab === 'joined' ? { mine: 1 } : {};
      if (query) params.q = query;
      const res = await api.get('/api/communities', { params });
      setCommunities(res.data.communities || []);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not load communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(search), search ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, search]);

  const handleToggleJoin = async (community, join) => {
    try {
      if (join) {
        await api.post(`/api/communities/${community.id}/join`);
      } else {
        await api.post(`/api/communities/${community.id}/leave`);
      }
      await load(search);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not update membership');
    }
  };

  const handleCreate = async (data) => {
    try {
      await api.post('/api/communities', data);
      setShowCreate(false);
      setActiveTab('joined');
      await load();
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not create community');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Communities
          </h1>
          <p className="text-dark-400">Join groups with shared interests</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Create Community
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search communities..."
          className="w-full pl-12 pr-4 py-3 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50"
        />
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'joined', name: 'My Communities', icon: FiCheck },
          { id: 'discover', name: 'Discover', icon: FiSearch },
          { id: 'all', name: 'All', icon: FiUsers },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Communities Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-dark-400">Loading communities...</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community) => (
            <CommunityCard
              key={community.id}
              community={community}
              onToggleJoin={handleToggleJoin}
              onOpen={(c) => navigate(`/communities/${c.id}`)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && communities.length === 0 && (
        <div className="text-center py-16">
          <span className="text-6xl mb-4 block">👥</span>
          <h3 className="text-xl font-bold text-white mb-2">
            {activeTab === 'joined' ? "You haven't joined any communities" : "No communities found"}
          </h3>
          <p className="text-dark-400 mb-6">
            {activeTab === 'joined'
              ? 'Join communities to connect with like-minded people'
              : 'Try different search terms or filters'}
          </p>
          {activeTab === 'joined' ? (
            <button onClick={() => setActiveTab('discover')} className="btn-primary">
              Discover Communities
            </button>
          ) : (
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              Create Community
            </button>
          )}
        </div>
      )}

      {showCreate && (
        <CreateCommunityModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
      )}
    </div>
  );
};

export default CommunitiesPage;