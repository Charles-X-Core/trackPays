import { Injectable, inject } from '@angular/core';
import { FirebaseService } from './firebase';
import { Auth } from './auth';
import { 
  EmploymentType, 
  OnboardingQuestion, 
  OnboardingResponse,
  ONBOARDING_QUESTIONS,
  COMMON_QUESTIONS
} from '../models/onboarding.model';

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private firebase = inject(FirebaseService);
  private authService = inject(Auth);

  // Obtener preguntas según tipo de empleo
  getQuestionsByEmploymentType(type: EmploymentType): OnboardingQuestion[] {
    const specificQuestions = ONBOARDING_QUESTIONS[type] || [];
    return [...COMMON_QUESTIONS, ...specificQuestions];
  }

  // Obtener todas las preguntas para un tipo específico
  getAllQuestionsForType(type: EmploymentType): OnboardingQuestion[] {
    return this.getQuestionsByEmploymentType(type);
  }

  // Obtener opciones de tipo de empleo para la primera pregunta
  getEmploymentTypes() {
    return [
      { value: 'employee', label: 'Empleado / Trabajador dependiente', icon: '💼' },
      { value: 'freelancer', label: 'Freelancer / Independiente', icon: '💻' },
      { value: 'business_owner', label: 'Dueño de negocio / Emprendedor', icon: '🏪' },
      { value: 'retired', label: 'Jubilado / Pensionado', icon: '🏖️' },
      { value: 'student', label: 'Estudiante', icon: '📚' },
      { value: 'unemployed', label: 'Sin trabajo actualmente', icon: '🔍' },
      { value: 'other', label: 'Otra situación', icon: '✨' }
    ];
  }

  // Verificar si el usuario ya completó el onboarding
  async isOnboardingComplete(): Promise<boolean> {
    const userId = this.authService.getUserId();
    if (!userId) return false;

    const profile = await this.firebase.getUserProfileComplete(userId);
    return profile?.['onboardingCompleted'] || false;
  }

  // Obtener la versión del onboarding
  async getOnboardingVersion(): Promise<number> {
    const userId = this.authService.getUserId();
    if (!userId) return 0;

    const profile = await this.firebase.getUserProfileComplete(userId);
    return profile?.['onboardingVersion'] || 0;
  }

  // Guardar respuestas del onboarding
  async saveOnboardingResponse(response: OnboardingResponse): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) throw new Error('No autenticado');

    const profileData = {
      // Basic info
      age: response.age,
      employmentType: response.employmentType,
      
      // Answers based on employment type
      ...response.answers,
      
      // Common answers
      hasGoals: response.hasGoals,
      hasInvestments: response.hasInvestments,
      financialPriority: response.financialPriority,
      
      // Meta
      onboardingCompleted: true,
      onboardingVersion: response.onboardingVersion || 1,
      onboardingCompletedAt: new Date().toISOString(),
      needsReview: false,
      
      // Updated
      updatedAt: new Date().toISOString()
    };

    await this.firebase.saveUserProfile(userId, profileData);

    // Create income sources based on employment type
    await this.createIncomeSourcesFromOnboarding(response);
  }

  // Crear income sources basados en las respuestas
  private async createIncomeSourcesFromOnboarding(response: OnboardingResponse): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) return;

    const { employmentType, answers, age } = response;
    const now = new Date().toISOString();

    // 根据就业类型创建收入来源
    const ans = answers as any;
    
    switch (employmentType) {
      case 'employee':
        if (ans['salary_amount']) {
          await this.firebase.createIncomeSource(userId, {
            type: 'salary',
            name: 'Salario',
            amount: ans['salary_amount'],
            frequency: 'monthly',
            paymentDayOfMonth: parseInt(ans['salary_day']) || 15,
            deductions: {
              afpPercent: ans['has_afp'] ? 13 : 0,
              insurancePercent: ans['has_health_insurance'] ? 4 : 0
            },
            isRecurring: true,
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'freelancer':
        if (ans['avg_monthly_income']) {
          await this.firebase.createIncomeSource(userId, {
            type: 'freelance',
            name: 'Ingreso freelance',
            amount: ans['avg_monthly_income'],
            frequency: ans['income_frequency'] === 'irregular' ? 'monthly' : ans['income_frequency'],
            paymentDayOfMonth: null,
            isRecurring: ans['income_frequency'] !== 'irregular',
            notes: ans['income_type'],
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'business_owner':
        if (ans['avg_monthly_profit']) {
          await this.firebase.createIncomeSource(userId, {
            type: 'business',
            name: ans['business_name'] || 'Negocio',
            amount: ans['avg_monthly_profit'],
            frequency: 'monthly',
            paymentDayOfMonth: null,
            isRecurring: true,
            notes: ans['business_type'],
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'retired':
        if (ans['pension_amount']) {
          await this.firebase.createIncomeSource(userId, {
            type: 'afp',
            name: 'Pensión / Jubilación',
            amount: ans['pension_amount'],
            frequency: 'monthly',
            paymentDayOfMonth: parseInt(ans['pension_day']) || 1,
            isRecurring: true,
            notes: ans['pension_source'],
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'student':
        if (ans['monthly_amount']) {
          await this.firebase.createIncomeSource(userId, {
            type: 'allowance',
            name: ans['income_source'] === 'parents' ? 'Ayuda familiar' : 'Ingreso estudiante',
            amount: ans['monthly_amount'],
            frequency: 'monthly',
            paymentDayOfMonth: 1,
            isRecurring: true,
            notes: ans['income_source'],
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'unemployed':
        if (ans['savings_amount']) {
          await this.firebase.setInitialBalance(userId, ans['savings_amount']);
        }
        break;

      case 'other':
        if (ans['monthly_amount']) {
          await this.firebase.createIncomeSource(userId, {
            type: 'other',
            name: 'Otros ingresos',
            amount: ans['monthly_amount'],
            frequency: 'monthly',
            paymentDayOfMonth: null,
            isRecurring: true,
            notes: ans['income_source'],
            createdAt: now,
            updatedAt: now
          });
        }
        break;
    }
  }

  // Obtener el perfil del usuario
  async getUserProfile(): Promise<any> {
    const userId = this.authService.getUserId();
    if (!userId) return null;

    return this.firebase.getUserProfileComplete(userId);
  }

  // Marcar que necesita revisión de onboarding
  async markForReview(): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) return;

    await this.firebase.saveUserProfile(userId, {
      needsReview: true,
      updatedAt: new Date().toISOString()
    });
  }

  // Reiniciar onboarding (para settings)
  async resetOnboarding(): Promise<void> {
    const userId = this.authService.getUserId();
    if (!userId) return;

    await this.firebase.saveUserProfile(userId, {
      onboardingCompleted: false,
      onboardingVersion: 0,
      needsReview: false,
      updatedAt: new Date().toISOString()
    });
  }
}