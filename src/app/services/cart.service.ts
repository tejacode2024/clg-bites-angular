import { Injectable, computed, signal } from '@angular/core';
import type { MenuItem, Restaurant } from './restaurants';
import { calculateDeliveryCharges } from './time-utils';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSignal = signal<CartItem[]>([]);

  readonly items = this.itemsSignal.asReadonly();

  readonly totalItems = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly totalAmount = computed(() =>
    this.itemsSignal().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  readonly deliveryCharges = computed(() =>
    calculateDeliveryCharges(this.totalItems())
  );

  readonly finalTotal = computed(() => this.totalAmount() + this.deliveryCharges());

  private generateItemId(name: string, restaurantId: string): string {
    return `${restaurantId}-${name.toLowerCase().replace(/\s+/g, '-')}`;
  }

  addItem(item: MenuItem, restaurant: Restaurant): void {
    const itemId = this.generateItemId(item.name, restaurant.id);
    this.itemsSignal.update((prev) => {
      const existing = prev.find((i) => i.id === itemId);
      if (existing) {
        return prev.map((i) =>
          i.id === itemId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          id: itemId,
          name: item.name,
          price: item.price,
          quantity: 1,
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
        },
      ];
    });
  }

  removeItem(itemId: string): void {
    this.itemsSignal.update((prev) => prev.filter((i) => i.id !== itemId));
  }

  updateQuantity(itemId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(itemId);
      return;
    }
    this.itemsSignal.update((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, quantity } : i))
    );
  }

  getItemQuantity(itemName: string, restaurantId: string): number {
    const itemId = this.generateItemId(itemName, restaurantId);
    const item = this.itemsSignal().find((i) => i.id === itemId);
    return item?.quantity || 0;
  }

  clearCart(): void {
    this.itemsSignal.set([]);
  }

  getItemsByRestaurant(): Record<string, CartItem[]> {
    return this.itemsSignal().reduce(
      (acc, item) => {
        if (!acc[item.restaurantId]) acc[item.restaurantId] = [];
        acc[item.restaurantId].push(item);
        return acc;
      },
      {} as Record<string, CartItem[]>
    );
  }

  getRestaurantNames(): string[] {
    const names = new Set(this.itemsSignal().map((item) => item.restaurantName));
    return Array.from(names);
  }
}
