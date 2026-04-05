import { Request, Response } from 'express';
import { db } from '../config/firebase';
import jwt from 'jsonwebtoken'; // 🔥 Importante

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, pin } = req.body;
    if (!email || !pin) {
      res.status(400).json({ error: 'Papi, mande el correo y el pin' });
      return;
    }

    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).where('pin', '==', pin).get();

    if (userSnapshot.empty) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    const userData = userSnapshot.docs[0].data();
    const tenantId = userData.tenantId;

    const tenantSnapshot = await db.collection('tenants').doc(tenantId).get();
    if (!tenantSnapshot.exists) {
      res.status(404).json({ error: 'Este restaurante no está registrado en Servex' });
      return;
    }

    // 🔥 GENERAMOS EL TOKEN (La llave del restaurante)
    const token = jwt.sign(
      { 
        uid: userSnapshot.docs[0].id, 
        tenantId: tenantId, 
        role: userData.role 
      },
      'SERVEX_SECRET_KEY_2026', 
      { expiresIn: '12h' } // El cajero tiene 12 horas de sesión
    );

    res.status(200).json({
      message: '¡Bienvenido a Servex!',
      token, // <--- Mandamos el token al frontend
      user: {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        tenantId: tenantId
      },
      config: tenantSnapshot.data()
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};