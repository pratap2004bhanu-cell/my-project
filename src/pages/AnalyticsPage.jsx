import { useState, useEffect, useMemo } from 'react';
import { 
  FiTrendingUp, FiUsers, FiCalendar, FiTarget,
  FiClock, FiMapPin, FiBarChart2, FiPieChart
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { RoundAvatar } from '../components/common';
import { normalizeActivity, getMatchScore, categoryColor } from '../utils/normalize';
import api from '../api';

const GRADIENTS = ['from-lime-500 to-electric-500', 'from-pink-500 to-rose-500', 'from-sunset-500 to-orange-500'];
const gradientFor = (name) => GRADIENTS[(name || '?').charCodeAt(0) % GRADIENTS.length];

const AnalyticsPage = () => {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('month');
  const [allActs, setAllActs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/activities?joined=1')
      .then((res) => setAllActs((res.data.activities || []).map(normalizeActivity)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stats = user?.stats || {};

  const data = useMemo(() => {
    const now = new Date();
    const dayAgo = (n) => { const d = new Date(now); d.setDate(now.getDate() - n); return d; };
    const rangeDays = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    const inRange = allActs.filter((a) => a.dateRaw && new Date(a.dateRaw) >= dayAgo(rangeDays));
    const prev = allActs.filter((a) => a.dateRaw && new Date(a.dateRaw) >= dayAgo(rangeDays * 2) && new Date(a.dateRaw) < dayAgo(rangeDays));

    const pctChange = (cur, before) => {
      if (!before) return cur > 0 ? '+100%' : '0%';
      const p = Math.round(((cur - before) / before) * 100);
      return (p >= 0 ? '+' : '') + p + '%';
    };

    const breakdownMap = {};
    inRange.forEach((a) => {
      const cat = a.category || 'other';
      breakdownMap[cat] = (breakdownMap[cat] || 0) + 1;
    });
    const total = inRange.length;
    const activityBreakdown = Object.entries(breakdownMap)
      .map(([cat, count]) => ({
        category: cat.replace(/^\w/, (c) => c.toUpperCase()),
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
        color: categoryColor(cat),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Time buckets
    const buckets = [];
    if (timeRange === 'week') {
      for (let i = 6; i >= 0; i--) {
        const d = dayAgo(i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short' });
        buckets.push({ label, count: inRange.filter((a) => a.dateRaw && new Date(a.dateRaw).toDateString() === d.toDateString()).length });
      }
    } else {
      const months = timeRange === 'month' ? 6 : 12;
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          count: inRange.filter((a) => {
            if (!a.dateRaw) return false;
            const ad = new Date(a.dateRaw);
            return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth();
          }).length,
        });
      }
    }
    const maxBucket = Math.max(1, ...buckets.map((b) => b.count));

    // Top connections (co-participants)
    const coMap = {};
    inRange.forEach((a) => {
      a.attendees.forEach((p) => {
        if (p.id === user?.id) return;
        if (!coMap[p.id]) coMap[p.id] = { id: p.id, name: p.name, count: 0 };
        coMap[p.id].count += 1;
      });
    });
    const topConnections = Object.values(coMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map((p) => ({ ...p, compatibility: Math.min(99, 50 + p.count * 15), avatar: p.name?.charAt(0) }));

    const peopleTotal = Object.keys(coMap).length;
    const repeatCount = Object.values(coMap).filter((p) => p.count > 1).length;
    const locations = new Set(inRange.map((a) => a.address)).size;
    const activeDays = new Set(inRange.map((a) => a.dateRaw && new Date(a.dateRaw).toDateString())).size;

    return {
      totalActivities: total,
      activitiesChange: pctChange(total, prev.length),
      hoursSpent: total * 2,
      hoursChange: pctChange(total * 2, prev.length * 2),
      avgMatch: total ? Math.round(inRange.reduce((s, a) => s + getMatchScore(a), 0) / total) : 0,
      activityBreakdown,
      monthlyActivity: buckets,
      maxBucket,
      topConnections,
      avgRating: stats.rating || 0,
      repeatRate: peopleTotal ? Math.round((repeatCount / peopleTotal) * 100) : 0,
      newPlaces: locations,
      activeDays,
    };
  }, [allActs, timeRange, user?.id]);

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Analytics
          </h1>
          <p className="text-dark-400">Track your activity patterns and connections</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((range) => (
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
      </div>

      {loading ? (
        <div className="card p-8 text-center text-dark-400">Crunching your numbers...</div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card p-4">
              <p className="text-sm text-dark-400 mb-1">Total Activities</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{data.totalActivities}</span>
                <span className={`text-sm mb-1 ${data.activitiesChange.startsWith('-') ? 'text-red-400' : 'text-lime-400'}`}>{data.activitiesChange}</span>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-sm text-dark-400 mb-1">Connections</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{stats.connections || 0}</span>
                <span className="text-sm text-dark-500 mb-1">—</span>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-sm text-dark-400 mb-1">Hours Spent</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{data.hoursSpent}</span>
                <span className={`text-sm mb-1 ${data.hoursChange.startsWith('-') ? 'text-red-400' : 'text-lime-400'}`}>{data.hoursChange}</span>
              </div>
            </div>
            <div className="card p-4">
              <p className="text-sm text-dark-400 mb-1">Avg Match</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{data.totalActivities ? `${data.avgMatch}%` : '—'}</span>
                <span className="text-sm text-dark-500 mb-1">—</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            {/* Activity Breakdown */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <FiPieChart className="w-5 h-5 text-lime-400" />
                <h2 className="text-lg font-semibold text-white">Activity Breakdown</h2>
              </div>
              {data.activityBreakdown.length > 0 ? (
                <div className="space-y-4">
                  {data.activityBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-dark-300">{item.category}</span>
                        <span className="text-white font-medium">{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">Join activities to see your breakdown.</p>
              )}
            </div>

            {/* Monthly Activity */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <FiBarChart2 className="w-5 h-5 text-lime-400" />
                <h2 className="text-lg font-semibold text-white">
                  {timeRange === 'week' ? 'Daily Activity' : 'Monthly Activity'}
                </h2>
              </div>
              {data.monthlyActivity.some((b) => b.count > 0) ? (
                <div className="flex items-end justify-between h-40 gap-2">
                  {data.monthlyActivity.map((item) => (
                    <div key={item.label} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-gradient-to-t from-lime-500 to-lime-400 rounded-t-lg transition-all duration-500"
                        style={{ height: `${(item.count / data.maxBucket) * 100}%` }}
                        title={`${item.count}`}
                      />
                      <span className="text-xs text-dark-400 mt-2">{item.label}</span>
                      <span className="text-sm text-white font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">No activity in this period yet.</p>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Top Connections */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <FiUsers className="w-5 h-5 text-lime-400" />
                <h2 className="text-lg font-semibold text-white">Top Connections</h2>
              </div>
              {data.topConnections.length > 0 ? (
                <div className="space-y-4">
                  {data.topConnections.map((person, idx) => (
                    <div key={person.id} className="flex items-center gap-4">
                      <span className="text-lg font-bold text-dark-400 w-6">{idx + 1}</span>
                      <RoundAvatar
                        src={person.avatar}
                        name={person.name}
                        gradient={gradientFor(person.name)}
                        className="w-10 h-10"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{person.name}</h4>
                        <p className="text-sm text-dark-400">{person.count} activities together</p>
                      </div>
                      <span className="badge-lime">{person.compatibility}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-dark-400 text-sm">Join group activities to grow your connections.</p>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-6">
                <FiTarget className="w-5 h-5 text-lime-400" />
                <h2 className="text-lg font-semibold text-white">Performance Metrics</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-dark-800/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-white mb-1">{data.avgRating ? data.avgRating.toFixed(1) : '—'}</div>
                  <div className="text-sm text-dark-400">Avg Rating</div>
                </div>
                <div className="p-4 bg-dark-800/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-white mb-1">{data.repeatRate}%</div>
                  <div className="text-sm text-dark-400">Repeat Meetups</div>
                </div>
                <div className="p-4 bg-dark-800/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-white mb-1">{data.newPlaces}</div>
                  <div className="text-sm text-dark-400">New Places</div>
                </div>
                <div className="p-4 bg-dark-800/50 rounded-xl text-center">
                  <div className="text-2xl font-bold text-white mb-1">{data.activeDays}</div>
                  <div className="text-sm text-dark-400">Active Days</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;