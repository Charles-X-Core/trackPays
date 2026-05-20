import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TransactionService } from '../../core/services/transaction';
import { CategoryService } from '../../core/services/category';
import { ExpenseService } from '../../core/services/expense';
import { LayoutService } from '../../core/services/layout.service';
import { Auth } from '../../core/services/auth';
import { Transaction } from '../../core/models/transaction.model';
import { Category } from '../../core/models/category.model';
import { Expense } from '../../core/models/expense.model';

interface DailyExpense {
  date: string;
  dayName: string;
  transactions: Transaction[];
  total: number;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './expenses.html',
  styleUrl: './expenses.scss'
})
export class ExpensesComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private expenseService = inject(ExpenseService);
  private authService = inject(Auth);
  layoutService = inject(LayoutService);

  isLoading = signal(true);
  expenses = signal<Transaction[]>([]);
  dailyExpenses = signal<DailyExpense[]>([]);
  categories = signal<Category[]>([]);

  // Expenses from backend (with payment status)
  allExpenses = signal<Expense[]>([]);
  primordialExpenses = signal<Expense[]>([]);
  nonPrimordialExpenses = signal<Expense[]>([]);

  primordialExpanded = signal(false);
  nonPrimordialExpanded = signal(false);

  // Modal state
  showModal = signal(false);
  editingExpense = signal<Expense | null>(null);

  // Form fields
  formName = '';
  formAmount: number | null = null;
  formDueDay: number | null = null;
  formIsPrimordial = true;
  formCategory = 'utilities';
  formSubcategory = '';
  formIsSubscription = false;
  formIsVariable = false;

  // Filter state
  filterCategory = '';
  searchTerm = '';

  // Last month data for comparison
  lastMonthExpenses: Record<string, number> = {};
  isSeedingData = false;

  // ============================================
  // SEED DATA - Crear datos de prueba
  // ============================================
  async seedDemoData() {
    if (this.isSeedingData) return;
    this.isSeedingData = true;
    
    try {
      // Gastos Primordiales (esenciales)
      const primordialExpenses = [
        { name: 'Alquiler', budgetedAmount: 1200, dueDayOfMonth: 1, category: 'housing' },
        { name: 'Luz', budgetedAmount: 180, dueDayOfMonth: 15, category: 'utilities', isVariable: true },
        { name: 'Agua', budgetedAmount: 80, dueDayOfMonth: 20, category: 'utilities', isVariable: true },
        { name: 'Internet', budgetedAmount: 120, dueDayOfMonth: 1, category: 'utilities', isSubscription: true },
        { name: 'Transporte', budgetedAmount: 200, dueDayOfMonth: null, category: 'transport' },
        { name: 'EPS (Salud)', budgetedAmount: 150, dueDayOfMonth: 5, category: 'health' },
        { name: 'Supermercado', budgetedAmount: 400, dueDayOfMonth: null, category: 'groceries' },
      ];

      // Gastos No Esenciales
      const nonPrimordialExpenses = [
        { name: 'Netflix', budgetedAmount: 55, dueDayOfMonth: 15, category: 'streaming', isSubscription: true },
        { name: 'Spotify', budgetedAmount: 25, dueDayOfMonth: 20, category: 'streaming', isSubscription: true },
        { name: 'Amazon Prime', budgetedAmount: 35, dueDayOfMonth: 10, category: 'streaming', isSubscription: true },
        { name: 'Restaurantes', budgetedAmount: 200, dueDayOfMonth: null, category: 'dining_out' },
        { name: 'Cine', budgetedAmount: 80, dueDayOfMonth: null, category: 'entertainment' },
        { name: 'Gimnasio', budgetedAmount: 60, dueDayOfMonth: 1, category: 'entertainment', isSubscription: true },
      ];

      // Crear gastos primordiales con algunos pagado y algunos pendientes
      for (let i = 0; i < primordialExpenses.length; i++) {
        const exp = primordialExpenses[i];
        const isPaid = i < 4; // Los primeros 4 están pagados
        const actualAmount = isPaid ? exp.budgetedAmount : Math.floor(Math.random() * exp.budgetedAmount * 0.7);
        
        const created = await this.expenseService.create({
          name: exp.name,
          budgetedAmount: exp.budgetedAmount,
          dueDayOfMonth: exp.dueDayOfMonth,
          isPrimordial: true,
          category: exp.category as any,
          isSubscription: exp.isSubscription || false,
          isVariable: exp.isVariable || false,
          isRecurring: true,
          frequency: 'monthly'
        });
        
        if (actualAmount > 0) {
          await this.expenseService.markAsPaid(created.id, actualAmount);
        }
      }

      // Crear gastos no esenciales
      for (let i = 0; i < nonPrimordialExpenses.length; i++) {
        const exp = nonPrimordialExpenses[i];
        const isPaid = i < 3; // Los primeros 3 están pagados
        const actualAmount = isPaid ? exp.budgetedAmount : Math.floor(Math.random() * exp.budgetedAmount * 0.5);
        
        const created = await this.expenseService.create({
          name: exp.name,
          budgetedAmount: exp.budgetedAmount,
          dueDayOfMonth: exp.dueDayOfMonth,
          isPrimordial: false,
          category: exp.category as any,
          isSubscription: exp.isSubscription || false,
          isVariable: false,
          isRecurring: true,
          frequency: 'monthly'
        });
        
        if (actualAmount > 0) {
          await this.expenseService.markAsPaid(created.id, actualAmount);
        }
      }

      // Simular datos del mes pasado para comparación
      this.lastMonthExpenses = {
        'luz': 165,
        'agua': 75,
        'netflix': 55,
        'spotify': 25,
        'restaurantes': 180
      };

      await this.loadData();
      alert('¡Datos de prueba creados! Ya puedes ver el sistema de gastos.');
    } catch (e) {
      console.error('Error creating demo data:', e);
      alert('Error al crear datos de prueba');
    } finally {
      this.isSeedingData = false;
    }
  }

  now = new Date();
  currentMonth = this.now.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
  lastMonthName = new Date(this.now.getFullYear(), this.now.getMonth() - 1, 1)
    .toLocaleDateString('es-PE', { month: 'long' });

  totalExpenses = 0;
  primordialTotal = 0;
  nonPrimordialTotal = 0;
  lastMonthTotal = 0;
  monthChange = 0;
  categoryBreakdown: { category: string; total: number; pct: number; isPrimordial: boolean }[] = [];

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    try {
      // Load categories first
      const cats = await this.categoryService.getAll();
      this.categories.set(cats);

      // Load expenses from backend (with payment status)
      const activeExpenses = await this.expenseService.getActive();
      this.allExpenses.set(activeExpenses);
      this.primordialExpenses.set(activeExpenses.filter(e => e.isPrimordial));
      this.nonPrimordialExpenses.set(activeExpenses.filter(e => !e.isPrimordial));

      const currentMonthExpenses = await this.transactionService.getByMonth(
        this.now.getFullYear(), 
        this.now.getMonth() + 1
      );
      
      const expensesOnly = currentMonthExpenses.filter(t => t.type === 'expense');
      this.expenses.set(expensesOnly);
      this.totalExpenses = Math.abs(expensesOnly.reduce((sum, t) => sum + t.amount, 0));

      // Calculate Primordial vs Non-Primordial
      this.calculatePrimordialBreakdown(expensesOnly);

      // Get last month for comparison
      const lastMonthDate = new Date(this.now.getFullYear(), this.now.getMonth() - 1, 1);
      const lastMonthExpenses = await this.transactionService.getByMonth(
        lastMonthDate.getFullYear(),
        lastMonthDate.getMonth() + 1
      );
      const lastMonthExpensesOnly = lastMonthExpenses.filter(t => t.type === 'expense');
      this.lastMonthTotal = Math.abs(lastMonthExpensesOnly.reduce((sum, t) => sum + t.amount, 0));

      // Calculate change
      this.monthChange = this.lastMonthTotal > 0 
        ? ((this.totalExpenses - this.lastMonthTotal) / this.lastMonthTotal) * 100 
        : 0;

      // Group by day
      this.groupByDay(expensesOnly);

      // Category breakdown
      this.calculateCategoryBreakdown(expensesOnly);
    } finally {
      this.isLoading.set(false);
    }
  }

  calculatePrimordialBreakdown(expenses: Transaction[]) {
    this.primordialTotal = 0;
    this.nonPrimordialTotal = 0;

    expenses.forEach(expense => {
      const amount = Math.abs(expense.amount);
      const cat = this.categories().find(c => c.id === expense.categoryId);
      const ruleType = cat?.ruleType || 'want';

      if (ruleType === 'need') {
        this.primordialTotal += amount;
      } else {
        this.nonPrimordialTotal += amount;
      }
    });
  }

  groupByDay(expenses: Transaction[]) {
    const grouped: Record<string, DailyExpense> = {};
    
    expenses.forEach(expense => {
      const dateKey = expense.date;
      if (!grouped[dateKey]) {
        const dateObj = new Date(dateKey);
        grouped[dateKey] = {
          date: dateKey,
          dayName: dateObj.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric' }),
          transactions: [],
          total: 0
        };
      }
      grouped[dateKey].transactions.push(expense);
      grouped[dateKey].total += Math.abs(expense.amount);
    });

    const sorted = Object.values(grouped).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    this.dailyExpenses.set(sorted);
  }

  calculateCategoryBreakdown(expenses: Transaction[]) {
    const catTotals: Record<string, { total: number; isPrimordial: boolean }> = {};
    
    expenses.forEach(expense => {
      const catId = expense.categoryId || 'other';
      const cat = this.categories().find(c => c.id === catId);
      const ruleType = cat?.ruleType || 'want';
      const isPrimordial = ruleType === 'need';

      if (!catTotals[catId]) {
        catTotals[catId] = { total: 0, isPrimordial };
      }
      catTotals[catId].total += Math.abs(expense.amount);
    });

    this.categoryBreakdown = Object.entries(catTotals)
      .map(([category, data]) => ({
        category,
        total: data.total,
        pct: this.totalExpenses > 0 ? (data.total / this.totalExpenses) * 100 : 0,
        isPrimordial: data.isPrimordial
      }))
      .sort((a, b) => b.total - a.total);
  }

