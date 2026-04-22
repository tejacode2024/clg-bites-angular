import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

// This header is now a minimal top-bar used ONLY on non-home pages (restaurant, cart, admin).
// The home page has its own inline header as part of the new UI.
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <button class="back-btn" (click)="goHome()" aria-label="Back to home">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1 class="logo-text">CLG<span>BITES</span></h1>
      <button class="icon-btn" (click)="goToCart()" aria-label="Open cart">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span *ngIf="totalItems() > 0" class="cart-badge">
          {{ totalItems() > 9 ? '9+' : totalItems() }}
        </span>
      </button>
    </header>
  `,
  styles: [`
    .app-header {
      position: sticky; top: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      background: #f97316;
      padding: 0.75rem 1rem;
      box-shadow: 0 2px 12px rgba(249,115,22,0.3);
    }
    .logo-text {
      font-size: 1.125rem; font-weight: 900;
      color: white; letter-spacing: -0.02em;
    }
    .logo-text span { color: rgba(255,255,255,0.75); }
    .back-btn {
      border: none; background: rgba(255,255,255,0.2); cursor: pointer;
      border-radius: 50%; width: 2rem; height: 2rem;
      display: flex; align-items: center; justify-content: center;
    }
    .icon-btn {
      position: relative; border: none; background: rgba(255,255,255,0.2);
      cursor: pointer; border-radius: 50%; width: 2.25rem; height: 2.25rem;
      display: flex; align-items: center; justify-content: center;
    }
    .cart-badge {
      position: absolute; top: -4px; right: -4px;
      background: white; color: #f97316;
      font-size: 0.6rem; font-weight: 900;
      width: 16px; height: 16px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
    }
  `]
})
export class AppHeaderComponent {
  totalItems = this.cartService.totalItems;

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService
  ) {}

  goHome(): void { this.router.navigate(['/']); }
  goToCart(): void { this.router.navigate(['/cart']); }
}
