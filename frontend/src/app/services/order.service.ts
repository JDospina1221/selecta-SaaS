import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.models';
import { OrderItem } from '../models/order-item.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  // Aquí guardamos los productos que el cajero va marcando
  cart = signal<OrderItem[]>([]);

  // El subtotal se calcula solo cada vez que el carrito cambia
  subtotal = computed(() => {
    return this.cart().reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  });

  // Por ahora el total es igual al subtotal
  total = computed(() => this.subtotal());

  // Función para que el cajero agregue productos con un solo toque
  addToCart(product: Product) {
    this.cart.update(currentCart => {
      // Buscamos si la hamburguesa ya estaba en la orden
      const existingItem = currentCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Si ya está, le sumamos 1 a la cantidad
        return currentCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Si es nueva en la orden, la agregamos con cantidad 1
      return [...currentCart, { product, quantity: 1 }];
    });
  }
}