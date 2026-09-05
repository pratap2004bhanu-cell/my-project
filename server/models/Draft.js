import mongoose from 'mongoose';

const draftSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  data: {
    title: { type: String, default: '' },
    category: { type: String, default: '' },
    description: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    location: { type: String, default: '' },
    maxParticipants: { type: mongoose.Schema.Types.Mixed, default: '' },
    activityType: { type: String, default: 'public' },
    recurring: { type: String, default: 'none' },
  },
}, { timestamps: true });

export default mongoose.model('Draft', draftSchema);
