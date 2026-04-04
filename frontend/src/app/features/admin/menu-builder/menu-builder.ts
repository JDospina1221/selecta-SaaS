import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { InventoryService } from '../../../services/inventory.service';
import { AuthService } from '../../../services/auth.service';

@Component({ selector: 'app-menu-builder', standalone: true, imports: [CommonModule], templateUrl: './menu-builder.html' })
export class MenuBuilderComponent {
  private adminService = inject(AdminService);
  private inventoryService = inject(InventoryService);
  private authService = inject(AuthService);

  adminProducts = this.adminService.products;
  inventoryItems = this.inventoryService.items;
  adminMenuCategory = signal('Todos');
  
  isEditProductModalOpen = signal(false); editingProduct = signal<any>(null); editPrice = signal(0); editRecipe = signal<any[]>([]); 
  isNewProdModalOpen = signal(false); newProdName = signal(''); newProdPrice = signal(0); newProdCategory = signal('Hamburguesas'); 

  constructor() {
    const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001';
    this.adminService.loadProducts(tenant);
    this.inventoryService.loadInventory(tenant);
  }

  openEditProduct(product: any) { this.editingProduct.set(product); this.editPrice.set(product.price || 0); this.editRecipe.set(product.recipe ? [...product.recipe] : []); this.isEditProductModalOpen.set(true); }
  closeEditProduct() { this.isEditProductModalOpen.set(false); this.editingProduct.set(null); }
  addIngredientToRecipe(event: any) { const invName = event.target.value; if (!invName) return; const current = this.editRecipe(); if (!current.find(i => i.name === invName)) this.editRecipe.set([...current, { name: invName, qty: 1 }]); event.target.value = ''; }
  updateIngredientQty(index: number, event: any) { const current = [...this.editRecipe()]; current[index].qty = Number(event.target.value); this.editRecipe.set(current); }
  removeIngredient(index: number) { const current = [...this.editRecipe()]; current.splice(index, 1); this.editRecipe.set(current); }
  updateEditPrice(e: any) { this.editPrice.set(Number(e.target.value)); }
  
  saveProductChanges() { 
    const product = this.editingProduct(); 
    if (!product) return; 

    // Limpiamos la receta para asegurarnos de que no vayan datos raros ni undefined
    const cleanRecipe = this.editRecipe().map(item => ({
      name: item.name,
      qty: Number(item.qty) || 1
    }));

    // Mandamos estrictamente lo que se va a actualizar
    const payload = { 
      price: Number(this.editPrice()) || 0, 
      recipe: cleanRecipe 
    };

    const productId = product.id || product._id;

    this.adminService.updateProduct(productId, payload).subscribe({
      next: () => { 
        const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001';
        this.adminService.loadProducts(tenant); 
        this.closeEditProduct(); 
      },
      error: (err) => {
        console.error('El backend nos rechazó la actualización:', err);
        alert('Bro, mira la terminal de tu Node.js (VS Code), allá va a salir el error real.');
      }
    }); 
  }
  
  openNewProdModal() { this.newProdName.set(''); this.newProdPrice.set(0); this.newProdCategory.set('Hamburguesas'); this.isNewProdModalOpen.set(true); }
  closeNewProdModal() { this.isNewProdModalOpen.set(false); }
  updateNewProdName(e: any) { this.newProdName.set(e.target.value); } updateNewProdPrice(e: any) { this.newProdPrice.set(Number(e.target.value)); } updateNewProdCategory(e: any) { this.newProdCategory.set(e.target.value); }
  
  saveNewProduct() { 
    const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001';
    if (!this.newProdName() || this.newProdPrice() <= 0) return alert('Por favor ingresa el nombre y el precio.'); 
    const payload = { tenantId: tenant, name: this.newProdName(), category: this.newProdCategory(), price: this.newProdPrice() }; 
    this.adminService.addProduct(payload).subscribe(() => { 
      this.adminService.loadProducts(tenant); 
      this.closeNewProdModal(); 
    }); 
  }
  
  deleteProduct(id: string) { const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001'; if (confirm('¿Eliminar producto?')) { this.adminService.deleteProduct(id).subscribe(() => { this.adminService.loadProducts(tenant); }); } }
}