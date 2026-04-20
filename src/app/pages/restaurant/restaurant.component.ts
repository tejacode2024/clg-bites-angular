import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FloatingEmojisComponent } from '../../components/floating-emojis/floating-emojis.component';
import { FloatingCartBarComponent } from '../../components/floating-cart-bar/floating-cart-bar.component';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { restaurants, Restaurant } from '../../services/restaurants';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-restaurant',
  standalone: true,
  imports: [CommonModule, FormsModule, FloatingEmojisComponent, FloatingCartBarComponent],
  template: `
    <div *ngIf="!restaurant" style="display:flex;min-height:100vh;align-items:center;justify-content:center;background:#fffbf5;">
      <p style="color:#9ca3af;">Restaurant not found</p>
    </div>

    <div *ngIf="restaurant && !adminService.isRestaurantAvailable(restaurant.id)" class="status-banner closed-banner" style="margin:0.75rem;">
      🔴 This restaurant is currently unavailable.
    </div>
    <div *ngIf="restaurant && !adminService.isOrdersAccepting()" class="status-banner closed-banner" style="margin:0.75rem;">
      🔴 {{ adminService.settings().orders_off_message }}
    </div>

    <div *ngIf="restaurant" style="min-height:100vh;background:#fffbf5;padding-bottom:7rem;">
      <app-floating-emojis></app-floating-emojis>

      <!-- Hero -->
      <div class="hero-wrap">
        <div *ngIf="!imageLoaded" class="shimmer" style="position:absolute;inset:0;"></div>
        <img [src]="restaurant.image" [alt]="restaurant.name"
          class="hero-img" [class.loaded]="imageLoaded" (load)="imageLoaded = true" />
        <div class="hero-gradient"></div>

        <div class="hero-topbar">
          <button class="hero-btn" (click)="goBack()">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
          <button class="hero-btn" (click)="goToCart()" style="position:relative;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none"
              viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span *ngIf="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
          </button>
        </div>

        <div class="hero-info fade-slide-in">
          <p class="hero-name">{{ restaurant.name }}</p>
          <div class="hero-meta">
            <span *ngFor="let s of stars" class="star" [class.filled]="s < restaurant.rating">★</span>
            <span class="rating-num">{{ restaurant.rating }}.0</span>
            <span class="meta-dot">·</span>
            <span class="hero-desc">{{ restaurant.description }}</span>
          </div>
        </div>
      </div>

      <!-- Offer popup for specific restaurants -->
      <div *ngIf="restaurant.id === 'Amrutha' || restaurant.id === 'KonaseemaRuchulu'" class="offer-card fade-slide-in">
        <div class="offer-inner">
          <span class="offer-tag">🎉 Today's Special</span>
          <p class="offer-text">
            🍳 <strong>{{ restaurant.id === 'Amrutha' ? 'Dum & Fry Biryani' : 'Kodi Palao' }}</strong>
            + <strong>FREE Egg — ₹0 extra!</strong>
          </p>
          <span class="offer-limit">⏳ Limited Time Only</span>
        </div>
      </div>

      <!-- Sticky category nav -->
      <div class="cat-nav scrollbar-hide">
        <button *ngFor="let cat of categories"
          (click)="scrollToCategory(cat)"
          [class.cat-active]="activeCategory === cat"
          class="cat-pill">
          {{ cat }}
        </button>
      </div>

      <!-- Menu sections -->
      <div style="padding: 1rem;">
        <div *ngFor="let menuCat of restaurant.menu"
          [id]="'section-' + menuCat.category"
          style="margin-bottom: 0.625rem;">

          <div class="menu-cat-card">
            <button class="cat-header" (click)="toggleCat(menuCat.category)">
              <div class="cat-header-left">
                <span class="cat-name">{{ menuCat.category }}</span>
                <span class="cat-count">{{ menuCat.items.length }}</span>
              </div>
              <span class="cat-chevron">{{ expandedCats.has(menuCat.category) ? '▲' : '▼' }}</span>
            </button>

            <div *ngIf="expandedCats.has(menuCat.category)" class="items-list">
              <div *ngFor="let item of menuCat.items" class="menu-item-row">
                <div style="flex:1;min-width:0;">
                  <p class="item-name">{{ item.name }}</p>
                  <p class="item-price">₹{{ item.price }}</p>
                  <span *ngIf="item.isStudentChoice" class="student-badge">⭐ Student Pick</span>
                </div>
                <div class="item-actions">
                  <ng-container *ngIf="getQty(item) === 0; else qtyControl">
                    <button class="add-btn" (click)="addItem(item)">Add</button>
                  </ng-container>
                  <ng-template #qtyControl>
                    <div class="qty-row">
                      <button class="qty-btn minus-btn" (click)="removeItem(item)">−</button>
                      <span class="qty-num">{{ getQty(item) }}</span>
                      <button class="qty-btn plus-btn" (click)="addItem(item)">+</button>
                    </div>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <app-floating-cart-bar></app-floating-cart-bar>
    </div>
  `,
  styles: [`
    .status-banner { border-radius: 0.75rem; padding: 0.75rem 1rem; font-weight: 600; font-size: 0.875rem; text-align: center; }
    .closed-banner { background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; }

    .hero-wrap { position: relative; height: 190px; overflow: hidden; }
    .hero-img { width: 100%; height: 100%; object-fit: cover; object-position: center 15%; opacity: 0; transition: opacity 0.5s; }
    .hero-img.loaded { opacity: 1; }
    .hero-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.55) 100%); }
    .hero-topbar { position: absolute; top: 0; left: 0; right: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 2.5rem 1rem 0; }
    .hero-btn { border: none; cursor: pointer; border-radius: 0.75rem; background: rgba(255,255,255,0.85); backdrop-filter: blur(8px); padding: 0.5rem; display: flex; align-items: center; color: #374151; transition: transform 0.15s; position: relative; }
    .hero-btn:active { transform: scale(0.9); }
    .cart-badge { position: absolute; top: -4px; right: -4px; width: 18px; height: 18px; border-radius: 50%; background: linear-gradient(135deg, #f97316, #ea580c); color: white; font-size: 0.6rem; font-weight: 900; display: flex; align-items: center; justify-content: center; }
    .hero-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.75rem 1rem; }
    .hero-name { color: white; font-size: 1.4rem; font-weight: 900; line-height: 1.2; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }
    .hero-meta { display: flex; align-items: center; gap: 0.25rem; margin-top: 0.25rem; flex-wrap: wrap; }
    .star { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
    .star.filled { color: #fbbf24; }
    .rating-num { font-size: 0.8rem; color: rgba(255,255,255,0.9); margin-left: 0.25rem; }
    .meta-dot { color: rgba(255,255,255,0.5); margin: 0 0.2rem; }
    .hero-desc { font-size: 0.8rem; color: rgba(255,255,255,0.85); }

    .offer-card { margin: 0.75rem 1rem 0; border-radius: 1rem; background: linear-gradient(135deg, #fff7ed, #fef3c7); border: 1.5px solid #fbbf24; padding: 0.875rem 1rem; box-shadow: 0 4px 12px rgba(251,191,36,0.25); }
    .offer-inner { display: flex; flex-direction: column; gap: 0.35rem; }
    .offer-tag { font-size: 0.7rem; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 0.06em; }
    .offer-text { font-size: 0.85rem; color: #1a1a2e; line-height: 1.5; margin: 0; }
    .offer-limit { font-size: 0.72rem; font-weight: 600; color: #dc2626; }

    .cat-nav { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,0.95); backdrop-filter: blur(12px); display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.75rem 1rem; border-bottom: 1px solid #fde8c8; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .cat-pill { flex-shrink: 0; border-radius: 9999px; padding: 0.45rem 1rem; font-size: 0.8rem; font-weight: 700; border: 1px solid #fde8c8; cursor: pointer; background: white; color: #6b7280; transition: all 0.2s; }
    .cat-pill:active { transform: scale(0.95); }
    .cat-active { background: linear-gradient(135deg, #f97316, #ea580c) !important; color: white !important; border-color: transparent !important; box-shadow: 0 4px 10px rgba(249,115,22,0.3); }

    .menu-cat-card { background: white; border-radius: 1rem; border: 1px solid #fde8c8; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
    .cat-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; background: none; border: none; cursor: pointer; transition: background 0.15s; }
    .cat-header:active { background: #fff7ed; }
    .cat-header-left { display: flex; align-items: center; gap: 0.625rem; }
    .cat-name { font-weight: 700; color: #1f2937; font-size: 0.875rem; }
    .cat-count { font-size: 0.7rem; color: #9ca3af; background: #f3f4f6; padding: 0.1rem 0.5rem; border-radius: 9999px; }
    .cat-chevron { font-size: 0.65rem; color: #9ca3af; }

    .items-list { border-top: 1px solid #fef7ee; }
    .menu-item-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid #fef7ee; }
    .menu-item-row:last-child { border-bottom: none; }
    .item-name { font-size: 0.85rem; font-weight: 600; color: #1f2937; line-height: 1.3; }
    .item-price { font-size: 0.85rem; font-weight: 900; color: #f97316; margin-top: 0.125rem; }
    .student-badge { display: inline-flex; align-items: center; font-size: 0.7rem; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 0.15rem 0.5rem; border-radius: 9999px; font-weight: 600; margin-top: 0.25rem; }

    .item-actions { flex-shrink: 0; }
    .add-btn { padding: 0.4rem 0.9rem; border-radius: 0.625rem; background: linear-gradient(135deg, #f97316, #ea580c); border: none; color: white; font-size: 0.82rem; font-weight: 700; cursor: pointer; box-shadow: 0 2px 8px rgba(249,115,22,0.3); transition: transform 0.15s; }
    .add-btn:active { transform: scale(0.95); }
    .qty-row { display: flex; align-items: center; gap: 0.375rem; }
    .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: 700; transition: transform 0.15s; }
    .qty-btn:active { transform: scale(0.9); }
    .minus-btn { background: #fff7ed; border: 1.5px solid #fed7aa; color: #f97316; }
    .plus-btn { background: linear-gradient(135deg, #f97316, #ea580c); color: white; }
    .qty-num { font-weight: 900; color: #1f2937; font-size: 0.875rem; min-width: 20px; text-align: center; }
  `]
})
export class RestaurantComponent implements OnInit, OnDestroy {
  restaurant: Restaurant | undefined;
  activeCategory = '';
  imageLoaded = false;
  expandedCats = new Set<string>();
  readonly stars = [0, 1, 2, 3, 4];
  private timerRef: any;
  private isScrollingToCategory = false;

