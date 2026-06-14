import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Component as NgComponent, Inject } from '@angular/core';

import { ProductService } from '../../../core/services/product.service';
import { InventoryService } from '../../../core/services/inventory.service';
import { PdfExportPanelComponent } from '../../../shared/components/pdf-export-panel.component';
import { ProductResponseDTO, ItemQRResponseDTO } from '../../../core/models/inventory.models';

// ── Genera prefijo automático a partir del nombre ─────────────────────────
function autoPrefix(name: string, max = 6): string {
  const clean = name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9\s]/g, '');
  const words = clean.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '';
  if (words.length === 1) return words[0].slice(0, max);
  const acronym = words.map(w => w[0]).join('');
  return acronym.length >= 3 ? acronym.slice(0, max) : words[0].slice(0, max);
}

// ── Dialog: ingresar cantidad + ver QR ────────────────────────────────────
@NgComponent({
  selector: 'app-ingest-dialog',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDividerModule, MatTooltipModule,
    PdfExportPanelComponent,
  ],
  template: `
    <!-- Header -->
    <div class="dlg-header">
      <div>
        <h2 mat-dialog-title>Ingresar stock</h2>
        <p class="dlg-sub">
          <span class="chip">{{ product.codePrefix }}</span>
          {{ product.name }}
        </p>
      </div>
      <button mat-icon-button (click)="cancel()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content>
      <!-- STEP 1: elegir cantidad -->
      @if (!qrResults().length && !ingesting()) {
        <div class="step-qty">
          <mat-icon class="step-icon">add_box</mat-icon>
          <p class="step-hint">¿Cuántos ítems deseas registrar?</p>
          <mat-form-field appearance="outline" class="qty-field">
            <mat-label>Cantidad de ítems</mat-label>
            <input matInput type="number" [(ngModel)]="qty" min="1" max="100" />
            <mat-hint>Entre 1 y 100 por ingreso</mat-hint>
          </mat-form-field>
          <p class="step-info">
            <mat-icon style="font-size:14px;width:14px;height:14px;vertical-align:middle;color:var(--accent)">info</mat-icon>
            Se crearán <strong>{{ qty }}</strong> registro(s) en la BD, cada uno con su propio
            código único y QR generado automáticamente.
          </p>
        </div>
      }

      <!-- STEP 2: generando -->
      @if (ingesting()) {
        <div class="step-loading">
          <mat-spinner diameter="48" />
          <p>Generando {{ qty }} ítem(s) y sus códigos QR…</p>
          <p class="step-sub">Esto puede tomar unos segundos</p>
        </div>
      }

      <!-- STEP 3: resultados QR -->
      @if (qrResults().length && !ingesting()) {
        <div class="step-results">
          <div class="results-banner">
            <mat-icon class="check-icon">check_circle</mat-icon>
            <div>
              <p class="results-title">{{ qrResults().length }} ítem(s) creados correctamente</p>
              <p class="results-sub">Descargá o imprimí los QR para pegarlos en cada activo</p>
            </div>
          </div>

          <app-pdf-export-panel [uniqueCodes]="getUniqueCodes()" />

          <div class="qr-grid">
            @for (item of qrResults(); track item.itemId) {
              <div class="qr-card">
                <div class="qr-wrap">
                  <img
                    [src]="getQrSrc(item.qrImageBase64)"
                    [alt]="item.uniqueCode"
                    class="qr-img"
                  />
                </div>
                <span class="chip mono small">{{ item.uniqueCode }}</span>
                <button mat-icon-button (click)="downloadQR(item)" matTooltip="Descargar PNG">
                  <mat-icon>download</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>
      }
    </mat-dialog-content>

    <mat-divider />

    <mat-dialog-actions align="end">
      @if (!qrResults().length) {
        <button mat-button (click)="cancel()" [disabled]="ingesting()">Cancelar</button>
        <button
          mat-flat-button color="primary"
          [disabled]="qty < 1 || qty > 100 || ingesting()"
          (click)="ingest()"
        >
          @if (ingesting()) { <mat-spinner diameter="16" /> }
          @else {
            <ng-container>
              <mat-icon>qr_code_2</mat-icon>
              Generar {{ qty }} QR
            </ng-container>
          }
        </button>
      } @else {
        <button mat-button (click)="printAll()">
          <mat-icon>print</mat-icon> Imprimir todos
        </button>
        <button mat-flat-button color="primary" (click)="close()">
          <mat-icon>done</mat-icon> Listo
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 20px 20px 0;
    }
    h2 { margin: 0 0 5px; font-size: 18px; font-weight: 700; }
    .dlg-sub {
      display: flex; align-items: center; gap: 8px;
      font-size: 13px; color: var(--text-muted,#7c8499); margin: 0;
    }
    .chip {
      font-size: 12px; background: var(--bg-sidebar,#161b25);
      border: 1px solid var(--border-color,rgba(255,255,255,.08));
      padding: 1px 7px; border-radius: 5px;
    }
    .chip.mono { font-family: monospace; color: var(--accent,#6366f1); }
    .chip.small { font-size: 11px; }

    mat-dialog-content { padding: 24px !important; min-height: 200px; }

    /* Step 1 */
    .step-qty {
      display: flex; flex-direction: column; align-items: center;
      gap: 14px; padding: 8px 0;
    }
    .step-icon { font-size: 52px; width: 52px; height: 52px; color: var(--accent,#6366f1); }
    .step-hint { font-size: 15px; font-weight: 600; color: var(--text-primary,#e8eaf0); margin: 0; }
    .qty-field { width: 200px; }
    .step-info {
      font-size: 12px; color: var(--text-muted,#7c8499); margin: 0;
      background: var(--bg-sidebar,#161b25);
      border: 1px solid var(--border-color,rgba(255,255,255,.08));
      border-radius: 8px; padding: 10px 14px; max-width: 340px; text-align: center;
    }

    /* Step 2 */
    .step-loading {
      display: flex; flex-direction: column; align-items: center;
      gap: 16px; padding: 32px 0; color: var(--text-muted,#7c8499);
    }
    .step-sub { font-size: 12px; margin: -8px 0 0; }

    /* Step 3 */
    .step-results { display: flex; flex-direction: column; gap: 16px; }
    .results-banner {
      display: flex; align-items: center; gap: 12px;
      background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.2);
      border-radius: 10px; padding: 12px 16px;
    }
    .check-icon { font-size: 32px; width: 32px; height: 32px; color: #22c55e; }
    .results-title { font-size: 14px; font-weight: 700; margin: 0 0 2px; }
    .results-sub { font-size: 12px; color: var(--text-muted,#7c8499); margin: 0; }

    .qr-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(120px,1fr));
      gap: 12px; max-height: 320px; overflow-y: auto;
    }
    .qr-card {
      display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: 10px 6px 4px;
      background: var(--bg-sidebar,#161b25);
      border: 1px solid var(--border-color,rgba(255,255,255,.08));
      border-radius: 10px;
      transition: border-color .15s;
    }
    .qr-card:hover { border-color: var(--accent,#6366f1); }
    .qr-wrap {
      width: 96px; height: 96px; background: #fff; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    .qr-img { width: 88px; height: 88px; object-fit: contain; }

    mat-dialog-actions { padding: 12px 20px !important; gap: 8px; }
    mat-dialog-actions button { display: flex; align-items: center; gap: 6px; }
  `],
})
export class IngestDialogComponent {
  private inventorySvc = inject(InventoryService);
  private ref = inject(MatDialogRef<IngestDialogComponent>);

