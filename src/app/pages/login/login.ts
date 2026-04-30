import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  private fb          = inject(FormBuilder);
  private authService = inject(Auth);

  isRegister  = signal(false);
  isLoading   = signal(false);
  errorMsg    = signal('');
  showPassword = signal(false);

  form = this.fb.group({
    fullName: [''],
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  toggleMode() {
    this.isRegister.update(v => !v);
    this.errorMsg.set('');
    this.form.reset();
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMsg.set('');

    const { email, password, fullName } = this.form.value;

    try {
      if (this.isRegister()) {
        await this.authService.signUp(email!, password!, fullName ?? '');
        this.errorMsg.set('Revisa tu correo para confirmar tu cuenta.');
      } else {
        await this.authService.signIn(email!, password!);
      }
    } catch (error: any) {
      this.errorMsg.set(this.parseError(error.message));
    } finally {
      this.isLoading.set(false);
    }
  }

  private parseError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'Correo o contraseña incorrectos.';
    if (msg.includes('Email not confirmed'))       return 'Confirma tu correo antes de ingresar.';
    if (msg.includes('User already registered'))   return 'Este correo ya está registrado.';
    return msg;
  }
}