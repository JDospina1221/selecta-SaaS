import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.models';

export interface CartItem {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/orders';

  cart = signal<CartItem[]>([]);
  subtotal = signal(0);
  total = signal(0);

  addToCart(product: Product) {
    this.cart.update(items => {
      const existing = items.find(i => i.product.id === product.id);
      if (existing) {
        existing.quantity++;
        return [...items];
      }
      return [...items, { product, quantity: 1 }];
    });
    this.calculateTotals();
  }

  removeItem(productId: string) {
    this.cart.update(items => items.filter(i => i.product.id !== productId));
    this.calculateTotals();
  }

  updateQuantity(productId: string, delta: number) {
    this.cart.update(items => {
      const existing = items.find(i => i.product.id === productId);
      if (existing) {
        existing.quantity += delta;
        if (existing.quantity <= 0) {
          return items.filter(i => i.product.id !== productId);
        }
        return [...items];
      }
      return items;
    });
    this.calculateTotals();
  }

  clearCart() {
    this.cart.set([]);
    this.calculateTotals();
  }

  private calculateTotals() {
    const currentCart = this.cart();
    const sub = currentCart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    this.subtotal.set(sub);
    this.total.set(sub);
  }

  checkoutOrder(tenantId: string, paymentMethod: string) {
    const payload = {
      tenantId,
      items: this.cart(),
      subtotal: this.subtotal(),
      total: this.total(),
      paymentMethod
    };
    
    // EL RETURN MÁGICO
    return this.http.post<any>(`${this.apiUrl}`, payload);
  }
}