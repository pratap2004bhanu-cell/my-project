import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  category: { type: String, required: true, index: true },
  emoji: { type: String, default: '🎟️' },
  coverImage: { type: String, default: '' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organizerName: { type: String, default: '' },
  organizerContact: { type: String, default: '' },
  socialLinks: [{
    label: { type: String, default: '' },
    url: { type: String, default: '' },
  }],
  date: { type: Date, required: true, index: true },
  startTime: { type: String, required: true },
  endTime: { type: String, default: '' },
  venue: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  price: {
    amount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: 'INR' },
    ticketUrl: { type: String, default: '' },
  },
  capacity: { type: Number, default: 0, min: 0 },
  ageRestriction: { type: Number, default: 0 },
  vibe: [{ type: String }],
  rules: [{ type: String }],
  schedule: [{
    title: { type: String, default: '' },
    time: { type: String, default: '' },
    note: { type: String, default: '' },
  }],
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['interested', 'going', 'left'], default: 'interested' },
    joinedAt: { type: Date, default: Date.now },
  }],
  stats: {
    views: { type: Number, default: 0 },
  },
  status: { type: String, enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft', index: true },
  moderationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'approved' },
}, { timestamps: true });

eventSchema.index({ 'venue.location': '2dsphere' });
eventSchema.index({ organizer: 1 });
eventSchema.index({ status: 1, date: -1 });

eventSchema.methods.goingCount = function () {
  return (this.attendees || []).filter((a) => a.status === 'going').length;
};

eventSchema.methods.interestedCount = function () {
  return (this.attendees || []).filter((a) => a.status === 'interested').length;
};

export default mongoose.model('Event', eventSchema);