import { Component, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { InventoryService } from '../../core/services/inventory.service';

@Component({
  selector: 'app-pdf-export-panel',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="panel">
      <div class="panel-header">
        <mat-icon class="panel-icon">picture_as_pdf</mat-icon>
        <div>
          <p class="panel-title">Exportar PDF</p>
          <p class="panel-subtitle">{{ uniqueCodes.length }} ítem(s) seleccionado(s)</p>
        </div>
      </div>

      <!-- Selector de columnas -->
      <div class="section">
        <p class="section-label">Columnas por fila</p>
        <div class="columns-grid">
          @for (n of columnOptions; track n) {
            <button
              type="button"
              class="col-btn"
              [class.selected]="columns === n"
              (click)="columns = n"
              [matTooltip]="n + ' columna(s)'"
            >
              <div class="col-preview">
                @for (cell of getGrid(n); track $index) {
                  <span class="cell"></span>
                }
              </div>
              <span class="col-label">{{ n }}</span>
            </button>
          }
        </div>
      </div>

      <!-- Cell padding slider -->
      <div class="section">
        <p class="section-label">
          Espaciado entre QRs
          <span class="value-badge">{{ cellPadding.toFixed(1) }}</span>
        </p>
        <mat-slider min="0.1" max="2.0" step="0.1" class="full-slider">
          <input matSliderThumb [(ngModel)]="cellPadding" />
        </mat-slider>
        <div class="slider-labels">
          <span>Compacto</span>
          <span>Espaciado</span>
        </div>
      </div>

      <!-- Botón exportar -->
      <button
        mat-flat-button
        color="primary"
        class="export-btn"
        [disabled]="uniqueCodes.length === 0 || exporting()"
        (click)="export()"
      >
        @if (exporting()) {
          <mat-spinner diameter="18" />
          <span>Generando PDF…</span>
        } @else {
          <mat-icon>download</mat-icon>
          <span>Descargar PDF</span>
        }
      </button>
    </div>
  `,
  styles: [`
    .panel {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .panel-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: var(--accent);
    }

    .panel-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 2px;
    }

    .panel-subtitle {
      font-size: 12px;
      color: var(--text-muted);
      margin: 0;
    }

    .section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .section-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: .6px;
      text-transform: uppercase;
      color: var(--text-muted);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .value-badge {
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      padding: 1px 8px;
      border-radius: 10px;
      letter-spacing: 0;
      text-transform: none;
    }

    /* Columns selector */
    .columns-grid {
      display: flex;
      gap: 8px;
    }

    .col-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      padding: 8px 6px;
      border-radius: 8px;
      border: 1.5px solid var(--border-color);
      background: transparent;
      cursor: pointer;
      transition: all .15s;
      flex: 1;
    }

    .col-btn:hover {
      border-color: var(--accent);
      background: var(--accent-soft);
    }

    .col-btn.selected {
      border-color: var(--accent);
      background: var(--accent-soft);
    }

    .col-preview {
      display: grid;
      gap: 2px;
      width: 32px;
      height: 24px;
    }

    .cell {
      background: var(--text-muted);
      border-radius: 2px;
      opacity: .5;
    }

    .col-btn.selected .cell {
      background: var(--accent);
      opacity: 1;
    }

    .col-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
    }

    .col-btn.selected .col-label {
      color: var(--accent);
    }

    /* Slider */
    .full-slider { width: 100%; }

    .slider-labels {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: -4px;
    }

    /* Export button */
    .export-btn {
      height: 44px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      justify-content: center;
    }
  `],
})
export class PdfExportPanelComponent {
  private svc   = inject(InventoryService);
  private snack = inject(MatSnackBar);

  @Input() uniqueCodes: string[] = [];

  columns     = 3;
  cellPadding = 0.5;
  exporting   = signal(false);

  columnOptions = [1, 2, 3, 4, 5, 6];

  /** Genera array de celdas para el preview visual del grid */
  getGrid(cols: number): number[] {
    const rows = Math.min(2, Math.ceil(4 / cols));
    return Array(cols * rows).fill(0);
  }

  export() {
    if (this.uniqueCodes.length === 0) return;
    this.exporting.set(true);

    this.svc.exportPdf({
      uniqueCodes: this.uniqueCodes,
      columns:     this.columns,
      cellPadding: this.cellPadding,
    }).subscribe({
      next: (blob) => {
        // Descarga automática del PDF
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `qr-export-${Date.now()}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
        this.snack.open('✅ PDF descargado correctamente', 'OK', { duration: 3000 });
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }
}