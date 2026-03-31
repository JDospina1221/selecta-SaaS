import {Router} from 'express';
import { createProduct } from '../controllers/productController';
import { getProducts } from '../controllers/productController';

const router = Router();

// Ruta para crear un nuevo producto
router.post('/', createProduct);
// Ruta para leer GET
router.get('/', getProducts);

export default router;