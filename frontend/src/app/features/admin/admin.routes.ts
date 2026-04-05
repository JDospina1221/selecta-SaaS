import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) },
  { path: 'menu', loadComponent: () => import('./menu-builder/menu-builder').then(m => m.MenuBuilderComponent) },
  { path: 'inventory', loadComponent: () => import('./inventory-admin/inventory-admin').then(m => m.InventoryAdminComponent) },
  { path: 'reports', loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent) },
  { path: 'canceled', loadComponent: () => import('./canceled-orders/canceled-orders').then(m => m.CanceledOrdersComponent) },
  { path: 'finance', loadComponent: () => import('./finance/finance').then(m => m.FinanceComponent) },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {path: 'cashiers', loadComponent: () => import('./cashiers-manager/cashiers-manager.component').then(m => m.CashiersManagerComponent)
  },
];