import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiTrendingUp, FiArrowUp, FiUsers, FiMapPin,
  FiCalendar, FiTarget, FiZap, FiClock
} from 'react-icons/fi';
import { normalizeActivity } from '../utils/normalize';
import { getMatchScore } from '../utils/normalize';
import api from '../api';

const CATEGORY_META = {
  cricket: { label: 'Cricket Games', emoji: '🏏' },
  coffee: { label: 'Coffee Sessions', emoji: '☕' },
  gaming: { label: 'Gaming Nights', emoji: '🎮' },
  gym: { label: 'Gym Workouts', emoji: '🏋️' },
  movies: { label: 'Movie Nights', emoji: '🎬' },
  walking: { label: 'Walks & Hikes', emoji: '🚶' },
  running: { label: 'Running Groups', emoji: '🏃' },
  food: { label: 'Food Meetups', emoji: '🍕' },
  coding: { label: 'Coding Sessions', emoji: '💻' },
  music: { label: 'Music Jams', emoji: '🎸' },
  travel: { label: 'Travel Trips', emoji: '✈️' },
  art: { label: 'Art & Crafts', emoji: '🎨' },
};

const TrendingPage = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [allActivities, setAllActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/activities')
      .then((res) => {
        setAllActivities((res.data.activities || []).map(normalizeActivity));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const inRange = (dateRaw) => {
    if (!dateRaw) return false;
    const d = new Date(dateRaw);
    const now = new Date();
    if (timeRange === 'today') return d.toDateString() === now.toDateString();
    if (timeRange === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    return d >= monthAgo;
  };

  const ranged = allActivities.filter((a) => inRange(a.dateRaw));

  const categoryCounts = {};
  ranged.forEach((a) => {
    const key = a.category || 'other';
    if (!categoryCounts[key]) categoryCounts[key] = { count: 0, participants: 0, locations: new Set(), description: '' };
    categoryCounts[key].count += 1;
    categoryCounts[key].participants += a.participants;
    categoryCounts[key].locations.add(a.address);
  });

  const total = ranged.length;
  const maxCategoryParticipants = Object.values(categoryCounts).reduce((m, c) => Math.max(m, c.participants), 0);
  const trending = Object.entries(categoryCounts)
    .map(([cat, v]) => ({
      id: cat,
      title: CATEGORY_META[cat]?.label || `${cat} Activities`,
      category: cat,
      emoji: CATEGORY_META[cat]?.emoji || '🎯',
      trend: `+${Math.min(99, 5 + Math.round((v.count / Math.max(total, 1)) * 100))}%`,
      participants: v.participants,
      locations: v.locations.size,
      description: `${v.count} ${cat} activit${v.count === 1 ? 'y' : 'ies'} in this period`,
      isHot: v.participants >= maxCategoryParticipants,
    }))
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 6);

  const hotActivities = [...ranged]
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 4)
    .map((a) => ({
      id: a.id,
      title: a.title,
      emoji: a.emoji,
      spots: Math.max(0, a.maxParticipants - a.participants),
      time: a.time || 'Anytime',
      match: getMatchScore(a),
    }));

  const weekdayCounts = [0, 1, 2, 3, 4, 5, 6];
  allActivities.forEach((a) => {
    if (a.dateRaw) weekdayCounts[new Date(a.dateRaw).getDay()] += 1;
  });
  const maxWeekday = Math.max(1, ...weekdayCounts);
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const popularTimes = dayNames.map((day, i) => ({
    day,
    percentage: Math.round((weekdayCounts[(i + 1) % 7] / maxWeekday) * 100),
  }));

  const now = new Date();
  const todayCount = allActivities.filter((a) => a.dateRaw && new Date(a.dateRaw).toDateString() === now.toDateString()).length;
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const newThisWeek = allActivities.filter((a) => a.dateRaw && new Date(a.dateRaw) >= weekAgo).length;
  const uniquePeople = new Set(allActivities.flatMap((a) => a.attendees.map((x) => x.id))).size;
  const busyDayIdx = Math.max(...weekdayCounts.map((c, i) => (i % 7 === 0 ? -1 : c)));
  const busyDay = dayNames[weekdayCounts.findIndex((c) => c === Math.max(...weekdayCounts.slice(1))) % 7];
  const quietDay = dayNames[weekdayCounts.slice(1).indexOf(Math.min(...weekdayCounts.slice(1))) % 7];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FiTrendingUp className="w-6 h-6 text-lime-400" />
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Trending Now
          </h1>
        </div>
        <p className="text-dark-400">See what's popular in your area</p>
      </div>

      {/* Time Range */}
      <div className="flex gap-2 mb-6">
        {['today', 'week', 'month'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-xl capitalize transition-all ${
              timeRange === range
                ? 'bg-lime-500 text-dark-900 font-semibold'
                : 'bg-dark-800/50 text-dark-300 hover:bg-dark-700/50 border border-dark-700/50'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-dark-400">Crunching the numbers...</div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trending Activities */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Trending Activities</h2>
              {trending.length > 0 ? (
                <div className="space-y-4">
                  {trending.map((item, idx) => (
                    <div key={item.id} className="card-glow p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-2xl font-bold text-dark-400 w-8">
                          {idx + 1}
                        </div>
                        <div className="w-14 h-14 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                          {item.emoji}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <div>
                              <h3 className="font-bold text-white capitalize">{item.title}</h3>
                              <span className="badge-lime text-xs">{item.category}</span>
                            </div>
                            <span className="flex items-center gap-1 text-lime-400 font-semibold">
                              <FiArrowUp className="w-4 h-4" />
                              {item.trend}
                            </span>
                          </div>
                          <p className="text-sm text-dark-400 mb-2 capitalize">{item.description}</p>
                          <div className="flex items-center gap-4 text-sm text-dark-400">
                            <span className="flex items-center gap-1">
                              <FiUsers className="w-3 h-3" />
                              {item.participants} people
                            </span>
                            <span className="flex items-center gap-1">
                              <FiMapPin className="w-3 h-3" />
                              {item.locations} locations
                            </span>
                          </div>
                        </div>
                        {item.isHot && (
                          <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold">
                            🔥 HOT
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-8 text-center text-dark-400">
                  No activities to rank yet. Create one to get the stats flowing!
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Hot Activities */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiZap className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Hot Right Now</h2>
              </div>
              {hotActivities.length > 0 ? (
                <div className="space-y-3">
                  {hotActivities.map((activity) => (
                    <Link
                      key={activity.id}
                      to={`/activities/${activity.id}`}
                      className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors block"
                    >
                      <span className="text-2xl">{activity.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">{activity.title}</h4>
                        <p className="text-xs text-dark-400 flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {activity.time} • {activity.spots} spots left
                        </p>
                      </div>
                      <span className="badge-lime text-xs">{activity.match}%</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">No upcoming activities yet.</p>
              )}
            </div>

            {/* Popular Times */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Popular Times</h2>
              {allActivities.length > 0 ? (
                <>
                  <div className="flex items-end justify-between gap-2 h-32">
                    {popularTimes.map((day) => (
                      <div key={day.day} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-gradient-to-t from-lime-500 to-lime-400 rounded-t transition-all duration-500"
                          style={{ height: `${day.percentage}%` }}
                          title={`${day.percentage}% of busiest day`}
                        />
                        <span className="text-xs text-dark-400 mt-2">{day.day}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-dark-400 text-center mt-4">
                    Busiest: {busyDay} • Quietest: {quietDay}
                  </p>
                </>
              ) : (
                <p className="text-dark-400 text-sm">Schedule activities to see trends.</p>
              )}
            </div>

            {/* Quick Stats */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Area Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-dark-400">Active Participants</span>
                  <span className="text-white font-bold">{uniquePeople}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-400">Activities Today</span>
                  <span className="text-white font-bold">{todayCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-dark-400">New This Week</span>
                  <span className="text-lime-400 font-bold">+{newThisWeek}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendingPage;