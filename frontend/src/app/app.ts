import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { AuthService } from './services/auth.service';
import { Product } from './models/product.models';
import { AdminService } from './services/admin.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html'
})
export class App implements OnInit {
  private productService = inject(ProductService);
  private orderService = inject(OrderService); 
  private authService = inject(AuthService); 
  private adminService = inject(AdminService);
  
  currentUser = this.authService.currentUser;

  // --- VARIABLES ADMIN ---
  adminKpis = this.adminService.kpis;
  adminSales = this.adminService.sales; 
  adminProducts = this.adminService.products; 
  adminExpenses = this.adminService.expenses;
  isAdminLoading = this.adminService.isLoading;
  adminCurrentView = signal('DASHBOARD');
  salesPeriod = signal('all');
  dashStartDate = signal(''); dashEndDate = signal('');
  chartInstance: any = null;
  isDetailModalOpen = signal(false); detailType = signal(''); detailTitle = signal('');
  isEditProductModalOpen = signal(false); editingProduct = signal<any>(null); editPrice = signal(0); editCost = signal(0); editStock = signal(0);
  isExpenseModalOpen = signal(false); expenseDesc = signal(''); expenseAmount = signal(0); expenseCategory = signal('Insumos');

  // Filtros Calculados para Reportes Admin
  validSales = computed(() => this.adminSales().filter(s => s.status !== 'Cancelado'));
  canceledSales = computed(() => this.adminSales().filter(s => s.status === 'Cancelado'));

  // --- VARIABLES CAJERO ---
  loginEmail = signal(''); loginPin = signal(''); loginError = this.authService.loginError;
  cashierView = signal('POS'); // <-- NUEVA: Controla si está en caja o gestión
  cart = this.orderService.cart; subtotal = this.orderService.subtotal; total = this.orderService.total;
  categories = this.productService.categories; selectedCategory = this.productService.selectedCategory; filteredProducts = this.productService.filteredProducts;
  isModalOpen = signal(false); paymentMethod = signal('Efectivo'); 
  isReceiptModalOpen = signal(false); isReceiptLoading = signal(false); lastOrderTicket = signal<any>(null);
  
