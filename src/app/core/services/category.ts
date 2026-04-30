import { Injectable, inject } from '@angular/core';
import { Supabase } from './supabase';
import { Auth } from './auth';
import { Category } from '../models/category.model';

// Categorías por defecto que se crean al registrarse
const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'user_id' | 'created_at'>[] = [
  { name: 'Alimentación',  icon: '🍔', rule_type: 'need',   budget_limit: 200, is_default: true },
  { name: 'Transporte',    icon: '🚌', rule_type: 'need',   budget_limit: 100, is_default: true },
  { name: 'Servicios',     icon: '💡', rule_type: 'need',   budget_limit: 150, is_default: true },
  { name: 'Salud',         icon: '🏥', rule_type: 'need',   budget_limit: 100, is_default: true },
  { name: 'Vivienda',      icon: '🏠', rule_type: 'need',   budget_limit: 200, is_default: true },
  { name: 'Entretenimiento', icon: '🎬', rule_type: 'want', budget_limit: 100, is_default: true },
  { name: 'Ropa',          icon: '👕', rule_type: 'want',   budget_limit: 80,  is_default: true },
  { name: 'Restaurantes',  icon: '🍽️', rule_type: 'want',  budget_limit: 80,  is_default: true },
  { name: 'Suscripciones', icon: '📱', rule_type: 'want',   budget_limit: 50,  is_default: true },
  { name: 'Viajes',        icon: '✈️', rule_type: 'want',   budget_limit: 50,  is_default: true },
  { name: 'Ahorro',        icon: '🐷', rule_type: 'saving', budget_limit: 240, is_default: true },
  { name: 'Inversión',     icon: '📈', rule_type: 'saving', budget_limit: null, is_default: true },
  { name: 'Sueldo',        icon: '💼', rule_type: 'need',   budget_limit: null, is_default: true },
  { name: 'Otros',         icon: '💰', rule_type: 'want',   budget_limit: null, is_default: true },
];


@Injectable({
  providedIn: 'root',
})

export class CategoryService {
  private supabase    = inject(Supabase).getClient();
  private authService = inject(Auth);

  async getAll(): Promise<Category[]> {
    const userId = this.authService.getUserId();
    if (!userId) return [];

    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) throw error;
    return data ?? [];
  }

  async seedDefaultCategories(): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) return;

    // Verificar si ya tiene categorías para no duplicar
    const { count } = await this.supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if ((count ?? 0) > 0) return;

    const rows = DEFAULT_CATEGORIES.map(cat => ({ ...cat, user_id: userId }));

    const { error } = await this.supabase.from('categories').insert(rows);
    if (error) throw error;
  }

  async create(payload: Omit<Category, 'id' | 'user_id' | 'created_at'>): Promise<Category> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const { data, error } = await this.supabase
      .from('categories')
      .insert({ ...payload, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
