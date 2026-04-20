import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Navbar -->
    <header class="app-header">
      <button class="icon-btn" (click)="openDrawer()" type="button" aria-label="Open menu">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <span class="logo-text">CLGBITES</span>

      <button class="icon-btn cart-icon-btn" (click)="goToCart()" type="button" aria-label="Open cart">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        <span *ngIf="totalItems() > 0" class="cart-badge">
          {{ totalItems() > 9 ? '9+' : totalItems() }}
        </span>
      </button>
    </header>

    <!-- Slim info bar -->
    <div class="info-bar" *ngIf="hasInfo">
      <div class="info-pills">
        <span *ngIf="!adminService.isOrdersAccepting()" class="info-pill pill-warn">
          <span class="pill-dot dot-warn"></span>
          {{ adminService.settings().orders_off_message }}
        </span>
        <span *ngIf="adminService.settings().delivery_time" class="info-pill pill-info">
          <span class="pill-dot dot-info"></span>
          Delivery: {{ adminService.settings().delivery_time }}
        </span>
      </div>
    </div>

    <!-- Overlay -->
    <div *ngIf="drawerOpen" class="drawer-overlay" (click)="closeDrawer()"></div>

    <!-- Side Drawer -->
    <aside *ngIf="drawerOpen" class="side-drawer" role="dialog" aria-label="Menu">
      <div class="drawer-top">
        <p class="drawer-logo">CLGBITES</p>
        <p class="drawer-subtitle">CAMPUS FOOD DELIVERY</p>
      </div>

      <nav class="drawer-nav">
        <button class="drawer-item" type="button" (click)="navigateHome()">
          <span class="drawer-item-icon">🏠</span>
          <span class="drawer-item-label">Home</span>
          <span class="drawer-chevron">›</span>
        </button>

        <button class="drawer-item" type="button" (click)="navigateToReviews()">
          <span class="drawer-item-icon">💬</span>
          <span class="drawer-item-label">Student Reviews</span>
          <span class="drawer-review-badge">NEW</span>
          <span class="drawer-chevron">›</span>
        </button>

        <button class="drawer-item" type="button" (click)="goToCart(); closeDrawer()">
          <span class="drawer-item-icon">🛒</span>
          <span class="drawer-item-label">My Cart</span>
          <span *ngIf="totalItems() > 0" class="drawer-cart-count">{{ totalItems() }}</span>
          <span class="drawer-chevron">›</span>
        </button>

        <button class="drawer-item" type="button" (click)="closeDrawer()">
          <span class="drawer-item-icon">ℹ️</span>
          <span class="drawer-item-label">About Us</span>
          <span class="drawer-chevron">›</span>
        </button>
      </nav>

      <div class="drawer-footer">
        <div class="drawer-contact-row">
          <span>📍</span>
          <span>VIT-AP University & Ainavolu Village</span>
        </div>
        <div class="drawer-contact-row">
          <span>📞</span>
          <span>+91 73960 18423</span>
        </div>
        <div class="drawer-contact-row">
          <span>✉️</span>
          <span>clgbites&#64;gmail.com</span>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .app-header {
      position: sticky; top: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      background: #ffffff;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #fde8c8;
      box-shadow: 0 2px 12px rgba(249,115,22,0.06);
    }
    .logo-text {
      font-size: 1.25rem; font-weight: 900;
      font-family: 'Playfair Display', 'Georgia', serif;
      color: #1a1a2e; letter-spacing: 0.04em;
    }
    .icon-btn {
      position: relative; border: none;
      background: #f3f4f6; color: #374151;
      padding: 0.5rem; border-radius: 0.75rem;
      cursor: pointer; transition: transform 0.15s ease, background 0.15s ease;
      display: flex; align-items: center; justify-content: center;
      -webkit-tap-highlight-color: transparent;
    }
    .icon-btn:active { transform: scale(0.88); background: #e5e7eb; }
    .cart-badge {
      position: absolute; right: -4px; top: -4px;
      display: flex; align-items: center; justify-content: center;
      width: 1.25rem; height: 1.25rem; border-radius: 50%;
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white; font-size: 0.65rem; font-weight: 900;
    }

    /* Info bar */
    .info-bar { background: #fafafa; border-bottom: 1px solid #f0f0f0; padding: 0.45rem 1rem; }
    .info-pills { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .info-pill { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; font-weight: 600; padding: 0.25rem 0.625rem; border-radius: 9999px; }
    .pill-warn { background: #fff4e5; color: #92400e; border: 1px solid #fde68a; }
    .pill-info { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .pill-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .dot-warn { background: #f59e0b; }
    .dot-info { background: #22c55e; }

    /* Overlay */
    .drawer-overlay {
      position: fixed; inset: 0; z-index: 60;
      background: rgba(0,0,0,0.35); backdrop-filter: blur(3px);
    }

    /* Drawer */
    .side-drawer {
      position: fixed; left: 0; top: 0; z-index: 70;
      height: 100vh; width: 17.5rem; background: white;
      box-shadow: 8px 0 32px rgba(0,0,0,0.14);
      display: flex; flex-direction: column;
      animation: slideInLeft 0.22s ease-out;
    }
    @keyframes slideInLeft {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }
    .drawer-top {
      padding: 1.5rem 1.5rem 1rem;
      background: linear-gradient(160deg, #fff7ed, #fef3e2);
      border-bottom: 1px solid #fde8c8;
    }
    .drawer-logo {
      font-size: 1.5rem; font-weight: 900;
      font-family: 'Playfair Display', 'Georgia', serif;
      color: #1a1a2e; letter-spacing: 0.04em;
    }
    .drawer-subtitle {
      font-size: 0.68rem; font-weight: 600; color: #9ca3af;
      text-transform: uppercase; letter-spacing: 0.08em; margin-top: 0.25rem;
    }

    .drawer-nav { display: flex; flex-direction: column; flex: 1; overflow-y: auto; }

    .drawer-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.95rem 1.25rem; background: none; border: none;
      border-bottom: 1px solid #fef3e2; font-size: 0.88rem;
      font-weight: 600; color: #374151; cursor: pointer;
      text-align: left; width: 100%;
      transition: background 0.15s ease;
      -webkit-tap-highlight-color: transparent;
    }
    .drawer-item:active { background: #fff7ed; }
    .drawer-item-icon { font-size: 1.1rem; flex-shrink: 0; }
    .drawer-item-label { flex: 1; }
    .drawer-chevron { color: #d1d5db; font-size: 1.2rem; flex-shrink: 0; }
    .drawer-review-badge {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white; font-size: 0.58rem; font-weight: 800;
      padding: 0.15rem 0.45rem; border-radius: 9999px;
      letter-spacing: 0.06em; flex-shrink: 0;
    }
    .drawer-cart-count {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white; font-size: 0.68rem; font-weight: 900;
      width: 20px; height: 20px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .drawer-footer {
      padding: 1.25rem 1.5rem;
      border-top: 1px solid #fde8c8;
      display: flex; flex-direction: column; gap: 0.625rem;
      background: #fffbf5;
    }
    .drawer-contact-row {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.73rem; color: #6b7280; line-height: 1.4;
    }
  `]
})
export class AppHeaderComponent {
  drawerOpen = false;
  totalItems = this.cartService.totalItems;
  readonly adminService = inject(AdminService);

  get hasInfo(): boolean {
    return !this.adminService.isOrdersAccepting() || !!this.adminService.settings().delivery_time;
  }

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService
  ) {}

  goToCart(): void { this.router.navigate(['/cart']); }
  openDrawer(): void  { this.drawerOpen = true; }
  closeDrawer(): void { this.drawerOpen = false; }

  navigateHome(): void {
    this.closeDrawer();
    this.router.navigate(['/']).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  navigateToReviews(): void {
    this.closeDrawer();
    // If already on home, just scroll. Otherwise navigate then scroll.
    const doScroll = () => {
      setTimeout(() => {
        const el = document.getElementById('reviews-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };
    if (this.router.url === '/') {
      doScroll();
    } else {
      this.router.navigate(['/']).then(() => doScroll());
    }
  }
}