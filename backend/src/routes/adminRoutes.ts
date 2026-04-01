import { Router } from 'express';
import { addExpense, getAdminProducts, getDashboardKPIs, getExpenses, getSalesReport, updateProduct } from '../controllers/adminController';

const router = Router();

router.get('/dashboard', getDashboardKPIs);
router.get('/reports/sales', getSalesReport); 
router.get('/products', getAdminProducts);
router.put('/products/:id', updateProduct);
router.get('/finance', getExpenses);
router.post('/finance', addExpense);

export default router;