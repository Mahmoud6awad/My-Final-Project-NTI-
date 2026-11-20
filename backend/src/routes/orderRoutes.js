import { Router } from 'express';
import * as controller from '../controllers/orderController.js';
import { requireManager } from '../middleware/auth.js';
import { asyncRoute } from '../middleware/errors.js';
import { rateLimit } from 'express-rate-limit';

const router = Router();
const customerOrderRateLimit = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many order lookup attempts. Please try again later.' }
});
router.post('/', asyncRoute(controller.createOrder));
router.post('/track', customerOrderRateLimit(), asyncRoute(controller.trackCustomerOrder));
router.post('/:id/arrival-confirmation', customerOrderRateLimit(), asyncRoute(controller.confirmCustomerDelivery));
router.post('/:id/acceptance-email', requireManager, asyncRoute(controller.retryAcceptanceEmail));
router.get('/', requireManager, asyncRoute(controller.listOrders));
router.get('/:id', requireManager, asyncRoute(controller.getOrder));
router.patch('/:id/status', requireManager, asyncRoute(controller.updateStatus));
export default router;
