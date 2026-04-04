import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Aquí leeremos el token de la sesión actual
  // const token = localStorage.getItem('auth_token'); // O desde el AuthService
  
  // Si hay token, clonamos la petición y le inyectamos la cabecera Authorization
  /*
  if (token) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }
  */

  // Dejamos pasar la petición intacta por ahora
  return next(req); 
};