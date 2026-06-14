import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { InventoryService } from '../../core/services/inventory.service';
import { ItemSummaryDTO } from '../../core/models/inventory.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DatePipe, MatIconModule, MatProgressSpinnerModule, MatTooltipModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Resumen del estado del inventario</p>
      </div>
      <button class="refresh-btn" (click)="loadAll()">
        <mat-icon>refresh</mat-icon>
      </button>
    </div>

    @if (loading()) {
      <div class="loading-full"><mat-spinner diameter="44" /></div>
    } @else {

      <!-- KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-wrap purple">
            <mat-icon>inventory_2</mat-icon>
          </div>
          <div class="kpi-body">
            <p class="kpi-label">Stock activo total</p>
            <p class="kpi-value">{{ totalStock() }}</p>
            <p class="kpi-sub">ítems en inventario</p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap blue">
            <mat-icon>move_to_inbox</mat-icon>
          </div>
          <div class="kpi-body">
            <p class="kpi-label">En préstamo</p>
            <p class="kpi-value">{{ totalPrestado() }}</p>
            <p class="kpi-sub">{{ pctPrestado() }}% del stock activo</p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap green">
            <mat-icon>check_circle_outline</mat-icon>
          </div>
          <div class="kpi-body">
            <p class="kpi-label">Disponibles</p>
            <p class="kpi-value">{{ totalDisponible() }}</p>
            <p class="kpi-sub">{{ pctDisponible() }}% del stock activo</p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-wrap amber">
            <mat-icon>remove_circle_outline</mat-icon>
          </div>
          <div class="kpi-body">
            <p class="kpi-label">Consumidos</p>
            <p class="kpi-value">{{ totalConsumed() }}</p>
            <p class="kpi-sub">total histórico</p>
          </div>
        </div>
      </div>

      <!-- Row 2: Recent movements + Right column -->
      <div class="row-2">

        <!-- Últimos movimientos -->
        <div class="card">
          <h3 class="card-title">
            <mat-icon>history</mat-icon>
            Últimos movimientos
          </h3>
          @if (recentItems().length === 0) {
            <div class="empty small">
              <mat-icon>sensors</mat-icon>
              <p>Sin movimientos registrados</p>
            </div>
          } @else {
            <div class="table-wrap">
            <table class="mini-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Estado</th>
                  <th>Titular</th>
                  <th>Último mov.</th>
                </tr>
              </thead>
              <tbody>
                @for (item of recentItems(); track item.uniqueCode) {
                  <tr>
                    <td><span class="chip mono">{{ item.uniqueCode }}</span></td>
                    <td>{{ item.productName }}</td>
                    <td>
                      <span class="badge" [class]="statusClass(item.status)">
                        {{ item.status }}
                      </span>
                    </td>
                    <td>{{ item.currentHolder || '—' }}</td>
                    <td class="date-col">
                      {{ item.lastTransactionAt ? (item.lastTransactionAt | date:'dd/MM/yy HH:mm') : '—' }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            </div>
          }
        </div>

        <!-- Right column -->
        <div class="right-col">

          <!-- Donut -->
          <div class="card">
            <h3 class="card-title">
              <mat-icon>donut_large</mat-icon>
              Distribución de estados
            </h3>
            <div class="donut-wrap">
              <svg width="96" height="96" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="38" fill="none" stroke="var(--bg-sidebar)" stroke-width="12" />
                <circle cx="48" cy="48" r="38" fill="none" stroke="#22c55e" stroke-width="12"
                  [attr.stroke-dasharray]="donutDisponible()"
                  stroke-linecap="round"
                  transform="rotate(-90 48 48)" />
                <circle cx="48" cy="48" r="38" fill="none" stroke="#3b82f6" stroke-width="12"
                  [attr.stroke-dasharray]="donutPrestado()"
                  [attr.stroke-dashoffset]="donutPrestadoOffset()"
                  stroke-linecap="round"
                  transform="rotate(-90 48 48)" />
                <text x="48" y="52" text-anchor="middle" fill="var(--text-primary)"
                  font-size="14" font-weight="700">{{ totalStock() }}</text>
              </svg>
              <div class="donut-legend">
                <div class="legend-item">
                  <span class="legend-dot green"></span>
                  Disponible
                  <span class="legend-val">{{ totalDisponible() }}</span>
                </div>
                <div class="legend-item">
                  <span class="legend-dot blue"></span>
                  Prestado
                  <span class="legend-val">{{ totalPrestado() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Alertas de préstamos -->
          <div class="card">
            <h3 class="card-title">
              <mat-icon>warning_amber</mat-icon>
              Alertas de préstamos
              @if (overdueItems().length > 0) {
                <span class="alert-badge">{{ overdueItems().length }}</span>
              }
            </h3>
            @if (overdueItems().length === 0) {
              <div class="empty small">
                <mat-icon>check_circle</mat-icon>
                <p>Sin préstamos vencidos</p>
              </div>
            } @else {
              <div class="alert-list">
                @for (item of overdueItems(); track item.uniqueCode) {
                  <div class="alert-item">
                    <mat-icon class="alert-icon">schedule</mat-icon>
                    <div class="alert-body">
                      <p class="alert-title">
                        <span class="chip mono small">{{ item.uniqueCode }}</span>
                        {{ item.productName }}
                      </p>
                      <p class="alert-sub">
                        {{ item.currentHolder }} · {{ daysOverdue(item) }} días en préstamo
                      </p>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Top prestadores -->
          <div class="card">
            <h3 class="card-title">
              <mat-icon>people</mat-icon>
              Top prestadores activos
            </h3>
            @if (topHolders().length === 0) {
              <div class="empty small">
                <mat-icon>person_off</mat-icon>
                <p>Sin préstamos activos</p>
              </div>
            } @else {
              <div class="holders-list">
                @for (h of topHolders(); track h.name) {
                  <div class="holder-item">
                    <div class="holder-avatar">{{ initials(h.name) }}</div>
                    <span class="holder-name">{{ h.name }}</span>
                    <span class="holder-count">{{ h.count }} ítem(s)</span>
                  </div>
                }
              </div>
            }
          </div>

        </div>
      </div>

      <!-- Stock por producto -->
      <div class="card">
        <h3 class="card-title">
          <mat-icon>bar_chart</mat-icon>
          Stock por producto
        </h3>
        <div class="bars">
          @for (p of productStats(); track p.name) {
            <div class="bar-item">
              <div class="bar-meta">
                <span>{{ p.name }}</span>
                <span class="bar-val">{{ p.total }} uds · {{ p.prestado }} prestados</span>
              </div>
              <div class="bar-track">
                <div class="bar-fill-total"    [style.width.%]="p.pct"></div>
                <div class="bar-fill-prestado" [style.width.%]="p.pctPrestado"></div>
              </div>
            </div>
          }
        </div>
      </div>

    }
  `,
  styles: [`
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: 28px;
    }
    .page-title { font-size: 26px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .page-subtitle { font-size: 14px; color: var(--text-muted); margin: 0; }

    .refresh-btn {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 10px; padding: 8px; cursor: pointer; color: var(--text-muted);
      display: flex; align-items: center; transition: color .15s;
    }
    .refresh-btn:hover { color: var(--text-primary); }

    .loading-full { display: flex; justify-content: center; padding: 80px 0; }

    /* KPIs */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px; margin-bottom: 20px;
    }
    .kpi-card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 20px;
      display: flex; align-items: center; gap: 16px;
    }
    .kpi-icon-wrap {
      width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon-wrap mat-icon { font-size: 24px; width: 24px; height: 24px; color: #fff; }
    .kpi-icon-wrap.purple { background: #6366f1; }
    .kpi-icon-wrap.blue   { background: #3b82f6; }
    .kpi-icon-wrap.green  { background: #22c55e; }
    .kpi-icon-wrap.amber  { background: #eab308; }
    .kpi-body { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .kpi-label { font-size: 12px; color: var(--text-muted); margin: 0; }
    .kpi-value { font-size: 28px; font-weight: 700; color: var(--text-primary); margin: 0; line-height: 1.1; }
    .kpi-sub { font-size: 12px; color: var(--text-muted); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Layout */
    .row-2 {
      display: grid; grid-template-columns: 1fr 340px;
      gap: 16px; margin-bottom: 20px; align-items: start;
    }

    .card {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 14px; padding: 20px;
      overflow: hidden;
    }

    .table-wrap {
      overflow-x: auto;
      border-radius: 8px;
    }
    .card-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600; color: var(--text-primary);
      margin: 0 0 16px;
    }
    .card-title mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--text-muted); }

    .right-col { display: flex; flex-direction: column; gap: 16px; }

    /* Mini table */
    .mini-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 500px; }
    .mini-table th {
      text-align: left; color: var(--text-muted);
      font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase;
      padding: 0 8px 10px 0; border-bottom: 1px solid var(--border-color);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .mini-table td {
      padding: 10px 8px 10px 0; border-bottom: 1px solid var(--border-color);
      color: var(--text-primary); vertical-align: middle;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .mini-table tr:last-child td { border-bottom: none; }
    .date-col { color: var(--text-muted) !important; font-size: 12px; white-space: nowrap; }

    .chip {
      display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 12px;
      background: var(--bg-sidebar); border: 1px solid var(--border-color);
    }
    .chip.mono { font-family: monospace; color: var(--accent); font-weight: 700; }
    .chip.small { font-size: 11px; padding: 1px 6px; }

    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 20px;
      font-size: 11px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase;
    }
    .badge-disponible { background: rgba(34,197,94,.15);  color: #22c55e; }
    .badge-prestado   { background: rgba(59,130,246,.15); color: #3b82f6; }
    .badge-consumido  { background: rgba(234,179,8,.15);  color: #eab308; }
    .badge-unknown    { background: rgba(148,163,184,.15);color: #94a3b8; }

    /* Donut */
    .donut-wrap { display: flex; align-items: center; gap: 20px; }
    .donut-legend { display: flex; flex-direction: column; gap: 10px; }
    .legend-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-dot.green { background: #22c55e; }
    .legend-dot.blue  { background: #3b82f6; }
    .legend-val { margin-left: auto; font-weight: 700; color: var(--text-primary); padding-left: 16px; }

    /* Alertas */
    .alert-badge {
      margin-left: auto; background: rgba(234,179,8,.15); color: #eab308;
      font-size: 12px; font-weight: 700; padding: 2px 8px; border-radius: 10px;
    }
    .alert-list { display: flex; flex-direction: column; gap: 8px; }
    .alert-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 10px 12px; border-radius: 10px;
      background: rgba(234,179,8,.08); border: 1px solid rgba(234,179,8,.2);
    }
    .alert-icon { font-size: 18px; width: 18px; height: 18px; color: #eab308; margin-top: 1px; }
    .alert-body { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
    .alert-title { font-size: 13px; font-weight: 500; color: var(--text-primary); margin: 0; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .alert-sub { font-size: 12px; color: var(--text-muted); margin: 0; }

    /* Top holders */
    .holders-list { display: flex; flex-direction: column; gap: 10px; }
    .holder-item { display: flex; align-items: center; gap: 10px; }
    .holder-avatar {
      width: 32px; height: 32px; border-radius: 50%; background: var(--accent-soft);
      color: var(--accent); font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .holder-name { flex: 1; font-size: 13px; color: var(--text-primary); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .holder-count { font-size: 12px; color: var(--text-muted); white-space: nowrap; }

    /* Bars */
    .bars { display: flex; flex-direction: column; gap: 14px; }
    .bar-item { display: flex; flex-direction: column; gap: 5px; }
    .bar-meta { display: flex; justify-content: space-between; font-size: 13px; color: var(--text-muted); gap: 8px; }
    .bar-meta span:first-child { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-val { font-size: 12px; white-space: nowrap; }
    .bar-track { position: relative; height: 8px; background: var(--bg-sidebar); border-radius: 99px; overflow: hidden; }
    .bar-fill-total    { position: absolute; top: 0; left: 0; height: 100%; background: var(--accent); border-radius: 99px; opacity: .3; transition: width .4s; }
    .bar-fill-prestado { position: absolute; top: 0; left: 0; height: 100%; background: #3b82f6; border-radius: 99px; transition: width .4s; }

    /* Empty */
    .empty {
      display: flex; flex-direction: column; align-items: center;
      gap: 8px; padding: 32px; color: var(--text-muted);
    }
    .empty.small { padding: 16px; }
    .empty mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .empty p { font-size: 13px; margin: 0; }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .row-2 { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .page-title { font-size: 22px; }
      .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .kpi-card { padding: 14px; gap: 12px; }
      .kpi-value { font-size: 22px; }
      .kpi-icon-wrap { width: 40px; height: 40px; }
      .kpi-icon-wrap mat-icon { font-size: 20px; width: 20px; height: 20px; }
      .row-2 { grid-template-columns: 1fr; gap: 12px; }
      .card { padding: 16px; }
      .mini-table { font-size: 12px; }
      .mini-table th, .mini-table td { padding: 8px 6px 8px 0; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private svc = inject(InventoryService);

  loading       = signal(true);
  allItems      = signal<ItemSummaryDTO[]>([]);
  totalStock    = signal(0);
  totalConsumed = signal(0);

  totalDisponible = computed(() =>
    this.allItems().filter(i => i.status === 'DISPONIBLE').length
  );
  totalPrestado = computed(() =>
    this.allItems().filter(i => i.status === 'PRESTADO').length
  );
  pctPrestado = computed(() =>
    this.totalStock() > 0
      ? Math.round((this.totalPrestado() / this.totalStock()) * 100)
      : 0
  );
  pctDisponible = computed(() =>
    this.totalStock() > 0
      ? Math.round((this.totalDisponible() / this.totalStock()) * 100)
      : 0
  );

  recentItems = computed(() =>
    [...this.allItems()]
      .filter(i => i.lastTransactionAt)
      .sort((a, b) =>
        new Date(b.lastTransactionAt!).getTime() - new Date(a.lastTransactionAt!).getTime()
      )
      .slice(0, 8)
  );

  overdueItems = computed(() =>
    this.allItems()
      .filter(i => i.status === 'PRESTADO' && i.lastTransactionAt)
      .filter(i => this.daysOverdue(i) >= 7)
      .sort((a, b) => this.daysOverdue(b) - this.daysOverdue(a))
  );

  topHolders = computed(() => {
    const map = new Map<string, number>();
    this.allItems()
      .filter(i => i.status === 'PRESTADO' && i.currentHolder)
      .forEach(i => map.set(i.currentHolder!, (map.get(i.currentHolder!) ?? 0) + 1));
    return [...map.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  });

  productStats = computed(() => {
    const map = new Map<string, { total: number; prestado: number }>();
    this.allItems().forEach(i => {
      const cur = map.get(i.productName) ?? { total: 0, prestado: 0 };
      cur.total++;
      if (i.status === 'PRESTADO') cur.prestado++;
      map.set(i.productName, cur);
    });
    const max = Math.max(...[...map.values()].map(v => v.total), 1);
    return [...map.entries()]
      .map(([name, v]) => ({
        name,
        total:       v.total,
        prestado:    v.prestado,
        pct:         Math.round((v.total    / max) * 100),
        pctPrestado: Math.round((v.prestado / max) * 100),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  });

  private circumference = 2 * Math.PI * 38;

  donutDisponible = computed(() => {
    const arc = (this.totalDisponible() / Math.max(this.totalStock(), 1)) * this.circumference;
    return `${arc.toFixed(1)} ${(this.circumference - arc).toFixed(1)}`;
  });

  donutPrestado = computed(() => {
    const arc = (this.totalPrestado() / Math.max(this.totalStock(), 1)) * this.circumference;
    return `${arc.toFixed(1)} ${(this.circumference - arc).toFixed(1)}`;
  });

  donutPrestadoOffset = computed(() => {
    const disponibleArc = (this.totalDisponible() / Math.max(this.totalStock(), 1)) * this.circumference;
    return (-disponibleArc).toFixed(1);
  });

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.loading.set(true);
    this.svc.getInventory(0, 200, undefined, 'lastTransactionAt,desc').subscribe({
      next: page => {
        this.allItems.set(page.content);
        this.totalStock.set(page.totalElements);
        this.loadConsumedCount();
      },
      error: () => this.loading.set(false),
    });
  }

  private loadConsumedCount() {
    this.svc.getConsumed(0, 1).subscribe({
      next: page => {
        this.totalConsumed.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  daysOverdue(item: ItemSummaryDTO): number {
    if (!item.lastTransactionAt) return 0;
    const diff = Date.now() - new Date(item.lastTransactionAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      DISPONIBLE: 'badge-disponible',
      PRESTADO:   'badge-prestado',
      CONSUMIDO:  'badge-consumido',
    };
    return map[status] ?? 'badge-unknown';
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
