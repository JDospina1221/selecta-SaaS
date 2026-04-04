import { Component, inject, signal, computed, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';


@Component({ selector: 'app-reports', standalone: true, imports: [CommonModule], templateUrl: './reports.html' })
export class ReportsComponent {
  private adminService = inject(AdminService); 
  private authService = inject(AuthService);
  
  salesPeriod = signal('all');
  adminSales = this.adminService.sales;
  
  // 🔥 MAGIA: Filtro local ultra rápido sin pedirle nada a Firebase
  validSales = computed(() => {
    const period = this.salesPeriod();
    let filtered = this.adminSales().filter(s => s.status !== 'Cancelado');

    if (period !== 'all') {
      const now = new Date();
      let limitDate = new Date();
      
      if (period === 'day') {
        limitDate.setHours(0, 0, 0, 0); // Desde hoy a las 00:00
      } else if (period === 'week') {
        const day = now.getDay() || 7; 
        limitDate.setDate(now.getDate() - day + 1); // Desde el lunes de esta semana
        limitDate.setHours(0, 0, 0, 0);
      } else if (period === 'month') {
        limitDate.setDate(1); // Desde el día 1 de este mes
        limitDate.setHours(0, 0, 0, 0);
      }
      
      filtered = filtered.filter(s => new Date(s.createdAt) >= limitDate);
    }
    return filtered;
  });

  constructor() { 
    const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001'; 
    // Cargamos todo de la BD solo UNA vez
    this.adminService.loadSales(tenant, 'all'); 
  }
  
  onChangeSalesPeriod(event: any) { 
    // Ya no llamamos a la BD, solo actualizamos el Signal y Angular hace el resto
    this.salesPeriod.set(event.target.value); 
  }
}