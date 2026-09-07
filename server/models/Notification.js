import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['connection', 'message', 'activity', 'invite', 'like', 'achievement', 'reminder', 'community', 'event', 'squad'], default: 'activity' },
  text: { type: String, default: '' },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ event: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);