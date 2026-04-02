import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, items, subtotal, total, paymentMethod } = req.body;

    if (!tenantId || !items || items.length === 0) {
      res.status(400).json({ error: 'Faltan datos, la comanda está vacía' });
      return;
    }

    const ordersRef = db.collection('orders');

    // Contamos cuántas órdenes existen para calcular el próximo turno
    const snapshot = await ordersRef.where('tenantId', '==', tenantId).count().get();
    const nextOrderNumber = snapshot.data().count + 1;

    let totalCost = 0; 

    for (const item of items) {
      const productId = item.product.id;
      const quantitySold = item.quantity;
      
      const productRef = db.collection('products').doc(productId);
      const productDoc = await productRef.get();
      
      if (productDoc.exists) {
        const productData = productDoc.data() as any;
        const unitCost = productData.cost || 0;
        totalCost += (unitCost * quantitySold);

        const currentStock = productData.stock || 0;
        const newStock = Math.max(0, currentStock - quantitySold);
        
        await productRef.update({ stock: newStock });
      }
    }

    const newOrder = {
      tenantId,
      orderNumber: nextOrderNumber,
      paymentMethod: paymentMethod || 'Efectivo',
      items,
      subtotal,
      total,
      totalCost,
      status: 'pagada',
      createdAt: new Date().toISOString()
    };

    const docRef = await ordersRef.add(newOrder);

    res.status(201).json({
      message: '¡Orden guardada con éxito!',
      orderId: docRef.id,
      orderNumber: nextOrderNumber
    });
  } catch (error) {
    console.error('Error al guardar la orden:', error);
    res.status(500).json({ error: 'Error interno del servidor al cobrar' });
  }
};