import chart from 'chart.js/auto'; 
import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { AuthService } from './services/auth.service';
import { Product } from './models/product.models';
import { AdminService } from './services/admin.service';

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

  // --- VARIABLES DASHBOARD ADMIN ---
  adminKpis = this.adminService.kpis;
  adminSales = this.adminService.sales; 
  adminProducts = this.adminService.products; 
  adminExpenses = this.adminService.expenses;
  isAdminLoading = this.adminService.isLoading;
  adminCurrentView = signal('DASHBOARD');
  salesPeriod = signal('all');
  dashStartDate = signal('');
  dashEndDate = signal('');
  chartInstance: any = null; // Para guardar la instancia del gráfico y poder destruirlo antes de crear uno nuevo

  // --- VARIABLES MODAL DRILL-DOWN (DASHBOARD) ---
  isDetailModalOpen = signal(false);
  detailType = signal(''); 
  detailTitle = signal('');

  // --- VARIABLES MODALES INVENTARIO Y FINANZAS ---
  isEditProductModalOpen = signal(false);
  editingProduct = signal<any>(null);
  editPrice = signal(0);
  editCost = signal(0);
  editStock = signal(0);

  isExpenseModalOpen = signal(false);
  expenseDesc = signal('');
  expenseAmount = signal(0);
  expenseCategory = signal('Insumos');

  // --- VARIABLES CAJERO ---
  loginEmail = signal('');
  loginPin = signal('');
  loginError = this.authService.loginError;
  cart = this.orderService.cart;
  subtotal = this.orderService.subtotal;
  total = this.orderService.total;
  categories = this.productService.categories;
  selectedCategory = this.productService.selectedCategory;
  filteredProducts = this.productService.filteredProducts;
  isModalOpen = signal(false);
  paymentMethod = signal('Efectivo'); 

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user?.role === 'CAJERO') this.productService.getProducts(user.tenantId || 'sociedad_selecta_001');
      else if (user?.role === 'ADMIN') {
        // Solo carga si es primera vez (para no hacer loops infinitos con el chart)
        if (!this.adminKpis()) this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001');
      }

      // --- NUEVO: Dibuja la gráfica cuando hay datos ---
      const kpis = this.adminKpis();
      if (kpis && kpis.dailyTrends && this.adminCurrentView() === 'DASHBOARD') {
        // Esperamos un milisegundo a que Angular pinte el HTML antes de graficar
        setTimeout(() => this.renderChart(kpis.dailyTrends || []), 0);
      }
    });
  }

  ngOnInit() {}

  // --- NAVEGACIÓN Y FILTROS ADMIN ---
  setAdminView(view: string) {
    this.adminCurrentView.set(view);
    const user = this.currentUser();
    if (!user) return;

    if (view === 'REPORTS') this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', this.salesPeriod());
    else if (view === 'DASHBOARD') {
      this.dashStartDate.set('');
      this.dashEndDate.set('');
      this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001');
    }
    else if (view === 'INVENTORY') this.adminService.loadProducts(user.tenantId || 'sociedad_selecta_001'); 
    else if (view === 'FINANCE') this.adminService.loadExpenses(user.tenantId || 'sociedad_selecta_001');
  }

  onChangeSalesPeriod(event: any) {
    const period = event.target.value;
    this.salesPeriod.set(period);
    const user = this.currentUser();
    if (user) this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', period);
  }

  updateDashStart(e: any) { this.dashStartDate.set(e.target.value); }
  updateDashEnd(e: any) { this.dashEndDate.set(e.target.value); }

  applyDashboardFilter() {
    const user = this.currentUser();
    if (!user) return;
    if (this.dashStartDate() && this.dashEndDate() && this.dashStartDate() > this.dashEndDate()) {
      alert('Manito, la fecha de inicio no puede ser mayor a la final.');
      return;
    }
    this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001', this.dashStartDate(), this.dashEndDate());
  }

  clearDashboardFilter() {
    this.dashStartDate.set('');
    this.dashEndDate.set('');
    const user = this.currentUser();
    if (user) this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001');
  }

  // --- FUNCIONES MODAL DETALLES DASHBOARD (DRILL-DOWN) ---
  openDetailModal(type: string) {
    this.detailType.set(type);
    if (type === 'REVENUE') this.detailTitle.set('Desglose de Ingresos por Producto');
    else if (type === 'COGS') this.detailTitle.set('Desglose de Costos de Insumos');
    else if (type === 'EXPENSES') this.detailTitle.set('Desglose de Caja Menor (Egresos)');
    this.isDetailModalOpen.set(true);
  }
  closeDetailModal() { this.isDetailModalOpen.set(false); }

  // --- FUNCIONES INVENTARIO ---
  openEditProduct(product: any) {
    this.editingProduct.set(product);
    this.editPrice.set(product.price || 0);
    this.editCost.set(product.cost || 0);
    this.editStock.set(product.stock || 0);
    this.isEditProductModalOpen.set(true);
  }
  closeEditProduct() { this.isEditProductModalOpen.set(false); this.editingProduct.set(null); }
  updateEditPrice(e: any) { this.editPrice.set(Number(e.target.value)); }
  updateEditCost(e: any) { this.editCost.set(Number(e.target.value)); }
  updateEditStock(e: any) { this.editStock.set(Number(e.target.value)); }
  saveProductChanges() {
    const product = this.editingProduct();
    if (!product) return;
    const payload = { price: this.editPrice(), cost: this.editCost(), stock: this.editStock() };
    this.adminService.updateProduct(product.id, payload).subscribe({
      next: () => {
        const user = this.currentUser();
        this.adminService.loadProducts(user?.tenantId || 'sociedad_selecta_001');
        this.closeEditProduct();
      },
      error: (err) => console.error('Error guardando producto:', err)
    });
  }

  // --- FUNCIONES FINANZAS ---
  openExpenseModal() { this.expenseDesc.set(''); this.expenseAmount.set(0); this.expenseCategory.set('Insumos'); this.isExpenseModalOpen.set(true); }
  closeExpenseModal() { this.isExpenseModalOpen.set(false); }
  updateExpenseDesc(e: any) { this.expenseDesc.set(e.target.value); }
  updateExpenseAmount(e: any) { this.expenseAmount.set(Number(e.target.value)); }
  updateExpenseCategory(e: any) { this.expenseCategory.set(e.target.value); }
  saveExpense() {
    const user = this.currentUser();
    if (!user || !this.expenseDesc() || this.expenseAmount() <= 0) return alert('Llene bien la descripción y el monto.');
    const payload = { tenantId: user.tenantId || 'sociedad_selecta_001', description: this.expenseDesc(), amount: this.expenseAmount(), category: this.expenseCategory() };
    this.adminService.addExpense(payload).subscribe({
      next: () => { this.adminService.loadExpenses(payload.tenantId); this.closeExpenseModal(); },
      error: (err) => console.error('Error guardando gasto:', err)
    });
  }

  // --- FUNCIONES CAJERO ---
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
  confirmCheckout() { this.orderService.checkoutOrder('sociedad_selecta_001', this.paymentMethod()); this.closeModal(); }

  // --- FUNCIÓN DE GRÁFICAS ---
  renderChart(trends: any[]) {
    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Si ya había una gráfica, la destruimos para no encimarla
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const labels = trends.map(t => t.date);
    const revenues = trends.map(t => t.revenue);
    const profits = trends.map(t => t.profit);

    this.chartInstance = new chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ingresos Brutos ($)',
            data: revenues,
            borderColor: '#3b82f6', // Azulito
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4 // Curvas suaves
          },
          {
            label: 'Ganancia Neta ($)',
            data: profits,
            borderColor: '#10b981', // Verdecito
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (context) => `$${Number(context.raw).toLocaleString()}`
            }
          }
        }
      }
    });
  }
}