import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { SearchBarComponent } from '../../components/search-bar/search-bar.component';
import { CategoryFiltersComponent } from '../../components/category-filters/category-filters.component';
import { RestaurantCardComponent } from '../../components/restaurant-card/restaurant-card.component';
import { FloatingCartBarComponent } from '../../components/floating-cart-bar/floating-cart-bar.component';
import { FloatingEmojisComponent } from '../../components/floating-emojis/floating-emojis.component';
import { restaurants, Restaurant } from '../../services/restaurants';
import { isOrderingAllowed } from '../../services/time-utils';
import { AdminService } from '../../services/admin.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppHeaderComponent,
    SearchBarComponent,
    CategoryFiltersComponent,
    RestaurantCardComponent,
    FloatingCartBarComponent,
    FloatingEmojisComponent,
  ],
  template: `
    <div style="position:relative; min-height:100vh; background:var(--background); padding-bottom:6rem;">
      <app-floating-emojis></app-floating-emojis>
      <app-header></app-header>
   <div *ngIf="!adminService.isOrdersAccepting()" class="closed-banner">
  ❗ {{ adminService.settings().orders_off_message }}
</div>
<div *ngIf="adminService.settings().delivery_time" class="delivery-banner">
  🚚 Estimated Delivery Time: <strong>{{ adminService.settings().delivery_time }}</strong>
</div>
      <main style="position:relative;z-index:10;margin:0 auto;max-width:42rem;padding:1rem;">

        <!-- Multi-restaurant notice -->
        <div class="notice-bar fade-slide-in">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
            viewBox="0 0 24 24" stroke="var(--primary)" stroke-width="2" style="flex-shrink:0;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p style="color:var(--primary);font-weight:500;font-size:0.875rem;">
            Note: Ordering food from multiple restaurants in a single order is available.
          </p>
        </div>

        <!-- Search -->
        <!-- Search -->
        <div style="margin-bottom:1rem;">
          <app-search-bar [value]="search" (onChange)="search = $event; filterRestaurants()"></app-search-bar>
        </div>

        <!-- Veg Toggle -->
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1rem;">
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="onlyVeg" (change)="filterRestaurants()">
            <span class="slider"></span>
          </label>
          <span style="font-size:0.875rem;font-weight:600;color:#16a34a;">🥦 Only Veg</span>
        </div>

        <!-- Category Filters -->
        <div style="margin-bottom:1.25rem;">
          <app-category-filters [selected]="selectedCategory" (onSelect)="onCategorySelect($event)"></app-category-filters>
        </div>

        <!-- Restaurant Grid -->
        <section aria-label="Restaurants">
          <div *ngIf="filteredRestaurants.length > 0" class="restaurant-grid">
            <app-restaurant-card
              *ngFor="let restaurant of filteredRestaurants; let i = index"
              [restaurant]="restaurant"
              [index]="i"
            ></app-restaurant-card>
          </div>
          <div *ngIf="filteredRestaurants.length === 0" class="empty-state page-transition">
            <p style="font-size:1.125rem;font-weight:500;color:var(--muted-foreground);">No restaurants found</p>
            <p style="margin-top:0.25rem;font-size:0.875rem;color:var(--muted-foreground);">Try a different search or category</p>
          </div>
        </section>

        <!-- Footer -->
        <footer style="margin-top:2.5rem;padding-bottom:1.5rem;text-align:center;">
          <p style="font-size:0.75rem;color:var(--muted-foreground);">Made with care for college food lovers</p>
        </footer>
      </main>

      <app-floating-cart-bar></app-floating-cart-bar>

      
  `,
  styles: [`
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
    .notice-bar {
      display: flex; align-items: center; gap: 0.5rem;
      border-radius: 0.75rem; background: rgba(232,84,108,0.1);
      padding: 0.75rem 1rem; font-size: 0.875rem; margin-bottom: 1rem;
    }
    .restaurant-grid {
      display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem;
    }
    @media (min-width: 640px) { .restaurant-grid { gap: 1rem; } }
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 4rem 1rem;
    }
    .toggle { position:relative; display:inline-block; width:44px; height:24px; }
    .toggle input { opacity:0; width:0; height:0; }
    .slider { position:absolute; cursor:pointer; inset:0; background:#ccc; border-radius:24px; transition:0.3s; }
    .slider:before { position:absolute; content:""; height:18px; width:18px; left:3px; bottom:3px; background:white; border-radius:50%; transition:0.3s; }
    .toggle input:checked + .slider { background:#16a34a; }
    .toggle input:checked + .slider:before { transform:translateX(20px); }
  .delivery-banner {
  background: #dcfce7;
  border: 1px solid #86efac;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #16a34a;
  font-size: 0.875rem;
  margin: 0 1rem;
  margin-top:10px;
  text-align: center;
}
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  search = '';
  selectedCategory = 'All';
  filteredRestaurants: Restaurant[] = [];
  orderingAllowed = true;
  onlyVeg = false;
  private timerRef: any;
readonly adminService = inject(AdminService);
  ngOnInit(): void {
    this.filterRestaurants();
    this.checkTime();
    this.timerRef = setInterval(() => this.checkTime(), 60000);
  }

  ngOnDestroy(): void {
    if (this.timerRef) clearInterval(this.timerRef);
  }

  filterRestaurants(): void {
      this.filteredRestaurants = restaurants.filter((r) => {
      const matchesSearch =
        this.search === '' ||
        r.name.toLowerCase().includes(this.search.toLowerCase()) ||
        r.description.toLowerCase().includes(this.search.toLowerCase());
      const matchesCategory =
        this.selectedCategory === 'All' || r.categories.includes(this.selectedCategory);
      const matchesVeg = !this.onlyVeg || r.menu.some(cat => cat.isVeg === true);
      return matchesSearch && matchesCategory && matchesVeg;
    });
  }

  onCategorySelect(category: string): void {
    this.selectedCategory = category;
    this.filterRestaurants();
  }

  private checkTime(): void {
    this.orderingAllowed = isOrderingAllowed();
  }
}
