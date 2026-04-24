import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { UserService } from '../../services/user.service';
import { OrdersService } from '../../services/orders.service';

@Component({
  selector: 'app-order-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="confirm-screen">
      <!-- Success icon -->
      <div class="success-icon-wrap">
        <div class="success-icon">✅</div>
      </div>

      <h1 class="confirm-title">Order Placed!</h1>
      <p class="confirm-sub">Your order has been confirmed and sent to the restaurant.</p>

      <!-- Order Details Card -->
      <div class="confirm-card" *ngIf="order()">
        <div class="token-banner">
          <span class="token-label">Token Number</span>
          <span class="token-value">#{{ pad(order()!.token_number ?? order()!.id) }}</span>
        </div>

        <div class="confirm-rows">
          <div class="confirm-row">
            <span class="row-label">Order ID</span>
            <span class="row-val">{{ order()!.id }}</span>
          </div>
          <div class="confirm-row">
            <span class="row-label">Delivering To</span>
            <span class="row-val">{{ order()!.customer_phone }}</span>
          </div>
          <div class="confirm-row">
            <span class="row-label">Location</span>
            <span class="row-val">{{ userService.currentUser()?.location }}</span>
          </div>
          <div class="confirm-row">
            <span class="row-label">Payment</span>
            <span class="row-val">{{ order()!.payment_mode === 'cod' ? '💵 Cash on Delivery' : '📲 Prepaid (UPI)' }}</span>
          </div>
          <div class="confirm-row">
            <span class="row-label">Total</span>
            <span class="row-val total-amt">₹{{ order()!.total }}</span>
          </div>
        </div>

        <div class="eta-bar">
          🕐 Estimated delivery: 20–30 minutes
        </div>
      </div>

      <!-- Items Summary -->
      <div class="items-summary" *ngIf="order()?.items?.length">
        <p class="items-title">Items Ordered</p>
        <div *ngFor="let item of order()!.items" class="item-row">
          <span class="item-name">{{ item.name }}</span>
          <span class="item-meta">×{{ item.qty }}</span>
          <span *ngIf="item.restaurant_name" class="item-rest">{{ item.restaurant_name }}</span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="action-btns">
        <button class="secondary-btn" (click)="goOrders()">📦 My Orders</button>
        <button class="primary-btn" (click)="goHome()">🏠 Back to Home</button>
      </div>
    </div>
  `,
  styles: [`
    .confirm-screen {
      min-height: 100vh;
      background: linear-gradient(160deg, #f0fdf4 0%, #fff7ed 60%, #fff 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 1rem 6rem;
      font-family: inherit;
    }
    .success-icon-wrap {
      width: 6rem;
      height: 6rem;
      background: #dcfce7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: 0 4px 20px rgba(22,163,74,0.15);
    }
    .success-icon { font-size: 2.5rem; }
    .confirm-title {
      font-size: 1.75rem;
      font-weight: 900;
      color: #111827;
      margin: 0 0 0.4rem;
    }
    .confirm-sub {
      font-size: 0.85rem;
      color: #9ca3af;
      text-align: center;
      margin: 0 0 1.5rem;
    }
    .confirm-card {
      width: 100%;
      max-width: 420px;
      background: white;
      border-radius: 1.25rem;
      border: 1px solid #d1fae5;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(22,163,74,0.08);
      margin-bottom: 0.75rem;
    }
    .token-banner {
      background: linear-gradient(135deg, #16a34a, #059669);
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .token-label {
      color: rgba(255,255,255,0.85);
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .token-value {
      color: white;
      font-size: 1.5rem;
      font-weight: 900;
      font-family: monospace;
    }
    .confirm-rows { padding: 0.75rem 0; }
    .confirm-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 1.25rem;
    }
    .row-label { font-size: 0.8rem; color: #9ca3af; font-weight: 600; }
    .row-val { font-size: 0.85rem; font-weight: 700; color: #111827; }
    .total-amt { color: #16a34a; font-size: 1rem; font-weight: 900; }
    .eta-bar {
      background: #fff7ed;
      border-top: 1px solid #fed7aa;
      padding: 0.75rem 1.25rem;
      font-size: 0.82rem;
      color: #92400e;
      font-weight: 700;
    }
    .items-summary {
      width: 100%;
      max-width: 420px;
      background: white;
      border-radius: 1.25rem;
      border: 1px solid #fed7aa;
      padding: 1rem 1.25rem;
      margin-bottom: 1rem;
    }
    .items-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 0.75rem;
    }
    .item-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.3rem 0;
      border-bottom: 1px solid #fff7ed;
    }
    .item-row:last-child { border-bottom: none; }
    .item-name { flex: 1; font-size: 0.82rem; font-weight: 600; color: #374151; }
    .item-meta { font-size: 0.78rem; color: #9ca3af; }
    .item-rest { font-size: 0.72rem; color: #d97706; font-weight: 700; }
    .action-btns {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      padding: 1rem 1rem 1.5rem;
      background: rgba(255,255,255,0.96);
      backdrop-filter: blur(12px);
      border-top: 1px solid #fed7aa;
    }
    .secondary-btn {
      padding: 0.875rem;
      border-radius: 1rem;
      border: 2px solid #fed7aa;
      background: white;
      color: #f97316;
      font-weight: 800;
      font-size: 0.88rem;
      cursor: pointer;
      font-family: inherit;
    }
    .primary-btn {
      padding: 0.875rem;
      border-radius: 1rem;
      border: none;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      font-weight: 800;
      font-size: 0.88rem;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 4px 12px rgba(249,115,22,0.3);
    }
  `]
})
export class OrderConfirmComponent implements OnInit {
  private router = inject(Router);
  userService = inject(UserService);

  order = signal<any>(null);

  ngOnInit(): void {
    // Retrieve the last placed order from navigation state or sessionStorage
    const state = history.state;
    if (state?.order) {
      this.order.set(state.order);
      sessionStorage.setItem('clgbites_last_order', JSON.stringify(state.order));
    } else {
      const stored = sessionStorage.getItem('clgbites_last_order');
      if (stored) {
        try { this.order.set(JSON.parse(stored)); } catch { /* ignore */ }
      }
    }
  }

  pad(n: number | undefined): string {
    return String(n ?? '?').padStart(3, '0');
  }

  goHome(): void { this.router.navigate(['/']); }
  goOrders(): void { this.router.navigate(['/my-orders']); }
}
