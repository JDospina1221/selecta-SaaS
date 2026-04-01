import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // Ya no recibimos customerName
    const { tenantId, items, subtotal, total, paymentMethod } = req.body;

    if (!tenantId || !items || items.length === 0) {
      res.status(400).json({ error: 'Faltan datos, la comanda está vacía' });
      return;
    }

    const ordersRef = db.collection('orders');

    // 1. Contamos cuántas órdenes existen para calcular el próximo turno
    const snapshot = await ordersRef.where('tenantId', '==', tenantId).count().get();
    const nextOrderNumber = snapshot.data().count + 1;

    // 2. Armamos la comanda con el número autogenerado
    const newOrder = {
      tenantId,
      orderNumber: nextOrderNumber, // <-- Aquí va la magia del contador
      paymentMethod: paymentMethod || 'Efectivo',
      items,
      subtotal,
      total,
      status: 'pagada',
      createdAt: new Date().toISOString()
    };

    const docRef = await ordersRef.add(newOrder);

    res.status(201).json({
      message: '¡Orden guardada con éxito!',
      orderId: docRef.id,
      orderNumber: nextOrderNumber // Se lo devolvemos a Angular para que lo muestre
    });
  } catch (error) {
    console.error('Error al guardar la orden:', error);
    res.status(500).json({ error: 'Error interno del servidor al cobrar' });
  }
};