import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { SupabaseService } from '../../services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const WHATSAPP = '917396018423';

const LOCATIONS = [
  { label: 'VIT-AP University', sublabel: 'Free Delivery', fee: 0  },
  { label: 'Ainavolu Village',  sublabel: '+ ₹10 delivery', fee: 10 },
];

const CATEGORY_CARDS = [
  { label: 'Biryani',   count: 6, big: true,  img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
  { label: 'Fast Food', count: 5, big: true,  img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&q=80' },
  { label: 'Tiffins',   count: 1, big: false, img: 'https://images.unsplash.com/photo-1630409351241-e90e7eb139b3?w=500&q=80' },
  { label: 'Fruits',    count: 1, big: false, img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80' },
  { label: 'Veg Meals', count: 2, big: false, img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80' },
];

const REVIEWS = [
  { name: 'Nikhil R.', block: 'B-Block',  stars: 5, text: "Spice Magic's biryani hits different at 9pm. Fast and always hot!" },
  { name: 'Swetha P.', block: 'A-Hostel', stars: 5, text: "CLGBITES is so easy to use. Noodles at ₹90 — can't beat that!" },
  { name: 'Rohit K.',  block: 'C-Block',  stars: 4, text: 'Palleturu mutton biryani is legit village-style. Loved it.' },
  { name: 'Anjali M.', block: 'D-Hostel', stars: 5, text: "WhatsApp checkout is genius — no account needed. Fresh dosa!" },
  { name: 'Sai T.',    block: 'A-Block',  stars: 5, text: 'Hotel Bheemasena butter chicken is 10/10. Ordered twice this week!' },
];

// isVeg flag on MenuCategory is the source of truth.
// isNonVeg(itemName, categoryIsVeg) uses the flag when set, falls back to keyword matching.
const isNonVeg = (itemName: string, categoryIsVeg?: boolean): boolean => {
  if (categoryIsVeg === true)  return false;
  if (categoryIsVeg === false) return true;
  return /chicken|mutton|fish|prawn|egg|lollipop|bone|wings|tandoori|apollo|kebab/i.test(itemName);
};

// ─── TYPES ────────────────────────────────────────────────────────────────────
interface CartItem      { restaurantId: string; restaurantName: string; itemName: string; price: number; qty: number; isVeg: boolean; }
type View = 'home' | 'category' | 'restaurant' | 'success';

// Live order row shown in ticker (built from Supabase orders table)
interface LiveOrderRow  { name: string; location: string; restaurant: string; item: string; mins: number; }

import { RESTAURANTS, Restaurant, MenuItem, MenuCategory } from '../../services/restaurants';


// Helper: get today's date at midnight (IST) as UTC string for Supabase comparison
function todayStart(): string {
  const now = new Date();
  // IST = UTC+5:30
  const ist = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear(), m = ist.getUTCMonth(), d = ist.getUTCDate();
  // Midnight IST = 18:30 UTC previous day
  const midnightIST = new Date(Date.UTC(y, m, d) - 5.5 * 60 * 60 * 1000);
  return midnightIST.toISOString();
}

function minutesAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- ══ SUCCESS ══════════════════════════════════════════════════════════════ -->
<div *ngIf="view==='success'" class="success-page">
  <div class="success-icon">✅</div>
  <h2 class="success-title">Order Placed!</h2>
  <p class="success-sub">Sent via WhatsApp. Restaurant will confirm soon.</p>
  <button class="success-btn" (click)="view='home'">Back to Home</button>
</div>

<!-- ══ CATEGORY PAGE ════════════════════════════════════════════════════════ -->
<div *ngIf="view==='category'" class="page">
  <div class="cat-header">
    <div class="cat-header-top">
      <button class="back-circle" (click)="view='home'; catSearch=''">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div>
        <h1 class="cat-title">{{ activeCatLabel==='All' ? 'All Restaurants' : activeCatLabel }}</h1>
        <p class="cat-count">{{ categoryList.length }} place{{ categoryList.length!==1?'s':'' }}{{ catSearch?' found':'' }}</p>
      </div>
    </div>
    <div class="search-wrap">
      <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <input class="search-input" type="text" placeholder="Search restaurants or dishes..." [(ngModel)]="catSearch"/>
      <button *ngIf="catSearch" class="search-clear" (click)="catSearch=''">✕</button>
    </div>
  </div>
  <div class="cat-list">
    <div *ngIf="categoryList.length===0" class="empty-state">
      <p>No results for "{{ catSearch }}"</p>
      <button (click)="catSearch=''">Clear search</button>
    </div>
    <div *ngFor="let r of categoryList" class="rest-card" (click)="openRestaurant(r)">
      <div class="rest-card-img-wrap">
        <img [src]="r.image" [alt]="r.name" class="rest-card-img"/>
        <div class="rest-card-overlay"></div>
        <div class="rest-card-bottom">
          <div><h4 class="rest-card-name">{{ r.name }}</h4><p class="rest-card-desc">{{ r.description }}</p></div>
          <span class="rest-card-rating">⭐ {{ r.rating }}</span>
        </div>
      </div>
      <div class="rest-card-body">
        <div class="rest-card-best"><span class="best-label">Best:</span><span class="best-value">{{ r.bestItem }}</span></div>
        <div class="rest-card-meta">
          <div class="rest-cats"><span *ngFor="let c of r.categories" class="rest-cat-tag">{{ c }}</span></div>
          <span class="rest-orders">👥 {{ getRestaurantOrders(r.id) }} today</span>
        </div>
        <div class="orders-bar-bg">
          <div class="orders-bar-fill" [style.width.%]="getRestaurantBarPct(r.id)"></div>
        </div>
      </div>
    </div>
  </div>
  <div class="cart-bar" *ngIf="cartCount>0" (click)="isCartOpen=true">
    <div class="cart-bar-left"><div class="cart-bar-count">{{ cartCount }}</div><span class="cart-bar-amount">₹{{ cartTotal }}</span></div>
    <span class="cart-bar-cta">View Cart 🛍</span>
  </div>
  <ng-container *ngIf="isCartOpen">
    <div class="sheet-backdrop" (click)="isCartOpen=false"></div>
    <ng-container *ngTemplateOutlet="cartSheet"></ng-container>
  </ng-container>
</div>

<!-- ══ HOME ═════════════════════════════════════════════════════════════════ -->
<div *ngIf="view==='home'" class="page">

  <!-- Header -->
  <div class="home-header">
    <div class="home-header-top">
      <h1 class="home-logo">CLGBITES</h1>
      <div class="campus-pill"><span class="campus-dot"></span><span class="campus-text">VIT-AP</span></div>
    </div>
    <div class="loc-wrap">
      <button class="loc-btn" (click)="locationOpen=!locationOpen">
        📍 <span class="loc-label">{{ LOCATIONS[locIndex].label }}</span> <span class="loc-chevron">▾</span>
      </button>
      <div class="loc-dropdown" *ngIf="locationOpen">
        <button *ngFor="let l of LOCATIONS; let i=index" class="loc-opt" [class.loc-opt-active]="i===locIndex" (click)="locIndex=i; locationOpen=false">
          <div><p class="loc-opt-name" [class.loc-opt-name-active]="i===locIndex">{{ l.label }}</p><p class="loc-opt-sub">{{ l.sublabel }}</p></div>
          <span *ngIf="i===locIndex" class="loc-dot"></span>
        </button>
      </div>
    </div>
    <div *ngIf="adminService && !adminService.isOrdersAccepting()" class="orders-off-banner">
      ❗ {{ adminService.settings().orders_off_message }}
    </div>

    <!-- Live Ticker from Supabase -->
    <div class="ticker" *ngIf="liveOrders.length > 0">
      <div class="ticker-avatar">{{ liveOrders[tickIdx].name[0] }}</div>
      <div class="ticker-info">
        <p class="ticker-main">
          <strong>{{ liveOrders[tickIdx].name }}</strong>
          <span class="ticker-muted"> · {{ liveOrders[tickIdx].location }} </span>
          <strong class="ticker-item">{{ liveOrders[tickIdx].item }}</strong>
        </p>
        <p class="ticker-sub">⏱ {{ liveOrders[tickIdx].mins }}m ago · {{ liveOrders[tickIdx].restaurant }}</p>
      </div>
      <span class="ticker-pulse"></span>
    </div>
    <!-- Placeholder while loading -->
    <div class="ticker ticker-loading" *ngIf="liveOrders.length === 0 && !ordersLoaded">
      <div class="ticker-shimmer"></div>
    </div>
    <div class="ticker" *ngIf="liveOrders.length === 0 && ordersLoaded">
      <div class="ticker-avatar">C</div>
      <div class="ticker-info">
        <p class="ticker-main"><strong>CLGBITES</strong><span class="ticker-muted"> · VIT-AP </span></p>
        <p class="ticker-sub">🍽 Be the first to order today!</p>
      </div>
    </div>
  </div>

  <!-- Category Dashboard -->
  <div class="section">
    <h2 class="section-h">What are you craving?</h2>
    <p class="section-p">Pick a category to find your spot</p>
    <div class="cat-big-grid">
      <button *ngFor="let cat of bigCats" class="cat-big-card" (click)="goCategory(cat.label)">
        <img [src]="cat.img" [alt]="cat.label" class="cat-img"/><div class="cat-overlay"></div>
        <div class="cat-info"><p class="cat-name">{{ cat.label }}</p><p class="cat-cnt">{{ cat.count }} Place{{ cat.count!==1?'s':'' }}</p></div>
      </button>
    </div>
    <div class="cat-small-grid">
      <button *ngFor="let cat of smallCats" class="cat-small-card" (click)="goCategory(cat.label)">
        <img [src]="cat.img" [alt]="cat.label" class="cat-img"/><div class="cat-overlay"></div>
        <div class="cat-info-sm"><p class="cat-name-sm">{{ cat.label }}</p><p class="cat-cnt-sm">{{ cat.count }} Place{{ cat.count!==1?'s':'' }}</p></div>
      </button>
      <button class="cat-small-card cat-all" (click)="goCategory('All')">
        <p class="cat-all-icon">⊞</p><p class="cat-all-text">All</p><p class="cat-all-cnt">{{ RESTAURANTS.length }} Places</p>
      </button>
    </div>
  </div>

  <!-- Trending — counts from Supabase -->
  <div class="section">
    <div class="trending-hdr">
      <div class="trending-title-grp">
        <div class="trending-icon-box">📈</div>
        <div><h2 class="trending-h">Trending at VIT-AP</h2><p class="trending-p">Most ordered today</p></div>
      </div>
      <div class="live-pill">✨ <span>Live</span></div>
    </div>

    <!-- Top 2 big trending cards -->
    <div class="trending-big-grid">
      <div *ngFor="let t of TRENDING.slice(0,2)" class="trend-big-card">
        <img [src]="t.img" [alt]="t.item" class="trend-big-img"/>
        <div class="trend-big-overlay"></div>
        <div class="trend-rank">#{{ t.rank }} 🔥</div>
        <div class="trend-change">↑{{ t.change }}%</div>
        <div class="trend-big-bottom">
          <p class="trend-big-name">{{ t.item }}</p>
          <p class="trend-big-orders">👥 {{ getTrendingCount(t.rid, t.item) }} orders</p>
          <div class="trend-big-foot">
            <span class="trend-big-price">₹{{ t.price }}</span>
            <ng-container *ngIf="gq(t.rid,t.item)===0">
              <button class="add-btn" (click)="uq(t.rid,t.rname,t.item,t.price,1)">+</button>
            </ng-container>
            <div class="stepper" *ngIf="gq(t.rid,t.item)>0">
              <button class="step-btn" (click)="uq(t.rid,t.rname,t.item,t.price,-1)">−</button>
              <span class="step-n">{{ gq(t.rid,t.item) }}</span>
              <button class="step-btn" (click)="uq(t.rid,t.rname,t.item,t.price,1)">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom 3 list rows -->
    <div class="trending-list">
      <div *ngFor="let t of TRENDING.slice(2)" class="trend-row">
        <div class="trend-thumb-wrap"><img [src]="t.img" [alt]="t.item" class="trend-thumb"/><div class="trend-thumb-rank">#{{ t.rank }}</div></div>
        <div class="trend-row-info">
          <p class="trend-row-name">{{ t.item }}</p>
          <p class="trend-row-meta"><span class="trend-rname">{{ t.rname }}</span><span class="trend-chg"> ↑{{ t.change }}%</span><span class="trend-cnt"> · {{ getTrendingCount(t.rid, t.item) }} orders</span></p>
        </div>
        <div class="trend-row-right">
          <span class="trend-row-price">₹{{ t.price }}</span>
          <ng-container *ngIf="gq(t.rid,t.item)===0">
            <button class="add-btn-sm" (click)="uq(t.rid,t.rname,t.item,t.price,1)">+</button>
          </ng-container>
          <div class="stepper stepper-sm" *ngIf="gq(t.rid,t.item)>0">
            <button class="step-btn step-btn-sm" (click)="uq(t.rid,t.rname,t.item,t.price,-1)">−</button>
            <span class="step-n">{{ gq(t.rid,t.item) }}</span>
            <button class="step-btn step-btn-sm" (click)="uq(t.rid,t.rname,t.item,t.price,1)">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reviews -->
  <div class="section">
    <div class="reviews-hdr">💬 <span class="reviews-h">What Students Say</span></div>
    <div class="reviews-scroll">
      <div *ngFor="let rv of REVIEWS" class="review-card">
        <div class="review-stars">{{ '⭐'.repeat(rv.stars) }}</div>
        <p class="review-text">"{{ rv.text }}"</p>
        <div class="review-author">
          <div class="review-av">{{ rv.name[0] }}</div>
          <div><p class="review-name">{{ rv.name }}</p><p class="review-block">{{ rv.block }}</p></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Contact -->
  <div class="section contact-section">
    <div class="contact-card">
      <p class="contact-title">Contact & Support</p>
      <a href="tel:7396018423" class="contact-row">
        <div class="contact-icon-box green-box">📞</div>
        <div><p class="contact-lbl">Admin</p><p class="contact-val">7396018423</p></div>
      </a>
      <div class="contact-divider"></div>
      <a href="mailto:clgbites@gmail.com" class="contact-row">
        <div class="contact-icon-box orange-box">✉️</div>
        <div><p class="contact-lbl">Email</p><p class="contact-val">clgbites&#64;gmail.com</p></div>
      </a>
      <p class="contact-footer">CLGBITES · VIT-AP University · Taxes: ₹0</p>
    </div>
  </div>

  <div class="cart-bar" *ngIf="cartCount>0" (click)="isCartOpen=true">
    <div class="cart-bar-left"><div class="cart-bar-count">{{ cartCount }}</div><span class="cart-bar-amount">₹{{ cartTotal }}</span></div>
    <span class="cart-bar-cta">View Cart 🛍</span>
  </div>
  <ng-container *ngIf="isCartOpen">
    <div class="sheet-backdrop" (click)="isCartOpen=false"></div>
    <ng-container *ngTemplateOutlet="cartSheet"></ng-container>
  </ng-container>
</div>

<!-- ══ RESTAURANT PAGE ═══════════════════════════════════════════════════════ -->
<div *ngIf="view==='restaurant' && activeRest" class="page">
  <div class="rest-hero">
    <img [src]="activeRest.image" [alt]="activeRest.name" class="rest-hero-img"/>
    <div class="rest-hero-overlay"></div>
    <button class="back-circle rest-back" (click)="view='home'">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div class="rest-hero-info">
      <h1 class="rest-hero-name">{{ activeRest.name }}</h1>
      <p class="rest-hero-desc">{{ activeRest.description }}</p>
      <div class="rest-hero-meta">
        <span class="rest-meta-pill">⭐ {{ activeRest.rating }}.0</span>
        <span class="rest-meta-pill">👥 {{ getRestaurantOrders(activeRest.id) }} today</span>
        <span class="rest-meta-pill">⏱ 25–35 min</span>
      </div>
    </div>
  </div>
  <div class="rest-subhdr">
    <div><p class="best-lbl-orange">Best Item</p><p class="best-val-gray">{{ activeRest.bestItem }}</p></div>
    <button class="veg-toggle" [class.veg-on]="vegOnly" (click)="vegOnly=!vegOnly">
      🌿 <span [class.text-green]="vegOnly">Veg Only</span>
    </button>
  </div>
  <div class="menu-list">
    <div *ngIf="filteredMenu.length===0" class="empty-state">No veg items available</div>
    <div *ngFor="let cat of filteredMenu" class="menu-section">
      <button class="menu-cat-hdr" (click)="toggleCat(cat.category)">
        <div class="menu-cat-left"><span class="menu-cat-name">{{ cat.category }}</span><span class="menu-cat-count">{{ cat.items.length }}</span></div>
        <span class="menu-chevron">{{ openCats[cat.category] ? '▲' : '▼' }}</span>
      </button>
      <div *ngIf="openCats[cat.category]" class="menu-items">
        <div *ngFor="let item of cat.items" class="menu-item-row">
          <div class="menu-item-left">
            <div class="menu-item-name-row">
              <span class="veg-dot" [class.nonveg]="!item.veg"><span class="veg-dot-inner" [class.nonveg-inner]="!item.veg"></span></span>
              <span class="menu-item-name">{{ item.name }}</span>
              <span *ngIf="item.isStudentChoice" class="student-pick">Student Pick</span>
            </div>
            <span class="menu-item-price">₹{{ item.price }}</span>
          </div>
          <ng-container *ngIf="gq(activeRest.id, item.name)===0">
            <button class="add-btn" (click)="uq(activeRest.id,activeRest.name,item.name,item.price,1,item.veg)">+</button>
          </ng-container>
          <div class="stepper" *ngIf="gq(activeRest.id,item.name)>0">
            <button class="step-btn" (click)="uq(activeRest.id,activeRest.name,item.name,item.price,-1,item.veg)">−</button>
            <span class="step-n">{{ gq(activeRest.id,item.name) }}</span>
            <button class="step-btn" (click)="uq(activeRest.id,activeRest.name,item.name,item.price,1,item.veg)">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="cart-bar" *ngIf="cartCount>0" (click)="isCartOpen=true">
    <div class="cart-bar-left"><div class="cart-bar-count">{{ cartCount }}</div><span class="cart-bar-amount">₹{{ cartTotal }}</span></div>
    <span class="cart-bar-cta">View Cart 🛍</span>
  </div>
  <ng-container *ngIf="isCartOpen">
    <div class="sheet-backdrop" (click)="isCartOpen=false"></div>
    <ng-container *ngTemplateOutlet="cartSheet"></ng-container>
  </ng-container>
</div>

<!-- ══ CART SHEET TEMPLATE ════════════════════════════════════════════════════ -->
<ng-template #cartSheet>
  <div class="sheet">
    <div class="sheet-handle-row"><div class="sheet-handle"></div></div>
    <div class="sheet-top">
      <h2 class="sheet-title">Your Order</h2>
      <button class="sheet-close" (click)="isCartOpen=false">✕</button>
    </div>
    <div class="sheet-body">
      <div class="sheet-items">
        <div *ngFor="let item of cart" class="sheet-item">
          <div class="sheet-item-left">
            <div class="sheet-item-name-row">
              <span class="veg-dot" [class.nonveg]="!item.isVeg"><span class="veg-dot-inner" [class.nonveg-inner]="!item.isVeg"></span></span>
              <span class="sheet-item-name">{{ item.itemName }}</span>
            </div>
            <p class="sheet-item-from">{{ item.restaurantName }} · ×{{ item.qty }}</p>
          </div>
          <span class="sheet-item-price">₹{{ item.price * item.qty }}</span>
        </div>
      </div>
      <div class="bill-box">
        <p class="bill-title">Bill Summary</p>
        <div class="bill-row"><span>Subtotal</span><span>₹{{ cartTotal }}</span></div>
        <div class="bill-row"><span>Delivery</span><span [class.green]="LOCATIONS[locIndex].fee===0">{{ LOCATIONS[locIndex].fee===0 ? 'FREE' : '₹'+LOCATIONS[locIndex].fee }}</span></div>
        <div class="bill-row"><span>Taxes</span><span class="green">₹0</span></div>
        <div class="bill-divider"></div>
        <div class="bill-row bill-total"><span>Total</span><span class="orange">₹{{ cartTotal + LOCATIONS[locIndex].fee }}</span></div>
      </div>
      <div class="delivery-section">
        <p class="delivery-lbl">Delivery Details</p>
        <input class="sheet-input" type="text" placeholder="Your Name" [(ngModel)]="customerName"/>
        <input class="sheet-input" type="tel" placeholder="Phone Number" [(ngModel)]="customerPhone"/>
        <div class="loc-picker">
          <button *ngFor="let l of LOCATIONS; let i=index" class="loc-pick-opt" [class.loc-pick-active]="i===locIndex" (click)="locIndex=i">
            <div><p class="loc-pick-name" [class.loc-pick-name-active]="i===locIndex">{{ l.label }}</p><p class="loc-pick-sub">{{ l.sublabel }}</p></div>
            <div class="loc-radio" [class.loc-radio-on]="i===locIndex"><span *ngIf="i===locIndex" class="loc-radio-dot"></span></div>
          </button>
        </div>
      </div>
      <div class="pay-section">
        <p class="delivery-lbl">Payment Mode</p>
        <div class="pay-btns">
          <button class="pay-btn" [class.pay-active]="payMode==='COD'" (click)="payMode='COD'">💵 Cash on Delivery</button>
          <button class="pay-btn" [class.pay-active]="payMode==='Prepay'" (click)="payMode='Prepay'">📲 Prepay</button>
        </div>
      </div>
    </div>
    <div class="sheet-footer">
      <!-- Shows spinner while saving to Supabase -->
      <button class="whatsapp-btn" (click)="checkout()" [disabled]="checkoutLoading">
        <span *ngIf="!checkoutLoading">Order on WhatsApp →</span>
        <span *ngIf="checkoutLoading" class="spinner-row">⏳ Saving order…</span>
      </button>
    </div>
  </div>
</ng-template>
  `,
  styles: [`
    :host { display:block; font-family:'Poppins',sans-serif; }
    * { box-sizing:border-box; margin:0; padding:0; }
    .page { min-height:100vh; background:#fff9f5; padding-bottom:7rem; }

    .success-page { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; background:white; padding:1.5rem; text-align:center; }
    .success-icon { font-size:4rem; margin-bottom:1.25rem; }
    .success-title { font-size:1.5rem; font-weight:900; color:#111827; margin-bottom:0.25rem; }
    .success-sub { font-size:0.8125rem; color:#9ca3af; margin-bottom:2rem; }
    .success-btn { background:#f97316; color:white; font-weight:700; font-size:0.9375rem; padding:0.875rem 2.5rem; border-radius:9999px; border:none; cursor:pointer; }

    .cat-header { background:white; border-bottom:1px solid #ffedd5; padding:1.25rem 1rem 0.75rem; }
    .cat-header-top { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem; }
    .cat-title { font-size:1.0625rem; font-weight:900; color:#111827; }
    .cat-count { font-size:0.6875rem; color:#9ca3af; margin-top:0.125rem; }
    .back-circle { width:2.25rem; height:2.25rem; background:#fff7ed; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }
    .search-wrap { position:relative; }
    .search-icon { position:absolute; left:0.75rem; top:50%; transform:translateY(-50%); }
    .search-input { width:100%; background:#fff7ed; border:1px solid #fed7aa; border-radius:0.75rem; padding:0.625rem 0.75rem 0.625rem 2.25rem; font-size:0.8125rem; outline:none; font-family:'Poppins',sans-serif; }
    .search-input:focus { border-color:#fb923c; }
    .search-clear { position:absolute; right:0.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; }
    .cat-list { padding:1rem; display:flex; flex-direction:column; gap:0.75rem; }
    .empty-state { text-align:center; padding:4rem 1rem; color:#9ca3af; font-size:0.8125rem; }
    .empty-state button { margin-top:0.75rem; color:#f97316; font-weight:700; font-size:0.8125rem; background:none; border:none; cursor:pointer; }
    .rest-card { background:white; border-radius:1rem; overflow:hidden; border:1px solid #fed7aa; cursor:pointer; transition:transform 0.15s; }
    .rest-card:active { transform:scale(0.98); }
    .rest-card-img-wrap { position:relative; height:8rem; }
    .rest-card-img { width:100%; height:100%; object-fit:cover; }
    .rest-card-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.65),transparent); }
    .rest-card-bottom { position:absolute; bottom:0; left:0; right:0; padding:0.625rem 0.75rem; display:flex; justify-content:space-between; align-items:flex-end; }
    .rest-card-name { font-weight:800; color:white; font-size:0.875rem; }
    .rest-card-desc { color:rgba(255,255,255,0.65); font-size:0.625rem; }
    .rest-card-rating { background:rgba(255,255,255,0.9); color:#15803d; font-weight:700; font-size:0.6875rem; padding:0.2rem 0.5rem; border-radius:0.5rem; flex-shrink:0; }
    .rest-card-body { padding:0.625rem 0.75rem 0.75rem; }
    .rest-card-best { display:flex; align-items:center; gap:0.25rem; margin-bottom:0.375rem; }
    .best-label { font-size:0.625rem; color:#f97316; font-weight:700; }
    .best-value { font-size:0.625rem; color:#6b7280; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
    .rest-card-meta { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.375rem; }
    .rest-cats { display:flex; gap:0.375rem; flex-wrap:wrap; }
    .rest-cat-tag { font-size:0.625rem; color:#6b7280; background:#fff7ed; border:1px solid #fed7aa; padding:0.125rem 0.5rem; border-radius:9999px; }
    .rest-orders { font-size:0.6875rem; font-weight:700; color:#ea580c; }
    .orders-bar-bg { height:4px; background:#f3f4f6; border-radius:9999px; overflow:hidden; }
    .orders-bar-fill { height:100%; border-radius:9999px; background:linear-gradient(to right,#fb923c,#fbbf24); transition:width 0.5s; }

    .home-header { background:white; border-bottom:1px solid #ffedd5; padding:1.25rem 1rem 0.75rem; }
    .home-header-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.25rem; }
    .home-logo { font-size:1.375rem; font-weight:900; letter-spacing:-0.04em; color:#111827; }
    .campus-pill { display:flex; align-items:center; gap:0.375rem; background:#fff7ed; border:1px solid #fed7aa; padding:0.375rem 0.625rem; border-radius:9999px; }
    .campus-dot { width:6px; height:6px; border-radius:50%; background:#f97316; animation:pa 1.5s infinite; }
    @keyframes pa { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .campus-text { font-size:0.6875rem; color:#ea580c; font-weight:600; }
    .loc-wrap { position:relative; margin-top:0.25rem; }
    .loc-btn { display:flex; align-items:center; gap:0.25rem; background:none; border:none; cursor:pointer; font-size:0.6875rem; color:#4b5563; font-weight:600; font-family:'Poppins',sans-serif; }
    .loc-chevron { color:#9ca3af; }
    .loc-dropdown { position:absolute; top:1.5rem; left:0; background:white; border:1px solid #f3f4f6; border-radius:1rem; box-shadow:0 10px 30px rgba(0,0,0,0.12); z-index:100; width:14rem; overflow:hidden; }
    .loc-opt { width:100%; display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border:none; border-bottom:1px solid #f9fafb; background:white; cursor:pointer; text-align:left; font-family:'Poppins',sans-serif; }
    .loc-opt:last-child { border-bottom:none; }
    .loc-opt-active { background:#fff7ed; }
    .loc-opt-name { font-size:0.8125rem; font-weight:700; color:#1f2937; }
    .loc-opt-name-active { color:#ea580c; }
    .loc-opt-sub { font-size:0.625rem; color:#9ca3af; }
    .loc-dot { width:8px; height:8px; border-radius:50%; background:#f97316; flex-shrink:0; }
    .orders-off-banner { background:#fee2e2; border:1px solid #fca5a5; border-radius:0.75rem; padding:0.5rem 0.75rem; color:#dc2626; font-weight:600; font-size:0.8125rem; margin-top:0.5rem; text-align:center; }
    .ticker { margin-top:0.75rem; background:#fff7ed; border:1px solid #fed7aa; border-radius:0.75rem; padding:0.625rem 0.75rem; display:flex; align-items:center; gap:0.625rem; min-height:3.25rem; }
    .ticker-loading { overflow:hidden; }
    .ticker-shimmer { width:100%; height:1.5rem; border-radius:0.5rem; background:linear-gradient(90deg,#ffedd5 25%,#fed7aa 50%,#ffedd5 75%); background-size:200% 100%; animation:sh 1.5s infinite; }
    @keyframes sh { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    .ticker-avatar { width:2rem; height:2rem; border-radius:50%; background:#f97316; color:white; font-size:0.75rem; font-weight:900; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .ticker-info { flex:1; min-width:0; }
    .ticker-main { font-size:0.75rem; color:#1f2937; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .ticker-item { color:#ea580c; }
    .ticker-muted { color:#9ca3af; }
    .ticker-sub { font-size:0.625rem; color:#9ca3af; margin-top:0.125rem; }
    .ticker-pulse { width:6px; height:6px; border-radius:50%; background:#fb923c; animation:pa 1.5s infinite; flex-shrink:0; }

    .section { padding:1.25rem 1rem 0; }
    .section-h { font-size:1.0625rem; font-weight:900; color:#111827; }
    .section-p { font-size:0.75rem; color:#9ca3af; margin:0.125rem 0 0.75rem; }

    .cat-big-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.625rem; margin-bottom:0.625rem; }
    .cat-big-card { position:relative; height:115px; border-radius:1rem; overflow:hidden; border:none; cursor:pointer; padding:0; transition:transform 0.15s; }
    .cat-big-card:active { transform:scale(0.97); }
    .cat-small-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.625rem; }
    .cat-small-card { position:relative; height:78px; border-radius:1rem; overflow:hidden; border:none; cursor:pointer; padding:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0.125rem; transition:transform 0.15s; }
    .cat-small-card:active { transform:scale(0.97); }
    .cat-all { background:linear-gradient(135deg,#fb923c,#fbbf24); }
    .cat-img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
    .cat-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.15) 50%,transparent 100%); }
    .cat-info { position:absolute; bottom:0.625rem; left:0.75rem; z-index:1; }
    .cat-name { color:white; font-size:0.9375rem; font-weight:800; }
    .cat-cnt { color:rgba(255,255,255,0.6); font-size:0.625rem; }
    .cat-info-sm { position:absolute; bottom:0.375rem; left:0.5rem; right:0.25rem; z-index:1; }
    .cat-name-sm { color:white; font-size:0.6875rem; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cat-cnt-sm { color:rgba(255,255,255,0.55); font-size:0.5625rem; }
    .cat-all-icon { color:rgba(255,255,255,0.85); font-size:1.25rem; z-index:1; position:relative; }
    .cat-all-text { color:white; font-size:0.6875rem; font-weight:800; z-index:1; position:relative; }
    .cat-all-cnt { color:rgba(255,255,255,0.6); font-size:0.5625rem; z-index:1; position:relative; }

    .trending-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
    .trending-title-grp { display:flex; align-items:center; gap:0.5rem; }
    .trending-icon-box { width:1.75rem; height:1.75rem; background:#f97316; border-radius:0.75rem; display:flex; align-items:center; justify-content:center; font-size:0.875rem; }
    .trending-h { font-size:0.875rem; font-weight:800; color:#111827; line-height:1; }
    .trending-p { font-size:0.625rem; color:#9ca3af; margin-top:0.125rem; }
    .live-pill { display:flex; align-items:center; gap:0.25rem; background:#fff7ed; border:1px solid #fed7aa; padding:0.25rem 0.5rem; border-radius:9999px; font-size:0.625rem; color:#ea580c; font-weight:700; }
    .trending-big-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.625rem; margin-bottom:0.75rem; }
    .trend-big-card { position:relative; border-radius:1rem; overflow:hidden; height:160px; }
    .trend-big-img { width:100%; height:100%; object-fit:cover; }
    .trend-big-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.25) 60%,transparent 100%); }
    .trend-rank { position:absolute; top:0.625rem; left:0.625rem; background:#f97316; color:white; font-size:0.5625rem; font-weight:900; padding:0.125rem 0.5rem; border-radius:9999px; }
    .trend-change { position:absolute; top:0.625rem; right:0.5rem; background:rgba(255,255,255,0.9); color:#c2410c; font-size:0.5625rem; font-weight:800; padding:0.125rem 0.375rem; border-radius:9999px; }
    .trend-big-bottom { position:absolute; bottom:0; left:0; right:0; padding:0.625rem; }
    .trend-big-name { color:white; font-weight:800; font-size:0.6875rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:0.125rem; }
    .trend-big-orders { color:rgba(255,255,255,0.6); font-size:0.5625rem; margin-bottom:0.5rem; }
    .trend-big-foot { display:flex; align-items:center; justify-content:space-between; }
    .trend-big-price { color:white; font-size:0.8125rem; font-weight:800; }
    .trending-list { display:flex; flex-direction:column; gap:0.5rem; }
    .trend-row { background:white; border:1px solid #fed7aa; border-radius:1rem; display:flex; align-items:center; gap:0.75rem; padding:0.625rem 0.75rem; }
    .trend-thumb-wrap { position:relative; width:2.75rem; height:2.75rem; border-radius:0.75rem; overflow:hidden; flex-shrink:0; }
    .trend-thumb { width:100%; height:100%; object-fit:cover; }
    .trend-thumb-rank { position:absolute; bottom:0; left:0; right:0; background:rgba(249,115,22,0.85); color:white; font-size:0.5rem; font-weight:900; text-align:center; padding:0.125rem 0; }
    .trend-row-info { flex:1; min-width:0; }
    .trend-row-name { font-weight:700; font-size:0.75rem; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .trend-row-meta { font-size:0.5625rem; margin-top:0.125rem; }
    .trend-rname { color:#9ca3af; }
    .trend-chg { color:#f97316; font-weight:700; }
    .trend-cnt { color:#d1d5db; }
    .trend-row-right { flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem; }
    .trend-row-price { font-size:0.8125rem; font-weight:800; color:#ea580c; }

    .add-btn { width:2rem; height:2rem; background:#f97316; border:none; border-radius:50%; cursor:pointer; color:white; font-size:1.25rem; font-weight:700; display:flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
    .add-btn-sm { width:1.625rem; height:1.625rem; background:#f97316; border:none; border-radius:50%; cursor:pointer; color:white; font-size:1rem; font-weight:700; display:flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
    .stepper { display:flex; align-items:center; background:#f97316; color:white; border-radius:9999px; overflow:hidden; flex-shrink:0; }
    .step-btn { width:1.75rem; height:1.75rem; border:none; background:none; color:white; font-size:0.875rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .step-n { min-width:1.25rem; text-align:center; font-size:0.75rem; font-weight:900; }
    .stepper-sm .step-btn { width:1.5rem; height:1.5rem; }

    .reviews-hdr { display:flex; align-items:center; gap:0.375rem; margin-bottom:0.75rem; font-size:0.875rem; }
    .reviews-h { font-size:0.8125rem; font-weight:800; color:#1f2937; }
    .reviews-scroll { display:flex; gap:0.75rem; overflow-x:auto; padding-bottom:0.25rem; scrollbar-width:none; }
    .reviews-scroll::-webkit-scrollbar { display:none; }
    .review-card { flex-shrink:0; width:14rem; background:white; border:1px solid #fed7aa; border-radius:1rem; padding:0.875rem; }
    .review-stars { font-size:0.75rem; }
    .review-text { font-size:0.6875rem; color:#4b5563; margin-top:0.5rem; line-height:1.5; }
    .review-author { display:flex; align-items:center; gap:0.375rem; margin-top:0.625rem; }
    .review-av { width:1.5rem; height:1.5rem; border-radius:50%; background:#ffedd5; display:flex; align-items:center; justify-content:center; font-size:0.625rem; font-weight:700; color:#ea580c; flex-shrink:0; }
    .review-name { font-size:0.625rem; font-weight:700; color:#374151; }
    .review-block { font-size:0.5625rem; color:#9ca3af; }

    .contact-section { padding-bottom:2rem; }
    .contact-card { background:white; border:1px solid #fed7aa; border-radius:1rem; padding:1rem; }
    .contact-title { font-size:0.8125rem; font-weight:800; color:#1f2937; margin-bottom:0.75rem; }
    .contact-row { display:flex; align-items:center; gap:0.625rem; padding:0.5rem 0; text-decoration:none; }
    .contact-icon-box { width:2rem; height:2rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.875rem; flex-shrink:0; }
    .green-box { background:#f0fdf4; }
    .orange-box { background:#fff7ed; }
    .contact-lbl { font-size:0.6875rem; color:#9ca3af; }
    .contact-val { font-size:0.8125rem; font-weight:700; color:#1f2937; }
    .contact-divider { height:1px; background:#f9fafb; }
    .contact-footer { font-size:0.625rem; color:#d1d5db; text-align:center; margin-top:0.5rem; }

    .cart-bar { position:fixed; bottom:1.25rem; left:1rem; right:1rem; background:#f97316; border-radius:1rem; display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; box-shadow:0 8px 24px rgba(249,115,22,0.35); cursor:pointer; z-index:40; }
    .cart-bar-left { display:flex; align-items:center; gap:0.625rem; }
    .cart-bar-count { background:rgba(255,255,255,0.2); color:white; font-size:0.875rem; font-weight:900; width:2rem; height:2rem; border-radius:0.75rem; display:flex; align-items:center; justify-content:center; }
    .cart-bar-amount { color:white; font-size:0.875rem; font-weight:700; }
    .cart-bar-cta { color:white; font-size:0.875rem; font-weight:700; }

    .sheet-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:50; }
    .sheet { position:fixed; bottom:0; left:0; right:0; background:white; border-radius:1.5rem 1.5rem 0 0; z-index:51; max-height:90vh; display:flex; flex-direction:column; }
    .sheet-handle-row { display:flex; justify-content:center; padding:0.75rem 0 0.25rem; }
    .sheet-handle { width:2.5rem; height:0.25rem; background:#e5e7eb; border-radius:9999px; }
    .sheet-top { display:flex; justify-content:space-between; align-items:center; padding:0.25rem 1.25rem 0.75rem; border-bottom:1px solid #f3f4f6; }
    .sheet-title { font-size:1.125rem; font-weight:900; color:#111827; }
    .sheet-close { width:2rem; height:2rem; background:#f3f4f6; border-radius:50%; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:0.875rem; color:#6b7280; }
    .sheet-body { overflow-y:auto; flex:1; padding:1rem 1.25rem; display:flex; flex-direction:column; gap:1.25rem; }
    .sheet-items { display:flex; flex-direction:column; gap:0.75rem; }
    .sheet-item { display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem; }
    .sheet-item-left { flex:1; }
    .sheet-item-name-row { display:flex; align-items:center; gap:0.375rem; }
    .sheet-item-name { font-size:0.8125rem; font-weight:600; color:#111827; }
    .sheet-item-from { font-size:0.6875rem; color:#9ca3af; margin-top:0.125rem; margin-left:1.125rem; }
    .sheet-item-price { font-size:0.8125rem; font-weight:800; color:#111827; }
    .bill-box { background:#fff7ed; border:1px solid #fed7aa; border-radius:1rem; padding:0.875rem; display:flex; flex-direction:column; gap:0.5rem; }
    .bill-title { font-size:0.6875rem; font-weight:700; color:#c2410c; text-transform:uppercase; letter-spacing:0.05em; }
    .bill-row { display:flex; justify-content:space-between; font-size:0.8125rem; color:#4b5563; }
    .bill-row span:last-child { font-weight:700; color:#1f2937; }
    .green { color:#16a34a !important; }
    .orange { color:#ea580c !important; }
    .bill-divider { height:1px; border-top:1px dashed #fed7aa; }
    .bill-total { font-weight:800; }
    .delivery-section { display:flex; flex-direction:column; gap:0.625rem; }
    .delivery-lbl { font-size:0.6875rem; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; }
    .sheet-input { width:100%; background:white; border:1px solid #e5e7eb; border-radius:0.75rem; padding:0.625rem 0.875rem; font-size:0.8125rem; outline:none; font-family:'Poppins',sans-serif; }
    .sheet-input:focus { border-color:#fb923c; }
    .loc-picker { background:white; border:1px solid #e5e7eb; border-radius:0.75rem; overflow:hidden; }
    .loc-pick-opt { width:100%; display:flex; align-items:center; justify-content:space-between; padding:0.625rem 0.875rem; border:none; border-bottom:1px solid #f9fafb; background:white; cursor:pointer; text-align:left; font-family:'Poppins',sans-serif; }
    .loc-pick-opt:last-child { border-bottom:none; }
    .loc-pick-active { background:#fff7ed; }
    .loc-pick-name { font-size:0.8125rem; font-weight:700; color:#1f2937; }
    .loc-pick-name-active { color:#ea580c; }
    .loc-pick-sub { font-size:0.625rem; color:#9ca3af; }
    .loc-radio { width:1rem; height:1rem; border-radius:50%; border:2px solid #d1d5db; display:flex; align-items:center; justify-content:center; }
    .loc-radio-on { border-color:#f97316; }
    .loc-radio-dot { width:0.5rem; height:0.5rem; border-radius:50%; background:#f97316; }
    .pay-section { display:flex; flex-direction:column; gap:0.5rem; }
    .pay-btns { display:flex; gap:0.5rem; }
    .pay-btn { flex:1; padding:0.625rem; border-radius:0.75rem; border:2px solid #e5e7eb; background:white; color:#6b7280; font-size:0.75rem; font-weight:700; cursor:pointer; font-family:'Poppins',sans-serif; }
    .pay-active { border-color:#f97316; background:#fff7ed; color:#ea580c; }
    .sheet-footer { padding:1rem 1.25rem 1.5rem; border-top:1px solid #f3f4f6; }
    .whatsapp-btn { width:100%; background:#22c55e; color:white; border:none; border-radius:1rem; padding:1rem; font-size:0.875rem; font-weight:700; cursor:pointer; font-family:'Poppins',sans-serif; }
    .whatsapp-btn:disabled { opacity:0.7; cursor:not-allowed; }
    .spinner-row { display:flex; align-items:center; justify-content:center; gap:0.5rem; }

    .rest-hero { position:relative; height:13rem; }
    .rest-hero-img { width:100%; height:100%; object-fit:cover; }
    .rest-hero-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.25) 50%,transparent 100%); }
    .rest-back { position:absolute; top:1rem; left:1rem; background:rgba(255,255,255,0.9) !important; }
    .rest-hero-info { position:absolute; bottom:1rem; left:1rem; right:1rem; color:white; }
    .rest-hero-name { font-size:1.25rem; font-weight:900; }
    .rest-hero-desc { font-size:0.6875rem; color:rgba(255,255,255,0.6); margin-top:0.125rem; }
    .rest-hero-meta { display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap; }
    .rest-meta-pill { display:flex; align-items:center; gap:0.25rem; background:rgba(255,255,255,0.2); backdrop-filter:blur(4px); padding:0.25rem 0.5rem; border-radius:0.5rem; font-size:0.6875rem; font-weight:500; }
    .rest-subhdr { background:white; border-bottom:1px solid #fed7aa; padding:0.625rem 1rem; display:flex; align-items:center; justify-content:space-between; }
    .best-lbl-orange { font-size:0.625rem; color:#f97316; font-weight:700; }
    .best-val-gray { font-size:0.6875rem; color:#4b5563; max-width:190px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
    .veg-toggle { display:flex; align-items:center; gap:0.375rem; border:2px solid #e5e7eb; border-radius:0.75rem; padding:0.375rem 0.625rem; background:white; cursor:pointer; font-size:0.6875rem; font-weight:700; color:#6b7280; font-family:'Poppins',sans-serif; }
    .veg-on { border-color:#22c55e; background:#f0fdf4; }
    .text-green { color:#15803d; }
    .menu-list { padding:0.75rem 1rem; display:flex; flex-direction:column; gap:0.5rem; }
    .menu-section { background:white; border:1px solid #fed7aa; border-radius:1rem; overflow:hidden; }
    .menu-cat-hdr { width:100%; display:flex; align-items:center; justify-content:space-between; padding:0.875rem 1rem; border:none; background:none; cursor:pointer; font-family:'Poppins',sans-serif; }
    .menu-cat-left { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }
    .menu-cat-name { font-size:0.8125rem; font-weight:800; color:#111827; }
    .menu-cat-count { font-size:0.625rem; color:#9ca3af; background:#fff7ed; border:1px solid #fed7aa; padding:0.125rem 0.375rem; border-radius:9999px; }
    .menu-chevron { font-size:0.75rem; color:#f97316; flex-shrink:0; }
    .menu-items { border-top:1px solid #f3f4f6; }
    .menu-item-row { display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid #f9fafb; }
    .menu-item-row:last-child { border-bottom:none; }
    .menu-item-left { flex:1; padding-right:1rem; }
    .menu-item-name-row { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.125rem; }
    .menu-item-name { font-size:0.8125rem; font-weight:600; color:#111827; }
    .student-pick { font-size:0.5625rem; background:#f97316; color:white; font-weight:900; padding:0.125rem 0.375rem; border-radius:9999px; flex-shrink:0; }
    .menu-item-price { font-size:0.8125rem; font-weight:800; color:#1f2937; margin-left:1.375rem; }
    .veg-dot { display:inline-flex; width:0.875rem; height:0.875rem; border-radius:0.125rem; border:2px solid #22c55e; align-items:center; justify-content:center; flex-shrink:0; }
    .veg-dot.nonveg { border-color:#ef4444; }
    .veg-dot-inner { width:0.4rem; height:0.4rem; border-radius:50%; background:#22c55e; }
    .veg-dot-inner.nonveg-inner { background:#ef4444; }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  private readonly sb = inject(SupabaseService);

  // ─── View state ───────────────────────────────────────────────────────────
  view: View = 'home';
  activeRest: Restaurant | null = null;
  activeCatLabel = '';
  cart: CartItem[] = [];
  isCartOpen = false;
  customerName = '';
  customerPhone = '';
  locIndex = 0;
  payMode: 'COD' | 'Prepay' = 'COD';
  vegOnly = false;
  openCats: Record<string, boolean> = {};
  locationOpen = false;
  catSearch = '';
  checkoutLoading = false;

  // ─── Supabase live data ───────────────────────────────────────────────────
  liveOrders: LiveOrderRow[] = [];   // ticker rows (all orders, oldest→newest)
  ordersLoaded = false;
  tickIdx = 0;                       // which order is currently shown in ticker

  // item order counts: key = "restaurantId::itemName"
  itemCounts: Record<string, number> = {};
  // restaurant order counts: key = restaurantId
  restaurantCounts: Record<string, number> = {};

  private tickInterval: any;
  private realtimeChannel: RealtimeChannel | null = null;

  // ─── Static refs ──────────────────────────────────────────────────────────
  readonly LOCATIONS = LOCATIONS;
  readonly RESTAURANTS = RESTAURANTS;
  readonly REVIEWS = REVIEWS;
  readonly isNonVeg = isNonVeg;
  readonly bigCats = CATEGORY_CARDS.filter(c => c.big);
  readonly smallCats = CATEGORY_CARDS.filter(c => !c.big);

  // Trending definition (rank/change static, counts from Supabase)
  readonly TRENDING = [
    { rank: 1, item: 'Mixed Biryani',              rid: 'spice-magic',        rname: 'Spice Magic',        price: 180, change: 12, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
    { rank: 2, item: 'Chicken Mughalai Biryani',   rid: 'hotel-mourya',       rname: 'Hotel Mourya',        price: 400, change: 8,  img: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80' },
    { rank: 3, item: 'Chicken Noodles',            rid: 'food-corner',        rname: 'Food Corner',         price: 90,  change: 5,  img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&q=80' },
    { rank: 4, item: '3 Pulkhas + Egg Burji Combo',rid: 'ruchi-pulkha-point', rname: 'Ruchi Pulkha Point',  price: 60,  change: 19, img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80' },
    { rank: 5, item: 'Masala Dosa',                rid: 'tiffens',            rname: 'Tiffins',             price: 55,  change: 3,  img: 'https://images.unsplash.com/photo-1630409351241-e90e7eb139b3?w=500&q=80' },
  ];

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  async ngOnInit() {
    await this.loadTodayOrders();
    this.subscribeRealtime();
    // Advance ticker every 3.5s cycling through all real orders
    this.tickInterval = setInterval(() => {
      if (this.liveOrders.length > 0) {
        this.tickIdx = (this.tickIdx + 1) % this.liveOrders.length;
      }
    }, 3500);
  }

  ngOnDestroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.realtimeChannel) this.sb.client.removeChannel(this.realtimeChannel);
  }

  // ─── Load today's orders from Supabase ───────────────────────────────────
  async loadTodayOrders() {
    const since = todayStart();
    const { data, error } = await this.sb.client
      .from('orders')
      .select('id, customer_name, items, created_at, token_number')
      .gte('created_at', since)
      .order('created_at', { ascending: true });   // oldest first → cycles 1 → last

    if (error || !data) { this.ordersLoaded = true; return; }

    this.processOrders(data);
    this.ordersLoaded = true;
  }

  // ─── Process raw orders into ticker + counts ──────────────────────────────
  processOrders(rawOrders: any[]) {
    const itemCounts: Record<string, number> = {};
    const restCounts: Record<string, number> = {};
    const liveRows: LiveOrderRow[] = [];

    for (const order of rawOrders) {
      const items: { name: string; qty: number; restaurant_name?: string }[] = order.items ?? [];
      if (!items.length) continue;

      const firstItem = items[0];
      const restName = firstItem.restaurant_name ?? '';

      // Find restaurantId from name
      const restObj = RESTAURANTS.find(r => r.name === restName);
      const restId = restObj?.id ?? restName.toLowerCase().replace(/\s+/g, '-');

      // Build one ticker row per order (showing first item)
      liveRows.push({
        name: order.customer_name ?? 'Student',
        location: LOCATIONS[0].label,  // default — stored in WhatsApp msg, not DB column yet
        restaurant: restName || 'CLGBITES',
        item: firstItem.name,
        mins: minutesAgo(order.created_at),
      });

      // Accumulate counts
      for (const it of items) {
        const rId = RESTAURANTS.find(r => r.name === it.restaurant_name)?.id ?? restId;
        const itemKey = `${rId}::${it.name}`;
        itemCounts[itemKey] = (itemCounts[itemKey] ?? 0) + (it.qty ?? 1);
        restCounts[rId] = (restCounts[rId] ?? 0) + (it.qty ?? 1);
      }
    }

    this.liveOrders = liveRows;
    this.itemCounts = itemCounts;
    this.restaurantCounts = restCounts;

    // Reset ticker index safely
    if (this.tickIdx >= liveRows.length) this.tickIdx = 0;
  }

  // ─── Realtime subscription — new orders appear instantly ──────────────────
  subscribeRealtime() {
    this.realtimeChannel = this.sb.client
      .channel('orders-live')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'orders',
      }, (payload) => {
        const newOrder = payload.new as any;
        // Append the new order to our local state without re-fetching
        const items: { name: string; qty: number; restaurant_name?: string }[] = newOrder.items ?? [];
        if (!items.length) return;

        const firstItem = items[0];
        const restName = firstItem.restaurant_name ?? '';
        const restObj = RESTAURANTS.find(r => r.name === restName);
        const restId = restObj?.id ?? restName.toLowerCase().replace(/\s+/g, '-');

        // Add to ticker
        const newRow: LiveOrderRow = {
          name: newOrder.customer_name ?? 'Student',
          location: LOCATIONS[0].label,
          restaurant: restName || 'CLGBITES',
          item: firstItem.name,
          mins: 0,
        };
        this.liveOrders = [...this.liveOrders, newRow];

        // Update counts
        const itemCounts = { ...this.itemCounts };
        const restCounts = { ...this.restaurantCounts };
        for (const it of items) {
          const rId = RESTAURANTS.find(r => r.name === it.restaurant_name)?.id ?? restId;
          const key = `${rId}::${it.name}`;
          itemCounts[key] = (itemCounts[key] ?? 0) + (it.qty ?? 1);
          restCounts[rId] = (restCounts[rId] ?? 0) + (it.qty ?? 1);
        }
        this.itemCounts = itemCounts;
        this.restaurantCounts = restCounts;
      })
      .subscribe();
  }

  // ─── Count helpers ────────────────────────────────────────────────────────
  getTrendingCount(rid: string, itemName: string): number {
    return this.itemCounts[`${rid}::${itemName}`] ?? 0;
  }

  getRestaurantOrders(rid: string): number {
    return this.restaurantCounts[rid] ?? 0;
  }

  getRestaurantBarPct(rid: string): number {
    const max = Math.max(...RESTAURANTS.map(r => this.getRestaurantOrders(r.id)), 1);
    return (this.getRestaurantOrders(rid) / max) * 100;
  }

  // ─── Cart ─────────────────────────────────────────────────────────────────
  get cartTotal() { return this.cart.reduce((s, i) => s + i.price * i.qty, 0); }
  get cartCount() { return this.cart.reduce((s, i) => s + i.qty, 0); }
  get deliveryFee() { return LOCATIONS[this.locIndex].fee; }

  gq(rid: string, name: string): number {
    return this.cart.find(i => i.restaurantId === rid && i.itemName === name)?.qty ?? 0;
  }

  uq(rid: string, rname: string, iname: string, price: number, delta: number, vegFlag = false) {
    const ex = this.cart.find(i => i.restaurantId === rid && i.itemName === iname);
    if (ex) {
      const nq = ex.qty + delta;
      if (nq <= 0) this.cart = this.cart.filter(i => !(i.restaurantId === rid && i.itemName === iname));
      else this.cart = this.cart.map(i => i.restaurantId === rid && i.itemName === iname ? { ...i, qty: nq } : i);
    } else if (delta > 0) {
      this.cart = [...this.cart, { restaurantId: rid, restaurantName: rname, itemName: iname, price, qty: 1, isVeg: vegFlag }];
    }
  }

  // ─── Navigation ───────────────────────────────────────────────────────────
  goCategory(label: string) { this.activeCatLabel = label; this.catSearch = ''; this.view = 'category'; }

  openRestaurant(r: Restaurant) {
    this.activeRest = r; this.view = 'restaurant'; this.vegOnly = false; this.catSearch = '';
    const init: Record<string, boolean> = {};
    r.menu.forEach((c, i) => { init[c.category] = i === 0; });
    this.openCats = init;
  }

  toggleCat(cat: string) { this.openCats = { ...this.openCats, [cat]: !this.openCats[cat] }; }

  get categoryList(): Restaurant[] {
    const base = this.activeCatLabel === 'All'
      ? [...RESTAURANTS].sort((a, b) => this.getRestaurantOrders(b.id) - this.getRestaurantOrders(a.id))
      : [...RESTAURANTS].filter(r => r.categories.includes(this.activeCatLabel))
          .sort((a, b) => this.getRestaurantOrders(b.id) - this.getRestaurantOrders(a.id));
    const q = this.catSearch.trim().toLowerCase();
    if (!q) return base;
    return base.filter(r =>
      r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) ||
      r.bestItem.toLowerCase().includes(q) ||
      r.menu.some(cat => cat.items.some(item => item.name.toLowerCase().includes(q)))
    );
  }

  get filteredMenu(): MenuCategory[] {
    if (!this.activeRest) return [];
    return this.activeRest.menu
      .map(cat => ({ ...cat, items: this.vegOnly ? cat.items.filter(i => i.veg === true) : cat.items }))
      .filter(cat => cat.items.length > 0);
  }

  // ─── Checkout: save to Supabase THEN open WhatsApp ────────────────────────
  async checkout() {
    if (!this.customerName.trim() || !this.customerPhone.trim()) {
      alert('Please fill your name and phone.');
      return;
    }

    this.checkoutLoading = true;

    const orderItems = this.cart.map(i => ({
      name: i.itemName,
      qty: i.qty,
      restaurant_name: i.restaurantName,
    }));

    const total = this.cartTotal + this.deliveryFee;
    const loc = LOCATIONS[this.locIndex];

    // ── Step 1: get atomic token via RPC (same as admin orders service) ──────
    let tokenNumber = 1;
    try {
      const { data: rpcData, error: rpcErr } = await this.sb.client.rpc('get_next_daily_token');
      if (!rpcErr && rpcData != null) {
        tokenNumber = rpcData as number;
      } else {
        // RPC not available — fall back to max(id)+1 which is safer than count+1
        const { data: maxRow } = await this.sb.client
          .from('orders')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single();
        tokenNumber = ((maxRow as any)?.id ?? 0) + 1;
      }
    } catch { tokenNumber = Date.now() % 100000; /* last resort unique-ish number */ }

    // ── Step 2: insert into Supabase ─────────────────────────────────────────
    const { error: insertError } = await this.sb.client.from('orders').insert([{
      id: tokenNumber,
      token_number: tokenNumber,
      customer_name: this.customerName.trim(),
      customer_phone: this.customerPhone.trim(),
      items: orderItems,
      payment_mode: this.payMode === 'COD' ? 'cod' : 'prepaid',
      total,
      deliver_status: 'pending',
      pay_status: 'pending',
    }]);

    if (insertError) {
      console.error('Supabase insert error:', insertError.message, insertError.details, insertError.hint);
      // If it's a duplicate ID, retry with timestamp-based ID
      if (insertError.code === '23505') {
        const fallbackId = Date.now() % 1000000;
        await this.sb.client.from('orders').insert([{
          id: fallbackId,
          token_number: fallbackId,
          customer_name: this.customerName.trim(),
          customer_phone: this.customerPhone.trim(),
          items: orderItems,
          payment_mode: this.payMode === 'COD' ? 'cod' : 'prepaid',
          total,
          deliver_status: 'pending',
          pay_status: 'pending',
        }]);
        tokenNumber = fallbackId;
      }
    }

    // ── Step 3: open WhatsApp ─────────────────────────────────────────────────
    let msg = `*🍽️ CLGBITES Order — Token #${tokenNumber}*\n\n`;
    msg += `*Name:* ${this.customerName.trim()}\n`;
    msg += `*Phone:* ${this.customerPhone.trim()}\n`;
    msg += `*Location:* ${loc.label}\n`;
    msg += `*Payment:* ${this.payMode}\n\n`;
    this.cart.forEach(i => { msg += `• ${i.qty}× ${i.itemName} (${i.restaurantName}) — ₹${i.price * i.qty}\n`; });
    msg += `\n*Subtotal:* ₹${this.cartTotal}`;
    if (this.deliveryFee) msg += `\n*Delivery:* ₹${this.deliveryFee}`;
    msg += `\n*Total:* ₹${total}\n*Token:* #${tokenNumber}`;

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');

    this.cart = [];
    this.isCartOpen = false;
    this.checkoutLoading = false;
    this.view = 'success';
  }
}