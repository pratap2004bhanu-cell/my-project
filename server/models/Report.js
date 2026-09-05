import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  reported: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  details: { type: String, default: '' },
  status: { type: String, enum: ['open', 'reviewing', 'resolved', 'dismissed'], default: 'open' },
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
