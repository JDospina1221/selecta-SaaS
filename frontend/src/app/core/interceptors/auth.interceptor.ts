import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Buscamos el token con el nombre que definimos en el login
  const token = localStorage.getItem('auth_token_servex');

  if (token) {
    // Clonamos la petición y le pegamos el Header de seguridad
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req); 
};