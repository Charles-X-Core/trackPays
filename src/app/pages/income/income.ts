import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IncomeService } from '../../core/services/income';
import { Auth } from '../../core/services/auth';
import { TransactionService } from '../../core/services/transaction';
import { FirebaseService } from '../../core/services/firebase';
import { EmailService } from '../../core/services/email';
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
  calculatePaymentStatus,
  IncomeHistoryEntry
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
  private transactionService = inject(TransactionService);
  private firebaseService = inject(FirebaseService);
  private emailService = inject(EmailService);

  incomeSources = signal<IncomeSource[]>([]);
  incomeHistory = signal<IncomeHistoryEntry[]>([]);
  monthlyIncome = signal<MonthlyIncome | null>(null);
  monthlyReceived = signal<number>(0);
  isLoading = signal(true);
  processing = signal(false);
  showModal = signal(false);
  confirmingId = signal<string | null>(null);
  showToast = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error' | 'info'>('success');
  notifiedSources = signal<Set<string>>(new Set());

  selectedCategory = signal<IncomeCategory | 'all'>('all');
  activeTab = signal<'sources' | 'history'>('sources');

  isOtherCategory = computed(() => this.selectedCategory() === 'other');
  categories = INCOME_CATEGORIES;
  categoryList: IncomeCategory[] = ['active', 'passive', 'eventual', 'digital', 'transfer', 'state', 'business', 'other'];

  // Form signals
  editingSource = signal<IncomeSource | null>(null);
  editingQuick = signal(false);
  formCategory = signal<IncomeCategory>('active');
  formType = signal<IncomeType>('salary');
  formName = signal('');
  formAmount = signal<number | null>(null);
  amountError = signal('');
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
  reopenWarningEntry = signal<IncomeHistoryEntry | null>(null);

  // ── Catch-up Alert ──
  showCatchUpAlert = signal(false);
  catchUpSource = signal<IncomeSource | null>(null);
  catchUpMonths = signal<string[]>([]);
  skipCatchUpOnLoad = signal(false);

  // ── Computed ──
  isQuick = computed(() => isQuickIncome(this.formType()) || this.editingQuick());

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

  /** Historial: fuentes que tienen lastReceivedDate (fueron recibidas) */
  historySources = computed(() => {
    const cat = this.selectedCategory();
    return this.incomeSources().filter(s => {
      if (cat === 'other') {
        return s.recurrence.frequency === 'variable' && s.category === 'other';
      }
      if (cat === 'transfer') {
        return s.lastReceivedDate != null && s.category === 'transfer';
      }
      if (cat !== 'all') {
        if (s.category !== cat) return false;
        return s.lastReceivedDate != null;
      }
      // Todas: recibidas de cualquier categoría EXCEPTO other/puntuales
      return s.lastReceivedDate != null && s.category !== 'other';
    });
  });

  /** Historial de movimientos filtrado por categoría */
  filteredHistory = computed(() => {
    const cat = this.selectedCategory();
    const history = this.incomeHistory();
    if (cat === 'all') return history;
    return history.filter(entry => entry.category === cat);
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
      const userId = this.authService.getUserId();
      const now = this.now;

      const [sources, monthly, txs] = await Promise.all([
        this.incomeService.getAll(),
        this.incomeService.getMonthlyIncome(now.getFullYear(), now.getMonth() + 1),
        this.transactionService.getByMonth(now.getFullYear(), now.getMonth() + 1)
      ]);

      this.incomeSources.set(sources);
      this.monthlyIncome.set(monthly);
      const received = txs.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
      this.monthlyReceived.set(received);

      // Detectar pagos con check (upcoming, overdue, missed) y enviar catch-up
      if (!this.skipCatchUpOnLoad()) {
        const alertSources = sources.filter(s =>
          s.isActive && (
            s.paymentStatus?.status === 'upcoming' ||
            s.paymentStatus?.status === 'overdue' ||
            (s.paymentStatus?.missedCount && s.paymentStatus.missedCount > 0)
          )
        );

        // Enviar email de catch-up por cada fuente con check
        for (const source of alertSources) {
          if (!this.notifiedSources().has(source.id)) {
            this.notifiedSources.update(set => new Set(set).add(source.id));
            this.emailService.sendCatchUpReminder({
              sourceName: source.name,
              missedCount: source.paymentStatus?.missedCount || 0,
              missedMonths: source.paymentStatus?.missedMonths || [],
              amount: source.amount,
              currency: source.currency
            }).catch(e => console.warn('Catch-up email skipped:', e.message || e));
          }
        }

        // Abrir modal solo si hay missedCount > 0
        const missedSources = alertSources.filter(s =>
          s.paymentStatus?.missedCount && s.paymentStatus.missedCount > 0
        );
        if (missedSources.length > 0) {
          setTimeout(() => this.openCatchUpAlert(missedSources[0]), 600);
        }
      }
      this.skipCatchUpOnLoad.set(false);

      // Cargar historial por separado (no bloquea si falla)
      if (userId) {
        try {
          const history = await this.firebaseService.getIncomeHistory(userId);
          this.incomeHistory.set(history as IncomeHistoryEntry[]);
        } catch (e) {
          console.warn('Error loading income history:', e);
          this.incomeHistory.set([]);
        }
      }
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
      if (this.formFrequency() === 'monthly') {
        this.formMonthlyDay.set(15);
      } else if (this.formFrequency() === 'biweekly') {
        this.formBiweeklyDates.set([15, 30]);
      }
    }
  }

  onAmountInput(event: any) {
    const val = event;
    this.amountError.set('');
    if (val === '' || val === null || val === undefined) {
      this.formAmount.set(null);
      return;
    }
    const str = String(val);
    if (/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(str)) {
      this.formAmount.set(null);
      this.amountError.set('No es un monto válido');
      return;
    }
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num >= 0) {
      this.formAmount.set(num);
    } else {
      this.formAmount.set(null);
      this.amountError.set('No es un monto válido');
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
    this.editingQuick.set(source.recurrence.frequency === 'variable' || source.category === 'other');
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
    this.editingQuick.set(false);
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
    if (this.processing()) return;
    if (!this.formName() || !this.formAmount()) return;
    this.processing.set(true);

    try {
      const isQ = this.isQuick();
      const recurrence: IncomeSource['recurrence'] = isQ
        ? { frequency: 'variable', startDate: this.formQuickDate() }
        : this.buildRecurrence();

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
        const editing = this.editingSource()!;
        if (editing.recurrence.frequency === 'variable' || editing.category === 'other' || editing.lastReceivedDate) {
          await this.incomeService.update(editing.id, {
            name: this.formName(),
            notes: this.formNotes()
          } as any);
        } else {
          await this.incomeService.update(editing.id, payload);
        }
      } else {
        const newSource = await this.incomeService.create(payload);
        if (this.isQuick() && newSource) {
          await this.incomeService.markAsReceived(newSource.id, payload.amount);
        }
      }

      this.closeModal();
      await this.loadData();
    } catch (e: any) {
      console.error('Error saving income source:', e);
      alert('Error al guardar: ' + e.message);
    } finally {
      this.processing.set(false);
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
    if (this.processing()) return;
    this.processing.set(true);
    try {
      if (source.isActive) {
        await this.incomeService.deactivate(source.id);
      } else {
        await this.incomeService.update(source.id, { isActive: true } as any);
      }
      await this.loadData();
    } catch (e: any) {
      console.error('Error toggling income source:', e);
    } finally {
      this.processing.set(false);
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
    if (this.processing()) return;
    const source = this.confirmAlertSource();
    if (!source) return;

    this.processing.set(true);
    this.confirmingId.set(source.id);
    this.closeConfirmAlert();

    try {
      await this.incomeService.markAsReceived(source.id, source.amount);

      this.emailService.sendIncomeConfirmation({
        sourceName: source.name,
        amount: source.amount || 0,
        currency: source.currency || 'PEN',
        date: new Date().toLocaleDateString('es-PE'),
        frequency: this.getFrequencyLabel(source),
        nextDate: this.getNextDateLabel(source),
        anticipationDays: this.getAnticipationDays(source)
      }).catch(e => console.warn('Email skipped:', e.message || e));

      this.skipCatchUpOnLoad.set(true);
      await this.loadData();
      this.showSuccessToast(`✅ ${source.name} confirmado como recibido`);
    } catch (e: any) {
      console.error('Error marking as received:', e);
      this.showErrorToast('Error al confirmar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.processing.set(false);
      this.confirmingId.set(null);
    }
  }

  async markReceived(source: IncomeSource) {
    this.openConfirmAlert(source);
  }

  // ── Catch-up handlers ──
  openCatchUpAlert(source: IncomeSource) {
    this.catchUpSource.set(source);
    this.catchUpMonths.set(source.paymentStatus?.missedMonths || []);
    this.showCatchUpAlert.set(true);
  }

  closeCatchUpAlert() {
    this.showCatchUpAlert.set(false);
    this.catchUpSource.set(null);
  }

  async confirmCatchUp() {
    if (this.processing()) return;
    const source = this.catchUpSource();
    if (!source) return;

    this.processing.set(true);
    this.confirmingId.set(source.id);
    this.closeCatchUpAlert();

    try {
      await this.incomeService.markAsReceived(source.id, source.amount);

      this.skipCatchUpOnLoad.set(true);
      await this.loadData();
      this.showSuccessToast(`✅ ${source.name} catch-up confirmado`);
    } catch (e: any) {
      console.error('Error confirming catch-up:', e);
      this.showErrorToast('Error al confirmar: ' + (e.message || 'Error desconocido'));
    } finally {
      this.processing.set(false);
      this.confirmingId.set(null);
    }
  }

  skipCatchUp() {
    this.closeCatchUpAlert();
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
    if (this.processing()) return;
    this.processing.set(true);
    const source = this.deleteAlertSource();
    if (!source) { this.processing.set(false); return; }
    try {
      const userId = this.authService.getUserId();
      await this.incomeService.deactivate(source.id);

      if (userId) {
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        await this.firebaseService.addIncomeHistory(userId, {
          sourceId: source.id,
          sourceName: source.name,
          type: 'deletion',
          amount: source.amount || 0,
          date,
          time,
          category: source.category,
          description: ''
        });
      }

      this.closeDeleteAlert();
      await this.loadData();
    } catch (e: any) {
      console.error('Error deleting income source:', e);
    } finally {
      this.processing.set(false);
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
  openReopenWarning(entry: IncomeHistoryEntry) {
    this.reopenWarningEntry.set(entry);
    this.showReopenWarning.set(true);
  }

  closeReopenWarning() {
    this.showReopenWarning.set(false);
    this.reopenWarningEntry.set(null);
  }

  async proceedReopen() {
    if (this.processing()) return;
    this.processing.set(true);
    const entry = this.reopenWarningEntry();
    this.closeReopenWarning();
    if (!entry) { this.processing.set(false); return; }

    try {
      const userId = this.authService.getUserId();
      if (!userId) { this.processing.set(false); return; }

      const sources = await this.incomeService.getAll();
      const source = sources.find(s => s.id === entry.sourceId);
      if (!source) { this.processing.set(false); return; }

      const alertDays = source.alertBeforeDays ?? 1;
      const nextOccurrences = generateOccurrences(source.recurrence, 6);

      await this.firebaseService.updateIncomeSource(userId, source.id, {
        isActive: true,
        nextOccurrences,
        paymentStatus: calculatePaymentStatus(source.recurrence, nextOccurrences, undefined, alertDays),
        lastReceivedDate: null,
        actualAmount: null,
        updatedAt: new Date().toISOString()
      });

      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await this.firebaseService.addIncomeHistory(userId, {
        sourceId: source.id,
        sourceName: source.name,
        type: 'reactivation',
        amount: 0,
        date,
        time,
        category: source.category,
        description: ''
      });

      await this.loadData();
    } catch (e: any) {
      console.error('Error reopening income source:', e);
    } finally {
      this.processing.set(false);
    }
  }

  async updateDescription(entry: IncomeHistoryEntry, description: string) {
    if (this.processing()) return;
    this.processing.set(true);
    const userId = this.authService.getUserId();
    if (!userId) { this.processing.set(false); return; }
    try {
      await this.firebaseService.updateIncomeHistory(userId, entry.id, { description });
    } catch (e: any) {
      console.error('Error updating history description:', e);
    } finally {
      this.processing.set(false);
    }
  }

  isSourceActive(sourceId: string): boolean {
    return this.incomeSources().some(s => s.id === sourceId && s.isActive);
  }

  getHistoryColor(type: string): string {
    switch (type) {
      case 'transfer': return '#2FA46A';
      case 'deletion': return '#ef4444';
      case 'reactivation': return '#f59e0b';
      default: return '#71717a';
    }
  }

  getHistoryIcon(type: string): string {
    switch (type) {
      case 'transfer': return 'check-circle';
      case 'deletion': return 'x-circle';
      case 'reactivation': return 'rotate-ccw';
      default: return 'circle';
    }
  }

  getHistoryLabel(type: string): string {
    switch (type) {
      case 'transfer': return 'Recibido';
      case 'deletion': return 'Eliminado';
      case 'reactivation': return 'Reactivado';
      default: return type;
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
      case 'pending': return 'Pendiente';
      default: return status;
    }
  }

  // ── Toast ──
  showSuccessToast(message: string) {
    this.toastMessage.set(message);
    this.toastType.set('success');
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3500);
  }

  showErrorToast(message: string) {
    this.toastMessage.set(message);
    this.toastType.set('error');
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 4500);
  }

  closeToast() {
    this.showToast.set(false);
  }

  // ── Test catch-up email ──
  async testCatchUpEmail() {
    console.log('[Income] Sending test catch-up email...');
    try {
      const result = await this.emailService.sendCatchUpReminder({
        sourceName: 'Sueldo Test',
        missedCount: 3,
        missedMonths: ['marzo 2026', 'abril 2026', 'mayo 2026'],
        amount: 5000,
        currency: 'PEN'
      });
      if (result) {
        this.showSuccessToast('Email de catch-up enviado (prueba)');
      } else {
        this.showErrorToast('Error al enviar email de catch-up');
      }
    } catch (e: any) {
      this.showErrorToast('Error: ' + e.message);
    }
  }

  // ── Anticipation days ──
  private getAnticipationDays(source: IncomeSource): number {
    const nextDate = source.nextOccurrences?.[0];
    if (!nextDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next = new Date(nextDate + 'T00:00:00');
    const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }

  private getNextDateLabel(source: IncomeSource): string {
    const nextDate = source.nextOccurrences?.[1];
    if (!nextDate) return 'N/A';
    const d = new Date(nextDate + 'T12:00:00');
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  private getFrequencyLabel(source: IncomeSource): string {
    switch (source.recurrence?.frequency) {
      case 'weekly': return 'Semanal';
      case 'biweekly': return 'Quincenal';
      case 'monthly': return 'Mensual';
      case 'annual': return 'Anual';
      case 'variable': return 'Variable';
      default: return 'Mensual';
    }
  }
}
