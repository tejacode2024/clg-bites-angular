import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { SupabaseService } from '../../services/supabase.service';
import { RESTAURANTS, Restaurant, MenuCategory } from '../../services/restaurants';
import { RealtimeChannel } from '@supabase/supabase-js';

const WHATSAPP = '917842960252';
const LOCATIONS = [
  { label: 'VIT-AP University', sublabel: 'Free Delivery', fee: 0  },
  { label: 'Ainavolu Village',  sublabel: '+ ₹10 delivery', fee: 10 },
];
const REVIEWS = [
  { name: 'Nikhil R.', block: 'B-Block',  stars: 5, text: "Spice Magic's biryani hits different at 9pm. Fast and always hot!" },
  { name: 'Swetha P.', block: 'A-Hostel', stars: 5, text: "CLGBITES is so easy to use. Noodles at ₹90 — can't beat that!" },
  { name: 'Rohit K.',  block: 'C-Block',  stars: 4, text: 'Palleturu mutton biryani is legit village-style. Loved it.' },
  { name: 'Anjali M.', block: 'D-Hostel', stars: 5, text: "WhatsApp checkout is genius — no account needed. Fresh dosa!" },
  { name: 'Sai T.',    block: 'A-Block',  stars: 5, text: 'Hotel Bheemasena butter chicken is 10/10. Ordered twice this week!' },
];
const CATEGORY_CARDS = [
  { label: 'Biryani',   count: 6, img: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
  { label: 'Fast Food', count: 5, img: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&q=80' },
  { label: 'Tiffins',   count: 1, img: 'https://images.unsplash.com/photo-1630409351241-e90e7eb139b3?w=500&q=80' },
  { label: 'Fruits',    count: 1, img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=500&q=80' },
  { label: 'Veg Meals', count: 2, img: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80' },
];
const TRENDING = [
  { rank:1, item:'Mixed Biryani',              rid:'spice-magic',        rname:'Spice Magic',        price:180, change:12, img:'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80' },
  { rank:2, item:'Chicken Mughalai Biryani',   rid:'hotel-mourya',       rname:'Hotel Mourya',        price:400, change:8,  img:'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=500&q=80' },
  { rank:3, item:'Chicken Noodles',            rid:'food-corner',        rname:'Food Corner',         price:90,  change:5,  img:'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&q=80' },
  { rank:4, item:'3 Pulkhas + Egg Burji Combo',rid:'ruchi-pulkha-point', rname:'Ruchi Pulkha Point',  price:60,  change:19, img:'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500&q=80' },
  { rank:5, item:'Masala Dosa',                rid:'tiffens',            rname:'Tiffins',             price:55,  change:3,  img:'https://images.unsplash.com/photo-1630409351241-e90e7eb139b3?w=500&q=80' },
];

interface CartItem { restaurantId:string; restaurantName:string; itemName:string; price:number; qty:number; isVeg:boolean; }
interface LiveOrderRow { name:string; location:string; restaurant:string; item:string; mins:number; }
type View = 'home'|'category'|'restaurant'|'success'|'profile'|'cart';

function todayStart(): string {
  const now = new Date();
  const ist = new Date(now.getTime() + 5.5*60*60*1000);
  const y=ist.getUTCFullYear(), m=ist.getUTCMonth(), d=ist.getUTCDate();
  return new Date(Date.UTC(y,m,d) - 5.5*60*60*1000).toISOString();
}
function minutesAgo(iso:string): number {
  return Math.floor((Date.now()-new Date(iso).getTime())/60000);
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- ══ SUCCESS ══════════════════════════════════════════════════════════════ -->
<div *ngIf="view==='success'" class="pg flex-col-center" style="background:white;padding:1.5rem;text-align:center">
  <div class="suc-icon"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
  <h2 class="suc-title">Order Placed!</h2>
  <p class="suc-sub">Sent via WhatsApp. Restaurant will confirm soon.</p>
  <button class="suc-btn" (click)="view='home'">Back to Home</button>
</div>

<!-- ══ CART PAGE ═════════════════════════════════════════════════════════════ -->
<div *ngIf="view==='cart'" class="pg" style="padding-bottom:5rem">
  <div class="pg-header">
    <button class="back-circle" (click)="view='home'"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
    <div><h1 class="pg-title">My Cart</h1><p class="pg-sub">{{ cartCount > 0 ? cartCount+' item'+(cartCount!==1?'s':'')+' · ₹'+cartTotal : 'Empty' }}</p></div>
  </div>

  <!-- Empty -->
  <div *ngIf="cartCount===0" class="empty-cart">
    <div class="empty-bag"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fdba74" stroke-width="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></div>
    <h2 class="empty-h">Your cart is empty</h2>
    <p class="empty-p">Add items from your favourite restaurants to get started</p>
    <button class="orange-pill-btn" (click)="goCategory('All')">Browse Restaurants</button>
  </div>

  <!-- Items grouped by restaurant -->
  <div *ngIf="cartCount>0" class="px4 space-y3">
    <div *ngFor="let group of cartByRestaurant" class="cart-group">
      <div class="cart-group-hdr">
        <div class="rest-initial">{{ group.name[0] }}</div>
        <p class="cart-group-name">{{ group.name }}</p>
      </div>
      <div class="cart-group-items">
        <div *ngFor="let item of group.items" class="cart-item-row">
          <div class="cart-item-left">
            <span class="veg-dot" [class.nonveg]="!item.isVeg"><span class="veg-dot-inner" [class.nonveg-inner]="!item.isVeg"></span></span>
            <div>
              <p class="cart-item-name">{{ item.itemName }}</p>
              <p class="cart-item-price">₹{{ item.price }} each</p>
            </div>
          </div>
          <div class="cart-item-right">
            <span class="cart-item-total">₹{{ item.price*item.qty }}</span>
            <div class="stepper">
              <button class="step-btn" (click)="uq(item.restaurantId,item.restaurantName,item.itemName,item.price,-1,item.isVeg)">−</button>
              <span class="step-n">{{ item.qty }}</span>
              <button class="step-btn" (click)="uq(item.restaurantId,item.restaurantName,item.itemName,item.price,1,item.isVeg)">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bill -->
    <div class="bill-box">
      <p class="bill-title">Bill Summary</p>
      <div class="bill-row"><span>Subtotal</span><span>₹{{ cartTotal }}</span></div>
      <div class="bill-row"><span>Delivery</span><span [class.green]="LOCATIONS[locIndex].fee===0">{{ LOCATIONS[locIndex].fee===0?'FREE':'₹'+LOCATIONS[locIndex].fee }}</span></div>
      <div class="bill-row"><span>Taxes</span><span class="green">₹0</span></div>
      <div class="bill-divider"></div>
      <div class="bill-row bill-total"><span>Total</span><span class="orange">₹{{ cartTotal+LOCATIONS[locIndex].fee }}</span></div>
    </div>

    <!-- Delivery details -->
    <div class="card-box space-y3">
      <p class="section-label">Delivery Details</p>
      <input class="sheet-input" type="text" placeholder="Your Name" [(ngModel)]="customerName"/>
      <input class="sheet-input" type="tel" placeholder="Phone Number" [(ngModel)]="customerPhone"/>
      <div class="loc-picker">
        <button *ngFor="let l of LOCATIONS; let i=index" class="loc-pick-opt" [class.loc-pick-active]="i===locIndex" (click)="locIndex=i">
          <div><p class="loc-pick-name" [class.active-text]="i===locIndex">{{ l.label }}</p><p class="loc-pick-sub">{{ l.sublabel }}</p></div>
          <div class="loc-radio" [class.loc-radio-on]="i===locIndex"><span *ngIf="i===locIndex" class="loc-radio-dot"></span></div>
        </button>
      </div>
    </div>

    <!-- Payment -->
    <div class="card-box">
      <p class="section-label">Payment Mode</p>
      <div class="pay-btns">
        <button class="pay-btn" [class.pay-active]="payMode==='COD'" (click)="payMode='COD'">💵 Cash on Delivery</button>
        <button class="pay-btn" [class.pay-active]="payMode==='Prepay'" (click)="payMode='Prepay'">📲 Prepay</button>
      </div>
    </div>

    <button class="wa-btn" (click)="checkout()" [disabled]="checkoutLoading">
      <span *ngIf="!checkoutLoading">Order on WhatsApp →</span>
      <span *ngIf="checkoutLoading">⏳ Saving…</span>
    </button>
  </div>
  <ng-container *ngTemplateOutlet="bottomNav; context:{active:'cart'}"></ng-container>
</div>

<!-- ══ PROFILE PAGE ══════════════════════════════════════════════════════════ -->
<div *ngIf="view==='profile'" class="pg" style="padding-bottom:5rem">
  <div class="profile-hero">
    <div class="profile-av">{{ customerName?customerName[0].toUpperCase():'S' }}</div>
    <div>
      <p class="profile-name">{{ customerName||'Welcome, Student!' }}</p>
      <p class="profile-sub">{{ customerPhone||'VIT-AP University' }}</p>
    </div>
  </div>
  <div class="px4 space-y3" style="margin-top:-1.5rem">
    <div class="profile-stats">
      <div class="stat-cell"><p class="stat-val">{{ cartCount }}</p><p class="stat-lbl">In Cart</p></div>
      <div class="stat-cell stat-mid"><p class="stat-val">₹{{ cartTotal }}</p><p class="stat-lbl">Cart Value</p></div>
      <div class="stat-cell"><p class="stat-val">{{ RESTAURANTS.length }}</p><p class="stat-lbl">Restaurants</p></div>
    </div>
    <a href="tel:7842960252" class="profile-link"><div class="profile-link-icon green-icon">📞</div><div class="profile-link-body"><p class="profile-link-title">Contact Support</p><p class="profile-link-sub">7842960252</p></div><span class="profile-link-arrow">›</span></a>
    <a href="mailto:clgbites@gmail.com" class="profile-link"><div class="profile-link-icon orange-icon">✉️</div><div class="profile-link-body"><p class="profile-link-title">Email Us</p><p class="profile-link-sub">clgbites&#64;gmail.com</p></div><span class="profile-link-arrow">›</span></a>
    <button class="profile-link" (click)="view='cart'"><div class="profile-link-icon orange-icon">🛍</div><div class="profile-link-body"><p class="profile-link-title">My Cart</p><p class="profile-link-sub">{{ cartCount>0?cartCount+' item'+(cartCount!==1?'s':''):'Empty cart' }}</p></div><span class="profile-link-arrow">›</span></button>
    <div class="profile-link"><div class="profile-link-icon orange-icon">✨</div><div class="profile-link-body"><p class="profile-link-title">About CLGBITES</p><p class="profile-link-sub">For VIT-AP students, by VIT-AP</p></div></div>
  </div>
  <ng-container *ngTemplateOutlet="cartBarTpl"></ng-container>
  <ng-container *ngTemplateOutlet="bottomNav; context:{active:'profile'}"></ng-container>
  <ng-container *ngIf="isCartOpen"><div class="sheet-backdrop" (click)="isCartOpen=false"></div><ng-container *ngTemplateOutlet="cartSheet"></ng-container></ng-container>
</div>

<!-- ══ CATEGORY PAGE ═════════════════════════════════════════════════════════ -->
<div *ngIf="view==='category'" class="pg" style="padding-bottom:5rem">
  <div class="pg-header">
    <button class="back-circle" (click)="view='home'; catSearch=''"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
    <div><h1 class="pg-title">{{ activeCatLabel==='All'?'All Restaurants':activeCatLabel }}</h1><p class="pg-sub">{{ categoryList.length }} place{{ categoryList.length!==1?'s':'' }}{{ catSearch?' found':'' }}</p></div>
  </div>
  <div class="search-wrap" style="padding:0 1rem 0.75rem">
    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <input class="search-input" type="text" placeholder="Search restaurants or dishes..." [(ngModel)]="catSearch"/>
    <button *ngIf="catSearch" class="search-clear" (click)="catSearch=''">✕</button>
  </div>
  <div class="px4 space-y3">
    <div *ngIf="categoryList.length===0" class="empty-state"><p>No results for "{{ catSearch }}"</p><button (click)="catSearch=''">Clear search</button></div>
    <div *ngFor="let r of categoryList" class="rest-card"
         [class.rest-unavailable]="!adminService.isRestaurantAvailable(r.id)"
         (click)="adminService.isRestaurantAvailable(r.id) && openRestaurant(r)">
      <div class="rest-card-img-wrap">
        <img [src]="r.image" [alt]="r.name" class="rest-card-img"/>
        <div class="rest-card-overlay"></div>
        <div *ngIf="!adminService.isRestaurantAvailable(r.id)" class="rest-unavail-badge">🔴 Currently Unavailable</div>
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
        <div class="orders-bar-bg"><div class="orders-bar-fill" [style.width.%]="getRestaurantBarPct(r.id)"></div></div>
      </div>
    </div>
  </div>
  <ng-container *ngTemplateOutlet="cartBarTpl"></ng-container>
  <ng-container *ngTemplateOutlet="bottomNav; context:{active:'search'}"></ng-container>
  <ng-container *ngIf="isCartOpen"><div class="sheet-backdrop" (click)="isCartOpen=false"></div><ng-container *ngTemplateOutlet="cartSheet"></ng-container></ng-container>
</div>

<!-- ══ HOME ══════════════════════════════════════════════════════════════════ -->
<div *ngIf="view==='home'" class="pg" style="padding-bottom:5rem">
  <!-- Header -->
  <div class="home-header">
    <div class="home-header-top">
      <h1 class="home-logo">CLGBITES</h1>
      <div class="campus-pill"><span class="campus-dot"></span><span class="campus-text">VIT-AP</span></div>
    </div>
    <div class="loc-wrap">
      <button class="loc-btn" (click)="locationOpen=!locationOpen">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span class="loc-label">{{ LOCATIONS[locIndex].label }}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="loc-dropdown" *ngIf="locationOpen">
        <button *ngFor="let l of LOCATIONS; let i=index" class="loc-opt" [class.loc-opt-active]="i===locIndex" (click)="locIndex=i; locationOpen=false">
          <div><p class="loc-opt-name" [class.loc-opt-name-active]="i===locIndex">{{ l.label }}</p><p class="loc-opt-sub">{{ l.sublabel }}</p></div>
          <span *ngIf="i===locIndex" class="loc-dot"></span>
        </button>
      </div>
    </div>
    <div *ngIf="!adminService.isOrdersAccepting()" class="orders-off-banner">❗ {{ adminService.settings().orders_off_message }}</div>
    <div *ngIf="adminService.settings().delivery_time" class="delivery-banner">🚚 Estimated Delivery: <strong>{{ adminService.settings().delivery_time }}</strong></div>
    <!-- Live ticker -->
    <div class="ticker" *ngIf="liveOrders.length>0">
      <div class="ticker-avatar">{{ liveOrders[tickIdx].name[0] }}</div>
      <div class="ticker-info">
        <p class="ticker-main"><strong>{{ liveOrders[tickIdx].name }}</strong><span class="ticker-muted"> · {{ liveOrders[tickIdx].location }} </span><strong class="ticker-item">{{ liveOrders[tickIdx].item }}</strong></p>
        <p class="ticker-sub">⏱ {{ liveOrders[tickIdx].mins }}m ago · {{ liveOrders[tickIdx].restaurant }}</p>
      </div>
      <span class="ticker-pulse"></span>
    </div>
    <div class="ticker ticker-loading" *ngIf="liveOrders.length===0 && !ordersLoaded"><div class="ticker-shimmer"></div></div>
    <div class="ticker" *ngIf="liveOrders.length===0 && ordersLoaded">
      <div class="ticker-avatar">C</div>
      <div class="ticker-info"><p class="ticker-main"><strong>CLGBITES</strong></p><p class="ticker-sub">🍽 Be the first to order today!</p></div>
    </div>
  </div>

  <!-- Bento Category Grid -->
  <div class="px4" style="padding-top:1.25rem">
    <h2 class="section-h">What are you craving?</h2>
    <p class="section-p">Pick a category to find your spot</p>
    <div class="bento-grid">
      <!-- Biryani — hero 3×3 -->
      <button class="bento-biryani" (click)="goCategory('Biryani')">
        <img [src]="getCat('Biryani').img" alt="Biryani" class="bento-img"/>
        <div class="bento-overlay"></div>
        <span class="bento-top-badge">🔥 Top Pick</span>
        <div class="bento-bottom-left">
          <p class="bento-hero-label">Biryani</p>
          <p class="bento-hero-sub">{{ getCat('Biryani').count }} Places</p>
        </div>
      </button>
      <!-- Fast Food — 3×2 -->
      <button class="bento-fastfood" (click)="goCategory('Fast Food')">
        <img [src]="getCat('Fast Food').img" alt="Fast Food" class="bento-img"/>
        <div class="bento-overlay"></div>
        <div class="bento-bottom-left">
          <p class="bento-md-label">Fast Food</p>
          <p class="bento-md-sub">{{ getCat('Fast Food').count }} Places</p>
        </div>
      </button>
      <!-- Tiffins — 1×1 -->
      <button class="bento-tiffins" (click)="goCategory('Tiffins')">
        <img [src]="getCat('Tiffins').img" alt="Tiffins" class="bento-img"/>
        <div class="bento-overlay-dark"></div>
        <p class="bento-sm-label">Tiffins</p>
      </button>
      <!-- Fruits — 2×1 -->
      <button class="bento-fruits" (click)="goCategory('Fruits')">
        <img [src]="getCat('Fruits').img" alt="Fruits" class="bento-img"/>
        <div class="bento-overlay-lr"></div>
        <div class="bento-fruits-text"><p class="bento-sm-label">Fruits</p><p class="bento-sm-sub">{{ getCat('Fruits').count }} Place</p></div>
      </button>
      <!-- Veg Meals — 3×2 -->
      <button class="bento-vegmeals" (click)="goCategory('Veg Meals')">
        <img [src]="getCat('Veg Meals').img" alt="Veg Meals" class="bento-img"/>
        <div class="bento-overlay"></div>
        <span class="bento-veg-badge">🌿 Veg</span>
        <div class="bento-bottom-left">
          <p class="bento-md-label">Veg Meals</p>
          <p class="bento-md-sub">{{ getCat('Veg Meals').count }} Places</p>
        </div>
      </button>
      <!-- All — 3×2 gradient -->
      <button class="bento-all" (click)="goCategory('All')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" style="margin-bottom:0.375rem"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <p class="bento-all-label">All Restaurants</p>
        <p class="bento-all-sub">{{ RESTAURANTS.length }} Places</p>
      </button>
    </div>
  </div>

  <!-- Trending -->
  <div class="px4" style="padding-top:1.25rem">
    <div class="trending-hdr">
      <div class="trending-title-grp">
        <div class="trending-icon-box"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
        <div><h2 class="trending-h">Trending at VIT-AP</h2><p class="trending-p">Most ordered today</p></div>
      </div>
      <div class="live-pill">✨ <span>Live</span></div>
    </div>
    <div class="trending-big-grid">
      <div *ngFor="let t of TRENDING.slice(0,2)" class="trend-big-card">
        <img [src]="t.img" [alt]="t.item" class="trend-big-img"/>
        <div class="trend-big-overlay"></div>
        <div class="trend-rank">#{{ t.rank }} 🔥</div>
        <div class="trend-change">↑{{ t.change }}%</div>
        <div class="trend-big-bottom">
          <div class="trend-big-name-row">
            <span class="veg-dot" [class.nonveg]="isNonVeg(t.item)"><span class="veg-dot-inner" [class.nonveg-inner]="isNonVeg(t.item)"></span></span>
            <p class="trend-big-name">{{ t.item }}</p>
          </div>
          <p class="trend-big-orders">👥 {{ getTrendingCount(t.rid, t.item) }} orders</p>
          <div class="trend-big-foot">
            <span class="trend-big-price">₹{{ t.price }}</span>
            <ng-container *ngIf="gq(t.rid,t.item)===0"><button class="add-btn" (click)="uq(t.rid,t.rname,t.item,t.price,1,!isNonVeg(t.item))">+</button></ng-container>
            <div class="stepper" *ngIf="gq(t.rid,t.item)>0">
              <button class="step-btn" (click)="uq(t.rid,t.rname,t.item,t.price,-1,!isNonVeg(t.item))">−</button>
              <span class="step-n">{{ gq(t.rid,t.item) }}</span>
              <button class="step-btn" (click)="uq(t.rid,t.rname,t.item,t.price,1,!isNonVeg(t.item))">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="space-y2">
      <div *ngFor="let t of TRENDING.slice(2)" class="trend-row">
        <div class="trend-thumb-wrap"><img [src]="t.img" [alt]="t.item" class="trend-thumb"/><div class="trend-thumb-rank">#{{ t.rank }}</div></div>
        <div class="trend-row-info">
          <div class="trend-row-name-row">
            <span class="veg-dot" [class.nonveg]="isNonVeg(t.item)"><span class="veg-dot-inner" [class.nonveg-inner]="isNonVeg(t.item)"></span></span>
            <p class="trend-row-name">{{ t.item }}</p>
          </div>
          <p class="trend-row-meta"><span class="trend-rname">{{ t.rname }}</span><span class="trend-chg"> ↑{{ t.change }}%</span><span class="trend-cnt"> · {{ getTrendingCount(t.rid, t.item) }} orders</span></p>
        </div>
        <div class="trend-row-right">
          <span class="trend-row-price">₹{{ t.price }}</span>
          <ng-container *ngIf="gq(t.rid,t.item)===0"><button class="add-btn-sm" (click)="uq(t.rid,t.rname,t.item,t.price,1,!isNonVeg(t.item))">+</button></ng-container>
          <div class="stepper stepper-sm" *ngIf="gq(t.rid,t.item)>0">
            <button class="step-btn step-btn-sm" (click)="uq(t.rid,t.rname,t.item,t.price,-1,!isNonVeg(t.item))">−</button>
            <span class="step-n">{{ gq(t.rid,t.item) }}</span>
            <button class="step-btn step-btn-sm" (click)="uq(t.rid,t.rname,t.item,t.price,1,!isNonVeg(t.item))">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reviews -->
  <div class="px4" style="padding-top:1.5rem">
    <div class="reviews-hdr">💬 <span class="reviews-h">What Students Say</span></div>
    <div class="reviews-scroll">
      <div *ngFor="let rv of REVIEWS" class="review-card">
        <div class="review-stars">{{ getStars(rv.stars) }}</div>
        <p class="review-text">"{{ rv.text }}"</p>
        <div class="review-author"><div class="review-av">{{ rv.name[0] }}</div><div><p class="review-name">{{ rv.name }}</p><p class="review-block">{{ rv.block }}</p></div></div>
      </div>
    </div>
  </div>

  <!-- Contact -->
  <div class="px4" style="padding-top:1.25rem;padding-bottom:2rem">
    <div class="contact-card">
      <p class="contact-title">Contact & Support</p>
      <a href="tel:7842960252" class="contact-row"><div class="contact-icon green-box">📞</div><div><p class="contact-lbl">Admin</p><p class="contact-val">7842960252</p></div></a>
      <div class="contact-divider"></div>
      <a href="mailto:clgbites@gmail.com" class="contact-row"><div class="contact-icon orange-box">✉️</div><div><p class="contact-lbl">Email</p><p class="contact-val">clgbites&#64;gmail.com</p></div></a>
      <p class="contact-footer">CLGBITES · VIT-AP University · Taxes: ₹0</p>
    </div>
  </div>

  <ng-container *ngTemplateOutlet="cartBarTpl"></ng-container>
  <ng-container *ngTemplateOutlet="bottomNav; context:{active:'home'}"></ng-container>
  <ng-container *ngIf="isCartOpen"><div class="sheet-backdrop" (click)="isCartOpen=false"></div><ng-container *ngTemplateOutlet="cartSheet"></ng-container></ng-container>
</div>

<!-- ══ RESTAURANT PAGE ═══════════════════════════════════════════════════════ -->
<div *ngIf="view==='restaurant' && activeRest" class="pg" style="padding-bottom:5rem">
  <div class="rest-hero">
    <img [src]="activeRest.image" [alt]="activeRest.name" class="rest-hero-img"/>
    <div class="rest-hero-overlay"></div>
    <button class="back-circle rest-back" (click)="view='home'"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg></button>
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
  <div *ngIf="!adminService.isRestaurantAvailable(activeRest.id)" class="rest-unavail-banner">🔴 This restaurant is currently unavailable</div>
  <div *ngIf="!adminService.isOrdersAccepting()" class="rest-unavail-banner">❗ {{ adminService.settings().orders_off_message }}</div>
  <div class="rest-subhdr">
    <div><p class="best-lbl-orange">Best Item</p><p class="best-val-gray">{{ activeRest.bestItem }}</p></div>
    <button class="veg-toggle" [class.veg-on]="vegOnly" (click)="vegOnly=!vegOnly">🌿 <span [class.text-green]="vegOnly">Veg Only</span></button>
  </div>
  <div class="px4 space-y2" style="padding-top:0.75rem">
    <div *ngIf="filteredMenu.length===0" class="empty-state">No veg items available</div>
    <div *ngFor="let cat of filteredMenu" class="menu-section">
      <button class="menu-cat-hdr" (click)="toggleCat(cat.category)">
        <div class="menu-cat-left"><span class="menu-cat-name">{{ cat.category }}</span><span class="menu-cat-count">{{ cat.items.length }}</span></div>
        <span class="menu-chevron">{{ openCats[cat.category]?'▲':'▼' }}</span>
      </button>
      <div *ngIf="openCats[cat.category]" class="menu-items">
        <div *ngFor="let item of cat.items" class="menu-item-row" [class.item-unavailable]="!adminService.isItemAvailable(activeRest.id, item.name)">
          <div class="menu-item-left">
            <div class="menu-item-name-row">
              <span class="veg-dot" [class.nonveg]="!item.veg"><span class="veg-dot-inner" [class.nonveg-inner]="!item.veg"></span></span>
              <span class="menu-item-name">{{ item.name }}</span>
              <span *ngIf="item.isStudentChoice" class="student-pick">Student Pick</span>
              <span *ngIf="!adminService.isItemAvailable(activeRest.id, item.name)" class="item-unavail-tag">Unavailable</span>
            </div>
            <span class="menu-item-price">
              ₹{{ adminService.getItemPrice(activeRest.id, item.name, item.price) }}
              <span *ngIf="adminService.getItemPrice(activeRest.id, item.name, item.price) !== item.price" class="price-original">₹{{ item.price }}</span>
            </span>
          </div>
          <ng-container *ngIf="adminService.isItemAvailable(activeRest.id, item.name) && adminService.isRestaurantAvailable(activeRest.id) && adminService.isOrdersAccepting()">
            <ng-container *ngIf="gq(activeRest.id, item.name)===0">
              <button class="add-btn" (click)="uq(activeRest.id,activeRest.name,item.name,adminService.getItemPrice(activeRest.id,item.name,item.price),1,item.veg)">+</button>
            </ng-container>
            <div class="stepper" *ngIf="gq(activeRest.id,item.name)>0">
              <button class="step-btn" (click)="uq(activeRest.id,activeRest.name,item.name,adminService.getItemPrice(activeRest.id,item.name,item.price),-1,item.veg)">−</button>
              <span class="step-n">{{ gq(activeRest.id,item.name) }}</span>
              <button class="step-btn" (click)="uq(activeRest.id,activeRest.name,item.name,adminService.getItemPrice(activeRest.id,item.name,item.price),1,item.veg)">+</button>
            </div>
          </ng-container>
          <span *ngIf="!adminService.isItemAvailable(activeRest.id, item.name)" class="unavail-dash">—</span>
        </div>
      </div>
    </div>
  </div>
  <ng-container *ngTemplateOutlet="cartBarTpl"></ng-container>
  <ng-container *ngTemplateOutlet="bottomNav; context:{active:'home'}"></ng-container>
  <ng-container *ngIf="isCartOpen"><div class="sheet-backdrop" (click)="isCartOpen=false"></div><ng-container *ngTemplateOutlet="cartSheet"></ng-container></ng-container>
</div>

<!-- ══ SHARED TEMPLATES ══════════════════════════════════════════════════════ -->

<!-- Cart Bar -->
<ng-template #cartBarTpl>
  <div class="cart-bar" *ngIf="cartCount>0" (click)="isCartOpen=true">
    <div class="cart-bar-left"><div class="cart-bar-count">{{ cartCount }}</div><span class="cart-bar-amount">₹{{ cartTotal }}</span></div>
    <span class="cart-bar-cta">View Cart →</span>
  </div>
</ng-template>

<!-- Bottom Nav -->
<ng-template #bottomNav let-active="active">
  <nav class="bottom-nav">
    <button class="nav-tab" [class.nav-active]="active==='home'" (click)="view='home'">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="active==='home'?'#f97316':'#9ca3af'" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span class="nav-label" [class.nav-label-active]="active==='home'">Home</span>
    </button>
    <button class="nav-tab" [class.nav-active]="active==='search'" (click)="goCategory('All')">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="active==='search'?'#f97316':'#9ca3af'" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      <span class="nav-label" [class.nav-label-active]="active==='search'">Search</span>
    </button>
    <button class="nav-tab" [class.nav-active]="active==='cart'" (click)="view='cart'" style="position:relative">
      <div style="position:relative">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="active==='cart'?'#f97316':'#9ca3af'" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
        <span *ngIf="cartCount>0" class="nav-badge">{{ cartCount>9?'9+':cartCount }}</span>
      </div>
      <span class="nav-label" [class.nav-label-active]="active==='cart'">Cart</span>
    </button>
    <button class="nav-tab" [class.nav-active]="active==='profile'" (click)="view='profile'">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" [attr.stroke]="active==='profile'?'#f97316':'#9ca3af'" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span class="nav-label" [class.nav-label-active]="active==='profile'">Profile</span>
    </button>
  </nav>
</ng-template>

<!-- Cart Sheet -->
<ng-template #cartSheet>
  <div class="sheet">
    <div class="sheet-handle-row"><div class="sheet-handle"></div></div>
    <div class="sheet-top"><h2 class="sheet-title">Your Order</h2><button class="sheet-close" (click)="isCartOpen=false">✕</button></div>
    <div class="sheet-body">
      <div class="sheet-items">
        <div *ngFor="let item of cart" class="sheet-item">
          <div class="sheet-item-left">
            <div class="sheet-item-name-row"><span class="veg-dot" [class.nonveg]="!item.isVeg"><span class="veg-dot-inner" [class.nonveg-inner]="!item.isVeg"></span></span><span class="sheet-item-name">{{ item.itemName }}</span></div>
            <p class="sheet-item-from">{{ item.restaurantName }} · ×{{ item.qty }}</p>
          </div>
          <span class="sheet-item-price">₹{{ item.price*item.qty }}</span>
        </div>
      </div>
      <div class="bill-box">
        <p class="bill-title">Bill Summary</p>
        <div class="bill-row"><span>Subtotal</span><span>₹{{ cartTotal }}</span></div>
        <div class="bill-row"><span>Delivery</span><span [class.green]="LOCATIONS[locIndex].fee===0">{{ LOCATIONS[locIndex].fee===0?'FREE':'₹'+LOCATIONS[locIndex].fee }}</span></div>
        <div class="bill-row"><span>Taxes</span><span class="green">₹0</span></div>
        <div class="bill-divider"></div>
        <div class="bill-row bill-total"><span>Total</span><span class="orange">₹{{ cartTotal+LOCATIONS[locIndex].fee }}</span></div>
      </div>
      <div class="delivery-section">
        <p class="section-label">Delivery Details</p>
        <input class="sheet-input" type="text" placeholder="Your Name" [(ngModel)]="customerName"/>
        <input class="sheet-input" type="tel" placeholder="Phone Number" [(ngModel)]="customerPhone"/>
        <div class="loc-picker">
          <button *ngFor="let l of LOCATIONS; let i=index" class="loc-pick-opt" [class.loc-pick-active]="i===locIndex" (click)="locIndex=i">
            <div><p class="loc-pick-name" [class.active-text]="i===locIndex">{{ l.label }}</p><p class="loc-pick-sub">{{ l.sublabel }}</p></div>
            <div class="loc-radio" [class.loc-radio-on]="i===locIndex"><span *ngIf="i===locIndex" class="loc-radio-dot"></span></div>
          </button>
        </div>
      </div>
      <div class="pay-section">
        <p class="section-label">Payment Mode</p>
        <div class="pay-btns">
          <button class="pay-btn" [class.pay-active]="payMode==='COD'" (click)="payMode='COD'">💵 Cash on Delivery</button>
          <button class="pay-btn" [class.pay-active]="payMode==='Prepay'" (click)="payMode='Prepay'">📲 Prepay</button>
        </div>
      </div>
    </div>
    <div class="sheet-footer">
      <button class="wa-btn" (click)="checkout()" [disabled]="checkoutLoading">
        <span *ngIf="!checkoutLoading">Order on WhatsApp →</span>
        <span *ngIf="checkoutLoading">⏳ Saving order…</span>
      </button>
    </div>
  </div>
</ng-template>
  `,
  styles: [`
    :host { display:block; font-family:'Poppins',sans-serif; }
    * { box-sizing:border-box; margin:0; padding:0; }
    .pg { min-height:100vh; background:#fff9f5; }
    .px4 { padding-left:1rem; padding-right:1rem; }
    .space-y2 > * + * { margin-top:0.5rem; }
    .space-y3 > * + * { margin-top:0.75rem; }
    .flex-col-center { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:100vh; }

    /* SUCCESS */
    .suc-icon { width:5rem; height:5rem; background:#fff7ed; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:1.25rem; }
    .suc-title { font-size:1.5rem; font-weight:900; color:#111827; margin-bottom:0.25rem; }
    .suc-sub { font-size:0.8125rem; color:#9ca3af; margin-bottom:2rem; text-align:center; }
    .suc-btn { background:#f97316; color:white; font-weight:700; font-size:0.9375rem; padding:0.875rem 2.5rem; border-radius:9999px; border:none; cursor:pointer; }

    /* PAGE HEADERS */
    .pg-header { background:white; border-bottom:1px solid #ffedd5; padding:1.25rem 1rem 0.75rem; display:flex; align-items:center; gap:0.75rem; }
    .pg-title { font-size:1.0625rem; font-weight:900; color:#111827; }
    .pg-sub { font-size:0.6875rem; color:#9ca3af; margin-top:0.125rem; }
    .back-circle { width:2.25rem; height:2.25rem; background:#fff7ed; border-radius:50%; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; }

    /* HOME HEADER */
    .home-header { background:white; border-bottom:1px solid #ffedd5; padding:1.25rem 1rem 0.75rem; }
    .home-header-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.25rem; }
    .home-logo { font-size:1.375rem; font-weight:900; letter-spacing:-0.04em; color:#111827; }
    .campus-pill { display:flex; align-items:center; gap:0.375rem; background:#fff7ed; border:1px solid #fed7aa; padding:0.375rem 0.625rem; border-radius:9999px; }
    .campus-dot { width:6px; height:6px; border-radius:50%; background:#f97316; animation:pa 1.5s infinite; }
    @keyframes pa { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .campus-text { font-size:0.6875rem; color:#ea580c; font-weight:600; }
    .loc-wrap { position:relative; margin-top:0.25rem; }
    .loc-btn { display:flex; align-items:center; gap:0.25rem; background:none; border:none; cursor:pointer; font-size:0.6875rem; color:#4b5563; font-weight:600; font-family:'Poppins',sans-serif; }
    .loc-label { color:#4b5563; }
    .loc-dropdown { position:absolute; top:1.5rem; left:0; background:white; border:1px solid #f3f4f6; border-radius:1rem; box-shadow:0 10px 30px rgba(0,0,0,0.12); z-index:100; width:14rem; overflow:hidden; }
    .loc-opt { width:100%; display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border:none; border-bottom:1px solid #f9fafb; background:white; cursor:pointer; text-align:left; font-family:'Poppins',sans-serif; }
    .loc-opt:last-child { border-bottom:none; }
    .loc-opt-active { background:#fff7ed; }
    .loc-opt-name { font-size:0.8125rem; font-weight:700; color:#1f2937; }
    .loc-opt-name-active { color:#ea580c; }
    .loc-opt-sub { font-size:0.625rem; color:#9ca3af; }
    .loc-dot { width:8px; height:8px; border-radius:50%; background:#f97316; flex-shrink:0; }
    .orders-off-banner { background:#fee2e2; border:1px solid #fca5a5; border-radius:0.75rem; padding:0.5rem 0.75rem; color:#dc2626; font-weight:600; font-size:0.8125rem; margin-top:0.5rem; text-align:center; }
    .delivery-banner { background:#dcfce7; border:1px solid #86efac; border-radius:0.75rem; padding:0.5rem 0.75rem; color:#16a34a; font-size:0.8125rem; margin-top:0.375rem; text-align:center; }
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

    /* BENTO GRID */
    .section-h { font-size:1.0625rem; font-weight:900; color:#111827; }
    .section-p { font-size:0.75rem; color:#9ca3af; margin:0.125rem 0 0.75rem; }
    .bento-grid { display:grid; grid-template-columns:repeat(6,1fr); grid-auto-rows:68px; gap:0.625rem; }
    .bento-biryani  { grid-column:span 3; grid-row:span 3; position:relative; border-radius:1rem; overflow:hidden; border:none; cursor:pointer; padding:0; transition:transform 0.15s; }
    .bento-fastfood { grid-column:span 3; grid-row:span 2; position:relative; border-radius:1rem; overflow:hidden; border:none; cursor:pointer; padding:0; transition:transform 0.15s; }
    .bento-tiffins  { grid-column:span 1; grid-row:span 1; position:relative; border-radius:0.75rem; overflow:hidden; border:none; cursor:pointer; padding:0; transition:transform 0.15s; display:flex; align-items:center; justify-content:center; }
    .bento-fruits   { grid-column:span 2; grid-row:span 1; position:relative; border-radius:0.75rem; overflow:hidden; border:none; cursor:pointer; padding:0; transition:transform 0.15s; }
    .bento-vegmeals { grid-column:span 3; grid-row:span 2; position:relative; border-radius:1rem; overflow:hidden; border:none; cursor:pointer; padding:0; transition:transform 0.15s; }
    .bento-all      { grid-column:span 3; grid-row:span 2; background:linear-gradient(135deg,#f97316,#fbbf24); border-radius:1rem; border:none; cursor:pointer; display:flex; flex-direction:column; align-items:center; justify-content:center; transition:transform 0.15s; }
    .bento-biryani:active,.bento-fastfood:active,.bento-tiffins:active,.bento-fruits:active,.bento-vegmeals:active,.bento-all:active { transform:scale(0.97); }
    .bento-img { width:100%; height:100%; object-fit:cover; position:absolute; inset:0; }
    .bento-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.2) 50%,transparent 100%); }
    .bento-overlay-dark { position:absolute; inset:0; background:rgba(0,0,0,0.45); }
    .bento-overlay-lr { position:absolute; inset:0; background:linear-gradient(to right,rgba(0,0,0,0.7),rgba(0,0,0,0.2)); }
    .bento-top-badge { position:absolute; top:0.625rem; left:0.625rem; background:#f97316; color:white; font-size:0.5625rem; font-weight:900; padding:0.15rem 0.5rem; border-radius:9999px; z-index:1; }
    .bento-veg-badge { position:absolute; top:0.5rem; right:0.5rem; background:rgba(34,197,94,0.9); color:white; font-size:0.5rem; font-weight:900; padding:0.15rem 0.375rem; border-radius:9999px; z-index:1; }
    .bento-bottom-left { position:absolute; bottom:0.75rem; left:0.875rem; z-index:1; text-align:left; }
    .bento-hero-label { color:white; font-size:1.375rem; font-weight:900; line-height:1; }
    .bento-hero-sub { color:rgba(255,255,255,0.75); font-size:0.75rem; margin-top:0.375rem; }
    .bento-md-label { color:white; font-size:1rem; font-weight:800; line-height:1.2; }
    .bento-md-sub { color:rgba(255,255,255,0.7); font-size:0.6875rem; margin-top:0.25rem; }
    .bento-sm-label { color:white; font-size:0.6875rem; font-weight:800; z-index:1; position:relative; text-align:center; padding:0 0.25rem; }
    .bento-sm-sub { color:rgba(255,255,255,0.65); font-size:0.5625rem; margin-top:0.125rem; }
    .bento-fruits-text { position:absolute; left:0.625rem; top:50%; transform:translateY(-50%); z-index:1; }
    .bento-all-label { color:white; font-size:0.875rem; font-weight:900; line-height:1; z-index:1; }
    .bento-all-sub { color:rgba(255,255,255,0.8); font-size:0.625rem; margin-top:0.375rem; z-index:1; }

    /* TRENDING */
    .trending-hdr { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
    .trending-title-grp { display:flex; align-items:center; gap:0.5rem; }
    .trending-icon-box { width:1.75rem; height:1.75rem; background:#f97316; border-radius:0.75rem; display:flex; align-items:center; justify-content:center; }
    .trending-h { font-size:0.875rem; font-weight:800; color:#111827; line-height:1; }
    .trending-p { font-size:0.625rem; color:#9ca3af; margin-top:0.125rem; }
    .live-pill { display:flex; align-items:center; gap:0.25rem; background:#fff7ed; border:1px solid #fed7aa; padding:0.25rem 0.5rem; border-radius:9999px; font-size:0.625rem; color:#ea580c; font-weight:700; }
    .trending-big-grid { display:grid; grid-template-columns:1fr 1fr; gap:0.625rem; margin-bottom:0.625rem; }
    .trend-big-card { position:relative; border-radius:1rem; overflow:hidden; height:160px; }
    .trend-big-img { width:100%; height:100%; object-fit:cover; }
    .trend-big-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.25) 60%,transparent 100%); }
    .trend-rank { position:absolute; top:0.625rem; left:0.625rem; background:#f97316; color:white; font-size:0.5625rem; font-weight:900; padding:0.125rem 0.5rem; border-radius:9999px; }
    .trend-change { position:absolute; top:0.625rem; right:0.5rem; background:rgba(255,255,255,0.9); color:#c2410c; font-size:0.5625rem; font-weight:800; padding:0.125rem 0.375rem; border-radius:9999px; }
    .trend-big-bottom { position:absolute; bottom:0; left:0; right:0; padding:0.625rem; }
    .trend-big-name-row { display:flex; align-items:center; gap:0.375rem; margin-bottom:0.125rem; }
    .trend-big-name { color:white; font-weight:800; font-size:0.6875rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
    .trend-big-orders { color:rgba(255,255,255,0.6); font-size:0.5625rem; margin-bottom:0.5rem; }
    .trend-big-foot { display:flex; align-items:center; justify-content:space-between; }
    .trend-big-price { color:white; font-size:0.8125rem; font-weight:800; }
    .trend-row { background:white; border:1px solid #fed7aa; border-radius:1rem; display:flex; align-items:center; gap:0.75rem; padding:0.625rem 0.75rem; }
    .trend-thumb-wrap { position:relative; width:2.75rem; height:2.75rem; border-radius:0.75rem; overflow:hidden; flex-shrink:0; }
    .trend-thumb { width:100%; height:100%; object-fit:cover; }
    .trend-thumb-rank { position:absolute; bottom:0; left:0; right:0; background:rgba(249,115,22,0.85); color:white; font-size:0.5rem; font-weight:900; text-align:center; padding:0.125rem 0; }
    .trend-row-info { flex:1; min-width:0; }
    .trend-row-name-row { display:flex; align-items:center; gap:0.375rem; }
    .trend-row-name { font-weight:700; font-size:0.75rem; color:#111827; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .trend-row-meta { font-size:0.5625rem; margin-top:0.125rem; }
    .trend-rname { color:#9ca3af; }
    .trend-chg { color:#f97316; font-weight:700; }
    .trend-cnt { color:#d1d5db; }
    .trend-row-right { flex-shrink:0; display:flex; flex-direction:column; align-items:flex-end; gap:0.5rem; }
    .trend-row-price { font-size:0.8125rem; font-weight:800; color:#ea580c; }

    /* ADD/STEPPER */
    .add-btn { width:2rem; height:2rem; background:#f97316; border:none; border-radius:50%; cursor:pointer; color:white; font-size:1.25rem; font-weight:700; display:flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
    .add-btn-sm { width:1.625rem; height:1.625rem; background:#f97316; border:none; border-radius:50%; cursor:pointer; color:white; font-size:1rem; font-weight:700; display:flex; align-items:center; justify-content:center; line-height:1; flex-shrink:0; }
    .stepper { display:flex; align-items:center; background:#f97316; color:white; border-radius:9999px; overflow:hidden; flex-shrink:0; }
    .step-btn { width:1.75rem; height:1.75rem; border:none; background:none; color:white; font-size:0.875rem; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; }
    .step-n { min-width:1.25rem; text-align:center; font-size:0.75rem; font-weight:900; }
    .stepper-sm .step-btn,.step-btn-sm { width:1.5rem !important; height:1.5rem !important; }

    /* VEG DOT */
    .veg-dot { display:inline-flex; width:0.875rem; height:0.875rem; border-radius:0.125rem; border:2px solid #22c55e; align-items:center; justify-content:center; flex-shrink:0; }
    .veg-dot.nonveg { border-color:#ef4444; }
    .veg-dot-inner { width:0.4rem; height:0.4rem; border-radius:50%; background:#22c55e; }
    .veg-dot-inner.nonveg-inner { background:#ef4444; }

    /* REVIEWS */
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

    /* CONTACT */
    .contact-card { background:white; border:1px solid #fed7aa; border-radius:1rem; padding:1rem; }
    .contact-title { font-size:0.8125rem; font-weight:800; color:#1f2937; margin-bottom:0.75rem; }
    .contact-row { display:flex; align-items:center; gap:0.625rem; padding:0.5rem 0; text-decoration:none; }
    .contact-icon { width:2rem; height:2rem; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:0.875rem; flex-shrink:0; }
    .green-box { background:#f0fdf4; }
    .orange-box { background:#fff7ed; }
    .contact-lbl { font-size:0.6875rem; color:#9ca3af; }
    .contact-val { font-size:0.8125rem; font-weight:700; color:#1f2937; }
    .contact-divider { height:1px; background:#f9fafb; }
    .contact-footer { font-size:0.625rem; color:#d1d5db; text-align:center; margin-top:0.5rem; }

    /* CART PAGE */
    .empty-cart { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:5rem 1.5rem; text-align:center; }
    .empty-bag { width:6rem; height:6rem; background:#fff7ed; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:1.25rem; }
    .empty-h { font-size:1.125rem; font-weight:900; color:#1f2937; margin-bottom:0.25rem; }
    .empty-p { font-size:0.8125rem; color:#9ca3af; margin-bottom:2rem; }
    .orange-pill-btn { background:#f97316; color:white; font-weight:700; font-size:0.875rem; padding:0.875rem 2.5rem; border-radius:9999px; border:none; cursor:pointer; }
    .cart-group { background:white; border-radius:1rem; overflow:hidden; border:1px solid #fed7aa; }
    .cart-group-hdr { display:flex; align-items:center; gap:0.5rem; padding:0.75rem 1rem; border-bottom:1px solid #fff7ed; }
    .rest-initial { width:1.75rem; height:1.75rem; background:#f97316; border-radius:0.5rem; display:flex; align-items:center; justify-content:center; color:white; font-size:0.6875rem; font-weight:900; flex-shrink:0; }
    .cart-group-name { font-weight:800; font-size:0.8125rem; color:#111827; }
    .cart-group-items > * + * { border-top:1px solid #f9fafb; }
    .cart-item-row { display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; gap:0.75rem; }
    .cart-item-left { display:flex; align-items:center; gap:0.5rem; flex:1; }
    .cart-item-name { font-size:0.8125rem; font-weight:600; color:#111827; }
    .cart-item-price { font-size:0.75rem; font-weight:700; color:#f97316; margin-top:0.125rem; }
    .cart-item-right { display:flex; align-items:center; gap:0.75rem; flex-shrink:0; }
    .cart-item-total { font-size:0.8125rem; font-weight:800; color:#111827; }

    /* PROFILE */
    .profile-hero { background:linear-gradient(135deg,#f97316,#fbbf24); padding:2rem 1.25rem 3rem; display:flex; align-items:center; gap:0.75rem; }
    .profile-av { width:4rem; height:4rem; border-radius:50%; background:rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; font-size:1.5rem; font-weight:900; color:white; flex-shrink:0; }
    .profile-name { font-weight:800; font-size:1.125rem; color:white; }
    .profile-sub { font-size:0.75rem; color:rgba(255,255,255,0.8); }
    .profile-stats { background:white; border-radius:1rem; border:1px solid #fed7aa; padding:1rem; display:grid; grid-template-columns:1fr 1fr 1fr; }
    .stat-cell { text-align:center; }
    .stat-mid { border-left:1px solid #ffedd5; border-right:1px solid #ffedd5; }
    .stat-val { font-size:1.125rem; font-weight:900; color:#f97316; }
    .stat-lbl { font-size:0.625rem; color:#9ca3af; margin-top:0.25rem; }
    .profile-link { width:100%; background:white; border-radius:1rem; border:1px solid #fed7aa; padding:0.75rem 1rem; display:flex; align-items:center; gap:0.75rem; cursor:pointer; text-decoration:none; }
    .profile-link-icon { width:2.25rem; height:2.25rem; border-radius:0.75rem; display:flex; align-items:center; justify-content:center; font-size:0.875rem; flex-shrink:0; }
    .green-icon { background:#f0fdf4; }
    .profile-link-body { flex:1; text-align:left; }
    .profile-link-title { font-size:0.8125rem; font-weight:700; color:#111827; }
    .profile-link-sub { font-size:0.625rem; color:#9ca3af; margin-top:0.125rem; }
    .profile-link-arrow { color:#d1d5db; font-size:1.25rem; }

    /* CATEGORY LIST */
    .search-wrap { position:relative; padding-top:0.75rem; }
    .search-icon { position:absolute; left:1.75rem; top:50%; transform:translateY(-50%); }
    .search-input { width:100%; background:#fff7ed; border:1px solid #fed7aa; border-radius:0.75rem; padding:0.625rem 0.75rem 0.625rem 2.25rem; font-size:0.8125rem; outline:none; font-family:'Poppins',sans-serif; }
    .search-input:focus { border-color:#fb923c; }
    .search-clear { position:absolute; right:1.75rem; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#9ca3af; }
    .empty-state { text-align:center; padding:4rem 1rem; color:#9ca3af; font-size:0.8125rem; }
    .empty-state button { margin-top:0.75rem; color:#f97316; font-weight:700; font-size:0.8125rem; background:none; border:none; cursor:pointer; }
    .rest-card { background:white; border-radius:1rem; overflow:hidden; border:1px solid #fed7aa; cursor:pointer; transition:transform 0.15s; }
    .rest-card:active { transform:scale(0.98); }
    .rest-unavailable { opacity:0.55; cursor:not-allowed !important; }
    .rest-card-img-wrap { position:relative; height:8rem; }
    .rest-card-img { width:100%; height:100%; object-fit:cover; }
    .rest-card-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.65),transparent); }
    .rest-unavail-badge { position:absolute; top:0.5rem; left:0.5rem; background:rgba(0,0,0,0.75); color:white; font-size:0.625rem; font-weight:700; padding:0.2rem 0.5rem; border-radius:9999px; z-index:2; }
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

    /* RESTAURANT PAGE */
    .rest-hero { position:relative; height:13rem; }
    .rest-hero-img { width:100%; height:100%; object-fit:cover; }
    .rest-hero-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.25) 50%,transparent 100%); }
    .rest-back { position:absolute; top:1rem; left:1rem; background:rgba(255,255,255,0.9) !important; }
    .rest-hero-info { position:absolute; bottom:1rem; left:1rem; right:1rem; color:white; }
    .rest-hero-name { font-size:1.25rem; font-weight:900; }
    .rest-hero-desc { font-size:0.6875rem; color:rgba(255,255,255,0.6); margin-top:0.125rem; }
    .rest-hero-meta { display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap; }
    .rest-meta-pill { display:flex; align-items:center; gap:0.25rem; background:rgba(255,255,255,0.2); backdrop-filter:blur(4px); padding:0.25rem 0.5rem; border-radius:0.5rem; font-size:0.6875rem; font-weight:500; }
    .rest-unavail-banner { background:#fee2e2; border:1px solid #fca5a5; color:#dc2626; font-weight:600; font-size:0.8125rem; padding:0.625rem 1rem; text-align:center; }
    .rest-subhdr { background:white; border-bottom:1px solid #fed7aa; padding:0.625rem 1rem; display:flex; align-items:center; justify-content:space-between; }
    .best-lbl-orange { font-size:0.625rem; color:#f97316; font-weight:700; }
    .best-val-gray { font-size:0.6875rem; color:#4b5563; max-width:190px; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
    .veg-toggle { display:flex; align-items:center; gap:0.375rem; border:2px solid #e5e7eb; border-radius:0.75rem; padding:0.375rem 0.625rem; background:white; cursor:pointer; font-size:0.6875rem; font-weight:700; color:#6b7280; font-family:'Poppins',sans-serif; }
    .veg-on { border-color:#22c55e; background:#f0fdf4; }
    .text-green { color:#15803d; }
    .menu-section { background:white; border:1px solid #fed7aa; border-radius:1rem; overflow:hidden; }
    .menu-cat-hdr { width:100%; display:flex; align-items:center; justify-content:space-between; padding:0.875rem 1rem; border:none; background:none; cursor:pointer; font-family:'Poppins',sans-serif; }
    .menu-cat-left { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; }
    .menu-cat-name { font-size:0.8125rem; font-weight:800; color:#111827; }
    .menu-cat-count { font-size:0.625rem; color:#9ca3af; background:#fff7ed; border:1px solid #fed7aa; padding:0.125rem 0.375rem; border-radius:9999px; }
    .menu-chevron { font-size:0.75rem; color:#f97316; flex-shrink:0; }
    .menu-items { border-top:1px solid #f3f4f6; }
    .menu-item-row { display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; border-bottom:1px solid #f9fafb; }
    .menu-item-row:last-child { border-bottom:none; }
    .item-unavailable { opacity:0.45; }
    .menu-item-left { flex:1; padding-right:1rem; }
    .menu-item-name-row { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.125rem; }
    .menu-item-name { font-size:0.8125rem; font-weight:600; color:#111827; }
    .student-pick { font-size:0.5625rem; background:#f97316; color:white; font-weight:900; padding:0.125rem 0.375rem; border-radius:9999px; flex-shrink:0; }
    .item-unavail-tag { font-size:0.5rem; background:#fee2e2; color:#dc2626; border:1px solid #fca5a5; font-weight:700; padding:0.1rem 0.35rem; border-radius:9999px; flex-shrink:0; }
    .menu-item-price { font-size:0.8125rem; font-weight:800; color:#1f2937; margin-left:1.375rem; }
    .price-original { font-size:0.625rem; color:#9ca3af; text-decoration:line-through; margin-left:0.25rem; font-weight:400; }
    .unavail-dash { color:#d1d5db; font-size:1rem; flex-shrink:0; }

    /* CART BAR */
    .cart-bar { position:fixed; bottom:4.5rem; left:0.75rem; right:0.75rem; background:#f97316; border-radius:1rem; display:flex; align-items:center; justify-content:space-between; padding:0.75rem 1rem; box-shadow:0 8px 24px rgba(249,115,22,0.35); cursor:pointer; z-index:40; }
    .cart-bar-left { display:flex; align-items:center; gap:0.625rem; }
    .cart-bar-count { background:rgba(255,255,255,0.2); color:white; font-size:0.875rem; font-weight:900; width:1.75rem; height:1.75rem; border-radius:0.5rem; display:flex; align-items:center; justify-content:center; }
    .cart-bar-amount { color:white; font-size:0.875rem; font-weight:700; }
    .cart-bar-cta { color:white; font-size:0.875rem; font-weight:700; }

    /* BOTTOM NAV */
    .bottom-nav { position:fixed; bottom:0; left:0; right:0; z-index:30; background:white; border-top:1px solid #ffedd5; display:grid; grid-template-columns:repeat(4,1fr); }
    .nav-tab { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:0.625rem 0; border:none; background:none; cursor:pointer; transition:transform 0.1s; font-family:'Poppins',sans-serif; }
    .nav-tab:active { transform:scale(0.93); }
    .nav-label { font-size:0.625rem; margin-top:0.25rem; color:#9ca3af; font-weight:500; }
    .nav-label-active { color:#ea580c; font-weight:700; }
    .nav-badge { position:absolute; top:-0.375rem; right:-0.5rem; background:#f97316; color:white; font-size:0.5625rem; font-weight:900; min-width:1rem; height:1rem; padding:0 0.25rem; border-radius:9999px; display:flex; align-items:center; justify-content:center; border:1.5px solid white; }

    /* CART SHEET */
    .sheet-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:50; }
    .sheet { position:fixed; bottom:0; left:0; right:0; background:white; border-radius:1.5rem 1.5rem 0 0; z-index:51; max-height:90vh; display:flex; flex-direction:column; }
    .sheet-handle-row { display:flex; justify-content:center; padding:0.75rem 0 0.25rem; }
    .sheet-handle { width:2.5rem; height:0.25rem; background:#e5e7eb; border-radius:9999px; }
    .sheet-top { display:flex; justify-content:space-between; align-items:center; padding:0.25rem 1.25rem 0.75rem; border-bottom:1px solid #f3f4f6; }
    .sheet-title { font-size:1.125rem; font-weight:900; color:#111827; }
    .sheet-close { width:2rem; height:2rem; background:#f3f4f6; border-radius:50%; border:none; cursor:pointer; font-size:0.875rem; color:#6b7280; }
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
    .delivery-section,.pay-section { display:flex; flex-direction:column; gap:0.625rem; }
    .section-label { font-size:0.6875rem; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; }
    .sheet-input { width:100%; background:white; border:1px solid #e5e7eb; border-radius:0.75rem; padding:0.625rem 0.875rem; font-size:0.8125rem; outline:none; font-family:'Poppins',sans-serif; }
    .sheet-input:focus { border-color:#fb923c; }
    .loc-picker { background:white; border:1px solid #e5e7eb; border-radius:0.75rem; overflow:hidden; }
    .loc-pick-opt { width:100%; display:flex; align-items:center; justify-content:space-between; padding:0.625rem 0.875rem; border:none; border-bottom:1px solid #f9fafb; background:white; cursor:pointer; text-align:left; font-family:'Poppins',sans-serif; }
    .loc-pick-opt:last-child { border-bottom:none; }
    .loc-pick-active { background:#fff7ed; }
    .loc-pick-name { font-size:0.8125rem; font-weight:700; color:#1f2937; }
    .active-text { color:#ea580c; }
    .loc-pick-sub { font-size:0.625rem; color:#9ca3af; }
    .loc-radio { width:1rem; height:1rem; border-radius:50%; border:2px solid #d1d5db; display:flex; align-items:center; justify-content:center; }
    .loc-radio-on { border-color:#f97316; }
    .loc-radio-dot { width:0.5rem; height:0.5rem; border-radius:50%; background:#f97316; }
    .pay-btns { display:flex; gap:0.5rem; }
    .pay-btn { flex:1; padding:0.625rem; border-radius:0.75rem; border:2px solid #e5e7eb; background:white; color:#6b7280; font-size:0.75rem; font-weight:700; cursor:pointer; font-family:'Poppins',sans-serif; }
    .pay-active { border-color:#f97316; background:#fff7ed; color:#ea580c; }
    .sheet-footer { padding:1rem 1.25rem 1.5rem; border-top:1px solid #f3f4f6; }
    .wa-btn { width:100%; background:#22c55e; color:white; border:none; border-radius:1rem; padding:1rem; font-size:0.875rem; font-weight:700; cursor:pointer; font-family:'Poppins',sans-serif; }
    .wa-btn:disabled { opacity:0.7; cursor:not-allowed; }

    /* CARD BOX */
    .card-box { background:white; border:1px solid #fed7aa; border-radius:1rem; padding:1rem; }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  private readonly sb = inject(SupabaseService);

  view: View = 'home';
  activeRest: Restaurant | null = null;
  activeCatLabel = '';
  cart: CartItem[] = [];
  isCartOpen = false;
  customerName = '';
  customerPhone = '';
  locIndex = 0;
  payMode: 'COD'|'Prepay' = 'COD';
  vegOnly = false;
  openCats: Record<string, boolean> = {};
  locationOpen = false;
  catSearch = '';
  checkoutLoading = false;

  liveOrders: LiveOrderRow[] = [];
  ordersLoaded = false;
  tickIdx = 0;
  itemCounts: Record<string, number> = {};
  restaurantCounts: Record<string, number> = {};

  private tickInterval: any;
  private realtimeChannel: any;

  readonly LOCATIONS = LOCATIONS;
  readonly RESTAURANTS = RESTAURANTS;
  readonly REVIEWS = REVIEWS;
  readonly TRENDING = TRENDING;
  readonly CATEGORY_CARDS = CATEGORY_CARDS;

  isNonVeg(n: string): boolean {
    return /chicken|mutton|fish|prawn|egg|lollipop|bone|wings|tandoori|apollo|kebab/i.test(n);
  }

  getCat(label: string) { return CATEGORY_CARDS.find(c => c.label === label)!; }
  getStars(n: number): string { return '⭐'.repeat(n); }

  async ngOnInit() {
    await this.loadTodayOrders();
    this.subscribeRealtime();
    this.tickInterval = setInterval(() => {
      if (this.liveOrders.length > 0) this.tickIdx = (this.tickIdx + 1) % this.liveOrders.length;
    }, 3500);
  }

  ngOnDestroy() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.realtimeChannel) this.sb.client.removeChannel(this.realtimeChannel);
  }

  async loadTodayOrders() {
    const { data, error } = await this.sb.client
      .from('orders').select('id,customer_name,items,created_at')
      .gte('created_at', todayStart()).order('created_at', { ascending: true });
    if (!error && data) this.processOrders(data);
    this.ordersLoaded = true;
  }

  processOrders(rawOrders: any[]) {
    const ic: Record<string,number> = {}, rc: Record<string,number> = {}, rows: LiveOrderRow[] = [];
    for (const o of rawOrders) {
      const items = o.items ?? [];
      if (!items.length) continue;
      const first = items[0];
      const rname = first.restaurant_name ?? '';
      const rObj = RESTAURANTS.find(r => r.name === rname);
      const rid = rObj?.id ?? rname.toLowerCase().replace(/\s+/g,'-');
      rows.push({ name: o.customer_name ?? 'Student', location: LOCATIONS[0].label, restaurant: rname||'CLGBITES', item: first.name, mins: minutesAgo(o.created_at) });
      for (const it of items) {
        const rId = RESTAURANTS.find(r => r.name === it.restaurant_name)?.id ?? rid;
        const k = `${rId}::${it.name}`;
        ic[k] = (ic[k]??0) + (it.qty??1);
        rc[rId] = (rc[rId]??0) + (it.qty??1);
      }
    }
    this.liveOrders = rows; this.itemCounts = ic; this.restaurantCounts = rc;
    if (this.tickIdx >= rows.length) this.tickIdx = 0;
  }

  subscribeRealtime() {
    this.realtimeChannel = this.sb.client.channel('orders-live')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'orders' }, (payload) => {
        const o = payload.new as any;
        const items = o.items ?? [];
        if (!items.length) return;
        const first = items[0];
        const rname = first.restaurant_name ?? '';
        const rObj = RESTAURANTS.find(r => r.name === rname);
        const rid = rObj?.id ?? rname.toLowerCase().replace(/\s+/g,'-');
        this.liveOrders = [...this.liveOrders, { name: o.customer_name??'Student', location: LOCATIONS[0].label, restaurant: rname||'CLGBITES', item: first.name, mins: 0 }];
        const ic = {...this.itemCounts}, rc = {...this.restaurantCounts};
        for (const it of items) {
          const rId = RESTAURANTS.find(r => r.name === it.restaurant_name)?.id ?? rid;
          const k = `${rId}::${it.name}`;
          ic[k] = (ic[k]??0)+(it.qty??1); rc[rId] = (rc[rId]??0)+(it.qty??1);
        }
        this.itemCounts = ic; this.restaurantCounts = rc;
      }).subscribe();
  }

  getTrendingCount(rid: string, item: string): number { return this.itemCounts[`${rid}::${item}`] ?? 0; }
  getRestaurantOrders(rid: string): number { return this.restaurantCounts[rid] ?? 0; }
  getRestaurantBarPct(rid: string): number {
    const max = Math.max(...RESTAURANTS.map(r => this.getRestaurantOrders(r.id)), 1);
    return (this.getRestaurantOrders(rid) / max) * 100;
  }

  get cartTotal() { return this.cart.reduce((s,i) => s+i.price*i.qty, 0); }
  get cartCount() { return this.cart.reduce((s,i) => s+i.qty, 0); }
  get deliveryFee() { return LOCATIONS[this.locIndex].fee; }

  get cartByRestaurant(): { name:string; items:CartItem[] }[] {
    const map: Record<string, CartItem[]> = {};
    for (const i of this.cart) {
      if (!map[i.restaurantName]) map[i.restaurantName] = [];
      map[i.restaurantName].push(i);
    }
    return Object.entries(map).map(([name, items]) => ({ name, items }));
  }

  gq(rid: string, name: string): number {
    return this.cart.find(i => i.restaurantId===rid && i.itemName===name)?.qty ?? 0;
  }

  uq(rid: string, rname: string, iname: string, price: number, delta: number, vegFlag = false) {
    const ex = this.cart.find(i => i.restaurantId===rid && i.itemName===iname);
    if (ex) {
      const nq = ex.qty + delta;
      if (nq <= 0) this.cart = this.cart.filter(i => !(i.restaurantId===rid && i.itemName===iname));
      else this.cart = this.cart.map(i => i.restaurantId===rid && i.itemName===iname ? {...i,qty:nq} : i);
    } else if (delta > 0) {
      this.cart = [...this.cart, { restaurantId:rid, restaurantName:rname, itemName:iname, price, qty:1, isVeg:vegFlag }];
    }
  }

  goCategory(label: string) { this.activeCatLabel = label; this.catSearch = ''; this.view = 'category'; }

  openRestaurant(r: Restaurant) {
    this.activeRest = r; this.view = 'restaurant'; this.vegOnly = false; this.catSearch = '';
    const init: Record<string,boolean> = {};
    r.menu.forEach((c,i) => { init[c.category] = i===0; });
    this.openCats = init;
  }

  toggleCat(cat: string) { this.openCats = {...this.openCats, [cat]: !this.openCats[cat]}; }

  get categoryList(): Restaurant[] {
    const base = this.activeCatLabel === 'All'
      ? [...RESTAURANTS]
      : [...RESTAURANTS].filter(r => r.categories.includes(this.activeCatLabel));
    const q = this.catSearch.trim().toLowerCase();
    const filtered = q ? base.filter(r =>
      r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) ||
      r.bestItem.toLowerCase().includes(q) ||
      r.menu.some(cat => cat.items.some(item => item.name.toLowerCase().includes(q)))
    ) : base;
    return filtered.sort((a, b) => {
      const aA = this.adminService.isRestaurantAvailable(a.id) ? 0 : 1;
      const bA = this.adminService.isRestaurantAvailable(b.id) ? 0 : 1;
      if (aA !== bA) return aA - bA;
      return this.getRestaurantOrders(b.id) - this.getRestaurantOrders(a.id);
    });
  }

  get filteredMenu(): MenuCategory[] {
    if (!this.activeRest) return [];
    return this.activeRest.menu
      .map(cat => ({ ...cat, items: this.vegOnly ? cat.items.filter(i => i.veg === true) : cat.items }))
      .filter(cat => cat.items.length > 0);
  }

  async checkout() {
    if (!this.customerName.trim() || !this.customerPhone.trim()) { alert('Please fill your name and phone.'); return; }
    this.checkoutLoading = true;
    const orderItems = this.cart.map(i => ({ name:i.itemName, qty:i.qty, restaurant_name:i.restaurantName }));
    const total = this.cartTotal + this.deliveryFee;
    const loc = LOCATIONS[this.locIndex];
    let tokenNumber = 1;
    try {
      const { data: rpcData, error: rpcErr } = await this.sb.client.rpc('get_next_daily_token');
      if (!rpcErr && rpcData != null) tokenNumber = rpcData as number;
      else {
        const { data: maxRow } = await this.sb.client.from('orders').select('id').order('id',{ascending:false}).limit(1).single();
        tokenNumber = ((maxRow as any)?.id ?? 0) + 1;
      }
    } catch { tokenNumber = Date.now() % 100000; }
    const { error: insertError } = await this.sb.client.from('orders').insert([{
      id: tokenNumber, token_number: tokenNumber,
      customer_name: this.customerName.trim(), customer_phone: this.customerPhone.trim(),
      items: orderItems, payment_mode: this.payMode === 'COD' ? 'cod' : 'prepaid',
      total, deliver_status: 'pending', pay_status: 'pending',
    }]);
    if (insertError?.code === '23505') {
      const fb = Date.now() % 1000000;
      await this.sb.client.from('orders').insert([{ id:fb, token_number:fb, customer_name:this.customerName.trim(), customer_phone:this.customerPhone.trim(), items:orderItems, payment_mode:this.payMode==='COD'?'cod':'prepaid', total, deliver_status:'pending', pay_status:'pending' }]);
      tokenNumber = fb;
    }
    let msg = `*🍽️ CLGBITES Order — Token #${tokenNumber}*\n\n*Name:* ${this.customerName.trim()}\n*Phone:* ${this.customerPhone.trim()}\n*Location:* ${loc.label}\n*Payment:* ${this.payMode}\n\n`;
    this.cart.forEach(i => { msg += `• ${i.qty}× ${i.itemName} (${i.restaurantName}) — ₹${i.price*i.qty}\n`; });
    msg += `\n*Subtotal:* ₹${this.cartTotal}`;
    if (this.deliveryFee) msg += `\n*Delivery:* ₹${this.deliveryFee}`;
    msg += `\n*Total:* ₹${total}\n*Token:* #${tokenNumber}`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
    this.cart = []; this.isCartOpen = false; this.checkoutLoading = false; this.view = 'success';
  }
}