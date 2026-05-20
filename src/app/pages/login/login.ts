import { Component, inject, signal, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../core/services/auth';
import { PasswordStrengthComponent } from '../../core/components/password-strength/password-strength';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PasswordStrengthComponent],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent {

  private fb          = inject(FormBuilder);
  private authService = inject(Auth);
  private router      = inject(Router);

  isRegister   = signal(false);
  isLoading    = signal(false);
  errorMsg     = signal('');
  showPassword = signal(false);
  passwordValue = signal('');

  form = this.fb.group({
    fullName: [''],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor() {
    this.form.get('password')?.valueChanges.subscribe(val => {
      this.passwordValue.set(val || '');
    });
  }

  toggleMode() {
    this.isRegister.update(v => !v);
    this.errorMsg.set('');
    this.form.reset();
    this.passwordValue.set('');
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  get showStrength(): boolean {
    return this.isRegister() && this.passwordValue().length > 0;
  }

  isPasswordValid(): boolean {
    const pwd = this.passwordValue();
    return pwd.length >= 8 && /\d/.test(pwd) && /[A-Z]/.test(pwd);
  }

  async onSubmit() {
    // En modo login, solo verificar que los campos no estén vacíos
    if (this.form.invalid) {
      return;
    }

    // En modo registro, verificar requisitos de contraseña fuerte
    if (this.isRegister() && !this.isPasswordValid()) {
      this.errorMsg.set('La contraseña debe tener al menos 8 caracteres, un número y una mayúscula.');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set('');

    const { email, password, fullName } = this.form.value;

    try {
      if (this.isRegister()) {
        await this.authService.signUp(email!, password!, fullName ?? '');
      } else {
        await this.authService.signIn(email!, password!);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      this.errorMsg.set(this.parseError(error.message || error.code || 'Error desconocido'));
    } finally {
      this.isLoading.set(false);
    }
  }

  async loginWithGoogle() {
    this.isLoading.set(true);
    this.errorMsg.set('');
    try {
      await this.authService.signInWithGoogle();
    } catch (error: any) {
      this.errorMsg.set(this.parseError(error.message));
      this.isLoading.set(false);
    }
  }

  private parseError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (msg.includes('Email not confirmed'))       return 'Confirma tu correo antes de ingresar.';
    if (msg.includes('User already registered'))   return 'Este correo ya está registrado.';
    if (msg.includes('POPUP_CLOSED'))               return 'Cerraste la ventana de Google.';
    if (msg.includes('Network error'))               return 'Error de conexión. Intenta de nuevo.';
    return msg;
  }
}