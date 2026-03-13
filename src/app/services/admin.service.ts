import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Coupon {
  id?: string;
  code: string;
  type: 'percent' | 'flat';
  value: number;
  min_order: number;
  active: boolean;
  description: string;
}

export interface AdminSettings {
  orders_accepting: boolean;
  orders_off_message: string;
  unavailable_restaurants: string[];
  unavailable_items: Record<string, string[]>;
  delivery_time: string;
  price_overrides: Record<string, number>;
}

const DEFAULT_SETTINGS: AdminSettings = {
  orders_accepting: true,
  orders_off_message: 'Orders are currently closed. Please check back later.',
  unavailable_restaurants: [],
  unavailable_items: {},
  delivery_time: '7:30-8:30',
};

@Injectable({ providedIn: 'root' })
export class AdminService implements OnDestroy {
  private readonly sb = inject(SupabaseService);
  private channel: RealtimeChannel | null = null;

  readonly settings = signal<AdminSettings>(DEFAULT_SETTINGS);
  readonly coupons = signal<Coupon[]>([]);
  readonly loading = signal(true);

  constructor() {
    this.loadSettings();
    this.loadCoupons();
    this.subscribeRealtime();
  }

  // ─── Load settings from Supabase ────────────────────────────
  async loadSettings(): Promise<void> {
    const { data, error } = await this.sb.client
      .from('admin_settings')
      .select('*')
      .eq('id', 1)
      .single();
      

    if (error || !data) {
      // Row doesn't exist yet — insert defaults
      await this.sb.client.from('admin_settings').upsert({ id: 1, ...DEFAULT_SETTINGS });
      this.settings.set(DEFAULT_SETTINGS);
    } else {
      this.settings.set({
        orders_accepting: data.orders_accepting ?? true,
        orders_off_message: data.orders_off_message ?? DEFAULT_SETTINGS.orders_off_message,
        unavailable_restaurants: data.unavailable_restaurants ?? [],
        unavailable_items: data.unavailable_items ?? {},
        delivery_time: data.delivery_time ?? '7:30-8:30',
      });
    }
    this.loading.set(false);
  }


  async setDeliveryTime(time: string): Promise<void> {
  await this.updateSettings({ delivery_time: time });
  this.settings.update(s => ({ ...s, delivery_time: time }));
}
  // ─── Real-time subscription ──────────────────────────────────
  private subscribeRealtime(): void {
    this.channel = this.sb.client
      .channel('admin-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'admin_settings' },
        (payload) => {
          if (payload.new) {
            const d = payload.new as any;
            this.settings.set({
              orders_accepting: d.orders_accepting ?? true,
              orders_off_message: d.orders_off_message ?? DEFAULT_SETTINGS.orders_off_message,
              unavailable_restaurants: d.unavailable_restaurants ?? [],
              unavailable_items: d.unavailable_items ?? {},
              delivery_time: d.delivery_time ?? '7:30-8:30',
            });
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'coupons' },
        () => this.loadCoupons()
      )
      .subscribe();
  }

  // ─── Load coupons ────────────────────────────────────────────
  async loadCoupons(): Promise<void> {
    const { data } = await this.sb.client.from('coupons').select('*').order('created_at', { ascending: false });
    this.coupons.set((data as Coupon[]) ?? []);
  }

  // ─── Update settings helper ──────────────────────────────────
  private async updateSettings(patch: Partial<AdminSettings>): Promise<void> {
    await this.sb.client.from('admin_settings').update(patch).eq('id', 1);
  }

  // ─── Admin: toggle global orders ────────────────────────────
  async setOrdersAccepting(value: boolean): Promise<void> {
    await this.updateSettings({ orders_accepting: value });
    this.settings.update(s => ({ ...s, orders_accepting: value }));
  }

  async setOrdersOffMessage(message: string): Promise<void> {
    await this.updateSettings({ orders_off_message: message });
    this.settings.update(s => ({ ...s, orders_off_message: message }));
  }

  // ─── Admin: restaurant availability ─────────────────────────
  async setRestaurantAvailability(restaurantId: string, available: boolean): Promise<void> {
    const current = [...this.settings().unavailable_restaurants];
    const updated = available
      ? current.filter(id => id !== restaurantId)
      : current.includes(restaurantId) ? current : [...current, restaurantId];
    await this.updateSettings({ unavailable_restaurants: updated });
    this.settings.update(s => ({ ...s, unavailable_restaurants: updated }));
  }

  // ─── Admin: item availability ────────────────────────────────
  async setItemAvailability(restaurantId: string, itemName: string, available: boolean): Promise<void> {
    const current = { ...this.settings().unavailable_items };
    const items = current[restaurantId] ?? [];
    if (!available) {
      current[restaurantId] = items.includes(itemName) ? items : [...items, itemName];
    } else {
      current[restaurantId] = items.filter(i => i !== itemName);
      if (current[restaurantId].length === 0) delete current[restaurantId];
    }
    await this.updateSettings({ unavailable_items: current });
    this.settings.update(s => ({ ...s, unavailable_items: current }));
  }

  // ─── Admin: coupons ──────────────────────────────────────────
  async addCoupon(coupon: Omit<Coupon, 'id'>): Promise<void> {
    await this.sb.client.from('coupons').insert(coupon);
    await this.loadCoupons();
  }

  async updateCoupon(id: string, data: Partial<Coupon>): Promise<void> {
    await this.sb.client.from('coupons').update(data).eq('id', id);
    await this.loadCoupons();
  }

  async deleteCoupon(id: string): Promise<void> {
    await this.sb.client.from('coupons').delete().eq('id', id);
    await this.loadCoupons();
  }

  // ─── Customer helpers ────────────────────────────────────────
  isOrdersAccepting(): boolean { return this.settings().orders_accepting; }
  isRestaurantAvailable(id: string): boolean { return !this.settings().unavailable_restaurants.includes(id); }
  isItemAvailable(restaurantId: string, itemName: string): boolean {
    return !(this.settings().unavailable_items[restaurantId] ?? []).includes(itemName);
  }

  validateCoupon(code: string, orderTotal: number): Coupon | null {
    const coupon = this.coupons().find(c => c.code.toLowerCase() === code.toLowerCase() && c.active);
    if (!coupon || orderTotal < coupon.min_order) return null;
    return coupon;
  }

  ngOnDestroy(): void {
    this.channel?.unsubscribe();
  }

getItemPrice(restaurantId: string, itemName: string, originalPrice: number): number {
  const key = `${restaurantId}::${itemName}`;
  const overrides = this.settings().price_overrides || {};
  return overrides[key] ?? originalPrice;
}

async setItemPrice(restaurantId: string, itemName: string, price: number): Promise<void> {
  const key = `${restaurantId}::${itemName}`;
  const overrides = { ...this.settings().price_overrides } || {};
  overrides[key] = price;
  await this.supabase.client
    .from('admin_settings')
    .update({ price_overrides: overrides })
    .eq('id', 1);
}

async resetItemPrice(restaurantId: string, itemName: string): Promise<void> {
  const key = `${restaurantId}::${itemName}`;
  const overrides = { ...this.settings().price_overrides } || {};
  delete overrides[key];
  await this.supabase.client
    .from('admin_settings')
    .update({ price_overrides: overrides })
    .eq('id', 1);
}
