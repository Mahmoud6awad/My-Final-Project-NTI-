import { Router } from 'express';
import { getStats } from '../controllers/dashboardController.js';
import { requireManager } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';

const router = Router();
router.get('/stats', requireManager, asyncRoute(getStats));
export default router;
