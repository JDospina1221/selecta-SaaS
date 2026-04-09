import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';

import { CheckoutModalComponent } from '../../shared/components/checkout-modal.component';
import { ReceiptModalComponent } from '../../shared/components/receipt-modal.component';
import { FeatureFlagService } from '../../services/feature-flag.service';

@Component({
  selector: 'app-cashier-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, CheckoutModalComponent, ReceiptModalComponent],
  templateUrl: './cashier-layout.html'
})
export class CashierLayoutComponent implements OnInit {
  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  public authService = inject(AuthService);
  public featureService = inject(FeatureFlagService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;

  // ░░ Sidebar (igual que admin) ░░
  isSidebarOpen = signal(false);
  isUserMenuOpen = signal(false);
  toggleSidebar() { this.isSidebarOpen.set(!this.isSidebarOpen()); }
  closeSidebar() { this.isSidebarOpen.set(false); }

  // ░░ Carrito ░░
  isCartOpen = signal(false);
  cart = this.orderService.cart;
  subtotal = this.orderService.subtotal;
  total = this.orderService.total;

  // ░░ Modales ░░
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

  // Carrito
  toggleCart() { this.isCartOpen.set(!this.isCartOpen()); }
  onProductClick(product: any) { this.orderService.addToCart(product); }
  onRemoveItem(productId: string) { this.orderService.removeItem(productId); }
  onClearOrder() { this.orderService.clearCart(); }
  onUpdateQuantity(productId: string, delta: number) { this.orderService.updateQuantity(productId, delta); }

  // Flujo de cobro
  openCheckoutModal() {
    this.isModalOpen.set(true);
    this.isCartOpen.set(false);
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
      error: () => {
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

  onLogout() {
    this.authService.logout();
    this.orderService.clearCart();
    this.router.navigate(['/login']);
  }
}