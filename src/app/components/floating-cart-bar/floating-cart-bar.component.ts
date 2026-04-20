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
      <button class="cart-bar" (click)="goToCart()">
        <span class="cart-bar-left">
          <span class="cart-count-pill">{{ totalItems() }} items</span>
          <span class="cart-label">View Order</span>
        </span>
        <span class="cart-total">₹{{ totalAmount() }}</span>
      </button>
    </div>
  `,
  styles: [`
    .cart-bar-wrapper {
      position: fixed; bottom: 1rem; left: 1rem; right: 1rem;
      z-index: 50;
      animation: slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes slideUp {
      from { transform: translateY(80px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .cart-bar {
      display: flex; width: 100%; align-items: center;
      justify-content: space-between;
      border-radius: 1rem;
      background: linear-gradient(135deg, #f97316, #ea580c);
      padding: 1rem 1.25rem; border: none; cursor: pointer;
      box-shadow: 0 8px 24px rgba(249,115,22,0.4);
      transition: transform 0.2s;
    }
    .cart-bar:active { transform: scale(0.98); }
    .cart-bar-left { display: flex; align-items: center; gap: 0.75rem; }
    .cart-count-pill {
      background: rgba(255,255,255,0.2); color: white;
      font-size: 0.8rem; font-weight: 800;
      padding: 0.3rem 0.75rem; border-radius: 0.5rem;
    }
    .cart-label { color: white; font-size: 0.9rem; font-weight: 700; }
    .cart-total { color: white; font-size: 1rem; font-weight: 900; }
  `]
})
export class FloatingCartBarComponent {
  readonly totalItems = this.cartService.totalItems;
  readonly totalAmount = this.cartService.totalAmount;
  readonly restaurantCount = computed(() => this.cartService.getRestaurantNames().length);

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService
  ) {}

  goToCart(): void { this.router.navigate(['/cart']); }
}