import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiStar, FiCheck, FiArrowRight, FiCalendar,
  FiMapPin, FiUsers, FiMessageSquare
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const userIdOf = (u) => (u && typeof u === 'object' ? u._id || u.id : u);

const FeedbackPage = () => {
  const { user: me } = useAuth();
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [ratings, setRatings] = useState({});
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/api/activities');
      const mine = (res.data.activities || []).filter((a) =>
        a.status === 'completed' &&
        (a.isCreator || (a.participants || []).some((p) => String(userIdOf(p.user)) === String(me?.id)))
      );
      const pending = mine
        .filter((a) => !(a.feedback || []).some((f) => String(userIdOf(f.user)) === String(me?.id)))
        .map((a) => ({
          id: a._id,
          title: a.title,
          emoji: a.emoji || '🎯',
          date: a.date ? new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '',
          location: a.location?.address || 'Location TBA',
          host: a.creator?.name || 'Host',
          participants: (a.participants || [])
            .filter((p) => p.status !== 'left')
            .map((p) => ({ id: String(userIdOf(p.user)), name: p.user?.name || 'Member' })),
        }));
      setPendingFeedback(pending);
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRating = (key, rating) => {
    setRatings({ ...ratings, [key]: rating });
  };

  const handleSubmit = async () => {
    if (!selectedActivity || !ratings['overall']) return;
    setSaving(true);
    try {
      const jobs = [
        api.post(`/api/activities/${selectedActivity.id}/feedback`, {
          rating: ratings['overall'],
          comment: feedback.trim(),
        }),
        ...Object.entries(ratings)
          .filter(([key]) => key !== 'overall')
          .map(([rid, r]) =>
            api.post(`/api/users/${rid}/rate`, { rating: r, activity: selectedActivity.id })
          ),
      ];
      const results = await Promise.allSettled(jobs);
      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        alert('Some ratings could not be saved (possibly already rated).');
      } else {
        setSubmitted(true);
      }
      await load();
      setTimeout(() => {
        setSelectedActivity(null);
        setSubmitted(false);
        setRatings({});
        setFeedback('');
      }, 2000);
    } catch (err) {
      alert(err?.response?.data?.error || 'Could not submit feedback');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Rate Your Experience
        </h1>
        <p className="text-dark-400">Help others by sharing your feedback</p>
      </div>

      {!selectedActivity ? (
        loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
        <div className="space-y-4">
          {pendingFeedback.length > 0 ? (
            pendingFeedback.map((activity) => (
              <button
                key={activity.id}
                onClick={() => setSelectedActivity(activity)}
                className="w-full card-glow flex items-center gap-4 p-4 text-left"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center text-3xl">
                  {activity.emoji}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-white">{activity.title}</h3>
                  <p className="text-sm text-dark-400 flex items-center gap-2">
                    <FiCalendar className="w-3 h-3" />
                    {activity.date}
                    <span>•</span>
                    <FiMapPin className="w-3 h-3" />
                    {activity.location}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <FiStar key={i} className="w-4 h-4" />
                  ))}
                </div>
                <FiArrowRight className="w-5 h-5 text-dark-400" />
              </button>
            ))
          ) : (
            <div className="text-center py-16">
              <span className="text-6xl mb-4 block">✅</span>
              <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
              <p className="text-dark-400 mb-6">No pending feedback to submit</p>
              <Link to="/history" className="btn-primary inline-flex items-center gap-2">
                View History <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
        )
      ) : (
        <div className="animate-slide-up">
          {submitted ? (
            <div className="card p-8 text-center">
              <div className="w-20 h-20 bg-lime-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiCheck className="w-10 h-10 text-dark-900" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
              <p className="text-dark-400">Your feedback has been submitted</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Activity Info */}
              <div className="card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-lime-500/20 to-electric-500/20 rounded-2xl flex items-center justify-center text-4xl">
                    {selectedActivity.emoji}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedActivity.title}</h2>
                    <p className="text-dark-400">{selectedActivity.date} • {selectedActivity.location}</p>
                  </div>
                </div>
              </div>

              {/* Overall Rating */}
              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">Overall Experience</h3>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => handleRating('overall', star)}
                      className="transition-transform hover:scale-110"
                    >
                      <FiStar 
                        className={`w-10 h-10 ${
                          (ratings['overall'] || 0) >= star 
                            ? 'text-amber-400 fill-current' 
                            : 'text-dark-600'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
                <p className="text-center text-dark-400">
                  {ratings['overall'] ? 
                    ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratings['overall'] - 1] :
                    'Tap to rate'
                  }
                </p>
              </div>

              {/* Rate Participants */}
              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4">Rate Participants</h3>
                <div className="space-y-4">
                  {selectedActivity.participants.filter(p => p.id !== me?.id).map((person) => (
                    <div key={person.id} className="flex items-center gap-4 p-3 bg-dark-800/50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-white font-bold">
                        {person.name.charAt(0)}
                      </div>
                      <span className="flex-1 text-white">{person.name}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRating(person.id, star)}
                          >
                            <FiStar 
                              className={`w-5 h-5 ${
                                (ratings[person.id] || 0) >= star 
                                  ? 'text-amber-400 fill-current' 
                                  : 'text-dark-600'
                              }`} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Written Feedback */}
              <div className="card p-6">
                <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                  <FiMessageSquare className="w-5 h-5 text-lime-400" />
                  Additional Comments
                </h3>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full h-32 p-4 bg-dark-800/50 border border-dark-700/50 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-lime-500/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="flex-1 btn-outline"
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!ratings['overall'] || saving}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;