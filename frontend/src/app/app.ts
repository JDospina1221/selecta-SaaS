import { Component, OnInit, inject, signal } from '@angular/core'; // <-- 1. SOLUCIÓN: Agregamos 'signal'
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
  private orderService = inject(OrderService); 
  
  // --- VARIABLES EXPUESTAS AL HTML ---
  cart = this.orderService.cart;
  subtotal = this.orderService.subtotal;
  total = this.orderService.total;
  
  categories = this.productService.categories;
  selectedCategory = this.productService.selectedCategory;
  filteredProducts = this.productService.filteredProducts;

  // --- VARIABLES DEL MODAL DE COBRO ---
  isModalOpen = signal(false);
  customerName = signal('');
  paymentMethod = signal('Efectivo'); 

  ngOnInit() {
    this.productService.getProducts('sociedad_selecta_001');
  }

  // --- FUNCIONES DEL MENÚ Y COMANDA ---
  onProductClick(product: Product) {
    this.orderService.addToCart(product);
  }

  onSelectCategory(category: string) {
    this.productService.setCategory(category);
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

 // --- VARIABLES DEL MODAL DE COBRO ---

  // --- FUNCIONES DEL MODAL DE COBRO ---
  openCheckoutModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.paymentMethod.set('Efectivo');
  }

  setPaymentMethod(method: string) {
    this.paymentMethod.set(method);
  }
  confirmCheckout() {
    // Solo mandamos el ID y el método de pago
    this.orderService.checkoutOrder('sociedad_selecta_001', this.paymentMethod());
    this.closeModal();
  }
}