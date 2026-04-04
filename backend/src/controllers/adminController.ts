import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getDashboardKPIs = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    const start = req.query.startDate as string;
    const end = req.query.endDate as string;

    if (!tenantId) return Object.assign(res.status(400).json({ error: 'Falta el ID' }));

    let startDate = new Date(0), endDate = new Date();    
    if (start) startDate = new Date(`${start}T00:00:00`);
    if (end) endDate = new Date(`${end}T23:59:59`);

    const [ordersSnapshot, expensesSnapshot] = await Promise.all([
      db.collection('orders').where('tenantId', '==', tenantId).get(),
      db.collection('expenses').where('tenantId', '==', tenantId).get()
    ]);

    let totalRevenue = 0, totalCOGS = 0, validOrders = 0, totalExpenses = 0;
    // --- NUEVAS MÉTRICAS DE ÓRDENES ---
    let totalOrders = 0, pendingOrders = 0, holdOrders = 0, totalCompleted = 0;
    
    const productSalesMap: Record<string, any> = {};
    const expensesDetail: any[] = [];
    const dailyDataMap: Record<string, { revenue: number, profit: number }> = {};

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const orderDate = new Date(order.createdAt);
      
      if (orderDate >= startDate && orderDate <= endDate) {
        totalOrders++; // Contamos todas las órdenes del rango
        
        // Clasificamos por estado
        if (order.status === 'Pendiente') pendingOrders++;
        else if (order.status === 'Entregado') totalCompleted++;
        else if (order.status === 'Cancelado') holdOrders++; // Usamos 'Cancelado' para Hold Orders

        // Finanzas: Solo calculamos plata si NO está cancelada
        if (order.status !== 'Cancelado') {
          const revenue = order.total || 0;
          const cogs = order.totalCost || 0;
          totalRevenue += revenue; totalCOGS += cogs; validOrders++;

          if (order.items) {
            order.items.forEach((item: any) => {
              const name = item.product.name;
              if (!productSalesMap[name]) productSalesMap[name] = { qty: 0, revenue: 0, cogs: 0, category: item.product.category };
              productSalesMap[name].qty += item.quantity;
              productSalesMap[name].revenue += (item.product.price * item.quantity);
              productSalesMap[name].cogs += ((item.product.cost || 0) * item.quantity);
            });
          }

          const dateStr = orderDate.toISOString().split('T')[0];
          if (!dailyDataMap[dateStr]) dailyDataMap[dateStr] = { revenue: 0, profit: 0 };
          dailyDataMap[dateStr].revenue += revenue;
          dailyDataMap[dateStr].profit += (revenue - cogs);
        }
      }
    });

    expensesSnapshot.forEach(doc => {
      const expense = doc.data();
      const expenseDate = new Date(expense.createdAt);
      if (expenseDate >= startDate && expenseDate <= endDate) {
        totalExpenses += expense.amount || 0;
        expensesDetail.push({ description: expense.description, category: expense.category, amount: expense.amount, date: expense.createdAt });
        const dateStr = expenseDate.toISOString().split('T')[0];
        if (!dailyDataMap[dateStr]) dailyDataMap[dateStr] = { revenue: 0, profit: 0 };
        dailyDataMap[dateStr].profit -= (expense.amount || 0);
      }
    });

    const topProducts = Object.entries(productSalesMap).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.qty - a.qty);
    expensesDetail.sort((a, b) => b.amount - a.amount);
    const dailyTrends = Object.entries(dailyDataMap).map(([date, data]) => ({ date, ...data })).sort((a, b) => a.date.localeCompare(b.date));
    
    const netProfit = totalRevenue - totalCOGS - totalExpenses;
    const averageTicket = validOrders > 0 ? totalRevenue / validOrders : 0;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0.0';

    // Enviamos TODO al frontend
    res.status(200).json({ 
        totalRevenue, totalCOGS, totalExpenses, netProfit, 
        averageTicket, totalOrders, pendingOrders, holdOrders, totalCompleted, 
        profitMargin, topProducts, expensesDetail, dailyTrends 
    });
  } catch (error) { res.status(500).json({ error: 'Error KPIs' }); }
};

export const getSalesReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    const period = req.query.period as string || 'all';
    let query: any = db.collection('orders').where('tenantId', '==', tenantId);
    
    if (period !== 'all') {
      const now = new Date(); let startDate = new Date();
      if (period === 'day') startDate.setHours(0, 0, 0, 0);
      else if (period === 'week') { startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0, 0, 0, 0); }
      else if (period === 'month') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      query = query.where('createdAt', '>=', startDate.toISOString());
    }

    const snapshot = await query.get();
    const sales = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    sales.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.status(200).json(sales);
  } catch (error) { res.status(500).json({ error: 'Error reportes' }); }
};

export const getAdminProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    const snapshot = await db.collection('products').where('tenantId', '==', tenantId).get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(products);
  } catch (error) { res.status(500).json({ error: 'Error inventario' }); }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const payload = req.body;

    if (!id) {
      res.status(400).json({ error: 'Falta el ID del producto' });
      return;
    }

    // Actualizamos el producto en Firebase
    await db.collection('products').doc(id).update({
      ...payload,
      updatedAt: new Date().toISOString()
    });

    res.status(200).json({ success: true, message: 'Producto actualizado melo' });
  } catch (error) {
    // 🔥 AHORA SÍ: Este chismoso nos va a gritar si Firebase rechaza la receta
    console.error('🔥 ERROR EN ADMIN CONTROLLER ACTUALIZANDO PRODUCTO:', error);
    res.status(500).json({ error: 'Paila, error actualizando el producto desde admin' });
  }
};

// --- NUEVO: CREAR PRODUCTO ---
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, name, category, price } = req.body;
    const newProduct = { tenantId, name, category, price, stock: 0, recipe: [], cost: 0, createdAt: new Date().toISOString() };
    const docRef = await db.collection('products').add(newProduct);
    res.status(201).json({ id: docRef.id, ...newProduct });
  } catch (error) { res.status(500).json({ error: 'Error creando producto' }); }
};

// --- NUEVO: ELIMINAR PRODUCTO ---
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await db.collection('products').doc(id).delete();
    res.status(200).json({ message: 'Producto eliminado del menú' });
  } catch (error) { res.status(500).json({ error: 'Error eliminando producto' }); }
};

export const getExpenses = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    const snapshot = await db.collection('expenses').where('tenantId', '==', tenantId).get();
    const expenses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    expenses.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.status(200).json(expenses);
  } catch (error) { res.status(500).json({ error: 'Error egresos' }); }
};

export const addExpense = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, description, amount, category } = req.body;
    const newExpense = { tenantId, description, amount, category, createdAt: new Date().toISOString() };
    await db.collection('expenses').add(newExpense);
    res.status(201).json({ message: 'Gasto registrado' });
  } catch (error) { res.status(500).json({ error: 'Error guardando gasto' }); }
};