import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/db.js';

const port = Number(process.env.PORT || 4000);
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be set to at least 32 characters.');
  await connectDatabase();
  app.listen(port, () => console.log(`Nova Store API listening on port ${port}`));
} catch (error) {
  console.error('Unable to start Nova Store API:', error.message);
  process.exitCode = 1;
}
