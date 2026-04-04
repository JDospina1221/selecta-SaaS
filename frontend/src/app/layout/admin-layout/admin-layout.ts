import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; 
import { AuthService } from '../../services/auth.service';

@Component({ 
  selector: 'app-admin-layout', 
  standalone: true, 
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], 
  templateUrl: './admin-layout.html' 
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isSidebarOpen = signal(false);

  toggleSidebar() { this.isSidebarOpen.set(!this.isSidebarOpen()); }
  closeSidebar() { this.isSidebarOpen.set(false); }

  onLogout() { 
    this.authService.logout(); 
    this.router.navigate(['/login']); 
  }
}