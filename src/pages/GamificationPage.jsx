import { useState, useEffect } from 'react';
import { 
  FiAward, FiStar, FiTrendingUp, FiCalendar,
  FiZap, FiTarget, FiUsers, FiCoffee, FiHeart
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { normalizeActivity } from '../utils/normalize';
import api from '../api';

const pointFor = (u) =>
  ((u.stats?.activitiesJoined || 0) * 50) +
  ((u.stats?.connections || 0) * 20) +
  ((u.stats?.streak || 0) * 15) +
  Math.round((u.stats?.rating || 0) * 10);

const GRADIENTS = ['from-lime-500 to-emerald-500', 'from-pink-500 to-rose-500', 'from-electric-500 to-cyan-500', 'from-purple-500 to-violet-500', 'from-sunset-500 to-orange-500'];

const gradientFor = (name) => GRADIENTS[(name || '?').charCodeAt(0) % GRADIENTS.length];

const GamificationPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('badges');
  const [joined, setJoined] = useState([]);
  const [hosted, setHosted] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      api.get('/api/activities?joined=1'),
      api.get('/api/activities?authored=1'),
      api.get('/api/users/leaderboard'),
    ]).then(([j, h, lb]) => {
      if (!mounted) return;
      setJoined((j.data.activities || []).map(normalizeActivity));
      setHosted((h.data.activities || []).map(normalizeActivity));
      setLeaderboard((lb.data.users || []));
    }).catch(() => {})
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const stats = user?.stats || {};
  const joinedActs = joined;
  const hostedCount = hosted.length;
  const catCount = (cat) => joinedActs.filter((a) => a.category === cat).length;
  const hourOf = (a) => (a.dateRaw ? new Date(a.dateRaw).getHours() : null);
  const evening = joinedActs.filter((a) => { const h = hourOf(a); return h !== null && h >= 17; }).length;
  const morning = joinedActs.filter((a) => { const h = hourOf(a); return h !== null && h < 10; }).length;
  const locations = new Set(joinedActs.map((a) => a.address)).size;

  const badgeDefs = [
    { name: 'First Steps', emoji: '👶', desc: 'Complete your first activity', total: 1, current: joinedActs.length },
    { name: 'Social Butterfly', emoji: '🦋', desc: 'Connect with 10 people', total: 10, current: stats.connections || 0 },
    { name: 'Coffee Lover', emoji: '☕', desc: 'Join 5 coffee meetups', total: 5, current: catCount('coffee') },
    { name: 'Cricket Pro', emoji: '🏏', desc: 'Play 20 cricket matches', total: 20, current: catCount('cricket') },
    { name: 'Night Owl', emoji: '🦉', desc: 'Join 10 evening activities', total: 10, current: evening },
    { name: 'Early Bird', emoji: '🐦', desc: 'Join 10 morning activities', total: 10, current: morning },
    { name: 'Community Star', emoji: '⭐', desc: 'Host 5 activities', total: 5, current: hostedCount },
    { name: 'Explorer', emoji: '🗺️', desc: 'Visit 6 different locations', total: 6, current: locations },
    { name: 'Foodie', emoji: '🍕', desc: 'Join 4 food activities', total: 4, current: catCount('food') },
    { name: 'Streak Master', emoji: '🔥', desc: 'Maintain 30-day streak', total: 30, current: stats.streak || 0 },
  ];

  const badges = badgeDefs.map((b) => ({ ...b, progress: Math.min(b.current, b.total), earned: b.current >= b.total }));
  const earnedCount = badges.filter((b) => b.earned).length;

  const meId = user?.id;
  const board = leaderboard.map((u) => ({
    rank: null,
    name: u.name,
    avatar: u.avatar || u.name?.charAt(0),
    gradient: gradientFor(u.name),
    points: pointFor(u),
    activities: u.stats?.activitiesJoined || 0,
    isMe: u._id === meId || u.id === meId,
  })).sort((a, b) => b.points - a.points);
  const myIndex = board.findIndex((u) => u.isMe);
  const rankedBoard = board.map((u, i) => ({ ...u, rank: i + 1 }));

  const points = pointFor(user);
  const myRank = myIndex >= 0 ? myIndex + 1 : null;

  // Streaks - last 7 days
  const weekDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const active = joinedActs.some((a) => a.dateRaw && new Date(a.dateRaw).toDateString() === d.toDateString());
    weekDays.push({ day: d.toLocaleDateString('en-US', { weekday: 'narrow' }), date: d, active });
  }
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const activitiesThisWeek = joinedActs.filter((a) => a.dateRaw && new Date(a.dateRaw) >= weekAgo).length;
  const weeklyGoal = 5;

  const podium = rankedBoard.slice(0, 3);
  const rest = rankedBoard.slice(3, 9);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Achievements
        </h1>
        <p className="text-dark-400">Track your progress and earn rewards</p>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-dark-400">Loading your achievements...</div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 text-center">
              <FiZap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{points.toLocaleString()}</div>
              <div className="text-sm text-dark-400">Points</div>
            </div>
            <div className="card p-4 text-center">
              <FiAward className="w-6 h-6 text-lime-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{earnedCount}</div>
              <div className="text-sm text-dark-400">Badges</div>
            </div>
            <div className="card p-4 text-center">
              <FiTrendingUp className="w-6 h-6 text-electric-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.streak || 0}</div>
              <div className="text-sm text-dark-400">Day Streak</div>
            </div>
            <div className="card p-4 text-center">
              <FiTarget className="w-6 h-6 text-pink-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{myRank ? `#${myRank}` : '—'}</div>
              <div className="text-sm text-dark-400">Rank</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {[
              { id: 'badges', name: 'Badges', icon: FiAward },
              { id: 'streaks', name: 'Streaks', icon: FiCalendar },
              { id: 'leaderboard', name: 'Leaderboard', icon: FiTrendingUp },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
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

          {/* Badges Tab */}
          {activeTab === 'badges' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div 
                  key={badge.name} 
                  className={`card p-4 ${badge.earned ? 'border-lime-500/30 bg-lime-500/5' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                      badge.earned 
                        ? 'bg-gradient-to-br from-lime-500/20 to-emerald-500/20'
                        : 'bg-dark-700/50'
                    }`}>
                      {badge.emoji}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${badge.earned ? 'text-white' : 'text-dark-400'}`}>
                        {badge.name}
                      </h3>
                      <p className="text-xs text-dark-400">{badge.desc}</p>
                    </div>
                    {badge.earned && <FiStar className="w-4 h-4 text-amber-400" />}
                  </div>
                  {badge.earned ? (
                    <div className="flex items-center gap-2 text-sm text-lime-400">
                      <FiAward className="w-4 h-4" />
                      Earned
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-dark-400">Progress</span>
                        <span className="text-dark-300">{badge.progress}/{badge.total}</span>
                      </div>
                      <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-lime-500 to-electric-500 rounded-full"
                          style={{ width: `${(badge.progress / badge.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Streaks Tab */}
          {activeTab === 'streaks' && (
            <div className="space-y-6">
              <div className="card p-6 text-center">
                <div className="text-6xl mb-2">🔥</div>
                <div className="text-5xl font-bold text-white mb-2">{stats.streak || 0}</div>
                <div className="text-xl text-dark-400">Day Streak</div>
                <p className="text-dark-400 mt-2">You've joined {stats.activitiesJoined || 0} activities so far. Keep it going!</p>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">This Week</h3>
                <div className="flex justify-between mb-4">
                  <span className="text-dark-400">Activities</span>
                  <span className="text-white font-semibold">
                    {activitiesThisWeek}/{weeklyGoal}
                  </span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden mb-5">
                  <div 
                    className="h-full bg-gradient-to-r from-lime-500 to-electric-500 rounded-full"
                    style={{ width: `${Math.min(100, (activitiesThisWeek / weeklyGoal) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between gap-2">
                  {weekDays.map((d, idx) => (
                    <div key={idx} className="flex-1 text-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-1 ${
                        d.active
                          ? 'bg-lime-500 text-dark-900 font-bold'
                          : 'bg-dark-700 text-dark-400'
                      }`}>
                        {d.active ? '✓' : d.date.getDate()}
                      </div>
                      <span className="text-xs text-dark-400">{d.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">How Streaks Work</h3>
                <ul className="space-y-3 text-dark-300">
                  <li className="flex items-start gap-2">
                    <span className="text-lime-400">•</span>
                    Join or host an activity to maintain your streak
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lime-400">•</span>
                    Miss a day and the streak restarts from 1
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lime-400">•</span>
                    Hit 7-day streak for a special badge
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-lime-400">•</span>
                    30-day streak unlocks the Streak Master badge
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            rankedBoard.length === 0 ? (
              <div className="card p-10 text-center">
                <span className="text-5xl mb-4 block">🏆</span>
                <h3 className="text-xl font-bold text-white mb-2">No leaderboard yet</h3>
                <p className="text-dark-400">Join activities to climb the ranks</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-end justify-center gap-4 mb-8">
                  {podium.map((person, idx) => (
                    <div key={person.rank} className={`text-center ${idx === 0 ? 'order-2' : idx === 1 ? 'order-1' : 'order-3'}`}>
                      <div className={`relative ${idx === 0 ? 'mb-2' : 'mb-1'}`}>
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${person.gradient} flex items-center justify-center text-white font-bold overflow-hidden ${
                          idx === 0 ? 'w-20 h-20 text-xl' : ''
                        }`}>
                          {person.avatar && typeof person.avatar === 'string' && person.avatar.startsWith('/') ? (
                            <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                          ) : (
                            person.avatar
                          )}
                        </div>
                        <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          idx === 0 ? 'bg-amber-400 text-dark-900' : 
                          idx === 1 ? 'bg-gray-300 text-dark-900' : 
                          'bg-orange-400 text-dark-900'
                        }`}>
                          {person.rank}
                        </div>
                      </div>
                      <h4 className={`font-semibold ${person.isMe ? 'text-lime-400' : 'text-white'} ${idx === 0 ? 'text-lg' : ''}`}>
                        {person.name}{person.isMe ? ' (you)' : ''}
                      </h4>
                      <p className="text-sm text-dark-400">{person.points.toLocaleString()} pts</p>
                    </div>
                  ))}
                </div>

                <div className="card overflow-hidden">
                  {rest.map((person) => (
                    <div 
                      key={person.rank} 
                      className={`flex items-center gap-4 p-4 border-b border-dark-700/50 last:border-0 ${
                        person.isMe ? 'bg-lime-500/5' : ''
                      }`}
                    >
                      <span className="w-8 text-center font-bold text-dark-400">#{person.rank}</span>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${person.gradient} flex items-center justify-center text-white font-bold overflow-hidden`}>
                        {person.avatar && typeof person.avatar === 'string' && person.avatar.startsWith('/') ? (
                          <img src={person.avatar} alt={person.name} className="w-full h-full object-cover" />
                        ) : (
                          person.avatar
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${person.isMe ? 'text-lime-400' : 'text-white'}`}>
                          {person.name}
                        </h4>
                        <p className="text-xs text-dark-400">{person.activities} activities</p>
                      </div>
                      <span className="font-bold text-white">{person.points.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default GamificationPage;