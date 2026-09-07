import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  googleId: { type: String, sparse: true },
  avatar: { type: String, default: null },
  gallery: [{ type: String }],
  bio: { type: String, default: '', maxlength: 500 },
  interests: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String, default: '' },
  },
  status: {
    current: { type: String, enum: ['online', 'available', 'away', 'busy', 'offline'], default: 'offline' },
    days: [{ type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] }],
    start: { type: String, default: '09:00' },
    end: { type: String, default: '18:00' },
    spontaneous: { type: Boolean, default: false },
  },
  stats: {
    activitiesJoined: { type: Number, default: 0 },
    connections: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    lastActivityAt: { type: Date },
  },
  preferences: {
    theme: { type: String, enum: ['dark', 'light', 'doodle'], default: 'dark' },
    language: { type: String, default: 'en' },
    distanceUnit: { type: String, enum: ['km', 'mi'], default: 'km' },
    autoJoin: { type: Boolean, default: false },
  },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    activityUpdates: { type: Boolean, default: true },
    connectionRequests: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
    eventUpdates: { type: Boolean, default: true },
  },
  privacy: {
    profileVisibility: { type: String, enum: ['everyone', 'connections', 'private'], default: 'everyone' },
    showLocation: { type: Boolean, default: true },
    showOnlineStatus: { type: Boolean, default: true },
    allowMessages: { type: String, enum: ['everyone', 'connections', 'nobody'], default: 'everyone' },
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requestsSent: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  requestsReceived: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedActivities: [{
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    savedAt: { type: Date, default: Date.now },
  }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  verification: {
    emailVerified: { type: Boolean, default: false },
    emailOtp: { type: String, default: '' },
    emailOtpExpires: { type: Date, default: null },
  },
  emergencyContacts: [{
    name: { type: String, trim: true },
    relation: { type: String, default: '' },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
  }],
  rating: [{
    rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  }],
  fcmToken: { type: String },
  phone: { type: String, trim: true, default: '' },
  twoFactor: {
    enabled: { type: Boolean, default: false },
    otp: { type: String, default: '' },
    otpExpires: { type: Date, default: null },
  },
  devices: [{
    name: { type: String, default: '' },
    ip: { type: String, default: '' },
    lastActive: { type: Date, default: Date.now },
  }],
  resetPassword: {
    token: { type: String, default: '' },
    code: { type: String, default: '' },
    expires: { type: Date, default: null },
  },
  pushSubscriptions: [{
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    device: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);