  readonly adminService = inject(AdminService);
  private readonly cartService = inject(CartService);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  get categories(): string[] {
    return this.restaurant?.menu.map(m => m.category) || [];
  }

  get cartCount(): number { return this.cartService.totalItems(); }

  getQty(item: any): number {
    if (!this.restaurant) return 0;
    return this.cartService.getItemQuantity(item.name, this.restaurant.id);
  }

  addItem(item: any): void {
    if (!this.restaurant) return;
    const overriddenItem = { ...item, price: item.price };
    this.cartService.addItem(overriddenItem, this.restaurant);
  }

  removeItem(item: any): void {
    if (!this.restaurant) return;
    const qty = this.getQty(item);
    const id = `${this.restaurant.id}-${item.name.toLowerCase().replace(/\s+/g, '-')}`;
    if (qty <= 1) this.cartService.removeItem(id);
    else this.cartService.updateQuantity(id, qty - 1);
  }

  toggleCat(category: string): void {
    if (this.expandedCats.has(category)) this.expandedCats.delete(category);
    else this.expandedCats.add(category);
    this.expandedCats = new Set(this.expandedCats);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.restaurant = restaurants.find(r => r.id === id);
    if (this.categories.length > 0) {
      this.activeCategory = this.categories[0];
      // Auto-expand first category
      const studentCat = this.restaurant?.menu.find(m => m.category === "Student's Choice");
      this.expandedCats.add(studentCat ? "Student's Choice" : this.categories[0]);
    }
    this.timerRef = setInterval(() => {}, 60000);
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
  }

  ngOnDestroy(): void {
    clearInterval(this.timerRef);
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
    if (el) window.scrollTo({ top: el.offsetTop - 140, behavior: 'smooth' });
    setTimeout(() => this.isScrollingToCategory = false, 600);
  }

  goBack(): void { this.router.navigate(['/']); }
  goToCart(): void { this.router.navigate(['/cart']); }
}