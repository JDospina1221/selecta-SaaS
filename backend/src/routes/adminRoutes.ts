import { Router } from 'express';
import { getAdminProducts, getDashboardKPIs, getSalesReport, updateProduct } from '../controllers/adminController';

const router = Router();

router.get('/dashboard', getDashboardKPIs);
router.get('/reports/sales', getSalesReport); 
router.get('/products', getAdminProducts);
router.put('/products/:id', updateProduct);

export default router;