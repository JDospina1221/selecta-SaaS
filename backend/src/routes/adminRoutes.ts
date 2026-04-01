import { Router } from 'express';
import { getDashboardKPIs } from '../controllers/adminController';

const router = Router();

// Ruta: /api/admin/dashboard
router.get('/dashboard', getDashboardKPIs);

export default router;