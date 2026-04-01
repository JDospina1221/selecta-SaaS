import { Router } from 'express';
import { getDashboardKPIs, getSalesReport } from '../controllers/adminController';

const router = Router();

router.get('/dashboard', getDashboardKPIs);
router.get('/reports/sales', getSalesReport); 

export default router;