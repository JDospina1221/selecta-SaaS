import { Router } from 'express';
import { getAdminProducts, getDashboardKPIs, getExpenses, getSalesReport, updateProduct, addExpense, createProduct, deleteProduct } from '../controllers/adminController';

const router = Router();

router.get('/dashboard', getDashboardKPIs);
router.get('/reports/sales', getSalesReport);
router.get('/products', getAdminProducts);
router.put('/products/:id', updateProduct);
router.post('/products', createProduct);     // <-- NUEVO
router.delete('/products/:id', deleteProduct); // <-- NUEVO
router.get('/finance', getExpenses);
router.post('/finance', addExpense); 

export default router;