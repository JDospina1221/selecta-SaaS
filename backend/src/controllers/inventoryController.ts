import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.query.tenantId as string;
    const snapshot = await db.collection('inventory').where('tenantId', '==', tenantId).get();
    const inventory = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Ordenar alfabéticamente
    inventory.sort((a: any, b: any) => a.name.localeCompare(b.name));
    res.status(200).json(inventory);
  } catch (error) { res.status(500).json({ error: 'Error obteniendo inventario' }); }
};

export const addInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { tenantId, name, category, stock, cost, unit } = req.body;
    const newItem = { tenantId, name, category, stock, cost, unit, updatedAt: new Date().toISOString() };
    const docRef = await db.collection('inventory').add(newItem);
    res.status(201).json({ id: docRef.id, ...newItem });
  } catch (error) { res.status(500).json({ error: 'Error agregando insumo' }); }
};

export const updateInventoryItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, category, stock, cost, unit } = req.body;
    await db.collection('inventory').doc(id).update({ name, category, stock, cost, unit, updatedAt: new Date().toISOString() });
    res.status(200).json({ message: 'Stock actualizado' });
  } catch (error) { res.status(500).json({ error: 'Error actualizando insumo' }); }
};