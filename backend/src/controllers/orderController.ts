import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    // Recibimos los datos que nos va a mandar Angular
    const { tenantId, items, subtotal, total } = req.body;

    // Validación de seguridad para que no nos manden órdenes vacías
    if (!tenantId || !items || items.length === 0) {
      res.status(400).json({ error: 'Faltan datos, la comanda está vacía' });
      return;
    }

    // Armamos el "recibo" que se va a guardar en la base de datos
    const newOrder = {
      tenantId,
      items,
      subtotal,
      total,
      status: 'pagada', // Como es POS de caja, entra pagada de una vez
      createdAt: new Date().toISOString()
    };

    // Lo metemos en la colección 'orders' de Firebase
    const docRef = await db.collection('orders').add(newOrder);

    res.status(201).json({
      message: '¡Orden guardada con éxito, manín!',
      orderId: docRef.id
    });
  } catch (error) {
    console.error('Error al guardar la orden:', error);
    res.status(500).json({ error: 'Error interno del servidor al cobrar' });
  }
};