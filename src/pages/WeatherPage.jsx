import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiSun, FiCloudRain, FiCloud, FiUmbrella, FiArrowRight, FiMapPin } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { normalizeActivity } from '../utils/normalize';
import api from '../api';

const conditions = {
  sunny: {
    label: 'Sunny',
    emoji: '☀️',
    icon: 'from-amber-400 to-orange-500',
    tip: 'Great weather to be outdoors! Perfect for sports and parks.',
    defaults: [
      { emoji: '🏏', title: 'Evening Cricket', location: 'City Park', time: '5 PM' },
      { emoji: '🏃', title: 'Jogging Group', location: 'Riverside', time: '6 AM' },
      { emoji: '🧺', title: 'Picnic & Games', location: 'Cubbon Park', time: '4 PM' },
      { emoji: '🛹', title: 'Skateboard Session', location: 'Skate Plaza', time: '3 PM' },
    ],
    outdoor: true,
  },
  cloudy: {
    label: 'Partly Cloudy',
    emoji: '⛅',
    icon: 'from-slate-400 to-slate-500',
    tip: 'Comfortable temperature — ideal for walking and exploring.',
    defaults: [
      { emoji: '🚶', title: 'City Walking Tour', location: 'Old Town', time: '10 AM' },
      { emoji: '📸', title: 'Photography Walk', location: 'Downtown', time: '4 PM' },
      { emoji: '☕', title: 'Coffee Crawl', location: 'Koramangala', time: '5 PM' },
      { emoji: '🛍️', title: 'Market Visit', location: 'Bazaar', time: '11 AM' },
    ],
    outdoor: true,
  },
  rainy: {
    label: 'Rainy',
    emoji: '🌧️',
    icon: 'from-blue-500 to-indigo-600',
    tip: 'Rainy day? Perfect for cozy indoor hangouts.',
    defaults: [
      { emoji: '🎮', title: 'Indoor Gaming Night', location: 'Cafe', time: '7 PM' },
      { emoji: '🎬', title: 'Movie Marathon', location: 'Theater', time: '6 PM' },
      { emoji: '♟️', title: 'Board Game Night', location: 'Community Hall', time: '5 PM' },
      { emoji: '📚', title: 'Book Club Meetup', location: 'Library', time: '4 PM' },
    ],
    outdoor: false,
  },
  hot: {
    label: 'Hot & Sunny',
    emoji: '🥵',
    icon: 'from-red-400 to-rose-600',
    tip: 'It is hot! Stay cool with water-based or indoor AC activities.',
    defaults: [
      { emoji: '🏊', title: 'Swimming Session', location: 'Aquatic Center', time: '5 PM' },
      { emoji: '🧊', title: "Ice Cream Social", location: 'Gelato Spot', time: '4 PM' },
      { emoji: '⛱️', title: 'Beach Day', location: 'Coast', time: '3 PM' },
      { emoji: '🏋️', title: 'AC Gym Workout', location: 'Fitness Hub', time: '6 PM' },
    ],
    outdoor: false,
  },
};

const wmoCode = (code) => {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'cloudy';
  if (code === 3 || (code >= 45 && code <= 48)) return 'cloudy';
  if (code >= 51 && code <= 99) return 'rainy';
  return 'cloudy';
};

const OUTDOOR_CATS = ['cricket', 'walking', 'running', 'travel'];
const INDOOR_CATS = ['gaming', 'movies', 'food', 'coding', 'music', 'art', 'coffee', 'gym'];

const dayName = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return 'Today';
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short' });
};

