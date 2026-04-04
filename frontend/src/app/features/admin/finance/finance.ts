import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../services/admin.service';
import { AuthService } from '../../../services/auth.service';

@Component({ selector: 'app-finance', standalone: true, imports: [CommonModule], templateUrl: './finance.html' })
export class FinanceComponent {
  private adminService = inject(AdminService); private authService = inject(AuthService);
  adminExpenses = this.adminService.expenses;
  isExpenseModalOpen = signal(false); expenseDesc = signal(''); expenseAmount = signal(0); expenseCategory = signal('Insumos');

  constructor() { const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001'; this.adminService.loadExpenses(tenant); }

  openExpenseModal() { this.expenseDesc.set(''); this.expenseAmount.set(0); this.expenseCategory.set('Insumos'); this.isExpenseModalOpen.set(true); } 
  closeExpenseModal() { this.isExpenseModalOpen.set(false); } 
  updateExpenseDesc(e: any) { this.expenseDesc.set(e.target.value); } updateExpenseAmount(e: any) { this.expenseAmount.set(Number(e.target.value)); } updateExpenseCategory(e: any) { this.expenseCategory.set(e.target.value); } 
  
  saveExpense() { 
    const tenant = this.authService.currentUser()?.tenantId || 'sociedad_selecta_001';
    if (!this.expenseDesc() || this.expenseAmount() <= 0) return alert('Por favor ingresa el motivo y el monto.'); 
    const payload = { tenantId: tenant, description: this.expenseDesc(), amount: this.expenseAmount(), category: this.expenseCategory() }; 
    this.adminService.addExpense(payload).subscribe(() => { 
      this.adminService.loadExpenses(tenant); 
      this.closeExpenseModal(); 
    }); 
  }
}