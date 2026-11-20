import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { slugify } from '../utils/slug.js';

export async function listCategories(_req, res) {
  res.json({ categories: await Category.find().sort({ name: 1 }) });
}

export async function getCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  res.json({ category });
}

export async function createCategory(req, res) {
  const { name, description = '', image = '' } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || name.length > 80) return res.status(400).json({ message: 'Category name is required (maximum 80 characters).' });
  const category = await Category.create({ name: name.trim(), slug: slugify(name), description, image });
  res.status(201).json({ category });
}

export async function updateCategory(req, res) {
  const { name, description = '', image = '' } = req.body ?? {};
  if (typeof name !== 'string' || !name.trim() || name.length > 80) return res.status(400).json({ message: 'Category name is required (maximum 80 characters).' });
  const category = await Category.findByIdAndUpdate(req.params.id, { name: name.trim(), description, image }, { new: true, runValidators: true });
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  res.json({ category });
}

export async function deleteCategory(req, res) {
  if (await Product.exists({ categoryId: req.params.id, isActive: true })) return res.status(409).json({ message: 'Move or delete this category’s products before deleting the category.' });
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: 'Category not found.' });
  res.json({ message: 'Category deleted.' });
}
