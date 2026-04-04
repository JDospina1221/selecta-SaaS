import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../shared/interfaces/product.models';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/products';

  products = signal<Product[]>([]);

  // NUEVO: Manejo de categorías
  categories = ['Todas', 'Hamburguesas', 'Bebidas', 'Adicionales'];
  selectedCategory = signal<string>('Todas');

  // NUEVO: Magia de Angular. Filtra la lista en tiempo real sin llamar al backend
  filteredProducts = computed(() => {
    const current = this.selectedCategory();
    if (current === 'Todas') return this.products();
    return this.products().filter(p => p.category === current);
  });

  getProducts(tenantId: string) {
    this.http.get<{data: Product[]}>(`${this.apiUrl}?tenantId=${tenantId}`)
      .subscribe({
        next: (res) => this.products.set(res.data),
        error: (err) => console.error('Error cargando productos:', err)
      });
  }

  setCategory(category: string) {
    this.selectedCategory.set(category);
  }
}