import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiUser, FiBell, FiShield, FiLock, FiGlobe,
  FiMoon, FiSun, FiMapPin, FiMail, FiPhone,
  FiChevronRight, FiLogOut, FiTrash2, FiHelpCircle,
  FiDownload, FiSmartphone, FiEye, FiEyeOff
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const SettingsPage = () => {
  const { user, logout, updateUser, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('account');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const accountSettings = [
    { 
      id: 'profile', 
      label: 'Edit Profile', 
      icon: FiUser, 
      description: 'Update your name, photo, bio',
      link: '/profile/edit'
    },
    { 
      id: 'email', 
      label: 'Email', 
      icon: FiMail, 
      description: user?.email || '—',
      link: null
    },
    { 
      id: 'phone', 
      label: 'Phone', 
      icon: FiPhone, 
      description: 'Not set',
      link: null
    },
    { 
      id: 'location', 
      label: 'Location', 
      icon: FiMapPin, 
      description: typeof user?.location === 'string'
        ? user.location
        : (user?.location?.address || 'Not set'),
      link: '/profile/edit'
    },
  ];

  const securitySettings = [
    { id: 'password', label: 'Change Password', icon: FiLock, link: null },
    { id: '2fa', label: 'Two-Factor Auth', icon: FiShield, link: null, status: 'enabled' },
    { id: 'sessions', label: 'Active Sessions', icon: FiSmartphone, link: null },
  ];

  const helpSettings = [
    { id: 'help', label: 'Help Center', icon: FiHelpCircle, link: '#' },
    { id: 'export', label: 'Export Data', icon: FiDownload, link: '#' },
    { id: 'terms', label: 'Terms of Service', icon: FiGlobe, link: '#' },
    { id: 'privacy', label: 'Privacy Policy', icon: FiShield, link: '#' },
  ];

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
                    <Link
                      key={item.id}
                      to={item.link || '#'}
                      className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors"
                    >
                      <div className="p-2 bg-dark-700/50 rounded-lg">
                        <item.icon className="w-5 h-5 text-dark-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{item.label}</h3>
                        <p className="text-sm text-dark-400">{item.description}</p>
                      </div>
                      <FiChevronRight className="w-5 h-5 text-dark-400" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Security</h2>
                <div className="space-y-2">
                  {securitySettings.map((item) => (
                    <Link
                      key={item.id}
                      to={item.link || '#'}
                      className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors"
                    >
                      <div className="p-2 bg-dark-700/50 rounded-lg">
                        <item.icon className="w-5 h-5 text-dark-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">{item.label}</h3>
                      </div>
                      {item.status && (
                        <span className="px-2 py-1 bg-lime-500/20 text-lime-400 rounded-lg text-xs font-medium">
                          {item.status}
                        </span>
                      )}
                      <FiChevronRight className="w-5 h-5 text-dark-400" />
                    </Link>
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
                        <button
                          onClick={() => toggleSetting('notifications', item.key)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings.notifications[item.key] ? 'bg-lime-500' : 'bg-dark-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${
                            settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
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
                        <button
                          onClick={() => toggleSetting('notifications', item.key)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            settings.notifications[item.key] ? 'bg-lime-500' : 'bg-dark-600'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${
                            settings.notifications[item.key] ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </button>
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
                    <button
                      onClick={() => toggleSetting('privacy', 'showLocation')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.privacy.showLocation ? 'bg-lime-500' : 'bg-dark-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${
                        settings.privacy.showLocation ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-dark-800/50 rounded-xl">
                    <div>
                      <span className="text-white">Show Online Status</span>
                      <p className="text-sm text-dark-400">Let others see when you're online</p>
                    </div>
                    <button
                      onClick={() => toggleSetting('privacy', 'showOnlineStatus')}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        settings.privacy.showOnlineStatus ? 'bg-lime-500' : 'bg-dark-600'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${
                        settings.privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-0'
                      }`} />
                    </button>
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
                  <button
                    onClick={() => toggleSetting('preferences', 'autoJoin')}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.preferences.autoJoin ? 'bg-lime-500' : 'bg-dark-600'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform mx-0.5 ${
                      settings.preferences.autoJoin ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
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
                  <Link
                    key={item.id}
                    to={item.link}
                    className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl hover:bg-dark-700/50 transition-colors"
                  >
                    <div className="p-2 bg-dark-700/50 rounded-lg">
                      <item.icon className="w-5 h-5 text-dark-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.label}</h3>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-dark-400" />
                  </Link>
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
    </div>
  );
};

export default SettingsPage;