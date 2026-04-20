import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { AdminService } from '../../services/admin.service';
import { isOrderingAllowed, isFoodCornerOrderingAllowed } from '../../services/time-utils';
import type { MenuItem, Restaurant } from '../../services/restaurants';

@Component({
  selector: 'app-menu-item-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="item-card" [class.unavailable-card]="!itemAvailable">
      <div class="item-info">
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
          <h3 class="item-name">{{ item.name }}</h3>
          <span *ngIf="item.isStudentChoice" class="popular-badge">⭐ Student Pick</span>
          <span *ngIf="!itemAvailable" class="unavail-badge">Unavailable</span>
        </div>
        <p class="item-price">₹{{ item.price }}</p>
        <p *ngIf="disabledReason" class="disabled-hint">{{ disabledReason.message }}</p>
      </div>
      <div style="flex-shrink:0;">
        <div *ngIf="!canOrder" class="disabled-badge">
          🕐 {{ disabledReason?.shortMessage || 'Closed' }}
        </div>
        <div *ngIf="canOrder && quantity() > 0" class="qty-control">
          <button class="qty-btn minus-btn" (click)="decrement()">−</button>
          <span class="qty-num">{{ quantity() }}</span>
          <button class="qty-btn plus-btn" (click)="increment()">+</button>
        </div>
        <button *ngIf="canOrder && quantity() === 0" class="add-btn btn-press" (click)="add()">Add</button>
      </div>
    </div>
  `,
  styles: [`
    .item-card {
      display: flex; align-items: center; justify-content: space-between;
      border-radius: 0.875rem; background: white; padding: 0.875rem 1rem;
      border: 1px solid #fde8c8; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
      transition: box-shadow 0.2s;
    }
    .item-card:hover { box-shadow: 0 4px 12px rgba(249,115,22,0.08); }
    .unavailable-card { opacity: 0.55; }
    .item-info { flex: 1; padding-right: 0.875rem; }
    .item-name { font-weight: 600; color: #1f2937; font-size: 0.875rem; line-height: 1.3; }
    .popular-badge { display: inline-flex; align-items: center; border-radius: 9999px; background: #fffbeb; border: 1px solid #fde68a; padding: 0.1rem 0.5rem; font-size: 0.68rem; font-weight: 600; color: #b45309; }
    .unavail-badge { display: inline-flex; border-radius: 9999px; background: #fee2e2; padding: 0.1rem 0.5rem; font-size: 0.68rem; font-weight: 600; color: #dc2626; }
    .item-price { margin-top: 0.25rem; font-size: 0.875rem; font-weight: 900; color: #f97316; }
    .disabled-hint { margin-top: 0.25rem; font-size: 0.72rem; color: #9ca3af; }
    .disabled-badge { display: flex; align-items: center; gap: 0.25rem; border-radius: 0.5rem; background: #f3f4f6; padding: 0.45rem 0.75rem; font-size: 0.75rem; font-weight: 600; color: #6b7280; }
    .qty-control { display: flex; align-items: center; gap: 0.375rem; }
    .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; transition: transform 0.15s; }
    .qty-btn:active { transform: scale(0.9); }
    .minus-btn { background: #fff7ed; border: 1.5px solid #fed7aa; color: #f97316; }
    .plus-btn { background: linear-gradient(135deg, #f97316, #ea580c); color: white; }
    .qty-num { min-width: 20px; text-align: center; font-size: 0.875rem; font-weight: 900; color: #1f2937; }
    .add-btn {
      border-radius: 0.625rem; background: linear-gradient(135deg, #f97316, #ea580c);
      padding: 0.45rem 1.1rem; font-size: 0.85rem; font-weight: 700;
      color: white; border: none; cursor: pointer;
      box-shadow: 0 2px 8px rgba(249,115,22,0.3); transition: transform 0.15s;
    }
    .add-btn:active { transform: scale(0.95); }
  `]
})
export class MenuItemCardComponent implements OnInit, OnDestroy {
  @Input() item!: MenuItem;
  @Input() restaurant!: Restaurant;

  readonly cartService = inject(CartService);
  readonly adminService = inject(AdminService);

  orderingAllowed = true;
  foodCornerAllowed = true;
  private timerRef: any;

  get itemAvailable(): boolean { return this.adminService.isItemAvailable(this.restaurant.id, this.item.name); }
  get isFoodCorner(): boolean { return this.restaurant.id === 'food-corner'; }
  get canOrder(): boolean {
    const adminOverride = this.adminService.isOrdersAccepting();
    const timeAllowed = this.orderingAllowed || adminOverride;
    const fcAllowed = this.foodCornerAllowed || adminOverride;
    return timeAllowed && this.itemAvailable && adminOverride &&
      this.adminService.isRestaurantAvailable(this.restaurant.id) &&
      (!this.isFoodCorner || fcAllowed);
  }

  get disabledReason(): { message: string; shortMessage: string } | null {
    if (!this.itemAvailable) return { message: 'Not available today', shortMessage: 'Unavailable' };
    if (!this.adminService.isOrdersAccepting()) return { message: this.adminService.settings().orders_off_message, shortMessage: 'Closed' };
    if (!this.orderingAllowed) return { message: 'Online orders closed after 6 PM', shortMessage: 'Closed' };
    if (this.isFoodCorner && !this.foodCornerAllowed) return { message: 'Food Corner closed after 5:30 PM.', shortMessage: 'Closed' };
    return null;
  }

  quantity() { return this.cartService.getItemQuantity(this.item.name, this.restaurant.id); }
  get itemId(): string { return `${this.restaurant.id}-${this.item.name.toLowerCase().replace(/\s+/g, '-')}`; }

  ngOnInit(): void { this.checkTime(); this.timerRef = setInterval(() => this.checkTime(), 60000); }
  ngOnDestroy(): void { if (this.timerRef) clearInterval(this.timerRef); }
  private checkTime(): void { this.orderingAllowed = isOrderingAllowed(); this.foodCornerAllowed = isFoodCornerOrderingAllowed(); }

  add(): void { this.cartService.addItem(this.item, this.restaurant); }
  increment(): void { this.cartService.updateQuantity(this.itemId, this.quantity() + 1); }
  decrement(): void { this.cartService.updateQuantity(this.itemId, this.quantity() - 1); }
}