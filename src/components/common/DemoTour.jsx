import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiX,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiPlay,
  FiTarget,
  FiZap,
  FiUsers,
  FiMessageCircle,
  FiCalendar,
  FiShield,
  FiAward,
  FiPlusCircle,
} from 'react-icons/fi';

const slides = [
  {
    icon: FiPlay,
    gradient: 'from-lime-500 to-emerald-500',
    shadow: 'shadow-glow-lime',
    title: 'Welcome to Hanglly',
    tagline: 'The activity-first social platform',
    description:
      'Hanglly helps you discover activities, find compatible people nearby, and actually meet in the real world.',
    points: ['Built around activities, not endless swiping', 'Find your crew and go do things together'],
    chips: ['🚀', '✨', '🤝'],
  },
  {
    icon: FiTarget,
    gradient: 'from-lime-500 to-emerald-500',
    shadow: 'shadow-glow-lime',
    title: 'Discover Activities',
    tagline: 'Something for everyone',
    description:
      'Browse activities happening near you - from cricket to coffee to gaming. See who is going, when, and how far away it is.',
    points: ['Popular activities from your interests', 'Distance, time and free seats at a glance', 'One-tap join'],
    chips: ['🏏', '☕', '🎮', '🏋️'],
  },
  {
    icon: FiPlusCircle,
    gradient: 'from-electric-500 to-cyan-500',
    shadow: 'shadow-glow-blue',
    title: 'Create Your Own',
    tagline: 'Host, invite, go',
    description:
      'Can\'t find it? Create it. Pick an activity, set a time and place, add details - and invite people nearby to join you.',
    points: ['Set activity, time, place and capacity', 'See who joined and chat with them', 'Everyone in your area can discover it'],
    chips: ['📝', '📍', '🕒'],
  },
  {
    icon: FiUsers,
    gradient: 'from-hotpink-500 to-rose-500',
    shadow: 'shadow-glow-pink',
    title: 'Smart Matching',
    tagline: 'Compatible people, suggested for you',
    description:
      'AI-powered matching scores people by interests, location and availability - so the people you meet actually click with you.',
    points: ['Match score for every suggestion', 'Shared interests highlighted', 'Send a friend request in one tap'],
    chips: ['💞', '🔗', '⭐'],
  },
  {
    icon: FiZap,
    gradient: 'from-electric-500 to-cyan-500',
    shadow: 'shadow-glow-blue',
    title: 'Let\'s Go Now',
    tagline: 'Spontaneous mode',
    description:
      'Feeling spontaneous? Tell Hanglly you\'re free right now and get matched with people who want to do something this moment.',
    points: ['Match with people ready right now', 'Set a quick activity and radius', 'From "now" to "let\'s go" in minutes'],
    chips: ['⚡', '🔥', '💨'],
  },
  {
    icon: FiMessageCircle,
    gradient: 'from-lime-500 to-electric-500',
    shadow: 'shadow-glow-lime',
    title: 'Chat & Group Chat',
    tagline: 'Stay connected before you meet',
    description:
      'Every activity gets its own group chat, and you can private-chat with anyone you match with. Coordinate plans easily.',
    points: ['Private chats with your matches', 'Group chat for every activity', 'Community rooms for your crews'],
    chips: ['💬', '👋', '🎯'],
  },
  {
    icon: FiCalendar,
    gradient: 'from-sunset-500 to-orange-500',
    shadow: 'shadow-glow-orange',
    title: 'Plan & Check In',
    tagline: 'Your plans, all in one place',
    description:
      'Keep your calendar, check in at meetups, split expenses with friends, and share photos from your hangouts.',
    points: ['Calendar view of all your plans', 'Check-in to confirm you made it', 'Split costs and share the memories'],
    chips: ['📅', '✅', '📸'],
  },
  {
    icon: FiShield,
    gradient: 'from-ocean-500 to-cyan-500',
    shadow: 'shadow-glow-blue',
    title: 'Stay Safe',
    tagline: 'Meet with confidence',
    description:
      'Your safety comes first. Verified profiles and built-in safety tools help you meet new people the right way.',
    points: ['Profile verification and safety tips', 'Share your plans with people you trust', 'Report and block when you need to'],
    chips: ['🛡️', '🔒', '📢'],
  },
  {
    icon: FiAward,
    gradient: 'from-amber-500 to-yellow-500',
    shadow: 'shadow-glow-orange',
    title: 'Level Up',
    tagline: 'Make every hangout count',
    description:
      'Earn points, build streaks, unlock badges and climb the leaderboard every time you show up and hang out.',
    points: ['Points & streaks for showing up', 'Achievements and badges', 'Leaderboard with your community'],
    chips: ['🏆', '🔥', '🎖️'],
  },
];

