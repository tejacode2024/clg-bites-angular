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
    <div class="card-wrap" (click)="navigate()" (keydown.enter)="navigate()" tabindex="0" role="button" [attr.aria-label]="'Open ' + restaurant.name">
      <div class="card" [class.unavailable]="!isAvailable">

        <!-- Image -->
        <div class="img-wrap">
          <div *ngIf="!imageLoaded" class="shimmer"></div>
          <img [src]="restaurant.image" [alt]="restaurant.name" class="rest-img" [class.loaded]="imageLoaded" (load)="imageLoaded = true"/>
          <div class="img-overlay"></div>
          <div *ngIf="!isAvailable" class="unavail-banner">🔴 Unavailable</div>
          <!-- Rating badge -->
          <div class="rating-badge">
            <span class="star">★</span> {{ restaurant.rating }}.0
          </div>
        </div>

        <!-- Info -->
        <div class="card-info">
          <h3 class="card-name">{{ restaurant.name }}</h3>
          <p class="card-desc">{{ restaurant.description }}</p>
          <div class="card-footer">
            <span class="orders-badge">🔥 {{ restaurant.todayOrders || 0 }}+ orders</span>
            <span class="arrow-icon">→</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-wrap { cursor: pointer; }
    .card-wrap:focus { outline: none; }
    .card {
      border-radius: 1rem; background: white;
      border: 1px solid #fed7aa;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(249,115,22,0.15); }
    .card.unavailable { opacity: 0.6; }
    .img-wrap { position: relative; aspect-ratio: 16/10; overflow: hidden; }
    .shimmer { position: absolute; inset: 0; background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%); animation: shimmer 1.5s infinite; }
    @keyframes shimmer { 0%{background-position:-200%} 100%{background-position:200%} }
    .rest-img { width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.4s, transform 0.5s; }
    .rest-img.loaded { opacity: 1; }
    .card:hover .rest-img { transform: scale(1.05); }
    .img-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.4), transparent, transparent); }
    .unavail-banner { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.75); color: white; font-size: 0.6875rem; font-weight: 700; text-align: center; padding: 0.25rem; }
    .rating-badge { position: absolute; top: 0.5rem; right: 0.5rem; background: rgba(255,255,255,0.95); border-radius: 9999px; padding: 0.2rem 0.5rem; font-size: 0.625rem; font-weight: 700; color: #1f2937; display: flex; align-items: center; gap: 0.125rem; }
    .star { color: #f59e0b; }
    .card-info { padding: 0.625rem 0.75rem 0.75rem; }
    .card-name { font-size: 0.875rem; font-weight: 700; color: #111827; margin: 0 0 0.125rem; transition: color 0.2s; }
    .card:hover .card-name { color: #f97316; }
    .card-desc { font-size: 0.6875rem; color: #6b7280; margin: 0 0 0.5rem; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 1; }
    .card-footer { display: flex; align-items: center; justify-content: space-between; }
    .orders-badge { font-size: 0.5625rem; font-weight: 600; color: #ea580c; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 9999px; padding: 0.1rem 0.4rem; }
    .arrow-icon { font-size: 0.75rem; color: #f97316; font-weight: 700; }
  `]
})
export class RestaurantCardComponent {
  @Input() restaurant!: Restaurant;
  @Input() index = 0;

  private readonly router = inject(Router);
  private readonly adminService = inject(AdminService);

  imageLoaded = false;

  get isAvailable(): boolean { return this.adminService.isRestaurantAvailable(this.restaurant.id); }
  navigate(): void { this.router.navigate(['/restaurant', this.restaurant.id]); }
}
