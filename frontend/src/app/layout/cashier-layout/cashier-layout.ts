import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { InventoryService } from '../../services/inventory.service';

@Component({ selector: 'app-cashier-layout', 
  standalone: true, 
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], 
  templateUrl: './cashier-layout.html' })
export class CashierLayoutComponent implements OnInit {
  private productService = inject(ProductService); private orderService = inject(OrderService); 
  private authService = inject(AuthService); private inventoryService = inject(InventoryService); 
  private router = inject(Router);
  
  currentUser = this.authService.currentUser;
  inventoryItems = this.inventoryService.items;
  totalDrinks = computed(() => this.inventoryItems().filter(i => i.category === 'Bebidas').reduce((acc, curr) => acc + curr.stock, 0));
  totalIngredients = computed(() => this.inventoryItems().filter(i => i.category === 'Insumos').reduce((acc, curr) => acc + curr.stock, 0));
  isInvModalOpen = signal(false); editingInv = signal<any>(null); invName = signal(''); invCategory = signal('Insumos'); invStock = signal(0); invCost = signal(0); invUnit = signal('und');

  cashierView = signal('POS'); isCartOpen = signal(false);
  cart = this.orderService.cart; subtotal = this.orderService.subtotal; total = this.orderService.total;
  categories = this.productService.categories; selectedCategory = this.productService.selectedCategory; filteredProducts = this.productService.filteredProducts;
  isModalOpen = signal(false); paymentMethod = signal('Efectivo'); isReceiptModalOpen = signal(false); isReceiptLoading = signal(false); lastOrderTicket = signal<any>(null);
  activeOrders = this.orderService.activeOrders; isCancelModalOpen = signal(false); cancelingOrder = signal<any>(null); cancelReason = signal(''); cancelRefundMethod = signal('Efectivo');

  constructor() { effect(() => { const user = this.currentUser(); if (user?.role === 'CAJERO') { this.productService.getProducts(user.tenantId || 'sociedad_selecta_001'); this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001'); this.inventoryService.loadInventory(user.tenantId || 'sociedad_selecta_001'); } }); }
  ngOnInit() {}

  toggleCart() { this.isCartOpen.set(!this.isCartOpen()); }
  setCashierView(view: string) { this.cashierView.set(view); const user = this.currentUser(); if (view === 'ORDERS' && user) this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001'); if (view === 'INVENTORY' && user) this.inventoryService.loadInventory(user.tenantId || 'sociedad_selecta_001'); }
  markAsDelivered(orderId: string) { this.orderService.updateOrderStatus(orderId, 'Entregado').subscribe(() => { this.orderService.loadActiveOrders(this.currentUser()?.tenantId || 'sociedad_selecta_001'); }); } openCancelModal(order: any) { this.cancelingOrder.set(order); this.cancelReason.set(''); this.cancelRefundMethod.set(order.paymentMethod); this.isCancelModalOpen.set(true); } closeCancelModal() { this.isCancelModalOpen.set(false); this.cancelingOrder.set(null); } updateCancelReason(e: any) { this.cancelReason.set(e.target.value); } updateCancelRefundMethod(e: any) { this.cancelRefundMethod.set(e.target.value); } confirmCancelOrder() { if (!this.cancelReason()) return alert('Indicar motivo'); this.orderService.updateOrderStatus(this.cancelingOrder().id, 'Cancelado', this.cancelReason(), this.cancelRefundMethod()).subscribe(() => { this.orderService.loadActiveOrders(this.currentUser()?.tenantId || 'sociedad_selecta_001'); this.closeCancelModal(); }); }
  onLogout() { this.authService.logout(); this.orderService.clearCart(); this.router.navigate(['/login']); } onProductClick(product: any) { this.orderService.addToCart(product); } onSelectCategory(category: string) { this.productService.setCategory(category); } onRemoveItem(productId: string) { this.orderService.removeItem(productId); } onClearOrder() { this.orderService.clearCart(); } onUpdateQuantity(productId: string, delta: number) { this.orderService.updateQuantity(productId, delta); }
  openCheckoutModal() { this.isModalOpen.set(true); if (typeof this.isCartOpen !== 'undefined') this.isCartOpen.set(false); } closeModal() { this.isModalOpen.set(false); this.paymentMethod.set('Efectivo'); } setPaymentMethod(method: string) { this.paymentMethod.set(method); }
  confirmCheckout() { const user = this.currentUser(); if (!user) return; this.closeModal(); this.isReceiptLoading.set(true); this.isReceiptModalOpen.set(true); this.orderService.checkoutOrder(user.tenantId || 'sociedad_selecta_001', this.paymentMethod()).subscribe({ next: (response: any) => { setTimeout(() => { this.lastOrderTicket.set({ orderNumber: response.orderNumber, date: new Date(), items: [...this.cart()], subtotal: this.subtotal(), total: this.total(), paymentMethod: this.paymentMethod() }); this.isReceiptLoading.set(false); this.orderService.clearCart(); this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001'); }, 1200); }, error: (err) => { alert('Error con Firebase.'); this.isReceiptModalOpen.set(false); this.isReceiptLoading.set(false); } }); }
  printTicket() { window.print(); } closeReceipt() { this.isReceiptModalOpen.set(false); this.lastOrderTicket.set(null); this.orderService.clearCart(); }
  openInvModal(item?: any) { if (item) { this.editingInv.set(item); this.invName.set(item.name); this.invCategory.set(item.category); this.invStock.set(item.stock); this.invCost.set(item.cost); this.invUnit.set(item.unit || 'und'); } else { this.editingInv.set(null); this.invName.set(''); this.invCategory.set('Insumos'); this.invStock.set(0); this.invCost.set(0); this.invUnit.set('und'); } this.isInvModalOpen.set(true); } closeInvModal() { this.isInvModalOpen.set(false); } updateInvName(e: any) { this.invName.set(e.target.value); } updateInvCategory(e: any) { this.invCategory.set(e.target.value); } updateInvStock(e: any) { this.invStock.set(Number(e.target.value)); } updateInvCost(e: any) { this.invCost.set(Number(e.target.value)); } updateInvUnit(e: any) { this.invUnit.set(e.target.value); } saveInventory() { const user = this.currentUser(); if (!user || !this.invName()) return; const payload = { tenantId: user.tenantId || 'sociedad_selecta_001', name: this.invName(), category: this.invCategory(), stock: this.invStock(), cost: this.invCost(), unit: this.invUnit() }; if (this.editingInv()) this.inventoryService.updateInventoryItem(this.editingInv().id, payload).subscribe(() => { this.inventoryService.loadInventory(payload.tenantId); this.closeInvModal(); }); else this.inventoryService.addInventoryItem(payload).subscribe(() => { this.inventoryService.loadInventory(payload.tenantId); this.closeInvModal(); }); }
}