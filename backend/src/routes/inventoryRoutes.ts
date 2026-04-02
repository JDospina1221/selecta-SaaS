import { Router } from 'express';
import { getInventory, addInventoryItem, updateInventoryItem } from '../controllers/inventoryController';

const router = Router();
router.get('/', getInventory);
router.post('/', addInventoryItem);
router.patch('/:id', updateInventoryItem);

export default router;