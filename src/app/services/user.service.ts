import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface UserProfile {
  id?: number;
  name: string;
  phone: string;
  location: string;
  created_at?: string;
}

const SESSION_KEY = 'clgbites_user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly sb = inject(SupabaseService);
  readonly currentUser = signal<UserProfile | null>(null);

  constructor() {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      try { this.currentUser.set(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }

  /**
   * Login or register:
   * - Looks up user by name + phone + location in `users` table.
   * - If found, returns the existing profile.
   * - If not found, inserts a new row and returns it.
   */
  async loginOrRegister(name: string, phone: string, location: string): Promise<UserProfile | null> {
    const trimName = name.trim();
    try {
      // 1. Check if user already exists
      const { data: existing, error: fetchErr } = await this.sb.client
        .from('users')
        .select('*')
        .eq('name', trimName)
        .eq('phone', phone)
        .eq('location', location)
        .maybeSingle();

      if (fetchErr) {
        console.error('loginOrRegister fetch error', fetchErr);
        // Fall through: treat as new user if table doesn't exist yet
      }

      let profile: UserProfile;

      if (existing) {
        // Returning user
        profile = existing as UserProfile;
      } else {
        // New user — insert
        const { data: inserted, error: insertErr } = await this.sb.client
          .from('users')
          .insert([{ name: trimName, phone, location }])
          .select()
          .single();

        if (insertErr) {
          console.error('loginOrRegister insert error', insertErr);
          // Return a local-only profile so flow doesn't break
          profile = { name: trimName, phone, location };
        } else {
          profile = inserted as UserProfile;
        }
      }

      // Persist to sessionStorage for page refreshes
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      this.currentUser.set(profile);
      return profile;
    } catch (e) {
      console.error('loginOrRegister unexpected error', e);
      // Offline/error fallback — still let user in
      const profile: UserProfile = { name: trimName, phone, location };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(profile));
      this.currentUser.set(profile);
      return profile;
    }
  }

  logout(): void {
    this.currentUser.set(null);
    sessionStorage.removeItem(SESSION_KEY);
  }

  /** Fetch orders for the current user from the orders table */
  async fetchUserOrders(phone: string): Promise<any[]> {
    const { data, error } = await this.sb.client
      .from('orders')
      .select('*')
      .eq('customer_phone', phone)
      .order('created_at', { ascending: false });
    if (error) { console.error('fetchUserOrders error', error); return []; }
    return data ?? [];
  }
}
