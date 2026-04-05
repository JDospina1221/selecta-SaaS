import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, pin } = req.body;

    if (!email || !pin) {
      res.status(400).json({ error: 'Mande el correo y el pin' });
      return;
    }

    // Buscamos si existe alguien con ese correo y ese pin exacto
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).where('pin', '==', pin).get();

    if (snapshot.empty) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    // Si lo encontró, sacamos sus datos
    const userData = snapshot.docs[0].data();
    
    if (userData.status === false) {
      res.status(403).json({ error: 'Usuario desactivado. Comuníquese con la gerencia.' });
      return;
    }

    res.status(200).json({
      message: '¡Bienvenido a Sociedad Selecta!',
      user: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        tenantId: userData.tenantId
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};