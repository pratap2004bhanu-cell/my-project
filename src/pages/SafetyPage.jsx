import { useState, useEffect } from 'react';
import { 
  FiShield, FiAlertTriangle, FiUserX, FiFlag,
  FiCheck, FiX, FiChevronRight, FiPhone,
  FiMessageCircle, FiMail, FiHelpCircle, FiTrash2,
  FiPlus, FiLoader
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

  // Feature panels
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState('idle'); // idle | sent | verified | error
  const [verifyCode, setVerifyCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  const openBlocked = () => {
    document.getElementById('blocked-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [reportsOpen, setReportsOpen] = useState(false);
  const [myReportsList, setMyReportsList] = useState([]);

  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [emergencyForm, setEmergencyForm] = useState({ name: '', relation: '', phone: '', email: '' });
  const [emergencyBusy, setEmergencyBusy] = useState(false);
  const [emergencyError, setEmergencyError] = useState('');

  useEffect(() => {
    api.get('/api/users/me/blocked')
      .then((res) => setBlockedUsers(res.data.blocked || []))
      .catch(() => {});
    api.get('/api/reports/me')
      .then((res) => {
        setMyReports(res.data.reports?.length || 0);
        setMyReportsList(res.data.reports || []);
      })
      .catch(() => {});
    api.get('/api/users/me/connections')
      .then((res) => setReportConnections(res.data.connections || []))
      .catch(() => {});
    api.get('/api/users/me/emergency-contacts')
      .then((res) => setEmergencyContacts(res.data.contacts || []))
      .catch(() => {});
    api.get('/api/users/me/verification')
      .then((res) => setEmailConfigured(res.data.emailConfigured))
      .catch(() => {});
  }, []);

  // Safety score based on profile completion + verified email
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

  const sendVerification = async () => {
    setVerifyBusy(true);
    setVerifyError('');
    try {
      const res = await api.post('/api/users/me/verification/send');
      if (res.data.alreadyVerified) {
        setVerifyStatus('verified');
      } else {
        setDevCode(res.data.devCode || '');
        setEmailConfigured(res.data.emailConfigured);
        setVerifyStatus('sent');
      }
    } catch (e) {
      setVerifyError(e?.response?.data?.error || 'Failed to send verification code.');
    } finally {
      setVerifyBusy(false);
    }
  };

  const confirmVerification = async () => {
    if (!verifyCode.trim()) return;
    setVerifyBusy(true);
    setVerifyError('');
    try {
      const res = await api.post('/api/users/me/verification/confirm', { code: verifyCode.trim() });
      if (res.data.verified) setVerifyStatus('verified');
    } catch (e) {
      setVerifyError(e?.response?.data?.error || 'Verification failed.');
    } finally {
      setVerifyBusy(false);
    }
  };

  const closeVerify = () => {
    setVerifyOpen(false);
    setVerifyStatus('idle');
    setVerifyCode('');
    setDevCode('');
    setVerifyError('');
  };

  const handleAddEmergency = async () => {
    if (!emergencyForm.name.trim() || !emergencyForm.phone.trim()) {
      setEmergencyError('Name and phone are required');
      return;
    }
    setEmergencyBusy(true);
    setEmergencyError('');
    try {
      const res = await api.post('/api/users/me/emergency-contacts', emergencyForm);
      setEmergencyContacts(res.data.contacts || []);
      setEmergencyForm({ name: '', relation: '', phone: '', email: '' });
    } catch (e) {
      setEmergencyError(e?.response?.data?.error || 'Failed to add contact.');
    } finally {
      setEmergencyBusy(false);
    }
  };

  const handleRemoveEmergency = async (index) => {
    try {
      const res = await api.delete(`/api/users/me/emergency-contacts/${index}`);
      setEmergencyContacts(res.data.contacts || []);
    } catch (e) {
      setEmergencyError(e?.response?.data?.error || 'Failed to remove contact.');
    }
  };

  const reportTypeLabel = (t) => {
    const found = reportReasons.find((r) => r.id === t);
    return found ? found.label : t || 'Report';
  };

  const safetyFeatures = [
    {
      id: 'verify',
      title: 'Verify Your Profile',
      description: 'Add phone number and email to increase trust',
      icon: FiCheck,
      status: 'partial',
      color: 'text-amber-400',
      onClick: () => setVerifyOpen(true),
    },
    {
      id: 'block',
      title: 'Blocked Users',
      description: `${blockedUsers.length} users blocked`,
      icon: FiUserX,
      status: 'active',
      color: 'text-red-400',
      onClick: openBlocked,
    },
    {
      id: 'reports',
      title: 'My Reports',
      description: `${myReports} ${myReports === 1 ? 'report' : 'reports'} submitted`,
      icon: FiFlag,
      status: 'none',
      color: 'text-dark-400',
      onClick: () => setReportsOpen(true),
    },
    {
      id: 'emergency',
      title: 'Emergency Contacts',
      description: `${emergencyContacts.length} ${emergencyContacts.length === 1 ? 'contact' : 'contacts'} saved`,
      icon: FiPhone,
      status: 'none',
      color: 'text-dark-400',
      onClick: () => setEmergencyOpen(true),
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
            onClick={feature.onClick}
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
      <div id="blocked-section" className="card p-6 mb-6">
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

      {/* Emergency Contacts section is now managed via modal */}

      {/* Verify Modal */}
      {verifyOpen && (
        <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Verify Your Profile</h3>
              <button onClick={closeVerify} className="btn-icon">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            {verifyStatus === 'idle' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-amber-400/20 flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-8 h-8 text-amber-400" />
                </div>
                <h4 className="font-bold text-white text-lg mb-2">Add phone number and email to increase trust</h4>
                <p className="text-dark-400 mb-6">
                  We'll send a one-time code to <span className="text-white">{user?.email}</span> to confirm this account belongs to you.
                </p>
                <button
                  onClick={sendVerification}
                  disabled={verifyBusy}
                  className="btn-primary w-full"
                >
                  {verifyBusy ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}
            {verifyStatus === 'sent' && (
              <div className="py-2">
                <h4 className="font-bold text-white text-lg mb-2">Enter the code</h4>
                <p className="text-dark-400 mb-4">
                  We sent a 6-digit code to <span className="text-white">{user?.email}</span>. It expires in 10 minutes.
                </p>
                {!emailConfigured && devCode && (
                  <div className="mb-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl">
                    <p className="text-xs text-dark-400 mb-1">Email isn't configured on this build — use this code:</p>
                    <p className="text-2xl font-bold text-amber-300 tracking-widest">{devCode}</p>
                  </div>
                )}
                <input
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="••••••"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-xl text-white placeholder-dark-400 text-center text-2xl tracking-widest focus:outline-none focus:border-lime-500/50 mb-4"
                />
                {verifyError && <p className="text-red-400 text-sm mb-4">{verifyError}</p>}
                <div className="flex gap-3">
                  <button onClick={sendVerification} className="text-sm text-lime-400 hover:text-lime-300">
                    Resend code
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={confirmVerification}
                    disabled={verifyBusy || !verifyCode.trim()}
                    className="bg-lime-500 hover:bg-lime-600 text-dark-900 font-semibold py-2.5 px-6 rounded-xl transition-colors disabled:opacity-60"
                  >
                    {verifyBusy ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
              </div>
            )}
            {verifyStatus === 'verified' && (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h4 className="font-bold text-white text-lg mb-2">Profile verified</h4>
                <p className="text-dark-400 mb-6">Your profile is now verified. This boosts your safety score and trust with the community.</p>
                <button onClick={closeVerify} className="btn-primary w-full">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* My Reports Modal */}
      {reportsOpen && (
        <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">My Reports</h3>
              <button onClick={() => setReportsOpen(false)} className="btn-icon">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            {myReportsList.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {myReportsList.map((r) => (
                  <div key={r._id} className="p-3 bg-dark-800/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <RoundAvatar
                        name={r.reported?.name || 'User'}
                        src={r.reported?.avatar}
                        className="w-8 h-8"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white text-sm truncate">{r.reported?.name || 'Unknown user'}</p>
                        <p className="text-xs text-dark-400">{reportTypeLabel(r.type)}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        r.status === 'resolved' ? 'bg-lime-500/20 text-lime-400'
                        : r.status === 'reviewing' ? 'bg-amber-400/20 text-amber-300'
                        : 'bg-dark-700 text-dark-400'
                      }`}>
                        {r.status || 'pending'}
                      </span>
                    </div>
                    {r.details && <p className="text-sm text-dark-300 mt-2">{r.details}</p>}
                    <p className="text-xs text-dark-500 mt-1">
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiFlag className="w-10 h-10 text-dark-500 mx-auto mb-3" />
                <p className="text-dark-400">You haven't submitted any reports yet.</p>
                <p className="text-dark-500 text-sm mt-1">Use 'Report a User' above if you see something inappropriate.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emergency Contacts Modal */}
      {emergencyOpen && (
        <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Emergency Contacts</h3>
              <button onClick={() => setEmergencyOpen(false)} className="btn-icon">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <p className="text-dark-400 mb-4">
              Add trusted contacts who can be notified in case of emergency (up to 5)
            </p>

            {emergencyContacts.length > 0 && (
              <div className="space-y-3 mb-4">
                {emergencyContacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                    <div className="p-2 bg-lime-500/20 rounded-xl">
                      <FiPhone className="w-4 h-4 text-lime-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{c.name}</p>
                      <p className="text-xs text-dark-400 truncate">
                        {c.phone}{c.relation ? ` · ${c.relation}` : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveEmergency(i)}
                      className="text-red-400 hover:text-red-300"
                      aria-label={`Remove ${c.name}`}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {emergencyContacts.length >= 5 ? (
              <p className="text-sm text-dark-400 text-center py-4">Maximum 5 emergency contacts reached.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    value={emergencyForm.name}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, name: e.target.value })}
                    placeholder="Name"
                    className="input-field col-span-2"
                  />
                  <input
                    value={emergencyForm.relation}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, relation: e.target.value })}
                    placeholder="Relation (e.g. Mother)"
                    className="input-field"
                  />
                  <input
                    value={emergencyForm.phone}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, phone: e.target.value })}
                    placeholder="Phone number"
                    inputMode="tel"
                    className="input-field"
                  />
                  <input
                    value={emergencyForm.email}
                    onChange={(e) => setEmergencyForm({ ...emergencyForm, email: e.target.value })}
                    placeholder="Email (optional)"
                    className="input-field col-span-2"
                  />
                </div>
                {emergencyError && <p className="text-red-400 text-sm mb-3">{emergencyError}</p>}
                <button
                  onClick={handleAddEmergency}
                  disabled={emergencyBusy}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {emergencyBusy ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlus className="w-4 h-4" />}
                  Add Contact
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
                  value={reportTarget?._id || ''}
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