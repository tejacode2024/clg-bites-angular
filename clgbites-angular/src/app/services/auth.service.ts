import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly SESSION_KEY = 'clgbites_admin_auth';
  readonly isLoggedIn = signal(false);

  constructor() {
    // Restore session from sessionStorage (cleared when tab closes)
    const stored = sessionStorage.getItem(this.SESSION_KEY);
    if (stored === 'true') this.isLoggedIn.set(true);
  }

  login(password: string): boolean {
    if (password === environment.adminPassword) {
      this.isLoggedIn.set(true);
      sessionStorage.setItem(this.SESSION_KEY, 'true');
      return true;
    }
    return false;
  }

  logout(): void {
    this.isLoggedIn.set(false);
    sessionStorage.removeItem(this.SESSION_KEY);
  }
}
