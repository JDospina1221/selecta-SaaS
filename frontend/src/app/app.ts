import { Component, OnInit, inject, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { AuthService } from './services/auth.service';
import { AdminService } from './services/admin.service';
import { InventoryService } from './services/inventory.service';
import { Product } from './models/product.models';
import Chart from 'chart.js/auto';

@Component({ selector: 'app-root', standalone: true, imports: [CommonModule], templateUrl: './app.html' })
export class App implements OnInit {
  private productService = inject(ProductService); private orderService = inject(OrderService); 
  private authService = inject(AuthService); private adminService = inject(AdminService);
  private inventoryService = inject(InventoryService); 
  
  currentUser = this.authService.currentUser;

  inventoryItems = this.inventoryService.items;
  totalDrinks = computed(() => this.inventoryItems().filter(i => i.category === 'Bebidas').reduce((acc, curr) => acc + curr.stock, 0));
  totalIngredients = computed(() => this.inventoryItems().filter(i => i.category === 'Insumos').reduce((acc, curr) => acc + curr.stock, 0));
  isInvModalOpen = signal(false); editingInv = signal<any>(null); invName = signal(''); invCategory = signal('Insumos'); invStock = signal(0); invCost = signal(0); invUnit = signal('und');

  adminKpis = this.adminService.kpis; adminSales = this.adminService.sales; adminExpenses = this.adminService.expenses;
  adminProducts = this.adminService.products; 
  isAdminLoading = this.adminService.isLoading; adminCurrentView = signal('DASHBOARD'); salesPeriod = signal('all');
  adminMenuCategory = signal('Todos');
  
  // --- ESTADOS RESPONSIVE (MÓVILES) ---
  isSidebarOpen = signal(false);
  isCartOpen = signal(false);

  dashStartDate = signal(''); dashEndDate = signal(''); chartInstance: any = null;
  isDetailModalOpen = signal(false); detailType = signal(''); detailTitle = signal('');
  isExpenseModalOpen = signal(false); expenseDesc = signal(''); expenseAmount = signal(0); expenseCategory = signal('Insumos');
  validSales = computed(() => this.adminSales().filter(s => s.status !== 'Cancelado'));
  canceledSales = computed(() => this.adminSales().filter(s => s.status === 'Cancelado'));

  isEditProductModalOpen = signal(false); editingProduct = signal<any>(null); editPrice = signal(0); editRecipe = signal<any[]>([]); 
  isNewProdModalOpen = signal(false); newProdName = signal(''); newProdPrice = signal(0); newProdCategory = signal('Hamburguesas'); 

  loginEmail = signal(''); loginPin = signal(''); loginError = this.authService.loginError; cashierView = signal('POS'); 
  cart = this.orderService.cart; subtotal = this.orderService.subtotal; total = this.orderService.total;
  categories = this.productService.categories; selectedCategory = this.productService.selectedCategory; filteredProducts = this.productService.filteredProducts;
  isModalOpen = signal(false); paymentMethod = signal('Efectivo'); isReceiptModalOpen = signal(false); isReceiptLoading = signal(false); lastOrderTicket = signal<any>(null);
  activeOrders = this.orderService.activeOrders; isCancelModalOpen = signal(false); cancelingOrder = signal<any>(null); cancelReason = signal(''); cancelRefundMethod = signal('Efectivo');

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user?.role === 'CAJERO') { this.productService.getProducts(user.tenantId || 'sociedad_selecta_001'); this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001'); this.inventoryService.loadInventory(user.tenantId || 'sociedad_selecta_001'); }
      else if (user?.role === 'ADMIN') { if (!this.adminKpis()) this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001'); }
      const kpis = this.adminKpis(); if (kpis && kpis.dailyTrends && this.adminCurrentView() === 'DASHBOARD') setTimeout(() => this.renderChart(kpis.dailyTrends || []), 0);
    });
  }

  ngOnInit() {}

  // --- CONTROLES RESPONSIVE ---
  toggleSidebar() { this.isSidebarOpen.set(!this.isSidebarOpen()); }
  toggleCart() { this.isCartOpen.set(!this.isCartOpen()); }

  openEditProduct(product: any) { this.editingProduct.set(product); this.editPrice.set(product.price || 0); this.editRecipe.set(product.recipe ? [...product.recipe] : []); this.isEditProductModalOpen.set(true); }
  closeEditProduct() { this.isEditProductModalOpen.set(false); this.editingProduct.set(null); }
  addIngredientToRecipe(event: any) { const invName = event.target.value; if (!invName) return; const current = this.editRecipe(); if (!current.find(i => i.name === invName)) this.editRecipe.set([...current, { name: invName, qty: 1 }]); event.target.value = ''; }
  updateIngredientQty(index: number, event: any) { const current = [...this.editRecipe()]; current[index].qty = Number(event.target.value); this.editRecipe.set(current); }
  removeIngredient(index: number) { const current = [...this.editRecipe()]; current.splice(index, 1); this.editRecipe.set(current); }
  updateEditPrice(e: any) { this.editPrice.set(Number(e.target.value)); }
  saveProductChanges() { const product = this.editingProduct(); if (!product) return; this.adminService.updateProduct(product.id, { price: this.editPrice(), recipe: this.editRecipe() }).subscribe({ next: () => { this.adminService.loadProducts(this.currentUser()?.tenantId || 'sociedad_selecta_001'); this.closeEditProduct(); } }); }
  openNewProdModal() { this.newProdName.set(''); this.newProdPrice.set(0); this.newProdCategory.set('Hamburguesas'); this.isNewProdModalOpen.set(true); }
  closeNewProdModal() { this.isNewProdModalOpen.set(false); }
  updateNewProdName(e: any) { this.newProdName.set(e.target.value); } updateNewProdPrice(e: any) { this.newProdPrice.set(Number(e.target.value)); } updateNewProdCategory(e: any) { this.newProdCategory.set(e.target.value); }
  saveNewProduct() { const user = this.currentUser(); if (!user || !this.newProdName() || this.newProdPrice() <= 0) return alert('Llene todos los datos.'); const payload = { tenantId: user.tenantId || 'sociedad_selecta_001', name: this.newProdName(), category: this.newProdCategory(), price: this.newProdPrice() }; this.adminService.addProduct(payload).subscribe({ next: () => { this.adminService.loadProducts(payload.tenantId); this.closeNewProdModal(); } }); }
  deleteProduct(id: string) { if (confirm('¿Eliminar este producto?')) { this.adminService.deleteProduct(id).subscribe({ next: () => { this.adminService.loadProducts(this.currentUser()?.tenantId || 'sociedad_selecta_001'); } }); } }

  openInvModal(item?: any) { if (item) { this.editingInv.set(item); this.invName.set(item.name); this.invCategory.set(item.category); this.invStock.set(item.stock); this.invCost.set(item.cost); this.invUnit.set(item.unit || 'und'); } else { this.editingInv.set(null); this.invName.set(''); this.invCategory.set('Insumos'); this.invStock.set(0); this.invCost.set(0); this.invUnit.set('und'); } this.isInvModalOpen.set(true); }
  closeInvModal() { this.isInvModalOpen.set(false); } updateInvName(e: any) { this.invName.set(e.target.value); } updateInvCategory(e: any) { this.invCategory.set(e.target.value); } updateInvStock(e: any) { this.invStock.set(Number(e.target.value)); } updateInvCost(e: any) { this.invCost.set(Number(e.target.value)); } updateInvUnit(e: any) { this.invUnit.set(e.target.value); }
  saveInventory() { const user = this.currentUser(); if (!user || !this.invName()) return; const payload = { tenantId: user.tenantId || 'sociedad_selecta_001', name: this.invName(), category: this.invCategory(), stock: this.invStock(), cost: this.invCost(), unit: this.invUnit() }; if (this.editingInv()) this.inventoryService.updateInventoryItem(this.editingInv().id, payload).subscribe(() => { this.inventoryService.loadInventory(payload.tenantId); this.closeInvModal(); }); else this.inventoryService.addInventoryItem(payload).subscribe(() => { this.inventoryService.loadInventory(payload.tenantId); this.closeInvModal(); }); }

  setCashierView(view: string) { this.cashierView.set(view); const user = this.currentUser(); if (view === 'ORDERS' && user) this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001'); if (view === 'INVENTORY' && user) this.inventoryService.loadInventory(user.tenantId || 'sociedad_selecta_001'); }
  markAsDelivered(orderId: string) { this.orderService.updateOrderStatus(orderId, 'Entregado').subscribe(() => { this.orderService.loadActiveOrders(this.currentUser()?.tenantId || 'sociedad_selecta_001'); }); } openCancelModal(order: any) { this.cancelingOrder.set(order); this.cancelReason.set(''); this.cancelRefundMethod.set(order.paymentMethod); this.isCancelModalOpen.set(true); } closeCancelModal() { this.isCancelModalOpen.set(false); this.cancelingOrder.set(null); } updateCancelReason(e: any) { this.cancelReason.set(e.target.value); } updateCancelRefundMethod(e: any) { this.cancelRefundMethod.set(e.target.value); } confirmCancelOrder() { if (!this.cancelReason()) return alert('Indicar motivo'); this.orderService.updateOrderStatus(this.cancelingOrder().id, 'Cancelado', this.cancelReason(), this.cancelRefundMethod()).subscribe(() => { this.orderService.loadActiveOrders(this.currentUser()?.tenantId || 'sociedad_selecta_001'); this.closeCancelModal(); }); }
  updateLoginEmail(e: any) { this.loginEmail.set(e.target.value); } updateLoginPin(e: any) { this.loginPin.set(e.target.value); } onLogin() { this.authService.login(this.loginEmail(), this.loginPin()); this.loginEmail.set(''); this.loginPin.set(''); } onLogout() { this.authService.logout(); this.orderService.clearCart(); } onProductClick(product: Product) { this.orderService.addToCart(product); } onSelectCategory(category: string) { this.productService.setCategory(category); } onRemoveItem(productId: string) { this.orderService.removeItem(productId); } onClearOrder() { this.orderService.clearCart(); } onUpdateQuantity(productId: string, delta: number) { this.orderService.updateQuantity(productId, delta); } 
  openCheckoutModal() { this.isModalOpen.set(true); this.isCartOpen.set(false); } // Cierra carrito al cobrar en móvil
  closeModal() { this.isModalOpen.set(false); this.paymentMethod.set('Efectivo'); } setPaymentMethod(method: string) { this.paymentMethod.set(method); }
  confirmCheckout() { const user = this.currentUser(); if (!user) return; this.closeModal(); this.isReceiptLoading.set(true); this.isReceiptModalOpen.set(true); this.orderService.checkoutOrder(user.tenantId || 'sociedad_selecta_001', this.paymentMethod()).subscribe({ next: (response: any) => { setTimeout(() => { this.lastOrderTicket.set({ orderNumber: response.orderNumber, date: new Date(), items: [...this.cart()], subtotal: this.subtotal(), total: this.total(), paymentMethod: this.paymentMethod() }); this.isReceiptLoading.set(false); this.orderService.clearCart(); this.orderService.loadActiveOrders(user.tenantId || 'sociedad_selecta_001'); }, 1200); }, error: (err) => { alert('Error con Firebase.'); this.isReceiptModalOpen.set(false); this.isReceiptLoading.set(false); } }); }
  printTicket() { window.print(); } closeReceipt() { this.isReceiptModalOpen.set(false); this.lastOrderTicket.set(null); this.orderService.clearCart(); }

  setAdminView(view: string) {
    this.adminCurrentView.set(view); 
    this.isSidebarOpen.set(false); // Cierra el menú al navegar en móvil
    const user = this.currentUser(); if (!user) return;
    if (view === 'REPORTS' || view === 'CANCELED') this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', this.salesPeriod());
    else if (view === 'DASHBOARD') { this.dashStartDate.set(''); this.dashEndDate.set(''); this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001'); }
    else if (view === 'INVENTORY') this.inventoryService.loadInventory(user.tenantId || 'sociedad_selecta_001');
    else if (view === 'MENU') { this.adminService.loadProducts(user.tenantId || 'sociedad_selecta_001'); this.inventoryService.loadInventory(user.tenantId || 'sociedad_selecta_001'); } 
    else if (view === 'FINANCE') this.adminService.loadExpenses(user.tenantId || 'sociedad_selecta_001');
  }
  onChangeSalesPeriod(event: any) { const period = event.target.value; this.salesPeriod.set(period); const user = this.currentUser(); if (user) this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', period); } updateDashStart(e: any) { this.dashStartDate.set(e.target.value); } updateDashEnd(e: any) { this.dashEndDate.set(e.target.value); } applyDashboardFilter() { const user = this.currentUser(); if (!user) return; this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001', this.dashStartDate(), this.dashEndDate()); } clearDashboardFilter() { this.dashStartDate.set(''); this.dashEndDate.set(''); const user = this.currentUser(); if (user) this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001'); } openDetailModal(type: string) { this.detailType.set(type); if (type === 'REVENUE') this.detailTitle.set('Desglose de Ingresos'); else if (type === 'COGS') this.detailTitle.set('Desglose de Costos'); else if (type === 'EXPENSES') this.detailTitle.set('Desglose de Egresos'); this.isDetailModalOpen.set(true); } closeDetailModal() { this.isDetailModalOpen.set(false); } openExpenseModal() { this.expenseDesc.set(''); this.expenseAmount.set(0); this.expenseCategory.set('Insumos'); this.isExpenseModalOpen.set(true); } closeExpenseModal() { this.isExpenseModalOpen.set(false); } updateExpenseDesc(e: any) { this.expenseDesc.set(e.target.value); } updateExpenseAmount(e: any) { this.expenseAmount.set(Number(e.target.value)); } updateExpenseCategory(e: any) { this.expenseCategory.set(e.target.value); } saveExpense() { const user = this.currentUser(); if (!user || !this.expenseDesc() || this.expenseAmount() <= 0) return alert('Llene datos.'); const payload = { tenantId: user.tenantId || 'sociedad_selecta_001', description: this.expenseDesc(), amount: this.expenseAmount(), category: this.expenseCategory() }; this.adminService.addExpense(payload).subscribe({ next: () => { this.adminService.loadExpenses(payload.tenantId); this.closeExpenseModal(); } }); }
  renderChart(trends: any[]) { const canvas = document.getElementById('trendChart') as HTMLCanvasElement; if (!canvas) return; if (this.chartInstance) this.chartInstance.destroy(); this.chartInstance = new Chart(canvas, { type: 'line', data: { labels: trends.map(t => t.date), datasets: [ { label: 'Ingresos Brutos ($)', data: trends.map(t => t.revenue), borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.1)', fill: true, tension: 0.4 }, { label: 'Ganancia Neta ($)', data: trends.map(t => t.profit), borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', fill: true, tension: 0.4 } ] }, options: { responsive: true, maintainAspectRatio: false } }); }
}