import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PdfExportPanelComponent } from '../../../shared/components/pdf-export-panel.component';

import { InventoryService } from '../../../core/services/inventory.service';
import { ItemSummaryDTO } from '../../../core/models/inventory.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';
import { HistoryDialogComponent } from './history-dialog.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    FormsModule, ReactiveFormsModule, DatePipe,
    MatTableModule, MatPaginatorModule, MatSelectModule,
    MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatDialogModule, MatProgressSpinnerModule,
    MatTooltipModule, StatusBadgeComponent,
    MatCheckboxModule, PdfExportPanelComponent,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventario</h1>
        <p class="page-subtitle">{{ totalElements() }} activos registrados</p>
      </div>
      <div class="header-actions">
        <button mat-icon-button (click)="load()" matTooltip="Actualizar">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>
    </div>

    <div class="tabs">
      <button class="tab-btn" [class.active]="activeTab() === 'stock'" (click)="switchTab('stock')">
        <mat-icon>inventory_2</mat-icon>
        Stock activo
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'consumed'" (click)="switchTab('consumed')">
        <mat-icon>remove_circle_outline</mat-icon>
        Consumidos
      </button>
    </div>

    <div class="search-bar" [formGroup]="filterForm">
      <div class="search-input-wrap">
        <mat-icon class="search-icon">search</mat-icon>
        <input class="search-input" formControlName="globalSearch" placeholder="Código, producto, titular…">
        @if (filterForm.get('globalSearch')?.value) {
          <button class="search-clear" (click)="filterForm.get('globalSearch')?.reset()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </div>

      <button class="filter-toggle-btn" [class.active]="showAdvanced()" (click)="toggleAdvanced()">
        <mat-icon>tune</mat-icon>
        Filtros
        @if (showAdvanced()) {
          <mat-icon class="chevron">expand_less</mat-icon>
        } @else {
          <mat-icon class="chevron">expand_more</mat-icon>
        }
      </button>
    </div>

    @if (showAdvanced()) {
      <div class="advanced-panel" [formGroup]="filterForm">
        <mat-form-field appearance="outline" class="f-code">
          <mat-label>Código</mat-label>
          <input matInput formControlName="code">
          <mat-icon matSuffix>qr_code</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="f-product">
          <mat-label>Producto</mat-label>
          <input matInput formControlName="product">
        </mat-form-field>

        @if (activeTab() === 'stock') {
          <mat-form-field appearance="outline" class="f-status">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="status">
              <mat-option value="">Todos</mat-option>
              <mat-option value="DISPONIBLE">Disponible</mat-option>
              <mat-option value="PRESTADO">Prestado</mat-option>
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field appearance="outline" class="f-holder">
          <mat-label>Titular</mat-label>
          <input matInput formControlName="holder">
          <mat-icon matSuffix>person</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="f-date">
          <mat-label>Desde</mat-label>
          <input matInput type="date" formControlName="dateFrom">
        </mat-form-field>

        <mat-form-field appearance="outline" class="f-date">
          <mat-label>Hasta</mat-label>
          <input matInput type="date" formControlName="dateTo">
        </mat-form-field>

        <button mat-icon-button (click)="filterForm.reset()" matTooltip="Limpiar filtros">
          <mat-icon>filter_alt_off</mat-icon>
        </button>
      </div>
    }

    @if (selectedCodes().size > 0) {
      <div class="export-bar">
        <span class="export-count">
          <mat-icon>check_box</mat-icon>
          {{ selectedCodes().size }} ítem(s) seleccionado(s)
        </span>
        <button mat-stroked-button class="export-toggle-btn" (click)="toggleExportPanel()">
          <mat-icon>picture_as_pdf</mat-icon>
          {{ showExportPanel() ? 'Ocultar opciones' : 'Exportar PDF' }}
        </button>
        <button mat-icon-button (click)="clearSelection()" matTooltip="Limpiar selección">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    }

    @if (showExportPanel() && selectedCodes().size > 0) {
      <app-pdf-export-panel [uniqueCodes]="getSelectedArray()" />
    }

    @if (loading()) {
      <div class="loading-full"><mat-spinner diameter="44" /></div>
    } @else {
      <div class="table-card">
        <table mat-table [dataSource]="filteredItems()">

          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox
                [checked]="isAllSelected()"
                [indeterminate]="isSomeSelected()"
                (change)="toggleAll()">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let r">
              <mat-checkbox
                [checked]="selectedCodes().has(r.uniqueCode)"
                (change)="toggleSelection(r.uniqueCode)">
              </mat-checkbox>
            </td>
          </ng-container>

          <ng-container matColumnDef="uniqueCode">
            <th mat-header-cell *matHeaderCellDef>Código</th>
            <td mat-cell *matCellDef="let r">
              <span class="chip mono">{{ r.uniqueCode }}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="productName">
            <th mat-header-cell *matHeaderCellDef>Producto</th>
            <td mat-cell *matCellDef="let r">{{ r.productName }}</td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let r">
              <app-status-badge [status]="r.status" />
            </td>
          </ng-container>

          <ng-container matColumnDef="currentHolder">
            <th mat-header-cell *matHeaderCellDef>Titular</th>
            <td mat-cell *matCellDef="let r">{{ r.currentHolder || '—' }}</td>
          </ng-container>

          <ng-container matColumnDef="ingestedAt">
            <th mat-header-cell *matHeaderCellDef>Ingresado</th>
            <td mat-cell *matCellDef="let r">
              {{ r.ingestedAt ? (r.ingestedAt | date:'dd/MM/yy HH:mm') : '\u2014' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="lastTransactionAt">
            <th mat-header-cell *matHeaderCellDef>\u00daltimo movimiento</th>
            <td mat-cell *matCellDef="let r">
              {{ r.lastTransactionAt ? (r.lastTransactionAt | date:'dd/MM/yy HH:mm') : '\u2014' }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button (click)="openHistory(r)" matTooltip="Ver historial">
                <mat-icon>history</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let r; columns: cols;" class="table-row"></tr>
        </table>

        @if (items().length === 0) {
          <div class="empty-state">
            <mat-icon>inventory_2</mat-icon>
            <p>No hay ítems que coincidan con el filtro</p>
          </div>
        }
      </div>

      <mat-paginator
        [length]="totalElements()"
        [pageSize]="pageSize"
        [pageSizeOptions]="[10, 25, 50]"
        (page)="onPage($event)"
        showFirstLastButtons
      />
    }
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
    }
    .page-title { font-size: 26px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--text-muted); margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 10px; }

    .loading-full { display: flex; justify-content: center; padding: 80px 0; }

    /* Tabs */
    .tabs {
      display: flex; gap: 4px; margin-bottom: 16px;
      border-bottom: 1px solid var(--border-color); padding-bottom: 0;
    }
    .tab-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 10px 16px; border: none;
      border-bottom: 2px solid transparent;
      background: transparent; color: var(--text-muted);
      font-size: 13px; font-weight: 600; cursor: pointer;
      font-family: inherit; transition: color .15s, border-color .15s;
      margin-bottom: -1px;
    }
    .tab-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tab-btn:hover { color: var(--text-primary); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

    /* Search bar */
    .search-bar {
      display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
    }
    .search-input-wrap {
      flex: 1; display: flex; align-items: center; gap: 10px;
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 10px; padding: 0 14px; height: 46px;
      transition: border-color .15s;
    }
    .search-input-wrap:focus-within { border-color: var(--accent); }
    .search-icon { color: var(--text-muted); font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .search-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--text-primary); font-size: 14px; font-family: inherit;
    }
    .search-input::placeholder { color: var(--text-muted); }
    .search-clear {
      background: transparent; border: none; cursor: pointer;
      color: var(--text-muted); display: flex; align-items: center;
      padding: 0; transition: color .15s;
    }
    .search-clear:hover { color: var(--text-primary); }
    .search-clear mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .filter-toggle-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 0 16px; height: 46px; border-radius: 10px;
      border: 1px solid var(--border-color); background: var(--bg-card);
      color: var(--text-muted); font-size: 13px; font-weight: 600;
      font-family: inherit; cursor: pointer; transition: all .15s; white-space: nowrap;
    }
    .filter-toggle-btn:hover { border-color: var(--accent); color: var(--accent); }
    .filter-toggle-btn.active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
    .filter-toggle-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .chevron { font-size: 16px !important; width: 16px !important; height: 16px !important; }

    /* Advanced panel */
    .advanced-panel {
      display: flex; flex-wrap: wrap; gap: 10px; align-items: center;
      padding: 16px; background: var(--bg-card);
      border: 1px solid var(--border-color); border-radius: 12px;
      margin-bottom: 16px; animation: slideDown .15s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .f-code    { width: 150px; }
    .f-product { width: 200px; }
    .f-status  { width: 150px; }
    .f-holder  { width: 160px; }
    .f-date    { width: 155px; }
    .advanced-panel .mat-mdc-form-field { margin-bottom: -1.25em; }

    /* Export bar */
    .export-bar {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px; background: var(--accent-soft);
      border: 1px solid var(--accent); border-radius: 10px;
      margin-bottom: 16px; flex-wrap: wrap;
    }
    .export-count {
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600; color: var(--accent); flex: 1;
    }
    .export-count mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .export-toggle-btn {
      border-color: var(--accent) !important; color: var(--accent) !important;
      display: flex; align-items: center; gap: 6px;
      font-size: 13px; font-weight: 600;
    }

    /* Table */
    .table-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 14px; overflow: auto; margin-bottom: 16px;
    }
    table { width: 100%; min-width: 600px; }
    .chip {
      display: inline-block; padding: 2px 9px; border-radius: 6px; font-size: 13px;
      background: var(--bg-sidebar); border: 1px solid var(--border-color);
    }
    .chip.mono { font-family: monospace; color: var(--accent); }
    .table-row:hover td { background: var(--hover-bg); }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      gap: 12px; padding: 60px; color: var(--text-muted);
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; }

    /* Responsive */
    @media (max-width: 768px) {
      .page-title { font-size: 22px; }

      .filter-toggle-btn { padding: 0 12px; min-width: 46px; }
      .filter-toggle-btn span { display: none; }
      .filter-toggle-btn .chevron { display: none; }

      .f-code, .f-product, .f-status, .f-holder, .f-date {
        width: 100%;
      }

      .tab-btn { padding: 10px 12px; }
      .tab-btn span { font-size: 12px; }
    }
  `],
})
export class InventoryListComponent implements OnInit {
  private svc    = inject(InventoryService);
  private dialog = inject(MatDialog);
  private fb     = inject(FormBuilder);

  cols = ['select', 'uniqueCode', 'productName', 'status', 'currentHolder', 'ingestedAt', 'lastTransactionAt', 'actions'];

  items         = signal<ItemSummaryDTO[]>([]);
  totalElements = signal(0);
  loading       = signal(false);
  selectedCodes   = signal<Set<string>>(new Set());
  showExportPanel = signal(false);
  activeTab       = signal<'stock' | 'consumed'>('stock');

  pageIndex      = 0;
  pageSize       = 10;
  selectedStatus = '';

  // Filtros inline — aplican sobre los datos en memoria
  filterForm: FormGroup = this.fb.group({
    globalSearch: [''],
    code:         [''],
    product:      [''],
    holder:       [''],
    status:       [''],
    dateFrom:     [''],
    dateTo:       [''],
  });

  filteredItems    = signal<ItemSummaryDTO[]>([]);
  showAdvanced     = signal(false);

  ngOnInit() {
    this.load();
    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  load() {
    this.loading.set(true);
    this.clearSelection();
    this.filteredItems.set([]);

    const request$ = this.activeTab() === 'consumed'
      ? this.svc.getConsumed(this.pageIndex, this.pageSize)
      : this.svc.getInventory(this.pageIndex, this.pageSize);

    request$.subscribe({
      next: page => {
        this.items.set(page.content);
        this.totalElements.set(page.totalElements);
        this.applyFilters();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  applyFilters() {
    const f       = this.filterForm.value;
    const global  = f.globalSearch?.toLowerCase().trim() ?? '';
    const code    = f.code?.toLowerCase().trim()    ?? '';
    const product = f.product?.toLowerCase().trim() ?? '';
    const holder  = f.holder?.toLowerCase().trim()  ?? '';
    const status  = f.status ?? '';
    const from    = f.dateFrom ? new Date(f.dateFrom) : null;
    const to      = f.dateTo   ? new Date(f.dateTo + 'T23:59:59') : null;

    const result = this.items().filter(item => {
      // Búsqueda global — todos los campos de texto
      const matchGlobal = !global || [
        item.uniqueCode,
        item.productName,
        item.currentHolder ?? '',
        item.status,
      ].some(val => val.toLowerCase().includes(global));

      // Filtros avanzados individuales
      const matchCode    = !code    || item.uniqueCode.toLowerCase().includes(code);
      const matchProduct = !product || item.productName.toLowerCase().includes(product);
      const matchHolder  = !holder  || (item.currentHolder ?? '').toLowerCase().includes(holder);
      const matchStatus  = !status  || item.status === status;

      const itemDate = item.lastTransactionAt
        ? new Date(item.lastTransactionAt)
        : item.ingestedAt ? new Date(item.ingestedAt) : null;

      const matchFrom = !from || (itemDate ? itemDate >= from : false);
      const matchTo   = !to   || (itemDate ? itemDate <= to   : false);

      return matchGlobal && matchCode && matchProduct && matchHolder && matchStatus && matchFrom && matchTo;
    });

    this.filteredItems.set(result);
  }

  onPage(e: PageEvent) { this.pageIndex = e.pageIndex; this.pageSize = e.pageSize; this.load(); }
  onFilterChange()     { this.pageIndex = 0; this.load(); }

  openHistory(item: ItemSummaryDTO) {
    this.dialog.open(HistoryDialogComponent, {
      data: item, width: '580px', panelClass: 'dark-dialog',
    });
  }

  toggleSelection(code: string) {
    this.selectedCodes.update(set => {
      const next = new Set(set);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  toggleAll() {
    const codes    = this.items().map(i => i.uniqueCode);
    const allCheck = codes.every(c => this.selectedCodes().has(c));
    this.selectedCodes.update(() =>
      allCheck ? new Set() : new Set(codes)
    );
  }

  isAllSelected(): boolean {
    const codes = this.items().map(i => i.uniqueCode);
    return codes.length > 0 && codes.every(c => this.selectedCodes().has(c));
  }

  isSomeSelected(): boolean {
    const codes = this.items().map(i => i.uniqueCode);
    return codes.some(c => this.selectedCodes().has(c)) && !this.isAllSelected();
  }

  getSelectedArray(): string[] {
    return Array.from(this.selectedCodes());
  }

  clearSelection() {
    this.selectedCodes.set(new Set());
    this.showExportPanel.set(false);
  }

  toggleAdvanced() {
    this.showAdvanced.update(v => !v);
  }

  toggleExportPanel() {
    this.showExportPanel.update(v => !v);
  }

  switchTab(tab: 'stock' | 'consumed') {
    this.activeTab.set(tab);
    this.pageIndex = 0;
    this.selectedStatus = '';
    this.load();
  }
}
