import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { RestaurantCardComponent } from '../../components/restaurant-card/restaurant-card.component';
import { FloatingCartBarComponent } from '../../components/floating-cart-bar/floating-cart-bar.component';
import { FloatingEmojisComponent } from '../../components/floating-emojis/floating-emojis.component';
import { restaurants, Restaurant } from '../../services/restaurants';
import { AdminService } from '../../services/admin.service';
import { FormsModule } from '@angular/forms';

const promoSlides = [
  { badge: "Today's Deal", title: "Free Delivery!", sub: "On all orders to VIT-AP Campus", from: "#f97316", to: "#ea580c", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" },
  { badge: "Student Pick", title: "Student Specials", sub: "Curated best-value picks", from: "#8b5cf6", to: "#7c3aed", img: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80" },
  { badge: "Most Popular", title: "Fresh Biryanis", sub: "From 10+ local restaurants", from: "#f59e0b", to: "#d97706", img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80" },
  { badge: "Easy Payment", title: "Pay on Delivery", sub: "COD available everywhere", from: "#10b981", to: "#059669", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80" },
];

const categoryCards = [
  { label: "Biryani", filter: "Biryani", img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=90&fit=crop&crop=center" },
  { label: "South Indian", filter: "Tiffins", img: "https://images.unsplash.com/photo-1630409351241-e90e7eb139b3?w=300&q=90&fit=crop&crop=center" },
  { label: "Fast Food", filter: "Fast Food", img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=90&fit=crop&crop=center" },
  { label: "Starters", filter: "Fast Food", img: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=90&fit=crop&crop=center" },
  { label: "Pizzas", filter: "Fast Food", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&q=90&fit=crop&crop=center" },
  { label: "Fruits", filter: "Fruits", img: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=90&fit=crop&crop=center" },
];

const allCategories = ["All", "Biryani", "Fast Food", "Tiffins", "Fruits"];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    AppHeaderComponent, RestaurantCardComponent,
    FloatingCartBarComponent, FloatingEmojisComponent,
  ],
  template: `
    <div style="min-height:100vh; background:#fffbf5; padding-bottom:6rem;">
      <app-floating-emojis></app-floating-emojis>
      <app-header></app-header>

      <div>
        <!-- Promo Carousel -->
        <div class="promo-wrap">
          <div class="promo-track">
            <div *ngFor="let slide of promoSlides; let i = index" class="promo-slide"
              [style.background]="'linear-gradient(135deg,' + slide.from + ',' + slide.to + ')'"
              [class.active]="i === promoIdx"
              [class.inactive]="i !== promoIdx">
              <img [src]="slide.img" alt="" class="promo-bg-img" />
              <div class="promo-content">
                <div class="promo-text">
                  <p class="promo-badge">{{ slide.badge }}</p>
                  <p class="promo-title">{{ slide.title }}</p>
                  <p class="promo-sub">{{ slide.sub }}</p>
                  <span class="promo-cta">🏷️ Order Now</span>
                </div>
                <div class="promo-thumb">
                  <img [src]="slide.img" alt="" class="promo-thumb-img" />
                </div>
              </div>
            </div>
          </div>
          <div class="promo-dots">
            <button *ngFor="let slide of promoSlides; let i = index"
              class="promo-dot" [class.active-dot]="i === promoIdx"
              (click)="promoIdx = i"></button>
          </div>
        </div>

        <!-- Category image cards -->
        <div class="section-block">
          <h2 class="section-title">What's on your mind?</h2>
          <div class="cat-cards-row scrollbar-hide">
            <button *ngFor="let card of categoryCards" class="cat-card"
              (click)="selectedCategory = card.filter; filterRestaurants()"
              [class.cat-card-active]="selectedCategory === card.filter">
              <div class="cat-img-wrap"
                [style.box-shadow]="selectedCategory === card.filter ? '0 0 0 2.5px #f97316,0 4px 12px rgba(249,115,22,0.25)' : '0 2px 8px rgba(0,0,0,0.10)'">
                <img [src]="card.img" [alt]="card.label" class="cat-img" />
              </div>
              <span class="cat-label" [style.color]="selectedCategory === card.filter ? '#ea580c' : '#374151'">{{ card.label }}</span>
            </button>
          </div>
        </div>

        <!-- Filter pills -->
        <div class="pills-row scrollbar-hide" style="padding: 0.5rem 1rem 0.75rem;">
          <button *ngFor="let cat of allCategories"
            class="pill" [class.pill-active]="selectedCategory === cat"
            (click)="selectedCategory = cat; filterRestaurants()">
            {{ cat }}
          </button>
        </div>

        <!-- Search -->
        <div style="padding: 0 1rem 0.75rem;">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" placeholder="Search restaurants, dishes..."
              [(ngModel)]="search" (input)="filterRestaurants()" />
          </div>
        </div>

        <!-- Restaurants -->
        <div style="padding: 0 1rem 1rem;">
          <div class="rest-header">
            <h2 class="section-title" style="margin:0;">Restaurants Near You</h2>
            <span class="rest-count">{{ filteredRestaurants.length }} open</span>
          </div>

          <div *ngIf="filteredRestaurants.length > 0" style="display:flex;flex-direction:column;gap:0.75rem;margin-top:0.75rem;">
            <app-restaurant-card
              *ngFor="let restaurant of filteredRestaurants; let i = index"
              [restaurant]="restaurant"
              [index]="i">
            </app-restaurant-card>
          </div>

          <div *ngIf="filteredRestaurants.length === 0" class="empty-state page-transition">
            <p style="font-size:2.5rem;">🍽️</p>
            <p style="font-size:1rem;font-weight:700;color:#374151;margin-top:0.5rem;">No restaurants found</p>
            <p style="font-size:0.8rem;color:#9ca3af;margin-top:0.25rem;">Try a different search or category</p>
          </div>
        </div>

        <!-- Footer -->
        <footer class="home-footer">
          <p class="footer-logo">CLGBITES</p>
          <p class="footer-sub">Your campus food delivery partner</p>
          <div class="footer-contacts">
            <span>📍 VIT-AP University & Ainavolu Village</span>
            <span>📞 7396018423</span>
            <span>✉️ clgbites&#64;gmail.com</span>
          </div>
          <p class="footer-copy">© 2025 CLGBITES. All rights reserved.</p>
        </footer>
      </div>

      <app-floating-cart-bar></app-floating-cart-bar>
    </div>
  `,
  styles: [`
    .promo-wrap { padding: 1rem 1rem 0; }
    .promo-track { position: relative; border-radius: 1rem; overflow: hidden; height: 168px; }
    .promo-slide { position: absolute; inset: 0; transition: opacity 0.5s, transform 0.5s; border-radius: 1rem; overflow: hidden; }
    .promo-slide.active { opacity: 1; transform: scale(1); pointer-events: auto; }
    .promo-slide.inactive { opacity: 0; transform: scale(0.97); pointer-events: none; }
    .promo-bg-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; mix-blend-mode: overlay; opacity: 0.3; }
    .promo-content { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; height: 100%; }
    .promo-text { flex: 1; }
    .promo-badge { color: rgba(255,255,255,0.8); font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 0.25rem; }
    .promo-title { color: white; font-size: 1.4rem; font-weight: 900; line-height: 1.2; }
    .promo-sub { color: rgba(255,255,255,0.85); font-size: 0.8rem; font-weight: 500; margin-top: 0.25rem; }
    .promo-cta { display: inline-block; margin-top: 0.6rem; background: rgba(255,255,255,0.25); color: white; font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.85rem; border-radius: 9999px; backdrop-filter: blur(4px); }
    .promo-thumb { width: 7rem; height: 7rem; border-radius: 1rem; overflow: hidden; flex-shrink: 0; margin-left: 1rem; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }
    .promo-thumb-img { width: 100%; height: 100%; object-fit: cover; }
    .promo-dots { display: flex; justify-content: center; gap: 0.375rem; margin-top: 0.6rem; }
    .promo-dot { width: 6px; height: 6px; border-radius: 9999px; background: #d1d5db; border: none; cursor: pointer; padding: 0; transition: width 0.3s, background 0.3s; }
    .promo-dot.active-dot { width: 20px; background: #f97316; }

    .section-block { background: white; padding: 1rem 1rem 0.75rem; border-bottom: 1px solid #f3f4f6; margin-top: 0.75rem; }
    .section-title { font-size: 0.95rem; font-weight: 900; color: #d97706; margin-bottom: 0.875rem; }
    .cat-cards-row { display: flex; gap: 1.25rem; overflow-x: auto; padding-bottom: 0.25rem; }
    .cat-card { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 0.4rem; background: none; border: none; cursor: pointer; min-width: 72px; transition: transform 0.15s; }
    .cat-card:active { transform: scale(0.95); }
    .cat-img-wrap { width: 72px; height: 72px; border-radius: 50%; overflow: hidden; transition: box-shadow 0.2s; }
    .cat-img { width: 100%; height: 100%; object-fit: cover; }
    .cat-label { font-size: 0.72rem; font-weight: 600; text-align: center; max-width: 72px; line-height: 1.3; }

    .pills-row { display: flex; gap: 0.5rem; overflow-x: auto; }
    .pill { flex-shrink: 0; padding: 0.45rem 1rem; border-radius: 0.75rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; background: white; color: #6b7280; border: 1px solid #fde8c8; box-shadow: 0 1px 4px rgba(0,0,0,0.06); transition: all 0.2s; }
    .pill:active { transform: scale(0.95); }
    .pill.pill-active { background: linear-gradient(135deg, #f97316, #ea580c); color: white; border-color: transparent; box-shadow: 0 4px 12px rgba(249,115,22,0.35); }

    .search-wrap { position: relative; }
    .search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); font-size: 0.875rem; }
    .search-input { width: 100%; padding: 0.7rem 1rem 0.7rem 2.5rem; border-radius: 0.875rem; border: 1px solid #fde8c8; background: white; font-size: 0.875rem; color: #374151; outline: none; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
    .search-input:focus { border-color: #f97316; box-shadow: 0 0 0 2px rgba(249,115,22,0.15); }

    .rest-header { display: flex; align-items: center; justify-content: space-between; }
    .rest-count { font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 9999px; background: #fef3e2; color: #d97706; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1rem; text-align: center; }

    .home-footer { background: white; padding: 1.5rem 1rem; border-top: 1px solid #fde8c8; }
    .footer-logo { font-size: 1.25rem; font-weight: 900; font-family: 'Playfair Display','Georgia',serif; background: linear-gradient(135deg, #ea580c, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .footer-sub { font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem; margin-bottom: 1rem; }
    .footer-contacts { display: flex; flex-direction: column; gap: 0.4rem; font-size: 0.75rem; color: #6b7280; margin-bottom: 1rem; }
    .footer-copy { font-size: 0.7rem; color: #d1d5db; text-align: center; }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  search = '';
  selectedCategory = 'All';
  filteredRestaurants: Restaurant[] = [];
  promoIdx = 0;
  private promoTimer: any;
  private filterTimer: any;

  readonly promoSlides = promoSlides;
  readonly categoryCards = categoryCards;
  readonly allCategories = allCategories;
  readonly adminService = inject(AdminService);

  constructor() {
    effect(() => {
      this.adminService.settings();
      this.filterRestaurants();
    });
  }

  ngOnInit(): void {
    this.filterRestaurants();
    this.promoTimer = setInterval(() => {
      this.promoIdx = (this.promoIdx + 1) % promoSlides.length;
    }, 4000);
    this.filterTimer = setInterval(() => this.filterRestaurants(), 2000);
  }

  ngOnDestroy(): void {
    clearInterval(this.promoTimer);
    clearInterval(this.filterTimer);
  }

  filterRestaurants(): void {
    this.filteredRestaurants = restaurants.filter(r => {
      const matchSearch = this.search === '' ||
        r.name.toLowerCase().includes(this.search.toLowerCase()) ||
        r.description.toLowerCase().includes(this.search.toLowerCase());
      const matchCategory = this.selectedCategory === 'All' || r.categories.includes(this.selectedCategory);
      return matchSearch && matchCategory;
    }).sort((a, b) => {
      const aAvail = this.adminService.isRestaurantAvailable(a.id) ? 0 : 1;
      const bAvail = this.adminService.isRestaurantAvailable(b.id) ? 0 : 1;
      if (aAvail !== bAvail) return aAvail - bAvail;
      return restaurants.indexOf(a) - restaurants.indexOf(b);
    });
  }
}