  // Variables Gestión de Órdenes
  activeOrders = this.orderService.activeOrders;
  isCancelModalOpen = signal(false); cancelingOrder = signal<any>(null); cancelReason = signal(''); cancelRefundMethod = signal('Efectivo');

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user?.role === 'CAJERO') {
        this.productService.getProducts(user.tenantId || 'sociedad_selecta_001');
        this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001');
      }
      else if (user?.role === 'ADMIN') {
        if (!this.adminKpis()) this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001');
      }

      const kpis = this.adminKpis();
      if (kpis && kpis.dailyTrends && this.adminCurrentView() === 'DASHBOARD') {
        setTimeout(() => this.renderChart(kpis.dailyTrends || []), 0);
      }
    });
  }

  ngOnInit() {}

  // --- NAVEGACIÓN CAJERO ---
  setCashierView(view: string) {
    this.cashierView.set(view);
    const user = this.currentUser();
    if (view === 'ORDERS' && user) this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001');
  }

  // --- ACCIONES ÓRDENES CAJERO ---
  markAsDelivered(orderId: string) {
    this.orderService.updateOrderStatus(orderId, 'Entregado').subscribe(() => {
      this.orderService.loadActiveOrders(this.currentUser()?.tenantId || 'sociedad_selecta_001');
    });
  }
  openCancelModal(order: any) { this.cancelingOrder.set(order); this.cancelReason.set(''); this.cancelRefundMethod.set(order.paymentMethod); this.isCancelModalOpen.set(true); }
  closeCancelModal() { this.isCancelModalOpen.set(false); this.cancelingOrder.set(null); }
  updateCancelReason(e: any) { this.cancelReason.set(e.target.value); }
  updateCancelRefundMethod(e: any) { this.cancelRefundMethod.set(e.target.value); }
  
  confirmCancelOrder() {
    if (!this.cancelReason()) return alert('Debe indicar un motivo');
    this.orderService.updateOrderStatus(this.cancelingOrder().id, 'Cancelado', this.cancelReason(), this.cancelRefundMethod()).subscribe(() => {
      this.orderService.loadActiveOrders(this.currentUser()?.tenantId || 'sociedad_selecta_001');
      this.closeCancelModal();
    });
  }

  // --- CAJERO BASE ---
  updateLoginEmail(e: any) { this.loginEmail.set(e.target.value); }
  updateLoginPin(e: any) { this.loginPin.set(e.target.value); }
  onLogin() { this.authService.login(this.loginEmail(), this.loginPin()); this.loginEmail.set(''); this.loginPin.set(''); }
  onLogout() { this.authService.logout(); this.orderService.clearCart(); }
  onProductClick(product: Product) { this.orderService.addToCart(product); }
  onSelectCategory(category: string) { this.productService.setCategory(category); }
  onRemoveItem(productId: string) { this.orderService.removeItem(productId); }
  onClearOrder() { this.orderService.clearCart(); }
  onUpdateQuantity(productId: string, delta: number) { this.orderService.updateQuantity(productId, delta); }
  openCheckoutModal() { this.isModalOpen.set(true); }
  closeModal() { this.isModalOpen.set(false); this.paymentMethod.set('Efectivo'); }
  setPaymentMethod(method: string) { this.paymentMethod.set(method); }
  
  confirmCheckout() {
    const user = this.currentUser();
    if (!user) return;
    this.closeModal(); this.isReceiptLoading.set(true); this.isReceiptModalOpen.set(true);
    this.orderService.checkoutOrder(user.tenantId || 'sociedad_selecta_001', this.paymentMethod()).subscribe({
      next: (response: any) => {
        setTimeout(() => {
          this.lastOrderTicket.set({ orderNumber: response.orderNumber, date: new Date(), items: [...this.cart()], subtotal: this.subtotal(), total: this.total(), paymentMethod: this.paymentMethod() });
          this.isReceiptLoading.set(false); this.orderService.clearCart();
          this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001'); // Refrescar lista de órdenes
        }, 1200); 
      },
      error: (err) => { alert('Error con Firebase.'); this.isReceiptModalOpen.set(false); this.isReceiptLoading.set(false); }
    });
  }
  printTicket() { window.print(); }
  closeReceipt() { this.isReceiptModalOpen.set(false); this.lastOrderTicket.set(null); this.orderService.clearCart(); }

  // --- ADMIN BASE ---
  setAdminView(view: string) {
    this.adminCurrentView.set(view);
    const user = this.currentUser();
    if (!user) return;
    if (view === 'REPORTS' || view === 'CANCELED') this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', this.salesPeriod());
    else if (view === 'DASHBOARD') { this.dashStartDate.set(''); this.dashEndDate.set(''); this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001'); }
    else if (view === 'INVENTORY') this.adminService.loadProducts(user.tenantId || 'sociedad_selecta_001'); 
    else if (view === 'FINANCE') this.adminService.loadExpenses(user.tenantId || 'sociedad_selecta_001');
  }
  onChangeSalesPeriod(event: any) {
    const period = event.target.value; this.salesPeriod.set(period);
    const user = this.currentUser();
    if (user) this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', period);
  }
  updateDashStart(e: any) { this.dashStartDate.set(e.target.value); }
  updateDashEnd(e: any) { this.dashEndDate.set(e.target.value); }
  applyDashboardFilter() {
    const user = this.currentUser(); if (!user) return;
    this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001', this.dashStartDate(), this.dashEndDate());
  }
  clearDashboardFilter() {
    this.dashStartDate.set(''); this.dashEndDate.set('');
    const user = this.currentUser(); if (user) this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001');
  }
  openDetailModal(type: string) {
    this.detailType.set(type);
    if (type === 'REVENUE') this.detailTitle.set('Desglose de Ingresos por Producto');
    else if (type === 'COGS') this.detailTitle.set('Desglose de Costos de Insumos');
    else if (type === 'EXPENSES') this.detailTitle.set('Desglose de Caja Menor (Egresos)');
    this.isDetailModalOpen.set(true);
  }
  closeDetailModal() { this.isDetailModalOpen.set(false); }
  openEditProduct(product: any) { this.editingProduct.set(product); this.editPrice.set(product.price || 0); this.editCost.set(product.cost || 0); this.editStock.set(product.stock || 0); this.isEditProductModalOpen.set(true); }
  closeEditProduct() { this.isEditProductModalOpen.set(false); this.editingProduct.set(null); }
  updateEditPrice(e: any) { this.editPrice.set(Number(e.target.value)); }
  updateEditCost(e: any) { this.editCost.set(Number(e.target.value)); }
  updateEditStock(e: any) { this.editStock.set(Number(e.target.value)); }
  saveProductChanges() {
    const product = this.editingProduct(); if (!product) return;
    this.adminService.updateProduct(product.id, { price: this.editPrice(), cost: this.editCost(), stock: this.editStock() }).subscribe({
      next: () => { this.adminService.loadProducts(this.currentUser()?.tenantId || 'sociedad_selecta_001'); this.closeEditProduct(); }
    });
  }
  openExpenseModal() { this.expenseDesc.set(''); this.expenseAmount.set(0); this.expenseCategory.set('Insumos'); this.isExpenseModalOpen.set(true); }
  closeExpenseModal() { this.isExpenseModalOpen.set(false); }
  updateExpenseDesc(e: any) { this.expenseDesc.set(e.target.value); }
  updateExpenseAmount(e: any) { this.expenseAmount.set(Number(e.target.value)); }
  updateExpenseCategory(e: any) { this.expenseCategory.set(e.target.value); }
  saveExpense() {
    const user = this.currentUser();
    if (!user || !this.expenseDesc() || this.expenseAmount() <= 0) return alert('Llene datos.');
    const payload = { tenantId: user.tenantId || 'sociedad_selecta_001', description: this.expenseDesc(), amount: this.expenseAmount(), category: this.expenseCategory() };
    this.adminService.addExpense(payload).subscribe({
      next: () => { this.adminService.loadExpenses(payload.tenantId); this.closeExpenseModal(); }
    });
  }
  renderChart(trends: any[]) {
    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) return;
    if (this.chartInstance) this.chartInstance.destroy();
    this.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: trends.map(t => t.date),
        datasets: [
          { label: 'Ingresos Brutos ($)', data: trends.map(t => t.revenue), borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4 },
          { label: 'Ganancia Neta ($)', data: trends.map(t => t.profit), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}