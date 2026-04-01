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
      
      // 🚨 MODO TRANSICIÓN: Como las órdenes viejas no tienen costo guardado, 
      // le estimamos un costo del 60% por ahora para que la gráfica no se rompa.
      // Más adelante, cuando guardemos el costo real en la orden, usaremos order.totalCost.
      totalCost += order.totalCost || (order.total * 0.60); 
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