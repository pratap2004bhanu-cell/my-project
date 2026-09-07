import { useState } from 'react';
import { FiUsers, FiShield, FiLock, FiUnlock, FiRadio } from 'react-icons/fi';
import { Modal, Input } from '../common';
import { useAuth } from '../../context/AuthContext';

const SquadForm = ({ isOpen, onClose, onCreate }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: `${user?.name?.split(' ')[0] || 'My'}'s Crew`,
    maxSize: 5,
    preferences: ['friends', 'open'],
  });
  const [saving, setSaving] = useState(false);

  const togglePref = (pref) => {
    setForm((f) => ({
      ...f,
      preferences: f.preferences.includes(pref)
        ? f.preferences.filter((p) => p !== pref)
        : [...f.preferences, pref],
    }));
  };

  const submit = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    const ok = await onCreate({ ...form, name: form.name.trim() });
    setSaving(false);
    if (ok) {
      onClose();
      setForm((f) => ({ ...f, name: '', maxSize: 5, preferences: ['friends', 'open'] }));
    }
  };

  const prefs = [
    { id: 'friends', label: 'Friends' },
    { id: 'open', label: 'Open to new people' },
    { id: 'mixed', label: 'Mixed' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Start an event squad" size="md">
      <div className="space-y-4" style={{ color: '#111827' }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Squad name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Our crew"
            maxLength={50}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiUsers className="w-4 h-4 inline mr-1" /> Max size
          </label>
          <div className="flex gap-2 flex-wrap">
            {[3, 5, 8, 12].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm((f) => ({ ...f, maxSize: n }))}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                  form.maxSize === n
                    ? 'bg-lime-500 text-dark-900 border-lime-500'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FiLock className="w-4 h-4 inline mr-1" /> Who can join?
          </label>
          <div className="space-y-2">
            {prefs.map((p) => {
              const active = form.preferences.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => togglePref(p.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                    active
                      ? 'bg-lime-500/10 border-lime-500/40 text-gray-900'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {p.id === 'friends' ? <FiShield className="w-4 h-4" /> : p.id === 'open' ? <FiRadio className="w-4 h-4" /> : <FiUsers className="w-4 h-4" />}
                    {p.label}
                  </span>
                  {active ? <FiUnlock className="w-4 h-4 text-lime-500" /> : <FiLock className="w-4 h-4 text-gray-300" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving || !form.name.trim()}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-lime-500 text-white hover:bg-lime-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Creating...' : 'Create squad'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default SquadForm;