import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Manager from '../models/Manager.js';

export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'Enter a valid email address and password.' });
  }
  const manager = await Manager.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  if (!manager || !(await bcrypt.compare(password, manager.passwordHash))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  const token = jwt.sign({ sub: manager.id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token, manager: { id: manager.id, email: manager.email } });
}

export function me(req, res) {
  res.json({ manager: { id: req.manager.id, email: req.manager.email } });
}
