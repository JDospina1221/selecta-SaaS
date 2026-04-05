import { Routes } from '@angular/router';
import { featureGuard } from '../../core/guards/feature.guard';

export const adminRoutes: Routes = [
  // 1. Dashboard: Siempre disponible para el admin
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard').then(m => m.DashboardComponent) 
  },

  // 2. Menú: Gestión base del restaurante
  { 
    path: 'menu', 
    loadComponent: () => import('./menu-builder/menu-builder').then(m => m.MenuBuilderComponent) 
  },

  // 3. Inventario: Protegido por el plan avanzado
  { 
    path: 'inventory', 
    loadComponent: () => import('./inventory-admin/inventory-admin').then(m => m.InventoryAdminComponent),
    canActivate: [featureGuard('inventoryAdvanced')] 
  },

  // 4. Reportes y Facturación: Protegido por su feature correspondiente
  { 
    path: 'reports', 
    loadComponent: () => import('./reports/reports').then(m => m.ReportsComponent),
    canActivate: [featureGuard('electronicInvoicing')] 
  },

  // 5. Ventas Canceladas: También depende del módulo de inventario/auditoría avanzado
  { 
    path: 'canceled', 
    loadComponent: () => import('./canceled-orders/canceled-orders').then(m => m.CanceledOrdersComponent),
    canActivate: [featureGuard('inventoryAdvanced')] 
  },

  // 6. Finanzas y Cajeros: Siempre que el plan permita gestión de personal
  { 
    path: 'finance', 
    loadComponent: () => import('./finance/finance').then(m => m.FinanceComponent) 
  },
  { 
    path: 'cashiers', 
    loadComponent: () => import('./cashiers-manager/cashiers-manager.component').then(m => m.CashiersManagerComponent) 
  },

  // Redirección por defecto
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' } // Por si escriben cualquier cosa loca en la URL
];