import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { InventoryService } from '../../../services/inventory.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-menu-builder',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-builder.html'
})
export class MenuBuilderComponent {
  private adminService = inject(AdminService);
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);

  adminProducts = this.adminService.products;
  inventoryItems = this.inventoryService.items;
  adminMenuCategory = signal('Todos');

  newProdIcon = signal('comida'); 
  editIcon = signal('comida');

  iconPaths: Record<string, string> = {
    comida: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>',
    bebida: '<path d="M10 2c-1.1 0-2 .9-2 2v1h8V4c0-1.1-.9-2-2-2h-4z"></path><path d="M6 10h12l-1.5 10c-.1.6-.6 1-1.2 1H8.7c-.6 0-1.1-.4-1.2-1L6 10z"></path><path d="m9 10 1 11"></path><path d="m15 10-1 11"></path>',
    postre: '<path d="M12 2a4 4 0 0 1 4 4v2H8V6a4 4 0 0 1 4-4Z"></path><path d="M12 13v9"></path><path d="M8 13h8l-2 9H10l-2-9Z"></path>'
  };

  iconOptions = [
    { value: 'comida', label: 'Comida', icon: '🍴' },
    { value: 'bebida', label: 'Bebida', icon: '🥤' },
    { value: 'postre', label: 'Postre', icon: '🍦' }
  ]; 

  dynamicCategories = computed(() => {
    const cats = this.adminProducts().map(p => p.category).filter(Boolean);
    return [...new Set(cats)].sort();
  });

  filteredProducts = computed(() => {
    const cat = this.adminMenuCategory();
    if (cat === 'Todos') return this.adminProducts();
    return this.adminProducts().filter(p => p.category === cat);
  });

  isEditProductModalOpen = signal(false);
  editingProduct = signal<any>(null);
  editPrice = signal(0);
  editRecipe = signal<any[]>([]);
  isNewProdModalOpen = signal(false);
  newProdName = signal('');
  newProdPrice = signal(0);
  newProdCategory = signal('');

  constructor() {
    const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001';
    this.adminService.loadProducts(tenant);
    this.inventoryService.loadInventory(tenant);
  }

  openEditProduct(product: any) {
    this.editingProduct.set(product);
    this.editPrice.set(product.price || 0);
    this.editRecipe.set(product.recipe ? [...product.recipe] : []);
    this.editIcon.set(product.iconType || 'comida');
    this.isEditProductModalOpen.set(true);
  }

  closeEditProduct() {
    this.isEditProductModalOpen.set(false);
    this.editingProduct.set(null);
  }

  addIngredientToRecipe(event: any) {
    const invName = event.target.value;
    if (!invName) return;
    const current = this.editRecipe();
    if (!current.find(i => i.name === invName)) {
      this.editRecipe.set([...current, { name: invName, qty: 1 }]);
    }
    event.target.value = '';
  }

  updateIngredientQty(index: number, event: any) {
    const current = [...this.editRecipe()];
    current[index].qty = Number(event.target.value);
    this.editRecipe.set(current);
  }

  removeIngredient(index: number) {
    const current = [...this.editRecipe()];
    current.splice(index, 1);
    this.editRecipe.set(current);
  }

  updateEditPrice(e: any) { this.editPrice.set(Number(e.target.value)); }

  saveProductChanges() {
    const product = this.editingProduct();
    if (!product) return;
    const payload = {
      price: Number(this.editPrice()) || 0,
      recipe: this.editRecipe().map(item => ({ name: item.name, qty: Number(item.qty) || 1 })),
      iconType: this.editIcon() // Guardamos también el icono en edición
    };
    this.adminService.updateProduct(product.id || product._id, payload).subscribe({
      next: () => {
        const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001';
        this.adminService.loadProducts(tenant);
        this.closeEditProduct();
      },
      error: (err) => console.error('Error:', err)
    });
  }

  openNewProdModal() {
    this.newProdName.set('');
    this.newProdPrice.set(0);
    this.newProdCategory.set('');
    this.newProdIcon.set('comida'); // Reset icono
    this.isNewProdModalOpen.set(true);
  }

  closeNewProdModal() { this.isNewProdModalOpen.set(false); }

  updateNewProdName(e: any) { this.newProdName.set(e.target.value); }
  updateNewProdPrice(e: any) { this.newProdPrice.set(Number(e.target.value)); }
  updateNewProdCategory(e: any) { this.newProdCategory.set(e.target.value); }

  saveNewProduct() {
    const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001';
    if (!this.newProdName() || !this.newProdCategory() || this.newProdPrice() <= 0) {
      return alert('Datos incompletos');
    }

    const payload = {
      tenantId: tenant,
      name: this.newProdName(),
      category: this.newProdCategory(),
      price: this.newProdPrice(),
      iconType: this.newProdIcon(),        // ← ya lo tienes
    };

    this.adminService.addProduct(payload).subscribe({
      next: () => {
        this.adminService.loadProducts(tenant);   // ← Recarga completa (igual que en edición)
        this.closeNewProdModal();
      },
      error: (err) => console.error('Error al crear producto:', err)
    });
  }

  deleteProduct(id: string) {
    const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001';
    if (confirm('¿Eliminar producto?')) {
      this.adminService.deleteProduct(id).subscribe(() => {
        this.adminService.loadProducts(tenant);
      });
    }
  }
}