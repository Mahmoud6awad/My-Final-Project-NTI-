import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80, unique: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  image: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);
