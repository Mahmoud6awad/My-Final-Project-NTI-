import mongoose from 'mongoose';

const managerSchema = new mongoose.Schema({}, { timestamps: true, strict: false });
managerSchema.add({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }
});

export default mongoose.model('Manager', managerSchema);
