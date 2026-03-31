import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Product } from '../models/product';

// Crear un nuevo producto
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const productData: Product = req.body;
    // Guardamos en la colección 'products'
    const docRef = await db.collection('products').add({
      ...productData,
      createdAt: new Date()
    });
    res.status(201).json({ 
      success: true, 
      message: 'Producto creado con exito en el menú', 
      id: docRef.id 
    });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Paila, no se pudo crear el producto' });
  }
};

// Obtener todos los productos de un restaurante
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Sacamos el tenantId de los parámetros de la URL
    const { tenantId } = req.query;

    if (!tenantId) {
      res.status(400).json({ error: 'Falta el tenantId bro, ¿de qué restaurante busco?' });
      return;
    }

    // Buscamos en Firebase todos los productos que pertenezcan a ese tenantId
    const snapshot = await db.collection('products')
      .where('tenantId', '==', tenantId)
      .get();

    // Mapeamos los resultados para devolver un array limpio
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Paila, no se pudieron cargar los productos' });
  }
};