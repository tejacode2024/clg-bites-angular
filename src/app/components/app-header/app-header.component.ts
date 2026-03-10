import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Header -->
    <header class="app-header">
      <h1 class="logo-text">Clg<span>Bites</span></h1>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <!-- Cart Icon -->
        <button class="icon-btn" (click)="goToCart()" aria-label="Open cart">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
          <span *ngIf="totalItems() > 0" class="cart-badge pulse-badge">
            {{ totalItems() > 9 ? '9+' : totalItems() }}
          </span>
        </button>
        <button class="icon-btn" (click)="openDrawer()" aria-label="Open menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </header>

    <!-- Overlay -->
    <div *ngIf="drawerOpen" class="drawer-overlay" (click)="closeDrawer()"></div>

    <!-- Side Drawer -->
    <aside *ngIf="drawerOpen" class="side-drawer" role="dialog" aria-label="About">
      <div class="drawer-header">
        <h2>About</h2>
        <button class="close-btn" (click)="closeDrawer()" aria-label="Close menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="drawer-content">
        <div class="founder-row">
          <div class="founder-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <p style="font-size:0.75rem; color:var(--muted-foreground)">Founder</p>
            <p style="font-weight:600; color:var(--card-foreground)">ClgBites Team</p>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:1rem;">
          <a href="tel:+917842960252" class="contact-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
              viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.14 11 19.79 19.79 0 0 1 1.08 2.18 2 2 0 0 1 3.08 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 7.09a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21 14h1a2 2 0 0 1 2 1.92z"/>
            </svg>
            <span>+91 7842960252</span>
          </a>
          <a href="mailto:clgbites@gmail.com" class="contact-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
              viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span>clgbites&#64;gmail.com</span>
          </a>
        </div>

        <div class="about-box">
          <p>ClgBites helps you browse menus from all your favorite college food spots in one place.</p>
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .app-header {
      position: sticky; top: 0; z-index: 50;
      display: flex; align-items: center; justify-content: space-between;
      background-color: var(--primary);
      padding: 0.75rem 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .logo-text {
      font-size: 1.25rem; font-weight: 700;
      color: var(--primary-foreground); letter-spacing: -0.025em;
    }
    .logo-text span { font-weight: 800; }
    .icon-btn {
      position: relative; border: none; background: transparent;
      color: var(--primary-foreground); padding: 0.5rem;
      border-radius: 0.5rem; cursor: pointer;
      transition: background 0.2s;
    }
    .icon-btn:hover { background: rgba(255,255,255,0.1); }
    .cart-badge {
      position: absolute; right: -4px; top: -4px;
      display: flex; align-items: center; justify-content: center;
      width: 1.25rem; height: 1.25rem; border-radius: 50%;
      background: #fff; color: var(--primary);
      font-size: 0.65rem; font-weight: 700;
    }
    .drawer-overlay {
      position: fixed; inset: 0; z-index: 60;
      background: rgba(26,26,46,0.4); backdrop-filter: blur(4px);
    }
    .side-drawer {
      position: fixed; right: 0; top: 0; z-index: 70;
      height: 100vh; width: 18rem; background: var(--card);
      box-shadow: -4px 0 25px rgba(0,0,0,0.15);
      animation: slideInRight 0.3s ease;
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); }
      to { transform: translateX(0); }
    }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem; border-bottom: 1px solid var(--border);
    }
    .drawer-header h2 { font-weight: 600; color: var(--card-foreground); }
    .close-btn {
      border: none; background: transparent; cursor: pointer;
      color: var(--muted-foreground); padding: 0.375rem;
      border-radius: 0.5rem;
    }
    .close-btn:hover { background: var(--muted); }
    .drawer-content { padding: 1.5rem 1rem; }
    .founder-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem; }
    .founder-avatar {
      display: flex; align-items: center; justify-content: center;
      width: 3rem; height: 3rem; border-radius: 50%;
      background: rgba(232,84,108,0.1); color: var(--primary);
    }
    .contact-link {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem; border-radius: 0.75rem;
      background: var(--muted); color: var(--card-foreground);
      text-decoration: none; font-size: 0.875rem; font-weight: 500;
      transition: background 0.2s;
    }
    .contact-link:hover { background: var(--secondary); }
    .about-box {
      margin-top: 2rem; padding: 1rem; border-radius: 0.75rem;
      background: var(--secondary);
    }
    .about-box p {
      font-size: 0.75rem; color: var(--muted-foreground);
      text-align: center; line-height: 1.625;
    }
  `]
})
export class AppHeaderComponent {
  drawerOpen = false;
  totalItems = this.cartService.totalItems;

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService
  ) {}

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  openDrawer(): void {
    this.drawerOpen = true;
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }
}
