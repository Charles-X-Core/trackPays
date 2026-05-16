import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';
import { Category } from '../models/category.model';

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId' | 'createdAt'>[] = [
  { name: 'Alimentación', icon: '🍔', ruleType: 'need', budgetLimit: 200, isDefault: true },
  { name: 'Transporte', icon: '🚌', ruleType: 'need', budgetLimit: 100, isDefault: true },
  { name: 'Servicios', icon: '💡', ruleType: 'need', budgetLimit: 150, isDefault: true },
  { name: 'Salud', icon: '🏥', ruleType: 'need', budgetLimit: 100, isDefault: true },
  { name: 'Vivienda', icon: '🏠', ruleType: 'need', budgetLimit: 200, isDefault: true },
  { name: 'Entretenimiento', icon: '🎬', ruleType: 'want', budgetLimit: 100, isDefault: true },
  { name: 'Ropa', icon: '👕', ruleType: 'want', budgetLimit: 80, isDefault: true },
  { name: 'Restaurantes', icon: '🍽️', ruleType: 'want', budgetLimit: 80, isDefault: true },
  { name: 'Suscripciones', icon: '📱', ruleType: 'want', budgetLimit: 50, isDefault: true },
  { name: 'Viajes', icon: '✈️', ruleType: 'want', budgetLimit: 50, isDefault: true },
  { name: 'Ahorro', icon: '🐷', ruleType: 'saving', budgetLimit: 240, isDefault: true },
  { name: 'Inversión', icon: '📈', ruleType: 'saving', budgetLimit: null, isDefault: true },
  { name: 'Sueldo', icon: '💼', ruleType: 'need', budgetLimit: null, isDefault: true },
  { name: 'Otros', icon: '💰', ruleType: 'want', budgetLimit: null, isDefault: true },
];

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);

  async getAll(): Promise<Category[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const data = await this.firebase.getCategories(userId);
    return data as Category[];
  }

  async seedDefaultCategories(): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) return;

    const existing = await this.getAll();
    if (existing.length > 0) return;

    const batch: Promise<void>[] = DEFAULT_CATEGORIES.map(cat => 
      this.firebase.createCategory(userId, cat as any)
    );
    await Promise.all(batch);
  }

  async create(payload: Omit<Category, 'id' | 'userId' | 'createdAt'>): Promise<Category> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');
    return this.firebase.createCategory(userId, payload as any) as Promise<Category>;
  }
}