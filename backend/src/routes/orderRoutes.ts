import { Router } from "express";
import { createOrder } from "../controllers/orderController";

const router = Router();

// Ruta para crear una nueva orden
router.post('/', createOrder);

export default router;