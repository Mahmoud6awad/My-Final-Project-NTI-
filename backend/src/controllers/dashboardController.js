import Category from '../models/Category.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';

export async function getStats(_req, res) {
  const threshold = Number((await Settings.findOne())?.lowStockThreshold ?? process.env.LOW_STOCK_THRESHOLD ?? 5);
  const [products, categories, totalOrders, pendingOrders, confirmedOrders, deliveredOrders, lowStock, recentOrders] = await Promise.all([
    Product.countDocuments({ isActive: true }), Category.countDocuments(), Order.countDocuments(),
    Order.countDocuments({ status: 'Pending Confirmation' }), Order.countDocuments({ status: 'Confirmed' }),
    Order.countDocuments({ status: 'Delivered' }), Product.countDocuments({ isActive: true, quantity: { $lte: threshold } }),
    Order.find().sort({ createdAt: -1 }).limit(8)
  ]);
  res.json({ stats: { products, categories, totalOrders, pendingOrders, confirmedOrders, deliveredOrders, lowStock, recentOrders } });
}
