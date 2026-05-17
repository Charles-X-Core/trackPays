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
    
    // Calculate totals
    const income = transactions.filter((t: any) => t.amount > 0).reduce((s: number, t: any) => s + t.amount, 0);
    const expenses = transactions.filter((t: any) => t.amount < 0).reduce((s: number, t: any) => s + Math.abs(t.amount), 0);
    const balance = income - expenses;
    const savings = income - expenses;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    
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
    
    // Save financial state
    const financialState = {
      income,
      expenses,
      balance,
      savings,
      savingsRate: Math.round(savingsRate * 10) / 10,
      financialScore: score,
      healthStatus,
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
}