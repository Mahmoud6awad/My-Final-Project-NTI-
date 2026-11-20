import { Router } from 'express';
import * as controller from '../controllers/productController.js';
import { requireManager } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';

const router = Router();
router.get('/', asyncRoute(controller.listProducts));
router.get('/:id', asyncRoute(controller.getProduct));
router.post('/', requireManager, asyncRoute(controller.createProduct));
router.put('/:id', requireManager, asyncRoute(controller.updateProduct));
router.delete('/:id', requireManager, asyncRoute(controller.deleteProduct));
export default router;
