import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { AdminService } from '../../services/admin.service';
import {
  isOrderingAllowed,
  isFoodCornerOrderingAllowed,
} from '../../services/time-utils';
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
          <span *ngIf="item.isStudentChoice" class="popular-badge">⭐ Popular</span>
          <span *ngIf="!itemAvailable" class="unavail-badge">Unavailable</span>
        </div>
        <p class="item-price">₹{{ adminService.getItemPrice(restaurant.id, item.name, item.price) }}</p>
        <p *ngIf="quantity() > 0" class="delivery-hint">+₹10 delivery per item</p>
        <p *ngIf="disabledReason" class="disabled-hint">{{ disabledReason.message }}</p>
      </div>
      <div style="flex-shrink:0;">
        <div *ngIf="!canOrder" class="disabled-badge">
          <span>🕐</span> {{ disabledReason?.shortMessage || 'Closed' }}
        </div>
        <div *ngIf="canOrder && quantity() > 0" class="qty-control">
          <button class="qty-btn" (click)="decrement()">−</button>
          <span class="qty-num">{{ quantity() }}</span>
          <button class="qty-btn" (click)="increment()">+</button>
        </div>
        <button *ngIf="canOrder && quantity() === 0" class="add-btn btn-press" (click)="add()">Add</button>
      </div>
    </div>
  `,
  styles: [`
    .item-card { display:flex; align-items:center; justify-content:space-between; border-radius:0.75rem; background:var(--card); padding:0.75rem; box-shadow:0 1px 2px rgba(0,0,0,0.05); transition:box-shadow 0.2s; }
    .item-card:hover { box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); }
    .unavailable-card { opacity:0.55; }
    .item-info { flex:1; padding-right:0.75rem; }
    .item-name { font-weight:500; color:var(--card-foreground); font-size:0.95rem; }
    .popular-badge { display:inline-flex; align-items:center; gap:0.25rem; border-radius:9999px; background:#fef3c7; padding:0.125rem 0.5rem; font-size:0.7rem; font-weight:500; color:#b45309; }
    .unavail-badge { display:inline-flex; border-radius:9999px; background:#fee2e2; padding:0.125rem 0.5rem; font-size:0.7rem; font-weight:600; color:#dc2626; }
    .item-price { margin-top:0.25rem; font-size:0.875rem; font-weight:600; color:var(--primary); }
    .delivery-hint { margin-top:0.25rem; font-size:0.75rem; color:var(--primary); font-weight:500; }
    .disabled-hint { margin-top:0.25rem; font-size:0.75rem; color:var(--muted-foreground); }
    .disabled-badge { display:flex; align-items:center; gap:0.375rem; border-radius:0.5rem; background:var(--muted); padding:0.5rem 0.75rem; font-size:0.75rem; font-weight:500; color:var(--muted-foreground); }
    .qty-control { display:flex; align-items:center; gap:0.5rem; border-radius:9999px; background:rgba(232,84,108,0.1); padding:0 0.25rem; }
    .qty-btn { display:flex; align-items:center; justify-content:center; width:2rem; height:2rem; border-radius:50%; border:none; cursor:pointer; background:transparent; color:var(--primary); font-size:1.1rem; transition:background 0.2s; }
    .qty-btn:hover { background:rgba(232,84,108,0.2); }
    .qty-num { min-width:1.5rem; text-align:center; font-size:0.875rem; font-weight:600; color:var(--primary); }
    .add-btn { border-radius:0.5rem; background:var(--primary); padding:0.5rem 1.25rem; font-size:0.875rem; font-weight:600; color:var(--primary-foreground); border:none; cursor:pointer; transition:box-shadow 0.2s,transform 0.15s; }
    .add-btn:hover { box-shadow:0 4px 6px -1px rgba(0,0,0,0.15); }
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
  // get canOrder(): boolean { return this.orderingAllowed && this.itemAvailable && this.adminService.isOrdersAccepting() && (!this.isFoodCorner || this.foodCornerAllowed); }
  get canOrder(): boolean { 
  const adminOverride = this.adminService.isOrdersAccepting();
  const timeAllowed = this.orderingAllowed || adminOverride;
  const foodCornerAllowed = this.foodCornerAllowed || adminOverride;
  return timeAllowed && 
    this.itemAvailable && 
    adminOverride && 
    this.adminService.isRestaurantAvailable(this.restaurant.id) &&
    (!this.isFoodCorner || foodCornerAllowed); 
}

  get disabledReason(): { message: string; shortMessage: string } | null {
    if (!this.itemAvailable) return { message: 'Not available today', shortMessage: 'Unavailable' };
    if (!this.adminService.isOrdersAccepting()) return { message: this.adminService.settings().orders_off_message, shortMessage: 'Closed' };
    if (!this.orderingAllowed) return { message: 'Online orders closed after 6 PM', shortMessage: 'Closed' };
    if (this.isFoodCorner && !this.foodCornerAllowed) return { message: 'Food Corner closed after 5:30 PM on these days.', shortMessage: 'Closed' };
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
