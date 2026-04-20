import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient;

  constructor() {
    this.client = createClient(
      environment.supabase.url,
      environment.supabase.anonKey,
      {
        auth: {
          // Disable the Navigator LockManager — it tries to acquire an
          // exclusive tab lock for auth-token writes and throws
          // NavigatorLockAcquireTimeoutError on mobile/PWA/some browsers.
          // Since this app uses its own sessionStorage auth (AuthService),
          // Supabase auth storage locking is not needed at all.
          lock: undefined,

          // Persist session in localStorage so it survives page reloads
          // without fighting over the Navigator lock.
          persistSession: true,

          // Don't auto-refresh tokens — the app uses its own admin auth,
          // so Supabase auth calls should be minimal.
          autoRefreshToken: false,

          // Don't listen to auth state changes from other tabs.
          detectSessionInUrl: false,
        }
      }
    );
  }
}