import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const featureGuard = (featureKey: string): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    // 1. Obtenemos la configuración del tenant logueado
    const config = authService.tenantConfig();
    
    // 2. ¿Tiene la función activa en la BD?
    if (config?.features?.[featureKey] === true) {
      return true; // Pase, manito
    }

    // 3. Si no ha pagado, le sacamos la tarjeta roja y lo mandamos al dashboard
    alert('🚫 Esta función no está incluida en tu plan actual de Servex SaaS.');
    router.navigate(['/admin/dashboard']);
    return false;
  };
};