import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../config/db.js';
import Category from '../models/Category.js';
import Manager from '../models/Manager.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';

if (!process.env.MANAGER_EMAIL || !process.env.MANAGER_PASSWORD || process.env.MANAGER_PASSWORD.length < 12) {
  throw new Error('Set MANAGER_EMAIL and a MANAGER_PASSWORD of at least 12 characters in backend/.env before seeding.');
}
await connectDatabase();
const passwordHash = await bcrypt.hash(process.env.MANAGER_PASSWORD, 12);
await Manager.updateOne({ email: process.env.MANAGER_EMAIL.toLowerCase() }, { $set: { passwordHash } }, { upsert: true });
const catalog = [
  { name: 'Technology', description: 'Useful technology for everyday life.' },
  { name: 'Home & Living', description: 'Thoughtful picks for your home.' },
  { name: 'Accessories', description: 'Everyday essentials and accessories.' }
];
for (const entry of catalog) {
  const category = await Category.findOneAndUpdate({ name: entry.name }, { $setOnInsert: { ...entry, slug: entry.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } }, { upsert: true, new: true });
  if (!await Product.exists({ categoryId: category._id })) {
    await Product.create([
      { name: `${entry.name} Everyday Essential`, slug: `${category.slug}-essential`, description: `A practical ${entry.name.toLowerCase()} pick selected for quality and everyday use.`, price: 2499, quantity: 12, image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80', categoryId: category._id, isFeatured: true },
      { name: `${entry.name} Premium Edition`, slug: `${category.slug}-premium`, description: `A refined premium choice from our ${entry.name.toLowerCase()} collection.`, price: 3899, quantity: 7, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', categoryId: category._id }
    ]);
  }
}
await Settings.findOneAndUpdate({}, { $setOnInsert: {
  storeName: process.env.STORE_NAME || 'Nova Store', storePhone: process.env.STORE_PHONE || '+201000000000',
  deliveryFee: Number(process.env.DEFAULT_DELIVERY_FEE || 0), deliveryTime: process.env.DELIVERY_TIME || 'Confirmed by phone',
  deliveryAreas: process.env.DELIVERY_AREAS || 'Contact us to confirm delivery availability',
  lowStockThreshold: Number(process.env.LOW_STOCK_THRESHOLD || 5)
} }, { upsert: true });
console.log(`Manager account ready: ${process.env.MANAGER_EMAIL}`);
process.exit(0);
