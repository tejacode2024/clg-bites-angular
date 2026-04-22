import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-bg">
      <div class="login-card">
        <!-- Logo -->
        <div class="login-logo">
          <div class="logo-icon">🍔</div>
          <h1>Clg<span>Bites</span></h1>
          <p>Admin Panel</p>
        </div>

        <!-- Form -->
        <div class="login-form">
          <h2>Welcome back</h2>
          <p class="subtitle">Enter your admin password to continue</p>

          <div class="field">
            <label>Password</label>
            <div class="input-wrap">
              <input
                [type]="showPassword ? 'text' : 'password'"
                [(ngModel)]="password"
                placeholder="Enter admin password"
                class="form-input"
                (keydown.enter)="login()"
                [class.error]="hasError"
              />
              <button class="eye-btn" type="button" (click)="showPassword = !showPassword">
                <span *ngIf="!showPassword">👁️</span>
                <span *ngIf="showPassword">🙈</span>
              </button>
            </div>
            <p *ngIf="hasError" class="error-msg">❌ Incorrect password. Try again.</p>
          </div>

          <button class="login-btn" (click)="login()" [disabled]="loading">
            <span *ngIf="!loading">🔐 Login to Admin</span>
            <span *ngIf="loading">Logging in...</span>
          </button>

          <button class="back-link" (click)="goHome()">← Back to ClgBites</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-bg {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #fff5f7 0%, #fde8ec 100%);
      padding: 1rem;
    }
    .login-card {
      background: white; border-radius: 1.5rem;
      box-shadow: 0 20px 60px rgba(232,84,108,0.15);
      width: 100%; max-width: 400px; overflow: hidden;
    }
    .login-logo {
      background: var(--primary); padding: 2rem;
      text-align: center; color: white;
    }
    .logo-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .login-logo h1 { font-size: 1.75rem; font-weight: 800; margin: 0; }
    .login-logo h1 span { font-weight: 900; }
    .login-logo p { font-size: 0.875rem; opacity: 0.85; margin-top: 0.25rem; }
    .login-form { padding: 2rem; }
    .login-form h2 { font-size: 1.25rem; font-weight: 700; color: var(--foreground); margin: 0 0 0.25rem; }
    .subtitle { font-size: 0.875rem; color: var(--muted-foreground); margin: 0 0 1.5rem; }
    .field { margin-bottom: 1.25rem; }
    .field label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--foreground); margin-bottom: 0.5rem; }
    .input-wrap { position: relative; }
    .form-input {
      width: 100%; padding: 0.75rem 3rem 0.75rem 1rem;
      border: 2px solid var(--border); border-radius: 0.75rem;
      font-size: 0.9rem; outline: none; transition: border-color 0.2s;
      font-family: 'Poppins', sans-serif; box-sizing: border-box;
    }
    .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(232,84,108,0.1); }
    .form-input.error { border-color: var(--destructive); }
    .eye-btn {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      border: none; background: none; cursor: pointer; font-size: 1rem;
    }
    .error-msg { font-size: 0.75rem; color: var(--destructive); margin-top: 0.375rem; }
    .login-btn {
      width: 100%; padding: 0.875rem; border-radius: 0.75rem;
      background: var(--primary); color: white; border: none; cursor: pointer;
      font-size: 1rem; font-weight: 600; font-family: 'Poppins', sans-serif;
      transition: all 0.2s; margin-bottom: 1rem;
    }
    .login-btn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px rgba(232,84,108,0.3); }
    .login-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
    .back-link {
      width: 100%; padding: 0.5rem; border: none; background: none; cursor: pointer;
      font-size: 0.875rem; color: var(--muted-foreground); font-family: 'Poppins', sans-serif;
      transition: color 0.2s;
    }
    .back-link:hover { color: var(--primary); }
  `]
})
export class AdminLoginComponent {
  password = '';
  hasError = false;
  loading = false;
  showPassword = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  login(): void {
    if (!this.password.trim()) return;
    this.loading = true;
    this.hasError = false;

    setTimeout(() => {
      const success = this.auth.login(this.password);
      if (success) {
        this.router.navigate(['/admin']);
      } else {
        this.hasError = true;
        this.password = '';
      }
      this.loading = false;
    }, 600);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}