import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent) },
  { 
    path: 'caja', 
    loadComponent: () => import('./layout/cashier-layout/cashier-layout').then(m => m.CashierLayoutComponent),
    canActivate: [authGuard, roleGuard], data: { expectedRole: 'CAJERO' },
    loadChildren: () => import('./features/cashier/pos/cashier.routes').then(m => m.cashierRoutes) // <-- NUEVO
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./layout/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard], data: { expectedRole: 'ADMIN' },
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes) // <-- NUEVO
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];