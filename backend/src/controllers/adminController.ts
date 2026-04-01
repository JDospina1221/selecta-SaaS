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