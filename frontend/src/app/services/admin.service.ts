import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DashboardKPIs {
  totalRevenue: number;
  netProfit: number;
  averageTicket: number;
  totalOrders: number;
  profitMargin: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/admin';

  kpis = signal<DashboardKPIs | null>(null);
  sales = signal<any[]>([]); // <-- NUEVO: Aquí guardaremos la lista de ventas
  isLoading = signal(false);

  loadKPIs(tenantId: string) {
    this.isLoading.set(true);
    this.http.get<DashboardKPIs>(`${this.apiUrl}/dashboard?tenantId=${tenantId}`)
      .subscribe({
        next: (data) => { this.kpis.set(data); this.isLoading.set(false); },
        error: (err) => { console.error(err); this.isLoading.set(false); }
      });
  }

  // <-- NUEVO: Función para traer la tabla de ventas
  loadSales(tenantId: string, period: string = 'all') {
    this.isLoading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/reports/sales?tenantId=${tenantId}&period=${period}`)
      .subscribe({
        next: (data) => { this.sales.set(data); this.isLoading.set(false); },
        error: (err) => { console.error('Error cargando ventas:', err); this.isLoading.set(false); }
      });
  }
}
