import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiMail, FiLock, FiArrowRight, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';
import { Logo } from '../components/common';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const passwordRequirements = [
    { label: 'At least 6 characters', met: formData.password.length >= 6 },
    { label: 'Contains a number', met: /\d/.test(formData.password) },
    { label: 'Passwords match', met: formData.password === formData.confirmPassword && formData.confirmPassword !== '' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
    });
    
    if (result.success) {
      navigate('/onboarding');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="auth-container">
      {/* Background */}
      <div className="auth-bg"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-lime-500/10 rounded-2xl rotate-12 animate-float"></div>
      <div className="absolute top-40 right-20 w-16 h-16 bg-electric-500/10 rounded-full animate-float-delayed"></div>
      <div className="absolute bottom-40 left-1/4 w-12 h-12 bg-hotpink-500/10 rounded-xl -rotate-12 animate-float"></div>
      
      {/* Register Card */}
      <div className="auth-card animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-3 mb-6">
            <Logo size={56} className="shadow-lg rounded-2xl" />
            <span className="text-2xl font-display font-bold text-white">Let's Go</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Join Let's Go!</h1>
          <p className="text-dark-400 mt-2">Find like-minded people for activities</p>
        </div>

        {/* Social Login */}
        <div className="mb-6">
          <button
            onClick={() => { window.location.href = '/auth/google'; }}
            className="w-full flex items-center justify-center gap-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-xl py-3 px-4 transition-all duration-200">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-medium text-white">Google</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-dark-700"></div>
          <span className="text-sm text-dark-400">or continue with email</span>
          <div className="flex-1 h-px bg-dark-700"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 animate-slide-down">
              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-red-400 text-xs font-bold">!</span>
              </div>
              {error}
            </div>
          )}
          
          <div className="relative">
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input-field pl-12"
            />
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          </div>
          
          <div className="relative">
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
              className="input-field pl-12"
            />
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field pl-12 pr-12"
            />
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white transition-colors"
            >
              {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="input-field pl-12"
            />
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          </div>

          {/* Password Requirements */}
          {formData.password && (
            <div className="bg-dark-800/50 rounded-xl p-4 space-y-2">
              {passwordRequirements.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${req.met ? 'bg-lime-500' : 'bg-dark-700'}`}>
                    {req.met && <FiCheck className="w-3 h-3 text-dark-900" />}
                  </div>
                  <span className={`text-sm ${req.met ? 'text-lime-400' : 'text-dark-400'}`}>
                    {req.label}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2">
            <input 
              type="checkbox" 
              className="mt-1 w-4 h-4 rounded border-dark-600 bg-dark-800 text-lime-500 focus:ring-lime-500 focus:ring-offset-0" 
              required
            />
            <span className="text-sm text-dark-400">
              I agree to the{' '}
              <Link to="/terms" className="text-lime-400 hover:text-lime-300 font-medium">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-lime-400 hover:text-lime-300 font-medium">
                Privacy Policy
              </Link>
            </span>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-dark-900 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                Create Account
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-dark-400">
            Already have an account?{' '}
            <Link to="/login" className="text-lime-400 hover:text-lime-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;