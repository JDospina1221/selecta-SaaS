import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, items, subtotal, total, paymentMethod } = req.body;
    if (!tenantId || !items || items.length === 0) return Object.assign(res.status(400).json({ error: 'Faltan datos' }));

    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.where('tenantId', '==', tenantId).count().get();
    const nextOrderNumber = snapshot.data().count + 1;

    let totalCost = 0; 
    
    // --- MAGIA: LECTURA DINÁMICA DE RECETAS DESDE FIREBASE ---
    for (const item of items) {
      const productRef = db.collection('products').doc(item.product.id);
      const productDoc = await productRef.get();
      
      if (productDoc.exists) {
        const productData = productDoc.data() as any;
        const recipe = productData.recipe || []; // Leemos la receta que el Admin armó

        if (recipe.length > 0) {
          // Si es una Hamburguesa (tiene receta)
          for (const ingredient of recipe) {
             const invQuery = await db.collection('inventory').where('tenantId', '==', tenantId).where('name', '==', ingredient.name).limit(1).get();
             if (!invQuery.empty) {
                const invDoc = invQuery.docs[0];
                const currentStock = invDoc.data().stock || 0;
                const unitCost = invDoc.data().cost || 0;
                totalCost += (unitCost * ingredient.qty * item.quantity); 
                await invDoc.ref.update({ stock: Math.max(0, currentStock - (ingredient.qty * item.quantity)) });
             }
          }
        } else {
           // Si es una Bebida (no tiene receta, descuenta directo 1 a 1 buscando el nombre exacto en bodega)
             const invQuery = await db.collection('inventory').where('tenantId', '==', tenantId).where('name', '==', productData.name).limit(1).get();
             if (!invQuery.empty) {
                const invDoc = invQuery.docs[0];
                const currentStock = invDoc.data().stock || 0;
                const unitCost = invDoc.data().cost || 0;
                totalCost += (unitCost * item.quantity); 
                await invDoc.ref.update({ stock: Math.max(0, currentStock - item.quantity) });
             } else {
               totalCost += (productData.cost || 0) * item.quantity;
             }
        }
      }
    }

    const newOrder = {
      tenantId, orderNumber: nextOrderNumber, paymentMethod: paymentMethod || 'Efectivo',
      items, subtotal, total, totalCost, status: 'Pendiente', 
      createdAt: new Date().toISOString()
    };

    const docRef = await ordersRef.add(newOrder);
    res.status(201).json({ message: 'Orden guardada', orderId: docRef.id, orderNumber: nextOrderNumber });
  } catch (error) { res.status(500).json({ error: 'Error al cobrar' }); }
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    const snapshot = await db.collection('orders').where('tenantId', '==', tenantId).get();
    const today = new Date(); today.setHours(0, 0, 0, 0); const todayStr = today.toISOString();
    const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)).filter(order => order.createdAt >= todayStr).sort((a, b) => b.orderNumber - a.orderNumber);
    res.status(200).json(orders);
  } catch (error) { res.status(500).json({ error: 'Error trayendo órdenes' }); }
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string; 
    const { status, cancelReason, refundMethod } = req.body;
    const orderRef = db.collection('orders').doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) return Object.assign(res.status(404).json({ error: 'Orden no encontrada' }));
    
    const updateData: any = { status };
    if (status === 'Cancelado') {
      updateData.cancelReason = cancelReason; updateData.refundMethod = refundMethod; updateData.canceledAt = new Date().toISOString();

      // --- REVERSIÓN DINÁMICA DE INVENTARIO ---
      const orderData = orderDoc.data() as any;
      if (orderData.status !== 'Cancelado') { 
        for (const item of orderData.items) {
          const productRef = db.collection('products').doc(item.product.id);
          const productDoc = await productRef.get();
          
          if (productDoc.exists) {
            const productData = productDoc.data() as any;
            const recipe = productData.recipe || [];

            if (recipe.length > 0) {
              for (const ingredient of recipe) {
                 const invQuery = await db.collection('inventory').where('tenantId', '==', orderData.tenantId).where('name', '==', ingredient.name).limit(1).get();
                 if (!invQuery.empty) {
                    const invDoc = invQuery.docs[0];
                    const currentStock = invDoc.data().stock || 0;
                    await invDoc.ref.update({ stock: currentStock + (ingredient.qty * item.quantity) }); 
                 }
              }
            } else {
                 const invQuery = await db.collection('inventory').where('tenantId', '==', orderData.tenantId).where('name', '==', productData.name).limit(1).get();
                 if (!invQuery.empty) {
                    const invDoc = invQuery.docs[0];
                    const currentStock = invDoc.data().stock || 0;
                    await invDoc.ref.update({ stock: currentStock + item.quantity }); 
                 }
            }
          }
        }
      }
    }

    await orderRef.update(updateData);
    res.status(200).json({ message: 'Estado actualizado' });
  } catch (error) { res.status(500).json({ error: 'Error actualizando orden' }); }
};