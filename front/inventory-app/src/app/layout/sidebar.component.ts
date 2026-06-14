import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatTooltipModule],
  template: `
    <!-- Botón hamburguesa — solo visible en móvil -->
    <button class="hamburger" (click)="toggleMenu()" [attr.aria-label]="menuOpen() ? 'Cerrar menú' : 'Abrir menú'">
      <mat-icon>{{ menuOpen() ? 'close' : 'menu' }}</mat-icon>
    </button>

    <!-- Overlay oscuro en móvil cuando el menú está abierto -->
    @if (menuOpen()) {
      <div class="overlay" (click)="closeMenu()"></div>
    }

    <!-- Sidebar -->
    <aside class="sidebar" [class.open]="menuOpen()">
      <div class="brand">
        <span class="brand-icon"><mat-icon>inventory_2</mat-icon></span>
        <span class="brand-name">SSDD<br><small>Activos</small></span>
        <!-- Botón cerrar dentro del sidebar en móvil -->
        <button class="close-btn" (click)="closeMenu()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <nav class="nav-list">
        @for (item of nav; track item.route) {
          <a class="nav-item"
             [routerLink]="item.route"
             routerLinkActive="active"
             (click)="closeMenu()"
             [matTooltip]="item.label"
             matTooltipPosition="right">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span class="nav-label">{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="sidebar-footer"><span class="version">v1.0.0</span></div>
    </aside>
  `,
  styles: [`
    /* ── Hamburger ── */
    .hamburger {
      display: none;
      position: fixed;
      top: 12px; left: 12px;
      z-index: 100;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      width: 40px; height: 40px;
      align-items: center; justify-content: center;
      cursor: pointer; color: var(--text-primary);
    }
    .hamburger mat-icon { font-size: 22px; width: 22px; height: 22px; }

    /* ── Overlay ── */
    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.5);
      z-index: 149;
    }

    /* ── Sidebar ── */
    .sidebar {
      width: 220px; min-width: 220px;
      background: var(--bg-sidebar);
      border-right: 1px solid var(--border-color);
      display: flex; flex-direction: column;
      height: 100vh;
      transition: transform .25s ease;
    }

    .close-btn { display: none; }

    .brand {
      display: flex; align-items: center; gap: 12px;
      padding: 24px 20px 20px;
      border-bottom: 1px solid var(--border-color);
    }
    .brand-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: var(--accent);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .brand-icon mat-icon { color: #fff; font-size: 22px; }
    .brand-name {
      font-size: 15px; font-weight: 700;
      color: var(--text-primary); line-height: 1.2; flex: 1;
    }
    .brand-name small {
      font-size: 11px; font-weight: 400;
      color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase;
    }

    .nav-list {
      flex: 1; display: flex; flex-direction: column;
      padding: 16px 12px; gap: 4px;
    }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 10px;
      text-decoration: none; color: var(--text-muted);
      font-size: 14px; font-weight: 500;
      transition: background .15s, color .15s;
    }
    .nav-item mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .nav-item:hover { background: var(--hover-bg); color: var(--text-primary); }
    .nav-item.active { background: var(--accent-soft); color: var(--accent); }
    .nav-item.active mat-icon { color: var(--accent); }
    .nav-label { white-space: nowrap; }

    .sidebar-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border-color);
    }
    .version { font-size: 11px; color: var(--text-muted); letter-spacing: 1px; }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .hamburger { display: flex; }
      .overlay   { display: block; }

      .sidebar {
        position: fixed;
        top: 0; left: 0;
        z-index: 150;
        transform: translateX(-100%);
        box-shadow: 4px 0 24px rgba(0,0,0,.3);
      }
      .sidebar.open { transform: translateX(0); }

      .close-btn {
        display: flex; align-items: center; justify-content: center;
        background: transparent; border: none;
        color: var(--text-muted); cursor: pointer;
        width: 32px; height: 32px; border-radius: 8px;
        margin-left: auto;
      }
      .close-btn:hover { background: var(--hover-bg); color: var(--text-primary); }
      .close-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
  `],
})
export class SidebarComponent {
  menuOpen = signal(false);

  nav = [
    { label: 'Dashboard',      icon: 'dashboard',       route: '/dashboard' },
    { label: 'Inventario',     icon: 'inventory',       route: '/inventory' },
    { label: 'Productos',      icon: 'category',        route: '/products'  },
    { label: 'Scanner / Scan', icon: 'qr_code_scanner', route: '/scanner'   },
  ];

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu()  { this.menuOpen.set(false); }
}
