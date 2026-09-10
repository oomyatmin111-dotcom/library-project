import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css'],
})
export class AuthModalComponent {
  authService = inject(AuthService);

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string>('');

  // Login form
  loginEmail = signal<string>('hlahla@gmail.com');
  loginPassword = signal<string>('Password@123');

  // Register form
  regFirstName = signal<string>('');
  regLastName = signal<string>('');
  regEmail = signal<string>('');
  regPhone = signal<string>('');
  regPassword = signal<string>('');

  onLogin() {
    this.errorMessage.set('');
    if (!this.loginEmail() || !this.loginPassword()) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }

    this.isSubmitting.set(true);
    this.authService.login({
      email: this.loginEmail(),
      password: this.loginPassword(),
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Login failed. Please check credentials.');
      },
    });
  }

  onRegister() {
    this.errorMessage.set('');
    if (!this.regEmail() || !this.regPassword() || !this.regFirstName() || !this.regLastName()) {
      this.errorMessage.set('Please fill out all required fields.');
      return;
    }

    this.isSubmitting.set(true);
    this.authService.register({
      firstName: this.regFirstName(),
      lastName: this.regLastName(),
      email: this.regEmail(),
      phone: this.regPhone() || undefined,
      password: this.regPassword(),
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Registration failed.');
      },
    });
  }

  quickLogin(email: string) {
    this.errorMessage.set('');
    this.isSubmitting.set(true);
    this.authService.quickDemoLogin(email).subscribe({
      next: () => {
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Quick login failed.');
      },
    });
  }

  close() {
    this.authService.closeAuthModal();
  }

  setMode(mode: 'login' | 'register') {
    this.errorMessage.set('');
    this.authService.authModalMode.set(mode);
  }
}
