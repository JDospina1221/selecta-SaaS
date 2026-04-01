import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getDashboardKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    
    if (!tenantId) {
      res.status(400).json({ error: 'Falta el ID de la empresa (tenantId)' });
      return;
    }

    // Traemos las órdenes de la base de datos
    const ordersSnapshot = await db.collection('orders').where('tenantId', '==', tenantId).get();

    let totalRevenue = 0;
    let totalOrders = ordersSnapshot.size;
    let totalCost = 0;

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      totalRevenue += order.total || 0;
      
      // AHORA SÍ: Usamos el costo real que guardó el cajero.
      // Si la orden es vieja y no tiene totalCost (de nuestras pruebas anteriores), 
      // le ponemos 0 temporalmente para que no se dañe la suma.
      totalCost += order.totalCost || 0; 
    });

    const netProfit = totalRevenue - totalCost;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    res.status(200).json({
      totalRevenue,
      netProfit,
      averageTicket,
      totalOrders,
      profitMargin: profitMargin.toFixed(1) // Redondeado a 1 decimal
    });
  } catch (error) {
    console.error('Error calculando KPIs:', error);
    res.status(500).json({ error: 'Error interno calculando finanzas' });
  }
};

export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    const period = req.query.period as string || 'all'; // <-- Recibimos el filtro
    
    if (!tenantId) {
      res.status(400).json({ error: 'Falta el ID de la empresa (tenantId)' });
      return;
    }

    const ordersSnapshot = await db.collection('orders')
      .where('tenantId', '==', tenantId)
      .get();

    let orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // --- LÓGICA DE FILTRADO POR FECHAS ---
    if (period !== 'all') {
      const now = new Date();
      let startDate = new Date();

      if (period === 'day') {
        // Desde hoy a las 00:00:00
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        // Desde el domingo/lunes de esta semana
        const firstDay = now.getDate() - now.getDay();
        startDate.setDate(firstDay);
        startDate.setHours(0, 0, 0, 0);
      } else if (period === 'month') {
        // Desde el día 1 de este mes
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Filtramos las órdenes que se crearon DESPUÉS de la fecha de inicio
      orders = orders.filter((o: any) => new Date(o.createdAt) >= startDate);
    }

    // Ordenamos las más recientes primero
    orders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json(orders);
  } catch (error) {
    console.error('Error cargando reportes de ventas:', error);
    res.status(500).json({ error: 'Error interno al cargar el historial' });
  }
};

// --- INVENTARIO: Traer todos los productos ---
export const getAdminProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      res.status(400).json({ error: 'Falta el ID de la empresa' });
      return;
    }

    const snapshot = await db.collection('products').where('tenantId', '==', tenantId).get();
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json(products);
  } catch (error) {
    console.error('Error cargando inventario:', error);
    res.status(500).json({ error: 'Error interno al cargar inventario' });
  }
};

// --- INVENTARIO: Actualizar precio, costo y stock ---
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params as { id: string };
    const { price, cost, stock } = req.body;

    await db.collection('products').doc(id).update({
      price: Number(price),
      cost: Number(cost),
      stock: Number(stock)
    });

    res.status(200).json({ message: '¡Producto actualizado melo!' });
  } catch (error) {
    console.error('Error actualizando producto:', error);
    res.status(500).json({ error: 'Error interno al guardar cambios' });
  }
};

// --- FINANZAS: Traer historial de gastos ---
export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      res.status(400).json({ error: 'Falta el ID de la empresa' });
      return;
    }

    const snapshot = await db.collection('expenses').where('tenantId', '==', tenantId).get();
    let expenses = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Ordenar del gasto más reciente al más viejo
    expenses.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error cargando gastos:', error);
    res.status(500).json({ error: 'Error interno al cargar finanzas' });
  }
};

// --- FINANZAS: Registrar un nuevo gasto (Egreso) ---
export const addExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, description, amount, category } = req.body;

    if (!tenantId || !description || !amount) {
      res.status(400).json({ error: 'Faltan datos para registrar el gasto' });
      return;
    }

    const newExpense = {
      tenantId,
      description,
      amount: Number(amount),
      category: category || 'General',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('expenses').add(newExpense);

    res.status(201).json({
      message: '¡Gasto registrado con éxito!',
      id: docRef.id,
      ...newExpense
    });
  } catch (error) {
    console.error('Error guardando gasto:', error);
    res.status(500).json({ error: 'Error interno al guardar el egreso' });
  }
};