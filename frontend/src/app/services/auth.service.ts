import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';

  currentUser = signal<{email: string, role: string, name: string, tenantId?: string} | null>(null);
  
  // Ahora el servicio maneja su propio estado de error
  loginError = signal(false); 

  login(email: string, pin: string) {
    this.http.post(`${this.apiUrl}/login`, { email, pin }).subscribe({
      next: (res: any) => {
        // Login exitoso: guardamos el usuario y borramos errores
        this.currentUser.set(res.user);
        this.loginError.set(false);
      },
      error: (err) => {
        // Login fallido: disparamos la alerta visual
        console.error('Error de acceso', err);
        this.loginError.set(true);
      }
    });
  }

  logout() {
    this.currentUser.set(null);
  }
}