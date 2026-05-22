import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IncomeService } from '../../core/services/income';
import { Auth } from '../../core/services/auth';
import { IconComponent } from '../../core/components/icon/icon.component';
import {
  IncomeSource,
  IncomeSourcePayload,
  MonthlyIncome,
  IncomeCategory,
  IncomeType,
  IncomeFrequency,
  MonthlyRule,
  RecurrenceRule,
  INCOME_CATEGORIES,
  getCategoryLabel,
  getTypeLabel,
  getTypeIcon,
  getTypeInfo,
  isQuickIncome,
  generateOccurrences,
  calculatePaymentStatus
} from '../../core/models/income.model';

@Component({
  selector: 'app-income',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, IconComponent],
  templateUrl: './income.html',
  styleUrl: './income.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IncomeComponent implements OnInit {
  private incomeService = inject(IncomeService);
  private authService = inject(Auth);

  incomeSources = signal<IncomeSource[]>([]);
  monthlyIncome = signal<MonthlyIncome | null>(null);
  isLoading = signal(true);
  showModal = signal(false);

  selectedCategory = signal<IncomeCategory | 'all'>('all');
  activeTab = signal<'sources' | 'history'>('sources');

  isOtherCategory = computed(() => this.selectedCategory() === 'other');
  categories = INCOME_CATEGORIES;
  categoryList: IncomeCategory[] = ['active', 'passive', 'eventual', 'digital', 'transfer', 'state', 'business', 'other'];

  // Form signals
  editingSource = signal<IncomeSource | null>(null);
  formCategory = signal<IncomeCategory>('active');
  formType = signal<IncomeType>('salary');
  formName = signal('');
  formAmount = signal<number | null>(null);
  formNotes = signal('');

  // Recurrence form
  formFrequency = signal<IncomeFrequency>('monthly');
  formStartDate = signal<string>(new Date().toISOString().split('T')[0]);
  formWeeklyDay = signal<number>(1);
  formBiweeklyMode = signal<'two_dates' | 'every_15'>('two_dates');
  formBiweeklyDates = signal<[number, number]>([15, 30]);
  formMonthlyKind = signal<MonthlyRule['kind']>('day');
  formMonthlyDay = signal<number>(15);
  formMonthlyWeekday = signal<number>(1);
  formAnnualMonth = signal<number>(0);
  formAnnualDay = signal<number>(15);

  // Quick mode (other category)
  formQuickDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Alerts (only for recurrent)
  formAlertDays = signal<number | null>(3);
  formAutoCreate = signal(false);

  now = new Date();
  currentMonth = this.now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });

  // ── Confirm Alert ──
  showConfirmAlert = signal(false);
  confirmAlertSource = signal<IncomeSource | null>(null);
  confirmAlertTitle = computed(() => {
    const src = this.confirmAlertSource();
    return src ? `Confirmar recepción` : '';
  });

  // ── Delete Alert ──
  showDeleteAlert = signal(false);
  deleteAlertSource = signal<IncomeSource | null>(null);

  // ── Edit Warning ──
  showEditWarning = signal(false);
  editWarningSource = signal<IncomeSource | null>(null);

  // ── Reopen Warning ──
  showReopenWarning = signal(false);
  reopenWarningSource = signal<IncomeSource | null>(null);

  // ── Computed ──
  isQuick = computed(() => isQuickIncome(this.formType()));

  availableTypes = computed(() => this.incomeService.getAvailableTypes(this.formCategory()));

  // ── Separación Fuentes Activas vs Historial ──

  /** Fuentes activas: recurrentes programados (no variable) que están activos */
  activeSources = computed(() => {
    const cat = this.selectedCategory();
    const sources = this.incomeSources().filter(
      s => s.isActive && s.recurrence?.frequency !== 'variable'
    );
    if (cat === 'all') return sources;
    return sources.filter(s => s.category === cat);
  });

  /** Historial: solo ingresos confirmados (recibidos) o puntuales de la categoría seleccionada */
  historySources = computed(() => {
    const cat = this.selectedCategory();
    return this.incomeSources().filter(s => {
      // Nunca mostrar fuentes activas en el historial
      if (s.isActive) return false;
      // Otros: solo puntuales (variable) de categoría 'other'
      if (cat === 'other') {
        return s.recurrence.frequency === 'variable' && s.category === 'other';
      }
      // Categoría específica: solo recibidos de esa categoría
      if (cat !== 'all') {
        if (s.category !== cat) return false;
        return s.lastReceivedDate != null;
      }
      // Todas: recibidos de cualquier categoría + puntuales
      if (s.recurrence.frequency === 'variable') return true;
      return s.lastReceivedDate != null;
    });
  });

  /** Título dinámico para la sección de fuentes activas según categoría */
  activeSourcesTitle = computed(() => {
    const cat = this.selectedCategory();
    if (cat === 'all') return 'Todas las Fuentes de Ingreso';
    return this.getCategoryInfo(cat).label;
  });

  /** Solo para la barra de "Próximos" */
  upcomingPayments = computed(() =>
    this.activeSources()
      .filter(s => s.paymentStatus?.daysUntil != null && s.paymentStatus!.daysUntil! >= 0)
      .sort((a, b) => (a.paymentStatus?.daysUntil ?? 999) - (b.paymentStatus?.daysUntil ?? 999))
  );

  totalMonthly = computed(() =>
    this.incomeSources().filter(s => s.isActive).reduce((sum, s) => sum + (s.amount || 0), 0)
  );

  totalByCategory = computed(() => {
    const result: Record<string, number> = {};
    // Solo fuentes activas recurrentes (excluye variable/puntual de "other")
    this.incomeSources().filter(s => s.isActive && s.recurrence.frequency !== 'variable').forEach(s => {
      result[s.category] = (result[s.category] || 0) + (s.amount || 0);
    });
    return result;
  });

  getCategoryLabel = getCategoryLabel;
  getTypeLabel = getTypeLabel;
  getTypeIcon = getTypeIcon;

  getCategoryInfo(cat: string) {
    return this.categories[cat as IncomeCategory] || { label: cat, icon: 'layout-dashboard', description: '' };
  }

  getCategoryAmount(cat: string): number {
    return this.monthlyIncome()?.byCategory[cat as IncomeCategory] || 0;
  }

  async ngOnInit() {
    await this.loadData();
  }

  onSelectCategory(cat: IncomeCategory | 'all') {
    this.selectedCategory.set(cat);
    if (cat === 'other') {
      this.activeTab.set('history');
    }
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [sources, monthly] = await Promise.all([
        this.incomeService.getAll(),
        this.incomeService.getMonthlyIncome(this.now.getFullYear(), this.now.getMonth() + 1)
      ]);
      this.incomeSources.set(sources);
      this.monthlyIncome.set(monthly);
    } finally {
      this.isLoading.set(false);
    }
  }

  onCategoryChange() {
    const types = this.availableTypes();
    if (types.length > 0) {
      this.formType.set(types[0].value);
      this.onTypeChange();
    }
  }

  onTypeChange() {
    const info = getTypeInfo(this.formType());
    if (info) {
      this.formFrequency.set(info.typicalFrequency as IncomeFrequency);
      // Suggest sensible defaults per frequency
      if (this.formFrequency() === 'monthly') {
        this.formMonthlyDay.set(15);
      } else if (this.formFrequency() === 'biweekly') {
        this.formBiweeklyDates.set([15, 30]);
      }
    }
  }

  weekdayLabels: Record<number, string> = {
    1: 'Lunes', 2: 'Martes', 3: 'Miércoles',
    4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo'
  };

  openAddModal(category?: IncomeCategory) {
    this.editingSource.set(null);
    this.formCategory.set(category || 'active');
    this.onCategoryChange();
    this.formName.set('');
    this.formAmount.set(null);
    this.formNotes.set('');
    this.formStartDate.set(new Date().toISOString().split('T')[0]);
    this.formQuickDate.set(new Date().toISOString().split('T')[0]);
    this.formWeeklyDay.set(1);
    this.formBiweeklyMode.set('two_dates');
    this.formBiweeklyDates.set([15, 30]);
    this.formMonthlyKind.set('day');
    this.formMonthlyDay.set(15);
    this.formMonthlyWeekday.set(1);
    this.formAnnualMonth.set(0);
    this.formAnnualDay.set(15);
    this.formAlertDays.set(3);
    this.formAutoCreate.set(false);
    this.showModal.set(true);
  }

  openAddModalForCurrentCategory() {
    const cat = this.selectedCategory();
    this.openAddModal(cat === 'all' ? undefined : cat);
  }

  openEdit(source: IncomeSource) {
    this.editingSource.set(source);
    this.formCategory.set(source.category);
    this.formType.set(source.type);
    this.formName.set(source.name);
    this.formAmount.set(source.amount);
    this.formNotes.set(source.notes || '');

    const r = source.recurrence;
    this.formFrequency.set(r.frequency);
    this.formStartDate.set(r.startDate);
    this.formWeeklyDay.set(r.weeklyDays?.[0] || 1);
    this.formBiweeklyMode.set(r.biweeklyMode || 'two_dates');
    this.formBiweeklyDates.set(r.biweeklyDates || [15, 30]);
    if (r.monthlyRule) {
      this.formMonthlyKind.set(r.monthlyRule.kind);
      if (r.monthlyRule.kind === 'day') this.formMonthlyDay.set(r.monthlyRule.day);
      if (r.monthlyRule.kind === 'first_weekday') this.formMonthlyWeekday.set(r.monthlyRule.weekday);
    }
    this.formAnnualMonth.set(r.annualMonth ?? 0);
    this.formAnnualDay.set(r.annualDay ?? 15);

    this.formAlertDays.set(source.alertBeforeDays ?? null);
    this.formAutoCreate.set(source.autoCreateTransaction ?? false);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingSource.set(null);
  }

  private buildRecurrence(): IncomeSource['recurrence'] {
    const freq = this.formFrequency();
    const base: IncomeSource['recurrence'] = {
      frequency: freq,
      startDate: this.formStartDate()
    };

    switch (freq) {
      case 'weekly':
        base.weeklyDays = [this.formWeeklyDay()];
        break;
      case 'biweekly':
        base.biweeklyMode = this.formBiweeklyMode();
        if (base.biweeklyMode === 'two_dates') {
          base.biweeklyDates = this.formBiweeklyDates();
        }
        break;
      case 'monthly':
      case 'bimonthly':
      case 'quarterly':
      case 'semi_annual':
        const kind = this.formMonthlyKind();
        if (kind === 'day') base.monthlyRule = { kind: 'day', day: this.formMonthlyDay() };
        else if (kind === 'last_day') base.monthlyRule = { kind: 'last_day' };
        else if (kind === 'first_weekday') base.monthlyRule = { kind: 'first_weekday', weekday: this.formMonthlyWeekday() };
        break;
      case 'annual':
        base.annualMonth = this.formAnnualMonth();
        base.annualDay = this.formAnnualDay();
        break;
      case 'variable':
        // No extra rules
        break;
    }
    return base;
  }

  async saveSource() {
    if (!this.formName() || !this.formAmount()) return;

    try {
      const isQ = this.isQuick();
      const recurrence: IncomeSource['recurrence'] = isQ
        ? { frequency: 'variable', startDate: this.formQuickDate() }
        : this.buildRecurrence();

      // alertBeforeDays mínimo 1
      let alertDays = this.formAlertDays();
      if (!isQ && (alertDays == null || alertDays < 1)) {
        alertDays = 3;
      }

      const payload: IncomeSourcePayload = {
        category: this.formCategory(),
        type: this.formType(),
        name: this.formName(),
        amount: this.formAmount()!,
        recurrence,
        alertBeforeDays: isQ ? null : alertDays,
        autoCreateTransaction: isQ ? false : this.formAutoCreate(),
        notes: this.formNotes()
      };

      if (this.editingSource()) {
        await this.incomeService.update(this.editingSource()!.id, payload);
      } else {
        await this.incomeService.create(payload);
      }

      this.closeModal();
      await this.loadData();
    } catch (e: any) {
      console.error('Error saving income source:', e);
      alert('Error al guardar: ' + e.message);
    }
  }

  async deleteSource(source: IncomeSource) {
    if (!confirm(`¿Eliminar "${source.name}"? Se moverá al historial como inactivo.`)) return;
    try {
      await this.incomeService.deactivate(source.id);
      await this.loadData();
    } catch (e: any) {
      console.error('Error deleting income source:', e);
    }
  }

  async toggleActive(source: IncomeSource) {
    try {
      if (source.isActive) {
        await this.incomeService.deactivate(source.id);
      } else {
        await this.incomeService.update(source.id, { isActive: true } as any);
      }
      await this.loadData();
    } catch (e: any) {
      console.error('Error toggling income source:', e);
    }
  }

  openConfirmAlert(source: IncomeSource) {
    this.confirmAlertSource.set(source);
    this.showConfirmAlert.set(true);
  }

  closeConfirmAlert() {
    this.showConfirmAlert.set(false);
    this.confirmAlertSource.set(null);
  }

  async confirmMarkReceived() {
    const source = this.confirmAlertSource();
    if (!source) return;
    try {
      await this.incomeService.markAsReceived(source.id, source.amount);
      this.closeConfirmAlert();
      await this.loadData();
    } catch (e: any) {
      console.error('Error marking as received:', e);
    }
  }

  async markReceived(source: IncomeSource) {
    this.openConfirmAlert(source);
  }

  // ── Delete Alert handlers ──
  openDeleteAlert(source: IncomeSource) {
    this.deleteAlertSource.set(source);
    this.showDeleteAlert.set(true);
  }

  closeDeleteAlert() {
    this.showDeleteAlert.set(false);
    this.deleteAlertSource.set(null);
  }

  async confirmDelete() {
    const source = this.deleteAlertSource();
    if (!source) return;
    try {
      await this.incomeService.deactivate(source.id);
      this.closeDeleteAlert();
      await this.loadData();
    } catch (e: any) {
      console.error('Error deleting income source:', e);
    }
  }

  // ── Edit Warning handlers ──
  openEditWarning(source: IncomeSource) {
    this.editWarningSource.set(source);
    this.showEditWarning.set(true);
  }

  closeEditWarning() {
    this.showEditWarning.set(false);
    this.editWarningSource.set(null);
  }

  proceedEdit() {
    const source = this.editWarningSource();
    this.closeEditWarning();
    if (source) this.openEdit(source);
  }

  // ── Reopen Warning handlers ──
  openReopenWarning(source: IncomeSource) {
    this.reopenWarningSource.set(source);
    this.showReopenWarning.set(true);
  }

  closeReopenWarning() {
    this.showReopenWarning.set(false);
    this.reopenWarningSource.set(null);
  }

  async proceedReopen() {
    const source = this.reopenWarningSource();
    this.closeReopenWarning();
    if (!source) return;

    try {
      const today = new Date();
      const alertDays = source.alertBeforeDays ?? 1;

      const updatedRecurrence = {
        ...source.recurrence,
        startDate: today.toISOString().split('T')[0] as any,
      };

      const nextOccurrences = generateOccurrences(updatedRecurrence, 6);

      const payload: any = {
        isActive: true,
        recurrence: updatedRecurrence,
        nextOccurrences,
        paymentStatus: calculatePaymentStatus(updatedRecurrence, nextOccurrences, undefined, alertDays),
        lastReceivedDate: undefined,
      };

      await this.incomeService.update(source.id, payload as any);
      await this.loadData();
    } catch (e: any) {
      console.error('Error reopening income source:', e);
    }
  }

  formatSol(n: number): string {
    return `S/ ${(n || 0).toFixed(2)}`;
  }

  formatDays(days: number | null | undefined): string {
    if (days === null || days === undefined) return '';
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    if (days < 0) return `Hace ${Math.abs(days)} días`;
    return `En ${days} días`;
  }

  getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'received': return '#2FA46A';
      case 'upcoming': return '#f59e0b';
      case 'overdue': return '#ef4444';
      case 'scheduled': return '#3b82f6';
      case 'registered': return '#71717a';
      default: return '#71717a';
    }
  }

  getPaymentStatusLabel(status: string): string {
    switch (status) {
      case 'received': return 'Recibido';
      case 'upcoming': return 'Próximo';
      case 'overdue': return 'Atrasado';
      case 'scheduled': return 'Programado';
      case 'registered': return 'Registrado';
      case 'pending': return 'Pendiente';
      default: return status;
    }
  }
}
