import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebase'; 
import productRoutes from './routes/productRoutes'; // <-- Importamos nuestras rutas

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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});