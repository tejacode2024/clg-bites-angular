import {
  Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit
} from '@angular/core';
import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FloatingEmojisComponent } from '../../components/floating-emojis/floating-emojis.component';
import { MenuItemCardComponent } from '../../components/menu-item-card/menu-item-card.component';
import { FloatingCartBarComponent } from '../../components/floating-cart-bar/floating-cart-bar.component';
import { CartService } from '../../services/cart.service';
import { isOrderingAllowed } from '../../services/time-utils';
import { FormsModule } from '@angular/forms';
import { restaurants, Restaurant } from '../../services/restaurants';
import { AdminService } from '../../services/admin.service';


@Component({
  selector: 'app-restaurant',
  standalone: true,
  imports: [
    CommonModule,
     FormsModule,
    FloatingEmojisComponent,
    MenuItemCardComponent,
    FloatingCartBarComponent,
  ],
  template: `
    <!-- Not found -->
    <div *ngIf="!restaurant" style="display:flex;min-height:100vh;align-items:center;justify-content:center;background:var(--background);">
      <p style="color:var(--muted-foreground);">Restaurant not found</p>
    </div>
    <!-- Restaurant unavailable banner -->
   <div *ngIf="restaurant && !adminService.isRestaurantAvailable(restaurant.id)" class="closed-banner">
    🔴 This restaurant is currently unavailable. Please check back later.
      </div>

    <!-- Orders closed banner -->
   <div *ngIf="restaurant && !adminService.isOrdersAccepting()" class="closed-banner">
    🔴 {{ adminService.settings().orders_off_message }}
</div>
    <!-- Restaurant page -->
    <div *ngIf="restaurant" style="position:relative;min-height:100vh;background:var(--background);padding-bottom:7rem;">
      <app-floating-emojis></app-floating-emojis>

      <!-- Banner -->
      <div class="banner">
        <div *ngIf="!imageLoaded" class="shimmer" style="position:absolute;inset:0;"></div>
        <img
          [src]="restaurant.image"
          [alt]="restaurant.name"
          class="banner-img"
          [class.loaded]="imageLoaded"
          (load)="imageLoaded = true"
        />
        <div class="banner-gradient"></div>

        <!-- Back button -->
        <button class="back-btn" (click)="goBack()" aria-label="Go back">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
            viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>

        <!-- Info overlay -->
        <div class="banner-info fade-slide-in">
          <h1 class="banner-title">{{ restaurant.name }}</h1>
          <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.25rem;">
            <div style="display:flex;align-items:center;gap:0.25rem;">
              <svg *ngFor="let s of stars" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                viewBox="0 0 24 24" stroke="none"
                [attr.fill]="s < restaurant.rating ? '#fbbf24' : 'rgba(255,255,255,0.3)'">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
            </div>
            <span style="font-size:0.875rem;color:rgba(255,255,255,0.9);">{{ restaurant.description }}</span>
          </div>
        </div>
      </div>
      <!-- Today's Offer Popup -->
      <div *ngIf="restaurant.id === 'Amrutha'" class="offer-popup fade-slide-in">
        <div class="offer-inner">
          <span class="offer-tag">🎉 Today's Special</span>
          <p class="offer-text">
            🍳 <strong>Dum,Fry Biryani & Kodi Palao</strong><br>
            + <strong>FREE Egg - </strong>  <strong>₹0 extra!</strong>
          </p>
          <span class="offer-limit">⏳ Limited Time Only</span>
        </div>
      </div>
      <!-- Today's Offer Popup -->
      <div *ngIf="restaurant.id === 'KonaseemaRuchulu'" class="offer-popup fade-slide-in">
        <div class="offer-inner">
          <span class="offer-tag">🎉 Today's Special</span>
          <p class="offer-text">
            🍳 <strong>Dum,Fry Biryani & Kodi Palao</strong><br>
            + <strong>FREE Egg - </strong>  <strong>₹0 extra!</strong>
          </p>
          <span class="offer-limit">⏳ Limited Time Only</span>
        </div>
      </div>


      <!-- Sticky category nav -->


      <div class="category-nav sticky-nav scrollbar-hide">
        <button
          *ngFor="let cat of categories"
          (click)="scrollToCategory(cat)"
          [class.active]="activeCategory === cat"
          class="cat-btn"
        >{{ cat }}</button>
      </div>

      <!-- Multi-restaurant info -->
      <div *ngIf="hasOtherRestaurantItems" class="multi-rest-info">
        <p style="font-size:0.875rem;color:var(--primary);">
          Your cart has items from {{ otherRestaurants.join(', ') }}. You can order from multiple restaurants!
        </p>
      </div>


      <!-- Menu sections -->
      <div style="position:relative;z-index:10;padding:1rem;">
        <div
      *ngFor="let menuCat of getFilteredMenu(restaurant.menu); let i = index"          [id]="'section-' + menuCat.category"
          style="margin-bottom:1.5rem;"
        >
          <h2 style="font-size:1.125rem;font-weight:600;color:var(--foreground);margin-bottom:0.75rem;">
            {{ menuCat.category }}
          </h2>
          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            <app-menu-item-card
              *ngFor="let item of menuCat.items"
              [item]="item"
              [restaurant]="restaurant"
            ></app-menu-item-card>
          </div>
        </div>
      </div>

      <app-floating-cart-bar></app-floating-cart-bar>

      
  `,
  styles: [`
  .offer-popup {
  margin: 0.75rem 1rem;
  border-radius: 1rem;
  background: linear-gradient(135deg, #fff7ed, #fef3c7);
  border: 1.5px solid #fbbf24;
  padding: 0.875rem 1rem;
  box-shadow: 0 4px 12px rgba(251,191,36,0.25);
  }
  .offer-inner { display: flex; flex-direction: column; gap: 0.4rem; }
  .offer-tag { font-size: 0.75rem; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.05em; }
  .offer-text { font-size: 0.875rem; color: #1a1a2e; line-height: 1.5; margin: 0; }
  .offer-limit { font-size: 0.75rem; font-weight: 600; color: #dc2626; }

   .closed-banner {
  background: #fee2e2;
  border: 1px solid #fca5a5;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #dc2626;
  font-weight: 600;
  font-size: 0.875rem;
  margin: 1rem;
  text-align: center;
}

    .banner {
      position: relative; height: 12rem; overflow: hidden;
    }
    @media (min-width: 640px) { .banner { height: 14rem; } }
    .banner-img {
      width: 100%; height: 100%; object-fit: cover; object-position: center 15%;
      opacity: 0; transition: opacity 0.5s;
    }
    .banner-img.loaded { opacity: 1; }
    .banner-gradient {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(26,26,46,0.7), transparent);
    }
    .back-btn {
      position: absolute; left: 1rem; top: 1rem; z-index: 10;
      border: none; cursor: pointer;
      border-radius: 50%; background: rgba(255,255,255,0.9);
      padding: 0.5rem; backdrop-filter: blur(4px);
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      display: flex; align-items: center;
      color: var(--card-foreground); transition: transform 0.2s;
    }
    .back-btn:hover { transform: scale(1.1); }
    .banner-info {
      position: absolute; bottom: 0; left: 0; right: 0; padding: 1rem;
    }
    .banner-title {
      font-size: 1.5rem; font-weight: 700; color: white;
      filter: drop-shadow(0 4px 3px rgba(0,0,0,0.15));
    }
    .sticky-nav {
      position: sticky; top: 0; z-index: 30;
      background: rgba(255,255,255,0.95); backdrop-filter: blur(12px);
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.75rem 1rem;
    }
    .cat-btn {
      flex-shrink: 0; border-radius: 9999px;
      padding: 0.5rem 1rem; font-size: 0.875rem; font-weight: 500;
      border: none; cursor: pointer;
      background: var(--secondary); color: var(--secondary-foreground);
      transition: all 0.2s;
    }
    .cat-btn:hover { background: rgba(253,232,236,0.8); }
    .cat-btn.active {
      background: var(--primary); color: var(--primary-foreground);
      box-shadow: 0 4px 6px -1px rgba(232,84,108,0.3);
    }
    .toggle { position:relative; display:inline-block; width:44px; height:24px; }
    .toggle input { opacity:0; width:0; height:0; }
    .slider { position:absolute; cursor:pointer; inset:0; background:#ccc; border-radius:24px; transition:0.3s; }
    .slider:before { position:absolute; content:""; height:18px; width:18px; left:3px; bottom:3px; background:white; border-radius:50%; transition:0.3s; }
    .toggle input:checked + .slider { background:#16a34a; }
    .toggle input:checked + .slider:before { transform:translateX(20px); }
    .multi-rest-info {
      margin: 1rem; border-radius: 0.75rem;
      background: rgba(232,84,108,0.1);
      border: 1px solid rgba(232,84,108,0.2);
      padding: 0.75rem;
      animation: fadeInUp 0.3s ease;
    }
    
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
  `]
})
export class RestaurantComponent implements OnInit, OnDestroy {
  restaurant: Restaurant | undefined;
  activeCategory = '';
  imageLoaded = false;
  orderingAllowed = true;
  onlyVeg = false;
  otherRestaurants: string[] = [];
  stars = [0, 1, 2, 3, 4];
  private timerRef: any;
  private isScrollingToCategory = false;

