import { Component, inject, signal, computed, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({ selector: 'app-canceled-orders', standalone: true, imports: [CommonModule], templateUrl: './canceled-orders.html' })
export class CanceledOrdersComponent {
  private adminService = inject(AdminService); 
  private authService = inject(AuthService);
  
  salesPeriod = signal('all');
  adminSales = this.adminService.sales;
  
  // 🔥 MAGIA: Filtro local
  canceledSales = computed(() => {
    const period = this.salesPeriod();
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
      
      // Filtramos usando la fecha en la que se canceló (o se creó si no tiene)
      filtered = filtered.filter(s => {
        const dateToCompare = new Date(s.canceledAt || s.createdAt);
        return dateToCompare >= limitDate;
      });
    }
    return filtered;
  });

  constructor() { 
    const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001'; 
    // Cargamos todo de la BD solo UNA vez
    this.adminService.loadSales(tenant, 'all'); 
  }
  
  onChangeSalesPeriod(event: any) { 
    // Solo actualizamos el Signal
    this.salesPeriod.set(event.target.value); 
  }
}