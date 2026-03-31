import { Component, OnInit, inject } from '@angular/core';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { Product } from './models/product.models';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html'
})
export class App implements OnInit {
  private productService = inject(ProductService);
  private orderService = inject(OrderService); // Inyectamos el cerebro de las órdenes
  
  // Exponemos las variables para usarlas en el HTML
  cart = this.orderService.cart;
  subtotal = this.orderService.subtotal;
  total = this.orderService.total;

  ngOnInit() {
    this.productService.getProducts('sociedad_selecta_001');
  }

  // Esta función se dispara cuando el cajero toca una tarjeta del menú
  onProductClick(product: Product) {
    this.orderService.addToCart(product);
  }
  // Se dispara al hundir el botón verde
  onCheckout() {
    // Le pasamos el ID del restaurante
    this.orderService.checkoutOrder('sociedad_selecta_001');
  }
  onRemoveItem(productId: string) {
    this.orderService.removeItem(productId);
  }
  onClearOrder() {
    this.orderService.clearCart();
  }

  onUpdateQuantity(productId: string, delta: number) {
    this.orderService.updateQuantity(productId, delta);
  }
  // Variables de filtros expuestas para el HTML
  categories = this.productService.categories;
  selectedCategory = this.productService.selectedCategory;
  filteredProducts = this.productService.filteredProducts;

  // Función para cuando el cajero toque un filtro
  onSelectCategory(category: string) {
    this.productService.setCategory(category);
  }
}