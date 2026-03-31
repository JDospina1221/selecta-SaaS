import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.models'; 
import { OrderItem } from '../models/order-item.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/orders'; // La ruta que creamos en Node

  cart = signal<OrderItem[]>([]);

  subtotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  });

  total = computed(() => this.subtotal());

  addToCart(product: Product) {
    this.cart.update(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return currentCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { product, quantity: 1 }];
    });
  }

  // NUEVA FUNCIÓN: Dispara la venta a la base de datos
  checkoutOrder(tenantId: string) {
    if (this.cart().length === 0) return; // Si no hay nada, no hace nada

    const orderPayload = {
      tenantId,
      items: this.cart(),
      subtotal: this.subtotal(),
      total: this.total()
    };

    this.http.post(this.apiUrl, orderPayload).subscribe({
      next: (res: any) => {
        console.log('Respuesta del servidor:', res.message);
        alert('¡Orden cobrada y guardada con éxito!');
        // Vaciamos la comanda para el siguiente cliente
        this.cart.set([]); 
      },
      error: (err) => {
        console.error('Error al cobrar:', err);
        alert('Hubo un error al comunicarse con el servidor.');
      }
    });
  }
  // Borra un producto completo de la comanda sin importar cuántos haya
  removeItem(productId: string) {
    this.cart.update(currentCart => 
      currentCart.filter(item => item.product.id !== productId)
    );
  }
  // 1. Limpiar todo de un solo tajo
  clearCart() {
    this.cart.set([]);
  }

  // 2. Sumar o restar cantidades (+1 o -1)
  updateQuantity(productId: string, delta: number) {
    this.cart.update(currentCart => 
      currentCart.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          // Validamos que la cantidad mínima sea 1
          return { ...item, quantity: newQty > 0 ? newQty : 1 };
        }
        return item;
      })
    );
  }
}