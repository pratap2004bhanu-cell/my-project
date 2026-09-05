import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiCamera, FiMapPin, FiMail,
  FiPlus, FiX, FiCheck, FiUser
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const EditProfilePage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: typeof user?.location === 'string'
      ? user.location
      : (user?.location?.address || ''),
    interests: user?.interests || [],
  });

  const [newInterest, setNewInterest] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const availableInterests = [
    'Cricket', 'Coffee', 'Gaming', 'Movies', 'Music', 'Travel',
    'Fitness', 'Yoga', 'Running', 'Food', 'Art', 'Photography',
    'Tech', 'Coding', 'Reading', 'Dancing', 'Hiking', 'Cycling',
  ];

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
    setHasChanges(true);
    setErrorMsg(null);
  };

  const addInterest = (interest) => {
    if (!interest.trim()) return;
    if (!profile.interests.includes(interest) && profile.interests.length < 10) {
      setProfile({ ...profile, interests: [...profile.interests, interest] });
      setHasChanges(true);
    }
    setNewInterest('');
  };

  const removeInterest = (interest) => {
    setProfile({ ...profile, interests: profile.interests.filter(i => i !== interest) });
    setHasChanges(true);
  };

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/auth/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const res = await api.get('/auth/me');
      await updateUser(res.data.user);
      window.location.reload();
    } catch (err) {
      setErrorMsg(err?.response?.data?.error || 'Could not upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      setErrorMsg('Name is required');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    const existing = user?.location;
    const result = await updateUser({
      name: profile.name.trim(),
      bio: profile.bio.trim(),
      interests: profile.interests,
      location: existing
        ? { ...existing, address: profile.location.trim() }
        : { type: 'Point', coordinates: [0, 0], address: profile.location.trim() },
    });
    setSaving(false);
    if (result?.success) {
      setHasChanges(false);
      navigate('/profile');
    } else {
      setErrorMsg(result?.error || 'Could not save profile');
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/profile" className="btn-icon">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-white">
            Edit Profile
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`btn-primary ${(!hasChanges || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Profile Photo */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {user?.avatar ? (
              <img src={user.avatar} alt={profile.name} className="w-24 h-24 rounded-full object-cover border-2 border-dark-700" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-lime-500 via-electric-500 to-hotpink-500 flex items-center justify-center text-white text-3xl font-bold">
                {profile.name.charAt(0)}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-lime-500 text-dark-900 rounded-full hover:bg-lime-400 transition-colors"
            >
              <FiCamera className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{profile.name}</h2>
            <p className="text-dark-400">{uploading ? 'Uploading...' : 'Tap camera icon to change photo'}</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Bio</label>
            <textarea
              value={profile.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="input-field min-h-[100px] resize-none"
              placeholder="Tell people about yourself..."
            />
            <p className="text-xs text-dark-400 mt-1">{profile.bio.length}/200</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Location</label>
            <div className="relative">
              <input
                type="text"
                value={profile.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="input-field pl-10"
                placeholder="City / area"
              />
              <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="input-field pl-10 opacity-60 cursor-not-allowed"
              />
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Interests ({profile.interests.length}/10)
        </h2>
        
        {/* Current Interests */}
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.interests.map((interest) => (
            <span
              key={interest}
              className="badge-lime flex items-center gap-1"
            >
              {interest}
              <button
                onClick={() => removeInterest(interest)}
                className="ml-1 hover:text-dark-900"
              >
                <FiX className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>

        {/* Add Interest */}
        {profile.interests.length < 10 && (
          <div>
            <label className="block text-sm font-medium text-dark-300 mb-2">Add Interest</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addInterest(newInterest); }}
                placeholder="Type an interest..."
                className="input-field flex-1"
              />
              <button
                onClick={() => addInterest(newInterest)}
                disabled={!newInterest.trim()}
                className="btn-primary"
              >
                <FiPlus className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Suggested Interests */}
        <div className="mt-4">
          <p className="text-sm text-dark-400 mb-2">Suggested:</p>
          <div className="flex flex-wrap gap-2">
            {availableInterests
              .filter(i => !profile.interests.includes(i))
              .slice(0, 8)
              .map((interest) => (
                <button
                  key={interest}
                  onClick={() => addInterest(interest)}
                  className="px-3 py-1.5 bg-dark-800/50 border border-dark-700/50 rounded-lg text-sm text-dark-300 hover:bg-dark-700/50 hover:text-white transition-colors"
                >
                  + {interest}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Save Button (Mobile) */}
      <div className="lg:hidden fixed bottom-20 left-4 right-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className={`w-full btn-primary py-3 ${(!hasChanges || saving) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default EditProfilePage;