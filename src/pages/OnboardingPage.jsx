import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiArrowRight, FiArrowLeft, FiCheck, FiMapPin, FiStar } from 'react-icons/fi';

const interests = [
  { name: 'Cricket', emoji: '🏏', color: 'from-green-500 to-emerald-600' },
  { name: 'Coffee', emoji: '☕', color: 'from-amber-500 to-orange-600' },
  { name: 'Gaming', emoji: '🎮', color: 'from-violet-500 to-purple-600' },
  { name: 'Gym', emoji: '🏋️', color: 'from-red-500 to-pink-600' },
  { name: 'Movies', emoji: '🎬', color: 'from-pink-500 to-rose-600' },
  { name: 'Walking', emoji: '🚶', color: 'from-teal-500 to-cyan-600' },
  { name: 'Running', emoji: '🏃', color: 'from-blue-500 to-indigo-600' },
  { name: 'Food', emoji: '🍕', color: 'from-orange-500 to-red-600' },
  { name: 'Coding', emoji: '💻', color: 'from-cyan-500 to-blue-600' },
  { name: 'Music', emoji: '🎵', color: 'from-purple-500 to-violet-600' },
  { name: 'Travel', emoji: '✈️', color: 'from-sky-500 to-blue-600' },
  { name: 'Art', emoji: '🎨', color: 'from-rose-500 to-pink-600' },
  { name: 'Study', emoji: '📚', color: 'from-indigo-500 to-purple-600' },
  { name: 'Photography', emoji: '📸', color: 'from-amber-500 to-yellow-600' },
  { name: 'Yoga', emoji: '🧘', color: 'from-teal-500 to-green-600' },
  { name: 'Cooking', emoji: '👨‍🍳', color: 'from-orange-500 to-red-600' },
];

