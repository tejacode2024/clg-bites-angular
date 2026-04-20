import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import type { Restaurant } from '../../services/restaurants';

@Component({
  selector: 'app-restaurant-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-anim" [style.animation-delay]="index * 0.08 + 's'">
      <button class="rest-card"
        [class.unavailable]="!isAvailable"
        (click)="navigate()"
        [attr.aria-label]="'Open ' + restaurant.name">

        <!-- Image strip -->
        <div class="img-wrap">
          <div *ngIf="!imageLoaded" class="shimmer" style="position:absolute;inset:0;"></div>
          <img [src]="restaurant.image" [alt]="restaurant.name"
            class="rest-img" [class.loaded]="imageLoaded" (load)="imageLoaded = true" />
          <div class="img-gradient"></div>

          <!-- Category badge -->
          <span class="tag-badge">{{ restaurant.categories[0] }}</span>

          <!-- Delivery badge -->
          <span class="delivery-badge">🌿 Free delivery</span>

          <!-- Unavailable overlay -->
          <div *ngIf="!isAvailable" class="unavail-overlay">🔴 Currently Unavailable</div>
        </div>

        <!-- Info row -->
        <div class="card-info">
          <div class="card-main">
            <p class="card-name">{{ restaurant.name }}</p>
            <p class="card-desc">{{ restaurant.description }}</p>
            <div class="stars-row">
              <span *ngFor="let s of stars" class="star" [class.filled]="s < restaurant.rating">★</span>
              <span class="rating-text">{{ restaurant.rating }}.0</span>
              <span class="dot">·</span>
              <span class="time-text">⏱ 20-35 min</span>
            </div>
          </div>
          <div class="price-col">
            <p class="from-label">From</p>
            <p class="min-price">₹{{ minPrice }}</p>
          </div>
        </div>
      </button>
    </div>
  `,
  styles: [`
    .card-anim { animation: fadeInUp 0.4s ease both; }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

    .rest-card {
      display: block; width: 100%; background: #ffffff; border: none;
      border-radius: 1rem; overflow: hidden; cursor: pointer; text-align: left;
      border: 1px solid #fde8c8; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
      transition: transform 0.2s, box-shadow 0.2s;
      -webkit-tap-highlight-color: transparent;
    }
    .rest-card:active { transform: scale(0.98); }
    .rest-card.unavailable { opacity: 0.6; }

    .img-wrap { position: relative; height: 90px; overflow: hidden; }
    .rest-img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.5s; }
    .rest-img.loaded { opacity: 1; }
    .img-gradient {
      position: absolute; inset: 0;
      background: linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 60%);
    }
    .tag-badge {
      position: absolute; top: 0.5rem; left: 0.5rem;
      font-size: 0.7rem; font-weight: 700; color: white;
      padding: 0.2rem 0.5rem; border-radius: 0.4rem;
      background: rgba(249,115,22,0.85); backdrop-filter: blur(4px);
    }
    .delivery-badge {
      position: absolute; top: 0.5rem; right: 0.5rem;
      font-size: 0.7rem; font-weight: 700;
      background: rgba(255,255,255,0.92); color: #16a34a;
      padding: 0.2rem 0.5rem; border-radius: 0.4rem;
    }
    .unavail-overlay {
      position: absolute; inset: 0; display: flex; align-items: center;
      justify-content: center; background: rgba(0,0,0,0.6);
      color: white; font-size: 0.8rem; font-weight: 700;
    }

    .card-info { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; }
    .card-main { flex: 1; min-width: 0; }
    .card-name { font-weight: 900; color: #111827; font-size: 0.875rem; line-height: 1.3; }
    .card-desc { color: #9ca3af; font-size: 0.72rem; margin-top: 0.125rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .stars-row { display: flex; align-items: center; gap: 0.15rem; margin-top: 0.375rem; }
    .star { font-size: 0.65rem; color: #e5e7eb; }
    .star.filled { color: #fbbf24; }
    .rating-text { font-size: 0.7rem; color: #9ca3af; margin-left: 0.2rem; }
    .dot { width: 3px; height: 3px; border-radius: 50%; background: #d1d5db; margin: 0 0.25rem; }
    .time-text { font-size: 0.7rem; color: #9ca3af; }

    .price-col { text-align: right; flex-shrink: 0; }
    .from-label { font-size: 0.65rem; color: #9ca3af; }
    .min-price { font-size: 1rem; font-weight: 900; color: #f97316; }
  `]
})
export class RestaurantCardComponent {
  @Input() restaurant!: Restaurant;
  @Input() index = 0;

  private readonly router = inject(Router);
  private readonly adminService = inject(AdminService);

  imageLoaded = false;
  readonly stars = [0, 1, 2, 3, 4];

  get isAvailable(): boolean { return this.adminService.isRestaurantAvailable(this.restaurant.id); }

  get minPrice(): number {
    const prices = this.restaurant.menu.flatMap(m => m.items).map(i => i.price);
    return prices.length ? Math.min(...prices) : 0;
  }

  navigate(): void { this.router.navigate(['/restaurant', this.restaurant.id]); }
}