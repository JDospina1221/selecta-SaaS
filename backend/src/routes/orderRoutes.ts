import { Router } from 'express';
import { createOrder, getOrders, updateOrderStatus } from '../controllers/orderController';

const router = Router();

router.post('/', createOrder);
router.get('/', getOrders); // Traer órdenes para el cajero
router.patch('/:id/status', updateOrderStatus); // Cambiar estado

export default router;