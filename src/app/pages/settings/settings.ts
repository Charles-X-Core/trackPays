import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <h1>Configuración</h1>
        <p class="page-subtitle">Ajustes de tu cuenta y preferencias</p>
      </header>
      
      <section class="settings-section">
        <h2>Perfil</h2>
        <div class="setting-item">
          <div class="setting-item__info">
            <span class="setting-item__label">Email</span>
            <span class="setting-item__value">{{ userEmail }}</span>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-item__info">
            <span class="setting-item__label">Nombre</span>
            <span class="setting-item__value">{{ userName }}</span>
          </div>
        </div>
      </section>
      
      <section class="settings-section">
        <h2>App</h2>
        <div class="setting-item">
          <div class="setting-item__info">
            <span class="setting-item__label">Moneda</span>
            <span class="setting-item__value">Sol Peruano (S/)</span>
          </div>
        </div>
        <div class="setting-item">
          <div class="setting-item__info">
            <span class="setting-item__label">Idioma</span>
            <span class="setting-item__value">Español</span>
          </div>
        </div>
      </section>
      
      <button class="btn btn-logout" (click)="logout()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
          <polyline points="16 17 21 12 16 7"/>
          <line x1="21" y1="12" x2="9" y2="12"/>
        </svg>
        Cerrar sesión
      </button>
    </div>
  `,
  styles: [`
    .page { animation: fadeIn 200ms ease-out forwards; }
    .page-header { margin-bottom: var(--space-6); }
    .page-header h1 { font-size: var(--text-2xl); font-weight: var(--font-bold); margin-bottom: var(--space-2); }
    .page-subtitle { color: var(--color-text-secondary); font-size: var(--text-sm); }
    
    .settings-section {
      margin-bottom: var(--space-6);
      
      h2 {
        font-size: var(--text-sm);
        font-weight: var(--font-semibold);
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: var(--space-3);
      }
    }
    
    .setting-item {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-3);
      
      &__info {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      &__label {
        font-size: var(--text-sm);
        color: var(--color-text-secondary);
      }
      
      &__value {
        font-size: var(--text-sm);
        color: var(--color-text);
        font-weight: var(--font-medium);
      }
    }
    
    .btn-logout {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-4);
      background: rgba(239, 68, 68, 0.1);
      color: var(--color-error);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: var(--radius-lg);
      font-weight: var(--font-semibold);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease-out);
      
      &:hover {
        background: rgba(239, 68, 68, 0.2);
      }
      
      &:active {
        transform: scale(0.98);
      }
    }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class SettingsComponent {
  private auth = inject(Auth);
  
  get userEmail(): string {
    return this.auth.currentUser()?.email ?? 'Sin email';
  }
  
  get userName(): string {
    return this.auth.currentUser()?.displayName ?? 'Usuario';
  }
  
  async logout() {
    await this.auth.signOut();
  }
}