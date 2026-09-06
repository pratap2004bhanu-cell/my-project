import { Link } from 'react-router-dom';
import { useCallback, useState, useEffect } from 'react';
import { 
  FiArrowRight, FiMapPin, FiUsers, FiCalendar, 
  FiHeart, FiStar, FiZap, FiTarget, FiTrendingUp,
  FiCheck, FiPlay
} from 'react-icons/fi';
import { Logo, DemoTour } from '../components/common';

const LandingPage = () => {
  const [currentWord, setCurrentWord] = useState(0);
  const [demoOpen, setDemoOpen] = useState(false);
  const handleCloseDemo = useCallback(() => setDemoOpen(false), []);
  const words = ['activities', 'people', 'adventures', 'plans'];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: FiTarget,
      title: 'Smart Matching',
      description: 'AI-powered compatibility based on interests, location, and availability.',
      gradient: 'from-lime-500 to-emerald-500',
    },
    {
      icon: FiZap,
      title: 'Let\'s Go Now',
      description: 'Spontaneous mode - find people for activities happening right now.',
      gradient: 'from-electric-500 to-cyan-500',
    },
    {
      icon: FiUsers,
      title: 'Real Connections',
      description: 'Meet people through shared activities, not endless swiping.',
      gradient: 'from-hotpink-500 to-rose-500',
    },
    {
      icon: FiMapPin,
      title: 'Local Discovery',
      description: 'Find activities and people in your neighborhood.',
      gradient: 'from-sunset-500 to-orange-500',
    },
  ];

  const activities = [
    { emoji: '🏏', name: 'Cricket', color: 'from-green-500 to-emerald-600', users: '2.4k' },
    { emoji: '☕', name: 'Coffee', color: 'from-amber-500 to-orange-600', users: '1.8k' },
    { emoji: '🎮', name: 'Gaming', color: 'from-violet-500 to-purple-600', users: '3.2k' },
    { emoji: '🏋️', name: 'Gym', color: 'from-red-500 to-pink-600', users: '2.1k' },
    { emoji: '🎬', name: 'Movies', color: 'from-pink-500 to-rose-600', users: '1.5k' },
    { emoji: '🚶', name: 'Walking', color: 'from-teal-500 to-cyan-600', users: '1.2k' },
    { emoji: '🏃', name: 'Running', color: 'from-blue-500 to-indigo-600', users: '1.9k' },
    { emoji: '🍕', name: 'Food', color: 'from-orange-500 to-red-600', users: '2.7k' },
  ];

  const stats = [
    { value: '50K+', label: 'Active Users' },
    { value: '10K+', label: 'Activities' },
    { value: '100+', label: 'Cities' },
    { value: '4.9', label: 'App Rating' },
  ];

  const testimonials = [
    { name: 'Aarav', activity: 'Cricket', text: 'Found my regular cricket group through Let\'s Go!', rating: 5 },
    { name: 'Priya', activity: 'Coffee', text: 'Met amazing people for weekend coffee meetups.', rating: 5 },
    { name: 'Rahul', activity: 'Gaming', text: 'Best app for finding gaming buddies nearby.', rating: 5 },
  ];

  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden aurora">
      {/* Particle Background */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 15}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/70 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            <div className="flex items-center gap-2 group">
              <Logo size={40} className="group-hover:rotate-6 transition-transform" />
              <span className="text-xl font-display font-bold text-white">KIKY</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="relative text-dark-300 hover:text-white transition-colors group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-electric-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#activities" className="relative text-dark-300 hover:text-white transition-colors group">
                Activities
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-electric-400 group-hover:w-full transition-all duration-300"></span>
              </a>
              <a href="#testimonials" className="relative text-dark-300 hover:text-white transition-colors group">
                Reviews
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-lime-400 to-electric-400 group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-dark-300 hover:text-white transition-colors font-medium">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 lg:pt-40 pb-20 lg:pb-32">
        {/* Background Gradient Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-lime-500/25 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-electric-500/25 rounded-full blur-[120px] animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-hotpink-500/20 rounded-full blur-[100px] animate-float"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-ocean-500/20 rounded-full blur-[100px] animate-float-delayed"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong mb-8 animate-slide-down border border-white/10">
              <span className="w-2 h-2 bg-lime-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-white/80">✨ New: Smart Matching is live!</span>
            </div>
            
            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight animate-slide-up">
              Don't just chat.
              <br />
              <span className="gradient-text-flow">Let's KIKY.</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-dark-300 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              The activity-first social platform that helps you discover activities, 
              find compatible people nearby, and actually meet in the real world.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2 group">
                Start Exploring
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => setDemoOpen(true)}
                className="btn-ghost text-lg px-8 py-4 flex items-center gap-2 cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center shadow-glow-lime">
                  <FiPlay className="w-5 h-5 text-dark-900 ml-0.5" />
                </div>
                Watch Demo
              </button>
            </div>
            
            {/* Stats */}
            <div className="flex items-center justify-center gap-8 lg:gap-12 mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold gradient-text-flow">{stat.value}</div>
                  <div className="text-sm text-dark-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Phone Mockup */}
          <div className="mt-16 lg:mt-24 flex justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-lime-500 via-electric-500 to-hotpink-500 rounded-[3rem] blur-3xl opacity-40 animate-pulse-slow"></div>
              
              {/* Phone Frame - conic rotating border */}
              <div className="conic-border relative w-72 lg:w-80">
                <div className="relative w-full h-[550px] lg:h-[620px] bg-dark-900 rounded-[calc(3rem-4px)] p-3 shadow-float overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-b from-dark-800 to-dark-900 rounded-[2.5rem] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-dark-950 rounded-b-3xl z-10"></div>
                    
                    {/* App Screen */}
                    <div className="h-full p-5 pt-12">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <p className="text-dark-400 text-sm">Good morning!</p>
                          <h3 className="text-white font-bold text-lg">Bhanu 👋</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-white font-bold ring-2 ring-lime-500/40">
                          B
                        </div>
                      </div>
                      
                      {/* What do you want to do? */}
                      <div className="mb-6">
                        <p className="text-dark-300 text-sm mb-3">What do you want to do today?</p>
                        <div className="grid grid-cols-3 gap-2">
                          {activities.slice(0, 6).map((activity) => (
                            <div key={activity.name} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 text-center hover:border-lime-500/50 transition-colors">
                              <span className="text-xl">{activity.emoji}</span>
                              <p className="text-xs text-white/80 mt-1">{activity.name}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Happening Near You */}
                      <div>
                        <p className="text-dark-300 text-sm mb-3">🔥 Happening Near You</p>
                        <div className="space-y-2">
                          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:border-lime-500/50 transition-colors">
                            <span className="text-xl">🏏</span>
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">Evening Cricket</p>
                              <p className="text-dark-400 text-xs">1.2 km • 6 PM</p>
                            </div>
                            <span className="bg-lime-500 text-dark-900 text-[10px] font-bold px-2 py-1 rounded-lg">JOIN</span>
                          </div>
                          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 flex items-center gap-3 hover:border-lime-500/50 transition-colors">
                            <span className="text-xl">☕</span>
                            <div className="flex-1">
                              <p className="text-white text-sm font-medium">Coffee Meetup</p>
                              <p className="text-dark-400 text-xs">800m • 5 PM</p>
                            </div>
                            <span className="bg-lime-500 text-dark-900 text-[10px] font-bold px-2 py-1 rounded-lg">JOIN</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Cards - glass */}
              <div className="absolute -left-12 lg:-left-20 top-1/4 glass-strong rounded-2xl p-4 animate-float shadow-float z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-emerald-500 flex items-center justify-center shadow-glow-lime">
                    <FiTarget className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">94% Match!</p>
                    <p className="text-white/60 text-xs">Cricket nearby</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-12 lg:-right-16 bottom-1/4 glass-strong rounded-2xl p-4 animate-float shadow-float z-10" style={{ animationDelay: '2s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hotpink-500 to-rose-500 flex items-center justify-center shadow-glow-pink">
                    <FiHeart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">New Match!</p>
                    <p className="text-white/60 text-xs">5 people interested</p>
                  </div>
                </div>
              </div>

              {/* Third floating badge */}
              <div className="absolute -bottom-4 left-6 glass-strong rounded-xl px-3 py-2 animate-float shadow-float z-10" style={{ animationDelay: '1s' }}>
                <span className="text-white text-xs font-medium">🔥 7-day streak</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section id="activities" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              Explore Popular Activities
            </h2>
            <p className="text-dark-300 max-w-2xl mx-auto">
              From sports to coffee meetups, find your perfect activity buddy
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {activities.map((activity, index) => (
              <div
                key={activity.name}
                className="group relative overflow-hidden rounded-2xl glass-strong p-4 text-center hover:border-lime-500/50 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-glow-lime cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${activity.color} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}></div>
                <div className="relative">
                  <span className="text-3xl mb-2 block group-hover:scale-125 transition-transform duration-300">{activity.emoji}</span>
                  <p className="text-white font-medium text-sm">{activity.name}</p>
                  <p className="text-dark-400 text-xs mt-1">{activity.users} users</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge-lime mb-4 inline-block">Why KIKY?</span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              Not just another social app
            </h2>
            <p className="text-dark-300 max-w-2xl mx-auto">
              We're building the platform for people who want to actually DO things together
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative overflow-hidden rounded-3xl glass-strong p-8 animate-slide-up hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute -top-10 -right-10 w-40 h-40 blurred-orb opacity-30"></div>
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-dark-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge-electric mb-4 inline-block">How It Works</span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              Three simple steps
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Choose Activity', desc: 'Pick what you want to do - cricket, coffee, gaming, or anything else.', icon: FiTarget },
              { step: '02', title: 'Find People', desc: 'See compatible people nearby who want to do the same thing.', icon: FiUsers },
              { step: '03', title: 'Let\'s Go!', desc: 'Connect, chat, and actually meet in real life.', icon: FiZap },
            ].map((item, index) => (
              <div key={item.step} className="text-center animate-slide-up hover-lift" style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="text-6xl font-display font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white/20 to-white/5">{item.step}</div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-lime-500 to-electric-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-lime">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-lime-500 to-electric-500 opacity-50 blur-lg"></div>
                  <item.icon className="relative w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                <p className="text-white/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="badge-pink mb-4 inline-block">What Users Say</span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-4">
              Loved by thousands
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={testimonial.name} className="glass-strong rounded-3xl p-6 animate-slide-up hover-lift" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FiStar key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
                  ))}
                </div>
                <p className="text-white/90 mb-6">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-electric-500 flex items-center justify-center text-white font-bold ring-2 ring-lime-400/40">
                    {testimonial.name[0]}
                  </div>
                  <div>
                    <p className="text-white font-medium">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.activity} Enthusiast</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] p-1 conic-border">
            <div className="relative bg-dark-900 rounded-[calc(2rem-4px)] p-12 lg:p-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-lime-500/10 via-electric-500/10 to-hotpink-500/10 pointer-events-none"></div>
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-lime-500/20 rounded-full blur-[100px] animate-float"></div>
              <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-hotpink-500/20 rounded-full blur-[100px] animate-float-delayed"></div>
              <div className="relative">
                <h2 className="text-3xl lg:text-4xl font-display font-bold text-white mb-6">
                  Ready to <span className="gradient-text-flow">KIKY?</span>
                </h2>
                <p className="text-dark-300 max-w-xl mx-auto mb-8 text-lg">
                  Join thousands of people who are already finding their activity buddies and making real connections.
                </p>
                <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2 group">
                  Get Started Free
                  <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-dark-950/50 backdrop-blur-xl py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Logo size={40} />
              <span className="text-xl font-display font-bold text-white">KIKY</span>
            </div>
            
            <div className="flex items-center gap-6">
              <a href="#features" className="text-dark-400 hover:text-lime-400 transition-colors">About</a>
              <Link to="/explore" className="text-dark-400 hover:text-lime-400 transition-colors">Explore</Link>
              <Link to="/register" className="text-dark-400 hover:text-lime-400 transition-colors">Get Started</Link>
              <a href="mailto:support@kiky.app" className="text-dark-400 hover:text-lime-400 transition-colors">Contact</a>
            </div>
            
            <p className="text-dark-500 text-sm">
              © 2025 KIKY. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <DemoTour isOpen={demoOpen} onClose={handleCloseDemo} />
    </div>
  );
};

export default LandingPage;