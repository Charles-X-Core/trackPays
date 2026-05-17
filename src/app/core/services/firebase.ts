import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, writeBatch } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // ============================================
  // AUTH METHODS
  // ============================================
  getAuth() {
    return this.auth;
  }

  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(this.auth, callback);
  }

  async signIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  async signUp(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  async signOut() {
    return signOut(this.auth);
  }

  // ============================================
  // USER PROFILE
  // ============================================
  async getUserProfile(userId: string) {
    const docRef = doc(this.firestore, `users/${userId}/profile/data`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  async createUserProfile(userId: string, data: any) {
    const docRef = doc(this.firestore, `users/${userId}/profile/data`);
    return setDoc(docRef, data, { merge: true });
  }

  // ============================================
  // USER PROFILE (NEW - Onboarding)
  // ============================================
  async getUserProfileComplete(userId: string) {
    const docRef = doc(this.firestore, `users/${userId}/profile`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  async saveUserProfile(userId: string, data: any) {
    const docRef = doc(this.firestore, `users/${userId}/profile`);
    return setDoc(docRef, data, { merge: true });
  }

  // ============================================
  // MONTHS STRUCTURE (NEW)
  // ============================================
  
  // Get month ID from date
  getMonthId(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Get or create month document
  async getOrCreateMonth(userId: string, year: number, month: number): Promise<string> {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const monthRef = doc(this.firestore, `users/${userId}/months/${monthId}`);
    const monthSnap = await getDoc(monthRef);
    
    if (!monthSnap.exists()) {
      await setDoc(monthRef, {
        id: monthId,
        year,
        month,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    
    return monthId;
  }

  // Get transactions from months structure
  async getTransactionsByMonth(userId: string, year: number, month: number) {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const q = query(
      collection(this.firestore, `users/${userId}/months/${monthId}/transactions`),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Create transaction in months structure
  async createTransactionInMonth(userId: string, data: any): Promise<any> {
    const date = new Date(data.date);
    const monthId = this.getMonthId(date);
    
    // Ensure month exists
    await this.getOrCreateMonth(userId, date.getFullYear(), date.getMonth() + 1);
    
    const docRef = doc(collection(this.firestore, `users/${userId}/months/${monthId}/transactions`));
    const txData = {
      ...data,
      id: docRef.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, txData);
    
    // Update financial state
    await this.updateFinancialState(userId, monthId);
    
    return txData;
  }

  // Get financial state for a month
  async getFinancialState(userId: string, year: number, month: number): Promise<any> {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const docRef = doc(this.firestore, `users/${userId}/months/${monthId}/financialState`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  // Update financial state (pre-calculated)
  async updateFinancialState(userId: string, monthId: string) {
    // Get all transactions for the month
    const q = query(collection(this.firestore, `users/${userId}/months/${monthId}/transactions`));
    const snapshot = await getDocs(q);
    const transactions = snapshot.docs.map(doc => doc.data());
    
    // Get income data for this month
    const [year, month] = monthId.split('-').map(Number);
    const incomeData = await this.calculateMonthlyIncome(userId, year, month);
    
    // Calculate totals from transactions (actual received)
    const income = transactions.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
    const expenses = transactions.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
    
    // Use income data for budgeted amounts
    const budgetedIncome = incomeData.totalBudgeted;
    const initialBalance = incomeData.initialBalance;
    
    // Available now = initial balance + received
    const availableNow = initialBalance + income;
    
    // Budgeted balance = initial + expected income - budgeted expenses
    const budgetedExpenses = expenses; // For now, assume budget = actual for expenses
    
    const balance = availableNow - expenses; // Actual balance
    const budgetedBalance = (initialBalance + budgetedIncome) - budgetedExpenses; // Expected at end of month
    
    const savings = availableNow - expenses;
    const budgetedSavings = (initialBalance + budgetedIncome) - budgetedExpenses;
    const savingsRate = budgetedIncome > 0 ? (budgetedSavings / budgetedIncome) * 100 : 0;
    
    // Calculate 50/30/20 breakdown
    const expensesByType = { need: 0, want: 0, saving: 0 };
    transactions.filter((t: any) => t.amount < 0 && t.ruleType).forEach((t: any) => {
      const type = t.ruleType as keyof typeof expensesByType;
      if (type in expensesByType) {
        expensesByType[type] += Math.abs(t.amount);
      }
    });
    
    // Calculate financial score (simple version)
    let score = 50; // base
    if (savingsRate >= 20) score += 20;
    else if (savingsRate >= 10) score += 10;
    if (expenses <= income) score += 20;
    if (income > 0) score += 10;
    
    // Determine health status
    let healthStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    if (score >= 80) healthStatus = 'excellent';
    else if (score >= 60) healthStatus = 'good';
    else if (score >= 40) healthStatus = 'warning';
    else healthStatus = 'critical';
    
    // Save financial state with income breakdown
    const financialState = {
      // Income
      income,
      incomeBudgeted: budgetedIncome,
      incomeReceived: income,
      incomePending: budgetedIncome - income,
      initialBalance,
      availableNow,
      expectedByEndOfMonth: initialBalance + budgetedIncome,
      
      // Expenses
      expenses,
      expensesBudgeted: budgetedExpenses,
      
      // Balance
      balance,
      budgetedBalance,
      
      // Savings
      savings,
      savingsRate: Math.round(savingsRate * 10) / 10,
      
      // Score
      financialScore: score,
      healthStatus,
      
      // Expenses breakdown
      rule50320: expensesByType,
      lastUpdated: new Date().toISOString()
    };
    
    const stateRef = doc(this.firestore, `users/${userId}/months/${monthId}/financialState`);
    await setDoc(stateRef, financialState, { merge: true });
    
    return financialState;
  }

  // Get month summary
  async getMonthSummary(userId: string, year: number, month: number): Promise<any> {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    
    // Try to get cached state first
    const state = await this.getFinancialState(userId, year, month);
    if (state) return state;
    
    // If not exists, calculate and return
    await this.updateFinancialState(userId, monthId);
    return this.getFinancialState(userId, year, month);
  }

  // ============================================
  // LEGACY TRANSACTIONS (for backward compatibility)
  // ============================================
  async getTransactions(userId: string, year?: number, month?: number) {
    // If year/month provided, use new months structure
    if (year && month) {
      return this.getTransactionsByMonth(userId, year, month);
    }
    
    // Otherwise use legacy flat structure
    let q = collection(this.firestore, `users/${userId}/transactions`);
    q = query(q, orderBy('date', 'desc'), limit(100)) as any;
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createTransaction(userId: string, data: any): Promise<any> {
    // Use new months structure by default
    return this.createTransactionInMonth(userId, data);
  }

  // ============================================
  // GOALS
  // ============================================
  async getGoal(userId: string) {
    const docRef = doc(this.firestore, `users/${userId}/goals/data`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async createOrUpdateGoal(userId: string, data: any) {
    const docRef = doc(this.firestore, `users/${userId}/goals/data`);
    return setDoc(docRef, data, { merge: true });
  }

  // ============================================
  // CATEGORIES
  // ============================================
  async getCategories(userId: string) {
    const q = query(collection(this.firestore, `users/${userId}/categories`), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createCategories(userId: string, categories: any[]) {
    const batch = writeBatch(this.firestore);
    categories.forEach(cat => {
      const docRef = doc(collection(this.firestore, `users/${userId}/categories`));
      batch.set(docRef, { ...cat, id: docRef.id });
    });
    await batch.commit();
  }

  async createCategory(userId: string, data: any) {
    const docRef = doc(collection(this.firestore, `users/${userId}/categories`));
    const dataWithId = { ...data, id: docRef.id, createdAt: new Date().toISOString() };
    await setDoc(docRef, dataWithId);
    return dataWithId;
  }

  // ============================================
  // INCOME SOURCES (NEW)
  // ============================================
  
  // Get all income sources for user
  async getIncomeSources(userId: string) {
    const q = query(
      collection(this.firestore, `users/${userId}/incomeSources`),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Get active income sources
  async getActiveIncomeSources(userId: string) {
    const q = query(
      collection(this.firestore, `users/${userId}/incomeSources`),
      where('isActive', '==', true),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Create income source
  async createIncomeSource(userId: string, data: any): Promise<any> {
    const docRef = doc(collection(this.firestore, `users/${userId}/incomeSources`));
    const now = new Date().toISOString();
    const sourceData = {
      ...data,
      id: docRef.id,
      userId,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    await setDoc(docRef, sourceData);
    return sourceData;
  }

  // Update income source
  async updateIncomeSource(userId: string, sourceId: string, data: any) {
    const docRef = doc(this.firestore, `users/${userId}/incomeSources/${sourceId}`);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  }

  // Delete (deactivate) income source
  async deactivateIncomeSource(userId: string, sourceId: string) {
    const docRef = doc(this.firestore, `users/${userId}/incomeSources/${sourceId}`);
    await setDoc(docRef, { isActive: false, updatedAt: new Date().toISOString() });
  }

  // Record income received
  async recordIncomeReceived(userId: string, sourceId: string, amount: number, receivedDate: string) {
    const docRef = doc(this.firestore, `users/${userId}/incomeSources/${sourceId}`);
    await setDoc(docRef, { 
      actualAmount: amount,
      lastPaymentDate: receivedDate,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  // ============================================
  // INITIAL BALANCE
  // ============================================
  
  // Get initial balance
  async getInitialBalance(userId: string): Promise<number> {
    const docRef = doc(this.firestore, `users/${userId}/profile`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data['initialBalance'] || 0;
    }
    return 0;
  }

  // Set initial balance
  async setInitialBalance(userId: string, amount: number) {
    const docRef = doc(this.firestore, `users/${userId}/profile`);
    await setDoc(docRef, { initialBalance: amount }, { merge: true });
  }

  // ============================================
  // MONTHLY INCOME CALCULATION
  // ============================================
  
  // Calculate monthly income with dates
  async calculateMonthlyIncome(userId: string, year: number, month: number): Promise<any> {
    const monthId = `${year}-${String(month).padStart(2, '0')}`;
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const isCurrentMonth = currentYear === year && currentMonth === month;
    
    // Get active income sources
    const sources = await this.getActiveIncomeSources(userId);
    
    // Get initial balance
    const initialBalance = await this.getInitialBalance(userId);
    
    // Get transactions for the month to calculate what's actually received
    const transactions = await this.getTransactionsByMonth(userId, year, month);
    const incomeTransactions = transactions.filter((t: any) => t.amount > 0);
    const totalReceived = incomeTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
    
    // Calculate expected vs received per source
    const sourceDetails = sources.map((source: any) => {
      // Find transactions from this source
      const sourceTransactions = incomeTransactions.filter((t: any) => 
        t.description?.toLowerCase().includes(source.name.toLowerCase()) ||
        t.incomeSourceId === source.id
      );
      const received = sourceTransactions.reduce((sum: number, t: any) => sum + t.amount, 0);
      
      const expectedDate = source.paymentDayOfMonth;
      const isOverdue = isCurrentMonth && expectedDate && currentDay > expectedDate && received === 0;
      const isPending = isCurrentMonth && expectedDate && currentDay < expectedDate && received === 0;
      const isReceived = received > 0;
      
      let status: 'pending' | 'partial' | 'received' | 'overdue' = 'pending';
      if (isReceived) status = received >= source.amount ? 'received' : 'partial';
      else if (isOverdue) status = 'overdue';
      else if (isPending) status = 'pending';
      
      return {
        sourceId: source.id,
        name: source.name,
        type: source.type,
        budgeted: source.amount,
        received,
        expectedDate,
        receivedDate: source.lastPaymentDate,
        status
      };
    });
    
    // Calculate totals
    const totalBudgeted = sources.reduce((sum: number, s: any) => sum + s.amount, 0);
    const totalExpected = sourceDetails.reduce((sum: number, s: any) => sum + s.budgeted, 0);
    
    // Available now = initial balance + received so far
    const availableNow = initialBalance + totalReceived;
    
    // Expected by end of month
    const expectedByEndOfMonth = initialBalance + totalBudgeted;
    
    return {
      monthId,
      totalBudgeted,
      totalExpected,
      totalReceived,
      totalPending: totalExpected - totalReceived,
      initialBalance,
      availableNow,
      expectedByEndOfMonth,
      sources: sourceDetails,
      lastUpdated: new Date().toISOString()
    };
  }
}