import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  community: { type: mongoose.Schema.Types.ObjectId, ref: 'Community' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  content: { type: String, default: '' },
  attachment: {
    url: { type: String, default: '' },
    name: { type: String, default: '' },
    type: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  read: { type: Boolean, default: false },
}, { timestamps: true });

messageSchema.index({ sender: 1, receiver: 1 });
messageSchema.index({ activity: 1, createdAt: -1 });
messageSchema.index({ community: 1, createdAt: -1 });
messageSchema.index({ event: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);