import { Link } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';

const sections = [
  {
    h: 'What we collect',
    p: 'We collect the information you give us: your name, email, phone number (if provided), bio, interests, photos, location, and activity history. We also collect device and connection details (such as your active sessions) to keep your account secure.',
  },
  {
    h: 'How we use it',
    p: 'Your data powers core features: finding nearby activities, matching you with people, messaging, activity reminders, and keeping your account safe. We use your email to send security codes for verification and two-factor authentication.',
  },
  {
    h: 'Location',
    p: 'Your approximate location is used to show you nearby people and activities. You can control whether others can see your location or online status in Settings → Privacy & Safety.',
  },
  {
    h: 'Sharing & visibility',
    p: 'Your profile visibility is controlled in Settings → Privacy & Safety (Everyone, Connections Only, or Private). We do not sell your personal information to third parties.',
  },
  {
    h: 'Security',
    p: 'Passwords are stored hashed, and OTP codes expire quickly. You can add two-factor authentication, review your active sessions, and revoke any device from Settings → Security.',
  },
  {
    h: 'Your data & export',
    p: 'You can download a copy of your data at any time from Settings → Help & Support → Export Data. Deleting your account (Settings → Account) permanently removes your profile and data.',
  },
];

const PrivacyPage = () => {
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-dark-400 hover:text-white transition-colors mb-4">
        <FiChevronLeft className="w-4 h-4" /> Back to Settings
      </Link>

      <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-dark-400 mb-8">Last updated: September 2026</p>

      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.h}>
            <h2 className="text-lg font-semibold text-white mb-2">{s.h}</h2>
            <p className="text-sm text-dark-300 leading-relaxed">{s.p}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrivacyPage;