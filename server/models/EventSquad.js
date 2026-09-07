import mongoose from 'mongoose';

const squadSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: '', trim: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    joinedAt: { type: Date, default: Date.now },
  }],
  maxSize: { type: Number, default: 5, min: 2, max: 20 },
  preferences: [{ type: String }],
  status: { type: String, enum: ['open', 'full', 'closed'], default: 'open' },
}, { timestamps: true });

// A user can only create one squad per event
squadSchema.index({ event: 1, createdBy: 1 }, { unique: true });
squadSchema.index({ event: 1, createdAt: -1 });

squadSchema.methods.memberCount = function () {
  return (this.members || []).length;
};

export default mongoose.model('EventSquad', squadSchema);