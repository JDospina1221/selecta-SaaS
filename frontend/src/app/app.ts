import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- SOLUCIÓN AL ERROR ROJO
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { AuthService } from './services/auth.service';
import { Product } from './models/product.models';
import { AdminService } from './services/admin.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule], // <-- LO INYECTAMOS AQUÍ
  templateUrl: './app.html'
})
export class App implements OnInit {
  private productService = inject(ProductService);
  private orderService = inject(OrderService); 
  private authService = inject(AuthService); 
  private adminService = inject(AdminService);
  
  // --- VARIABLE MAESTRA DE SEGURIDAD ---
  currentUser = this.authService.currentUser;

  // --- VARIABLES EXPUESTAS AL HTML (DASHBOARD ADMIN) ---
  adminKpis = this.adminService.kpis;
  adminSales = this.adminService.sales; // <-- NUEVO: Aquí tenemos la tabla de ventas
  isAdminLoading = this.adminService.isLoading;
  adminCurrentView = signal('DASHBOARD'); // <-- NUEVO: Controla la navegación (DASHBOARD, REPORTS, INVENTORY, FINANCE)
  salesPeriod = signal('all'); // <-- NUEVO: Controla el filtro de período en reportes (today, week, month, all)
  
  // --- VARIABLES DEL LOGIN ---
  loginEmail = signal('');
  loginPin = signal('');
  loginError = this.authService.loginError;

  // --- VARIABLES EXPUESTAS AL HTML (POS) ---
  cart = this.orderService.cart;
  subtotal = this.orderService.subtotal;
  total = this.orderService.total;
  
  categories = this.productService.categories;
  selectedCategory = this.productService.selectedCategory;
  filteredProducts = this.productService.filteredProducts;

  // --- VARIABLES DEL MODAL DE COBRO ---
  isModalOpen = signal(false);
  paymentMethod = signal('Efectivo'); 

  constructor() {
    effect(() => {
      const user = this.currentUser();
      if (user?.role === 'CAJERO') {
        this.productService.getProducts(user.tenantId || 'sociedad_selecta_001');
      } else if (user?.role === 'ADMIN') {
        this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001');
      }
    });
  }

  ngOnInit() {}

  // --- NAVEGACIÓN DEL ADMINISTRADOR ---
  setAdminView(view: string) {
    this.adminCurrentView.set(view);
    
    const user = this.currentUser();
    if (view === 'REPORTS' && user) {
      // Cargamos con el filtro que esté seleccionado actualmente
      this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', this.salesPeriod());
    } else if (view === 'DASHBOARD' && user) {
      this.adminService.loadKPIs(user.tenantId || 'sociedad_selecta_001');
    }
  }
  // --- FUNCIONES DE LOGIN Y LOGOUT ---
  updateLoginEmail(e: any) { this.loginEmail.set(e.target.value); }
  updateLoginPin(e: any) { this.loginPin.set(e.target.value); }

  onLogin() {
    this.authService.login(this.loginEmail(), this.loginPin());
    this.loginEmail.set('');
    this.loginPin.set('');
  }

  onLogout() {
    this.authService.logout();
    this.orderService.clearCart(); 
  }

  // --- FUNCIONES DEL MENÚ Y COMANDA ---
  onProductClick(product: Product) { this.orderService.addToCart(product); }
  onSelectCategory(category: string) { this.productService.setCategory(category); }
  onRemoveItem(productId: string) { this.orderService.removeItem(productId); }
  onClearOrder() { this.orderService.clearCart(); }
  onUpdateQuantity(productId: string, delta: number) { this.orderService.updateQuantity(productId, delta); }

  // --- FUNCIONES DEL MODAL DE COBRO ---
  openCheckoutModal() { this.isModalOpen.set(true); }
  closeModal() { this.isModalOpen.set(false); this.paymentMethod.set('Efectivo'); }
  setPaymentMethod(method: string) { this.paymentMethod.set(method); }

  confirmCheckout() {
    this.orderService.checkoutOrder('sociedad_selecta_001', this.paymentMethod());
    this.closeModal();
  }
  // <-- NUEVA FUNCIÓN: Se dispara cuando el jefe cambia el selector de fechas
  onChangeSalesPeriod(event: any) {
    const period = event.target.value;
    this.salesPeriod.set(period);
    
    const user = this.currentUser();
    if (user) {
      this.adminService.loadSales(user.tenantId || 'sociedad_selecta_001', period);
    }
  }
}
