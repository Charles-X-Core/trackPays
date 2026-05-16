import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../core/services/transaction';
import { CategoryService } from '../../core/services/category';
import { Transaction, TransactionPayload } from '../../core/models/transaction.model';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss'
})
export class TransactionsComponent implements OnInit {

  private transactionService = inject(TransactionService);
  private categoryService    = inject(CategoryService);

  isLoading    = signal(true);
  transactions = signal<Transaction[]>([]);
  categories   = signal<Category[]>([]);

  // Filtros
  filterType  = 'all';    // all | income | expense
  filterMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  // Modal editar / eliminar
  showModal    = signal(false);
  isDeleting   = signal(false);
  isSaving     = signal(false);
  modalError   = signal('');
  editingTx    = signal<Transaction | null>(null);

  // Formulario edición
  editAmount      = '';
  editDescription = '';
  editCategoryId  = '';
  editDate        = '';

  // Confirm delete
  showConfirm  = signal(false);
  deletingId   = signal<string | null>(null);

  get filtered(): Transaction[] {
    return this.transactions().filter(tx => {
      if (this.filterType === 'income')  return tx.amount > 0;
      if (this.filterType === 'expense') return tx.amount < 0;
      return true;
    });
  }

  get totals() {
    return this.transactionService.calcTotals(this.transactions());
  }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      const [year, month] = this.filterMonth.split('-').map(Number);
      const [txs, cats]   = await Promise.all([
        this.transactionService.getByMonth(year, month),
        this.categoryService.getAll()
      ]);
      this.transactions.set(txs);
      this.categories.set(cats);
    } finally {
      this.isLoading.set(false);
    }
  }

  async onMonthChange() {
    await this.loadData();
  }

  // ─── Editar ──────────────────────────────────────────────
  openEdit(tx: Transaction) {
    this.editingTx.set(tx);
    this.editAmount      = String(tx.amount);
    this.editDescription = tx.description ?? '';
    this.editCategoryId  = tx.categoryId ?? '';
    this.editDate        = tx.date;
    this.modalError.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingTx.set(null);
  }

  async saveEdit() {
    const amount = parseFloat(this.editAmount);
    if (isNaN(amount) || amount === 0) {
      this.modalError.set('El monto no es válido');
      return;
    }

    this.isSaving.set(true);
    this.modalError.set('');
    try {
      const payload: Partial<TransactionPayload> = {
        amount,
        description: this.editDescription,
        categoryId: this.editCategoryId || null,
        date: this.editDate,
        type: amount < 0 ? 'expense' : 'income'
      };
      await this.transactionService.update(this.editingTx()!.id, payload);
      this.closeModal();
      await this.loadData();
    } catch (e: any) {
      this.modalError.set(e.message);
    } finally {
      this.isSaving.set(false);
    }
  }

  // ─── Eliminar ────────────────────────────────────────────
  confirmDelete(id: string) {
    this.deletingId.set(id);
    this.showConfirm.set(true);
  }

  cancelDelete() {
    this.showConfirm.set(false);
    this.deletingId.set(null);
  }

  async doDelete() {
    this.isDeleting.set(true);
    try {
      await this.transactionService.delete(this.deletingId()!);
      this.showConfirm.set(false);
      await this.loadData();
    } finally {
      this.isDeleting.set(false);
    }
  }

  formatSol(n: number): string {
    return `S/ ${Math.abs(n).toFixed(2)}`;
  }

  groupByDate(): { date: string; items: Transaction[] }[] {
    const map = new Map<string, Transaction[]>();
    this.filtered.forEach(tx => {
      const list = map.get(tx.date) ?? [];
      list.push(tx);
      map.set(tx.date, list);
    });
    return Array.from(map.entries())
      .map(([date, items]) => ({ date, items }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  groupSubtotal(items: Transaction[]): number {
    return items.reduce((sum, t) => sum + t.amount, 0);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  }
}