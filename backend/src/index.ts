import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebase'; 
import productRoutes from './routes/productRoutes'; // <-- Importamos nuestras rutas
import orderRoutes from './routes/orderRoutes'; // <-- Importamos nuestras rutas de órdenes

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

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// RUTICA TEMPORAL PARA POBLAR LA BD
app.get('/api/seed', async (req, res) => {
  const tenantId = 'sociedad_selecta_001';
  const menu = [
    { name: 'Hamburguesa Selecta Doble', price: 28000, category: 'Hamburguesas', stock: 50, tenantId },
    { name: 'Hamburguesa Sencilla', price: 18000, category: 'Hamburguesas', stock: 50, tenantId },
    { name: 'Hamburguesa de Pollo Crispy', price: 22000, category: 'Hamburguesas', stock: 40, tenantId },
    { name: 'Coca-Cola 400ml', price: 4500, category: 'Bebidas', stock: 100, tenantId },
    { name: 'Jugo de Mango Natural', price: 6000, category: 'Bebidas', stock: 30, tenantId },
    { name: 'Cerveza Club Colombia', price: 7000, category: 'Bebidas', stock: 60, tenantId },
    { name: 'Papas a la Francesa', price: 5000, category: 'Adicionales', stock: 80, tenantId },
    { name: 'Porción de Nuggets (6x)', price: 9000, category: 'Adicionales', stock: 40, tenantId }
  ];

  try {
    for (const item of menu) {
      await db.collection('products').add(item);
    }
    res.send('¡Base de datos poblada al pelo, manín!');
  } catch (error) {
    res.status(500).send('Hubo un error: ' + error);
  }
});