formatSol(n: number): string {
    return `S/ ${n.toFixed(2)}`;
  }

  getPrimordialPct(): string {
    return this.totalExpenses > 0 ? ((this.primordialTotal / this.totalExpenses) * 100).toFixed(0) : '0';
  }

  getNonPrimordialPct(): string {
    return this.totalExpenses > 0 ? ((this.nonPrimordialTotal / this.totalExpenses) * 100).toFixed(0) : '0';
  }

  getPrimordialCategories() {
    return this.categoryBreakdown.filter(c => c.isPrimordial);
  }

  getNonPrimordialCategories() {
    return this.categoryBreakdown.filter(c => !c.isPrimordial);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'paid': 'Pagado',
      'pending': 'Falta pagar',
      'partial': 'Parcial',
      'overdue': 'Vencido',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  // ============================================
  // FILTRO POR CATEGORÍAS
  // ============================================
  getFilteredExpenses(): Expense[] {
    let result = this.allExpenses();
    
    if (this.filterCategory) {
      result = result.filter(e => e.category === this.filterCategory);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(e => 
        e.name.toLowerCase().includes(term) || 
        e.category.toLowerCase().includes(term)
      );
    }
    
    return result;
  }

  getActiveCategories(): string[] {
    const categories = new Set<string>();
    this.allExpenses().forEach(e => categories.add(e.category));
    return Array.from(categories);
  }

  getExpensesByCategory(): { category: string; expenses: Expense[] }[] {
    const filtered = this.getFilteredExpenses();
    const grouped: Record<string, Expense[]> = {};
    
    filtered.forEach(e => {
      if (!grouped[e.category]) grouped[e.category] = [];
      grouped[e.category].push(e);
    });
    
    return Object.entries(grouped).map(([category, expenses]) => ({ category, expenses }));
  }

  getCategoryGroupPercentage(group: { category: string; expenses: Expense[] }): number {
    const total = group.expenses.reduce((sum, e) => sum + e.budgetedAmount, 0);
    const totalActual = group.expenses.reduce((sum, e) => sum + e.actualAmount, 0);
    return total > 0 ? (totalActual / total) * 100 : 0;
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      housing: '🏠',
      utilities: '⚡',
      transport: '🚗',
      health: '🏥',
      groceries: '🛒',
      streaming: '📺',
      dining_out: '🍽️',
      entertainment: '🎬',
      education: '📚',
      other: '📦'
    };
    return icons[category] || '📦';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      housing: 'Vivienda',
      utilities: 'Servicios',
      transport: 'Transporte',
      health: 'Salud',
      groceries: 'Supermercado',
      streaming: 'Streaming',
      dining_out: 'Restaurantes',
      entertainment: 'Entretenimiento',
      education: 'Educación',
      other: 'Otros'
    };
    return labels[category] || category;
  }

  // Porcentaje general (todos los gastos)
  getGeneralPercentage(): number {
    const total = this.allExpenses().reduce((sum, e) => sum + e.budgetedAmount, 0);
    const totalActual = this.allExpenses().reduce((sum, e) => sum + e.actualAmount, 0);
    return total > 0 ? (totalActual / total) * 100 : 0;
  }

  // Porcentaje por gasto específico
  getExpensePercentage(expense: Expense): { current: number; lastMonth: number; avg: number } {
    const current = expense.budgetedAmount > 0 
      ? (expense.actualAmount / expense.budgetedAmount) * 100 
      : 0;
    
    const lastMonth = this.lastMonthExpenses[expense.id] || expense.budgetedAmount;
    const avg = (expense.actualAmount + lastMonth) / 2;
    
    return { current, lastMonth: lastMonth > 0 ? (expense.actualAmount / lastMonth) * 100 : 0, avg: avg > 0 ? (expense.actualAmount / avg) * 100 : 0 };
  }

  setCategoryFilter(category: string) {
    this.filterCategory = category;
  }

  // ============================================
  // MODAL - Agregar/Editar Gasto
  // ============================================
  openAddModal() {
    this.editingExpense.set(null);
    this.formName = '';
    this.formAmount = null;
    this.formDueDay = null;
    this.formIsPrimordial = true;
    this.formCategory = 'utilities';
    this.formSubcategory = '';
    this.formIsSubscription = false;
    this.formIsVariable = false;
    this.showModal.set(true);
  }

  openEditModal(expense: Expense) {
    this.editingExpense.set(expense);
    this.formName = expense.name;
    this.formAmount = expense.budgetedAmount;
    this.formDueDay = expense.dueDayOfMonth;
    this.formIsPrimordial = expense.isPrimordial;
    this.formCategory = expense.category;
    this.formSubcategory = expense.subcategory || '';
    this.formIsSubscription = expense.isSubscription || false;
    this.formIsVariable = expense.isVariable || false;
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingExpense.set(null);
  }

  async saveExpense() {
    if (!this.formName || !this.formAmount) return;
    
    try {
      const editing = this.editingExpense();
      
      if (editing) {
        // Update existing
        await this.expenseService.update(editing.id, {
          name: this.formName,
          budgetedAmount: this.formAmount,
          dueDayOfMonth: this.formDueDay,
          isSubscription: this.formIsSubscription,
          isVariable: this.formIsVariable
        });
      } else {
        // Create new
        await this.expenseService.create({
          name: this.formName,
          budgetedAmount: this.formAmount,
          dueDayOfMonth: this.formDueDay,
          isPrimordial: this.formIsPrimordial,
          category: this.formCategory as any,
          subcategory: this.formSubcategory || '',
          isSubscription: this.formIsSubscription,
          isVariable: this.formIsVariable,
          isRecurring: true,
          frequency: 'monthly'
        });
      }
      
      this.closeModal();
      await this.loadData();
    } catch (e) {
      console.error('Error saving expense:', e);
    }
  }

  // Auto-marcar como pagado si se completó
  async checkAndMarkAsPaid(expense: Expense) {
    if (expense.actualAmount >= expense.budgetedAmount && expense.status !== 'paid') {
      await this.expenseService.markAsPaid(expense.id, expense.actualAmount);
      await this.loadData();
    }
  }

  absAmount(n: number): number {
    return Math.abs(n);
  }

  getCategoryColor(cat: string): string {
    const colors: Record<string, string> = {
      housing: '#166B46',
      utilities: '#2FA46A',
      transport: '#0D1B16',
      health: '#ef4444',
      groceries: '#f59e0b',
      entertainment: '#8b5cf6',
      dining: '#ec4899',
      shopping: '#06b6d4',
      education: '#6366f1',
      other: '#64748b'
    };
    return colors[cat] || '#64748b';
  }
}