import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="min-height:100vh;background:#fffbf5;padding-bottom:5rem;font-family:inherit;">

      <!-- Header -->
      <div class="orders-header">
        <button class="back-btn" (click)="goBack()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <h1 class="orders-title">📦 My Orders</h1>
          <p class="orders-sub" *ngIf="!isLoading()">{{ orders().length }} order{{ orders().length !== 1 ? 's' : '' }} found</p>
          <p class="orders-sub" *ngIf="isLoading()">Loading your orders...</p>
        </div>
        <button class="refresh-btn" (click)="loadOrders()" [disabled]="isLoading()">🔄</button>
      </div>

      <!-- Loading state -->
      <div *ngIf="isLoading()" class="loading-state">
        <div class="loading-spinner">⏳</div>
        <p>Fetching your orders...</p>
      </div>

      <!-- Empty state -->
      <div *ngIf="!isLoading() && orders().length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <h2>No orders yet</h2>
        <p>Place your first order to see it here</p>
        <button class="browse-btn" (click)="goHome()">Browse Restaurants</button>
      </div>

      <!-- Orders list -->
      <div *ngIf="!isLoading() && orders().length > 0" class="orders-list">
        <div *ngFor="let order of orders()" class="order-card">
          <!-- Token + Status -->
          <div class="order-card-header">
            <div class="order-token">
              <span class="token-num">#{{ pad(order.token_number ?? order.id) }}</span>
              <span class="order-id-label">Token</span>
            </div>
            <span class="order-status" [class.status-delivered]="order.deliver_status === 'delivered'" [class.status-pending]="order.deliver_status !== 'delivered'">
              {{ order.deliver_status === 'delivered' ? '✅ Delivered' : '🔄 Pending' }}
            </span>
          </div>

          <!-- Items preview -->
          <div class="order-items-preview">
            <p class="items-text">{{ getItemsPreview(order.items) }}</p>
            <p class="items-count">{{ getTotalItems(order.items) }} item{{ getTotalItems(order.items) !== 1 ? 's' : '' }}</p>
          </div>

          <!-- Meta row -->
          <div class="order-meta">
            <div class="meta-item">
              <span class="meta-icon">💳</span>
              <span>{{ order.payment_mode === 'cod' ? 'Cash on Delivery' : 'Prepaid' }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-icon">💰</span>
              <span class="meta-total">₹{{ order.total }}</span>
            </div>
          </div>

          <!-- Pay status badge -->
          <div class="pay-badge-row">
            <span class="pay-badge" [class.pay-paid]="order.pay_status === 'paid'" [class.pay-pending]="order.pay_status !== 'paid'">
              {{ order.pay_status === 'paid' ? '✅ Paid' : '⏳ Payment Pending' }}
            </span>
            <span class="order-date">{{ formatDate(order.created_at) }}</span>
          </div>
        </div>
      </div>

      <!-- Back to home FAB -->
      <div class="fab-wrap">
        <button class="fab-btn" (click)="goHome()">🏠 Home</button>
      </div>
    </div>
  `,
  styles: [`
    .orders-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: white;
      border-bottom: 1px solid #fed7aa;
      padding: 1.25rem 1rem;
    }
    .back-btn {
      width: 2.25rem;
      height: 2.25rem;
      background: #fff7ed;
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #ea580c;
      flex-shrink: 0;
    }
    .orders-title { font-size: 1.1rem; font-weight: 900; color: #111827; margin: 0 0 0.1rem; }
    .orders-sub { font-size: 0.75rem; color: #9ca3af; margin: 0; }
    .refresh-btn {
      margin-left: auto;
      background: #fff7ed;
      border: none;
      border-radius: 50%;
      width: 2.25rem;
      height: 2.25rem;
      font-size: 1rem;
      cursor: pointer;
      flex-shrink: 0;
    }
    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      gap: 0.5rem;
      color: #9ca3af;
    }
    .loading-spinner, .empty-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .empty-state h2 { font-size: 1.1rem; font-weight: 800; color: #374151; margin: 0; }
    .empty-state p { font-size: 0.85rem; margin: 0; }
    .browse-btn {
      margin-top: 1rem;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      border: none;
      border-radius: 2rem;
      padding: 0.75rem 2rem;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      font-family: inherit;
    }
    .orders-list {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .order-card {
      background: white;
      border-radius: 1.25rem;
      border: 1px solid #fed7aa;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .order-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #fff7ed;
    }
    .order-token {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }
    .token-num {
      font-size: 1.1rem;
      font-weight: 900;
      color: #ea580c;
      font-family: monospace;
    }
    .order-id-label { font-size: 0.7rem; color: #9ca3af; font-weight: 600; }
    .order-status {
      font-size: 0.78rem;
      font-weight: 800;
      padding: 0.35rem 0.75rem;
      border-radius: 2rem;
    }
    .status-delivered { background: #dcfce7; color: #16a34a; }
    .status-pending { background: #fff7ed; color: #ea580c; }
    .order-items-preview { padding: 0.75rem 1rem 0; }
    .items-text {
      font-size: 0.85rem;
      font-weight: 700;
      color: #374151;
      margin: 0 0 0.2rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .items-count { font-size: 0.75rem; color: #9ca3af; margin: 0; }
    .order-meta {
      display: flex;
      gap: 1rem;
      padding: 0.5rem 1rem;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.78rem;
      color: #6b7280;
      font-weight: 600;
    }
    .meta-total { font-weight: 900; color: #111827; }
    .pay-badge-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem 0.875rem;
    }
    .pay-badge {
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.6rem;
      border-radius: 2rem;
    }
    .pay-paid { background: #dcfce7; color: #16a34a; }
    .pay-pending { background: #fef9c3; color: #854d0e; }
    .order-date { font-size: 0.7rem; color: #9ca3af; }
    .fab-wrap {
      position: fixed;
      bottom: 1.5rem;
      right: 1rem;
    }
    .fab-btn {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white;
      border: none;
      border-radius: 2rem;
      padding: 0.75rem 1.25rem;
      font-weight: 800;
      font-size: 0.88rem;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 4px 16px rgba(249,115,22,0.35);
    }
  `]
})
export class MyOrdersComponent implements OnInit {
  private userService = inject(UserService);
  private router = inject(Router);

  orders = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit(): void {
    if (!this.userService.currentUser()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadOrders();
  }

  async loadOrders(): Promise<void> {
    this.isLoading.set(true);
    const result = await this.userService.fetchMyOrders();
    this.orders.set(result);
    this.isLoading.set(false);
  }

  pad(n: number | undefined): string {
    return String(n ?? '?').padStart(3, '0');
  }

  getItemsPreview(items: any[]): string {
    if (!items?.length) return 'No items';
    const names = items.slice(0, 2).map(i => i.name);
    const more = items.length > 2 ? ` +${items.length - 2} more` : '';
    return names.join(', ') + more;
  }

  getTotalItems(items: any[]): number {
    if (!items?.length) return 0;
    return items.reduce((s: number, i: any) => s + (i.qty ?? 1), 0);
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
    return `${d.getDate()} ${months[d.getMonth()]} · ${String(h).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${ap}`;
  }

  goBack(): void { this.router.navigate(['/']); }
  goHome(): void { this.router.navigate(['/']); }
}
