import { Router } from 'express';
import { login, me } from '../controllers/authController.js';
import { requireManager } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';

const router = Router();
router.post('/login', asyncRoute(login));
router.get('/me', requireManager, asyncRoute(me));
export default router;
