import {
  Component, OnInit, OnDestroy, signal, inject, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { OrdersService, Order, OrderItem } from '../../services/orders.service';

// ── Menu data (same as project2) ─────────────────────────────────────────────
const MENU_DATA: Record<string, { label: string; emoji: string; items: { id: string; name: string; price: number }[] }> = {
  biryani: { label: 'Biryani', emoji: '🍚', items: [
    { id: 'b1', name: 'Chicken Dum Biryani', price: 199 }, { id: 'b2', name: 'Chicken Fry Piece Biryani', price: 219 },
    { id: 'b3', name: 'Chicken Mixed Biryani', price: 219 }, { id: 'b4', name: 'Chicken Mughali Biryani', price: 249 },
    { id: 'b5', name: 'Chicken Special Biryani', price: 249 }, { id: 'b6', name: 'Veg Biryani', price: 179 },
    { id: 'b7', name: 'Special Veg Biryani', price: 189 }, { id: 'b8', name: 'Paneer Biryani', price: 229 },
  ]},
  pulaoRice: { label: 'Pulao & Fried Rice', emoji: '🍛', items: [
    { id: 'p1', name: 'Bagara Rice Chicken Fry', price: 219 }, { id: 'p2', name: 'Veg Fried Rice', price: 169 },
    { id: 'p3', name: 'Sp Veg Fried Rice', price: 229 },
  ]},
  tandoori: { label: 'Tandoori Specialties', emoji: '🔥', items: [
    { id: 't1', name: 'Tandoori Chicken Full', price: 550 }, { id: 't2', name: 'Tandoori Chicken Half', price: 300 },
    { id: 't3', name: 'Tangdi Kabab (4 Pcs)', price: 390 }, { id: 't4', name: 'Kalmi Kabab (4 Pcs)', price: 390 },
    { id: 't5', name: 'Reshmi Kabab', price: 350 }, { id: 't6', name: 'Chicken Tikka', price: 350 },
    { id: 't7', name: 'Murg Malai Kabab', price: 350 }, { id: 't8', name: 'Fish Tikka', price: 350 },
    { id: 't9', name: 'Prawns Tikka', price: 450 }, { id: 't10', name: 'Boti Kabab', price: 400 },
    { id: 't11', name: 'Chicken Seekh Kebab', price: 350 }, { id: 't12', name: 'Non Veg Tandoori Platter', price: 450 },
    { id: 't13', name: 'Paneer Tikka', price: 300 }, { id: 't14', name: 'Haraba Kabab', price: 250 },
    { id: 't15', name: 'Veg Seekh Kebab', price: 250 }, { id: 't16', name: 'Veg Tandoori Platter', price: 450 },
  ]},
};
const MENU_SUGGESTIONS = Object.values(MENU_DATA).flatMap(c => c.items.map(i => i.name));

type AdminTab = 'overview' | 'menu-items' | 'orders' | 'showoff';

interface LocalOrder {
  id: number | string;
  token: string;
  name: string;
  phone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'delivered';
  payment: 'COD' | 'Prepaid';
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
  pendingAmount?: number;
  orderedAt: Date;
  isNew?: boolean;
  fadingOut?: boolean;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDT(d: Date): string {
  const dd = String(d.getDate()).padStart(2,'0'), mon = MONTHS[d.getMonth()];
  let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${dd} ${mon} | ${String(h).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${ap}`;
}
function tokenNum(t: string): number { return parseInt(t.replace(/\D/g,''), 10) || 0; }

function apiToLocal(o: Order, tokenIndex: number): LocalOrder {
  return {
    id: o.id,
    token: `#${String(tokenIndex).padStart(3,'0')}`,
    name: o.customer_name ?? '—',
    phone: o.customer_phone ?? '—',
    items: (o.items ?? []).map((it: any) => ({ name: it.name, qty: it.qty ?? 1 })),
    total: o.total ?? 0,
    status: o.deliver_status === 'delivered' ? 'delivered' : 'pending',
    payment: o.payment_mode === 'cod' ? 'COD' : 'Prepaid',
    paymentStatus: o.pay_status !== 'pending' ? o.pay_status as any : undefined,
    pendingAmount: o.pending_amount ?? undefined,
    orderedAt: new Date(o.created_at ?? Date.now()),
  };
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- ═══════════════ NEW-ORDER TOAST ═══════════════ -->
<div *ngIf="globalToastName" class="global-toast">
  <div class="toast-icon">📶</div>
  <div>
    <p class="toast-sub">New order from</p>
    <p class="toast-name">{{ globalToastName }}</p>
  </div>
  <button class="toast-close" (click)="globalToastName=''">✕</button>
</div>

<div class="admin-wrap">
  <div *ngIf="sidebarOpen" class="sidebar-overlay" (click)="sidebarOpen=false"></div>

  <!-- Sidebar -->
  <aside class="sidebar" [class.open]="sidebarOpen">
    <div class="sidebar-header">
      <span class="brand">CLGBITES <span class="brand-orange">Admin</span></span>
      <button class="icon-btn" (click)="sidebarOpen=false">✕</button>
    </div>
    <nav class="nav">
      <button class="nav-pill" [class.active]="activeTab==='overview'"   (click)="setTab('overview');   sidebarOpen=false">📊 Overview</button>
      <button class="nav-pill" [class.active]="activeTab==='menu-items'" (click)="setTab('menu-items'); sidebarOpen=false">🍽️ Menu Items</button>
      <button class="nav-pill" [class.active]="activeTab==='orders'"     (click)="setTab('orders');     sidebarOpen=false">📋 Today's Orders</button>
      <button class="nav-pill" [class.active]="activeTab==='showoff'"    (click)="setTab('showoff');    sidebarOpen=false">⭐ Show Off</button>
    </nav>
    <div class="sidebar-footer">
      <button class="nav-pill danger" (click)="logout(); sidebarOpen=false">🚪 Logout</button>
    </div>
  </aside>

  <div class="main">
    <!-- Topbar -->
    <header class="topbar">
      <button class="icon-btn" (click)="sidebarOpen=true">☰</button>
      <div class="topbar-center">
        <span class="brand">CLGBITES <span class="brand-orange">Admin</span></span>
        <span *ngIf="statusMsg" class="status-badge" [class.ok]="statusMsg.includes('✓')" [class.err]="!statusMsg.includes('✓')">{{ statusMsg }}</span>
      </div>
      <div class="topbar-right">
        <button class="back-site-btn" (click)="goHome()">← Site</button>
        <button class="icon-btn" (click)="logout()">🚪</button>
      </div>
    </header>

    <main class="content-wrap">
      <div class="content-inner">
        <h1 class="page-title">{{ tabTitle }}</h1>

        <!-- ══ OVERVIEW ══ -->
        <div *ngIf="activeTab==='overview'" class="tab-content">
          <div class="card">
            <p class="label-cap">Site Status</p>
            <div class="site-status-row">
              <div>
                <p class="site-status-title">{{ siteOnline ? 'Orders Open' : 'Orders Closed' }}</p>
                <p class="site-status-sub">{{ siteOnline ? 'Accepting new orders' : 'Not accepting orders' }}</p>
              </div>
              <label class="toggle-wrap" [class.on]="siteOnline" (click)="toggleSiteOnline()">
                <span class="toggle-thumb"></span>
              </label>
            </div>
            <div class="live-badge" [class.live]="siteOnline" [class.offline]="!siteOnline">
              <span class="dot" [class.green]="siteOnline" [class.red]="!siteOnline" [class.pulse]="siteOnline"></span>
              {{ siteOnline ? 'Live' : 'Offline' }}
            </div>
          </div>

          <div class="section-header">
            <p class="label-cap">Today's Stats</p>
            <span class="live-chip"><span class="dot green pulse"></span>Live</span>
          </div>
          <div class="stats-grid">
            <div class="stat-card" *ngFor="let stat of overviewStats">
              <div class="stat-top">
                <span class="stat-label">{{ stat.label }}</span>
                <div class="stat-icon" [style.background]="stat.bg">{{ stat.icon }}</div>
              </div>
              <p class="stat-value">{{ stat.value }}</p>
            </div>
          </div>

          <div class="card" style="margin-top:16px">
            <p class="label-cap" style="margin-bottom:12px">Recent Orders</p>
            <div *ngIf="loading && apiOrders.length===0" class="empty-msg">Loading…</div>
            <div *ngIf="!loading && recentOrders.length===0" class="empty-msg">No orders yet today 🎉</div>
            <div *ngFor="let o of recentOrders; let i=index">
              <hr *ngIf="i>0" class="divider" />
              <div class="recent-order-row">
                <div class="recent-order-left">
                  <span class="tag-orange">#{{ padToken(apiOrders.indexOf(o)+1) }}</span>
                  <div>
                    <p class="order-name">{{ o.customer_name }}</p>
                    <p class="order-items-sub">{{ getItemNames(o) }}</p>
                  </div>
                </div>
                <div class="recent-order-right">
                  <p class="order-total">₹{{ o.total }}</p>
                  <span [class]="o.payment_mode==='cod' ? 'tag-cod' : 'tag-pre'">{{ o.payment_mode==='cod' ? 'COD' : 'Prepaid' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ MENU ITEMS ══ -->
        <div *ngIf="activeTab==='menu-items'" class="tab-content">
          <div class="search-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" [(ngModel)]="menuSearch" placeholder="Search menu items…" class="search-input" />
          </div>
          <div *ngFor="let cat of filteredMenuCategories" class="menu-cat-card">
            <div class="menu-cat-header">
              <span>{{ cat.emoji }}</span>
              <span class="menu-cat-label">{{ cat.label }}</span>
              <span class="menu-cat-count">{{ cat.items.length }} items</span>
            </div>
            <div *ngFor="let item of cat.items; let i=index">
              <hr *ngIf="i>0" class="divider" />
              <div class="menu-item-row">
                <div>
                  <p class="menu-item-name" [class.disabled-item]="!isItemOn(item.id)">{{ item.name }}</p>
                  <p class="menu-item-price">₹{{ item.price }}</p>
                </div>
                <label class="toggle-wrap" [class.on]="isItemOn(item.id)" (click)="toggleItem(item.id)">
                  <span class="toggle-thumb"></span>
                </label>
              </div>
            </div>
          </div>
          <div *ngIf="filteredMenuCategories.length===0" class="empty-msg">No items match "{{ menuSearch }}"</div>
        </div>

        <!-- ══ TODAY'S ORDERS ══ -->
        <div *ngIf="activeTab==='orders'" class="tab-content">
          <div *ngIf="ordersToast" class="inline-toast">📶 {{ ordersToast }}</div>

          <!-- UPDATE MODAL -->
          <div *ngIf="updModal" class="sheet-overlay" (click)="updModal=null">
            <div class="sheet" (click)="$event.stopPropagation()">
              <div class="sheet-header">
                <div>
                  <h3 class="sheet-title">Update Order</h3>
                  <p class="sheet-sub">{{ updModal.token }} · {{ updModal.name }}</p>
                </div>
                <button class="icon-btn" (click)="updModal=null">✕</button>
              </div>
              <div class="upd-items-list">
                <p *ngIf="updItems.length===0" class="empty-msg">No items — add below.</p>
                <div *ngFor="let item of updItems; let idx=index" class="upd-item-row">
                  <span class="upd-item-name">{{ item.name }}</span>
                  <button class="qty-btn" (click)="chUpdQty(idx,-1)" [disabled]="item.qty<=1">−</button>
                  <span class="qty-val">{{ item.qty }}</span>
                  <button class="qty-btn" (click)="chUpdQty(idx,1)">+</button>
                  <button class="qty-btn danger" (click)="remUpdItem(idx)">🗑</button>
                </div>
              </div>
              <div class="add-item-section">
                <p class="label-cap" style="margin-bottom:8px">Add New Item</p>
                <div class="add-item-row">
                  <div class="sugg-wrap">
                    <input type="text" [(ngModel)]="newItemName" (ngModelChange)="onNewItemNameChange()"
                      placeholder="Type to search menu…" class="search-input" style="padding-left:12px" />
                    <div *ngIf="showSugg && filteredSugg.length>0" class="sugg-drop">
                      <button *ngFor="let s of filteredSugg; let si=index" class="sugg-item"
                        [class.hi]="si===suggHiIdx" (mousedown)="selSugg(s)">{{ s }}</button>
                    </div>
                  </div>
                  <div class="qty-ctrl">
                    <button class="qty-btn" (click)="newItemQty=newItemQty>1?newItemQty-1:1">−</button>
                    <span class="qty-val">{{ newItemQty }}</span>
                    <button class="qty-btn" (click)="newItemQty=newItemQty+1">+</button>
                  </div>
                  <button class="btn-dark" style="padding:6px 12px;font-size:12px;border-radius:10px" (click)="addUpdItem()">+ Add</button>
                </div>
              </div>
              <div class="sheet-actions">
                <button class="btn-ghost" (click)="updModal=null">Cancel</button>
                <button class="btn-orange" (click)="doUpdateOrder()">Save Changes</button>
              </div>
            </div>
          </div>

          <!-- PAY MODAL -->
          <div *ngIf="payModal" class="sheet-overlay" (click)="payModal=null">
            <div class="sheet" (click)="$event.stopPropagation()">
              <div class="sheet-header">
                <h3 class="sheet-title">Payment Status</h3>
                <button class="icon-btn" (click)="payModal=null">✕</button>
              </div>
              <p class="sheet-sub" style="margin-bottom:16px">{{ payModal.token }} · {{ payModal.name }} · ₹{{ payModal.total }}</p>
              <div class="pay-options">
                <button class="pay-opt" [class.sel-paid]="paySelStatus==='paid'"       (click)="paySelStatus='paid'">✅ Paid</button>
                <button class="pay-opt" [class.sel-unpaid]="paySelStatus==='unpaid'"   (click)="paySelStatus='unpaid'">✕ Not Paid</button>
                <button class="pay-opt" [class.sel-pending]="paySelStatus==='pending'" (click)="paySelStatus='pending'">📄 Pending</button>
              </div>
              <div *ngIf="paySelStatus==='pending'" style="margin-top:8px">
                <input type="number" [(ngModel)]="payPendingAmt" placeholder="Enter amount" class="search-input" style="padding-left:12px" />
              </div>
              <div class="sheet-actions" style="margin-top:20px">
                <button class="btn-ghost" (click)="payModal=null">Cancel</button>
                <button class="btn-orange" [disabled]="!payOk" (click)="doDeliver()">Confirm &amp; Deliver</button>
              </div>
            </div>
          </div>

          <!-- DELETE MODAL -->
          <div *ngIf="delModal" class="sheet-overlay" (click)="delModal=null">
            <div class="sheet" (click)="$event.stopPropagation()">
              <div class="del-header">
                <div class="del-icon">🗑️</div>
                <div>
                  <h3 class="sheet-title">Delete Order?</h3>
                  <p class="sheet-sub">{{ delModal.token }} · {{ delModal.name }}</p>
                </div>
              </div>
              <p style="font-size:13px;color:#8B7355;margin:0 0 20px">This will permanently remove this order.</p>
              <div class="sheet-actions">
                <button class="btn-ghost" (click)="delModal=null">Cancel</button>
                <button class="btn-red" (click)="doDeleteOrder()">Delete Order</button>
              </div>
            </div>
          </div>

          <!-- Toolbar -->
          <div class="orders-toolbar">
            <div class="search-wrap" style="flex:1">
              <span class="search-icon">🔍</span>
              <input type="text" [(ngModel)]="ordersSearch" placeholder="Search…" class="search-input" />
            </div>
            <button class="btn-ghost sm" (click)="loadData()" [disabled]="loading || busy">{{ loading ? '…' : '↻' }}</button>
            <button class="btn-orange sm" (click)="doExport()" [disabled]="busy || localOrders.length===0">⬇ Export</button>
            <button [class]="ordersExported?'btn-red sm':'btn-ghost sm'"
              (click)="doClear()" [disabled]="!ordersExported || busy || localOrders.length===0"
              [title]="!ordersExported?'Export first to enable Clear':'Clear all orders'">🗑 Clear</button>
          </div>

          <div class="orders-summary">
            <span><strong>{{ localOrders.length }}</strong> orders ·
              <span style="color:#D97706">{{ pendingCount }} pending</span> ·
              <span style="color:#065F46">{{ deliveredCount }} delivered</span>
            </span>
            <span class="live-chip"><span class="dot green pulse"></span>Live</span>
          </div>

          <!-- Pending -->
          <div *ngIf="pendingOrders.length>0">
            <div class="section-label">
              <span class="sec-label-text" style="color:#D97706">PENDING ORDERS</span>
              <span class="sec-count" style="background:#FEF9C3;color:#D97706">{{ pendingOrders.length }}</span>
              <div class="sec-line"></div>
            </div>
            <div class="orders-list">
              <div *ngFor="let o of pendingOrders" class="order-card" [class.fading]="o.fadingOut">
                <div class="order-card-top">
                  <div style="display:flex;align-items:center;gap:6px">
                    <span *ngIf="o.isNew" class="new-badge">NEW</span>
                    <span class="tag-orange">{{ o.token }}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span [class]="o.payment==='COD'?'tag-cod':'tag-pre'">{{ o.payment }}</span>
                    <span *ngIf="o.paymentStatus==='paid'"    class="pay-badge paid">Paid</span>
                    <span *ngIf="o.paymentStatus==='unpaid'"  class="pay-badge unpaid">Unpaid</span>
                    <span *ngIf="o.paymentStatus==='pending'" class="pay-badge pend">Pending {{ o.pendingAmount ? '₹'+o.pendingAmount : '' }}</span>
                  </div>
                </div>
                <div class="order-card-body">
                  <p class="order-cust-name">{{ o.name }}</p>
                  <p class="order-phone">📞 {{ o.phone }}</p>
                  <p class="order-time">🕒 {{ fmtDT(o.orderedAt) }}</p>
                </div>
                <div class="order-items-box">
                  <div *ngFor="let it of o.items" class="order-item-row">
                    <span>{{ it.name }}</span><span>×{{ it.qty }}</span>
                  </div>
                </div>
                <div class="order-card-footer">
                  <span class="order-total-big">₹{{ o.total }}</span>
                  <div class="order-actions">
                    <button class="action-btn" (click)="openUpdModal(o)">✏️</button>
                    <button class="action-btn danger" (click)="openDelModal(o)">🗑️</button>
                    <button class="deliver-btn" (click)="openPayModal(o)">✔ Deliver</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="pendingOrders.length===0 && !ordersSearch" class="empty-center">
            <p style="font-size:32px;margin:0">✔</p>
            <p style="font-size:13px;font-weight:500;color:#8B7355;margin:8px 0 0">All caught up!</p>
          </div>

          <!-- Delivered -->
          <div *ngIf="deliveredOrders.length>0" style="margin-top:16px">
            <div class="section-label">
              <span class="sec-label-text" style="color:#065F46">DELIVERED ORDERS</span>
              <span class="sec-count" style="background:#ECFDF5;color:#065F46">{{ deliveredOrders.length }}</span>
              <div class="sec-line"></div>
            </div>
            <div class="orders-list">
              <div *ngFor="let o of deliveredOrders" class="order-card" style="opacity:.55">
                <div class="order-card-top">
                  <span class="tag-orange">{{ o.token }}</span>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span [class]="o.payment==='COD'?'tag-cod':'tag-pre'">{{ o.payment }}</span>
                    <span *ngIf="o.paymentStatus==='paid'"    class="pay-badge paid">Paid</span>
                    <span *ngIf="o.paymentStatus==='unpaid'"  class="pay-badge unpaid">Unpaid</span>
                    <span *ngIf="o.paymentStatus==='pending'" class="pay-badge pend">Pending {{ o.pendingAmount ? '₹'+o.pendingAmount : '' }}</span>
                  </div>
                </div>
                <div class="order-card-body">
                  <p class="order-cust-name">{{ o.name }}</p>
                  <p class="order-phone">📞 {{ o.phone }}</p>
                  <p class="order-time">🕒 {{ fmtDT(o.orderedAt) }}</p>
                </div>
                <div class="order-items-box">
                  <div *ngFor="let it of o.items" class="order-item-row">
                    <span>{{ it.name }}</span><span>×{{ it.qty }}</span>
                  </div>
                </div>
                <div class="order-card-footer">
                  <span class="order-total-big">₹{{ o.total }}</span>
                  <div class="order-actions">
                    <button class="action-btn" (click)="openUpdModal(o)">✏️</button>
                    <button class="action-btn danger" (click)="openDelModal(o)">🗑️</button>
                    <button class="deliver-btn" style="background:#ECFDF5;color:#065F46;cursor:default" disabled>✔ Delivered</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="localOrders.length===0" class="empty-center">
            <p style="font-size:40px;margin:0">📋</p>
            <p style="font-size:13px;font-weight:500;color:#8B7355;margin:8px 0 0">No orders today</p>
          </div>
        </div>

        <!-- ══ SHOW OFF ══ -->
        <div *ngIf="activeTab==='showoff'" class="tab-content">
          <div *ngIf="showoffToast" class="inline-toast">📶 {{ showoffToast }}</div>

          <div class="orders-toolbar">
            <button class="btn-wa" [disabled]="showoffDisplay.length===0" (click)="doWhatsApp()">💬 Share on WhatsApp</button>
            <button class="btn-orange sm" (click)="doShowOffExport()" [disabled]="showoffDisplay.length===0">⬇ Export</button>
            <button [class]="canShowOffClear?'btn-red sm':'btn-ghost sm'"
              (click)="doShowOffClear()" [disabled]="!canShowOffClear"
              [title]="!showoffExported?'Export first':'Clear the list'">🗑 Clear</button>
          </div>

          <div class="perf-banner">
            <div class="perf-header"><span>📈</span><span>Today's Performance</span></div>
            <p class="perf-num">{{ showoffTotal }}</p>
            <p class="perf-sub">Total items sold today</p>
            <div *ngIf="showoffTop && !showoffUiCleared" class="perf-top">
              <p class="perf-top-label">Top Seller</p>
              <p class="perf-top-val">{{ showoffTop.name }} — {{ showoffTop.qty }}</p>
            </div>
          </div>

          <div *ngIf="showoffDisplay.length>0" class="menu-cat-card">
            <div class="menu-cat-header"><span class="menu-cat-label">Bestsellers</span></div>
            <div *ngFor="let item of showoffDisplay; let idx=index">
              <hr *ngIf="idx>0" class="divider" />
              <div class="showoff-item-row">
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="showoff-rank">{{ idx+1 }}</span>
                  <span class="showoff-name">{{ item.name }}</span>
                </div>
                <span class="showoff-qty">{{ item.qty }}</span>
              </div>
              <div class="showoff-bar-wrap">
                <div class="showoff-bar" [style.width.%]="showoffDisplay[0].qty>0 ? (item.qty/showoffDisplay[0].qty*100) : 0"></div>
              </div>
            </div>
          </div>

          <div *ngIf="showoffDisplay.length===0" class="empty-center">
            <p style="font-size:36px;margin:0">📈</p>
            <p style="font-size:13px;color:#8B7355;margin:8px 0 0">No orders yet — start taking orders!</p>
          </div>
        </div>

      </div>
    </main>
  </div>
</div>
  `,
  styles: [`
    :host { --brand:#3D2C1E; --orange:#E8762C; --muted:#8B7355; --border:#EDE5D8; --stripe:#FAF7F2; --chip:#F5EFE7; }
    .admin-wrap { display:flex; min-height:100vh; background:#FAF7F2; font-family:'Inter',system-ui,sans-serif; }
    .global-toast { position:fixed; top:68px; left:50%; transform:translateX(-50%); z-index:9999; display:flex; align-items:center; gap:10px; background:#FFF3E6; color:var(--brand); padding:10px 16px; border-radius:99px; box-shadow:0 4px 20px rgba(232,118,44,.22); border:1.5px solid var(--orange); max-width:85vw; animation:slideIn .3s ease; }
    .toast-icon { width:28px; height:28px; border-radius:50%; background:var(--orange); display:flex; align-items:center; justify-content:center; font-size:12px; color:#fff; }
    .toast-sub { margin:0; font-size:11px; color:var(--muted); font-weight:500; }
    .toast-name { margin:0; font-size:14px; font-weight:800; color:var(--brand); }
    .toast-close { background:var(--chip); border:1px solid var(--border); border-radius:99px; width:20px; height:20px; cursor:pointer; font-size:10px; margin-left:4px; }
    .sidebar-overlay { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,.45); backdrop-filter:blur(3px); }
    .sidebar { position:fixed; top:0; left:0; height:100%; width:272px; background:#fff; z-index:51; box-shadow:4px 0 32px rgba(0,0,0,.12); transform:translateX(-100%); transition:transform .3s cubic-bezier(.4,0,.2,1); display:flex; flex-direction:column; }
    .sidebar.open { transform:translateX(0); }
    .sidebar-header { display:flex; align-items:center; justify-content:space-between; padding:0 20px; height:56px; border-bottom:1px solid var(--border); }
    .nav { padding:16px; display:flex; flex-direction:column; gap:4px; flex:1; }
    .nav-pill { display:flex; align-items:center; gap:10px; width:100%; padding:10px 16px; border-radius:12px; border:none; cursor:pointer; font-size:14px; font-weight:500; text-align:left; background:transparent; color:var(--brand); transition:all .15s; font-family:inherit; }
    .nav-pill:hover { background:var(--chip); }
    .nav-pill.active { background:var(--orange); color:#fff; }
    .nav-pill.danger { color:#EF4444; }
    .sidebar-footer { padding:16px; border-top:1px solid var(--border); }
    .topbar { position:fixed; top:0; left:0; right:0; z-index:40; background:#fff; border-bottom:1px solid var(--border); box-shadow:0 1px 3px rgba(0,0,0,.06); display:flex; align-items:center; justify-content:space-between; padding:0 16px; height:56px; }
    .topbar-center { display:flex; align-items:center; gap:10px; }
    .topbar-right { display:flex; align-items:center; gap:4px; }
    .brand { font-size:15px; font-weight:800; color:var(--brand); }
    .brand-orange { color:var(--orange); }
    .status-badge { font-size:11px; font-weight:600; padding:2px 10px; border-radius:99px; }
    .status-badge.ok { background:#D1FAE5; color:#065F46; }
    .status-badge.err { background:#FEE2E2; color:#B91C1C; }
    .back-site-btn { font-size:12px; font-weight:600; color:var(--muted); background:none; border:none; cursor:pointer; padding:6px 10px; }
    .icon-btn { padding:8px; border-radius:10px; border:none; background:transparent; cursor:pointer; font-size:16px; }
    .main { flex:1; display:flex; flex-direction:column; }
    .content-wrap { padding-top:56px; }
    .content-inner { padding:16px; max-width:600px; margin:0 auto; padding-bottom:40px; }
    .page-title { font-size:18px; font-weight:800; color:var(--brand); margin:0 0 16px; }
    .tab-content { display:flex; flex-direction:column; gap:16px; }
    .card { background:#fff; border-radius:16px; border:1px solid var(--border); box-shadow:0 1px 4px rgba(0,0,0,.05); padding:16px; }
    .label-cap { font-size:11px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.06em; margin:0 0 12px; }
    .divider { border-top:1px solid var(--chip); margin:0; }
    .empty-msg { text-align:center; padding:24px 0; font-size:13px; color:var(--muted); }
    .empty-center { text-align:center; padding:64px 0; color:var(--muted); }
    .toggle-wrap { position:relative; display:inline-flex; align-items:center; width:44px; height:26px; border-radius:99px; cursor:pointer; background:#C8BBAA; flex-shrink:0; transition:background .25s; border:none; }
    .toggle-wrap.on { background:var(--orange); }
    .toggle-thumb { position:absolute; top:3px; left:3px; width:20px; height:20px; border-radius:50%; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,.2); transition:left .25s; pointer-events:none; }
    .toggle-wrap.on .toggle-thumb { left:21px; }
    .site-status-row { display:flex; align-items:center; justify-content:space-between; }
    .site-status-title { font-size:15px; font-weight:700; color:var(--brand); margin:0; }
    .site-status-sub { font-size:12px; color:var(--muted); margin-top:2px; }
    .live-badge { margin-top:12px; display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:8px; font-size:12px; font-weight:600; }
    .live-badge.live { background:#ECFDF5; color:#065F46; }
    .live-badge.offline { background:#FEF2F2; color:#B91C1C; }
    .dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }
    .dot.green { background:#10B981; }
    .dot.red { background:#EF4444; }
    .dot.pulse { animation:pulse 1.5s infinite; }
    .live-chip { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:600; color:#065F46; }
    .section-header { display:flex; align-items:center; justify-content:space-between; }
    .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .stat-card { background:#fff; border-radius:16px; border:1px solid var(--border); box-shadow:0 1px 4px rgba(0,0,0,.05); padding:16px; }
    .stat-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    .stat-label { font-size:12px; color:var(--muted); }
    .stat-icon { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; }
    .stat-value { font-size:22px; font-weight:800; color:var(--brand); margin:0; }
    .recent-order-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; }
    .recent-order-left { display:flex; align-items:center; gap:10px; }
    .recent-order-right { text-align:right; }
    .order-name { font-size:13px; font-weight:600; color:var(--brand); margin:0; }
    .order-items-sub { font-size:11px; color:var(--muted); margin-top:2px; }
    .order-total { font-size:13px; font-weight:700; color:var(--brand); margin:0; }
    .tag-orange { font-size:11px; font-weight:700; color:var(--orange); background:#FEF0E6; padding:3px 8px; border-radius:8px; }
    .tag-cod { font-size:11px; font-weight:600; color:#6F42C1; background:#F0EBFD; padding:2px 8px; border-radius:99px; }
    .tag-pre { font-size:11px; font-weight:600; color:#2C7BE8; background:#E6EFFD; padding:2px 8px; border-radius:99px; }
    .search-wrap { position:relative; }
    .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); pointer-events:none; font-size:14px; }
    .search-input { width:100%; background:var(--stripe); border:1px solid var(--border); border-radius:12px; padding:10px 12px 10px 36px; font-size:14px; color:var(--brand); outline:none; box-sizing:border-box; font-family:inherit; }
    .search-input:focus { border-color:var(--orange); }
    .menu-cat-card { background:#fff; border-radius:16px; border:1px solid var(--border); overflow:hidden; box-shadow:0 1px 4px rgba(0,0,0,.05); }
    .menu-cat-header { display:flex; align-items:center; gap:8px; padding:12px 16px; background:var(--stripe); border-bottom:1px solid var(--border); }
    .menu-cat-label { font-size:14px; font-weight:700; color:var(--brand); }
    .menu-cat-count { margin-left:auto; font-size:11px; font-weight:500; color:var(--muted); background:var(--border); padding:2px 8px; border-radius:99px; }
    .menu-item-row { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; }
    .menu-item-name { font-size:13px; font-weight:500; color:var(--brand); margin:0; }
    .menu-item-name.disabled-item { text-decoration:line-through; color:var(--muted); }
    .menu-item-price { font-size:12px; color:var(--muted); margin-top:2px; }
    .orders-toolbar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
    .orders-summary { display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--muted); }
    .inline-toast { position:fixed; top:64px; left:50%; transform:translateX(-50%); z-index:50; display:flex; align-items:center; gap:8px; background:#FFF3E6; color:var(--brand); font-size:12px; font-weight:600; padding:8px 16px; border-radius:99px; box-shadow:0 4px 16px rgba(232,118,44,.18); border:1px solid var(--orange); max-width:85vw; }
    .btn-orange { display:inline-flex; align-items:center; justify-content:center; gap:6px; border:none; border-radius:12px; cursor:pointer; font-weight:600; background:var(--orange); color:#fff; padding:10px 16px; font-size:13px; font-family:inherit; }
    .btn-ghost  { display:inline-flex; align-items:center; justify-content:center; gap:6px; border:1px solid var(--border); border-radius:12px; cursor:pointer; font-weight:600; background:var(--stripe); color:var(--brand); padding:10px 16px; font-size:13px; font-family:inherit; }
    .btn-red    { display:inline-flex; align-items:center; justify-content:center; gap:6px; border:none; border-radius:12px; cursor:pointer; font-weight:600; background:#EF4444; color:#fff; padding:10px 16px; font-size:13px; font-family:inherit; }
    .btn-dark   { display:inline-flex; align-items:center; justify-content:center; gap:6px; border:none; border-radius:12px; cursor:pointer; font-weight:600; background:var(--brand); color:#fff; padding:10px 16px; font-size:13px; font-family:inherit; }
    .btn-wa     { display:inline-flex; align-items:center; justify-content:center; gap:6px; border:none; border-radius:12px; cursor:pointer; font-weight:700; background:#25D366; color:#fff; padding:10px 16px; font-size:13px; font-family:inherit; flex:1; }
    .sm { padding:10px 13px !important; font-size:12px !important; }
    button:disabled { opacity:.45; cursor:not-allowed; }
    .section-label { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
    .sec-label-text { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; }
    .sec-count { font-size:11px; font-weight:600; padding:1px 7px; border-radius:99px; }
    .sec-line { flex:1; height:1px; background:var(--border); }
    .orders-list { display:flex; flex-direction:column; gap:12px; }
    .order-card { background:#fff; border-radius:16px; border:1px solid var(--border); box-shadow:0 1px 4px rgba(0,0,0,.05); overflow:hidden; transition:all .5s; }
    .order-card.fading { opacity:.3; transform:scale(.97); }
    .order-card-top { display:flex; align-items:center; justify-content:space-between; padding:12px 14px 8px; }
    .new-badge { font-size:10px; font-weight:800; background:var(--orange); color:#fff; padding:2px 7px; border-radius:99px; animation:pulse 1.5s infinite; }
    .order-card-body { padding:0 14px 8px; }
    .order-cust-name { font-size:14px; font-weight:700; color:var(--brand); margin:0; }
    .order-phone { font-size:12px; color:var(--muted); margin:3px 0 0; }
    .order-time { font-size:11px; color:#B5A494; margin:2px 0 0; }
    .order-items-box { margin:0 14px 10px; background:var(--stripe); border-radius:10px; padding:8px 12px; }
    .order-item-row { display:flex; justify-content:space-between; margin-bottom:4px; font-size:12px; color:var(--brand); }
    .order-item-row:last-child { margin-bottom:0; }
    .order-card-footer { display:flex; align-items:center; justify-content:space-between; padding:8px 14px 12px; }
    .order-total-big { font-size:16px; font-weight:800; color:var(--brand); }
    .order-actions { display:flex; align-items:center; gap:8px; }
    .action-btn { width:32px; height:32px; display:flex; align-items:center; justify-content:center; border-radius:10px; border:1px solid var(--border); background:var(--stripe); cursor:pointer; font-size:13px; }
    .action-btn.danger { background:#FEF2F2; border-color:#FECACA; }
    .deliver-btn { display:flex; align-items:center; gap:5px; padding:6px 10px; border-radius:10px; border:none; font-size:12px; font-weight:600; cursor:pointer; background:var(--orange); color:#fff; font-family:inherit; }
    .pay-badge { font-size:11px; font-weight:600; padding:2px 8px; border-radius:99px; }
    .pay-badge.paid   { background:#ECFDF5; color:#065F46; }
    .pay-badge.unpaid { background:#FEF2F2; color:#B91C1C; }
    .pay-badge.pend   { background:#FEF9C3; color:#92400E; }
    .sheet-overlay { position:fixed; inset:0; z-index:60; display:flex; align-items:flex-end; justify-content:center; background:rgba(0,0,0,.45); backdrop-filter:blur(3px); }
    .sheet { position:relative; width:100%; max-width:440px; background:#fff; border-radius:20px 20px 0 0; box-shadow:0 -8px 40px rgba(0,0,0,.15); padding:20px 20px 32px; font-family:inherit; z-index:61; }
    .sheet-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .sheet-title { font-size:15px; font-weight:700; color:var(--brand); margin:0; }
    .sheet-sub { font-size:12px; color:var(--muted); margin:0; }
    .sheet-actions { display:flex; gap:8px; }
    .sheet-actions button { flex:1; padding:11px 0 !important; }
    .del-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
    .del-icon { width:40px; height:40px; background:#FEF2F2; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
    .upd-items-list { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
    .upd-item-row { display:flex; align-items:center; gap:8px; background:var(--stripe); border-radius:12px; padding:10px 12px; }
    .upd-item-name { flex:1; font-size:13px; color:var(--brand); }
    .qty-btn { width:24px; height:24px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid var(--border); background:#fff; cursor:pointer; font-size:13px; }
    .qty-btn.danger { background:#FEF2F2; border-color:#FECACA; }
    .qty-val { font-size:13px; font-weight:700; width:20px; text-align:center; color:var(--brand); }
    .add-item-section { border-top:1px solid var(--border); padding-top:12px; margin-bottom:20px; }
    .add-item-row { display:flex; gap:8px; align-items:center; }
    .sugg-wrap { position:relative; flex:1; }
    .sugg-drop { position:absolute; left:0; right:0; top:100%; margin-top:4px; background:#fff; border:1px solid var(--border); border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,.1); z-index:10; max-height:160px; overflow-y:auto; }
    .sugg-item { width:100%; text-align:left; padding:8px 12px; font-size:13px; border:none; cursor:pointer; background:#fff; color:var(--brand); font-family:inherit; }
    .sugg-item.hi { background:var(--orange); color:#fff; }
    .qty-ctrl { display:flex; align-items:center; gap:4px; }
    .pay-options { display:flex; flex-direction:column; gap:8px; }
    .pay-opt { display:flex; align-items:center; gap:12px; width:100%; padding:11px 14px; border-radius:12px; border:1px solid var(--border); background:#fff; color:var(--brand); font-size:13px; font-weight:500; cursor:pointer; font-family:inherit; }
    .pay-opt.sel-paid    { border-color:#86EFAC; background:#F0FDF4; color:#166534; }
    .pay-opt.sel-unpaid  { border-color:#FCA5A5; background:#FEF2F2; color:#B91C1C; }
    .pay-opt.sel-pending { border-color:#FCD34D; background:#FFFBEB; color:#92400E; }
    .perf-banner { background:var(--orange); border-radius:18px; padding:18px; color:#fff; }
    .perf-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:14px; font-weight:600; }
    .perf-num { font-size:36px; font-weight:800; margin:0; }
    .perf-sub { font-size:12px; color:rgba(255,255,255,.75); margin-top:4px; }
    .perf-top { margin-top:12px; background:rgba(255,255,255,.2); border-radius:12px; padding:8px 14px; }
    .perf-top-label { font-size:11px; color:rgba(255,255,255,.7); margin:0; }
    .perf-top-val { font-size:14px; font-weight:700; margin:2px 0 0; }
    .showoff-item-row { display:flex; align-items:center; justify-content:space-between; padding:12px 16px 4px; }
    .showoff-rank { font-size:12px; font-weight:700; color:var(--muted); width:20px; text-align:right; }
    .showoff-name { font-size:13px; font-weight:500; color:var(--brand); }
    .showoff-qty { font-size:14px; font-weight:800; color:var(--orange); }
    .showoff-bar-wrap { margin:0 16px 12px 52px; height:5px; background:var(--stripe); border-radius:99px; overflow:hidden; }
    .showoff-bar { height:100%; background:var(--orange); border-radius:99px; transition:width .5s; }
    @keyframes slideIn { from { opacity:0; transform:translateX(-50%) translateY(-12px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }
    @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:.4; } }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly ordersService = inject(OrdersService);
  private readonly auth          = inject(AuthService);
  private readonly router        = inject(Router);
  private readonly cdr           = inject(ChangeDetectorRef);

  activeTab: AdminTab = 'overview';
  sidebarOpen = false;
  loading = false;
  saving  = false;
  busy    = false;
  statusMsg = '';

  siteOnline = true;
  itemFlags: Record<string, boolean> = {};

  apiOrders: Order[] = [];
  localOrders: LocalOrder[] = [];
  prevApiCount = 0;

  ordersSearch = '';
  menuSearch   = '';

  updModal: LocalOrder | null = null;
  payModal: LocalOrder | null = null;
  delModal: LocalOrder | null = null;
  updItems: OrderItem[] = [];
  newItemName = ''; newItemQty = 1;
  showSugg = false; filteredSugg: string[] = []; suggHiIdx = -1;
  paySelStatus: 'paid' | 'unpaid' | 'pending' | null = null;
  payPendingAmt = 0;

  globalToastName = '';
  ordersToast  = '';
  showoffToast = '';

  ordersExported  = false;
  showoffExported = false;
  showoffUiCleared = false;

  private pollInterval: any;
  private globalToastTimer: any;
  private ordersToastTimer: any;
  private showoffToastTimer: any;

  ngOnInit(): void { this.loadData(); this.pollInterval = setInterval(() => this.loadData(true), 15000); }
  ngOnDestroy(): void { clearInterval(this.pollInterval); }

  async loadData(silent = false): Promise<void> {
    if (!silent) this.loading = true;
    const [cfg, orders] = await Promise.all([
      this.ordersService.fetchConfig(),
      this.ordersService.fetchOrders(),
    ]);
    this.siteOnline = cfg.site_online;
    this.itemFlags  = cfg.item_flags;
    if (this.prevApiCount > 0 && orders.length > this.prevApiCount) {
      const newest = orders[orders.length - 1];
      this.showGlobalToast(newest.customer_name ?? 'Customer');
    }
    if (this.ordersExported && orders.length > this.localOrders.length) this.ordersExported = false;
    this.prevApiCount = orders.length;
    this.apiOrders = orders;
    this.syncLocalOrders();
    this.loading = false;
    this.cdr.detectChanges();
  }

  private syncLocalOrders(): void {
    const prevMap = new Map(this.localOrders.map(o => [o.id, o]));
    this.localOrders = this.apiOrders.map((o, idx) => {
      const existing = prevMap.get(o.id);
      const fresh    = apiToLocal(o, idx + 1);
      if (!existing) return fresh;
      return { ...fresh, status: existing.status, paymentStatus: existing.paymentStatus, pendingAmount: existing.pendingAmount };
    });
  }

  async toggleSiteOnline(): Promise<void> {
    const v = !this.siteOnline; this.siteOnline = v; this.saving = true;
    try { await this.ordersService.patchConfig({ site_online: v }); this.flash('Saved ✓'); }
    catch { this.flash('Save failed ✗'); this.siteOnline = !v; }
    this.saving = false;
  }

  async toggleItem(id: string): Promise<void> {
    const current = this.itemFlags[id] !== false;
    this.itemFlags = { ...this.itemFlags, [id]: !current };
    this.saving = true;
    try { await this.ordersService.patchConfig({ item_flags: this.itemFlags }); this.flash('Saved ✓'); }
    catch { this.flash('Save failed ✗'); }
    this.saving = false;
  }
  isItemOn(id: string): boolean { return this.itemFlags[id] !== false; }

  openUpdModal(o: LocalOrder): void { this.updModal = o; this.updItems = o.items.map(i => ({ ...i })); }
  openPayModal(o: LocalOrder): void { this.payModal = o; this.paySelStatus = null; this.payPendingAmt = 0; }
  openDelModal(o: LocalOrder): void { this.delModal = o; }
  get payOk(): boolean { return this.paySelStatus === 'paid' || this.paySelStatus === 'unpaid' || (this.paySelStatus === 'pending' && this.payPendingAmt > 0); }

  async doUpdateOrder(): Promise<void> {
    if (!this.updModal) return;
    this.busy = true;
    const allItems = Object.values(MENU_DATA).flatMap(c => c.items);
    const newTotal = this.updItems.reduce((sum, it) => { const mi = allItems.find(m => m.name === it.name); return sum + (mi ? mi.price * it.qty : 0); }, 0) || this.updModal.total;
    try {
      await this.ordersService.updateOrder(this.updModal.id, { items: this.updItems, total: newTotal });
      this.localOrders = this.localOrders.map(o => o.id === this.updModal!.id ? { ...o, items: this.updItems, total: newTotal } : o);
      this.showOrdersToast('Order updated ✓'); await this.loadData(true);
    } catch { this.showOrdersToast('Update failed ✗'); }
    this.busy = false; this.updModal = null;
  }

  async doDeliver(): Promise<void> {
    if (!this.payModal || !this.paySelStatus) return;
    const { id } = this.payModal; const status = this.paySelStatus; const amount = status === 'pending' ? this.payPendingAmt : undefined;
    this.localOrders = this.localOrders.map(o => o.id === id ? { ...o, fadingOut: true, paymentStatus: status, pendingAmount: amount } : o);
    setTimeout(() => { this.localOrders = this.localOrders.map(o => o.id === id ? { ...o, fadingOut: false, status: 'delivered' } : o); this.cdr.detectChanges(); }, 600);
    this.payModal = null;
    try { await this.ordersService.updateOrder(id, { deliver_status: 'delivered', pay_status: status, pending_amount: status === 'pending' ? amount : null }); }
    catch { this.showOrdersToast('Deliver save failed ✗'); }
  }

  async doDeleteOrder(): Promise<void> {
    if (!this.delModal) return; this.busy = true;
    try { await this.ordersService.deleteOrder(this.delModal.id); this.localOrders = this.localOrders.filter(o => o.id !== this.delModal!.id); this.showOrdersToast('Order deleted ✓'); await this.loadData(true); }
    catch { this.showOrdersToast('Delete failed ✗'); }
    this.busy = false; this.delModal = null;
  }

  doExport(): void { this.ordersService.exportToCSV(this.apiOrders); this.ordersExported = true; this.showOrdersToast('Exported ✓'); }

  async doClear(): Promise<void> {
    if (!this.ordersExported) return;
    if (!confirm('Clear ALL orders from the database?\n\nToken numbers will restart from #001.')) return;
    this.busy = true;
    try { await this.ordersService.clearAllOrders(); this.localOrders = []; this.apiOrders = []; this.ordersExported = false; this.showOrdersToast('All orders cleared ✓'); }
    catch { this.showOrdersToast('Clear failed ✗'); }
    this.busy = false;
  }

  get showoffTally(): { name: string; qty: number }[] {
    const tally: Record<string, { name: string; qty: number }> = {};
    this.apiOrders.forEach(o => (o.items ?? []).forEach((it: any) => { if (!tally[it.name]) tally[it.name] = { name: it.name, qty: 0 }; tally[it.name].qty += it.qty ?? 1; }));
    return Object.values(tally).sort((a, b) => b.qty - a.qty);
  }
  get showoffDisplay(): { name: string; qty: number }[] { return this.showoffUiCleared ? [] : this.showoffTally; }
  get showoffTotal(): number { return this.showoffDisplay.reduce((s, i) => s + i.qty, 0); }
  get showoffTop(): { name: string; qty: number } | null { return this.showoffDisplay[0] ?? null; }
  get canShowOffClear(): boolean { return this.showoffExported && this.apiOrders.length === 0 && !this.showoffUiCleared; }

  doWhatsApp(): void {
    const lines = this.showoffDisplay.map(i => `${i.name} — ${i.qty}`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(`🍛 *CLGBITES — Today's Bestsellers*\n\n${lines}\n\nTotal: ${this.showoffTotal}`)}`, '_blank');
  }
  doShowOffExport(): void { this.ordersService.exportShowOffCSV(this.showoffDisplay); this.showoffExported = true; this.showShowOffToast('Exported ✓'); }
  doShowOffClear(): void { if (!this.canShowOffClear) return; this.showoffUiCleared = true; this.showoffExported = false; this.showShowOffToast('List cleared ✓'); }

  onNewItemNameChange(): void {
    const q = this.newItemName.trim();
    this.filteredSugg = q ? MENU_SUGGESTIONS.filter(s => s.toLowerCase().includes(q.toLowerCase())) : [];
    this.showSugg = this.filteredSugg.length > 0; this.suggHiIdx = -1;
  }
  selSugg(name: string): void { this.newItemName = name; this.showSugg = false; this.suggHiIdx = -1; }
  addUpdItem(): void {
    const n = this.newItemName.trim(); if (!n) return;
    const ex = this.updItems.findIndex(i => i.name.toLowerCase() === n.toLowerCase());
    if (ex >= 0) this.updItems[ex].qty += this.newItemQty;
    else this.updItems.push({ name: n, qty: this.newItemQty });
    this.newItemName = ''; this.newItemQty = 1; this.showSugg = false;
  }
  chUpdQty(idx: number, d: number): void { if (this.updItems[idx].qty + d >= 1) this.updItems[idx].qty += d; }
  remUpdItem(idx: number): void { this.updItems.splice(idx, 1); }

  get pendingOrders(): LocalOrder[]   { return this.localOrders.filter(o => o.status==='pending'   && this.matchSearch(o)); }
  get deliveredOrders(): LocalOrder[] { return this.localOrders.filter(o => o.status==='delivered' && this.matchSearch(o)).sort((a,b)=>tokenNum(a.token)-tokenNum(b.token)); }
  get pendingCount(): number   { return this.localOrders.filter(o => o.status==='pending').length; }
  get deliveredCount(): number { return this.localOrders.filter(o => o.status==='delivered').length; }
  private matchSearch(o: LocalOrder): boolean { const q=this.ordersSearch.trim().toLowerCase(); return !q||o.name.toLowerCase().includes(q)||o.token.toLowerCase().includes(q)||o.phone.includes(q); }
  get recentOrders(): Order[] { return [...this.apiOrders].reverse().slice(0,5); }

  get overviewStats() {
    const rev=this.apiOrders.reduce((s,o)=>s+(o.total??0),0);
    const codRev=this.apiOrders.filter(o=>o.payment_mode==='cod').reduce((s,o)=>s+(o.total??0),0);
    const preRev=this.apiOrders.filter(o=>o.payment_mode!=='cod').reduce((s,o)=>s+(o.total??0),0);
    return [
      { label:'Revenue',      value:`₹${rev}`,                      icon:'📈', bg:'#FEF0E6' },
      { label:'Total Orders', value:`${this.apiOrders.length}`,     icon:'🛍️', bg:'#E6EFFD' },
      { label:'Pending',      value:`${this.pendingCount}`,         icon:'⏰', bg:'#FEF7E6' },
      { label:'Delivered',    value:`${this.deliveredCount}`,       icon:'✅', bg:'#E6F5EA' },
      { label:'COD',          value:`₹${codRev}`,                  icon:'💵', bg:'#F0EBFD' },
      { label:'Prepaid',      value:`₹${preRev}`,                  icon:'💳', bg:'#E6FBF6' },
    ];
  }
  get filteredMenuCategories() {
    const q=this.menuSearch.toLowerCase();
    return Object.entries(MENU_DATA).map(([k,cat])=>({...cat,k,items:cat.items.filter(i=>i.name.toLowerCase().includes(q))})).filter(c=>c.items.length>0);
  }
  get tabTitle(): string { return {'overview':'Overview','menu-items':'Menu Items','orders':"Today's Orders",'showoff':'Show Off'}[this.activeTab]; }

  fmtDT=(d:Date):string=>fmtDT(d);
  padToken(n:number):string { return String(n).padStart(3,'0'); }
  getItemNames(o:Order):string { return (o.items??[]).map((it:any)=>it.name).join(', '); }
  setTab(tab:AdminTab):void { this.activeTab=tab; }
  goHome():void { this.router.navigate(['/']); }
  logout():void { this.auth.logout(); this.router.navigate(['/admin/login']); }

  private flash(msg:string):void { this.statusMsg=msg; setTimeout(()=>{this.statusMsg='';this.cdr.detectChanges();},2000); }
  private showGlobalToast(name:string):void { this.globalToastName=name; clearTimeout(this.globalToastTimer); this.globalToastTimer=setTimeout(()=>{this.globalToastName='';this.cdr.detectChanges();},6000); }
  private showOrdersToast(msg:string):void { this.ordersToast=msg; clearTimeout(this.ordersToastTimer); this.ordersToastTimer=setTimeout(()=>{this.ordersToast='';this.cdr.detectChanges();},3500); }
  private showShowOffToast(msg:string):void { this.showoffToast=msg; clearTimeout(this.showoffToastTimer); this.showoffToastTimer=setTimeout(()=>{this.showoffToast='';this.cdr.detectChanges();},3000); }
}
