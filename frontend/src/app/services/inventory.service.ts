import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface InventoryItem { id?: string; name: string; category: string; stock: number; cost: number; unit: string; }

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/inventory';

  items = signal<InventoryItem[]>([]);

  loadInventory(tenantId: string) {
    this.http.get<InventoryItem[]>(`${this.apiUrl}?tenantId=${tenantId}`).subscribe({
      next: (data) => this.items.set(data),
      error: (e) => console.error(e)
    });
  }

  addInventoryItem(item: any) { return this.http.post(this.apiUrl, item); }
  updateInventoryItem(id: string, item: any) { return this.http.patch(`${this.apiUrl}/${id}`, item); }
}