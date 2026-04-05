import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Usa una clave secreta fuerte. En el futuro la moveremos a un archivo .env
const SECRET_KEY = 'SERVEX_SECRET_KEY_2026';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // El token suele venir en el header como 'Bearer <token>'
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No hay token, acceso denegado.' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY) as any;
    // 🔥 ESTO ES VITAL: Inyectamos los datos del token en la petición
    // para que el tenantGuard pueda usarlos después
    (req as any).user = decoded; 
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};