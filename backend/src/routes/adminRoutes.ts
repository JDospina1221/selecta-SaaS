import { Router } from 'express';
import { verifyToken } from '../middlewares/authMiddleware'; // El que acabas de crear
import { validateTenantAccess } from '../middlewares/tenantGuard';
import { 
  getAdminProducts, 
  getDashboardKPIs, 
  getExpenses, 
  getSalesReport, 
  updateProduct, 
  addExpense, 
  createProduct, 
  deleteProduct,
  createCashier, // <-- NUEVA
  getCashiers,    // <-- NUEVA
  updateCashier, 
  deleteCashier  
} from '../controllers/adminController';


const router = Router();

router.get('/dashboard', getDashboardKPIs);
router.get('/reports/sales', getSalesReport);
router.get('/products', getAdminProducts);
router.put('/products/:id', updateProduct);
router.post('/products', createProduct);     
router.delete('/products/:id', deleteProduct); 
router.get('/finance', getExpenses);
router.post('/finance', addExpense); 
router.post('/cashiers', createCashier); // Nuevas rutas para gestionar cajeros
router.get('/cashiers', getCashiers);    // Nuevas rutas para gestionar cajeros 
router.put('/cashiers/:id', updateCashier);    // <-- NUEVA
router.delete('/cashiers/:id', deleteCashier); // <-- NUEVA
router.get('/cashiers', verifyToken, validateTenantAccess, getCashiers);
router.post('/cashiers', verifyToken, validateTenantAccess, createCashier);

export default router;