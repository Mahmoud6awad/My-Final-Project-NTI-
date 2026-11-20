import mongoose from 'mongoose';

export const ORDER_STATUSES = [
  'Pending Confirmation', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'
];

const itemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  productImage: { type: String, default: '' },
  unitPrice: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  lineSubtotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  alternatePhone: { type: String, trim: true, maxlength: 30, default: '' },
  city: { type: String, required: true, trim: true, maxlength: 80 },
  area: { type: String, required: true, trim: true, maxlength: 120 },
  address: { type: String, required: true, trim: true, maxlength: 500 },
  deliveryInstructions: { type: String, trim: true, maxlength: 500, default: '' },
  items: { type: [itemSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  deliveryFee: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ORDER_STATUSES, default: 'Pending Confirmation' },
  acceptedEmailSentAt: { type: Date, default: null },
  customerDeliveryConfirmedAt: { type: Date, default: null },
  stockReserved: { type: Boolean, default: true }
}, { timestamps: true });

orderSchema.index({ createdAt: -1, status: 1 });
export default mongoose.model('Order', orderSchema);
