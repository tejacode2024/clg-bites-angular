import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-floating-cart-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="totalItems() > 0" class="cart-bar-wrapper">
      <button class="cart-bar glow-primary" (click)="goToCart()">
        <div style="display:flex; align-items:center; gap:0.75rem;">
          <div style="position:relative;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
              viewBox="0 0 24 24" stroke="white" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span class="badge pulse-badge">{{ totalItems() }}</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-start;">
            <span style="font-size:0.875rem;font-weight:500;color:white;">
              {{ totalItems() }} {{ totalItems() === 1 ? 'item' : 'items' }} added
            </span>
            <span *ngIf="restaurantCount() > 0"
              style="font-size:0.75rem;color:rgba(255,255,255,0.7);">
              from {{ restaurantCount() }} {{ restaurantCount() === 1 ? 'restaurant' : 'restaurants' }}
            </span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span style="font-size:1.125rem;font-weight:700;color:white;">₹{{ totalAmount() }}</span>
          <span class="view-cart-btn">
            View Cart
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
              viewBox="0 0 24 24" stroke="white" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </span>
        </div>
      </button>
      <div style="margin-top:0.5rem;text-align:center;">
        <span class="delivery-badge">
          <span class="dot"></span>
          ₹{{ deliveryCharges() }} delivery
        </span>
      </div>
    </div>
  `,
  styles: [`
    .cart-bar-wrapper {
      position: fixed; bottom: 1rem; left: 1rem; right: 1rem;
      z-index: 50; margin: 0 auto; max-width: 32rem;
      animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes slideUp {
      from { transform: translateY(100px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .cart-bar {
      display: flex; width: 100%; align-items: center;
      justify-content: space-between;
      border-radius: 1rem; background: var(--primary);
      padding: 1rem 1.25rem; border: none; cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cart-bar:hover { transform: scale(1.02); }
    .cart-bar:active { transform: scale(0.98); }
    .badge {
      position: absolute; right: -8px; top: -8px;
      display: flex; align-items: center; justify-content: center;
      width: 1.25rem; height: 1.25rem; border-radius: 50%;
      background: white; color: var(--primary);
      font-size: 0.65rem; font-weight: 700;
    }
    .view-cart-btn {
      display: flex; align-items: center; gap: 0.25rem;
      background: rgba(255,255,255,0.2); border-radius: 0.5rem;
      padding: 0.375rem 0.75rem; font-size: 0.875rem;
      font-weight: 600; color: white;
    }
    .delivery-badge {
      display: inline-flex; align-items: center; gap: 0.375rem;
      border-radius: 9999px; background: #dcfce7;
      padding: 0.25rem 0.75rem; font-size: 0.75rem;
      font-weight: 500; color: #16a34a;
    }
    .dot {
      display: inline-block; width: 0.375rem; height: 0.375rem;
      border-radius: 50%; background: #22c55e;
    }
  `]
})
export class FloatingCartBarComponent {
  readonly totalItems = this.cartService.totalItems;
  readonly totalAmount = this.cartService.totalAmount;
  readonly deliveryCharges = this.cartService.deliveryCharges;
  readonly restaurantCount = computed(() => this.cartService.getRestaurantNames().length);

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService
  ) {}

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}