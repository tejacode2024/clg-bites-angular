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
    <div class="card-anim" [style.animation-delay]="index * 0.1 + 's'">
      <div class="card card-hover"
        [class.unavailable]="!isAvailable"
        (click)="navigate()" (keydown.enter)="navigate()"
        tabindex="0" role="button" [attr.aria-label]="'Open ' + restaurant.name">

        <div class="img-wrap">
          <div *ngIf="!imageLoaded" class="shimmer" style="position:absolute;inset:0;"></div>
          <img [src]="restaurant.image" [alt]="restaurant.name" class="restaurant-img"
            [class.loaded]="imageLoaded" (load)="imageLoaded = true" />
          <div class="img-overlay"></div>

          <!-- Unavailable banner -->
          <div *ngIf="!isAvailable" class="unavail-banner">🔴 Currently Unavailable</div>

          <button class="fav-btn" (click)="toggleFavorite($event)">
            <span [style.color]="isFavorite ? 'var(--primary)' : '#9ca3af'">{{ isFavorite ? '❤️' : '🤍' }}</span>
          </button>
        </div>

        <div class="card-info">
          <h3 class="card-name">{{ restaurant.name }}</h3>
          <p class="card-desc">{{ restaurant.description }}</p>
          <div class="stars-row">
            <span *ngFor="let s of stars">{{ s < restaurant.rating ? '⭐' : '☆' }}</span>
            <span class="rating-text">({{ restaurant.rating }}.0)</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card-anim { animation: fadeInUp 0.4s ease both; }
    @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
    .card { display:block; width:100%; overflow:hidden; border-radius:1rem; background:var(--card); box-shadow:0 1px 2px rgba(0,0,0,0.05); cursor:pointer; }
    .card.unavailable { opacity:0.65; }
    .card:focus { outline:2px solid rgba(232,84,108,0.3); }
    .img-wrap { position:relative; aspect-ratio:16/10; overflow:hidden; }
    .restaurant-img { width:100%; height:100%; object-fit:cover; opacity:0; transition:opacity 0.5s,transform 0.7s; }
    .restaurant-img.loaded { opacity:1; }
    .card:hover .restaurant-img { transform:scale(1.1); }
    .img-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(26,26,46,0.3),transparent,transparent); opacity:0; transition:opacity 0.3s; }
    .card:hover .img-overlay { opacity:1; }
    .unavail-banner { position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.7); color:white; font-size:0.75rem; font-weight:600; text-align:center; padding:0.375rem; }
    .fav-btn { position:absolute; right:0.75rem; top:0.75rem; z-index:10; border:none; cursor:pointer; border-radius:50%; background:rgba(255,255,255,0.9); padding:0.4rem; display:flex; align-items:center; font-size:1rem; }
    .card-info { padding:0.75rem; }
    .card-name { font-size:1rem; font-weight:600; color:var(--card-foreground); transition:color 0.2s; }
    .card:hover .card-name { color:var(--primary); }
    .card-desc { margin-top:0.125rem; font-size:0.75rem; color:var(--muted-foreground); overflow:hidden; display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:1; }
    .stars-row { display:flex; align-items:center; gap:0.1rem; margin-top:0.5rem; font-size:0.75rem; }
    .rating-text { font-size:0.75rem; color:var(--muted-foreground); margin-left:0.25rem; }
  `]
})
export class RestaurantCardComponent {
  @Input() restaurant!: Restaurant;
  @Input() index = 0;

  private readonly router = inject(Router);
  private readonly adminService = inject(AdminService);

  imageLoaded = false;
  isFavorite = false;
  readonly stars = [0, 1, 2, 3, 4];

  get isAvailable(): boolean { return this.adminService.isRestaurantAvailable(this.restaurant.id); }

  navigate(): void { this.router.navigate(['/restaurant', this.restaurant.id]); }
  toggleFavorite(e: MouseEvent): void { e.preventDefault(); e.stopPropagation(); this.isFavorite = !this.isFavorite; }
}
