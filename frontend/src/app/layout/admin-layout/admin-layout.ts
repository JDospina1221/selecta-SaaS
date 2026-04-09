import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ConnectivityService } from '../../services/connectivity.service'; // ✅ Nuevo
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../shared/ui/button/button.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, UiButtonComponent],
  templateUrl: './admin-layout.html'
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private connectivityService = inject(ConnectivityService); // ✅ Inyectamos el vigilante

  isSidebarOpen = signal(false);
  isProfileMenuOpen = signal(false);
  
  // ✅ Ahora isOnline() devuelve la señal real de Firebase
  isOnline = this.connectivityService.isSynced;

  toggleSidebar() { this.isSidebarOpen.set(!this.isSidebarOpen()); }
  closeSidebar() { this.isSidebarOpen.set(false); }
  toggleProfileMenu() { this.isProfileMenuOpen.set(!this.isProfileMenuOpen()); }
  closeProfileMenu() { this.isProfileMenuOpen.set(false); }
}