const WeatherPage = () => {
  const { user } = useAuth();
  const [selected, setSelected] = useState('sunny');
  const [days, setDays] = useState([]);
  const [current, setCurrent] = useState({ ...conditions.sunny, temp: null, label: 'Sunny', emoji: '☀️' });
  const [loading, setLoading] = useState(true);
  const [place, setPlace] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [coords, setCoords] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const saved = user?.location?.coordinates;
    const lat = saved ? saved[1] : 12.9716;
    const lng = saved ? saved[0] : 77.5946;
    setCoords([lat, lng]);
    setPlace(user?.location?.address || null);

    Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=auto`).then((r) => r.json()),
      api.get('/api/activities').then((r) => r.data.activities || []).catch(() => []),
    ]).then(([w, acts]) => {
      if (cancelled) return;
      const list = (acts || []).map(normalizeActivity);
      setSuggestions(list);
      const cond = wmoCode(w.current_weather?.weathercode ?? 0);
      const tMaxToday = w.daily?.temperature_2m_max?.[0];
      const effective = tMaxToday != null && tMaxToday >= 32 ? 'hot' : cond;
      setCurrent({
        ...conditions[effective],
        label: conditions[effective].label,
        emoji: conditions[effective].emoji,
        temp: Math.round(w.current_weather?.temperature ?? tMaxToday ?? 0),
      });
      setSelected(effective);
      if (w.daily?.time) {
        const dayList = w.daily.time.slice(0, 7).map((dateStr, i) => {
          const code = w.daily.weathercode[i];
          const hi = Math.round(w.daily.temperature_2m_max[i]);
          const lo = Math.round(w.daily.temperature_2m_min[i]);
          const cond = wmiToCond(code, w.daily.temperature_2m_max[i]);
          return {
            ix: i,
            day: dayName(dateStr),
            emoji: conditions[cond].emoji,
            temp: i === 0 ? Math.round(w.current_weather?.temperature ?? 0) : Math.round((hi + lo) / 2),
            hi: `${hi}°`,
            lo: `${lo}°`,
            condition: cond,
          };
        });
        setDays(dayList);
        setSelectedDay(0);
      }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wmiToCond = (code, tMax) => {
    const c = wmoCode(code);
    if (c !== 'sunny' && c !== 'cloudy') return c;
    if (tMax != null && tMax >= 32) return 'hot';
    return c;
  };

  const cond = conditions[selected];
  const condSuggestions = cond.outdoor
    ? suggestions?.filter((s) => OUTDOOR_CATS.includes(s.category)).slice(0, 6)
    : suggestions?.filter((s) => INDOOR_CATS.includes(s.category) || (selected === 'hot' && s.category === 'gym')).slice(0, 6);
  const activityList = condSuggestions?.length
    ? condSuggestions.map((s) => ({
        emoji: s.emoji,
        title: s.title,
        location: s.address,
        time: s.time || 'Anytime',
        id: s.id,
      }))
    : cond.defaults;

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Weather Suggestions
        </h1>
        <p className="text-dark-400 flex items-center gap-1">
          <FiMapPin className="w-3 h-3" />
          {place || `${coords ? coords[0].toFixed(2) + ', ' + coords[1].toFixed(2) : 'Your area'}`} • Live forecast
        </p>
      </div>

      {/* 7-day forecast */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {days.map((d) => (
          <button
            key={d.ix}
            onClick={() => { setSelectedDay(d.ix); setSelected(d.condition); }}
            className={`glass-strong rounded-2xl p-4 text-center hover-lift ${
              selectedDay === d.ix ? 'ring-2 ring-lime-500' : ''
            }`}
          >
            <p className="text-sm font-medium text-dark-300">{d.day}</p>
            <p className="text-3xl my-2">{d.emoji}</p>
            <p className="text-xl font-bold text-white">{d.temp}°</p>
            <p className="text-xs text-dark-400 mt-1">H:{d.hi} L:{d.lo}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-dark-400">Fetching the latest forecast...</div>
      ) : (
        <>
          {/* Current condition banner */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${current.icon} p-8 mb-8 hover-lift`}>
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative z-10 flex items-center gap-6">
              <span className="text-6xl">{current.emoji}</span>
              <div>
                <h2 className="text-3xl font-bold text-white">{current.label}</h2>
                <p className="text-white/90 mt-1">{current.temp}°C • {current.tip}</p>
              </div>
            </div>
          </div>

          {/* Suggested activities */}
          <h2 className="text-lg font-bold text-white mb-5">Perfect activities for {current.label.toLowerCase()} weather</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {activityList.map((activity, idx) => (
              <Link
                key={`${activity.title}-${idx}`}
                to={activity.id ? `/activities/${activity.id}` : '/explore'}
                className="glass-strong rounded-2xl p-5 flex items-center gap-4 hover-lift group"
              >
                <span className="text-4xl">{activity.emoji}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{activity.title}</h3>
                  <p className="text-sm text-dark-400 mt-0.5">{activity.location} • {activity.time}</p>
                </div>
                <span className="text-lime-400 group-hover:translate-x-1 transition-transform">
                  <FiArrowRight className="w-5 h-5" />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default WeatherPage;