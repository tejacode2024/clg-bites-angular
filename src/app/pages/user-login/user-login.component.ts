import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

const LOCATIONS = [
  { label: 'VIT-AP University', sublabel: 'On-campus delivery · Free' },
  { label: 'Ainavolu Village', sublabel: 'Near campus · ₹10 fee' },
];

@Component({
  selector: 'app-user-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-screen">
      <!-- Header -->
      <div class="login-header">
        <div class="brand-logo">🍴</div>
        <h1 class="brand-name">CLGBITES</h1>
        <p class="brand-tagline">Order food · Track orders · No WhatsApp needed</p>
        <p class="brand-sub">No password needed — enter your details to start ordering</p>
      </div>

      <!-- Form Card -->
      <div class="login-card">
        <div *ngIf="errorMsg()" class="error-banner">
          ⚠️ {{ errorMsg() }}
        </div>

        <!-- Name -->
        <div class="field-group">
          <label class="field-label">👤 Your Name</label>
          <input
            type="text"
            [(ngModel)]="name"
            placeholder="e.g. Ravi Kumar"
            class="field-input"
            [class.input-error]="triedSubmit && !name.trim()"
            (input)="errorMsg.set('')"
          />
          <p *ngIf="triedSubmit && !name.trim()" class="field-error">Name is required</p>
        </div>

        <!-- Phone -->
        <div class="field-group">
          <label class="field-label">📱 Mobile Number</label>
          <input
            type="tel"
            [(ngModel)]="phone"
            placeholder="10-digit number"
            maxlength="10"
            class="field-input"
            [class.input-error]="triedSubmit && phone.trim().length < 10"
            (input)="errorMsg.set('')"
          />
          <p *ngIf="triedSubmit && phone.trim().length < 10" class="field-error">Enter a valid 10-digit number</p>
        </div>

        <!-- Location -->
        <div class="field-group">
          <label class="field-label">📍 Delivery Location</label>
          <div class="location-options">
            <button
              *ngFor="let loc of locations; let i = index"
              (click)="selectedLocIdx = i"
              class="loc-option"
              [class.loc-active]="selectedLocIdx === i"
            >
              <div class="loc-content">
                <span class="loc-label">{{ loc.label }}</span>
                <span class="loc-sub">{{ loc.sublabel }}</span>
              </div>
              <span *ngIf="selectedLocIdx === i" class="loc-check">✓</span>
            </button>
          </div>
        </div>

        <!-- Submit -->
        <button
          class="login-btn"
          [class.loading]="isLoading()"
          [disabled]="isLoading()"
          (click)="handleLogin()"
        >
          <span *ngIf="!isLoading()">Continue to Order →</span>
          <span *ngIf="isLoading()" class="spinner-text">⏳ Checking details...</span>
        </button>

        <p class="login-note">
          📋 If you've ordered before, your details will be retrieved automatically.<br/>
          New here? We'll create your profile instantly.
        </p>
      </div>
    </div>
  `,
  styles: [`
    .login-screen {
      min-height: 100vh;
      background: linear-gradient(160deg, #fff7ed 0%, #fffbf5 60%, #fff 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 2rem 1rem 3rem;
      font-family: inherit;
    }
    .login-header {
      text-align: center;
      margin-bottom: 1.75rem;
    }
    .brand-logo {
      font-size: 3rem;
      margin-bottom: 0.5rem;
    }
    .brand-name {
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -1px;
      color: #111827;
      margin: 0 0 0.25rem;
    }
    .brand-tagline {
      font-size: 0.85rem;
      font-weight: 700;
      color: #f97316;
      margin: 0 0 0.35rem;
    }
    .brand-sub {
      font-size: 0.8rem;
      color: #9ca3af;
      margin: 0;
    }
    .login-card {
      width: 100%;
      max-width: 420px;
      background: white;
      border-radius: 1.5rem;
      border: 1px solid #fde8c8;
      padding: 1.5rem;
      box-shadow: 0 4px 24px rgba(249,115,22,0.08);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      font-size: 0.82rem;
      color: #dc2626;
      font-weight: 600;
    }
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .field-label {
      font-size: 0.78rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .field-input {
      width: 100%;
      box-sizing: border-box;
      background: #fff7ed;
      border: 1.5px solid #fed7aa;
      border-radius: 0.875rem;
      padding: 0.75rem 1rem;
      font-size: 0.9rem;
      font-weight: 600;
      color: #111827;
      outline: none;
      font-family: inherit;
      transition: border-color 0.15s, background 0.15s;
    }
    .field-input:focus {
      border-color: #f97316;
      background: white;
    }
    .field-input.input-error {
      border-color: #ef4444;
      background: #fef2f2;
    }
    .field-error {
      font-size: 0.75rem;
      color: #ef4444;
      font-weight: 600;
      margin: 0;
    }
    .location-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .loc-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-radius: 0.875rem;
      border: 2px solid #fed7aa;
      background: #fff7ed;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
      text-align: left;
    }
    .loc-option.loc-active {
      border-color: #f97316;
      background: #fff7ed;
      box-shadow: 0 2px 8px rgba(249,115,22,0.18);
    }
    .loc-content {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .loc-label {
      font-size: 0.88rem;
      font-weight: 700;
      color: #111827;
    }
    .loc-option.loc-active .loc-label {
      color: #ea580c;
    }
    .loc-sub {
      font-size: 0.75rem;
      color: #9ca3af;
    }
    .loc-check {
      font-size: 1rem;
      color: #f97316;
      font-weight: 900;
    }
    .login-btn {
      width: 100%;
      padding: 1rem;
      border-radius: 1rem;
      border: none;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      font-size: 1rem;
      font-weight: 800;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
      box-shadow: 0 4px 16px rgba(249,115,22,0.35);
    }
    .login-btn:active:not(:disabled) { transform: scale(0.98); }
    .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .login-btn.loading { background: #d1d5db; box-shadow: none; }
    .spinner-text { display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .login-note {
      font-size: 0.75rem;
      color: #9ca3af;
      text-align: center;
      line-height: 1.6;
      margin: 0;
    }
  `]
})
export class UserLoginComponent {
  private userService = inject(UserService);
  private router = inject(Router);

  readonly locations = LOCATIONS;
  name = '';
  phone = '';
  selectedLocIdx = 0;
  triedSubmit = false;
  isLoading = signal(false);
  errorMsg = signal('');

  async handleLogin(): Promise<void> {
    this.triedSubmit = true;
    if (!this.name.trim() || this.phone.trim().length < 10) return;

    this.isLoading.set(true);
    this.errorMsg.set('');

    const user = await this.userService.loginOrRegister(
      this.name,
      this.phone,
      this.locations[this.selectedLocIdx].label
    );

    this.isLoading.set(false);

    if (!user) {
      this.errorMsg.set('Could not connect to server. Please try again.');
      return;
    }

    this.router.navigate(['/']);
  }
}
