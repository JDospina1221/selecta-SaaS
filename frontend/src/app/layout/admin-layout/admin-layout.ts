import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../shared/ui/button/button.component'; // Importamos tu nuevo botón

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, UiButtonComponent],
  templateUrl: './admin-layout.html'
})
export class AdminLayoutComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService); // Este servicio ya inyecta los colores dinámicos

  // Signal para el menú en versión móvil
  isSidebarOpen = signal(false);

  toggleSidebar() {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }
}