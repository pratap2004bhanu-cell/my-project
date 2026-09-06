import { useState, useEffect } from 'react';
import { 
  FiShield, FiAlertTriangle, FiUserX, FiFlag,
  FiCheck, FiX, FiChevronRight, FiPhone,
  FiMessageCircle, FiMail, FiHelpCircle
} from 'react-icons/fi';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { RoundAvatar } from '../components/common';

const SafetyPage = () => {
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [myReports, setMyReports] = useState(0);
  const [reportConnections, setReportConnections] = useState([]);

  useEffect(() => {
    api.get('/api/users/me/blocked')
      .then((res) => setBlockedUsers(res.data.blocked || []))
      .catch(() => {});
    api.get('/api/reports/me')
      .then((res) => setMyReports(res.data.reports?.length || 0))
      .catch(() => {});
    api.get('/api/users/me/connections')
      .then((res) => setReportConnections(res.data.connections || []))
      .catch(() => {});
  }, []);

  // Safety score based on profile completion
  const profileComplete = [
    user?.name,
    user?.email,
    user?.bio,
    user?.avatar,
    user?.interests && user.interests.length > 0,
    user?.location && user.location.address,
  ].filter(Boolean).length;
  const safetyScore = Math.min(100, Math.round((profileComplete / 6) * 100 + (myReports > 0 ? 5 : 0) + (blockedUsers.length > 0 ? 5 : 0)));
  const scoreLabel = safetyScore >= 90 ? 'Excellent' : safetyScore >= 70 ? 'Good' : safetyScore >= 50 ? 'Fair' : 'Needs work';
  const barColor = safetyScore >= 70 ? 'from-lime-500 to-emerald-500' : 'from-amber-500 to-orange-500';

  const reportReasons = [
    { id: 'spam', label: 'Spam or fake profile', icon: FiFlag },
    { id: 'harassment', label: 'Harassment or bullying', icon: FiAlertTriangle },
    { id: 'inappropriate', label: 'Inappropriate content', icon: FiAlertTriangle },
    { id: 'scam', label: 'Scam or fraud', icon: FiShield },
    { id: 'other', label: 'Other', icon: FiHelpCircle },
  ];

  const handleUnblock = async (userId) => {
    const prev = blockedUsers;
    setBlockedUsers(prev.filter((u) => u._id !== userId));
    try {
      await api.delete(`/api/users/${userId}/block`);
    } catch (e) {
      setBlockedUsers(prev);
    }
  };

  const handleSubmitReport = async () => {
    if (!reportType) return;
    setSubmitting(true);
    try {
      await api.post('/api/reports', { reported: reportTarget._id, type: reportType, details: reportDetails });
      setMyReports((n) => n + 1);
      setReportSubmitted(true);
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseReport = () => {
    setShowReportModal(false);
    setReportSubmitted(false);
    setReportDetails('');
    setReportType('');
    setReportTarget(null);
  };

  const [reportTarget, setReportTarget] = useState(null);

  const safetyFeatures = [
    {
      id: 'verify',
      title: 'Verify Your Profile',
      description: 'Add phone number and email to increase trust',
      icon: FiCheck,
      status: 'partial',
      color: 'text-amber-400',
    },
    {
      id: 'block',
      title: 'Blocked Users',
      description: `${blockedUsers.length} users blocked`,
      icon: FiUserX,
      status: 'active',
      color: 'text-red-400',
    },
    {
      id: 'reports',
      title: 'My Reports',
      description: `${myReports} ${myReports === 1 ? 'report' : 'reports'} submitted`,
      icon: FiFlag,
      status: 'none',
      color: 'text-dark-400',
    },
    {
      id: 'emergency',
      title: 'Emergency Contacts',
      description: 'Add trusted contacts for emergencies',
      icon: FiPhone,
      status: 'none',
      color: 'text-dark-400',
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-lime-500/20 rounded-xl">
            <FiShield className="w-6 h-6 text-lime-400" />
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
            Trust & Safety
          </h1>
        </div>
        <p className="text-dark-400">Your safety is our priority</p>
      </div>

      {/* Safety Status */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 flex items-center justify-center">
            <FiShield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Safety Score: {safetyScore}%</h2>
            <p className="text-dark-400">Status: {scoreLabel} · Complete your profile to increase trust</p>
          </div>
        </div>
        <div className="h-3 bg-dark-700 rounded-full overflow-hidden">
          <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-500`} style={{ width: `${safetyScore}%` }} />
        </div>
      </div>

      {/* Safety Features */}
      <div className="space-y-3 mb-8">
        {safetyFeatures.map((feature) => (
          <button
            key={feature.id}
            className="w-full card p-4 flex items-center gap-4 hover:bg-dark-800/50 transition-colors text-left"
          >
            <div className={`p-2 bg-dark-700/50 rounded-xl ${feature.color}`}>
              <feature.icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white">{feature.title}</h3>
              <p className="text-sm text-dark-400">{feature.description}</p>
            </div>
            <FiChevronRight className="w-5 h-5 text-dark-400" />
          </button>
        ))}
      </div>

      {/* Report User */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiFlag className="w-5 h-5 text-red-400" />
          Report a User
        </h2>
        <p className="text-dark-400 mb-4">
          Help us keep the community safe by reporting inappropriate behavior
        </p>
        <div className="space-y-2">
          {reportReasons.map((reason) => (
            <button
              key={reason.id}
              onClick={() => { setReportType(reason.id); setShowReportModal(true); }}
              className="w-full flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors text-left"
            >
              <reason.icon className="w-5 h-5 text-dark-400" />
              <span className="text-dark-200">{reason.label}</span>
              <FiChevronRight className="w-4 h-4 text-dark-400 ml-auto" />
            </button>
          ))}
        </div>
      </div>

      {/* Blocked Users */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiUserX className="w-5 h-5 text-red-400" />
          Blocked Users
        </h2>
        {blockedUsers.length > 0 ? (
          <div className="space-y-3">
            {blockedUsers.map((user) => (
              <div key={user._id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                <RoundAvatar
                  name={user.name}
                  src={user.avatar}
                  gradient="from-dark-700 to-dark-800"
                  className="w-10 h-10"
                />
                <div className="flex-1">
                  <h3 className="font-medium text-white">{user.name}</h3>
                  <p className="text-xs text-dark-400">Blocked</p>
                </div>
                <button
                  onClick={() => handleUnblock(user._id)}
                  className="text-sm text-lime-400 hover:text-lime-300"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-dark-400 text-center py-4">No blocked users</p>
        )}
      </div>

      {/* Emergency Contacts */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiPhone className="w-5 h-5 text-lime-400" />
          Emergency Contacts
        </h2>
        <p className="text-dark-400 mb-4">
          Add trusted contacts who can be notified in case of emergency
        </p>
        <button className="btn-primary w-full">
          Add Emergency Contact
        </button>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Report User</h3>
              <button onClick={handleCloseReport} className="btn-icon">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            {reportSubmitted ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h4 className="font-bold text-white text-lg mb-2">Report submitted</h4>
                <p className="text-dark-400 mb-6">Our team will review it shortly.</p>
                <button onClick={handleCloseReport} className="btn-primary w-full">
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-dark-400 mb-4">
                  Reporting{reportTarget ? ` ${reportTarget.name}` : ''} for "{reportType}". Please provide more details about the issue.
                </p>
                <label className="block text-sm font-medium text-dark-300 mb-2">Who are you reporting?</label>
                <select
                  value={reportTarget?.id || ''}
                  onChange={(e) => {
                    const found = reportConnections.find((c) => c._id === e.target.value);
                    setReportTarget(found || null);
                  }}
                  className="input-field mb-4"
                >
                  <option value="">Select a connection...</option>
                  {reportConnections.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full h-32 p-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-red-500/50 resize-none"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCloseReport}
                    className="flex-1 btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitReport}
                    disabled={submitting || !reportTarget}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyPage;