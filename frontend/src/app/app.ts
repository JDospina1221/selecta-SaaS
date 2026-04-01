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
  adminProducts = this.adminService.products; // <-- INVENTARIO
  isAdminLoading = this.adminService.isLoading;
  adminCurrentView = signal('DASHBOARD');
  salesPeriod = signal('all');
  adminExpenses = this.adminService.expenses; // <-- GASTOS (CAJA MENOR)

  // --- VARIABLES MODAL INVENTARIO ---
  isEditProductModalOpen = signal(false);
  editingProduct = signal<any>(null);
  editPrice = signal(0);
  editCost = signal(0);
  editStock = signal(0);

  // --- VARIABLES MODAL GASTOS ---
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
      else if (user?.role === 'ADMIN') this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001');
    });
  }

  ngOnInit() {}

  // --- NAVEGACIÓN ADMIN ---
setAdminView(view: string) {
    this.adminCurrentView.set(view);
    const user = this.currentUser();
    if (!user) return;

    if (view === 'REPORTS') this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', this.salesPeriod());
    else if (view === 'DASHBOARD') this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001');
    else if (view === 'INVENTORY') this.adminService.loadProducts(user.tenantId || 'sociedad_selecta_001'); 
    else if (view === 'FINANCE') this.adminService.loadExpenses(user.tenantId || 'sociedad_selecta_001');
  }

  onChangeSalesPeriod(event: any) {
    const period = event.target.value;
    this.salesPeriod.set(period);
    const user = this.currentUser();
    if (user) this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', period);
  }

  // --- FUNCIONES INVENTARIO ---
  openEditProduct(product: any) {
    this.editingProduct.set(product);
    this.editPrice.set(product.price || 0);
    this.editCost.set(product.cost || 0);
    this.editStock.set(product.stock || 0);
    this.isEditProductModalOpen.set(true);
  }

  closeEditProduct() {
    this.isEditProductModalOpen.set(false);
    this.editingProduct.set(null);
  }

  updateEditPrice(e: any) { this.editPrice.set(Number(e.target.value)); }
  updateEditCost(e: any) { this.editCost.set(Number(e.target.value)); }
  updateEditStock(e: any) { this.editStock.set(Number(e.target.value)); }

  saveProductChanges() {
    const product = this.editingProduct();
    if (!product) return;

    const payload = {
      price: this.editPrice(),
      cost: this.editCost(),
      stock: this.editStock()
    };

    this.adminService.updateProduct(product.id, payload).subscribe({
      next: () => {
        const user = this.currentUser();
        this.adminService.loadProducts(user?.tenantId || 'sociedad_selecta_001'); // Recarga tabla
        this.closeEditProduct();
      },
      error: (err) => console.error('Error guardando producto:', err)
    });
  }

  // --- FUNCIONES FINANZAS ---
  openExpenseModal() {
    this.expenseDesc.set('');
    this.expenseAmount.set(0);
    this.expenseCategory.set('Insumos');
    this.isExpenseModalOpen.set(true);
  }

  closeExpenseModal() { this.isExpenseModalOpen.set(false); }

  updateExpenseDesc(e: any) { this.expenseDesc.set(e.target.value); }
  updateExpenseAmount(e: any) { this.expenseAmount.set(Number(e.target.value)); }
  updateExpenseCategory(e: any) { this.expenseCategory.set(e.target.value); }

  saveExpense() {
    const user = this.currentUser();
    if (!user || !this.expenseDesc() || this.expenseAmount() <= 0) {
      alert('Papi, llene bien la descripción y el monto.');
      return;
    }

    const payload = {
      tenantId: user.tenantId || 'sociedad_selecta_001',
      description: this.expenseDesc(),
      amount: this.expenseAmount(),
      category: this.expenseCategory()
    };

    this.adminService.addExpense(payload).subscribe({
      next: () => {
        this.adminService.loadExpenses(payload.tenantId); // Recarga la tabla
        this.closeExpenseModal();
      },
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
}