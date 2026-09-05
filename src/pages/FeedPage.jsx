import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiHeart, FiMessageCircle, FiShare2, FiBookmark,
  FiMapPin, FiCalendar, FiUsers, FiTarget, FiMoreHorizontal,
  FiImage, FiSmile, FiSend, FiPlus
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { normalizeActivity } from '../utils/normalize';
import api from '../api';

const FeedPage = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = () => {
    api.get('/api/activities')
      .then((res) => {
        const list = (res.data.activities || []).map((raw) => {
          const a = normalizeActivity(raw);
          return {
            id: a.id,
            saved: raw.saved === true,
            user: {
              name: a.host,
              avatar: a.hostAvatar || a.host?.[0] || '?',
              gradient: 'bg-gradient-to-br from-lime-500 to-electric-500',
            },
            activity: {
              title: a.title,
              category: a.category,
              emoji: a.emoji,
              location: a.address,
              date: a.time,
            },
            content: a.description,
            likes: a.feedback.length,
            comments: a.feedback.length,
            shares: 0,
            time: a.dateRaw ? new Date(a.dateRaw).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + (a.timeRaw || '') : a.time,
            liked: false,
            participants: a.participants,
            joined: a.joined,
            match: a.match,
            creatorId: a.creatorId,
            isCreator: a.isCreator,
          };
        });
        setPosts(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const toggleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const toggleSave = async (postId) => {
    const target = posts.find(p => p.id === postId);
    const prev = target.saved;
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, saved: !post.saved } : post
    ));
    try {
      const res = await api.post(`/api/activities/${postId}/save`);
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, saved: res.data.saved } : post
      ));
    } catch (e) {
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, saved: prev } : post
      ));
    }
  };

  const joinActivity = async (postId) => {
    try {
      await api.post(`/api/activities/${postId}/join`);
      loadFeed();
    } catch (e) {}
  };

  const me = user?.name?.[0] || 'Y';

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Your Feed
        </h1>
        <Link to="/create-activity" className="btn-primary text-sm flex items-center gap-1">
          <FiPlus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Create Post */}
      <Link to="/create-activity" className="card mb-6 p-4 block">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {me}
          </div>
          <div className="flex-1">
            <div className="w-full px-4 py-3 bg-dark-800/50 border border-dark-700/50 rounded-xl text-dark-300 text-left">
              What's happening with your activities?
            </div>
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <span className="p-2 text-dark-400 hover:text-lime-400 hover:bg-dark-700/50 rounded-lg transition-colors cursor-pointer">
                  <FiImage className="w-5 h-5" />
                </span>
                <span className="p-2 text-dark-400 hover:text-lime-400 hover:bg-dark-700/50 rounded-lg transition-colors cursor-pointer">
                  <FiSmile className="w-5 h-5" />
                </span>
                <span className="p-2 text-dark-400 hover:text-lime-400 hover:bg-dark-700/50 rounded-lg transition-colors cursor-pointer">
                  <FiMapPin className="w-5 h-5" />
                </span>
              </div>
              <span className="btn-primary text-sm px-4 py-2 flex items-center gap-1">
                <FiSend className="w-4 h-4" />
                Post
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Feed Posts */}
      {loading ? (
        <div className="card p-8 text-center text-dark-400">Loading your feed...</div>
      ) : posts.length === 0 ? (
        <div className="card p-10 text-center">
          <span className="text-6xl mb-4 block">🌱</span>
          <h3 className="text-xl font-bold text-white mb-2">Nothing here yet</h3>
          <p className="text-dark-400 mb-6">Create or join an activity to get your feed going</p>
          <Link to="/explore" className="btn-primary">Explore Activities</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <article key={post.id} className="card">
              {/* Post Header */}
              <Link to={`/users/${post.creatorId}`} className="flex items-center gap-3 p-4 pb-0 group">
                <div className={`w-12 h-12 rounded-full ${post.user.gradient} flex items-center justify-center text-white font-bold overflow-hidden`}>
                  {post.user.avatar && post.user.avatar.startsWith('http') ? (
                    <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                  ) : post.user.avatar && post.user.avatar.startsWith('/') ? (
                    <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
                  ) : (
                    post.user.avatar
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white group-hover:text-lime-400 transition-colors">{post.user.name}</h3>
                    {post.isCreator && (
                      <span className="text-xs text-dark-400">(host)</span>
                    )}
                    <span className="text-dark-400 text-sm">•</span>
                    <span className="text-dark-400 text-sm">{post.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-dark-400">
                    <span>{post.activity.emoji}</span>
                    <span>{post.activity.title}</span>
                  </div>
                </div>
                <button className="btn-icon">
                  <FiMoreHorizontal className="w-5 h-5" />
                </button>
              </Link>

              {/* Activity Tag */}
              <div className="px-4 py-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-dark-800/50 rounded-lg text-sm text-dark-300">
                  <FiMapPin className="w-3 h-3" />
                  {post.activity.location}
                  <span className="text-dark-600">•</span>
                  <FiCalendar className="w-3 h-3" />
                  {post.activity.date}
                  <span className="text-dark-600">•</span>
                  <FiUsers className="w-3 h-3" />
                  {post.participants} going
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-4">
                <p className="text-dark-200 whitespace-pre-wrap">
                  {post.content || `Join this ${post.activity.category} activity — ${post.activity.time}!`}
                </p>
                {typeof post.match === 'number' && (
                  <span className="badge-lime text-xs mt-2 inline-flex items-center gap-1">
                    <FiTarget className="w-3 h-3" />
                    {post.match}% match
                  </span>
                )}
              </div>

              {/* Post Actions */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-dark-800">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm transition-colors ${
                      post.liked ? 'text-pink-500' : 'text-dark-400 hover:text-pink-500'
                    }`}
                  >
                    <FiHeart className={`w-5 h-5 ${post.liked ? 'fill-current' : ''}`} />
                    <span>{post.likes}</span>
                  </button>
                  <Link
                    to={`/activities/${post.id}`}
                    className="flex items-center gap-1.5 text-sm text-dark-400 hover:text-electric-400 transition-colors"
                  >
                    <FiMessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </Link>
                  <button className="flex items-center gap-1.5 text-sm text-dark-400 hover:text-lime-400 transition-colors">
                    <FiShare2 className="w-5 h-5" />
                    <span>{post.shares}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {!post.joined && !post.isCreator && (
                    <button
                      onClick={() => joinActivity(post.id)}
                      className="btn-primary text-xs px-3 py-1.5"
                    >
                      Join
                    </button>
                  )}
                  <button
                    onClick={() => toggleSave(post.id)}
                    className={`p-2 transition-colors ${
                      post.saved ? 'text-amber-400' : 'text-dark-400 hover:text-amber-400'
                    }`}
                  >
                    <FiBookmark className={`w-5 h-5 ${post.saved ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Comment Input */}
              <div className="px-4 pb-4">
                <Link to={`/activities/${post.id}`} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {me}
                  </div>
                  <div className="flex-1 px-3 py-2 bg-dark-800/50 border border-dark-700/50 rounded-lg text-dark-400 text-left text-sm">
                    Write a comment or check-in...
                  </div>
                  <span className="p-2 text-lime-400">
                    <FiSend className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default FeedPage;