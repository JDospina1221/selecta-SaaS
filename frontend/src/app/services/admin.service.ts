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
  isLoading = signal(false);

  loadKPIs(tenantId: string) {
    this.isLoading.set(true);
    this.http.get<DashboardKPIs>(`${this.apiUrl}/dashboard?tenantId=${tenantId}`)
      .subscribe({
        next: (data) => {
          this.kpis.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error cargando métricas:', err);
          this.isLoading.set(false);
        }
      });
  }
}