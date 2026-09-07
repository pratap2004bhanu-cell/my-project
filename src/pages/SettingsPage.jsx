import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiUser, FiBell, FiShield, FiLock, FiGlobe,
  FiMoon, FiSun, FiMapPin, FiMail, FiPhone,
  FiChevronRight, FiLogOut, FiTrash2, FiHelpCircle,
  FiDownload, FiSmartphone, FiEye, FiEyeOff, FiX
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { user, logout, updateUser, deleteAccount, changePassword, get2FA, send2FACode, confirm2FA, getDevices, revokeDevice, exportData } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Phone editor
  const [showPhone, setShowPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(user?.phone || '');
  const [savingPhone, setSavingPhone] = useState(false);

  // Change password
  const [showPassword, setShowPassword] = useState(false);
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [showPwdFields, setShowPwdFields] = useState({ current: false, next: false, confirm: false });
  const [pwdMsg, setPwdMsg] = useState(null);
  const [savingPwd, setSavingPwd] = useState(false);

  // Two-factor auth
  const [show2FA, setShow2FA] = useState(false);
  const [twoFA, setTwoFA] = useState({ enabled: false, sending: false, confirming: false, code: '', devCode: null, error: null, info: null, action: 'enable' });

  // Active sessions
  const [showSessions, setShowSessions] = useState(false);
  const [sessions, setSessions] = useState({ loading: false, list: null, error: null, info: null });

  const [settings, setSettings] = useState({
    notifications: {
      email: user?.notifications?.email ?? true,
      push: user?.notifications?.push ?? true,
      sms: user?.notifications?.sms ?? false,
      activityUpdates: user?.notifications?.activityUpdates ?? true,
      connectionRequests: user?.notifications?.connectionRequests ?? true,
      messages: user?.notifications?.messages ?? true,
      reminders: user?.notifications?.reminders ?? true,
    },
    privacy: {
      profileVisibility: user?.privacy?.profileVisibility || 'everyone',
      showLocation: user?.privacy?.showLocation ?? true,
      showOnlineStatus: user?.privacy?.showOnlineStatus ?? true,
      allowMessages: user?.privacy?.allowMessages || 'everyone',
    },
    preferences: {
      language: user?.preferences?.language || 'en',
      theme: user?.preferences?.theme || 'dark',
      distanceUnit: user?.preferences?.distanceUnit || 'km',
      autoJoin: user?.preferences?.autoJoin ?? false,
    },
  });

  const persist = async (section, next) => {
    setSettings({ ...settings, [section]: next });
    await updateUser({ [section]: next });
  };

  const toggleSetting = (section, key) => {
    persist(section, { ...settings[section], [key]: !settings[section][key] });
  };

  const setSectionValue = (section, key, value) => {
    persist(section, { ...settings[section], [key]: value });
  };

  const savePhone = async () => {
    setSavingPhone(true);
    const res = await updateUser({ phone: phoneValue.trim() });
    setSavingPhone(false);
    if (res.success) setShowPhone(false);
    else alert(res.error || 'Could not save phone number');
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwd.next !== pwd.confirm) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setSavingPwd(true);
    const res = await changePassword(pwd.current, pwd.next);
    setSavingPwd(false);
    if (res.success) {
      setPwdMsg({ type: 'success', text: 'Password updated successfully' });
      setPwd({ current: '', next: '', confirm: '' });
      setShowPassword(false);
    } else {
      setPwdMsg({ type: 'error', text: res.error });
    }
  };

  const open2FA = async () => {
    setShow2FA(true);
    setTwoFA({ enabled: !!user?.twoFactorEnabled, sending: false, confirming: false, code: '', devCode: null, error: null, info: null, action: !user?.twoFactorEnabled ? 'enable' : 'disable' });
    const res = await get2FA();
    if (res.success) {
      setTwoFA((s) => ({ ...s, enabled: res.enabled, action: !res.enabled ? 'enable' : 'disable' }));
    }
  };

  const sendTwoFACode = async (action) => {
    setTwoFA((s) => ({ ...s, sending: true, error: null, info: null, devCode: null, code: '', action }));
    const res = await send2FACode(action);
    setTwoFA((s) => ({ ...s, sending: false }));
    if (res.success) {
      setTwoFA((s) => ({
        ...s,
        info: res.emailed
          ? `Code sent to ${user?.email}`
          : 'Email is not configured, so use the dev code shown below.',
        devCode: res.devCode || null,
        action,
      }));
    } else {
      setTwoFA((s) => ({ ...s, error: res.error }));
    }
  };

  const confirmTwoFA = async () => {
    setTwoFA((s) => ({ ...s, confirming: true, error: null }));
    const res = await confirm2FA(twoFA.action, twoFA.code);
    setTwoFA((s) => ({ ...s, confirming: false }));
    if (res.success) {
      setTwoFA((s) => ({
        ...s,
        enabled: res.enabled,
        devCode: null,
        info: res.enabled ? 'Two-factor authentication is now ON.' : 'Two-factor authentication is now OFF.',
      }));
    } else {
      setTwoFA((s) => ({ ...s, error: res.error }));
    }
  };

  const openSessions = async () => {
    setShowSessions(true);
    setSessions((s) => ({ ...s, loading: true, error: null }));
    const res = await getDevices();
    if (res.success) setSessions({ loading: false, list: res.devices, error: null, info: null });
    else setSessions({ loading: false, list: null, error: res.error, info: null });
  };

  const revoke = async (deviceId, isCurrent) => {
    if (!window.confirm(isCurrent ? 'This will sign out this device. Continue?' : 'Revoke this session?')) return;
    setSessions((s) => ({ ...s, loading: true, error: null }));
    const res = await revokeDevice(deviceId);
    if (res.success) setSessions({ loading: false, list: res.devices, error: null, info: 'Session revoked.' });
    else setSessions((s) => ({ ...s, loading: false, error: res.error }));
  };

  const exportMyData = async () => {
    const res = await exportData();
    if (!res.success) {
      alert(res.error || 'Could not export data');
      return;
    }
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kiky-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  };

  const accountSettings = [
    {
      id: 'profile',
      label: 'Edit Profile',
      icon: FiUser,
      description: 'Update your name, photo, bio',
      link: '/profile/edit',
    },
    {
      id: 'email',
      label: 'Email',
      icon: FiMail,
      description: user?.email || '—',
      link: null,
    },
    {
      id: 'phone',
      label: 'Phone',
      icon: FiPhone,
      description: user?.phone || 'Not set',
      onClick: () => { setPhoneValue(user?.phone || ''); setShowPhone(true); },
    },
    {
      id: 'location',
      label: 'Location',
      icon: FiMapPin,
      description: typeof user?.location === 'string'
        ? user.location
        : (user?.location?.address || 'Not set'),
      link: '/profile/edit',
    },
  ];

  const securitySettings = [
    {
      id: 'password',
      label: 'Change Password',
      icon: FiLock,
      onClick: () => { setPwd({ current: '', next: '', confirm: '' }); setPwdMsg(null); setShowPassword(true); },
    },
    {
      id: '2fa',
      label: 'Two-Factor Auth',
      icon: FiShield,
      onClick: open2FA,
      status: user?.twoFactorEnabled ? 'enabled' : 'off',
      statusClass: user?.twoFactorEnabled ? 'bg-lime-500/20 text-lime-400' : 'bg-dark-600 text-dark-400',
    },
    {
      id: 'sessions',
      label: 'Active Sessions',
      icon: FiSmartphone,
      onClick: openSessions,
    },
  ];

  const helpSettings = [
    { id: 'help', label: 'Help Center', icon: FiHelpCircle, link: '/help' },
    { id: 'export', label: 'Export Data', icon: FiDownload, onClick: exportMyData },
    { id: 'terms', label: 'Terms of Service', icon: FiGlobe, link: '/terms' },
    { id: 'privacy', label: 'Privacy Policy', icon: FiShield, link: '/privacy-policy' },
  ];

  const renderListStyles = 'flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors';

  const ListWrapper = ({ item }) => {
    if (item.onClick) {
      return <button onClick={item.onClick} className={`${renderListStyles} text-left w-full`}>{item.children}</button>;
    }
    if (item.link) {
      return <Link to={item.link} className={renderListStyles}>{item.children}</Link>;
    }
    return <div className={renderListStyles}>{item.children}</div>;
  };

  const ListBody = ({ item }) => (
    <>
      <div className="p-2 bg-dark-700/50 rounded-lg">
        <item.icon className="w-5 h-5 text-dark-400" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-white">{item.label}</h3>
        {item.description && <p className="text-sm text-dark-400">{item.description}</p>}
      </div>
      {item.status && (
        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${item.statusClass || 'bg-lime-500/20 text-lime-400'}`}>
          {item.status}
        </span>
      )}
      <FiChevronRight className="w-5 h-5 text-dark-400" />
    </>
  );

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">
          Settings
        </h1>
        <p className="text-dark-400">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {[
              { id: 'account', label: 'Account', icon: FiUser },
              { id: 'notifications', label: 'Notifications', icon: FiBell },
              { id: 'privacy', label: 'Privacy & Safety', icon: FiShield },
              { id: 'preferences', label: 'Preferences', icon: FiGlobe },
              { id: 'help', label: 'Help & Support', icon: FiHelpCircle },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeSection === item.id
                    ? 'bg-lime-500/10 text-lime-400 border-l-2 border-lime-500'
                    : 'text-dark-300 hover:bg-dark-800/50 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Account Section */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Account Settings</h2>
                <div className="space-y-2">
                  {accountSettings.map((item) => (
                    <ListWrapper key={item.id} item={item}>
                      <ListBody item={item} />
                    </ListWrapper>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Security</h2>
                <div className="space-y-2">
                  {securitySettings.map((item) => (
                    <ListWrapper key={item.id} item={item}>
                      <ListBody item={item} />
                    </ListWrapper>
                  ))}
                </div>
              </div>

              <div className="card p-6 border-red-500/30">
                <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
                <div className="space-y-3">
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors text-left"
                  >
                    <div className="p-2 bg-dark-700/50 rounded-lg">
                      <FiLogOut className="w-5 h-5 text-dark-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">Log Out</h3>
                      <p className="text-sm text-dark-400">Sign out of your account</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-red-500/10 transition-colors text-left"
                  >
                    <div className="p-2 bg-dark-700/50 rounded-lg">
                      <FiTrash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-red-400">Delete Account</h3>
                      <p className="text-sm text-dark-400">Permanently delete your account and data</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Section */}
          {activeSection === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-6">Notification Preferences</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-white mb-4">Channels</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'email', label: 'Email Notifications', icon: FiMail },
                      { key: 'push', label: 'Push Notifications', icon: FiBell },
                      { key: 'sms', label: 'SMS Notifications', icon: FiSmartphone },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-dark-400" />
                          <span className="text-white">{item.label}</span>
                        </div>
                        <Toggle checked={settings.notifications[item.key]} onChange={() => toggleSetting('notifications', item.key)} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-white mb-4">Types</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'activityUpdates', label: 'Activity Updates' },
                      { key: 'connectionRequests', label: 'Connection Requests' },
                      { key: 'messages', label: 'New Messages' },
                      { key: 'reminders', label: 'Activity Reminders' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl">
                        <span className="text-white">{item.label}</span>
                        <Toggle checked={settings.notifications[item.key]} onChange={() => toggleSetting('notifications', item.key)} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Section */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Privacy Settings</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-dark-800/50 rounded-xl">
                    <label className="block text-white mb-2">Profile Visibility</label>
                    <select
                      value={settings.privacy.profileVisibility}
                      onChange={(e) => setSectionValue('privacy', 'profileVisibility', e.target.value)}
                      className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="connections">Connections Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl">
                    <div>
                      <span className="text-white">Show Location</span>
                      <p className="text-sm text-dark-400">Display your approximate location</p>
                    </div>
                    <Toggle checked={settings.privacy.showLocation} onChange={() => toggleSetting('privacy', 'showLocation')} />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl">
                    <div>
                      <span className="text-white">Show Online Status</span>
                      <p className="text-sm text-dark-400">Let others see when you're online</p>
                    </div>
                    <Toggle checked={settings.privacy.showOnlineStatus} onChange={() => toggleSetting('privacy', 'showOnlineStatus')} />
                  </div>

                  <div className="p-4 bg-dark-800/50 rounded-xl">
                    <label className="block text-white mb-2">Who can message you?</label>
                    <select
                      value={settings.privacy.allowMessages}
                      onChange={(e) => setSectionValue('privacy', 'allowMessages', e.target.value)}
                      className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="connections">Connections Only</option>
                      <option value="nobody">No One</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  <FiShield className="w-5 h-5 inline mr-2 text-lime-400" />
                  Safety Features
                </h2>
                <Link to="/safety" className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors">
                  <span className="text-white">Trust & Safety Center</span>
                  <FiChevronRight className="w-5 h-5 text-dark-400" />
                </Link>
              </div>
            </div>
          )}

          {/* Preferences Section */}
          {activeSection === 'preferences' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-6">App Preferences</h2>
              <div className="space-y-4">
                <div className="p-4 bg-dark-800/50 rounded-xl">
                  <label className="block text-white mb-2">Language</label>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => setSectionValue('preferences', 'language', e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-lime-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="kn">Kannada</option>
                    <option value="ta">Tamil</option>
                    <option value="te">Telugu</option>
                  </select>
                </div>

                <div className="p-4 bg-dark-800/50 rounded-xl">
                  <label className="block text-white mb-2">Theme</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSectionValue('preferences', 'theme', 'dark')}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${
                        settings.preferences.theme === 'dark' ? 'bg-lime-500 text-dark-900' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      }`}
                    >
                      <FiMoon className="w-4 h-4" />
                      Dark
                    </button>
                    <button
                      onClick={() => setSectionValue('preferences', 'theme', 'light')}
                      className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl font-medium transition-all ${
                        settings.preferences.theme === 'light' ? 'bg-lime-500 text-dark-900' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      }`}
                    >
                      <FiSun className="w-4 h-4" />
                      Light
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-dark-800/50 rounded-xl">
                  <label className="block text-white mb-2">Distance Unit</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSectionValue('preferences', 'distanceUnit', 'km')}
                      className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                        settings.preferences.distanceUnit === 'km' ? 'bg-lime-500 text-dark-900' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      }`}
                    >
                      Kilometers
                    </button>
                    <button
                      onClick={() => setSectionValue('preferences', 'distanceUnit', 'mi')}
                      className={`flex-1 p-3 rounded-xl font-medium transition-all ${
                        settings.preferences.distanceUnit === 'mi' ? 'bg-lime-500 text-dark-900' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                      }`}
                    >
                      Miles
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl">
                  <div>
                    <span className="text-white">Auto-join Nearby Activities</span>
                    <p className="text-sm text-dark-400">Automatically join activities near you</p>
                  </div>
                  <Toggle checked={settings.preferences.autoJoin} onChange={() => toggleSetting('preferences', 'autoJoin')} />
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          {activeSection === 'help' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Help & Support</h2>
              <div className="space-y-2">
                {helpSettings.map((item) => (
                  <ListWrapper key={item.id} item={item}>
                    <ListBody item={item} />
                  </ListWrapper>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiTrash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Account?</h3>
              <p className="text-dark-400">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-outline"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleting(true);
                  const res = await deleteAccount();
                  setDeleting(false);
                  if (res?.success) {
                    navigate('/');
                  } else {
                    setShowDeleteConfirm(false);
                    alert(res?.error || 'Could not delete account');
                  }
                }}
                disabled={deleting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone Modal */}
      {showPhone && (
        <Modal onClose={() => setShowPhone(false)} title="Phone Number" icon={FiPhone}>
          <p className="text-sm text-dark-400 mb-4">Used for SMS notifications and emergency contact.</p>
          <input
            type="tel"
            value={phoneValue}
            onChange={(e) => setPhoneValue(e.target.value)}
            placeholder="+91 98765 43210"
            className="input-field mb-5"
          />
          <div className="flex gap-3">
            <button onClick={savePhone} disabled={savingPhone} className="flex-1 btn-primary justify-center disabled:opacity-60">
              {savingPhone ? 'Saving...' : 'Save Phone'}
            </button>
            <button onClick={() => setShowPhone(false)} className="btn-outline">Cancel</button>
          </div>
        </Modal>
      )}

      {/* Change Password Modal */}
      {showPassword && (
        <Modal onClose={() => setShowPassword(false)} title="Change Password" icon={FiLock}>
          <form onSubmit={submitPassword} className="space-y-4">
            <PasswordField
              label="Current Password"
              value={pwd.current}
              onChange={(v) => setPwd({ ...pwd, current: v })}
              show={showPwdFields.current}
              toggleShow={() => setShowPwdFields({ ...showPwdFields, current: !showPwdFields.current })}
            />
            <PasswordField
              label="New Password"
              value={pwd.next}
              onChange={(v) => setPwd({ ...pwd, next: v })}
              show={showPwdFields.next}
              toggleShow={() => setShowPwdFields({ ...showPwdFields, next: !showPwdFields.next })}
            />
            <PasswordField
              label="Confirm New Password"
              value={pwd.confirm}
              onChange={(v) => setPwd({ ...pwd, confirm: v })}
              show={showPwdFields.confirm}
              toggleShow={() => setShowPwdFields({ ...showPwdFields, confirm: !showPwdFields.confirm })}
            />
            {pwdMsg && (
              <p className={`text-sm ${pwdMsg.type === 'success' ? 'text-lime-400' : 'text-red-400'}`}>{pwdMsg.text}</p>
            )}
            <button type="submit" disabled={savingPwd} className="w-full btn-primary justify-center disabled:opacity-60">
              {savingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </Modal>
      )}

      {/* 2FA Modal */}
      {show2FA && (
        <Modal onClose={() => setShow2FA(false)} title="Two-Factor Auth" icon={FiShield}>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 text-sm ${twoFA.enabled ? 'bg-lime-500/10 text-lime-400' : 'bg-dark-700/50 text-dark-400'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${twoFA.enabled ? 'bg-lime-500' : 'bg-dark-500'}`}></span>
            {twoFA.enabled ? 'Two-factor auth is ON' : 'Two-factor auth is OFF'}
          </div>

          {!twoFA.devCode && (
            <p className="text-sm text-dark-400 mb-4">
              {twoFA.enabled
                ? 'Disabling requires a code emailed to your address. After disabling, only your password will be needed to sign in.'
                : 'Enabling adds an email code step to every sign-in. A code will be sent to your email to confirm.'}
            </p>
          )}

          <div className="space-y-4">
            {!!twoFA.devCode && (
              <div className="bg-lime-500/10 border border-lime-500/30 text-lime-300 px-4 py-3 rounded-xl text-sm">
                Code sent{twoFA.devCode && (
                  <span className="block mt-2 font-mono text-lg tracking-widest text-white">{twoFA.devCode}</span>
                )}
              </div>
            )}
            {twoFA.info && <p className="text-sm text-dark-300">{twoFA.info}</p>}
            {twoFA.error && <p className="text-sm text-red-400">{twoFA.error}</p>}

            {!twoFA.devCode ? (
              <button
                onClick={() => sendTwoFACode(twoFA.action)}
                disabled={twoFA.sending}
                className="w-full btn-primary justify-center disabled:opacity-60"
              >
                {twoFA.sending ? 'Sending...' : twoFA.enabled ? 'Send Code to Disable' : 'Send Code to Enable'}
              </button>
            ) : (
              <>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFA.code}
                  onChange={(e) => setTwoFA({ ...twoFA, code: e.target.value.replace(/\D/g, '') })}
                  placeholder="6-digit code"
                  className="input-field text-center font-mono tracking-widest"
                />
                <button
                  onClick={confirmTwoFA}
                  disabled={twoFA.confirming || twoFA.code.length < 6}
                  className="w-full btn-primary justify-center disabled:opacity-60"
                >
                  {twoFA.confirming ? 'Verifying...' : twoFA.enabled ? 'Turn OFF 2FA' : 'Turn ON 2FA'}
                </button>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Active Sessions Modal */}
      {showSessions && (
        <Modal onClose={() => setShowSessions(false)} title="Active Sessions" icon={FiSmartphone}>
          {sessions.loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : sessions.error ? (
            <p className="text-sm text-red-400">{sessions.error}</p>
          ) : sessions.list?.length === 0 ? (
            <p className="text-sm text-dark-400">No active sessions found.</p>
          ) : (
            <div className="space-y-3">
              {sessions.info && <p className="text-sm text-lime-400">{sessions.info}</p>}
              {sessions.list.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl">
                  <div className="p-2 bg-dark-700/50 rounded-lg">
                    <FiSmartphone className="w-4 h-4 text-dark-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white text-sm truncate">{d.name}</h4>
                      {d.current && <span className="px-1.5 py-0.5 bg-lime-500/20 text-lime-400 rounded text-xs font-medium">This device</span>}
                    </div>
                    <p className="text-xs text-dark-400">
                      Last active {new Date(d.lastActive).toLocaleString()}
                    </p>
                  </div>
                  {!d.current && (
                    <button
                      onClick={() => revoke(d.id, false)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium shrink-0"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full transition-colors ${checked ? 'bg-lime-500' : 'bg-dark-600'}`}
  >
    <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${
      checked ? 'translate-x-6' : 'translate-x-0'
    }`} />
  </button>
);

const Modal = ({ onClose, children, title, icon: Icon }) => (
  <div className="fixed inset-0 bg-dark-900/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="card max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-dark-700/50 rounded-lg"><Icon className="w-5 h-5 text-lime-400" /></div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-dark-700/50 text-dark-400 hover:text-white transition-colors">
          <FiX className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const PasswordField = ({ label, value, onChange, show, toggleShow }) => (
  <div>
    <label className="block text-white mb-2">{label}</label>
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="input-field pr-12"
      />
      <button
        type="button"
        onClick={toggleShow}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
      >
        {show ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
      </button>
    </div>
  </div>
);

export default SettingsPage;