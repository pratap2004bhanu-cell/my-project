import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FiArrowLeft, FiCalendar, FiClock, FiMapPin, 
  FiUsers, FiTag, FiFileText, FiCheck, FiGlobe,
  FiLock, FiUserCheck, FiSave, FiRepeat, FiRefreshCw, FiNavigation
} from 'react-icons/fi';
import api from '../api';

const CreateActivityPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [draftId, setDraftId] = useState(searchParams.get('draft'));
  const templateId = searchParams.get('template');
  const editId = searchParams.get('edit');
  
  const [formData, setFormData] = useState({
    title: '',
    category: searchParams.get('category') || '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxParticipants: '',
    activityType: 'public',
    recurring: 'none',
    approvalRequired: false,
    requirements: '',
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  const recurringOptions = [
    { id: 'none', name: 'One-time', description: 'Happens once' },
    { id: 'daily', name: 'Daily', description: 'Repeats every day' },
    { id: 'weekly', name: 'Weekly', description: 'Repeats every week' },
    { id: 'monthly', name: 'Monthly', description: 'Repeats every month' },
  ];

  // Load activity for editing (?edit=)
  useEffect(() => {
    if (!editId) return;
    api.get(`/api/activities/${editId}`)
      .then((res) => {
        const a = res.data.activity;
        if (a.isCreator !== true) {
          alert('Only the host can edit this activity.');
          navigate('/activities/' + editId);
          return;
        }
        const d = new Date(a.date);
        const localDate = isNaN(d.getTime())
          ? ''
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setFormData({
          title: a.title || '',
          category: a.category || '',
          description: a.description || '',
          date: localDate,
          time: (a.time || '').slice(0, 5),
          location: a.location?.address && a.location.address !== 'Location TBA' ? a.location.address : '',
          maxParticipants: String(a.maxParticipants || ''),
          activityType: a.activityType || 'public',
          recurring: a.recurring || 'none',
          approvalRequired: !!a.approvalRequired,
          requirements: a.requirements || '',
        });
        if (a.location?.coordinates?.length === 2) setCoords(a.location.coordinates);
      })
      .catch(() => alert('Could not load activity for editing.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Load draft (?draft=) or template (?template=) if provided
  useEffect(() => {
    if (draftId) {
      api.get(`/api/drafts/${draftId}`)
        .then((res) => {
          const d = res.data.draft?.data || {};
          setFormData((prev) => ({ ...prev, ...d }));
        })
        .catch(() => {});
    } else if (templateId) {
      api.get(`/api/templates/${templateId}`)
        .then((res) => {
          const t = res.data.template;
          if (t) {
            setFormData((prev) => ({
              ...prev,
              title: t.name,
              category: categories.find((c) => c.id === t.category) ? t.category : 'social',
              description: t.description || prev.description,
              location: t.location || prev.location,
              maxParticipants: t.maxParticipants || '',
            }));
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId, templateId]);

  const saveDraft = async (silent = false) => {
    const data = { data: formData };
    try {
      if (draftId) {
        await api.put(`/api/drafts/${draftId}`, data);
      } else {
        const res = await api.post('/api/drafts', data);
        setDraftId(res.data.draft._id);
      }
      if (!silent) {
        alert('Draft saved! You can resume later from My Drafts.');
      }
      return draftId;
    } catch (e) {
      if (!silent) {
        alert('Failed to save draft. Please try again.');
      }
      return null;
    }
  };

  const categories = [
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
  const categoryGradient = {
    cricket: 'from-green-500 to-emerald-600',
    coffee: 'from-amber-500 to-orange-600',
    gaming: 'from-violet-500 to-purple-600',
    gym: 'from-red-500 to-pink-600',
    movies: 'from-pink-500 to-rose-600',
    walking: 'from-teal-500 to-cyan-600',
    running: 'from-blue-500 to-indigo-600',
    food: 'from-orange-500 to-red-600',
    coding: 'from-cyan-500 to-blue-600',
    music: 'from-purple-500 to-violet-600',
    travel: 'from-sky-500 to-blue-600',
    art: 'from-rose-500 to-pink-600',
    fitness: 'from-lime-500 to-emerald-600',
    learning: 'from-indigo-500 to-purple-600',
    social: 'from-lime-500 to-electric-500',
    entertainment: 'from-fuchsia-500 to-purple-600',
  };

  const activityTypes = [
    { id: 'public', name: 'Public', description: 'Anyone can join', icon: FiGlobe },
    { id: 'friends', name: 'Friends Only', description: 'Only your connections', icon: FiUserCheck },
    { id: 'private', name: 'Private', description: 'Invite only', icon: FiLock },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    });
  };

  const [submitting, setSubmitting] = useState(false);

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords([pos.coords.longitude, pos.coords.latitude]);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert('Could not get your location. Please grant location access.');
      },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.date || !formData.time) {
      alert('Please fill in the title, category, date and time.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        emoji: selectedCategory?.emoji || '🎯',
        date: new Date(`${formData.date}T${formData.time}`).toISOString(),
        time: formData.time,
        location: { address: formData.location || 'Location TBA', ...(coords ? { coordinates: coords } : {}) },
        maxParticipants: Number(formData.maxParticipants) || 10,
        activityType: formData.activityType,
        recurring: formData.recurring,
        approvalRequired: formData.approvalRequired === true,
        requirements: formData.requirements.trim(),
      };

      const res = editId
        ? await api.put(`/api/activities/${editId}`, payload)
        : await api.post('/api/activities', payload);

      // Remove this draft once published (new activities only)
      if (!editId && draftId) {
        api.delete(`/api/drafts/${draftId}`).catch(() => {});
      }

      navigate(`/activities/${editId || res.data.activity._id}`);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed to create activity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = categories.find(c => c.id === formData.category);

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="btn-icon"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            {editId ? 'Edit Activity' : 'Create Activity'}
          </h1>
          <p className="text-dark-400">
            {editId ? 'Update the details — nobody will lose their spot' : 'Plan something and invite others to join'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Category Selection */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiTag className="w-5 h-5 text-lime-400" />
            Category
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setFormData({ ...formData, category: category.id })}
                className={`flex flex-col items-center p-4 rounded-2xl transition-all duration-200 ${
                  formData.category === category.id
                    ? 'bg-lime-500/20 border-2 border-lime-500 text-white'
                    : 'bg-dark-800/50 border-2 border-dark-700/50 text-dark-300 hover:border-dark-600'
                }`}
              >
                <span className="text-2xl mb-2">{category.emoji}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Info */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiFileText className="w-5 h-5 text-electric-400" />
            Activity Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Evening Cricket Match"
                required
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Looking for people to play cricket this evening. All skill levels welcome!"
                rows={3}
                className="input-field resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiCalendar className="w-5 h-5 text-hotpink-400" />
            When
          </h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="input-field"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiMapPin className="w-5 h-5 text-sunset-400" />
            Where
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Nearby Cricket Ground, City Park"
              required
              className="input-field"
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="inline-flex items-center gap-2 text-sm font-medium py-2 px-3 rounded-lg bg-electric-500/15 text-electric-300 hover:bg-electric-500/25 border border-electric-500/30 transition-colors disabled:opacity-60"
              >
                <FiNavigation className="w-4 h-4" />
                {locating ? 'Locating...' : coords ? 'Update My Location' : 'Use My Location'}
              </button>
              {coords ? (
                <>
                  <span className="text-xs text-dark-400 flex items-center gap-1">
                    <FiCheck className="w-3 h-3 text-lime-400" />
                    Coordinates set ({coords[1].toFixed(4)}, {coords[0].toFixed(4)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setCoords(null)}
                    className="text-xs text-dark-400 hover:text-red-400"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <span className="text-xs text-dark-500">Optional — sets exact meetup spot so others can find it</span>
              )}
            </div>
          </div>
        </div>

        {/* Participants */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiUsers className="w-5 h-5 text-ocean-400" />
            Participants
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Maximum Participants</label>
            <input
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              placeholder="10"
              min="2"
              max="100"
              required
              className="input-field"
            />
          </div>
        </div>

        {/* Recurring */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiRepeat className="w-5 h-5 text-electric-400" />
            Repeat
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recurringOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setFormData({ ...formData, recurring: option.id })}
                className={`flex flex-col items-center py-4 rounded-2xl transition-all duration-200 ${
                  formData.recurring === option.id
                    ? 'bg-electric-500/20 border-2 border-electric-500 text-white'
                    : 'bg-dark-800/50 border-2 border-dark-700/50 text-dark-300 hover:border-dark-600'
                }`}
              >
                <span className="text-sm font-medium">{option.name}</span>
                {formData.recurring === option.id && (
                  <span className="text-xs text-electric-400 mt-1">✓</span>
                )}
              </button>
            ))}
          </div>
          {formData.recurring !== 'none' && (
            <p className="text-sm text-dark-400 mt-3 flex items-center gap-1.5">
              <FiRefreshCw className="w-3.5 h-3.5" />
              This activity will repeat {formData.recurring === 'daily' ? 'every day' : formData.recurring === 'weekly' ? 'every week' : 'every month'} on the same time.
            </p>
          )}
        </div>

        {/* Activity Type */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiLock className="w-5 h-5 text-dark-400" />
            Visibility
          </h2>
          
          <div className="space-y-3">
            {activityTypes.map((type) => (
              <label
                key={type.id}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
                  formData.activityType === type.id
                    ? 'bg-lime-500/10 border-2 border-lime-500'
                    : 'bg-dark-800/50 border-2 border-dark-700/50 hover:border-dark-600'
                }`}
              >
                <input
                  type="radio"
                  name="activityType"
                  value={type.id}
                  checked={formData.activityType === type.id}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  formData.activityType === type.id
                    ? 'bg-lime-500 text-dark-900'
                    : 'bg-dark-700 text-dark-400'
                }`}>
                  <type.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">{type.name}</p>
                  <p className="text-sm text-dark-400">{type.description}</p>
                </div>
                {formData.activityType === type.id && (
                  <div className="w-6 h-6 bg-lime-500 rounded-full flex items-center justify-center">
                    <FiCheck className="w-4 h-4 text-dark-900" />
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Good to know */}
        <div className="card">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiLock className="w-5 h-5 text-dark-400" />
            Good to know
          </h2>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">What to bring / Requirements</label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                placeholder="e.g. Batting gloves, water bottle, comfortable shoes"
                rows={2}
                className="input-field resize-none"
              ></textarea>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="approvalRequired"
                checked={formData.approvalRequired === true}
                onChange={handleChange}
                className="mt-1 w-4 h-4 accent-lime-500"
              />
              <div>
                <p className="font-semibold text-white">Approve people before they join</p>
                <p className="text-sm text-dark-400 mt-0.5">
                  People send a join request and you approve each one. Pick this for smaller groups where the vibe matters.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Preview */}
        {formData.title && formData.category && (
          <div className="card">
            <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
            <div className="bg-dark-800/50 rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${categoryGradient[formData.category] || 'from-lime-500 to-electric-500'} rounded-2xl flex items-center justify-center text-2xl`}>
                  {selectedCategory?.emoji || '🎯'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">{formData.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-dark-400 mt-1">
                    {formData.location && (
                      <span className="flex items-center gap-1">
                        <FiMapPin className="w-3 h-3" />
                        {formData.location}
                      </span>
                    )}
                    {formData.date && formData.time && (
                      <span className="flex items-center gap-1">
                        <FiCalendar className="w-3 h-3" />
                        {formData.date} {formData.time}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-ghost flex-1"
          >
            Cancel
          </button>
          {!editId && (
            <button
              type="button"
              onClick={() => saveDraft()}
              className="btn-outline flex-1 flex items-center justify-center gap-2"
            >
              <FiSave className="w-4 h-4" />
              Save Draft
            </button>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></span>
                {editId ? 'Saving...' : 'Creating...'}
              </>
            ) : (
              <>
                <span className="text-lg">🚀</span>
                {editId ? 'Save Changes' : `Create ${formData.recurring !== 'none' ? 'Recurring ' : ''}Activity`}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateActivityPage;