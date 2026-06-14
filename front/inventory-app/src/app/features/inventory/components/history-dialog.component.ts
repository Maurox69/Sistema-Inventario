import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { InventoryService } from '../../../core/services/inventory.service';
import { ItemSummaryDTO, TransactionHistoryDTO } from '../../../core/models/inventory.models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge.component';

interface TxMeta { cls: string; label: string; icon: string; }

@Component({
  selector: 'app-history-dialog',
  standalone: true,
  imports: [
    DatePipe, NgClass,
    MatDialogModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="dlg-header">
      <div>
        <h2 mat-dialog-title>Historial del ítem</h2>
        <p class="dlg-sub">
          <span class="chip">{{ data.uniqueCode }}</span>
          {{ data.productName }}
          &nbsp;
          <app-status-badge [status]="data.status" />
        </p>
      </div>
      <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
    </div>

    <mat-dialog-content>
      @if (loading()) {
        <div class="center"><mat-spinner diameter="32" /></div>
      } @else if (history().length === 0) {
        <div class="empty">
          <mat-icon>history_toggle_off</mat-icon>
          <p>Sin transacciones registradas</p>
        </div>
      } @else {
        <div class="timeline">
          @for (tx of history(); track tx.timestamp; let last = $last) {
            <div class="tl-row">
              <!-- dot + line -->
              <div class="tl-left">
                <span class="tl-dot" [ngClass]="meta(tx.transactionType).cls"></span>
                @if (!last) { <span class="tl-line"></span> }
              </div>
              <!-- content -->
              <div class="tl-body">
                <div class="tl-head">
                  <span class="tx-badge" [ngClass]="meta(tx.transactionType).cls">
                    <mat-icon class="tx-icon">{{ meta(tx.transactionType).icon }}</mat-icon>
                    {{ meta(tx.transactionType).label }}
                  </span>
                  <span class="tx-date">{{ tx.timestamp | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                @if (tx.responsibleUser) {
                  <p class="tx-user">
                    <mat-icon style="font-size:13px;width:13px;height:13px;vertical-align:middle">person</mat-icon>
                    {{ tx.responsibleUser }}
                  </p>
                }
                @if (tx.notes) {
                  <p class="tx-notes">"{{ tx.notes }}"</p>
                }
              </div>
            </div>
          }
        </div>
      }
    </mat-dialog-content>

    <mat-divider />
    <mat-dialog-actions align="end">
      <button mat-button (click)="close()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dlg-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 20px 20px 0;
    }
    h2 { margin: 0 0 6px; font-size: 18px; font-weight: 700; }
    .dlg-sub {
      display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
      font-size: 13px; color: var(--text-muted); margin: 0;
    }
    .chip {
      font-family: monospace; font-size: 12px;
      background: var(--bg-sidebar); border: 1px solid var(--border-color);
      padding: 1px 7px; border-radius: 5px; color: var(--accent);
    }
    mat-dialog-content { padding: 20px !important; max-height: 420px; }

    .center { display: flex; justify-content: center; padding: 40px; }
    .empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 10px; padding: 40px; color: var(--text-muted);
    }
    .empty mat-icon { font-size: 40px; width: 40px; height: 40px; }

    /* Timeline */
    .timeline { display: flex; flex-direction: column; }
    .tl-row { display: flex; gap: 14px; }
    .tl-left {
      display: flex; flex-direction: column; align-items: center;
      flex-shrink: 0; width: 14px;
    }
    .tl-dot {
      width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
    }
    .tl-line { flex: 1; width: 2px; background: var(--border-color); min-height: 16px; }
    .tl-body { flex: 1; padding-bottom: 16px; }

    .tl-head {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;
    }
    .tx-badge {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 11px; font-weight: 700; letter-spacing: .4px;
      text-transform: uppercase; padding: 2px 8px; border-radius: 4px;
    }
    .tx-icon { font-size: 13px; width: 13px; height: 13px; }
    .tx-date { font-size: 12px; color: var(--text-muted); }
    .tx-user { font-size: 12px; color: var(--text-muted); margin: 3px 0 0; }
    .tx-notes { font-size: 12px; color: var(--text-muted); font-style: italic; margin: 3px 0 0; }

    /* Dot / badge colors by action */
    .checkout { background: rgba(59,130,246,.15);  color: #3b82f6; }
    .checkin  { background: rgba(34,197,94,.15);   color: #22c55e; }
    .repair   { background: rgba(234,179,8,.15);   color: #eab308; }
    .retire   { background: rgba(239,68,68,.15);   color: #ef4444; }
    .ingest   { background: rgba(168,85,247,.15);  color: #a855f7; }
    .tx-default { background: rgba(148,163,184,.15);color: #94a3b8; }

    .tl-dot.checkout { background: #3b82f6; }
    .tl-dot.checkin  { background: #22c55e; }
    .tl-dot.repair   { background: #eab308; }
    .tl-dot.retire   { background: #ef4444; }
    .tl-dot.ingest   { background: #a855f7; }
    .tl-dot.tx-default { background: #94a3b8; }

    mat-dialog-actions { padding: 12px 20px !important; }
  `],
})
export class HistoryDialogComponent implements OnInit {
  private svc = inject(InventoryService);
  private ref = inject(MatDialogRef<HistoryDialogComponent>);

  history = signal<TransactionHistoryDTO[]>([]);
  loading = signal(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: ItemSummaryDTO) {}

  ngOnInit() {
    this.loading.set(true);
    this.svc.getHistory(this.data.uniqueCode).subscribe({
      next: h => { this.history.set(h); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  private TX: Record<string, TxMeta> = {
    CHECKOUT: { cls: 'checkout',   label: 'Salida',       icon: 'logout'   },
    CHECKIN:  { cls: 'checkin',    label: 'Entrada',      icon: 'login'    },
    REPAIR:   { cls: 'repair',     label: 'Reparación',   icon: 'build'    },
    RETIRE:   { cls: 'retire',     label: 'Retiro',       icon: 'archive'  },
    INGEST:   { cls: 'ingest',     label: 'Ingreso',      icon: 'add_box'  },
  };

  meta(type: string): TxMeta {
    return this.TX[type?.toUpperCase()] ?? { cls: 'tx-default', label: type ?? '—', icon: 'circle' };
  }

  close() { this.ref.close(); }
}
