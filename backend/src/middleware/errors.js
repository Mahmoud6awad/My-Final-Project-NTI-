import mongoose from 'mongoose';

export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, _next) {
  console.error(error);
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: 'Validation failed.', details: Object.values(error.errors).map(e => e.message) });
  }
  if (error.code === 11000) return res.status(409).json({ message: 'A record with that value already exists.' });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid record identifier.' });
  const status = Number.isInteger(error.status) ? error.status : 500;
  res.status(status).json({ message: status >= 500 ? 'An unexpected server error occurred.' : error.message });
}

export function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}
