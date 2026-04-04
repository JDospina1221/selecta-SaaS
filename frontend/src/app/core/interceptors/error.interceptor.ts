import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  // const router = inject(Router); // Para usarlo después

  return next(req).pipe(
    catchError((error) => {
      // Interceptamos cualquier error HTTP globalmente
      console.error('🚨 Error Global Interceptado:', error);

      // Si el error es 401 (No autorizado), cerramos sesión automáticamente
      if (error.status === 401) {
        console.log('Sesión expirada. Redirigiendo al login...');
        // router.navigate(['/login']);
      }

      // Si es 500, podríamos mostrar una alerta Toast de "Error en el servidor"
      if (error.status === 500) {
        // toastService.show('El servidor no responde');
      }

      return throwError(() => error);
    })
  );
};