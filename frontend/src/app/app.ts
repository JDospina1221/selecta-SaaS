import { Component, OnInit, inject, signal, effect } from '@angular/core'; // <-- Importamos 'effect'
import { ProductService } from './services/product.service';
import { OrderService } from './services/order.service';
import { AuthService } from './services/auth.service';
import { Product } from './models/product.models';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html'
})
export class App implements OnInit {
  private productService = inject(ProductService);
  private orderService = inject(OrderService); 
  private authService = inject(AuthService); 
  
  // --- VARIABLE MAESTRA DE SEGURIDAD ---
  currentUser = this.authService.currentUser;

  // --- VARIABLES DEL LOGIN ---
  loginEmail = signal('');
  loginPin = signal('');
  loginError = this.authService.loginError; // <-- Ahora la lee del servicio

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
    // 🔥 TRUCO SENIOR: Como el login va a Node (es asíncrono), 
    // usamos 'effect' para "escuchar" cuándo llega el usuario y ahí sí cargar el menú.
    effect(() => {
      const user = this.currentUser();
      if (user?.role === 'CAJERO') {
        // Usamos el tenantId del usuario para traer los productos correctos
        this.productService.getProducts(user.tenantId || 'sociedad_selecta_001');
      }
    });
  }

  ngOnInit() {
    // Vacío, el effect() de arriba se encarga de la carga inicial
  }

  // --- FUNCIONES DE LOGIN Y LOGOUT ---
  updateLoginEmail(e: any) { this.loginEmail.set(e.target.value); }
  updateLoginPin(e: any) { this.loginPin.set(e.target.value); }

  onLogin() {
    // El servicio ahora hace la petición al Backend
    this.authService.login(this.loginEmail(), this.loginPin());
    
    // Limpiamos los inputs después del intento
    this.loginEmail.set('');
    this.loginPin.set('');
  }

  onLogout() {
    this.authService.logout();
    this.orderService.clearCart(); // Limpiamos la comanda por seguridad
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
}