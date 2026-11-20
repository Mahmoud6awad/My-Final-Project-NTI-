import { Router } from 'express';
import { getPublicSettings, getSettings, updateSettings } from '../controllers/settingsController.js';
import { requireManager } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';

const router = Router();
router.get('/public', asyncRoute(getPublicSettings));
router.get('/', requireManager, asyncRoute(getSettings));
router.put('/', requireManager, asyncRoute(updateSettings));
export default router;
