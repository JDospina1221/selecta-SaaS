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
  sales = signal<any[]>([]);
  products = signal<any[]>([]); // <-- Variable para el inventario
  expenses = signal<any[]>([]); // <-- Variable para los gastos
  isLoading = signal(false);

  loadKPIs(tenantId: string) {
    this.isLoading.set(true);
    this.http.get<DashboardKPIs>(`${this.apiUrl}/dashboard?tenantId=${tenantId}`)
      .subscribe({
        next: (data) => { this.kpis.set(data); this.isLoading.set(false); },
        error: (err) => { console.error(err); this.isLoading.set(false); }
      });
  }

  loadSales(tenantId: string, period: string = 'all') {
    this.isLoading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/reports/sales?tenantId=${tenantId}&period=${period}`)
      .subscribe({
        next: (data) => { this.sales.set(data); this.isLoading.set(false); },
        error: (err) => { console.error(err); this.isLoading.set(false); }
      });
  }

  // <-- Cargar Inventario
  loadProducts(tenantId: string) {
    this.isLoading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/products?tenantId=${tenantId}`)
      .subscribe({
        next: (data) => { this.products.set(data); this.isLoading.set(false); },
        error: (err) => { console.error(err); this.isLoading.set(false); }
      });
  }

  // <-- Guardar Cambios del Producto
  updateProduct(productId: string, payload: any) {
    return this.http.put(`${this.apiUrl}/products/${productId}`, payload);
  }
  
  // <-- Cargar Gastos (Caja Menor)
  loadExpenses(tenantId: string) {
    this.isLoading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/finance?tenantId=${tenantId}`)
      .subscribe({
        next: (data) => { this.expenses.set(data); this.isLoading.set(false); },
        error: (err) => { console.error(err); this.isLoading.set(false); }
      });
  }

  // <-- Registrar Gasto
  addExpense(payload: any) {
    return this.http.post(`${this.apiUrl}/finance`, payload);
  }
}