const totalSteps = slides.length + 1;

const DemoTour = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const closeDemo = useCallback(() => {
    setStep(0);
    onClose();
  }, [onClose]);

  const handleFinish = () => {
    setStep(0);
    onClose();
    navigate('/register');
  };

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';

    const handleKey = (e) => {
      if (e.key === 'Escape') closeDemo();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, totalSteps - 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose, closeDemo]);

  if (!isOpen) return null;

  const isLast = step === totalSteps - 1;
  const slide = isLast ? null : slides[step];
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-xl" onClick={closeDemo} />

      <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-2xl animate-scale-in">
          {/* Header / Progress */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-dark-400">
              {isLast ? 'One last thing' : `Step ${step + 1} of ${totalSteps}`}
            </span>
            <button
              onClick={closeDemo}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 flex items-center justify-center text-dark-300 hover:text-white transition-all"
              aria-label="Close demo"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          <div className="h-2 bg-dark-800 rounded-full overflow-hidden mb-8">
            <div
              className="h-full bg-gradient-to-r from-lime-500 via-electric-500 to-hotpink-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* Card */}
          <div className="bg-dark-900/80 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-10 text-center relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-lime-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-hotpink-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {!isLast ? (
              <div key={step} className="relative animate-slide-up">
                {/* Icon visual */}
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${slide.gradient} opacity-60 blur-xl ${slide.shadow}`}
                  ></div>
                  <div
                    className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-lg`}
                  >
                    <slide.icon className="w-11 h-11 text-white" />
                  </div>
                  {slide.chips.map((chip, i) => (
                    <div
                      key={i}
                      className="absolute w-9 h-9 rounded-xl bg-dark-800 border border-white/10 flex items-center justify-center text-lg animate-float shadow-lg"
                      style={{
                        top: `${[-14, 2, -6][i] || -10}%`,
                        right: `${i === 0 ? -16 : 0}%`,
                        left: `${i === 2 ? -16 : 0}%`,
                        bottom: `${i === 1 ? -12 : 0}%`,
                        animationDelay: `${i * 0.6}s`,
                      }}
                    >
                      {chip}
                    </div>
                  ))}
                </div>

                <span className={`badge-lime inline-block mb-3`}>{slide.tagline}</span>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">{slide.title}</h2>
                <p className="text-dark-300 max-w-lg mx-auto mb-6 leading-relaxed">{slide.description}</p>

                <ul className="max-w-md mx-auto space-y-2.5 text-left mb-8">
                  {slide.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-white/85 text-sm sm:text-base">
                      <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-lime-500/15 border border-lime-500/30 flex items-center justify-center">
                        <FiCheck className="w-3 h-3 text-lime-400" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div key="final" className="relative animate-slide-up">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-lime-500 via-electric-500 to-hotpink-500 opacity-60 blur-xl"></div>
                  <div
                    className="relative w-24 h-24 rounded-full bg-gradient-to-br from-lime-500 via-electric-500 to-hotpink-500 flex items-center justify-center shadow-lg"
                  >
                    <FiCheck className="w-12 h-12 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                  Ready to <span className="gradient-text-flow">Hanglly?</span>
                </h2>
                <p className="text-dark-300 max-w-lg mx-auto mb-8 leading-relaxed">
                  You've seen everything. Create your free account, set your interests, and start finding
                  your people in minutes.
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="relative flex items-center justify-between gap-4">
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="btn-ghost flex items-center gap-2"
                >
                  <FiArrowLeft className="w-5 h-5" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {/* Dots */}
              <div className="hidden sm:flex items-center gap-1.5">
                {[...Array(totalSteps)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      i === step ? 'bg-gradient-to-r from-lime-500 to-electric-500 w-6' : 'bg-white/15 hover:bg-white/30'
                    }`}
                    aria-label={`Go to step ${i + 1}`}
                  />
                ))}
              </div>

              {!isLast ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="btn-primary flex items-center gap-2 group"
                >
                  Next
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="btn-primary flex items-center gap-2 group"
                >
                  Create Account
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoTour;