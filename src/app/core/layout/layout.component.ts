import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../services/auth';
import { LayoutService } from '../services/layout.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="layout" [class.sidebar-open]="layoutService.sidebarOpen()" [class.sidebar-collapsed]="layoutService.sidebarCollapsed()">
      
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar__header">
          <div class="sidebar__logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
            </svg>
          </div>
          <span class="sidebar__name" [class.hidden]="layoutService.sidebarCollapsed()">TrackPays</span>
        </div>
        
        <!-- Toggle button flotante en el borde -->
        <button class="sidebar-toggle-float" (click)="toggleSidebar()" [title]="layoutService.sidebarCollapsed() ? 'Expandir' : 'Colapsar'">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" [style.transform]="layoutService.sidebarCollapsed() ? 'rotate(180deg)' : ''">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        
        <nav class="sidebar__nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span [class.hidden]="layoutService.sidebarCollapsed()">Dashboard</span>
          </a>
          
          <a routerLink="/budgets" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            <span [class.hidden]="layoutService.sidebarCollapsed()">Presupuestos</span>
          </a>
          
          <a routerLink="/transactions" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
              <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
              <path d="M12 17V7"/>
            </svg>
            <span [class.hidden]="layoutService.sidebarCollapsed()">Movimientos</span>
          </a>
          
          <a routerLink="/alerts" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
            </svg>
            <span [class.hidden]="layoutService.sidebarCollapsed()">Alertas</span>
          </a>
          
          <a routerLink="/insights" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3v18h18"/>
              <path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            <span [class.hidden]="layoutService.sidebarCollapsed()">Insights</span>
          </a>
          
          <a routerLink="/goals" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="6"/>
              <circle cx="12" cy="12" r="2"/>
            </svg>
            <span [class.hidden]="layoutService.sidebarCollapsed()">Metas</span>
          </a>
        </nav>
        
        <div class="sidebar__footer">
          <a routerLink="/settings" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Configuración</span>
          </a>
          
          <button class="nav-item nav-item--logout" (click)="logout()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main">
        <!-- Topbar -->
        <header class="topbar">
          <button class="topbar__menu-btn" (click)="toggleMobileMenu()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          
          <div class="topbar__user">
            <span class="topbar__greeting">Hola, {{ userName }}</span>
            <div class="topbar__avatar">
              @if (userPhoto) {
                <img [src]="userPhoto" [alt]="userName" class="topbar__avatar-img">
              } @else {
                {{ userInitials }}
              }
            </div>
          </div>
        </header>
        
        <!-- Page Content -->
        <div class="content">
          <router-outlet />
        </div>
      </main>
      
      <!-- Mobile Bottom Nav -->
      <nav class="bottom-nav">
        <a routerLink="/dashboard" routerLinkActive="active" class="bottom-nav__item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span>Home</span>
        </a>
        
        <a routerLink="/budgets" routerLinkActive="active" class="bottom-nav__item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Presup.</span>
        </a>
        
        <a routerLink="/transactions" routerLinkActive="active" class="bottom-nav__item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/>
          </svg>
          <span>Movim.</span>
        </a>
        
        <a routerLink="/goals" routerLinkActive="active" class="bottom-nav__item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          <span>Metas</span>
        </a>
        
        <a routerLink="/settings" routerLinkActive="active" class="bottom-nav__item">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44"/>
          </svg>
          <span>Ajustes</span>
        </a>
      </nav>
      
    </div>
  `,
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  private auth = inject(Auth);
  layoutService = inject(LayoutService);
  
  toggleSidebar() {
    this.layoutService.toggleSidebar();
  }

  toggleMobileMenu() {
    this.layoutService.toggleSidebar();
  }
  
  get userName(): string {
    const user = this.auth.currentUser();
    return user?.displayName?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Usuario';
  }
  
  get userInitials(): string {
    const name = this.userName;
    return name.charAt(0).toUpperCase();
  }

  get userPhoto(): string | null {
    return this.auth.currentUser()?.photoURL ?? null;
  }
  
  async logout() {
    await this.auth.signOut();
  }
}