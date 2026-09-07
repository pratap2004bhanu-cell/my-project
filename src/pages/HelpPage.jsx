import { Link } from 'react-router-dom';
import { FiHelpCircle, FiChevronLeft, FiMessageSquare } from 'react-icons/fi';

const faqs = [
  { q: 'How do I find activities near me?', a: 'Open the Discover / Nearby section and KIKY will show upcoming activities around you, with filters for type and distance.' },
  { q: 'How does matching work?', a: 'KIKY matches you with people who share your interests and are nearby. Tap a match to send a friend request, then chat once they accept.' },
  { q: 'How do I change my password?', a: 'Go to Settings → Security → Change Password, enter your current password and a new one, and save.' },
  { q: 'What is two-factor authentication?', a: '2FA adds an email code step to every sign-in for extra security. Turn it on in Settings → Security → Two-Factor Auth.' },
  { q: 'How do I report someone?', a: 'Open the Trust & Safety Center from Settings → Privacy & Safety. There you can submit a report and track its status.' },
  { q: 'How is my data protected?', a: 'Your profile visibility, location, and messaging preferences are controlled from Settings → Privacy & Safety. You can also export a copy of your data at any time under Help & Support → Export Data.' },
  { q: 'How do I delete my account?', a: 'Settings → Account → Delete Account (in the Danger Zone). This action is permanent and cannot be undone.' },
];

const HelpPage = () => {
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-dark-400 hover:text-white transition-colors mb-4">
        <FiChevronLeft className="w-4 h-4" /> Back to Settings
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-lime-500/10 rounded-xl">
          <FiHelpCircle className="w-6 h-6 text-lime-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white">Help Center</h1>
          <p className="text-dark-400">Answers to common questions about KIKY</p>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {faqs.map((f) => (
          <details key={f.q} className="card p-5 group">
            <summary className="cursor-pointer font-medium text-white flex items-center justify-between gap-3 list-none">
              {f.q}
              <span className="text-dark-400 group-open:rotate-45 transition-transform text-lg shrink-0">+</span>
            </summary>
            <p className="mt-3 text-sm text-dark-300 leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex justify-between flex-wrap gap-3">
          <h2 className="text-lg font-semibold text-white mb-1">Still need help?</h2>
          <Link to="/feedback" className="inline-flex items-center gap-2 text-sm font-medium text-lime-400 hover:text-lime-300 transition-colors">
            <FiMessageSquare className="w-4 h-4" /> Send Feedback
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;