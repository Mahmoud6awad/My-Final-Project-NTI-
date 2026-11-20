import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Nova Store', maxlength: 100 },
  storePhone: { type: String, default: '+201000000000', maxlength: 30 },
  deliveryFee: { type: Number, default: 0, min: 0 },
  deliveryTime: { type: String, default: 'Confirmed by phone', maxlength: 120 },
  deliveryAreas: { type: String, default: 'Contact us to confirm delivery availability', maxlength: 500 },
  lowStockThreshold: { type: Number, default: 5, min: 0 }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);
