import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebase'; 
import productRoutes from './routes/productRoutes'; // <-- Importamos nuestras rutas
import orderRoutes from './routes/orderRoutes'; // <-- Importamos nuestras rutas de órdenes
import authRoutes from './routes/authRoutes'; // <-- Importamos nuestras rutas de autenticación

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint de salud (para saber que el server está vivo)
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', message: '¡El backend de La Selecta POS está vivo!' });
});

// Registramos las rutas oficiales del sistema POS
app.use('/api/products', productRoutes); // <-- Todo lo que vaya a /api/products lo maneja productRoutes
app.use('/api/orders', orderRoutes); // <-- Todo lo que vaya a /api/orders lo maneja orderRoutes
app.use('/api/auth', authRoutes); // <-- Todo lo que vaya a /api/auth lo maneja authRoutes



app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
