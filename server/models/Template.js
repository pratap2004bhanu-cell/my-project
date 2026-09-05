import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  emoji: { type: String, default: '🎯' },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  duration: { type: String, default: '1 hour' },
  maxParticipants: { type: Number, default: 10 },
  location: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  isDefault: { type: Boolean, default: false },
  uses: { type: Number, default: 0 },
  lastUsedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Template', templateSchema);
