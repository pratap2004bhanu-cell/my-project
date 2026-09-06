import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['Feature', 'Improvement', 'Bug', 'Other'], default: 'Feature' },
  idea: { type: String, required: true, trim: true, maxlength: 2000 },
  status: {
    type: String,
    enum: ['new', 'in_review', 'shipped', 'rejected'],
    default: 'new',
  },
}, { timestamps: true });

suggestionSchema.index({ user: 1, createdAt: -1 });
suggestionSchema.index({ createdAt: -1 });

export default mongoose.model('Suggestion', suggestionSchema);