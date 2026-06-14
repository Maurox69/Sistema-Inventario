import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InventoryService } from '../../../core/services/inventory.service';
import { ScanResponseDTO, ScanAction } from '../../../core/models/inventory.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';

interface ActionDef {
  value: ScanAction;
  label: string;
  icon: string;
  color: string;
  desc: string;
}

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [
    NgClass, ReactiveFormsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
    MatDividerModule, MatTooltipModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Scanner</h1>
        <p class="page-subtitle">Registra movimientos de activos mediante su código único o QR</p>
      </div>
    </div>

    <div class="layout">
      <!-- ── Formulario de escaneo ── -->
      <div class="panel">
        <!-- Zona de escaneo visual -->
        <div class="scan-zone">
          <div class="scan-frame">
            <mat-icon class="scan-icon">qr_code_scanner</mat-icon>
          </div>
          <p class="scan-tip">Escanea el QR o ingresa el código manualmente</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="scan-form">
          <!-- Código único -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Código único del ítem</mat-label>
            <input
              matInput formControlName="uniqueCode"
              placeholder="Ej: MOU-001"
              autocomplete="off"
              style="font-family:monospace;font-weight:600;letter-spacing:.5px"
            />
            <mat-icon matSuffix>qr_code</mat-icon>
            <mat-error>Requerido</mat-error>
          </mat-form-field>

          <!-- Selector de acción -->
          <p class="section-label">Acción a registrar</p>
          <div class="action-grid">
            @for (a of actions; track a.value) {
              <button
                type="button"
                class="action-tile"
                [class.selected]="selectedAction === a.value"
                [style.--c]="a.color"
                (click)="selectAction(a.value)"
                [matTooltip]="a.desc"
              >
                <mat-icon>{{ a.icon }}</mat-icon>
                <span>{{ a.label }}</span>
              </button>
            }
          </div>

          <!-- Responsable -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Usuario responsable</mat-label>
            <input matInput formControlName="responsibleUser" placeholder="Nombre del usuario" />
            <mat-icon matSuffix>person</mat-icon>
            <mat-error>Requerido</mat-error>
          </mat-form-field>

          <!-- Notas opcionales -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Notas (opcional)</mat-label>
            <textarea matInput formControlName="notes" rows="2"
              placeholder="Observaciones sobre este movimiento"></textarea>
          </mat-form-field>

          <button
            mat-flat-button color="primary"
            type="submit"
            [disabled]="form.invalid || scanning()"
            class="submit-btn"
          >
            @if (scanning()) { <mat-spinner diameter="18" /> <span>Registrando…</span> }
            @else { <mat-icon>send</mat-icon> <span>Registrar escaneo</span> }
          </button>
        </form>
      </div>

      <!-- ── Panel derecho: Resultado + Historial sesión ── -->
      <div class="right-col">

        <!-- Último resultado -->
        @if (lastResult()) {
          <div class="result-card">
            <div class="result-header">
              <mat-icon class="result-ok">check_circle</mat-icon>
              <div>
                <p class="result-title">Escaneo registrado</p>
                <p class="result-product">{{ lastResult()!.productName }}</p>
              </div>
            </div>
            <mat-divider />
            <div class="result-grid">
              <div class="result-row">
                <span class="result-key">Código</span>
                <span class="chip mono">{{ lastResult()!.uniqueCode }}</span>
              </div>
              <div class="result-row">
                <span class="result-key">Nuevo estado</span>
                <app-status-badge [status]="lastResult()!.newStatus" />
              </div>
              <div class="result-row">
                <span class="result-key">Titular actual</span>
                <span class="result-val">{{ lastResult()!.currentHolder || '—' }}</span>
              </div>
            </div>
          </div>
        }

        <!-- Historial de la sesión -->
        <div class="panel">
          <h2 class="panel-title">
            <mat-icon>history</mat-icon>
            Sesión actual
            @if (sessionHistory().length) {
              <span class="count-badge">{{ sessionHistory().length }}</span>
            }
          </h2>

          @if (sessionHistory().length === 0) {
            <div class="empty">
              <mat-icon>sensors</mat-icon>
              <p>Registra tu primer escaneo</p>
            </div>
          } @else {
            <div class="hist-list">
              @for (entry of sessionHistory(); track entry.uniqueCode + entry.newStatus) {
                <div class="hist-item">
                  <span class="chip mono small">{{ entry.uniqueCode }}</span>
                  <span class="hist-product">{{ entry.productName }}</span>
                  <app-status-badge [status]="entry.newStatus" />
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-header { margin-bottom: 28px; }
    .page-title { font-size: 26px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--text-muted); margin: 0; }

    .layout {
      display: grid; grid-template-columns: 420px 1fr;
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
      margin: 0 0 16px;
    }
    .count-badge {
      margin-left: auto;
      background: var(--accent-soft); color: var(--accent);
      font-size: 12px; font-weight: 700;
      padding: 2px 9px; border-radius: 12px;
    }

    .scan-zone {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; margin-bottom: 20px; padding: 20px;
      border: 2px dashed var(--border-color); border-radius: 12px;
    }
    .scan-frame {
      width: 72px; height: 72px; border-radius: 16px;
      background: var(--accent-soft);
      display: flex; align-items: center; justify-content: center;
    }
    .scan-icon { font-size: 40px; width: 40px; height: 40px; color: var(--accent); }
    .scan-tip { font-size: 13px; color: var(--text-muted); margin: 0; text-align: center; }

    .scan-form { display: flex; flex-direction: column; gap: 8px; }
    .w-full { width: 100%; }

    .section-label {
      font-size: 12px; font-weight: 600; letter-spacing: .5px;
      text-transform: uppercase; color: var(--text-muted); margin: 4px 0 8px;
    }

    .action-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 8px; margin-bottom: 8px;
    }
    .action-tile {
      display: flex; flex-direction: column; align-items: center; gap: 5px;
      padding: 12px 8px; border-radius: 10px;
      border: 1.5px solid var(--border-color);
      background: transparent; color: var(--text-muted);
      cursor: pointer; font-size: 12px; font-weight: 600;
      transition: all .15s; font-family: inherit;
    }
    .action-tile mat-icon { font-size: 22px; width: 22px; height: 22px; }
    .action-tile:hover {
      border-color: var(--c); color: var(--c);
      background: color-mix(in srgb, var(--c) 10%, transparent);
    }
    .action-tile.selected {
      border-color: var(--c); color: var(--c);
      background: color-mix(in srgb, var(--c) 15%, transparent);
    }

    .submit-btn {
      height: 46px; font-weight: 700; margin-top: 4px;
      display: flex; align-items: center; gap: 8px;
    }

    /* Right col */
    .right-col { display: flex; flex-direction: column; gap: 20px; }

    /* Result card */
    .result-card {
      background: var(--bg-card);
      border: 1px solid rgba(34,197,94,.25);
      border-radius: 14px; padding: 20px;
    }
    .result-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .result-ok { font-size: 32px; width: 32px; height: 32px; color: #22c55e; }
    .result-title { font-size: 15px; font-weight: 700; margin: 0 0 2px; }
    .result-product { font-size: 13px; color: var(--text-muted); margin: 0; }

    .result-grid { display: flex; flex-direction: column; gap: 12px; margin-top: 16px; }
    .result-row { display: flex; justify-content: space-between; align-items: center; }
    .result-key { font-size: 13px; color: var(--text-muted); }
    .result-val { font-size: 13px; font-weight: 500; }

    .chip {
      display: inline-block; padding: 2px 9px; border-radius: 6px; font-size: 13px;
      background: var(--bg-sidebar); border: 1px solid var(--border-color);
    }
    .chip.mono { font-family: monospace; color: var(--accent); font-weight: 700; }
    .chip.small { font-size: 11px; padding: 1px 6px; }

    /* Session history */
    .empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 32px; color: var(--text-muted);
    }
    .empty mat-icon { font-size: 36px; width: 36px; height: 36px; }

    .hist-list { display: flex; flex-direction: column; gap: 10px; }
    .hist-item {
      display: flex; align-items: center; gap: 10px;
      padding: 8px 0; border-bottom: 1px solid var(--border-color);
    }
    .hist-item:last-child { border-bottom: none; }
    .hist-product { flex: 1; font-size: 13px; color: var(--text-muted); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Responsive */
    @media (max-width: 960px) {
      .layout { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .page-title { font-size: 22px; }
      .panel { padding: 16px; }
      .scan-zone { padding: 16px; }
      .scan-frame { width: 56px; height: 56px; }
      .scan-icon { font-size: 32px; width: 32px; height: 32px; }
      .action-grid { grid-template-columns: repeat(3, 1fr); }
      .action-tile { padding: 10px 6px; font-size: 11px; }
      .action-tile mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
  `],
})
export class ScannerComponent {
  private svc   = inject(InventoryService);
  private fb    = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  scanning       = signal(false);
  lastResult     = signal<ScanResponseDTO | null>(null);
  sessionHistory = signal<ScanResponseDTO[]>([]);
  selectedAction = 'CHECKOUT';

  actions: ActionDef[] = [
    { value: 'CHECKOUT', label: 'Prestar',  icon: 'move_to_inbox',         color: '#3b82f6', desc: 'Préstamo temporal — se espera devolución'      },
    { value: 'CHECKIN',  label: 'Devolver', icon: 'assignment_return',     color: '#22c55e', desc: 'Devuelve el ítem al inventario como disponible' },
    { value: 'CONSUME',  label: 'Consumir', icon: 'remove_circle_outline', color: '#ef4444', desc: 'Descuenta el ítem del stock definitivamente'    },
  ];

  form = this.fb.group({
    uniqueCode:      ['', Validators.required],
    responsibleUser: ['', Validators.required],
    notes:           [''],
  });

  selectAction(v: string) { this.selectedAction = v; }

  submit() {
    if (this.form.invalid) return;
    this.scanning.set(true);
    const v = this.form.getRawValue();
    this.svc.scan({
      uniqueCode:      v.uniqueCode!,
      action:          this.selectedAction,
      responsibleUser: v.responsibleUser!,
      notes:           v.notes ?? '',
    }).subscribe({
      next: res => {
        this.lastResult.set(res);
        this.sessionHistory.update(h => [res, ...h].slice(0, 30));
        this.snack.open(`✅ ${res.uniqueCode} → ${res.newStatus}`, 'OK', { duration: 3000 });
        this.form.patchValue({ uniqueCode: '', notes: '' });
        this.scanning.set(false);
      },
      error: () => this.scanning.set(false),
    });
  }
}
