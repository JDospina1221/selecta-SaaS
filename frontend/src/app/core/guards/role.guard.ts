import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; 

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  // Leemos qué rol exige la ruta a la que intenta entrar
  const expectedRole = route.data?.['expectedRole'];

  if (user && user.role === expectedRole) {
    return true; // Tiene el rol correcto, pase.
  }

  // Si no tiene el rol (ej. un Cajero queriendo entrar al Admin), lo redirigimos a su área
  /*
  if (user?.role === 'CAJERO') {
    router.navigate(['/caja']);
  } else {
    router.navigate(['/login']);
  }
  return false;
  */

  // Temporalmente true en Fase 1
  return true; 
};