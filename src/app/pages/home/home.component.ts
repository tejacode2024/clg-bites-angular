import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AdminService } from '../../services/admin.service';
import { restaurants } from '../../services/restaurants';

interface ActivityItem { name: string; block: string; item: string; restaurant: string; mins: number; }
interface TrendingItem { rank: number; item: string; rid: string; rname: string; price: number; count: number; change: number; img: string; }
interface CategoryCard { label: string; count: number; big: boolean; img: string; }
interface ReviewItem { name: string; block: string; stars: number; text: string; }
interface LocationItem { label: string; sublabel: string; }

const ACTIVITY: ActivityItem[] = [
  { name:'Ravi',   block:'B-Block',  item:'Mixed Biryani',            restaurant:'Spice Magic',         mins:2  },
  { name:'Priya',  block:'A-Hostel', item:'Chicken Mughalai Biryani', restaurant:'Hotel Mourya',         mins:4  },
  { name:'Kiran',  block:'C-Block',  item:'Chicken Noodles',          restaurant:'Food Corner',          mins:6  },
  { name:'Sai',    block:'B-Hostel', item:'Mutton Biryani',           restaurant:'Palleturu Palaharam',  mins:9  },
  { name:'Anjali', block:'A-Block',  item:'Masala Dosa',              restaurant:'Tiffins',              mins:11 },
  { name:'Arjun',  block:'C-Hostel', item:'3 Pulkhas + Egg Burji',    restaurant:'Ruchi Pulkha Point',   mins:14 },
];

