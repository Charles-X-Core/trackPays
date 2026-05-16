import { Injectable, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit } from '@angular/fire/firestore';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  // Auth methods
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

  // Firestore methods - User Profile
  async getUserProfile(userId: string) {
    const docRef = doc(this.firestore, `users/${userId}/profile/data`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
  }

  async createUserProfile(userId: string, data: any) {
    const docRef = doc(this.firestore, `users/${userId}/profile/data`);
    return setDoc(docRef, data, { merge: true });
  }

  // Firestore methods - Transactions (legacy structure for now)
  async getTransactions(userId: string, year?: number, month?: number) {
    let q = collection(this.firestore, `users/${userId}/transactions`);
    
    if (year && month) {
      const from = `${year}-${String(month).padStart(2, '0')}-01`;
      const to = new Date(year, month, 0).toISOString().split('T')[0];
      q = query(q, where('date', '>=', from), where('date', '<=', to), orderBy('date', 'desc')) as any;
    } else {
      q = query(q, orderBy('date', 'desc'), limit(100)) as any;
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createTransaction(userId: string, data: any): Promise<any> {
    const docRef = doc(collection(this.firestore, `users/${userId}/transactions`));
    await setDoc(docRef, { ...data, id: docRef.id });
    return { ...data, id: docRef.id };
  }

  // Firestore methods - Goals
  async getGoal(userId: string) {
    const docRef = doc(this.firestore, `users/${userId}/goals/data`);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  }

  async createOrUpdateGoal(userId: string, data: any) {
    const docRef = doc(this.firestore, `users/${userId}/goals/data`);
    return setDoc(docRef, data, { merge: true });
  }

  // Firestore methods - Categories
  async getCategories(userId: string) {
    const q = query(collection(this.firestore, `users/${userId}/categories`), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async createCategories(userId: string, categories: any[]) {
    const batch: Promise<any>[] = [];
    categories.forEach(cat => {
      const docRef = doc(collection(this.firestore, `users/${userId}/categories`));
      batch.push(setDoc(docRef, { ...cat, id: docRef.id }));
    });
    return Promise.all(batch);
  }

  async createCategory(userId: string, data: any) {
    const docRef = doc(collection(this.firestore, `users/${userId}/categories`));
    const dataWithId = { ...data, id: docRef.id, createdAt: new Date().toISOString() };
    await setDoc(docRef, dataWithId);
    return dataWithId;
  }
}