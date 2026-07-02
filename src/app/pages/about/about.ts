import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class AboutComponent {
  private auth = inject(Auth);

  user = this.auth.currentUser();

  features = [
    { icon: 'wallet', title: 'Gestión de Ingresos', desc: '8 categorías, 25 tipos, motor de recurrencia completo' },
    { icon: 'shopping-cart', title: 'Control de Gastos', desc: 'Sistema dual: esenciales vs no esenciales con 52 subcategorías' },
    { icon: 'bar-chart-2', title: 'Dashboard Inteligente', desc: 'Gráficas, sparklines, regla 50/30/20, alertas automáticas' },
    { icon: 'file-text', title: 'Movimientos', desc: 'Historial completo con filtros, búsqueda, edición y eliminación' },
    { icon: 'target', title: 'Metas de Ahorro', desc: 'Define objetivos y visualiza tu progreso' },
    { icon: 'bell', title: 'Alertas', desc: 'Notificaciones de pagos próximos y atrasados' },
  ];

  techStack = [
    { name: 'Angular', version: '21.2', color: '#DD0031' },
    { name: 'Firebase', version: '', color: '#FFCA28' },
    { name: 'TypeScript', version: '5.9', color: '#3178C6' },
    { name: 'Chart.js', version: '4.5', color: '#FF6384' },
    { name: 'Vercel', version: '', color: '#000000' },
  ];
}
