import mongoose from 'mongoose';

const qnaSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  answer:   { type: String, required: true, trim: true },
  order:    { type: Number, default: 0 },
  isVisible:{ type: Boolean, default: true },
  category: { type: String, default: 'General' },
}, { timestamps: true });

export default mongoose.model('QnA', qnaSchema);
