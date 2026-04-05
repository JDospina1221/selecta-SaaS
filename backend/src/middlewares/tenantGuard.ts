import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para asegurar que un usuario solo acceda a datos 
 * que pertenecen a su propio Restaurante (Tenant)
 */
export const validateTenantAccess = (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Obtenemos el tenantId que viene en la petición (Body o Query)
    const requestedTenantId = req.body.tenantId || req.query.tenantId;
    
    // 2. Obtenemos el tenantId REAL del usuario logueado 
    // Nota: Esto asume que ya pasaste por el middleware de auth y tienes req.user
    const userTenantId = (req as any).user?.tenantId;

    if (!requestedTenantId) {
      return res.status(400).json({ error: 'Falta el tenantId en la petición.' });
    }

    // 3. VALIDACIÓN CRÍTICA
    // Si el ID que piden no es el mismo que tiene el usuario en su perfil... PAILA.
    if (userTenantId !== requestedTenantId) {
      console.error(`🚨 INTENTO DE ACCESO ILEGAL: ${userTenantId} intentó ver datos de ${requestedTenantId}`);
      return res.status(403).json({ 
        error: 'No tienes permiso para acceder a los datos de este restaurante.' 
      });
    }

    next(); // Si coinciden, todo melo, sigue al controlador.
  } catch (error) {
    res.status(500).json({ error: 'Error validando acceso al restaurante.' });
  }
};