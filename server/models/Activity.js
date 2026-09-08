import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  emoji: { type: String, default: '🎯' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['joined', 'pending', 'left'], default: 'joined' },
    joinedAt: { type: Date, default: Date.now },
  }],
  maxParticipants: { type: Number, default: 10 },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
    address: { type: String, default: '' },
  },
  activityType: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },
  recurring: { type: String, enum: ['none', 'daily', 'weekly', 'monthly'], default: 'none' },
  approvalRequired: { type: Boolean, default: false },
  requirements: { type: String, default: '' },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
  checkIns: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    checkedInAt: { type: Date, default: Date.now },
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
  }],
  expenses: [{
    description: String,
    amount: Number,
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    splitAmong: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
  }],
  photos: [{ type: String }],
  feedback: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    createdAt: { type: Date, default: Date.now },
  }],
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
}, { timestamps: true });

activitySchema.index({ location: '2dsphere' });
activitySchema.index({ creator: 1 });
activitySchema.index({ date: 1 });
activitySchema.index({ category: 1 });
activitySchema.index({ status: 1 });

export default mongoose.model('Activity', activitySchema);