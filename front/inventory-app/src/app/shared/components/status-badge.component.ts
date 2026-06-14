import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `<span class="badge" [ngClass]="cls">{{ label }}</span>`,
  styles: [`
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .available { background: rgba(34,197,94,.15);  color: #22c55e; }
    .in-use    { background: rgba(59,130,246,.15); color: #3b82f6; }
    .consumed  { background: rgba(234,179,8,.15);  color: #eab308; }
    .unknown   { background: rgba(148,163,184,.15);color: #94a3b8; }
  `],
})
export class StatusBadgeComponent {
  @Input() status = '';

  private MAP: Record<string, { cls: string; label: string }> = {
    DISPONIBLE: { cls: 'available', label: 'Disponible' },
    PRESTADO:   { cls: 'in-use',    label: 'Prestado'   },
    CONSUMIDO:  { cls: 'consumed',  label: 'Consumido'  },
  };

  get cls()   { return this.MAP[this.status?.toUpperCase()]?.cls   ?? 'unknown'; }
  get label() { return this.MAP[this.status?.toUpperCase()]?.label ?? this.status ?? '—'; }
}