  get categories(): string[] {
    const menu = this.restaurant?.menu || [];
  if (this.adminService.onlyVeg()) {
    return menu.filter(m => m.isVeg === true).map(m => m.category);
  }
  return menu.map(m => m.category);
  }
  readonly adminService = inject(AdminService);

  get hasOtherRestaurantItems(): boolean {
    return this.otherRestaurants.length > 0;
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly cartService: CartService
  ) {}
  getFilteredMenu(menu: any[]): any[] {
  if (!this.adminService.onlyVeg()) return menu;
  return menu.filter(cat => cat.isVeg === true);
}
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.restaurant = restaurants.find((r) => r.id === id);
    if (this.categories.length > 0) {
      this.activeCategory = this.categories[0];
    }
    this.updateOtherRestaurants();
    this.checkTime();
    this.timerRef = setInterval(() => {
      this.checkTime();
      this.updateOtherRestaurants();
    }, 60000);

    // Listen for scroll
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  ngOnDestroy(): void {
    if (this.timerRef) clearInterval(this.timerRef);
    window.removeEventListener('scroll', this.handleScroll.bind(this));
  }

  private handleScroll(): void {
    if (this.isScrollingToCategory) return;
    const scrollPos = window.scrollY + 180;
    let current = this.categories[0];
    for (const cat of this.categories) {
      const el = document.getElementById('section-' + cat);
      if (el && el.offsetTop <= scrollPos) current = cat;
    }
    if (current !== this.activeCategory) this.activeCategory = current;
  }

  scrollToCategory(category: string): void {
    this.activeCategory = category;
    this.isScrollingToCategory = true;
    const el = document.getElementById('section-' + category);
    if (el) {
      const y = el.offsetTop - 140;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setTimeout(() => (this.isScrollingToCategory = false), 600);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  private updateOtherRestaurants(): void {
    if (!this.restaurant) return;
    this.otherRestaurants = this.cartService
      .getRestaurantNames()
      .filter((n) => n !== this.restaurant!.name);
  }

  private checkTime(): void {
    this.orderingAllowed = isOrderingAllowed();
  }
}
