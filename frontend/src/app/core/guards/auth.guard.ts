import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // 1. ¿Hay alguien logeado?
  if (authService.currentUser()) {
    return true; // Siga, pase al siguiente filtro
  }
  
  // Si no está logeado, lo mandamos a volar al login
  router.navigate(['/login']); 
  return false; 
};