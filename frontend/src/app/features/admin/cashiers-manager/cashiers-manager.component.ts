import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashierService } from '../../../services/cashier.service';
import { CashierModalComponent } from '../../../shared/components/cashier-modal/cashier-modal.component';

@Component({
  selector: 'app-cashiers-manager',
  standalone: true,
  imports: [CommonModule, CashierModalComponent],
  templateUrl: './cashiers-manager.component.html'
})
export class CashiersManagerComponent implements OnInit {
  private cashierService = inject(CashierService);

  // Leemos directamente el Signal del servicio para que la tabla se pinte sola
  cashiers = this.cashierService.cashiers;

  // Estados locales para controlar el Modal
  isModalOpen = signal(false);
  selectedCashier = signal<any>(null);

  ngOnInit() {
    // Apenas carga la vista, le decimos al servicio que traiga los empleados
    this.cashierService.loadCashiers();
  }

  // --- CONTROLES DEL MODAL ---
  openModal(cashier: any = null) {
    this.selectedCashier.set(cashier);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedCashier.set(null);
  }

  // --- CAMBIAR ESTADO (ACTIVO/INACTIVO) ---
  toggleStatus(cashier: any) {
    // Si no tiene el campo (usuarios viejos), asumimos que era true y lo pasamos a false
    const newStatus = cashier.status === false ? true : false;
    
    this.cashierService.updateCashier(cashier.id, { status: newStatus }).subscribe({
      error: (err) => alert('Paila, no se pudo cambiar el estado del empleado.')
    });
  }

  // --- ACCIONES CRUD ---
  onSaveCashier(data: any) {
    if (data.id) {
      // Si el objeto trae un ID, significa que estamos actualizando
      this.cashierService.updateCashier(data.id, data).subscribe({
        next: () => this.closeModal(),
        error: (err) => alert('Paila, no se pudo actualizar el cajero.')
      });
    } else {
      // Si no trae ID, es uno nuevecito
      this.cashierService.createCashier(data).subscribe({
        next: () => this.closeModal(),
        error: (err) => alert(err.error?.error || 'Paila, no se pudo crear el cajero.')
      });
    }
  }

  deleteCashier(id: string, name: string) {
    // Alerta nativa para evitar "dedazos"
    const confirmacion = confirm(`¿Estás seguro que deseas eliminar a ${name}? Esta acción no se puede deshacer, manin.`);
    if (confirmacion) {
      this.cashierService.deleteCashier(id).subscribe({
        error: (err) => alert('Error al intentar eliminar el empleado.')
      });
    }
  }
}