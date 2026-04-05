import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

// Importamos los modales compartidos
import { CheckoutModalComponent } from '../../shared/components/checkout-modal.component';
import { ReceiptModalComponent } from '../../shared/components/receipt-modal.component';

@Component({ 
  selector: 'app-cashier-layout', 
  standalone: true, 
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, CheckoutModalComponent, ReceiptModalComponent], 
  templateUrl: './cashier-layout.html' 
})
export class CashierLayoutComponent implements OnInit {
  private productService = inject(ProductService); 
  private orderService = inject(OrderService); 
  private authService = inject(AuthService); 
  private router = inject(Router);
  
  currentUser = this.authService.currentUser;
  
  // Estados de la vista y el carrito
  cashierView = signal('POS'); 
  isCartOpen = signal(false);
  cart = this.orderService.cart; 
  subtotal = this.orderService.subtotal; 
  total = this.orderService.total;
  
  // Estados de los Modales Compartidos
  isModalOpen = signal(false); 
  isReceiptModalOpen = signal(false); 
  isReceiptLoading = signal(false); 
  lastOrderTicket = signal<any>(null);

  constructor() { 
    effect(() => { 
      const user = this.currentUser(); 
      if (user?.role === 'CAJERO') { 
        this.productService.getProducts(user.tenantId || 'sociedad_selecta_001'); 
      } 
    }); 
  }
  
  ngOnInit() {}

  // Controles de la vista
  toggleCart() { this.isCartOpen.set(!this.isCartOpen()); }
  setCashierView(view: string) { this.cashierView.set(view); }
  
  // Acciones del Carrito
  onProductClick(product: any) { this.orderService.addToCart(product); } 
  onRemoveItem(productId: string) { this.orderService.removeItem(productId); } 
  onClearOrder() { this.orderService.clearCart(); } 
  onUpdateQuantity(productId: string, delta: number) { this.orderService.updateQuantity(productId, delta); }
  
  // Flujo de Cobro
  openCheckoutModal() { 
    this.isModalOpen.set(true); 
    if (typeof this.isCartOpen !== 'undefined') this.isCartOpen.set(false); 
  } 
  
  closeModal() { this.isModalOpen.set(false); } 
  
  confirmCheckout(selectedPaymentMethod: string) { 
    const user = this.currentUser(); 
    if (!user) return; 
    
    this.closeModal(); 
    this.isReceiptLoading.set(true); 
    this.isReceiptModalOpen.set(true); 
    
    this.orderService.checkoutOrder(user.tenantId || 'sociedad_selecta_001', selectedPaymentMethod).subscribe({ 
      next: (response: any) => { 
        setTimeout(() => { 
          this.lastOrderTicket.set({ 
            orderNumber: response.orderNumber, 
            date: new Date(), 
            items: [...this.cart()], 
            subtotal: this.subtotal(), 
            total: this.total(), 
            paymentMethod: selectedPaymentMethod 
          }); 
          this.isReceiptLoading.set(false); 
          this.orderService.clearCart(); 
        }, 1200); 
      }, 
      error: (err) => { 
        alert('Error conectando con Firebase.'); 
        this.isReceiptModalOpen.set(false); 
        this.isReceiptLoading.set(false); 
      } 
    }); 
  }
  
  closeReceipt() { 
    this.isReceiptModalOpen.set(false); 
    this.lastOrderTicket.set(null); 
    this.orderService.clearCart(); 
  }

  // Sesión
  onLogout() { 
    this.authService.logout(); 
    this.orderService.clearCart(); 
    this.router.navigate(['/login']); 
  } 
}