  qty = 1;
  ingesting  = signal(false);
  qrResults  = signal<ItemQRResponseDTO[]>([]);

  constructor(@Inject(MAT_DIALOG_DATA) public product: ProductResponseDTO) {}

  ingest() {
    if (this.qty < 1 || this.qty > 100) return;
    this.ingesting.set(true);
    this.inventorySvc.ingest({ productId: this.product.id, quantity: this.qty }).subscribe({
      next: items => { this.qrResults.set(items); this.ingesting.set(false); },
      error: ()    => this.ingesting.set(false),
    });
  }

  getQrSrc(base64: string): string {
    if (!base64) return '';
    return base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`;
  }

  downloadQR(item: ItemQRResponseDTO) {
    const a = document.createElement('a');
    a.href     = this.getQrSrc(item.qrImageBase64);
    a.download = `QR_${item.uniqueCode}.png`;
    a.click();
  }

  printAll() {
    const win = window.open('', '_blank');
    if (!win) return;
    const html = this.qrResults().map(i =>
      `<div style="display:inline-block;margin:10px;text-align:center;font-family:sans-serif">
        <img src="${this.getQrSrc(i.qrImageBase64)}" width="140"/><br/>
        <b style="font-size:12px;font-family:monospace">${i.uniqueCode}</b><br/>
        <span style="font-size:11px">${i.productName}</span>
      </div>`
    ).join('');
    win.document.write(`
      <html>
      <head>
        <meta charset="utf-8">
        <title>QR Codes</title>
        <style>
          body { padding: 16px; margin: 0; }
          img { display: block; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 800);
  }

