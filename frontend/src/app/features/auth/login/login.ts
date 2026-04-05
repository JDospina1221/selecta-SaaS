import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
// 1. Ruta corregida apuntando a la carpeta de servicios original
import { AuthService } from '../../../services/auth.service'; 

// 2. Ruta del template corregida a 'login.html'
@Component({ selector: 'app-login', standalone: true, imports: [CommonModule], templateUrl: './login.html' })
export class LoginComponent {
  public authService = inject(AuthService);
  private router = inject(Router);

  loginEmail = signal(''); loginPin = signal(''); loginError = this.authService.loginError;

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.role === 'CAJERO') this.router.navigate(['/caja']);
      if (user?.role === 'ADMIN') this.router.navigate(['/admin']);
    });
  }

  updateLoginEmail(e: any) { this.loginEmail.set(e.target.value); } 
  updateLoginPin(e: any) { this.loginPin.set(e.target.value); } 
  onLogin() { this.authService.login(this.loginEmail(), this.loginPin()); this.loginEmail.set(''); this.loginPin.set(''); }
}