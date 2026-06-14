import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./features/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('./features/inventory/components/inventory-list.component')
        .then(m => m.InventoryListComponent),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/components/product-list.component')
        .then(m => m.ProductListComponent),
  },
  {
    path: 'scanner',
    loadComponent: () =>
      import('./features/scanner/components/scanner.component')
        .then(m => m.ScannerComponent),
  },
  { path: '**', redirectTo: 'inventory' },
];
