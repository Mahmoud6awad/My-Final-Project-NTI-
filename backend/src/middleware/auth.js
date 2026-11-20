import jwt from 'jsonwebtoken';
import Manager from '../models/Manager.js';

export async function requireManager(req, res, next) {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7) : '';
    if (!token) return res.status(401).json({ message: 'Manager authentication is required.' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const manager = await Manager.findById(payload.sub);
    if (!manager) return res.status(401).json({ message: 'Invalid authentication token.' });
    req.manager = manager;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired authentication token.' });
    }
    next(error);
  }
}
