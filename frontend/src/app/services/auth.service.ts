import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router'; // Importante para redireccionar
import { ThemeService } from './theme.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);

  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/api/auth';

  // Usuario actual
  currentUser = signal<{email: string, role: string, name: string, tenantId?: string} | null>(
    JSON.parse(localStorage.getItem('user_selecta') || 'null')
  );

  tenantConfig = signal<any>(JSON.parse(localStorage.getItem('tenant_config') || 'null'));
  
  loginError = signal<string | null>(null); 

  constructor() {
    // 🔥 PERSISTENCIA: Si refrescan (F5), volvemos a aplicar el tema guardado
    const config = this.tenantConfig();
    if (config?.theme) {
      this.themeService.applyTheme(this.tenantConfig().theme)
    }
  }

 login(email: string, pin: string) {
  this.http.post(`${this.apiUrl}/login`, { email, pin }).subscribe({
    next: (res: any) => {
      // 1. Aplicamos el tema visual de inmediato
      if (res.config?.theme) {
        this.themeService.applyTheme(res.config.theme);
      }

      // 2. Guardamos el Token (Carnet de entrada para el Backend)
      if (res.token) {
        localStorage.setItem('auth_token_servex', res.token); //
      }

      // 3. Guardamos usuario y configuración del restaurante
      this.currentUser.set(res.user);
      localStorage.setItem('user_selecta', JSON.stringify(res.user));

      this.tenantConfig.set(res.config);
      localStorage.setItem('tenant_config', JSON.stringify(res.config));

      this.loginError.set(null);

      // 4. Redirección inteligente
      if (res.user.role === 'ADMIN') {
        this.router.navigate(['/admin/dashboard']);
      } else {
        this.router.navigate(['/pos/tomar-pedido']);
      }
    },
    error: (err) => {
      console.error('Error de acceso', err);
      const mensaje = err.error?.error || 'No se pudo conectar con el servidor.';
      this.loginError.set(mensaje);
    }
  });
}

logout() {
  // 1. Limpiamos el carnet de entrada (LocalStorage)
  localStorage.removeItem('auth_token_servex');
  
  // 2. Limpiamos el usuario en el Signal
  this.currentUser.set(null);

  // 3. Limpiamos cualquier otra basura del storage
  localStorage.clear(); 
  sessionStorage.clear();

  // 4. EL TRUCO MAESTRO: 
  // En lugar de usar el Router de Angular, usamos el redireccionamiento nativo.
  // Esto mata la aplicación actual y la revive en el Login, limpia de memoria.
  window.location.href = '/login';
}}
