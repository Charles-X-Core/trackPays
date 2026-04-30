import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';
import { Supabase } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class Auth {

  private supabase = inject(Supabase).getClient();
  private router   = inject(Router);

  // Signals para que los componentes reaccionen al estado del usuario
  currentUser   = signal<User | null>(null);
  currentSession = signal<Session | null>(null);
  isLoading     = signal<boolean>(true);

  constructor() {
    this.initAuthState();
  }

  // Escucha cambios de sesión en tiempo real (login, logout, expiración)
  private async initAuthState() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentSession.set(session);
    this.currentUser.set(session?.user ?? null);
    this.isLoading.set(false);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession.set(session);
      this.currentUser.set(session?.user ?? null);
    });
  }

  // ─── Registro ────────────────────────────────────────────
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    });

    if (error) throw error;
    return data;
    // El trigger SQL crea el perfil automáticamente ✅
  }

  // ─── Login ───────────────────────────────────────────────
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    this.router.navigate(['/dashboard']);
    return data;
  }

  // ─── Logout ──────────────────────────────────────────────
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.router.navigate(['/login']);
  }

  // ─── Crear perfil en tabla profiles ──────────────────────
  private async createProfile(userId: string, fullName: string) {
    const { error } = await this.supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        monthly_income: 1200.00
      });

    if (error) throw error;
  }

  // ─── Helper para otros servicios ─────────────────────────
  getUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }

  isAuthenticated(): boolean {
    return this.currentUser() !== null;
  }
}