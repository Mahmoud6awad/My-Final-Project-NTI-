import mongoose from 'mongoose';
import Order, { ORDER_STATUSES } from '../models/Order.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';
import { sendOrderAcceptedEmail } from '../utils/email.js';

const transitions = {
  'Pending Confirmation': ['Confirmed', 'Cancelled'],
  Confirmed: ['Preparing', 'Cancelled'],
  Preparing: ['Out for Delivery', 'Cancelled'],
  'Out for Delivery': ['Delivered'],
  Delivered: [],
  Cancelled: []
};

export async function createOrder(req, res) {
  const body = req.body ?? {};
  const required = ['customerName', 'phone', 'city', 'area', 'address'];
  if (required.some(key => typeof body[key] !== 'string' || !body[key].trim())) return res.status(400).json({ message: 'Complete your name, phone, city, area, and delivery address.' });
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 30) return res.status(400).json({ message: 'Add between 1 and 30 products to your order.' });
  const quantities = new Map();
  for (const item of body.items) {
    if (!mongoose.isValidObjectId(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      return res.status(400).json({ message: 'Each order item must have a valid product and quantity.' });
    }
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  }
  const reserved = [];
  let order;
  try {
    const items = [];
    for (const [productId, quantity] of quantities) {
      const product = await Product.findOneAndUpdate(
        { _id: productId, isActive: true, quantity: { $gte: quantity } },
        { $inc: { quantity: -quantity } },
        { new: true }
      );
      if (!product) throw Object.assign(new Error('A product is unavailable or has insufficient stock. Please review your cart.'), { status: 409 });
      reserved.push({ productId, quantity });
      items.push({ productId: product._id, productName: product.name, productImage: product.image, unitPrice: product.price, quantity, lineSubtotal: money(product.price * quantity) });
    }
    const subtotal = money(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
    const settings = await Settings.findOne();
    const deliveryFee = Number(settings?.deliveryFee ?? process.env.DEFAULT_DELIVERY_FEE ?? 0);
    order = await Order.create({
      orderNumber: `NV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      customerName: body.customerName.trim(), phone: body.phone.trim(), alternatePhone: String(body.alternatePhone || '').trim(),
      city: body.city.trim(), area: body.area.trim(), address: body.address.trim(),
      deliveryInstructions: String(body.deliveryInstructions || '').trim(), items, subtotal, deliveryFee,
      total: money(subtotal + deliveryFee), status: 'Pending Confirmation', stockReserved: true
    });
  } catch (error) {
    if (!order) await Promise.all(reserved.map(item => Product.updateOne({ _id: item.productId }, { $inc: { quantity: item.quantity } })));
    throw error;
  }
  res.status(201).json({ order });
}

export async function listOrders(req, res) {
  const filter = {};
  if (req.query.status && ORDER_STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.search) {
    const safeSearch = String(req.query.search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ customerName: new RegExp(safeSearch, 'i') }, { orderNumber: new RegExp(safeSearch, 'i') }, { phone: new RegExp(safeSearch, 'i') }];
  }
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 25));
  const [orders, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), Order.countDocuments(filter)]);
  res.json({ items: orders, page, limit, total });
}

export async function getOrder(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  res.json({ order });
}

export async function trackCustomerOrder(req, res) {
  const { orderNumber, phone } = req.body ?? {};
  if (typeof orderNumber !== 'string' || !orderNumber.trim() || typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ message: 'Enter the order number and phone number used at checkout.' });
  }
  const order = await Order.findOne({ orderNumber: orderNumber.trim().toUpperCase(), phone: phone.trim() });
  if (!order) return res.status(404).json({ message: 'No order matched that order number and phone number.' });
  res.json({ order: publicOrderSummary(order) });
}

export async function confirmCustomerDelivery(req, res) {
  const { phone } = req.body ?? {};
  if (typeof phone !== 'string' || !phone.trim()) {
    return res.status(400).json({ message: 'Enter the phone number used for this order.' });
  }
  const order = await Order.findById(req.params.id);
  if (!order || order.phone !== phone.trim()) {
    return res.status(404).json({ message: 'Order not found. Check the phone number and try again.' });
  }
  if (!['Out for Delivery', 'Delivered'].includes(order.status)) {
    return res.status(409).json({ message: 'You can confirm receipt once the order is out for delivery.' });
  }
  if (!order.customerDeliveryConfirmedAt) {
    order.customerDeliveryConfirmedAt = new Date();
    order.status = 'Delivered';
    await order.save();
  }
  res.json({ order: publicOrderSummary(order) });
}

export async function updateStatus(req, res) {
  const { status } = req.body ?? {};
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ message: 'Choose a valid order status.' });
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (!transitions[order.status].includes(status)) return res.status(409).json({ message: `Cannot change status from ${order.status} to ${status}.` });
  if (status === 'Cancelled' && order.stockReserved) {
    for (const item of order.items) await Product.updateOne({ _id: item.productId }, { $inc: { quantity: item.quantity } });
    order.stockReserved = false;
  }
  order.status = status;
  await order.save();
  if (status === 'Confirmed' && !order.acceptedEmailSentAt) {
    try {
      await sendOrderAcceptedEmail(order);
      order.acceptedEmailSentAt = new Date();
      await order.save();
    } catch (error) {
      console.error(`Order acceptance email failed for ${order.orderNumber}:`, error.message);
      return res.json({
        order,
        notificationError: 'Order accepted, but its email notification could not be sent. Retry the email from the orders table.'
      });
    }
  }
  res.json({ order });
}

export async function retryAcceptanceEmail(req, res) {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.status !== 'Confirmed') return res.status(409).json({ message: 'Only accepted orders can send an acceptance notification.' });
  if (order.acceptedEmailSentAt) return res.status(409).json({ message: 'The acceptance notification has already been sent.' });
  try {
    await sendOrderAcceptedEmail(order);
  } catch (error) {
    console.error(`Order acceptance email retry failed for ${order.orderNumber}:`, error.message);
    return res.status(503).json({ message: 'Email could not be sent. Check SMTP settings and retry.' });
  }
  order.acceptedEmailSentAt = new Date();
  await order.save();
  res.json({ order });
}

function publicOrderSummary(order) {
  return {
    _id: order._id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    area: order.area,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
    items: order.items.map(({ productName, unitPrice, quantity, lineSubtotal }) => ({
      productName, unitPrice, quantity, lineSubtotal
    })),
    customerDeliveryConfirmedAt: order.customerDeliveryConfirmedAt
  };
}

function money(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
