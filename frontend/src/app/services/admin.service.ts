import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DashboardKPIs { totalRevenue: number; totalCOGS: number; totalExpenses: number; netProfit: number; averageTicket: number; totalOrders: number; profitMargin: string; topProducts?: any[]; expensesDetail?: any[]; dailyTrends?: any[]; }

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/admin';

  kpis = signal<DashboardKPIs | null>(null);
  sales = signal<any[]>([]);
  products = signal<any[]>([]);
  expenses = signal<any[]>([]);
  isLoading = signal(false);

  loadKPIs(tenantId: string, startDate?: string, endDate?: string) {
    this.isLoading.set(true);
    let url = `${this.apiUrl}/dashboard?tenantId=${tenantId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    this.http.get<DashboardKPIs>(url).subscribe({ next: (data) => { this.kpis.set(data); this.isLoading.set(false); }, error: () => this.isLoading.set(false) });
  }

  loadSales(tenantId: string, period: string = 'all') {
    this.isLoading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/reports/sales?tenantId=${tenantId}&period=${period}`).subscribe({ next: (data) => { this.sales.set(data); this.isLoading.set(false); }, error: () => this.isLoading.set(false) });
  }

  loadProducts(tenantId: string) {
    this.isLoading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/products?tenantId=${tenantId}`).subscribe({ next: (data) => { this.products.set(data); this.isLoading.set(false); }, error: () => this.isLoading.set(false) });
  }

  updateProduct(id: string, data: any) { return this.http.put(`${this.apiUrl}/products/${id}`, data); }
  addProduct(product: any) { return this.http.post(`${this.apiUrl}/products`, product); } // <-- NUEVO
  deleteProduct(id: string) { return this.http.delete(`${this.apiUrl}/products/${id}`); } // <-- NUEVO

  loadExpenses(tenantId: string) {
    this.isLoading.set(true);
    this.http.get<any[]>(`${this.apiUrl}/finance?tenantId=${tenantId}`).subscribe({ next: (data) => { this.expenses.set(data); this.isLoading.set(false); }, error: () => this.isLoading.set(false) });
  }

  addExpense(expense: any) { return this.http.post(`${this.apiUrl}/finance`, expense); }
}