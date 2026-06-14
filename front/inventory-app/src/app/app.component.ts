import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './layout/sidebar.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="app-shell">
      <app-sidebar />
      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--bg-page);
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 32px;
      min-width: 0;
    }

    @media (max-width: 768px) {
      .app-shell {
        flex-direction: column;
      }

      .main-content {
        padding: 64px 16px 24px;
        height: 100vh;
        overflow-y: auto;
      }
    }
  `],
})
export class AppComponent {}
