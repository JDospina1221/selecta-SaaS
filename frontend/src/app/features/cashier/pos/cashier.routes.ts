import { Routes } from '@angular/router';

export const cashierRoutes: Routes = [
  { path: 'pos', loadComponent: () => import('./pos').then(m => m.PosComponent) },
  { path: 'orders', loadComponent: () => import('..//orders-manager/orders-manager').then(m => m.OrdersManagerComponent) },
  { path: 'inventory', loadComponent: () => import('.././inventory-view/inventory-view').then(m => m.InventoryViewComponent) },
  { path: '', redirectTo: 'pos', pathMatch: 'full' }
];