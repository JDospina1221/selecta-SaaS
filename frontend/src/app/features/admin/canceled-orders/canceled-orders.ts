import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({ 
  selector: 'app-canceled-orders', 
  standalone: true, 
  imports: [CommonModule], 
  templateUrl: './canceled-orders.html' 
})
export class CanceledOrdersComponent {
  private adminService = inject(AdminService); 
  public authService = inject(AuthService); // 🔥 Público para el HTML
  
  salesPeriod = signal('all');
  adminSales = this.adminService.sales; // Viene del AdminService
  
  // 🔥 FILTRO DINÁMICO: Se ejecuta solo cuando cambia salesPeriod o adminSales
  canceledSales = computed(() => {
    const period = this.salesPeriod();
    // 1. Primero filtramos solo las anuladas
    let filtered = this.adminSales().filter(s => s.status === 'Cancelado');

    if (period !== 'all') {
      const now = new Date();
      let limitDate = new Date();
      
      if (period === 'day') {
        limitDate.setHours(0, 0, 0, 0);
      } else if (period === 'week') {
        const day = now.getDay() || 7;
        limitDate.setDate(now.getDate() - day + 1);
        limitDate.setHours(0, 0, 0, 0);
      } else if (period === 'month') {
        limitDate.setDate(1);
        limitDate.setHours(0, 0, 0, 0);
      }
      
      // 2. Filtramos por fecha de cancelación
      filtered = filtered.filter(s => {
        const dateToCompare = new Date(s.canceledAt || s.createdAt);
        return dateToCompare >= limitDate;
      });
    }
    
    // Ordenamos: las más recientes primero
    return filtered.sort((a, b) => 
      new Date(b.canceledAt || b.createdAt).getTime() - new Date(a.canceledAt || a.createdAt).getTime()
    );
  });

  constructor() { 
    // Obtenemos el tenant ID real del usuario logueado
    const tenantId = this.authService.currentUser()?.tenantId; 
    
    if (tenantId) {
      // Cargamos el historial completo para que el computed haga su magia
      this.adminService.loadSales(tenantId, 'all'); 
    }
  }
  
  onChangeSalesPeriod(event: any) { 
    this.salesPeriod.set(event.target.value); 
  }
}