  getUniqueCodes(): string[] {
    return this.qrResults().map(i => i.uniqueCode);
  }

  cancel() { this.ref.close(); }
  close()  { this.ref.close(true); }  // true = se ingresaron ítems
}


// ── Product List Component ────────────────────────────────────────────────
@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule, MatSlideToggleModule, MatDialogModule,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Productos</h1>
        <p class="page-subtitle">Catálogo de tipos de activos registrados</p>
      </div>
    </div>

    <div class="layout">
      <!-- ── Panel izquierdo: Crear producto ── -->
      <div class="panel">
        <h2 class="panel-title">
          <mat-icon>add_circle_outline</mat-icon>
          Nuevo producto
        </h2>

        <form [formGroup]="form" (ngSubmit)="submit()" class="form">
          <!-- Nombre con auto-prefijo -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Nombre del producto</mat-label>
            <input
              matInput formControlName="name"
              placeholder="Ej: Mouse Inalámbrico Logitech"
              (input)="onNameInput()"
            />
            <mat-error>Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Descripción (opcional)</mat-label>
            <textarea matInput formControlName="description" rows="2"
              placeholder="Descripción breve del activo"></textarea>
          </mat-form-field>

          <!-- Prefijo: auto-generado, editable -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Prefijo de código</mat-label>
            <input
              matInput formControlName="codePrefix"
              maxlength="10"
              placeholder="AUTO"
              style="text-transform:uppercase;font-family:monospace;font-weight:600"
            />
            <mat-hint>Se genera automáticamente · máx. 10 caracteres</mat-hint>
            <mat-error *ngIf="f['codePrefix'].hasError('required')">Requerido</mat-error>
            <mat-error *ngIf="f['codePrefix'].hasError('maxlength')">Máx. 10 caracteres</mat-error>
          </mat-form-field>

          <div class="toggle-row" style="margin-top: 12px;">
            <mat-slide-toggle formControlName="requiresBarcodeGeneration" color="primary">
              Generar QR automático al ingresar stock
            </mat-slide-toggle>
            <p class="toggle-hint">
              Cada ítem ingresado tendrá su propio código QR único
            </p>
          </div>

          <button
            mat-flat-button color="primary"
            type="submit"
            [disabled]="form.invalid || saving()"
            class="save-btn"
          >
            @if (saving()) { <mat-spinner diameter="18" /> }
            @else {
              <ng-container>
                <mat-icon>save</mat-icon> Guardar producto
              </ng-container>
            }
          </button>
        </form>
      </div>

      <!-- ── Panel derecho: Tabla de productos ── -->
      <div class="panel">
        <h2 class="panel-title">
          <mat-icon>list</mat-icon>
          Productos registrados
          <span class="count-badge">{{ products().length }}</span>
        </h2>

        @if (loading()) {
          <div class="center"><mat-spinner diameter="36" /></div>
        } @else {
          <div class="table-wrap">
            <table mat-table [dataSource]="products()">

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nombre</th>
                <td mat-cell *matCellDef="let r">
                  <p class="prod-name">{{ r.name }}</p>
                  @if (r.description) {
                    <p class="prod-desc">{{ r.description }}</p>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="codePrefix">
                <th mat-header-cell *matHeaderCellDef>Prefijo</th>
                <td mat-cell *matCellDef="let r">
                  <span class="chip mono">{{ r.codePrefix || '—' }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="qr">
                <th mat-header-cell *matHeaderCellDef class="col-hide-mobile">QR</th>
                <td mat-cell *matCellDef="let r" class="col-hide-mobile">
                  <mat-icon [style.color]="r.requiresBarcodeGeneration ? '#22c55e' : '#475569'">
                    {{ r.requiresBarcodeGeneration ? 'qr_code' : 'remove' }}
                  </mat-icon>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let r">
                  <button
                    mat-stroked-button
                    class="ingest-btn"
                    (click)="openIngest(r)"
                    matTooltip="Ingresar unidades al inventario"
                  >
                    <mat-icon>add_box</mat-icon>
                    Ingresar cantidad
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="cols"></tr>
              <tr mat-row *matRowDef="let r; columns: cols;" class="table-row"></tr>
            </table>

            @if (products().length === 0) {
              <div class="empty">
                <mat-icon>category</mat-icon>
                <p>No hay productos registrados aún</p>
                <p class="empty-sub">Crea el primero con el formulario de la izquierda</p>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 26px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--text-muted); margin: 0; }

    .layout {
      display: grid; grid-template-columns: 360px 1fr;
      gap: 24px; align-items: start;
    }

    .panel {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px; padding: 24px;
    }
    .panel-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600; color: var(--text-primary);
      margin: 0 0 20px;
    }
    .count-badge {
      margin-left: auto;
      background: var(--accent-soft); color: var(--accent);
      font-size: 12px; font-weight: 700;
      padding: 2px 9px; border-radius: 12px;
    }

    .form { display: flex; flex-direction: column; gap: 8px; }
    .w-full { width: 100%; }

    .toggle-row { display: flex; flex-direction: column; gap: 4px; margin: 4px 0; }
    .toggle-hint { font-size: 12px; color: var(--text-muted); }

    .save-btn {
      height: 44px; font-weight: 600; margin-top: 4px;
      display: flex; align-items: center; gap: 8px;
    }

    /* Table */
    .table-wrap { overflow: auto; border-radius: 10px; }
    table { width: 100%; }
    .prod-name { font-size: 14px; font-weight: 500; margin: 0 0 2px; }
    .prod-desc { font-size: 12px; color: var(--text-muted); margin: 0; }

    .chip {
      display: inline-block; padding: 2px 9px; border-radius: 6px;
      font-size: 13px; background: var(--bg-sidebar);
      border: 1px solid var(--border-color);
    }
    .chip.mono { font-family: monospace; color: var(--accent); font-weight: 700; }

    .ingest-btn {
      font-size: 12px; height: 32px;
      border-color: var(--accent) !important;
      color: var(--accent) !important;
      display: flex; align-items: center; gap: 4px;
      white-space: nowrap;
    }
    .ingest-btn mat-icon { font-size: 17px; width: 17px; height: 17px; }

    .table-row:hover td { background: var(--hover-bg); }

    .center { display: flex; justify-content: center; padding: 40px; }
    .empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 48px; color: var(--text-muted);
    }
    .empty mat-icon { font-size: 40px; width: 40px; height: 40px; }
    .empty-sub { font-size: 12px; margin: 0; }

    /* Responsive */
    @media (max-width: 900px) {
      .layout { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .page-title { font-size: 22px; }
      .panel { padding: 16px; }
      .ingest-btn mat-icon { display: none; }
      .ingest-btn { font-size: 11px; padding: 0 8px; }

      /* Oculta columnas secundarias en móvil */
      .col-hide-mobile { display: none; }
    }
  `],
})
export class ProductListComponent implements OnInit {
  private svc    = inject(ProductService);
  private fb     = inject(FormBuilder);
  private snack  = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  cols = ['name', 'codePrefix', 'qr', 'actions'];
  products = signal<ProductResponseDTO[]>([]);
  loading  = signal(false);
  saving   = signal(false);

  form = this.fb.group({
    name:                      ['', Validators.required],
    description:               [''],
    codePrefix:                ['', [Validators.required, Validators.maxLength(10)]],
    requiresBarcodeGeneration: [true],
  });

  get f(): { [key: string]: AbstractControl } { return this.form.controls; }

  ngOnInit() { this.load(); }

  /** Dispara al escribir el nombre → actualiza prefijo */
  onNameInput() {
    const name = this.form.get('name')?.value ?? '';
    this.form.patchValue({ codePrefix: autoPrefix(name) }, { emitEvent: false });
  }

  load() {
    this.loading.set(true);
    this.svc.getProducts().subscribe({
      next: p  => { this.products.set(p); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.svc.createProduct({
      name:                      v.name!,
      description:               v.description ?? '',
      codePrefix:                (v.codePrefix ?? '').toUpperCase(),
      requiresBarcodeGeneration: v.requiresBarcodeGeneration ?? false,
    }).subscribe({
      next: p => {
        this.products.update(l => [...l, p]);
        this.snack.open(`✅ Producto "${p.name}" creado`, 'OK', { duration: 3000 });
        this.form.reset({ requiresBarcodeGeneration: true });
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  openIngest(product: ProductResponseDTO) {
    const ref = this.dialog.open(IngestDialogComponent, {
      data: product,
      width: '95vw',
      maxWidth: '700px',
      maxHeight: '90vh',
      panelClass: 'dark-dialog',
    });
    // Si se ingresaron ítems, muestra notificación
    ref.afterClosed().subscribe(ingested => {
      if (ingested) {
        this.snack.open('✅ Ítems registrados — ya aparecen en Inventario', 'OK', { duration: 4000 });
      }
    });
  }
}
