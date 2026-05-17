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
    switch (employmentType) {
      case 'employee':
        if (answers.salary_amount) {
          await this.firebase.createIncomeSource(userId, {
            type: 'salary',
            name: 'Salario',
            amount: answers.salary_amount,
            frequency: 'monthly',
            paymentDayOfMonth: parseInt(answers.salary_day) || 15,
            deductions: {
              afpPercent: answers.has_afp ? 13 : 0,
              insurancePercent: answers.has_health_insurance ? 4 : 0
            },
            isRecurring: true,
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'freelancer':
        if (answers.avg_monthly_income) {
          await this.firebase.createIncomeSource(userId, {
            type: 'freelance',
            name: 'Ingreso freelance',
            amount: answers.avg_monthly_income,
            frequency: answers.income_frequency === 'irregular' ? 'monthly' : answers.income_frequency,
            paymentDayOfMonth: null, // Variable
            isRecurring: answers.income_frequency !== 'irregular',
            notes: answers.income_type,
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'business_owner':
        if (answers.avg_monthly_profit) {
          await this.firebase.createIncomeSource(userId, {
            type: 'business',
            name: answers.business_name || 'Negocio',
            amount: answers.avg_monthly_profit,
            frequency: 'monthly',
            paymentDayOfMonth: null, // Variable
            isRecurring: true,
            notes: answers.business_type,
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'retired':
        if (answers.pension_amount) {
          await this.firebase.createIncomeSource(userId, {
            type: 'afp',
            name: 'Pensión / Jubilación',
            amount: answers.pension_amount,
            frequency: 'monthly',
            paymentDayOfMonth: parseInt(answers.pension_day) || 1,
            isRecurring: true,
            notes: answers.pension_source,
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'student':
        if (answers.monthly_amount) {
          await this.firebase.createIncomeSource(userId, {
            type: 'allowance',
            name: answers.income_source === 'parents' ? 'Ayuda familiar' : 'Ingreso estudiante',
            amount: answers.monthly_amount,
            frequency: 'monthly',
            paymentDayOfMonth: 1, // Typically start of month
            isRecurring: true,
            notes: answers.income_source,
            createdAt: now,
            updatedAt: now
          });
        }
        break;

      case 'unemployed':
        // No income sources, but we track their situation
        if (answers.savings_amount) {
          await this.firebase.setInitialBalance(userId, answers.savings_amount);
        }
        break;

      case 'other':
        if (answers.monthly_amount) {
          await this.firebase.createIncomeSource(userId, {
            type: 'other',
            name: 'Otros ingresos',
            amount: answers.monthly_amount,
            frequency: 'monthly',
            paymentDayOfMonth: null,
            isRecurring: true,
            notes: answers.income_source,
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