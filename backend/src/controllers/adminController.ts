import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getDashboardKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    const start = req.query.startDate as string;
    const end = req.query.endDate as string;

    if (!tenantId) {
      res.status(400).json({ error: 'Falta el ID de la empresa' });
      return;
    }

    let startDate = new Date(0); 
    let endDate = new Date();    

    if (start) startDate = new Date(`${start}T00:00:00`);
    if (end) endDate = new Date(`${end}T23:59:59`);

    const [ordersSnapshot, expensesSnapshot] = await Promise.all([
      db.collection('orders').where('tenantId', '==', tenantId).get(),
      db.collection('expenses').where('tenantId', '==', tenantId).get()
    ]);

    let totalRevenue = 0; 
    let totalCOGS = 0;    
    let totalOrders = 0;

    // --- NUEVO: Diccionario para agrupar productos vendidos ---
    const productSalesMap: Record<string, { qty: number, revenue: number, cogs: number, category: string }> = {};

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const orderDate = new Date(order.createdAt);
      
      if (orderDate >= startDate && orderDate <= endDate) {
        totalRevenue += order.total || 0;
        totalCOGS += order.totalCost || 0;
        totalOrders++;

        // Agrupamos qué productos se vendieron en esta orden
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item: any) => {
            const name = item.product.name;
            if (!productSalesMap[name]) {
              productSalesMap[name] = { qty: 0, revenue: 0, cogs: 0, category: item.product.category };
            }
            productSalesMap[name].qty += item.quantity;
            productSalesMap[name].revenue += (item.product.price * item.quantity);
            productSalesMap[name].cogs += ((item.product.cost || 0) * item.quantity);
          });
        }
      }
    });

    // Convertimos el diccionario en un arreglo y lo ordenamos por los más vendidos
    const topProducts = Object.entries(productSalesMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.qty - a.qty);

    let totalExpenses = 0; 
    // --- NUEVO: Arreglo para guardar el detalle de gastos del periodo ---
    const expensesDetail: any[] = [];
    
    expensesSnapshot.forEach(doc => {
      const expense = doc.data();
      const expenseDate = new Date(expense.createdAt);
      
      if (expenseDate >= startDate && expenseDate <= endDate) {
        totalExpenses += expense.amount || 0;
        expensesDetail.push({
          description: expense.description,
          category: expense.category,
          amount: expense.amount,
          date: expense.createdAt
        });
      }
    });

    // Ordenamos los gastos por los más caros primero
    expensesDetail.sort((a, b) => b.amount - a.amount);

    const netProfit = totalRevenue - totalCOGS - totalExpenses;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    // Mandamos los totales Y los desgloses al Frontend
    res.status(200).json({
      totalRevenue,
      totalCOGS,
      totalExpenses,
      netProfit,
      averageTicket,
      totalOrders,
      profitMargin,
      topProducts,     // <-- El Drill-down de ventas y costos
      expensesDetail   // <-- El Drill-down de la caja menor
    });

  } catch (error) {
    console.error('Error calculando KPIs del Dashboard:', error);
    res.status(500).json({ error: 'Error interno al cargar el dashboard' });
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