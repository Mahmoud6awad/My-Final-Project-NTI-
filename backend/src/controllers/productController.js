import mongoose from 'mongoose';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { slugify } from '../utils/slug.js';

export async function listProducts(req, res) {
  const { search = '', category, sort = 'newest' } = req.query;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
  const filter = { isActive: true };
  if (search) filter.$text = { $search: String(search).slice(0, 100) };
  if (category && mongoose.isValidObjectId(category)) filter.categoryId = category;
  else if (category) return res.status(400).json({ message: 'Invalid category identifier.' });
  const sorts = { price_asc: { price: 1 }, price_desc: { price: -1 }, newest: { createdAt: -1 } };
  if (!sorts[sort]) return res.status(400).json({ message: 'Unsupported sort option.' });
  const [items, total] = await Promise.all([
    Product.find(filter).populate('categoryId', 'name slug').sort(sorts[sort]).skip((page - 1) * limit).limit(limit),
    Product.countDocuments(filter)
  ]);
  res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
}

export async function getProduct(req, res) {
  const product = await Product.findOne({ _id: req.params.id, isActive: true }).populate('categoryId', 'name slug');
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json({ product });
}

export async function createProduct(req, res) {
  const fields = validateProduct(req.body);
  if (fields.error) return res.status(400).json({ message: fields.error });
  if (!await Category.exists({ _id: fields.value.categoryId })) return res.status(400).json({ message: 'Choose an existing category.' });
  const product = await Product.create({ ...fields.value, slug: slugify(fields.value.name) });
  res.status(201).json({ product });
}

export async function updateProduct(req, res) {
  const fields = validateProduct(req.body);
  if (fields.error) return res.status(400).json({ message: fields.error });
  if (!await Category.exists({ _id: fields.value.categoryId })) return res.status(400).json({ message: 'Choose an existing category.' });
  const product = await Product.findByIdAndUpdate(req.params.id, { ...fields.value }, { new: true, runValidators: true });
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json({ product });
}

export async function deleteProduct(req, res) {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found.' });
  res.json({ message: 'Product deleted.' });
}

function validateProduct(body = {}) {
  const { name, description = '', price, quantity, image = '', categoryId, isFeatured = false, isActive = true } = body;
  if (typeof name !== 'string' || !name.trim() || name.length > 120) return { error: 'Product name is required and must be at most 120 characters.' };
  if (!Number.isFinite(Number(price)) || Number(price) < 0) return { error: 'Price must be a non-negative number.' };
  if (!Number.isInteger(Number(quantity)) || Number(quantity) < 0) return { error: 'Quantity must be a non-negative whole number.' };
  if (!mongoose.isValidObjectId(categoryId)) return { error: 'A valid category is required.' };
  if (typeof description !== 'string' || description.length > 3000 || typeof image !== 'string') return { error: 'Invalid product description or image.' };
  return { value: { name: name.trim(), description, price: Number(price), quantity: Number(quantity), image, categoryId, isFeatured: Boolean(isFeatured), isActive: Boolean(isActive) } };
}