const OnboardingPage = () => {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const toggleInterest = (interestName) => {
    if (selectedInterests.includes(interestName)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interestName));
    } else {
      setSelectedInterests([...selectedInterests, interestName]);
    }
  };

  const handleComplete = async () => {
    let coords = [0, 0];
    try {
      const pos = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (p) => resolve(p),
          () => resolve(null),
          { timeout: 4000 }
        );
      });
      if (pos) coords = [pos.coords.longitude, pos.coords.latitude];
    } catch {
      coords = [0, 0];
    }
    await updateUser({
      interests: selectedInterests,
      location: { type: 'Point', coordinates: coords, address: location || 'Location not set' },
      bio: bio,
      onboardingComplete: true,
    });
    navigate('/dashboard');
  };

  const progress = (step / 3) * 100;

  return (
    <div className="min-h-screen bg-dark-950 relative overflow-hidden">
      {/* Background */}
      <div className="auth-bg"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-lime-500/10 rounded-2xl rotate-12 animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-electric-500/10 rounded-full animate-float-delayed"></div>
      <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-hotpink-500/10 rounded-xl -rotate-12 animate-float"></div>
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl animate-scale-in">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-dark-400">Step {step} of 3</span>
              <span className="text-sm text-lime-400 font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-dark-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-lime-500 via-electric-500 to-hotpink-500 transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          {/* Main Card */}
          <div className="bg-dark-900/80 backdrop-blur-2xl border border-dark-700/50 rounded-[2rem] p-8">
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-3 mb-8">
              {[1, 2, 3].map((s) => (
                <div 
                  key={s}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 ${
                    s === step 
                      ? 'bg-gradient-to-br from-lime-500 to-electric-500 text-white shadow-lg scale-110' 
                      : s < step 
                        ? 'bg-lime-500 text-dark-900' 
                        : 'bg-dark-800 text-dark-400'
                  }`}
                >
                  {s < step ? <FiCheck className="w-5 h-5" /> : s}
                </div>
              ))}
            </div>

            {/* Step 1: Interests */}
            {step === 1 && (
              <div className="animate-slide-up">
                <div className="text-center mb-8">
                  <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
                    What are you into?
                  </h1>
                  <p className="text-dark-400">Select at least 3 activities you enjoy</p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {interests.map((interest, index) => (
                    <button
                      key={interest.name}
                      onClick={() => toggleInterest(interest.name)}
                      className={`relative flex flex-col items-center p-4 rounded-2xl transition-all duration-300 ${
                        selectedInterests.includes(interest.name)
                          ? `bg-gradient-to-br ${interest.color} text-white shadow-lg scale-105`
                          : 'bg-dark-800/50 hover:bg-dark-700/50 text-dark-300 border border-dark-700/50'
                      }`}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <span className="text-3xl mb-2">{interest.emoji}</span>
                      <span className="text-sm font-medium">{interest.name}</span>
                      {selectedInterests.includes(interest.name) && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <FiCheck className="w-3 h-3 text-lime-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-dark-400">
                    <span className="font-semibold text-lime-400">{selectedInterests.length}</span> selected
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    disabled={selectedInterests.length < 3}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    Continue
                    <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 2 && (
              <div className="animate-slide-up">
                <div className="text-center mb-8">
                  <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
                    Where are you based?
                  </h1>
                  <p className="text-dark-400">This helps us find activities near you</p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <div className="relative mb-6">
                    <input
                      type="text"
                      placeholder="Enter your city or neighborhood"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="input-field pl-12 text-lg"
                    />
                    <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-dark-400" />
                  </div>
                  
                  {/* Quick Location Suggestions */}
                  <div className="mb-8">
                    <p className="text-sm text-dark-400 mb-3">Popular locations:</p>
                    <div className="flex flex-wrap gap-2">
                      {['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune'].map((city) => (
                        <button
                          key={city}
                          onClick={() => setLocation(city)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            location === city
                              ? 'bg-lime-500 text-dark-900'
                              : 'bg-dark-800 text-dark-300 hover:bg-dark-700 border border-dark-700'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="btn-ghost flex-1 flex items-center justify-center gap-2"
                    >
                      <FiArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="btn-primary flex-1 flex items-center justify-center gap-2 group"
                    >
                      Continue
                      <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Bio */}
            {step === 3 && (
              <div className="animate-slide-up">
                <div className="text-center mb-8">
                  <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mb-2">
                    Tell us about yourself
                  </h1>
                  <p className="text-dark-400">Add a bio so others can know you better</p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <div className="mb-6">
                    <textarea
                      placeholder="Hey! I'm looking for people to play cricket with on weekends. Love trying new coffee shops too! ☕🏏"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={4}
                      className="input-field resize-none"
                      maxLength={500}
                    ></textarea>
                    <p className="text-sm text-dark-400 mt-2 text-right">
                      {bio.length}/500
                    </p>
                  </div>
                  
                  {/* Tips */}
                  <div className="bg-dark-800/50 border border-dark-700/50 rounded-2xl p-5 mb-8">
                    <div className="flex items-start gap-3">
                      <FiStar className="w-5 h-5 text-lime-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-white mb-2">Tips for a great bio:</p>
                        <ul className="text-sm text-dark-300 space-y-1">
                          <li>• Mention your favorite activities</li>
                          <li>• Share what you're looking for in a buddy</li>
                          <li>• Be friendly and open!</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep(2)}
                      className="btn-ghost flex-1 flex items-center justify-center gap-2"
                    >
                      <FiArrowLeft className="w-5 h-5" />
                      Back
                    </button>
                    <button
                      onClick={handleComplete}
                      className="flex-1 bg-gradient-to-r from-lime-500 to-electric-500 text-dark-900 px-6 py-3.5 rounded-2xl font-bold hover:from-lime-400 hover:to-electric-400 transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg hover:shadow-glow-lime"
                    >
                      <span className="text-lg">🚀</span>
                      Let's Go!
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Skip Button */}
          <div className="text-center mt-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-dark-400 hover:text-white transition-colors text-sm"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;