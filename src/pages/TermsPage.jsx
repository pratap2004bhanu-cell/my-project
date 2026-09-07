import { Link } from 'react-router-dom';
import { FiChevronLeft } from 'react-icons/fi';

const sections = [
  {
    h: '1. Your Use of KIKY',
    p: 'By using KIKY, you agree to use the service lawfully, treat other members with respect, and not post harmful, abusive, or misleading content. You must be at least 16 years old to use KIKY.',
  },
  {
    h: '2. Accounts',
    p: 'You are responsible for the activity on your account and for keeping your login details safe. If you believe your account has been compromised, contact support immediately. We may suspend accounts that violate these terms.',
  },
  {
    h: '3. Activities & Meetups',
    p: 'Activities are organized between members. KIKY is a platform that helps you connect with others; in-person meetups happen at your own risk. Behave safely, meet in public places, and tell someone you trust where you are going.',
  },
  {
    h: '4. Content & Conduct',
    p: 'You keep ownership of your content but grant KIKY a license to display it within the service. We may remove content that violates these terms or our community guidelines. Do not spam, harass, impersonate, or solicit other members.',
  },
  {
    h: '5. Not a Dating or Emergency Service',
    p: 'KIKY is a social connection app, not an emergency response service. In an emergency, always contact your local emergency number first.',
  },
  {
    h: '6. Changes & Termination',
    p: 'We may update these terms from time to time. You can stop using KIKY at any time, and delete your account from Settings at any time.',
  },
];

const TermsPage = () => {
  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      <Link to="/settings" className="inline-flex items-center gap-1 text-sm text-dark-400 hover:text-white transition-colors mb-4">
        <FiChevronLeft className="w-4 h-4" /> Back to Settings
      </Link>

      <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">Terms of Service</h1>
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

export default TermsPage;