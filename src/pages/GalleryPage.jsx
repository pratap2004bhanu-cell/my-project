import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiImage, FiCamera, FiHeart, FiUsers,
  FiShare2, FiX, FiArrowLeft
} from 'react-icons/fi';
import api from '../api';

const GalleryPage = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [activities, setActivities] = useState([]);
  const [liked, setLiked] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/activities?joined=1').catch(() => ({ data: { activities: [] } })),
      api.get('/api/activities?authored=1').catch(() => ({ data: { activities: [] } })),
    ]).then(([joined, authored]) => {
      const seen = new Map();
      for (const act of [...(authored.data.activities || []), ...(joined.data.activities || [])]) {
        if (!seen.has(act._id)) seen.set(act._id, act);
      }
      setActivities([...seen.values()]);
      setLoading(false);
    });
  }, []);

  // Build a flat list of photo tiles (one per activity; real image when available)
  const buildPhotos = (list) => list.map((a, idx) => ({
    id: `${a._id}-${idx}`,
    activityId: a._id,
    url: a.photos?.[0] || null,
    emoji: a.emoji || '🎯',
    activity: a.title || 'Activity',
    date: a.date || a.createdAt || null,
    isCreator: a.isCreator,
    participants: a.participants?.length || 0,
    maxParticipants: a.maxParticipants || 10,
  }));

  const allPhotos = buildPhotos(activities);
  const myPhotos = buildPhotos(activities.filter((a) => a.isCreator));
  const likedPhotos = allPhotos.filter((p) => liked[p.id]);

  const displayPhotos = activeTab === 'all' ? allPhotos : activeTab === 'mine' ? myPhotos : likedPhotos;

  const toggleLike = (photo) => {
    setLiked((prev) => ({ ...prev, [photo.id]: !prev[photo.id] }));
    if (selectedPhoto && selectedPhoto.id === photo.id) {
      setSelectedPhoto(photo);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return 'Recently';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 864e5);
    if (diff <= 1) return 'Recently';
    if (diff < 30) return `${diff} days ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: selectedPhoto.activity }).catch(() => {});
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Photo Gallery
          </h1>
          <p className="text-dark-400">Memories from your activities</p>
        </div>
        <Link to="/activities" className="btn-primary flex items-center gap-2">
          <FiCamera className="w-4 h-4" />
          Browse Activities
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', name: 'All Photos' },
          { id: 'mine', name: 'My Photos' },
          { id: 'liked', name: 'Liked' },
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
        <div className="card p-8 text-center text-dark-400">Loading gallery...</div>
      ) : displayPhotos.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📷</div>
          <h2 className="text-xl font-bold text-white mb-2">No photos yet</h2>
          <p className="text-dark-400 mb-6">
            Photos you and others share on your activities appear here.
          </p>
          <Link to="/create-activity" className="btn-primary inline-flex items-center gap-2">
            <FiCamera className="w-4 h-4" />
            Start an Activity
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayPhotos.map((photo) => (
            <button
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              className="aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-lime-500/20 to-electric-500/20 flex items-center justify-center text-5xl hover:ring-2 hover:ring-lime-500 transition-all group relative"
            >
              {photo.url ? (
                <img src={photo.url} alt={photo.activity} className="w-full h-full object-cover" />
              ) : (
                photo.emoji
              )}
              <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <div className="flex items-center gap-3 text-white text-sm">
                  <span className="flex items-center gap-1">
                    <FiHeart className={`w-3 h-3 ${liked[photo.id] ? 'fill-current text-pink-500' : ''}`} />
                    {liked[photo.id] ? 1 : 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiUsers className="w-3 h-3" />
                    {photo.participants}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-dark-900/95 flex items-center justify-center z-50 p-4">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-dark-800 rounded-full text-white hover:bg-dark-700"
          >
            <FiX className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full flex flex-col lg:flex-row gap-6">
            {/* Photo */}
            <div className="flex-1 aspect-square rounded-2xl bg-gradient-to-br from-lime-500/20 to-electric-500/20 flex items-center justify-center text-8xl overflow-hidden">
              {selectedPhoto.url ? (
                <img src={selectedPhoto.url} alt={selectedPhoto.activity} className="w-full h-full object-cover" />
              ) : (
                selectedPhoto.emoji
              )}
            </div>

            {/* Details */}
            <div className="lg:w-80">
              <div className="card p-6">
                <Link
                  to={`/activities/${selectedPhoto.activityId}`}
                  className="font-bold text-white text-lg hover:text-lime-400 transition-colors"
                >
                  {selectedPhoto.activity}
                </Link>
                <p className="text-sm text-dark-400 mb-4">{formatDate(selectedPhoto.date)}</p>

                {/* Actions */}
                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => toggleLike(selectedPhoto)}
                    className={`flex items-center gap-1 ${liked[selectedPhoto.id] ? 'text-pink-500' : 'text-dark-400 hover:text-pink-500'}`}
                  >
                    <FiHeart className={`w-5 h-5 ${liked[selectedPhoto.id] ? 'fill-current' : ''}`} />
                    <span>{liked[selectedPhoto.id] ? 1 : 0}</span>
                  </button>
                  <span className="flex items-center gap-1 text-dark-400">
                    <FiUsers className="w-5 h-5" />
                    {selectedPhoto.participants}/{selectedPhoto.maxParticipants} joined
                  </span>
                  <button
                    onClick={share}
                    className="flex items-center gap-1 text-dark-400 hover:text-lime-400"
                  >
                    <FiShare2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="border-t border-dark-700/50 pt-4">
                  <p className="text-sm text-dark-400">
                    {selectedPhoto.url
                      ? 'Photo shared on this activity.'
                      : 'No photo uploaded yet. Photos attached to your activities will show up here.'}
                  </p>
                  <Link
                    to={`/activities/${selectedPhoto.activityId}`}
                    className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <FiArrowLeft className="w-4 h-4 rotate-180" />
                    View Activity
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tiny note */}
      <p className="text-center text-xs text-dark-500 mt-8 flex items-center justify-center gap-1">
        <FiImage className="w-3 h-3" />
        Gallery shows every activity you've joined or created.
      </p>
    </div>
  );
};

export default GalleryPage;