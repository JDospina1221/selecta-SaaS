import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.models'; // Este lo creamos en un segundo

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private http = inject(HttpClient);
  // URL de tu API de Node.js
  private apiUrl = 'http://localhost:3000/api/products';

  // Usamos un Signal para que la UI se entere solita cuando cambien los datos
  products = signal<Product[]>([]);

  // Función para traer el menú del restaurante
  getProducts(tenantId: string) {
    this.http.get<{data: Product[]}>(`${this.apiUrl}?tenantId=${tenantId}`)
      .subscribe({
        next: (res) => {
          this.products.set(res.data);
          console.log('Servicio: Productos cargados con éxito');
        },
        error: (err) => console.error('Error en el servicio de productos:', err)
      });
  }
}