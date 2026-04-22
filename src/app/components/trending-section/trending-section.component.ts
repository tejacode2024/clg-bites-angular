import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';
import type { Restaurant } from '../../services/restaurants';
import { inject } from '@angular/core';

export interface TrendingItem {
  rank: number;
  item: string;
  restaurantId: string;
  restaurantName: string;
  price: number;
  count: number;
  change: number;
  img: string;
  isNonVeg: boolean;
}

export const TRENDING_ITEMS: TrendingItem[] = [
  { rank: 1, item: 'Dum Biryani',            restaurantId: 'sindhu',           restaurantName: 'Hotel Sindhu',         price: 200, count: 54, change: 12, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80', isNonVeg: true },
  { rank: 2, item: 'Mughalai Biryani',        restaurantId: 'Amrutha',          restaurantName: 'Amrutha',              price: 239, count: 41, change: 8,  img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80', isNonVeg: true },
  { rank: 3, item: 'Chicken Noodles',         restaurantId: 'food-corner',      restaurantName: 'Food Corner',          price: 100, count: 37, change: 5,  img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&q=80', isNonVeg: true },
  { rank: 4, item: '3 Pulkhas + Egg Burji Combo', restaurantId: 'ruchi-pulkha-point', restaurantName: 'Ruchi Pulkha Point', price: 70, count: 31, change: 19, img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80', isNonVeg: false },
  { rank: 5, item: 'Masala Dosa',             restaurantId: 'tiffens',          restaurantName: 'Tiffins',              price: 65,  count: 27, change: 3,  img: 'https://images.unsplash.com/photo-1630409351241-e90e7eb139b3?w=500&q=80', isNonVeg: false },
];

@Component({
  selector: 'app-trending-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trending-wrap">
      <!-- Header -->
      <div class="trending-header">
        <div class="trending-title-row">
          <div class="trending-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2.5">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
          <div>
            <h2 class="trending-title">Trending Today</h2>
            <p class="trending-sub">Most ordered items right now</p>
          </div>
        </div>
        <div class="live-badge">
          <span class="live-dot"></span>
          <span class="live-text">Live</span>
        </div>
      </div>

      <!-- Top 2 big cards -->
      <div class="trending-big-grid">
        <div class="trending-big-card" *ngFor="let t of top2">
          <img [src]="t.img" [alt]="t.item" class="trending-big-img" />
          <div class="trending-big-overlay"></div>

          <div class="trending-rank-badge">
            #{{ t.rank }}
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
              <path d="M12 2C8 2 5 6 5 10c0 6 7 13 7 13s7-7 7-13c0-4-3-8-7-8z"/>
            </svg>
          </div>
          <div class="trending-change-badge">↑{{ t.change }}%</div>

          <div class="trending-big-info">
            <p class="trending-big-name">{{ t.item }}</p>
            <div class="trending-orders-row">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.6)" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span class="trending-orders-text">{{ t.count }} orders</span>
            </div>
            <div class="trending-big-bottom">
              <span class="trending-big-price">₹{{ t.price }}</span>
              <div class="stepper" [class.stepper-active]="getQty(t) > 0">
                <ng-container *ngIf="getQty(t) === 0">
                  <button class="add-btn" (click)="addItem(t)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </ng-container>
                <ng-container *ngIf="getQty(t) > 0">
                  <button class="step-btn" (click)="removeItem(t)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                  <span class="step-qty">{{ getQty(t) }}</span>
                  <button class="step-btn" (click)="addItem(t)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </ng-container>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ranks 3-5 list -->
      <div class="trending-list">
        <div class="trending-list-item" *ngFor="let t of bottom3">
          <div class="trending-list-img-wrap">
            <img [src]="t.img" [alt]="t.item" class="trending-list-img" />
            <div class="trending-list-rank">#{{ t.rank }}</div>
          </div>
          <div class="trending-list-info">
            <p class="trending-list-name">{{ t.item }}</p>
            <div class="trending-list-meta">
              <span class="trending-list-rest">{{ t.restaurantName }}</span>
              <span class="trending-list-change">↑{{ t.change }}%</span>
              <span class="trending-list-cnt">· {{ t.count }} orders</span>
            </div>
          </div>
          <div class="trending-list-right">
            <span class="trending-list-price">₹{{ t.price }}</span>
            <div class="stepper-sm" [class.stepper-sm-active]="getQty(t) > 0">
              <ng-container *ngIf="getQty(t) === 0">
                <button class="add-btn-sm" (click)="addItem(t)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </ng-container>
              <ng-container *ngIf="getQty(t) > 0">
                <button class="step-btn-sm" (click)="removeItem(t)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <span class="step-qty-sm">{{ getQty(t) }}</span>
                <button class="step-btn-sm" (click)="addItem(t)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              </ng-container>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .trending-wrap { padding: 1rem 0; }

    /* Header */
    .trending-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .trending-title-row { display: flex; align-items: center; gap: 0.5rem; }
    .trending-icon { width: 1.75rem; height: 1.75rem; background: #f97316; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .trending-title { font-size: 0.9rem; font-weight: 800; color: #111827; line-height: 1.1; }
    .trending-sub { font-size: 0.65rem; color: #9ca3af; margin-top: 0.1rem; }
    .live-badge { display: flex; align-items: center; gap: 0.25rem; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 9999px; padding: 0.25rem 0.625rem; }
    .live-dot { width: 0.375rem; height: 0.375rem; border-radius: 50%; background: #f97316; animation: pulseAnim 1.5s infinite; }
    .live-text { font-size: 0.65rem; color: #ea580c; font-weight: 700; }
    @keyframes pulseAnim { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

    /* Big grid */
    .trending-big-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; margin-bottom: 0.625rem; }
    .trending-big-card { position: relative; border-radius: 1rem; overflow: hidden; height: 10rem; cursor: pointer; }
    .trending-big-img { width: 100%; height: 100%; object-fit: cover; }
    .trending-big-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); }
    .trending-rank-badge { position: absolute; top: 0.625rem; left: 0.625rem; display: flex; align-items: center; gap: 0.25rem; background: #f97316; color: white; font-size: 0.6rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 9999px; }
    .trending-change-badge { position: absolute; top: 0.625rem; right: 0.5rem; background: rgba(255,255,255,0.9); color: #c2410c; font-size: 0.6rem; font-weight: 800; padding: 0.2rem 0.4rem; border-radius: 9999px; }
    .trending-big-info { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.625rem; }
    .trending-big-name { color: white; font-size: 0.7rem; font-weight: 800; line-height: 1.3; }
    .trending-orders-row { display: flex; align-items: center; gap: 0.25rem; margin: 0.25rem 0 0.5rem; }
    .trending-orders-text { font-size: 0.6rem; color: rgba(255,255,255,0.6); }
    .trending-big-bottom { display: flex; align-items: center; justify-content: space-between; }
    .trending-big-price { color: white; font-size: 0.8rem; font-weight: 800; }

    /* Stepper for big cards */
    .stepper { display: flex; align-items: center; }
    .add-btn { width: 1.75rem; height: 1.75rem; border-radius: 50%; background: #f97316; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 2px 6px rgba(249,115,22,0.4); transition: transform 0.1s; }
    .add-btn:active { transform: scale(0.9); }
    .stepper-active { background: #f97316; border-radius: 9999px; overflow: hidden; }
    .step-btn { width: 1.5rem; height: 1.5rem; border: none; background: transparent; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .step-qty { color: white; font-size: 0.7rem; font-weight: 800; min-width: 1rem; text-align: center; }

    /* List items */
    .trending-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .trending-list-item { background: white; border: 1px solid #fed7aa; border-radius: 1rem; display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .trending-list-img-wrap { position: relative; width: 2.75rem; height: 2.75rem; border-radius: 0.5rem; overflow: hidden; flex-shrink: 0; }
    .trending-list-img { width: 100%; height: 100%; object-fit: cover; }
    .trending-list-rank { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(249,115,22,0.8); display: flex; align-items: center; justify-content: center; padding: 0.1rem; font-size: 0.55rem; color: white; font-weight: 800; }
    .trending-list-info { flex: 1; min-width: 0; }
    .trending-list-name { font-size: 0.75rem; font-weight: 700; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .trending-list-meta { display: flex; align-items: center; gap: 0.375rem; margin-top: 0.2rem; }
    .trending-list-rest { font-size: 0.6rem; color: #9ca3af; }
    .trending-list-change { font-size: 0.6rem; color: #f97316; font-weight: 700; }
    .trending-list-cnt { font-size: 0.6rem; color: #d1d5db; }
    .trending-list-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.375rem; flex-shrink: 0; }
    .trending-list-price { font-size: 0.8rem; font-weight: 800; color: #ea580c; }

    /* Small steppers */
    .stepper-sm { display: flex; align-items: center; }
    .add-btn-sm { width: 1.5rem; height: 1.5rem; border-radius: 50%; background: #f97316; color: white; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .stepper-sm-active { background: #f97316; border-radius: 9999px; overflow: hidden; }
    .step-btn-sm { width: 1.25rem; height: 1.25rem; border: none; background: transparent; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; }
    .step-qty-sm { color: white; font-size: 0.65rem; font-weight: 800; min-width: 0.875rem; text-align: center; }
  `]
})
export class TrendingSectionComponent {
  private readonly cartService = inject(CartService);

  readonly top2 = TRENDING_ITEMS.slice(0, 2);
  readonly bottom3 = TRENDING_ITEMS.slice(2);

  getQty(t: TrendingItem): number {
    return this.cartService.getItemQuantity(t.item, t.restaurantId);
  }

  addItem(t: TrendingItem): void {
    const fakeRestaurant = { id: t.restaurantId, name: t.restaurantName } as Restaurant;
    this.cartService.addItem({ name: t.item, price: t.price }, fakeRestaurant);
  }

  removeItem(t: TrendingItem): void {
    const itemId = t.restaurantId + '-' + t.item.toLowerCase().replace(/\s+/g, '-');
    // Decrement: get current qty and set to qty-1
    const qty = this.cartService.getItemQuantity(t.item, t.restaurantId);
    this.cartService.updateQuantity(itemId, qty - 1);
  }
}
