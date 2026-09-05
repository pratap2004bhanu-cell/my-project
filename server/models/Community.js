import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  emoji: { type: String, default: '👥' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
    joinedAt: { type: Date, default: Date.now },
  }],
  activities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
  tags: [{ type: String }],
  isPublic: { type: Boolean, default: true },
  maxMembers: { type: Number, default: 100 },
}, { timestamps: true });

communitySchema.index({ creator: 1 });
communitySchema.index({ tags: 1 });

export default mongoose.model('Community', communitySchema);