const TRENDING: TrendingItem[] = [
  { rank:1, item:'Mixed Biryani',              rid:'spice-magic',        rname:'Spice Magic',         price:180, count:54, change:12, img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
  { rank:2, item:'Chicken Mughalai Biryani',   rid:'hotel-mourya',       rname:'Hotel Mourya',         price:400, count:41, change:8,  img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80' },
  { rank:3, item:'Chicken Noodles',            rid:'food-corner',        rname:'Food Corner',          price:90,  count:37, change:5,  img:'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&q=80' },
  { rank:4, item:'3 Pulkhas + Egg Burji Combo',rid:'ruchi-pulkha-point', rname:'Ruchi Pulkha Point',   price:60,  count:31, change:19, img:'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80' },
  { rank:5, item:'Masala Dosa',                rid:'tiffens',            rname:'Tiffins',              price:55,  count:27, change:3,  img:'https://images.unsplash.com/photo-1630409351241-e90e7eb139b3?w=500&q=80' },
];

const CATEGORY_CARDS: CategoryCard[] = [
  { label:'Biryani',   count:4, big:true,  img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
  { label:'Fast Food', count:2, big:true,  img:'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&q=80' },
  { label:'Tiffins',   count:1, big:false, img:'https://images.unsplash.com/photo-1630409351241-e90e7eb139b3?w=500&q=80' },
  { label:'Fruits',    count:1, big:false, img:'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80' },
  { label:'Veg Meals', count:2, big:false, img:'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80' },
];

const REVIEWS: ReviewItem[] = [
  { name:'Nikhil R.', block:'B-Block',  stars:5, text:"Spice Magic's biryani hits different at 9pm. Fast and always hot!" },
  { name:'Swetha P.', block:'A-Hostel', stars:5, text:"CLGBITES is so easy to use. Noodles at ₹90 — can't beat that!" },
  { name:'Rohit K.',  block:'C-Block',  stars:4, text:'Palleturu mutton biryani is legit village-style. Loved it.' },
  { name:'Anjali M.', block:'D-Hostel', stars:5, text:"WhatsApp checkout is genius — no account needed. Fresh dosa!" },
  { name:'Sai T.',    block:'A-Block',  stars:5, text:'Hotel Bheemasena butter chicken is 10/10. Ordered twice this week!' },
];

const LOCATIONS: LocationItem[] = [
  { label:'VIT-AP Main Campus',   sublabel:'Amaravati, AP' },
  { label:'Boys Hostel Block A',  sublabel:'On-campus' },
  { label:'Boys Hostel Block B',  sublabel:'On-campus' },
  { label:'Girls Hostel',         sublabel:'On-campus' },
  { label:'Academic Block',       sublabel:'Near Canteen' },
];

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="page-root">

  <!-- HEADER -->
  <div class="header-bar">
    <div class="header-top">
      <h1 class="logo">CLGBITES</h1>
      <div class="campus-badge">
        <span class="pulse-dot"></span>
        <span class="campus-label">VIT-AP</span>
      </div>
    </div>

    <!-- Location Picker -->
    <div class="loc-wrapper">
      <button class="loc-btn" (click)="locationOpen = !locationOpen">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span class="loc-name">{{ locations[locIndex].label }}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="loc-dropdown" *ngIf="locationOpen">
        <button *ngFor="let loc of locations; let i = index"
          class="loc-option" [class.loc-active]="i === locIndex"
          (click)="locIndex = i; locationOpen = false">
          <div>
            <p class="loc-option-label" [class.loc-option-selected]="i === locIndex">{{ loc.label }}</p>
            <p class="loc-option-sub">{{ loc.sublabel }}</p>
          </div>
          <span *ngIf="i === locIndex" class="loc-dot-sel"></span>
        </button>
      </div>
    </div>

    <!-- Live Activity Ticker -->
    <div class="ticker">
      <div class="ticker-avatar">{{ liveActivity.name[0] }}</div>
      <div class="ticker-body">
        <p class="ticker-main">
          <strong>{{ liveActivity.name }}</strong>
          <span class="ticker-muted"> · {{ liveActivity.block }} </span>
          <strong class="ticker-item">{{ liveActivity.item }}</strong>
        </p>
        <p class="ticker-sub">⏱ {{ liveActivity.mins }}m ago · {{ liveActivity.restaurant }}</p>
      </div>
      <span class="ticker-pulse"></span>
    </div>
  </div>

  <!-- Closed / Delivery Banners -->
  <div *ngIf="!adminService.isOrdersAccepting()" class="closed-banner">
    ❗ {{ adminService.settings().orders_off_message }}
  </div>
  <div *ngIf="adminService.settings().delivery_time" class="delivery-banner">
    🚚 Estimated Delivery: <strong>{{ adminService.settings().delivery_time }}</strong>
  </div>

  <!-- CATEGORY SECTION -->
  <div class="section">
    <h2 class="section-title">What are you craving?</h2>
    <p class="section-sub">Pick a category to find your spot</p>

    <div class="cat-grid-big">
      <button *ngFor="let cat of bigCategories" class="cat-card-big" (click)="goToCategory(cat.label)">
        <img [src]="cat.img" [alt]="cat.label" class="cat-img"/>
        <div class="cat-overlay"></div>
        <div class="cat-label-wrap">
          <p class="cat-label-text">{{ cat.label }}</p>
          <p class="cat-label-count">{{ cat.count }} Place{{ cat.count !== 1 ? 's' : '' }}</p>
        </div>
      </button>
    </div>

    <div class="cat-grid-small">
      <button *ngFor="let cat of smallCategories" class="cat-card-small" (click)="goToCategory(cat.label)">
        <img [src]="cat.img" [alt]="cat.label" class="cat-img"/>
        <div class="cat-overlay"></div>
        <div class="cat-label-wrap-sm">
          <p class="cat-label-text-sm">{{ cat.label }}</p>
          <p class="cat-label-count-sm">{{ cat.count }} Place{{ cat.count !== 1 ? 's' : '' }}</p>
        </div>
      </button>
      <button class="cat-card-small cat-card-all" (click)="goToCategory('All')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="2" style="position:relative;z-index:1"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <p class="cat-all-text">All</p>
        <p class="cat-all-count">{{ allRestaurantCount }} Places</p>
      </button>
    </div>
  </div>

  <!-- TRENDING SECTION -->
  <div class="section">
    <div class="trending-header">
      <div class="trending-title-group">
        <div class="trending-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
        </div>
        <div>
          <h2 class="trending-title">Trending at VIT-AP</h2>
          <p class="trending-sub">Most ordered today</p>
        </div>
      </div>
      <div class="live-pill">
        <span style="color:#f97316;font-size:0.5rem;">★</span>
        <span class="live-label">Live</span>
      </div>
    </div>

    <!-- Top 2 big trending -->
    <div class="trending-big-grid">
      <div *ngFor="let t of trendingTop" class="trending-big-card">
        <img [src]="t.img" [alt]="t.item" class="trending-big-img"/>
        <div class="trending-big-overlay"></div>
        <div class="trending-rank-badge">#{{ t.rank }} 🔥</div>
        <div class="trending-change-badge">↑{{ t.change }}%</div>
        <div class="trending-big-bottom">
          <p class="trending-big-name">{{ t.item }}</p>
          <p class="trending-orders">👥 {{ t.count }} orders</p>
          <div class="trending-big-foot">
            <span class="trending-big-price">₹{{ t.price }}</span>
            <ng-container *ngIf="getQty(t.rid, t.item) === 0; else stepperBig">
              <button class="add-first-btn" (click)="addToCart($event, t.rid, t.rname, t.item, t.price)">+</button>
            </ng-container>
            <ng-template #stepperBig>
              <div class="stepper-row">
                <button class="stepper-btn" (click)="decCart($event, t.rid, t.item)">−</button>
                <span class="stepper-qty">{{ getQty(t.rid, t.item) }}</span>
                <button class="stepper-btn" (click)="addToCart($event, t.rid, t.rname, t.item, t.price)">+</button>
              </div>
            </ng-template>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom 3 trending rows -->
    <div class="trending-list">
      <div *ngFor="let t of trendingRest" class="trending-list-row">
        <div class="trending-thumb-wrap">
          <img [src]="t.img" [alt]="t.item" class="trending-thumb"/>
          <div class="trending-thumb-rank">#{{ t.rank }}</div>
        </div>
        <div class="trending-list-info">
          <p class="trending-list-name">{{ t.item }}</p>
          <p class="trending-list-meta">
            <span class="trending-list-rname">{{ t.rname }}</span>
            <span class="trending-list-change"> ↑{{ t.change }}%</span>
            <span class="trending-list-orders"> · {{ t.count }} orders</span>
          </p>
        </div>
        <div class="trending-list-right">
          <span class="trending-list-price">₹{{ t.price }}</span>
          <ng-container *ngIf="getQty(t.rid, t.item) === 0; else stepperList">
            <button class="add-first-btn-sm" (click)="addToCart($event, t.rid, t.rname, t.item, t.price)">+</button>
          </ng-container>
          <ng-template #stepperList>
            <div class="stepper-row stepper-sm">
              <button class="stepper-btn stepper-btn-sm" (click)="decCart($event, t.rid, t.item)">−</button>
              <span class="stepper-qty stepper-qty-sm">{{ getQty(t.rid, t.item) }}</span>
              <button class="stepper-btn stepper-btn-sm" (click)="addToCart($event, t.rid, t.rname, t.item, t.price)">+</button>
            </div>
          </ng-template>
        </div>
      </div>
    </div>
  </div>

  <!-- REVIEWS SECTION -->
  <div class="section">
    <div class="reviews-header">
      <span>💬</span>
      <h2 class="reviews-title">What Students Say</h2>
    </div>
    <div class="reviews-scroll">
      <div *ngFor="let rv of reviews" class="review-card">
        <div class="review-stars">{{ getStarsStr(rv.stars) }}</div>
        <p class="review-text">"{{ rv.text }}"</p>
        <div class="review-author">
          <div class="review-avatar">{{ rv.name[0] }}</div>
          <div>
            <p class="review-name">{{ rv.name }}</p>
            <p class="review-block">{{ rv.block }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CONTACT SECTION -->
  <div class="section contact-section">
    <div class="contact-card">
      <p class="contact-title">Contact & Support</p>
      <a href="tel:7396018423" class="contact-row">
        <div class="contact-icon contact-icon-green">📞</div>
        <div>
          <p class="contact-label">Admin</p>
          <p class="contact-value">7396018423</p>
        </div>
      </a>
      <div class="contact-divider"></div>
      <a href="mailto:clgbites@gmail.com" class="contact-row">
        <div class="contact-icon contact-icon-orange">✉️</div>
        <div>
          <p class="contact-label">Email</p>
          <p class="contact-value">clgbites&#64;gmail.com</p>
        </div>
      </a>
      <p class="contact-footer">CLGBITES · VIT-AP University · Taxes: ₹0</p>
    </div>
  </div>

  <!-- FLOATING CART BAR -->
  <div class="cart-bar" *ngIf="cartCount > 0" (click)="goToCart()">
    <div class="cart-bar-left">
      <div class="cart-bar-badge">{{ cartCount }}</div>
      <span class="cart-bar-label">items in cart</span>
    </div>
    <div class="cart-bar-right">
      <span class="cart-bar-total">₹{{ cartTotal }}</span>
      <span class="cart-bar-cta">View Cart →</span>
    </div>
  </div>
</div>
  `,
  styles: [`
    :host { display: block; font-family: 'Poppins', sans-serif; }
    .page-root { min-height: 100vh; background: #fff9f5; padding-bottom: 6rem; }

    /* HEADER */
    .header-bar { background: white; border-bottom: 1px solid #ffedd5; padding: 1.25rem 1rem 0.75rem; }
    .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.25rem; }
    .logo { font-size: 1.375rem; font-weight: 900; letter-spacing: -0.04em; color: #111827; }
    .campus-badge { display: flex; align-items: center; gap: 0.375rem; background: #fff7ed; border: 1px solid #fed7aa; padding: 0.375rem 0.625rem; border-radius: 9999px; }
    .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #f97316; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .campus-label { font-size: 0.6875rem; color: #ea580c; font-weight: 600; }

    /* Location */
    .loc-wrapper { position: relative; margin-top: 0.25rem; }
    .loc-btn { display: flex; align-items: center; gap: 0.25rem; background: none; border: none; cursor: pointer; padding: 0; }
    .loc-name { font-size: 0.6875rem; color: #4b5563; font-weight: 600; }
    .loc-dropdown { position: absolute; top: 1.5rem; left: 0; background: white; border: 1px solid #f3f4f6; border-radius: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.12); z-index: 100; width: 14rem; overflow: hidden; }
    .loc-option { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border: none; border-bottom: 1px solid #f9fafb; background: white; cursor: pointer; text-align: left; }
    .loc-option:last-child { border-bottom: none; }
    .loc-active { background: #fff7ed; }
    .loc-option-label { font-size: 0.8125rem; font-weight: 700; color: #1f2937; }
    .loc-option-selected { color: #ea580c; }
    .loc-option-sub { font-size: 0.625rem; color: #9ca3af; }
    .loc-dot-sel { width: 8px; height: 8px; border-radius: 50%; background: #f97316; flex-shrink: 0; }

    /* Ticker */
    .ticker { margin-top: 0.75rem; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 0.75rem; padding: 0.625rem 0.75rem; display: flex; align-items: center; gap: 0.625rem; }
    .ticker-avatar { width: 2rem; height: 2rem; border-radius: 50%; background: #f97316; color: white; font-size: 0.75rem; font-weight: 900; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ticker-body { flex: 1; min-width: 0; }
    .ticker-main { font-size: 0.75rem; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
    .ticker-item { color: #ea580c; }
    .ticker-muted { color: #9ca3af; }
    .ticker-sub { font-size: 0.625rem; color: #9ca3af; margin: 0.125rem 0 0; }
    .ticker-pulse { width: 6px; height: 6px; border-radius: 50%; background: #fb923c; animation: pulse 1.5s infinite; flex-shrink: 0; }

    /* Banners */
    .closed-banner { background: #fee2e2; border: 1px solid #fca5a5; border-radius: 0.75rem; padding: 0.75rem 1rem; color: #dc2626; font-weight: 600; font-size: 0.875rem; margin: 0.75rem 1rem; text-align: center; }
    .delivery-banner { background: #dcfce7; border: 1px solid #86efac; border-radius: 0.75rem; padding: 0.625rem 1rem; color: #16a34a; font-size: 0.875rem; margin: 0.5rem 1rem; text-align: center; }

    /* SECTIONS */
    .section { padding: 1.25rem 1rem 0; }
    .section-title { font-size: 1.0625rem; font-weight: 900; color: #111827; margin: 0; }
    .section-sub { font-size: 0.75rem; color: #9ca3af; margin: 0.125rem 0 0.75rem; }

    /* Category cards */
    .cat-grid-big { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; margin-bottom: 0.625rem; }
    .cat-card-big { position: relative; height: 115px; border-radius: 1rem; overflow: hidden; border: none; cursor: pointer; padding: 0; transition: transform 0.15s; }
    .cat-card-big:active { transform: scale(0.97); }
    .cat-grid-small { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.625rem; }
    .cat-card-small { position: relative; height: 78px; border-radius: 1rem; overflow: hidden; border: none; cursor: pointer; padding: 0; transition: transform 0.15s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.125rem; }
    .cat-card-small:active { transform: scale(0.97); }
    .cat-card-all { background: linear-gradient(135deg, #fb923c, #fbbf24); }
    .cat-img { width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0; }
    .cat-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.15) 50%, transparent 100%); }
    .cat-label-wrap { position: absolute; bottom: 0.625rem; left: 0.75rem; z-index: 1; text-align: left; }
    .cat-label-text { color: white; font-size: 0.9375rem; font-weight: 800; margin: 0; }
    .cat-label-count { color: rgba(255,255,255,0.6); font-size: 0.625rem; margin: 0; }
    .cat-label-wrap-sm { position: absolute; bottom: 0.375rem; left: 0.5rem; right: 0.25rem; z-index: 1; text-align: left; }
    .cat-label-text-sm { color: white; font-size: 0.6875rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0; }
    .cat-label-count-sm { color: rgba(255,255,255,0.55); font-size: 0.5625rem; margin: 0; }
    .cat-all-text { color: white; font-size: 0.6875rem; font-weight: 800; z-index: 1; position: relative; margin: 0; }
    .cat-all-count { color: rgba(255,255,255,0.6); font-size: 0.5625rem; z-index: 1; position: relative; margin: 0; }

    /* TRENDING */
    .trending-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .trending-title-group { display: flex; align-items: center; gap: 0.5rem; }
    .trending-icon { width: 1.75rem; height: 1.75rem; background: #f97316; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; }
    .trending-title { font-size: 0.875rem; font-weight: 800; color: #111827; margin: 0; line-height: 1; }
    .trending-sub { font-size: 0.625rem; color: #9ca3af; margin: 0.125rem 0 0; }
    .live-pill { display: flex; align-items: center; gap: 0.25rem; background: #fff7ed; border: 1px solid #fed7aa; padding: 0.25rem 0.5rem; border-radius: 9999px; }
    .live-label { font-size: 0.625rem; color: #ea580c; font-weight: 700; }

    .trending-big-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.625rem; margin-bottom: 0.75rem; }
    .trending-big-card { position: relative; border-radius: 1rem; overflow: hidden; height: 160px; }
    .trending-big-img { width: 100%; height: 100%; object-fit: cover; }
    .trending-big-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 60%, transparent 100%); }
    .trending-rank-badge { position: absolute; top: 0.625rem; left: 0.625rem; background: #f97316; color: white; font-size: 0.5625rem; font-weight: 900; padding: 0.125rem 0.5rem; border-radius: 9999px; }
    .trending-change-badge { position: absolute; top: 0.625rem; right: 0.5rem; background: rgba(255,255,255,0.9); color: #c2410c; font-size: 0.5625rem; font-weight: 800; padding: 0.125rem 0.375rem; border-radius: 9999px; }
    .trending-big-bottom { position: absolute; bottom: 0; left: 0; right: 0; padding: 0.625rem; }
    .trending-big-name { color: white; font-weight: 800; font-size: 0.6875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 0 0.125rem; }
    .trending-orders { color: rgba(255,255,255,0.6); font-size: 0.5625rem; margin: 0 0 0.5rem; }
    .trending-big-foot { display: flex; align-items: center; justify-content: space-between; }
    .trending-big-price { color: white; font-size: 0.8125rem; font-weight: 800; }

    .trending-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .trending-list-row { background: white; border: 1px solid #fed7aa; border-radius: 1rem; display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 0.75rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .trending-thumb-wrap { position: relative; width: 2.75rem; height: 2.75rem; border-radius: 0.75rem; overflow: hidden; flex-shrink: 0; }
    .trending-thumb { width: 100%; height: 100%; object-fit: cover; }
    .trending-thumb-rank { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(249,115,22,0.85); color: white; font-size: 0.5rem; font-weight: 900; text-align: center; padding: 0.125rem 0; }
    .trending-list-info { flex: 1; min-width: 0; }
    .trending-list-name { font-weight: 700; font-size: 0.75rem; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 0 0.125rem; }
    .trending-list-meta { font-size: 0.5625rem; margin: 0; }
    .trending-list-rname { color: #9ca3af; }
    .trending-list-change { color: #f97316; font-weight: 700; }
    .trending-list-orders { color: #d1d5db; }
    .trending-list-right { flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem; }
    .trending-list-price { font-size: 0.8125rem; font-weight: 800; color: #ea580c; }

    /* Stepper / Add */
    .add-first-btn { width: 1.75rem; height: 1.75rem; background: #f97316; border: none; border-radius: 50%; cursor: pointer; color: white; font-size: 1.125rem; font-weight: 700; display: flex; align-items: center; justify-content: center; line-height: 1; }
    .add-first-btn-sm { width: 1.5rem; height: 1.5rem; background: #f97316; border: none; border-radius: 50%; cursor: pointer; color: white; font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; line-height: 1; }
    .stepper-row { display: flex; align-items: center; gap: 0.375rem; }
    .stepper-btn { width: 1.75rem; height: 1.75rem; border-radius: 50%; border: 1.5px solid #f97316; background: white; color: #f97316; font-weight: 700; font-size: 0.875rem; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; }
    .stepper-qty { font-size: 0.8125rem; font-weight: 800; color: #1f2937; min-width: 1rem; text-align: center; }
    .stepper-sm .stepper-btn { width: 1.375rem; height: 1.375rem; font-size: 0.75rem; }
    .stepper-btn-sm { width: 1.375rem !important; height: 1.375rem !important; font-size: 0.75rem !important; }
    .stepper-qty-sm { font-size: 0.6875rem; }

    /* REVIEWS */
    .reviews-header { display: flex; align-items: center; gap: 0.375rem; margin-bottom: 0.75rem; }
    .reviews-title { font-size: 0.8125rem; font-weight: 800; color: #1f2937; margin: 0; }
    .reviews-scroll { display: flex; gap: 0.75rem; overflow-x: auto; padding-bottom: 0.25rem; scrollbar-width: none; }
    .reviews-scroll::-webkit-scrollbar { display: none; }
    .review-card { flex-shrink: 0; width: 14rem; background: white; border: 1px solid #fed7aa; border-radius: 1rem; padding: 0.875rem; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .review-stars { font-size: 0.75rem; }
    .review-text { font-size: 0.6875rem; color: #4b5563; margin: 0.5rem 0 0; line-height: 1.5; }
    .review-author { display: flex; align-items: center; gap: 0.375rem; margin-top: 0.625rem; }
    .review-avatar { width: 1.5rem; height: 1.5rem; border-radius: 50%; background: #ffedd5; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 700; color: #ea580c; flex-shrink: 0; }
    .review-name { font-size: 0.625rem; font-weight: 700; color: #374151; margin: 0; }
    .review-block { font-size: 0.5625rem; color: #9ca3af; margin: 0; }

    /* CONTACT */
    .contact-section { padding-bottom: 2rem; }
    .contact-card { background: white; border: 1px solid #fed7aa; border-radius: 1rem; padding: 1rem; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .contact-title { font-size: 0.8125rem; font-weight: 800; color: #1f2937; margin: 0 0 0.75rem; }
    .contact-row { display: flex; align-items: center; gap: 0.625rem; padding: 0.5rem 0; text-decoration: none; }
    .contact-icon { width: 2rem; height: 2rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 0.875rem; }
    .contact-icon-green { background: #f0fdf4; }
    .contact-icon-orange { background: #fff7ed; }
    .contact-label { font-size: 0.6875rem; color: #9ca3af; margin: 0; }
    .contact-value { font-size: 0.8125rem; font-weight: 700; color: #1f2937; margin: 0; }
    .contact-divider { height: 1px; background: #f9fafb; margin: 0; }
    .contact-footer { font-size: 0.625rem; color: #d1d5db; text-align: center; margin: 0.5rem 0 0; }

    /* CART BAR */
    .cart-bar { position: fixed; bottom: 1rem; left: 1rem; right: 1rem; background: #f97316; border-radius: 1rem; display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; box-shadow: 0 8px 24px rgba(249,115,22,0.4); cursor: pointer; z-index: 50; animation: slideUp 0.3s ease; }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .cart-bar-left { display: flex; align-items: center; gap: 0.625rem; }
    .cart-bar-badge { background: white; color: #f97316; font-size: 0.75rem; font-weight: 900; width: 1.5rem; height: 1.5rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
    .cart-bar-label { color: rgba(255,255,255,0.8); font-size: 0.75rem; }
    .cart-bar-right { display: flex; align-items: center; gap: 0.75rem; }
    .cart-bar-total { color: white; font-size: 0.9375rem; font-weight: 800; }
    .cart-bar-cta { color: white; font-size: 0.8125rem; font-weight: 700; }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

  readonly locations = LOCATIONS;
  readonly reviews = REVIEWS;
  readonly trendingTop = TRENDING.slice(0, 2);
  readonly trendingRest = TRENDING.slice(2);
  readonly bigCategories = CATEGORY_CARDS.filter(c => c.big);
  readonly smallCategories = CATEGORY_CARDS.filter(c => !c.big);

  locIndex = 0;
  locationOpen = false;
  actIdx = 0;
  private tickInterval: any;

  get liveActivity() { return ACTIVITY[this.actIdx]; }
  get allRestaurantCount() { return restaurants.length; }
  get cartCount() { return this.cartService.totalItems(); }
  get cartTotal() { return this.cartService.totalAmount(); }

  constructor() {
    effect(() => { this.adminService.settings(); });
  }

  ngOnInit(): void {
    this.tickInterval = setInterval(() => {
      this.actIdx = (this.actIdx + 1) % ACTIVITY.length;
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  getQty(rid: string, itemName: string): number {
    return this.cartService.getItemQuantity(itemName, rid);
  }

  addToCart(event: Event, rid: string, rname: string, itemName: string, price: number): void {
    event.stopPropagation();
    const fakeMenuItem = { name: itemName, price, description: '', isVeg: false };
    const fakeRestaurant = { id: rid, name: rname, image: '', description: '', categories: [], menu: [], rating: 0 } as any;
    this.cartService.addItem(fakeMenuItem as any, fakeRestaurant);
  }

  decCart(event: Event, rid: string, itemName: string): void {
    event.stopPropagation();
    const itemId = `${rid}-${itemName.toLowerCase().replace(/\s+/g, '-')}`;
    const currentQty = this.cartService.getItemQuantity(itemName, rid);
    this.cartService.updateQuantity(itemId, currentQty - 1);
  }

  getStarsStr(n: number): string {
    return '⭐'.repeat(n);
  }

  goToCategory(label: string): void {
    this.router.navigate(['/'], { queryParams: { category: label } });
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }
}
