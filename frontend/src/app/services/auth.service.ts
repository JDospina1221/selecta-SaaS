import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/auth';

  currentUser = signal<{email: string, role: string, name: string, tenantId?: string} | null>(
    JSON.parse(localStorage.getItem('user_selecta') || 'null')
  );
  
  loginError = signal<string | null>(null); 

  login(email: string, pin: string) {
    this.http.post(`${this.apiUrl}/login`, { email, pin }).subscribe({
      next: (res: any) => {
        this.currentUser.set(res.user);
        localStorage.setItem('user_selecta', JSON.stringify(res.user));
        this.loginError.set(null); // Limpiamos el error si entra bien
      },
      error: (err) => {
        console.error('Error de acceso', err);
        //Capturamos el mensaje exacto que manda el backend
        const mensaje = err.error?.error || 'No se pudo conectar con el servidor.';
        this.loginError.set(mensaje);
      }
    });
  }

  logout() {
    this.currentUser.set(null);
    localStorage.removeItem('user_selecta');
    this.loginError.set(null);
  }
}