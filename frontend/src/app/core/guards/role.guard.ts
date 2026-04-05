import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const user = authService.currentUser();
  const expectedRole = route.data['expectedRole'];
  
  // 1. Si el rol coincide, siga derecho sin problema
  if (user && user.role === expectedRole) {
    return true; 
  }

  // 2. Si intentó meterse donde no era, ¡Paila! Le sacamos la tarjeta roja
  alert('🚫 Permiso denegado: No tienes autorización para entrar a esta zona, manin.');

  // 3. Lo devolvemos a SU casa dependiendo de su rol real
  if (user?.role === 'CAJERO') {
    router.navigate(['/caja/pos']); 
  } else if (user?.role === 'ADMIN') {
    router.navigate(['/admin/dashboard']); 
  } else {
    // Solo si de verdad hay un error raro y no tiene rol, lo mandamos al login
    router.navigate(['/login']); 
  }
  
  return false; 
};