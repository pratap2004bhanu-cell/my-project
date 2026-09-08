import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiX, FiUpload, FiCheck } from 'react-icons/fi';
import api from '../api';
import { Input } from '../components/common';
import { EVENT_CATEGORIES, EVENT_CATEGORY_GRADIENTS } from '../data/eventCategories';
import EventMapPicker from '../components/events/EventMapPicker';
import VibePreview from '../components/events/VibePreview';

const StepField = ({ label, hint, children, required }) => (
  <div>
    <div className="flex items-baseline gap-2 mb-2">
      <label className="block text-sm font-medium text-dark-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {hint && <span className="text-xs text-dark-400">{hint}</span>}
    </div>
    {children}
  </div>
);

const CreateEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'music',
    emoji: '🎵',
    date: '',
    startTime: '7:00 PM',
    endTime: '',
    venueName: '',
    address: '',
    free: true,
    price: 0,
    currency: 'INR',
    ticketUrl: '',
    capacity: 0,
    rules: [''],
    schedule: [{ title: '', time: '' }],
    vibe: ['lively'],
  });
  const [position, setPosition] = useState(null);
  const [radius, setRadius] = useState(1);
  const [coverPreview, setCoverPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  // Load existing event for edit
  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get(`/api/events/${id}`);
        const e = data.event;
        if (cancelled) return;
        setForm({
          title: e.title || '',
          description: e.description || '',
          category: e.category || 'music',
          emoji: e.emoji || '🎵',
          date: (e.date || '').slice(0, 10),
          startTime: e.startTime || '7:00 PM',
          endTime: e.endTime || '',
          venueName: e.venue?.name || '',
          address: e.venue?.address || '',
          free: !e.price?.amount || e.price.amount <= 0,
          price: e.price?.amount || 0,
          currency: e.price?.currency || 'INR',
          ticketUrl: e.price?.ticketUrl || '',
          capacity: e.capacity || 0,
          rules: e.rules?.length ? e.rules : [''],
          schedule: e.schedule?.length ? e.schedule : [{ title: '', time: '' }],
          vibe: e.vibe?.length ? e.vibe : ['lively'],
        });
        const c = e.venue?.location?.coordinates;
        if (c && c[0] !== 0 && c[1] !== 0) setPosition({ lat: c[1], lng: c[0] });
        if (e.coverImage) setCoverPreview(e.coverImage);
      } catch (err) {
        if (!cancelled) setLoadError(err?.response?.data?.error || 'Could not load event');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const gradient = EVENT_CATEGORY_GRADIENTS[form.category] || 'from-lime-500 to-electric-600';
  const emojiChoices = useMemo(() => {
    const map = {
      music: ['🎵', '🎸', '🎤', '🪩', '🎹'],
      sports: ['🏏', '⚽', '🏀', '🏃', '🏸'],
      gaming: ['🎮', '🕹️', '🎧', '👾'],
      college: ['🎓', '📚', '🏛️', '🎪'],
      technology: ['💻', '🤖', '⚡', '📱'],
      art: ['🎨', '🖌️', '🎭', '🖼️'],
      food: ['🍔', '🥘', '🍕', '🧁', '☕'],
      movies: ['🎬', '🍿', '🎥', '🎭'],
      fitness: ['🏃', '🧘', '🏋️', '🚴'],
      travel: ['🌎', '🏕️', '✈️', '🗺️'],
      entertainment: ['🎭', '🎤', '🪩', '✨'],
      community: ['🤝', '🌱', '🎉', '💛'],
      education: ['📚', '💡', '🧪', '🗣️'],
      other: ['🔥', '🎉', '✨', '💫'],
    };
    return map[form.category] || ['🎟️'];
  }, [form.category]);

  const handleCover = (file) => {
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const submit = async (asDraft) => {
    const body = new FormData();
    body.append('title', form.title.trim());
    body.append('description', form.description);
    body.append('category', form.category);
    body.append('emoji', form.emoji);
    body.append('date', new Date(`${form.date}T12:00:00`).toISOString());
    body.append('startTime', form.startTime);
    body.append('endTime', form.endTime);
    body.append('venue', JSON.stringify({
      name: form.venueName,
      address: form.address,
      location: position ? { type: 'Point', coordinates: [position.lng, position.lat] } : null,
    }));
    body.append('price', JSON.stringify({
      amount: form.free ? 0 : Number(form.price) || 0,
      currency: form.currency,
      ticketUrl: form.ticketUrl,
    }));
    body.append('capacity', String(Math.max(0, Number(form.capacity) || 0)));
    body.append('vibe', JSON.stringify(form.vibe));
    body.append('rules', JSON.stringify(form.rules.filter(Boolean)));
    body.append('schedule', JSON.stringify(form.schedule.filter((s) => s.title || s.time)));
    body.append('status', asDraft ? 'draft' : 'published');
    if (coverFile) body.append('coverImage', coverFile);

    setSaving(true);
    setError(null);
    try {
      const res = await api[isEdit ? 'put' : 'post'](`/api/events${isEdit ? `/${id}` : ''}`, body);
      const eid = res.data.event._id || id;
      navigate(`/events/${eid}`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save event. Please try again.');
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 flex justify-center"><div className="w-10 h-10 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div></div>;

  if (loadError) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-400 hover:text-white mb-4"><FiArrowLeft /> Back</button>
        <div className="card p-6 text-center">
          <p className="text-red-400">{loadError}</p>
        </div>
      </div>
    );
  }

  const fieldCls = 'w-full px-4 py-2.5 rounded-lg border border-dark-700 bg-dark-800/50 text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-lime-500/40 focus:border-transparent text-sm';

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-dark-400 hover:text-white mb-4 text-sm">
        <FiArrowLeft /> Back
      </button>
      <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-1">
        {isEdit ? 'Edit event' : 'Create an event'}
      </h1>
      <p className="text-dark-400 text-sm mb-6">
        {isEdit ? 'Update anything — attendees will see the latest version on refresh.' : 'Host something real. Festivals, jams, market days — KIKY events bring people together.'}
      </p>

      {/* Live preview cover */}
      <div className={`rounded-2xl overflow-hidden bg-gradient-to-br ${gradient} h-40 flex items-center justify-center mb-6 relative`}>
        {coverPreview ? (
          <img src={coverPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <span className="text-6xl drop-shadow-lg">{form.emoji}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/60 to-transparent pointer-events-none"></div>
        <label className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-dark-950/80 backdrop-blur px-3 py-2 rounded-xl text-xs font-semibold text-white cursor-pointer hover:bg-dark-900 transition-colors">
          <FiUpload className="w-3.5 h-3.5" /> Cover photo
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleCover(e.target.files[0])}
          />
        </label>
        <div className="absolute bottom-3 left-4">
          <p className="text-white font-display font-bold text-lg">{form.title || (isEdit ? 'Event name' : 'Your event name')}</p>
          <p className="text-white/80 text-xs">{form.startTime} · {form.venueName || 'Venue'}</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div>
          <StepField label="Event name" required>
            <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Sunset Music Festival" maxLength={80} />
          </StepField>
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <StepField label="Category" required>
            <select value={form.category} onChange={(e) => set({ category: e.target.value, emoji: emojiChoices[0] || '🎟️' })} className={fieldCls}>
              {EVENT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
              ))}
            </select>
          </StepField>
          <StepField label="Emoji">
            <div className="flex flex-wrap gap-1.5">
              {emojiChoices.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => set({ emoji: e })}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-colors ${
                    form.emoji === e ? 'border-lime-500 bg-lime-500/15 text-white' : 'border-dark-700 text-dark-300 hover:bg-dark-800'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </StepField>
        </div>

        <StepField label="Description" hint="What's happening? What should people expect?">
          <textarea
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={4}
            maxLength={2000}
            placeholder="Tell people why this will be an unforgettable day..."
            className={`${fieldCls} resize-y`}
          />
        </StepField>

        <div className="grid sm:grid-cols-2 gap-5">
          <StepField label="Date" required>
            <input type="date" value={form.date} onChange={(e) => set({ date: e.target.value })} required className={fieldCls} />
          </StepField>
          <div className="grid grid-cols-2 gap-3">
            <StepField label="Starts" required>
              <input type="time" value={form.startTime} onChange={(e) => set({ startTime: e.target.value })} className={fieldCls} />
            </StepField>
            <StepField label="Ends">
              <input type="time" value={form.endTime} onChange={(e) => set({ endTime: e.target.value })} className={fieldCls} />
            </StepField>
          </div>
        </div>
        <p className="text-xs text-dark-400 -mt-2">Tip: use 12-hour text like "7:00 PM" if your venue has fixed hours.</p>

        <div className="grid sm:grid-cols-2 gap-5">
          <StepField label="Venue name" required>
            <Input value={form.venueName} onChange={(e) => set({ venueName: e.target.value })} placeholder="e.g. Sayaji Garden" maxLength={80} />
          </StepField>
          <StepField label="Address">
            <Input value={form.address} onChange={(e) => set({ address: e.target.value })} placeholder="Street, area, city" maxLength={200} />
          </StepField>
        </div>

        <StepField label="Where exactly?" hint="auto-fills the address when you tap the map">
          <EventMapPicker
            initial={position || [28.6139, 77.2090]}
            radius={radius}
            onRadius={setRadius}
            onSelect={(pos) => {
              setPosition({ lat: pos.lat, lng: pos.lng });
              if (pos.address && !form.address) set({ address: pos.address });
            }}
          />
        </StepField>

        <div className="border-t border-gray-100 pt-5">
          <StepField label="Is it free?" hint="many KIKY events are — keep it that way if you can ❤️">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set({ free: true })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${form.free ? 'bg-lime-500 text-dark-900 border-lime-500' : 'bg-dark-800 text-dark-300 border-dark-700'}`}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => set({ free: false })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${!form.free ? 'bg-lime-500 text-dark-900 border-lime-500' : 'bg-dark-800 text-dark-300 border-dark-700'}`}
              >
                Paid
              </button>
            </div>
          </StepField>
          {!form.free && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              <StepField label="Price">
                <Input type="number" min="0" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="499" />
              </StepField>
              <StepField label="Tickets link">
                <Input value={form.ticketUrl} onChange={(e) => set({ ticketUrl: e.target.value })} placeholder="https://..." />
              </StepField>
            </div>
          )}
        </div>

        <StepField label="Capacity" hint="0 = open invite, no limit">
          <Input type="number" min="0" value={form.capacity} onChange={(e) => set({ capacity: e.target.value })} placeholder="0" />
        </StepField>

        <div>
          <StepField label="Agenda" hint="add key moments of the day">
            {form.schedule.map((item, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  value={item.title}
                  onChange={(e) => set({ schedule: form.schedule.map((s, j) => (j === i ? { ...s, title: e.target.value } : s)) })}
                  placeholder="Doors open"
                  className={`${fieldCls} flex-1`}
                />
                <input
                  value={item.time}
                  onChange={(e) => set({ schedule: form.schedule.map((s, j) => (j === i ? { ...s, time: e.target.value } : s)) })}
                  placeholder="6:30 PM"
                  className={`${fieldCls} w-32`}
                />
                <button
                  type="button"
                  onClick={() => set({ schedule: form.schedule.filter((_, j) => j !== i) })}
                  className="w-10 h-11 rounded-lg bg-dark-800 flex items-center justify-center text-dark-400 hover:text-white transition-colors"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ schedule: [...form.schedule, { title: '', time: '' }] })}
              className="text-xs font-semibold text-lime-400 flex items-center gap-1"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add agenda item
            </button>
          </StepField>
        </div>

        <div>
          <StepField label="Rules" hint="ground rules so everyone has a good time">
            {form.rules.map((rule, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <Input
                  value={rule}
                  onChange={(e) => set({ rules: form.rules.map((r, j) => (j === i ? e.target.value : r)) })}
                  placeholder="e.g. Entry after 6 PM restricted"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => set({ rules: form.rules.filter((_, j) => j !== i) })}
                  className="w-10 h-12 rounded-lg bg-dark-800 flex items-center justify-center text-dark-400 hover:text-white transition-colors shrink-0"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => set({ rules: [...form.rules, ''] })}
              className="text-xs font-semibold text-lime-400 flex items-center gap-1"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add rule
            </button>
          </StepField>
        </div>

        <div>
          <VibePreview vibes={form.vibe} onChange={(v) => set({ vibe: v })} />
          <p className="text-xs text-gray-400 mt-2">Shown as emojis on your event card so people feel the vibe before they click.</p>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
          <button
            onClick={() => submit(true)}
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-dark-800 text-dark-300 hover:bg-dark-700 hover:text-white disabled:opacity-50 transition-colors"
          >
            Save as draft
          </button>
          <button
            onClick={() => submit(false)}
            disabled={saving || !form.title.trim() || !form.date || !form.startTime.trim() || !form.venueName.trim() || !position}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-lime-500 text-dark-900 hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</span>
            ) : (
              <span className="flex items-center justify-center gap-2"><FiCheck className="w-4 h-4" /> {isEdit ? 'Save changes' : 'Publish event'}</span>
            )}
          </button>
        </div>
        <p className="text-xs text-dark-400 text-center">
          {!position && 'Tip: tap the map to pin your venue before publishing.'} • Your event will appear instantly for nearby users.
        </p>
      </div>
    </div>
  );
};

export default CreateEventPage;