import { Router } from 'express';
import * as controller from '../controllers/categoryController.js';
import { requireManager } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';

const router = Router();
router.get('/', asyncRoute(controller.listCategories));
router.get('/:id', asyncRoute(controller.getCategory));
router.post('/', requireManager, asyncRoute(controller.createCategory));
router.put('/:id', requireManager, asyncRoute(controller.updateCategory));
router.delete('/:id', requireManager, asyncRoute(controller.deleteCategory));
export default router;
