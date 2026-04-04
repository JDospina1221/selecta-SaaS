import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../services/inventory.service';
import { AuthService } from '../../../services/auth.service';

@Component({ selector: 'app-inventory-view', standalone: true, imports: [CommonModule], templateUrl: './inventory-view.html' })
export class InventoryViewComponent {
  private inventoryService = inject(InventoryService); private authService = inject(AuthService);

  inventoryItems = this.inventoryService.items;
  totalDrinks = computed(() => this.inventoryItems().filter(i => i.category === 'Bebidas').reduce((acc, curr) => acc + curr.stock, 0));
  totalIngredients = computed(() => this.inventoryItems().filter(i => i.category === 'Insumos').reduce((acc, curr) => acc + curr.stock, 0));
  
  isInvModalOpen = signal(false); editingInv = signal<any>(null); invName = signal(''); invCategory = signal('Insumos'); invStock = signal(0); invCost = signal(0); invUnit = signal('und');

  constructor() { const user = this.authService.currentUser(); if (user) this.inventoryService.loadInventory(user.tenantId || 'sociedad_selecta_001'); }

  openInvModal(item?: any) { if (item) { this.editingInv.set(item); this.invName.set(item.name); this.invCategory.set(item.category); this.invStock.set(item.stock); this.invCost.set(item.cost); this.invUnit.set(item.unit || 'und'); } else { this.editingInv.set(null); this.invName.set(''); this.invCategory.set('Insumos'); this.invStock.set(0); this.invCost.set(0); this.invUnit.set('und'); } this.isInvModalOpen.set(true); } 
  closeInvModal() { this.isInvModalOpen.set(false); } updateInvName(e: any) { this.invName.set(e.target.value); } updateInvCategory(e: any) { this.invCategory.set(e.target.value); } updateInvStock(e: any) { this.invStock.set(Number(e.target.value)); } updateInvCost(e: any) { this.invCost.set(Number(e.target.value)); } updateInvUnit(e: any) { this.invUnit.set(e.target.value); } 
  saveInventory() { const user = this.authService.currentUser(); if (!user || !this.invName()) return; const payload = { tenantId: user.tenantId || 'sociedad_selecta_001', name: this.invName(), category: this.invCategory(), stock: this.invStock(), cost: this.invCost(), unit: this.invUnit() }; if (this.editingInv()) this.inventoryService.updateInventoryItem(this.editingInv().id, payload).subscribe(() => { this.inventoryService.loadInventory(payload.tenantId); this.closeInvModal(); }); else this.inventoryService.addInventoryItem(payload).subscribe(() => { this.inventoryService.loadInventory(payload.tenantId); this.closeInvModal(); }); }
}