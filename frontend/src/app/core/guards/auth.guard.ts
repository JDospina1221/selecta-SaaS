import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Verificamos si el usuario está logueado leyendo el Signal de tu AuthService
  if (authService.currentUser()) {
    return true;
  }
  
  // Si no está logueado, lo pateamos al login (lo descomentamos en la Fase 2)
  // router.navigate(['/login']); 
  
  // Por ahora retornamos true para no romper tu vista monolítica actual
  return true; 
};