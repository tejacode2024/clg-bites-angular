import {
  Component, OnInit, OnDestroy, inject, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService, Coupon } from '../../services/admin.service';
import { OrdersService, Order, OrderItem } from '../../services/orders.service';
import { restaurants } from '../../services/restaurants';

type AdminTab = 'overview' | 'restaurants' | 'items' | 'coupons' | 'orders' | 'showoff';

const MENU_SUGGESTIONS: string[] = (restaurants as any[])
  .flatMap((r: any) => r.menu.flatMap((cat: any) => cat.items.map((it: any) => it.name)));

interface LocalOrder {
  id: number | string; token: string; tokenNum: number; name: string; phone: string;
  items: OrderItem[]; total: number; status: 'pending' | 'delivered';
  payment: 'COD' | 'Prepaid'; paymentStatus?: 'paid' | 'unpaid' | 'pending';
  pendingAmount?: number; orderedAt: Date; isNew?: boolean; fadingOut?: boolean;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function fmtDT(d: Date): string {
  const dd = String(d.getDate()).padStart(2,'0'), mon = MONTHS[d.getMonth()];
  let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${dd} ${mon} | ${String(h).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${ap}`;
}

function apiToLocal(o: Order, idx: number): LocalOrder {
  const tNum = o.token_number ?? idx;
  return {
    id: o.id, token: `#${String(tNum).padStart(3,'0')}`, tokenNum: tNum,
    name: o.customer_name ?? '—', phone: o.customer_phone ?? '—',
    items: (o.items ?? []).map((it: any) => ({ name: it.name, qty: it.qty ?? 1, restaurant_name: it.restaurant_name ?? '' })),
    total: o.total ?? 0, status: o.deliver_status === 'delivered' ? 'delivered' : 'pending',
    payment: o.payment_mode === 'cod' ? 'COD' : 'Prepaid',
    paymentStatus: o.pay_status !== 'pending' ? o.pay_status as any : undefined,
    pendingAmount: o.pending_amount ?? undefined, orderedAt: new Date(o.created_at ?? Date.now()),
  };
}

function groupItemsByRestaurant(items: OrderItem[]): { restaurant: string; items: OrderItem[] }[] {
  const map: Record<string, OrderItem[]> = {};
  items.forEach(it => {
    const r = it.restaurant_name || 'Other';
    if (!map[r]) map[r] = [];
    map[r].push(it);
  });
  return Object.entries(map).map(([restaurant, items]) => ({ restaurant, items }));
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<!-- ═══ NEW-ORDER GLOBAL TOAST ═══ -->
<div *ngIf="globalToastName" class="global-toast">
  <div class="toast-icon">📶</div>
  <div><p class="toast-sub">New order from</p><p class="toast-name">{{ globalToastName }}</p></div>
  <button class="toast-close" (click)="globalToastName=''">✕</button>
</div>

<div class="admin-wrap">
  <div *ngIf="sidebarOpen" class="sidebar-overlay" (click)="sidebarOpen=false"></div>

  <!-- ═══ SIDEBAR ═══ -->
  <aside class="sidebar" [class.open]="sidebarOpen">
    <div class="sidebar-header">
      <span class="brand">CLGBITES <span class="brand-orange">Admin</span></span>
      <button class="icon-btn" (click)="sidebarOpen=false">✕</button>
    </div>
    <nav class="nav">
      <button class="nav-pill" [class.active]="activeTab==='overview'"     (click)="setTab('overview');     sidebarOpen=false">📊 Overview</button>
      <button class="nav-pill" [class.active]="activeTab==='restaurants'"  (click)="setTab('restaurants');  sidebarOpen=false">🏪 Restaurants</button>
      <button class="nav-pill" [class.active]="activeTab==='items'"        (click)="setTab('items');        sidebarOpen=false">🍽️ Menu Items</button>
      <button class="nav-pill" [class.active]="activeTab==='coupons'"      (click)="setTab('coupons');      sidebarOpen=false">🎟️ Coupons</button>
      <button class="nav-pill" [class.active]="activeTab==='orders'"       (click)="setTab('orders');       sidebarOpen=false">📋 Today's Orders</button>
      <button class="nav-pill" [class.active]="activeTab==='showoff'"      (click)="setTab('showoff');      sidebarOpen=false">⭐ Show Off</button>
    </nav>
    <div class="sidebar-footer">
      <button class="nav-pill" style="color:#EF4444" (click)="logout(); sidebarOpen=false">🚪 Logout</button>
    </div>
  </aside>

  <!-- ═══ MAIN ═══ -->
  <div class="main">
    <header class="topbar">
      <button class="icon-btn" (click)="sidebarOpen=true">☰</button>
      <div class="topbar-center">
        <span class="brand">CLGBITES <span class="brand-orange">Admin</span></span>
        <span *ngIf="statusMsg" class="status-badge" [class.ok]="statusMsg.includes('✓')" [class.err]="!statusMsg.includes('✓')">{{ statusMsg }}</span>
      </div>
      <div style="display:flex;align-items:center;gap:4px">
        <button class="back-site-btn" (click)="goHome()">← Site</button>
        <button class="icon-btn" (click)="logout()">🚪</button>
      </div>
    </header>

    <main class="content-wrap">
      <div class="content-inner">
        <h1 class="page-title">{{ tabTitle }}</h1>

        <!-- ════ OVERVIEW TAB ════ -->
        <div *ngIf="activeTab==='overview'" class="tab-content">
          <div class="orders-card" [class.open]="adminService.settings().orders_accepting" [class.closed]="!adminService.settings().orders_accepting">
            <div style="display:flex;align-items:center;gap:1rem">
              <div style="font-size:2rem">{{ adminService.settings().orders_accepting ? '✅' : '🔴' }}</div>
              <div>
                <h3 class="oc-title">Order Acceptance</h3>
                <p class="oc-sub">{{ adminService.settings().orders_accepting ? 'Customers can place orders right now' : 'Orders are currently closed for customers' }}</p>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:0.75rem">
              <label class="toggle"><input type="checkbox" [checked]="adminService.settings().orders_accepting" (change)="toggleOrders($event)" [disabled]="saving"><span class="slider"></span></label>
              <span style="font-size:.875rem;font-weight:600;color:#1e293b">{{ adminService.settings().orders_accepting ? 'ON' : 'OFF' }}</span>
            </div>
          </div>
          <div class="card">
            <h3 class="card-title">🚚 Delivery Time (shown to all customers)</h3>
            <div style="display:flex;gap:.75rem;align-items:center">
              <input type="text" [(ngModel)]="deliveryTime" class="form-input" placeholder="e.g. 30-45 mins" style="flex:1" />
              <button class="btn-primary" (click)="saveDeliveryTime()" [disabled]="saving">{{ saving ? 'Saving...' : '💾 Save' }}</button>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-card"><div class="stat-num">{{ restaurants.length }}</div><div class="stat-label">Total Restaurants</div></div>
            <div class="stat-card warn"><div class="stat-num">{{ adminService.settings().unavailable_restaurants.length }}</div><div class="stat-label">Unavailable Restaurants</div></div>
            <div class="stat-card warn"><div class="stat-num">{{ totalUnavailableItems }}</div><div class="stat-label">Unavailable Items</div></div>
            <div class="stat-card green"><div class="stat-num">{{ activeCoupons }}</div><div class="stat-label">Active Coupons</div></div>
          </div>
          <div *ngIf="!adminService.settings().orders_accepting" class="card">
            <h3 class="card-title">📢 Closed Message (shown to customers)</h3>
            <textarea [(ngModel)]="closedMessage" class="form-textarea" rows="3" placeholder="E.g. Orders closed for today. Back tomorrow at 10 AM!"></textarea>
            <button class="btn-primary" (click)="saveClosedMessage()" [disabled]="saving" style="margin-top:.75rem">{{ saving ? 'Saving...' : '💾 Save Message' }}</button>
          </div>
          <div class="card" style="margin-top:0">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <p class="label-cap" style="margin:0">Live Orders Today</p>
              <span class="live-chip"><span class="dot green pulse"></span>Live</span>
            </div>
            <div class="stats-grid" style="margin-top:0">
              <div class="stat-card" *ngFor="let s of overviewOrderStats">
                <div class="stat-top"><span class="stat-label2">{{ s.label }}</span><div class="stat-icon2" [style.background]="s.bg">{{ s.icon }}</div></div>
                <p class="stat-num2">{{ s.value }}</p>
              </div>
            </div>
            <div *ngIf="perRestaurantOrderCounts.length > 0" style="margin-top:16px">
              <p class="label-cap" style="margin-bottom:8px">Orders per Restaurant</p>
              <div *ngFor="let r of perRestaurantOrderCounts; let i=index">
                <hr *ngIf="i>0" class="divider" />
                <div class="recent-row">
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="tag-orange">🏪</span>
                    <p class="rr-name">{{ r.name }}</p>
                  </div>
                  <div style="text-align:right">
                    <p class="rr-total">{{ r.itemCount }} items · {{ r.orderCount }} orders</p>
                  </div>
                </div>
              </div>
            </div>
            <div *ngIf="recentOrders.length>0" style="margin-top:12px">
              <p class="label-cap" style="margin-bottom:8px">Recent Orders</p>
              <div *ngFor="let o of recentOrders; let i=index">
                <hr *ngIf="i>0" class="divider" />
                <div class="recent-row">
                  <div style="display:flex;align-items:center;gap:8px">
                    <span class="tag-orange">#{{ padToken(o.token_number ?? (apiOrders.indexOf(o)+1)) }}</span>
                    <div><p class="rr-name">{{ o.customer_name }}</p><p class="rr-sub">{{ getItemNames(o) }}</p></div>
                  </div>
                  <div style="text-align:right">
                    <p class="rr-total">₹{{ o.total }}</p>
                    <span [class]="o.payment_mode==='cod'?'tag-cod':'tag-pre'">{{ o.payment_mode==='cod'?'COD':'Prepaid' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ════ RESTAURANTS TAB ════ -->
        <div *ngIf="activeTab==='restaurants'">
          <p class="tab-desc">Toggle restaurants on/off. Unavailable restaurants show as grayed out to customers.</p>
          <div class="list">
            <div *ngFor="let r of restaurants" class="list-item">
              <div class="list-item-left">
                <img [src]="r.image" [alt]="r.name" class="rest-thumb" />
                <div>
                  <h4>{{ r.name }}</h4>
                  <p class="list-sub">{{ r.categories.join(', ') }}</p>
                </div>
              </div>
              <div class="list-item-right">
                <span class="badge" [class.badge-green]="isRestAvailable(r.id)" [class.badge-red]="!isRestAvailable(r.id)">
                  {{ isRestAvailable(r.id) ? 'Available' : 'Unavailable' }}
                </span>
                <label class="toggle"><input type="checkbox" [checked]="isRestAvailable(r.id)" (change)="toggleRestaurant(r.id,$event)" [disabled]="saving"><span class="slider"></span></label>
              </div>
            </div>
          </div>
        </div>

        <!-- ════ MENU ITEMS TAB ════ -->
        <div *ngIf="activeTab==='items'">
          <p class="tab-desc">Disable specific menu items per restaurant. Disabled items show as "Unavailable" to customers. You can also override prices.</p>
          <div class="select-wrap">
            <select [(ngModel)]="selectedRestaurantId" class="form-select">
              <option value="">— Select a restaurant —</option>
              <option *ngFor="let r of restaurants" [value]="r.id">{{ r.name }}</option>
            </select>
          </div>
          <div *ngIf="selectedRestaurant" class="list" style="margin-top:1rem">
            <div *ngFor="let cat of selectedRestaurant.menu">
              <div class="category-header">{{ cat.category }}</div>
              <div *ngFor="let item of cat.items" class="list-item item-row">
                <div class="list-item-left">
                  <div>
                    <h4>{{ item.name }}</h4>
                    <div style="display:flex;align-items:center;gap:.5rem;margin-top:.25rem">
                      <span *ngIf="!editingPrice[selectedRestaurantId+'::'+item.name]" class="list-sub">
                        ₹{{ adminService.getItemPrice(selectedRestaurantId, item.name, item.price) }}
                        <button (click)="startEditPrice(selectedRestaurantId,item.name,item.price)" class="edit-price-btn">✏️</button>
                      </span>
                      <span *ngIf="editingPrice[selectedRestaurantId+'::'+item.name]" style="display:flex;gap:.25rem;align-items:center">
                        <input type="number" [(ngModel)]="tempPrices[selectedRestaurantId+'::'+item.name]" class="price-input" />
                        <button (click)="savePrice(selectedRestaurantId,item.name)" class="price-btn save">✅</button>
                        <button (click)="cancelEditPrice(selectedRestaurantId,item.name)" class="price-btn cancel">✕</button>
                        <button (click)="resetPrice(selectedRestaurantId,item.name)" class="price-btn reset">↺</button>
                      </span>
                    </div>
                  </div>
                </div>
                <div class="list-item-right">
                  <span class="badge" [class.badge-green]="isItemAvail(selectedRestaurantId,item.name)" [class.badge-red]="!isItemAvail(selectedRestaurantId,item.name)">
                    {{ isItemAvail(selectedRestaurantId,item.name) ? 'Available' : 'Disabled' }}
                  </span>
                  <label class="toggle"><input type="checkbox" [checked]="isItemAvail(selectedRestaurantId,item.name)" (change)="toggleItem(selectedRestaurantId,item.name,$event)" [disabled]="saving"><span class="slider"></span></label>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="!selectedRestaurantId" class="empty-hint">👆 Select a restaurant above to manage its menu items</div>
        </div>

        <!-- ════ COUPONS TAB ════ -->
        <div *ngIf="activeTab==='coupons'">
          <p class="tab-desc">Create coupon codes for discounts. Customers enter codes at checkout.</p>
          <div class="card">
            <h3 class="card-title">➕ {{ editingCoupon ? 'Edit Coupon' : 'Add New Coupon' }}</h3>
            <div class="coupon-form">
              <div class="form-row">
                <div class="form-field">
                  <label>Coupon Code *</label>
                  <input type="text" [(ngModel)]="newCoupon.code" placeholder="e.g. SAVE20" class="form-input" style="text-transform:uppercase" (input)="newCoupon.code=newCoupon.code.toUpperCase()" />
                </div>
                <div class="form-field">
                  <label>Discount Type *</label>
                  <select [(ngModel)]="newCoupon.type" class="form-select">
                    <option value="percent">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label>{{ newCoupon.type==='percent' ? 'Discount %' : 'Discount ₹' }} *</label>
                  <input type="number" [(ngModel)]="newCoupon.value" [placeholder]="newCoupon.type==='percent'?'e.g. 20':'e.g. 50'" class="form-input" min="1" />
                </div>
                <div class="form-field">
                  <label>Min. Order Amount (₹)</label>
                  <input type="number" [(ngModel)]="newCoupon.min_order" placeholder="e.g. 200" class="form-input" min="0" />
                </div>
              </div>
              <div class="form-field">
                <label>Description (shown to customer)</label>
                <input type="text" [(ngModel)]="newCoupon.description" placeholder="e.g. Get 20% off on orders above ₹200" class="form-input" />
              </div>
              <div class="form-check">
                <input type="checkbox" [(ngModel)]="newCoupon.active" id="couponActive" />
                <label for="couponActive">Active (customers can use this coupon)</label>
              </div>
              <div class="form-actions">
                <button class="btn-primary" (click)="saveCoupon()" [disabled]="saving">{{ saving ? 'Saving...' : editingCoupon ? '💾 Update Coupon' : '➕ Add Coupon' }}</button>
                <button *ngIf="editingCoupon" class="btn-ghost" (click)="cancelEdit()">Cancel</button>
              </div>
            </div>
          </div>
          <div class="list" style="margin-top:1.5rem">
            <div *ngIf="adminService.coupons().length===0" class="empty-hint">No coupons yet. Add your first coupon above!</div>
            <div *ngFor="let coupon of adminService.coupons()" class="coupon-item">
              <div class="coupon-left">
                <div class="coupon-code">{{ coupon.code }}</div>
                <div class="coupon-meta">
                  <span class="badge" [class.badge-green]="coupon.active" [class.badge-red]="!coupon.active">{{ coupon.active ? 'Active' : 'Inactive' }}</span>
                  <span class="coupon-detail">{{ coupon.type==='percent' ? coupon.value+'% off' : '₹'+coupon.value+' off' }}</span>
                  <span *ngIf="coupon.min_order>0" class="coupon-detail">Min: ₹{{ coupon.min_order }}</span>
                </div>
                <p *ngIf="coupon.description" class="coupon-desc">{{ coupon.description }}</p>
              </div>
              <div class="coupon-actions">
                <button class="btn-icon" title="Toggle active" (click)="toggleCouponActive(coupon)">{{ coupon.active ? '🔴' : '🟢' }}</button>
                <button class="btn-icon" title="Edit" (click)="editCoupon(coupon)">✏️</button>
                <button class="btn-icon danger" title="Delete" (click)="deleteCoupon(coupon)">🗑️</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ════ TODAY'S ORDERS TAB ════ -->
        <div *ngIf="activeTab==='orders'" class="tab-content">
          <div *ngIf="ordersToast" class="inline-toast">📶 {{ ordersToast }}</div>

          <!-- UPDATE MODAL -->
          <div *ngIf="updModal" class="sheet-overlay" (click)="updModal=null">
            <div class="sheet" (click)="$event.stopPropagation()">
              <div class="sheet-header">
                <div><h3 class="sheet-title">Edit Order</h3><p class="sheet-sub">{{ updModal.token }} · {{ updModal.name }}</p></div>
                <button class="icon-btn" (click)="updModal=null">✕</button>
              </div>
              <div class="upd-items-list">
                <p *ngIf="updItems.length===0" class="empty-hint" style="padding:12px 0">No items — add below.</p>
                <div *ngFor="let item of updItems; let idx=index" class="upd-item-row">
                  <span class="upd-item-name">
                    <span *ngIf="item.restaurant_name" class="upd-rest-tag">{{ item.restaurant_name }}</span>
                    {{ item.name }}
                  </span>
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
                    <input type="text" [(ngModel)]="newItemName" (ngModelChange)="onNewItemNameChange()" placeholder="Type to search menu…" class="form-input" style="padding-left:12px" />
                    <div *ngIf="showSugg && filteredSugg.length>0" class="sugg-drop">
                      <button *ngFor="let s of filteredSugg; let si=index" class="sugg-item" [class.hi]="si===suggHiIdx" (mousedown)="selSugg(s)">{{ s }}</button>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:4px">
                    <button class="qty-btn" (click)="newItemQty=newItemQty>1?newItemQty-1:1">−</button>
                    <span class="qty-val">{{ newItemQty }}</span>
                    <button class="qty-btn" (click)="newItemQty=newItemQty+1">+</button>
                  </div>
                  <button class="btn-dark sm" (click)="addUpdItem()">+ Add</button>
                </div>
              </div>
              <div class="sheet-actions">
                <button class="btn-ghost" (click)="updModal=null">Cancel</button>
                <button class="btn-orange" (click)="doUpdateOrder()" [disabled]="busy">{{ busy ? 'Saving…' : 'Save Changes' }}</button>
              </div>
            </div>
          </div>

          <!-- PAY MODAL -->
          <div *ngIf="payModal" class="sheet-overlay" (click)="payModal=null">
            <div class="sheet" (click)="$event.stopPropagation()">
              <div class="sheet-header"><h3 class="sheet-title">Payment Status</h3><button class="icon-btn" (click)="payModal=null">✕</button></div>
              <p class="sheet-sub" style="margin-bottom:16px">{{ payModal.token }} · {{ payModal.name }} · ₹{{ payModal.total }}</p>
              <div class="pay-options">
                <button class="pay-opt" [class.sel-paid]="paySelStatus==='paid'"       (click)="paySelStatus='paid'">✅ Paid</button>
                <button class="pay-opt" [class.sel-unpaid]="paySelStatus==='unpaid'"   (click)="paySelStatus='unpaid'">✕ Not Paid</button>
                <button class="pay-opt" [class.sel-pending]="paySelStatus==='pending'" (click)="paySelStatus='pending'">📄 Pending</button>
              </div>
              <div *ngIf="paySelStatus==='pending'" style="margin-top:8px">
                <input type="number" [(ngModel)]="payPendingAmt" placeholder="Enter amount" class="form-input" />
              </div>
              <div class="sheet-actions" style="margin-top:20px">
                <button class="btn-ghost" (click)="payModal=null">Cancel</button>
                <button class="btn-orange" [disabled]="!payOk || busy" (click)="doDeliver()">{{ busy ? 'Saving…' : 'Confirm & Deliver' }}</button>
              </div>
            </div>
          </div>

          <!-- DELETE MODAL -->
          <div *ngIf="delModal" class="sheet-overlay" (click)="delModal=null">
            <div class="sheet" (click)="$event.stopPropagation()">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
                <div class="del-icon">🗑️</div>
                <div><h3 class="sheet-title">Delete Order?</h3><p class="sheet-sub">{{ delModal.token }} · {{ delModal.name }}</p></div>
              </div>
              <p style="font-size:13px;color:#64748b;margin:0 0 20px">This will permanently remove this order from the database.</p>
              <div class="sheet-actions">
                <button class="btn-ghost" (click)="delModal=null">Cancel</button>
                <button class="btn-red" (click)="doDeleteOrder()" [disabled]="busy">{{ busy ? 'Deleting…' : 'Delete Order' }}</button>
              </div>
            </div>
          </div>

          <!-- Toolbar -->
          <div class="orders-toolbar">
            <div style="position:relative;flex:1;min-width:0">
              <span class="search-icon">🔍</span>
              <input type="text" [(ngModel)]="ordersSearch" placeholder="Name, #001, phone…" class="form-input" style="padding-left:36px" />
            </div>
            <button class="icon-btn toolbar-icon-btn" (click)="loadOrdersData()" [disabled]="ordersLoading||busy" title="Refresh">🔄</button>
            <button class="btn-primary sm" (click)="doExport()" [disabled]="busy||localOrders.length===0">⬇ XL</button>
            <button [class]="ordersExported?'btn-danger sm':'btn-ghost sm'" (click)="doClear()" [disabled]="!ordersExported||busy||localOrders.length===0" title="Export first">🗑</button>
          </div>

          <div class="orders-summary">
            <span><strong>{{ localOrders.length }}</strong> orders · <span style="color:#D97706">{{ pendingCount }} pending</span> · <span style="color:#16a34a">{{ deliveredCount }} delivered</span></span>
            <span class="live-chip"><span class="dot green pulse"></span>Live</span>
          </div>

          <!-- Pending Orders -->
          <div *ngIf="pendingOrders.length>0">
            <div class="section-label">
              <span class="sec-label-text" style="color:#D97706">PENDING</span>
              <span class="sec-count" style="background:#FEF9C3;color:#D97706">{{ pendingOrders.length }}</span>
              <div class="sec-line"></div>
            </div>
            <div class="orders-list">
              <div *ngFor="let o of pendingOrders" class="order-card" [class.fading]="o.fadingOut">
                <!-- Top row: token + badges + dots -->
                <div class="order-card-top">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span *ngIf="o.isNew" class="new-badge">NEW</span>
                    <span class="tag-orange large-tag">{{ o.token }}</span>
                    <span [class]="o.payment==='COD'?'tag-cod':'tag-pre'">{{ o.payment }}</span>
                    <span *ngIf="o.paymentStatus==='paid'"    class="pay-badge paid">Paid</span>
                    <span *ngIf="o.paymentStatus==='unpaid'"  class="pay-badge unpaid">Unpaid</span>
                    <span *ngIf="o.paymentStatus==='pending'" class="pay-badge pend">Pending{{ o.pendingAmount?' ₹'+o.pendingAmount:'' }}</span>
                  </div>
                  <!-- Dots menu — stopPropagation prevents global click handler from closing immediately -->
                  <div class="dots-wrap" (click)="$event.stopPropagation()">
                    <button class="dots-btn" (click)="toggleDotsMenu(o.id)">•••</button>
                    <div *ngIf="dotsOpenId===o.id" class="dots-drop">
                      <button class="dots-item" (click)="openUpdModal(o); dotsOpenId=null">✏️ Edit</button>
                      <button class="dots-item" (click)="callUser(o); dotsOpenId=null">📞 Call</button>
                      <button class="dots-item danger" (click)="openDelModal(o); dotsOpenId=null">🗑️ Delete</button>
                    </div>
                  </div>
                </div>

                <!-- Customer info -->
                <div class="order-card-body">
                  <p class="order-cust-name">{{ o.name }}</p>
                  <p class="order-phone">📞 {{ o.phone }}</p>
                  <p class="order-time">🕒 {{ fmtDT(o.orderedAt) }}</p>
                </div>

                <!-- Items -->
                <div class="order-items-box">
                  <div *ngFor="let grp of groupItemsByRestaurant(o.items)">
                    <div class="order-rest-label">🏪 {{ grp.restaurant }}</div>
                    <div *ngFor="let it of grp.items" class="order-item-row">
                      <span>{{ it.name }}</span><span class="item-qty-badge">×{{ it.qty }}</span>
                    </div>
                  </div>
                </div>

                <!-- Footer: total + deliver -->
                <div class="order-card-footer">
                  <span class="order-total-big">₹{{ o.total }}</span>
                  <button class="deliver-btn" (click)="openPayModal(o)">✔ Deliver</button>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="pendingOrders.length===0 && !ordersSearch" class="empty-hint" style="text-align:center;padding:2rem">✔ All caught up!</div>
          <div *ngIf="pendingOrders.length===0 && ordersSearch" class="empty-hint" style="text-align:center;padding:2rem">No pending orders match "{{ ordersSearch }}"</div>

          <!-- Delivered Orders -->
          <div *ngIf="deliveredOrders.length>0" style="margin-top:16px">
            <div class="section-label">
              <span class="sec-label-text" style="color:#16a34a">DELIVERED</span>
              <span class="sec-count" style="background:#dcfce7;color:#16a34a">{{ deliveredOrders.length }}</span>
              <div class="sec-line"></div>
            </div>
            <div class="orders-list">
              <div *ngFor="let o of deliveredOrders" class="order-card" style="opacity:.6">
                <div class="order-card-top">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span class="tag-orange large-tag">{{ o.token }}</span>
                    <span [class]="o.payment==='COD'?'tag-cod':'tag-pre'">{{ o.payment }}</span>
                    <span *ngIf="o.paymentStatus==='paid'"    class="pay-badge paid">Paid</span>
                    <span *ngIf="o.paymentStatus==='unpaid'"  class="pay-badge unpaid">Unpaid</span>
                    <span *ngIf="o.paymentStatus==='pending'" class="pay-badge pend">Pending{{ o.pendingAmount?' ₹'+o.pendingAmount:'' }}</span>
                  </div>
                  <div class="dots-wrap" (click)="$event.stopPropagation()">
                    <button class="dots-btn" (click)="toggleDotsMenu(o.id)">•••</button>
                    <div *ngIf="dotsOpenId===o.id" class="dots-drop">
                      <button class="dots-item" (click)="openUpdModal(o); dotsOpenId=null">✏️ Edit</button>
                      <button class="dots-item" (click)="callUser(o); dotsOpenId=null">📞 Call</button>
                      <button class="dots-item danger" (click)="openDelModal(o); dotsOpenId=null">🗑️ Delete</button>
                    </div>
                  </div>
                </div>
                <div class="order-card-body">
                  <p class="order-cust-name">{{ o.name }}</p>
                  <p class="order-phone">📞 {{ o.phone }}</p>
                  <p class="order-time">🕒 {{ fmtDT(o.orderedAt) }}</p>
                </div>
                <div class="order-items-box">
                  <div *ngFor="let grp of groupItemsByRestaurant(o.items)">
                    <div class="order-rest-label">🏪 {{ grp.restaurant }}</div>
                    <div *ngFor="let it of grp.items" class="order-item-row">
                      <span>{{ it.name }}</span><span class="item-qty-badge">×{{ it.qty }}</span>
                    </div>
                  </div>
                </div>
                <div class="order-card-footer">
                  <span class="order-total-big">₹{{ o.total }}</span>
                  <button class="deliver-btn delivered-btn" disabled>✔ Delivered</button>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="localOrders.length===0 && !ordersSearch" class="empty-hint" style="text-align:center;padding:3rem">📋 No orders today</div>
        </div>

        <!-- ════ SHOW OFF TAB ════ -->
        <div *ngIf="activeTab==='showoff'" class="tab-content">
          <div *ngIf="showoffToast" class="inline-toast">📶 {{ showoffToast }}</div>

          <!-- Toolbar -->
          <div class="orders-toolbar">
            <button class="btn-wa" [disabled]="showoffDisplay.length===0" (click)="doWhatsApp()">💬 Share All</button>
            <button class="btn-primary sm" (click)="doShowOffExport()" [disabled]="showoffDisplay.length===0">⬇ XL</button>
            <button [class]="canShowOffClear?'btn-danger sm':'btn-ghost sm'" (click)="doShowOffClear()" [disabled]="!canShowOffClear">🗑 Clear</button>
          </div>

          <!-- Overall banner -->
          <div class="perf-banner">
            <div class="perf-header"><span>📈</span><span>Today's Performance</span></div>
            <p class="perf-num">{{ showoffTotal }}</p>
            <p class="perf-sub">Total items sold today</p>
            <div *ngIf="showoffTop && !showoffUiCleared" class="perf-top">
              <p class="perf-top-label">Top Seller Overall</p>
              <p class="perf-top-val">{{ showoffTop.name }} — {{ showoffTop.qty }}</p>
            </div>
          </div>

          <!-- Restaurant dropdown selector -->
          <div *ngIf="showoffByRestaurant.length > 0" class="card" style="margin-bottom:12px">
            <h3 class="card-title" style="margin-bottom:10px">🏪 Select Restaurant</h3>
            <select [(ngModel)]="selectedShowoffRestaurant" class="form-select">
              <option value="">— View all restaurants —</option>
              <option *ngFor="let r of showoffByRestaurant" [value]="r.restaurant">
                {{ r.restaurant }} ({{ r.totalItems }} items)
              </option>
            </select>
          </div>

          <!-- Show all restaurants summary (when none selected) -->
          <div *ngIf="!selectedShowoffRestaurant && showoffByRestaurant.length > 0">
            <div *ngFor="let restSection of showoffByRestaurant" class="rest-showoff-section">
              <div class="rest-showoff-header">
                <div style="display:flex;align-items:center;gap:8px">
                  <span>🏪</span>
                  <span class="rest-showoff-name">{{ restSection.restaurant }}</span>
                  <span class="rest-showoff-count">{{ restSection.totalItems }} items</span>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn-wa sm" (click)="doRestaurantWhatsApp(restSection)">💬</button>
                  <button class="btn-primary sm" (click)="doRestaurantExport(restSection)">⬇</button>
                </div>
              </div>
              <!-- Collapsed preview: top 3 items only -->
              <div class="list" style="border-radius:0 0 1rem 1rem">
                <div *ngFor="let item of restSection.items.slice(0,3); let idx=index">
                  <hr *ngIf="idx>0" class="divider" />
                  <div style="padding:10px 16px;display:flex;align-items:center;justify-content:space-between">
                    <div style="display:flex;align-items:center;gap:8px">
                      <span style="font-size:11px;font-weight:700;color:#64748b;width:18px;text-align:right">{{ idx+1 }}</span>
                      <span style="font-size:13px;font-weight:500;color:#1e293b">{{ item.name }}</span>
                    </div>
                    <span style="font-size:14px;font-weight:800;color:var(--primary)">{{ item.qty }}</span>
                  </div>
                </div>
                <div *ngIf="restSection.items.length > 3" style="padding:8px 16px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9">
                  +{{ restSection.items.length - 3 }} more — select restaurant to see all
                </div>
              </div>
            </div>
          </div>

          <!-- Selected restaurant: full breakdown -->
          <div *ngIf="selectedShowoffRestaurant && selectedShowoffSection">
            <div class="rest-showoff-section">
              <div class="rest-showoff-header">
                <div style="display:flex;align-items:center;gap:8px">
                  <span>🏪</span>
                  <span class="rest-showoff-name">{{ selectedShowoffSection.restaurant }}</span>
                  <span class="rest-showoff-count">{{ selectedShowoffSection.totalItems }} items</span>
                </div>
                <div style="display:flex;gap:6px">
                  <button class="btn-wa sm" (click)="doRestaurantWhatsApp(selectedShowoffSection)">💬</button>
                  <button class="btn-primary sm" (click)="doRestaurantExport(selectedShowoffSection)">⬇ XL</button>
                </div>
              </div>
              <div class="list" style="border-radius:0 0 1rem 1rem">
                <div *ngFor="let item of selectedShowoffSection.items; let idx=index">
                  <hr *ngIf="idx>0" class="divider" />
                  <div style="padding:10px 16px">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
                      <div style="display:flex;align-items:center;gap:8px">
                        <span style="font-size:11px;font-weight:700;color:#64748b;width:18px;text-align:right">{{ idx+1 }}</span>
                        <span style="font-size:13px;font-weight:500;color:#1e293b">{{ item.name }}</span>
                      </div>
                      <span style="font-size:14px;font-weight:800;color:var(--primary)">{{ item.qty }}</span>
                    </div>
                    <div style="margin-left:26px;height:4px;background:#f1f5f9;border-radius:99px;overflow:hidden">
                      <div style="height:100%;background:var(--primary);border-radius:99px;transition:width .5s"
                           [style.width.%]="selectedShowoffSection.items[0].qty>0?(item.qty/selectedShowoffSection.items[0].qty*100):0"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="showoffDisplay.length===0" class="empty-hint" style="text-align:center;padding:3rem">📈 No orders yet — start taking orders!</div>
        </div>

      </div>
    </main>
  </div>
</div>
<div *ngIf="saveSuccess" class="toast">✅ Saved successfully!</div>
  `,
  styles: [`
    :host { --primary:#e8546c; --destructive:#ef4444; }
    * { box-sizing:border-box; }

    .admin-wrap { display:flex; min-height:100vh; background:#f8fafc; font-family:'Poppins',sans-serif; }
    .sidebar-overlay { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,.45); backdrop-filter:blur(3px); }
    .sidebar { position:fixed; top:0; left:0; height:100%; width:260px; background:#fff; z-index:51; box-shadow:4px 0 32px rgba(0,0,0,.12); transform:translateX(-100%); transition:transform .3s cubic-bezier(.4,0,.2,1); display:flex; flex-direction:column; }
    .sidebar.open { transform:translateX(0); }
    .sidebar-header { display:flex; align-items:center; justify-content:space-between; padding:0 20px; height:56px; border-bottom:1px solid #e2e8f0; }
    .nav { padding:12px; display:flex; flex-direction:column; gap:4px; flex:1; overflow-y:auto; }
    .nav-pill { display:flex; align-items:center; gap:10px; width:100%; padding:10px 14px; border-radius:10px; border:none; cursor:pointer; font-size:.875rem; font-weight:500; text-align:left; background:transparent; color:#64748b; transition:all .15s; font-family:'Poppins',sans-serif; }
    .nav-pill:hover { background:#f1f5f9; color:#1e293b; }
    .nav-pill.active { background:rgba(232,84,108,.1); color:var(--primary); font-weight:600; }
    .sidebar-footer { padding:12px; border-top:1px solid #e2e8f0; }
    .main { flex:1; display:flex; flex-direction:column; }
    .topbar { position:fixed; top:0; left:0; right:0; z-index:40; background:#fff; border-bottom:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,.06); display:flex; align-items:center; justify-content:space-between; padding:0 16px; height:56px; }
    .topbar-center { display:flex; align-items:center; gap:10px; }
    .brand { font-size:15px; font-weight:800; color:#1e293b; }
    .brand-orange { color:var(--primary); }
    .back-site-btn { font-size:12px; font-weight:600; color:#64748b; background:none; border:none; cursor:pointer; padding:6px 10px; font-family:'Poppins',sans-serif; }
    .icon-btn { padding:8px; border-radius:10px; border:none; background:transparent; cursor:pointer; font-size:16px; }
    .content-wrap { padding-top:56px; }
    .content-inner { padding:1rem; max-width:900px; }
    .page-title { font-size:1.125rem; font-weight:700; color:#1e293b; margin:0 0 1rem; }
    .tab-content { display:flex; flex-direction:column; gap:16px; }
    .status-badge { font-size:11px; font-weight:600; padding:2px 10px; border-radius:99px; }
    .status-badge.ok { background:#dcfce7; color:#16a34a; }
    .status-badge.err { background:#fee2e2; color:#dc2626; }

    .global-toast { position:fixed; top:64px; left:50%; transform:translateX(-50%); z-index:9999; display:flex; align-items:center; gap:10px; background:#fff3e6; color:#1e293b; padding:10px 16px; border-radius:99px; box-shadow:0 4px 20px rgba(232,84,108,.2); border:1.5px solid var(--primary); max-width:90vw; animation:slideIn .3s ease; }
    .toast-icon { width:26px; height:26px; border-radius:50%; background:var(--primary); display:flex; align-items:center; justify-content:center; font-size:11px; color:#fff; }
    .toast-sub { margin:0; font-size:11px; color:#64748b; font-weight:500; }
    .toast-name { margin:0; font-size:13px; font-weight:800; color:#1e293b; }
    .toast-close { background:#f1f5f9; border:1px solid #e2e8f0; border-radius:99px; width:20px; height:20px; cursor:pointer; font-size:10px; margin-left:4px; }

    .card { background:#fff; border-radius:1rem; padding:1.25rem; box-shadow:0 1px 3px rgba(0,0,0,.07); }
    .card-title { font-size:1rem; font-weight:700; margin:0 0 1rem; color:#1e293b; }
    .label-cap { font-size:11px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.06em; margin:0 0 12px; }
    .divider { border-top:1px solid #f1f5f9; margin:0; }
    .tab-desc { font-size:.875rem; color:#64748b; margin-bottom:1rem; }
    .empty-hint { padding:1.5rem; color:#94a3b8; font-size:.875rem; }

    .toggle { position:relative; display:inline-block; width:52px; height:28px; flex-shrink:0; }
    .toggle input { opacity:0; width:0; height:0; position:absolute; }
    .slider { position:absolute; cursor:pointer; inset:0; background:#cbd5e1; border-radius:28px; transition:.3s; }
    .slider::before { content:''; position:absolute; width:22px; height:22px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:.3s; }
    input:checked + .slider { background:var(--primary); }
    input:checked + .slider::before { transform:translateX(24px); }
    input:disabled + .slider { opacity:.5; cursor:not-allowed; }

    .orders-card { display:flex; align-items:center; justify-content:space-between; padding:1.5rem; border-radius:1rem; gap:1rem; flex-wrap:wrap; }
    .orders-card.open { background:linear-gradient(135deg,#dcfce7,#bbf7d0); border:2px solid #86efac; }
    .orders-card.closed { background:linear-gradient(135deg,#fee2e2,#fecaca); border:2px solid #fca5a5; }
    .oc-title { font-size:1.1rem; font-weight:700; margin:0 0 .25rem; color:#1e293b; }
    .oc-sub { font-size:.875rem; color:#475569; margin:0; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(130px,1fr)); gap:.75rem; }
    .stat-card { background:#fff; border-radius:1rem; padding:1.25rem; box-shadow:0 1px 3px rgba(0,0,0,.07); border-left:4px solid #e2e8f0; }
    .stat-card.warn { border-left-color:#f59e0b; }
    .stat-card.green { border-left-color:#22c55e; }
    .stat-num { font-size:2rem; font-weight:800; color:#1e293b; }
    .stat-label { font-size:.75rem; color:#64748b; font-weight:500; }
    .stat-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
    .stat-label2 { font-size:11px; color:#64748b; }
    .stat-icon2 { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; }
    .stat-num2 { font-size:18px; font-weight:800; color:#1e293b; margin:0; }
    .live-chip { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:600; color:#16a34a; }
    .dot { width:7px; height:7px; border-radius:50%; display:inline-block; flex-shrink:0; }
    .dot.green { background:#10b981; }
    .dot.pulse { animation:pulse 1.5s infinite; }
    .recent-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; }
    .rr-name { font-size:13px; font-weight:600; color:#1e293b; margin:0; }
    .rr-sub { font-size:11px; color:#64748b; margin-top:2px; }
    .rr-total { font-size:13px; font-weight:700; color:#1e293b; margin:0; }

    .list { background:#fff; border-radius:1rem; box-shadow:0 1px 3px rgba(0,0,0,.07); overflow:hidden; }
    .list-item { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid #f1f5f9; gap:1rem; }
    .list-item:last-child { border-bottom:none; }
    .list-item-left { display:flex; align-items:center; gap:.75rem; flex:1; min-width:0; }
    .list-item-right { display:flex; align-items:center; gap:.75rem; flex-shrink:0; }
    .rest-thumb { width:3rem; height:3rem; border-radius:.5rem; object-fit:cover; flex-shrink:0; }
    .list-item h4 { font-size:.9rem; font-weight:600; color:#1e293b; margin:0; }
    .list-sub { font-size:.75rem; color:#64748b; margin:.125rem 0 0; }
    .category-header { padding:.5rem 1.25rem; background:#f8fafc; font-size:.75rem; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid #f1f5f9; }
    .select-wrap { background:#fff; border-radius:1rem; padding:1rem 1.25rem; box-shadow:0 1px 3px rgba(0,0,0,.07); }
    .edit-price-btn { border:none; background:transparent; cursor:pointer; font-size:.75rem; color:var(--primary); margin-left:.25rem; }
    .price-input { width:5rem; padding:.25rem .5rem; border:1px solid var(--primary); border-radius:.5rem; font-size:.875rem; }
    .price-btn { border:none; border-radius:.5rem; padding:.25rem .5rem; cursor:pointer; font-size:.75rem; color:#fff; }
    .price-btn.save { background:#16a34a; }
    .price-btn.cancel { background:#dc2626; }
    .price-btn.reset { background:#f59e0b; }

    .badge { padding:.2rem .6rem; border-radius:99px; font-size:.7rem; font-weight:600; }
    .badge-green { background:#dcfce7; color:#16a34a; }
    .badge-red { background:#fee2e2; color:#dc2626; }
    .tag-orange { font-size:11px; font-weight:700; color:#e8762c; background:#fef0e6; padding:3px 8px; border-radius:8px; }
    .large-tag { font-size:13px; padding:4px 10px; }
    .tag-cod { font-size:11px; font-weight:600; color:#6f42c1; background:#f0ebfd; padding:2px 8px; border-radius:99px; }
    .tag-pre { font-size:11px; font-weight:600; color:#2c7be8; background:#e6effd; padding:2px 8px; border-radius:99px; }

    .form-select { width:100%; padding:.625rem .875rem; border:2px solid #e2e8f0; border-radius:.625rem; font-size:.875rem; outline:none; font-family:'Poppins',sans-serif; background:#fff; cursor:pointer; }
    .form-select:focus { border-color:var(--primary); }
    .form-input { width:100%; padding:.625rem .875rem; border:2px solid #e2e8f0; border-radius:.625rem; font-size:.875rem; outline:none; font-family:'Poppins',sans-serif; background:#fff; }
    .form-input:focus { border-color:var(--primary); box-shadow:0 0 0 3px rgba(232,84,108,.1); }
    .form-textarea { width:100%; padding:.625rem .875rem; border:2px solid #e2e8f0; border-radius:.625rem; font-size:.875rem; outline:none; font-family:'Poppins',sans-serif; resize:vertical; }
    .form-textarea:focus { border-color:var(--primary); }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
    @media(max-width:600px){ .form-row { grid-template-columns:1fr; } }
    .form-field { display:flex; flex-direction:column; gap:.375rem; }
    .form-field label { font-size:.8rem; font-weight:600; color:#374151; }
    .form-check { display:flex; align-items:center; gap:.5rem; font-size:.875rem; color:#374151; cursor:pointer; }
    .form-actions { display:flex; gap:.75rem; flex-wrap:wrap; }
    .coupon-form { display:flex; flex-direction:column; gap:1rem; }

    .btn-primary { padding:.625rem 1.5rem; border-radius:.625rem; background:var(--primary); color:#fff; border:none; cursor:pointer; font-size:.875rem; font-weight:600; font-family:'Poppins',sans-serif; transition:all .2s; display:inline-flex; align-items:center; gap:6px; }
    .btn-primary:hover { transform:translateY(-1px); box-shadow:0 4px 12px rgba(232,84,108,.3); }
    .btn-primary:disabled { opacity:.6; cursor:not-allowed; transform:none; }
    .btn-ghost { padding:.625rem 1.25rem; border-radius:.625rem; background:#f1f5f9; color:#64748b; border:none; cursor:pointer; font-size:.875rem; font-weight:500; font-family:'Poppins',sans-serif; display:inline-flex; align-items:center; gap:6px; }
    .btn-ghost:disabled { opacity:.45; cursor:not-allowed; }
    .btn-danger { padding:.625rem 1.25rem; border-radius:.625rem; background:#ef4444; color:#fff; border:none; cursor:pointer; font-size:.875rem; font-weight:600; font-family:'Poppins',sans-serif; display:inline-flex; align-items:center; gap:6px; }
    .btn-danger:disabled { opacity:.45; cursor:not-allowed; }
    .btn-orange { padding:.625rem 1.25rem; border-radius:.625rem; background:#e8762c; color:#fff; border:none; cursor:pointer; font-size:.875rem; font-weight:600; font-family:'Poppins',sans-serif; display:inline-flex; align-items:center; gap:6px; }
    .btn-dark   { padding:.625rem 1.25rem; border-radius:.625rem; background:#1e293b; color:#fff; border:none; cursor:pointer; font-size:.875rem; font-weight:600; font-family:'Poppins',sans-serif; display:inline-flex; align-items:center; gap:6px; }
    .btn-red    { padding:.625rem 1.25rem; border-radius:.625rem; background:#ef4444; color:#fff; border:none; cursor:pointer; font-size:.875rem; font-weight:600; font-family:'Poppins',sans-serif; display:inline-flex; align-items:center; gap:6px; }
    .btn-wa     { flex:1; padding:.625rem 1.25rem; border-radius:.625rem; background:#25d366; color:#fff; border:none; cursor:pointer; font-size:.875rem; font-weight:700; font-family:'Poppins',sans-serif; display:inline-flex; align-items:center; justify-content:center; gap:6px; }
    .btn-wa:disabled { opacity:.45; cursor:not-allowed; }
    .sm { padding:.5rem .875rem !important; font-size:.8rem !important; flex:none !important; }
    button:disabled { opacity:.45; cursor:not-allowed; }
    .btn-icon { border:none; background:none; cursor:pointer; font-size:1.1rem; padding:.25rem; border-radius:.375rem; transition:background .2s; }
    .btn-icon:hover { background:#f1f5f9; }
    .btn-icon.danger:hover { background:#fee2e2; }

    .coupon-item { display:flex; align-items:flex-start; justify-content:space-between; padding:1rem 1.25rem; border-bottom:1px solid #f1f5f9; gap:1rem; }
    .coupon-item:last-child { border-bottom:none; }
    .coupon-left { flex:1; }
    .coupon-code { font-size:1.1rem; font-weight:800; color:var(--primary); font-family:monospace; letter-spacing:.1em; }
    .coupon-meta { display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; margin-top:.375rem; }
    .coupon-detail { font-size:.75rem; color:#64748b; background:#f1f5f9; padding:.125rem .5rem; border-radius:99px; }
    .coupon-desc { font-size:.8rem; color:#94a3b8; margin-top:.25rem; }
    .coupon-actions { display:flex; align-items:center; gap:.25rem; flex-shrink:0; }

    /* ── Orders toolbar ── */
    .orders-toolbar { display:flex; gap:8px; align-items:center; flex-wrap:nowrap; margin-bottom:10px; }
    .toolbar-icon-btn { width:38px; height:38px; flex-shrink:0; border:1px solid #e2e8f0; background:#f8fafc; border-radius:10px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; }
    .toolbar-icon-btn:disabled { opacity:.45; cursor:not-allowed; }
    .orders-summary { display:flex; align-items:center; justify-content:space-between; font-size:12px; color:#64748b; margin-bottom:12px; }
    .inline-toast { position:fixed; top:64px; left:50%; transform:translateX(-50%); z-index:9000; display:flex; align-items:center; gap:8px; background:#fff3e6; color:#1e293b; font-size:12px; font-weight:600; padding:8px 16px; border-radius:99px; box-shadow:0 4px 16px rgba(232,84,108,.18); border:1px solid var(--primary); max-width:90vw; }
    .search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); pointer-events:none; font-size:14px; }
    .section-label { display:flex; align-items:center; gap:8px; margin-bottom:10px; }
    .sec-label-text { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; white-space:nowrap; }
    .sec-count { font-size:11px; font-weight:600; padding:1px 7px; border-radius:99px; }
    .sec-line { flex:1; height:1px; background:#e2e8f0; }

    /* ── Order cards — mobile-first, generous sizing ── */
    .orders-list { display:flex; flex-direction:column; gap:14px; }
    .order-card { background:#fff; border-radius:14px; border:1px solid #e2e8f0; box-shadow:0 2px 8px rgba(0,0,0,.08); overflow:hidden; transition:all .5s; }
    .order-card.fading { opacity:.3; transform:scale(.97); }
    .order-card-top { display:flex; align-items:center; justify-content:space-between; padding:14px 14px 8px; gap:8px; }
    .new-badge { font-size:10px; font-weight:800; background:var(--primary); color:#fff; padding:2px 7px; border-radius:99px; animation:pulse 1.5s infinite; }
    .order-card-body { padding:0 14px 10px; }
    .order-cust-name { font-size:16px; font-weight:700; color:#1e293b; margin:0; }
    .order-phone { font-size:13px; color:#64748b; margin:4px 0 0; }
    .order-time { font-size:12px; color:#94a3b8; margin:3px 0 0; }
    .order-items-box { margin:0 12px 12px; background:#f8fafc; border-radius:10px; padding:10px 14px; }
    .order-rest-label { font-size:11px; font-weight:700; color:var(--primary); margin:8px 0 4px; text-transform:uppercase; letter-spacing:.04em; }
    .order-rest-label:first-child { margin-top:0; }
    .order-item-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; font-size:13px; color:#1e293b; padding-left:8px; }
    .order-item-row:last-child { margin-bottom:0; }
    .item-qty-badge { font-size:12px; font-weight:700; color:#fff; background:#64748b; padding:1px 7px; border-radius:99px; flex-shrink:0; }
    .order-card-footer { display:flex; align-items:center; justify-content:space-between; padding:10px 14px 14px; gap:8px; }
    .order-total-big { font-size:18px; font-weight:800; color:#1e293b; }
    .deliver-btn { display:flex; align-items:center; gap:6px; padding:10px 18px; border-radius:10px; border:none; font-size:14px; font-weight:700; cursor:pointer; background:var(--primary); color:#fff; font-family:'Poppins',sans-serif; }
    .delivered-btn { background:#dcfce7; color:#16a34a; cursor:default; }
    .pay-badge { font-size:11px; font-weight:600; padding:2px 8px; border-radius:99px; }
    .pay-badge.paid   { background:#dcfce7; color:#16a34a; }
    .pay-badge.unpaid { background:#fee2e2; color:#dc2626; }
    .pay-badge.pend   { background:#fef9c3; color:#92400e; }

    /* ── Dots menu — bigger tap targets on mobile ── */
    .dots-wrap { position:relative; flex-shrink:0; }
    .dots-btn { width:36px; height:36px; display:flex; align-items:center; justify-content:center; border-radius:10px; border:1.5px solid #e2e8f0; background:#f8fafc; cursor:pointer; font-size:18px; font-weight:700; color:#64748b; line-height:1; letter-spacing:0; }
    .dots-btn:hover, .dots-btn:active { background:#e2e8f0; }
    .dots-drop { position:absolute; right:0; top:42px; background:#fff; border:1px solid #e2e8f0; border-radius:14px; box-shadow:0 8px 32px rgba(0,0,0,.14); z-index:100; min-width:150px; overflow:hidden; }
    .dots-item { display:flex; align-items:center; gap:10px; width:100%; padding:14px 18px; border:none; background:transparent; font-size:14px; color:#1e293b; cursor:pointer; text-align:left; font-family:'Poppins',sans-serif; font-weight:500; }
    .dots-item:hover, .dots-item:active { background:#f8fafc; }
    .dots-item.danger { color:#dc2626; }
    .dots-item.danger:hover, .dots-item.danger:active { background:#fee2e2; }
    .upd-rest-tag { font-size:10px; font-weight:700; color:var(--primary); background:rgba(232,84,108,.1); padding:1px 5px; border-radius:4px; margin-right:4px; }

    /* ── Modals ── */
    .sheet-overlay { position:fixed; inset:0; z-index:60; display:flex; align-items:flex-end; justify-content:center; background:rgba(0,0,0,.45); backdrop-filter:blur(3px); }
    .sheet { position:relative; width:100%; max-width:520px; background:#fff; border-radius:20px 20px 0 0; box-shadow:0 -8px 40px rgba(0,0,0,.15); padding:20px 20px 36px; font-family:'Poppins',sans-serif; z-index:61; max-height:90vh; overflow-y:auto; }
    .sheet-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .sheet-title { font-size:16px; font-weight:700; color:#1e293b; margin:0; }
    .sheet-sub { font-size:13px; color:#64748b; margin:0; }
    .sheet-actions { display:flex; gap:8px; }
    .sheet-actions button { flex:1; padding:13px 0 !important; justify-content:center; font-size:15px !important; }
    .del-icon { width:40px; height:40px; background:#fee2e2; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
    .upd-items-list { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; max-height:220px; overflow-y:auto; }
    .upd-item-row { display:flex; align-items:center; gap:8px; background:#f8fafc; border-radius:12px; padding:12px 12px; }
    .upd-item-name { flex:1; font-size:13px; color:#1e293b; }
    .qty-btn { width:30px; height:30px; display:flex; align-items:center; justify-content:center; border-radius:8px; border:1px solid #e2e8f0; background:#fff; cursor:pointer; font-size:14px; font-family:'Poppins',sans-serif; }
    .qty-btn.danger { background:#fee2e2; border-color:#fecaca; }
    .qty-val { font-size:14px; font-weight:700; width:24px; text-align:center; color:#1e293b; }
    .add-item-section { border-top:1px solid #e2e8f0; padding-top:12px; margin-bottom:20px; }
    .add-item-row { display:flex; gap:8px; align-items:center; }
    .sugg-wrap { position:relative; flex:1; }
    .sugg-drop { position:absolute; left:0; right:0; top:100%; margin-top:4px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,.1); z-index:10; max-height:160px; overflow-y:auto; }
    .sugg-item { width:100%; text-align:left; padding:10px 14px; font-size:13px; border:none; cursor:pointer; background:#fff; color:#1e293b; font-family:'Poppins',sans-serif; }
    .sugg-item.hi { background:var(--primary); color:#fff; }
    .pay-options { display:flex; flex-direction:column; gap:10px; }
    .pay-opt { display:flex; align-items:center; gap:12px; width:100%; padding:14px 16px; border-radius:12px; border:1px solid #e2e8f0; background:#fff; color:#1e293b; font-size:14px; font-weight:500; cursor:pointer; font-family:'Poppins',sans-serif; }
    .pay-opt.sel-paid    { border-color:#86efac; background:#f0fdf4; color:#166534; }
    .pay-opt.sel-unpaid  { border-color:#fca5a5; background:#fef2f2; color:#b91c1c; }
    .pay-opt.sel-pending { border-color:#fcd34d; background:#fffbeb; color:#92400e; }

    /* ── Show Off ── */
    .perf-banner { background:var(--primary); border-radius:1rem; padding:1.25rem; color:#fff; margin-bottom:16px; }
    .perf-header { display:flex; align-items:center; gap:8px; margin-bottom:8px; font-size:14px; font-weight:600; }
    .perf-num { font-size:2.25rem; font-weight:800; margin:0; }
    .perf-sub { font-size:12px; color:rgba(255,255,255,.75); margin-top:4px; }
    .perf-top { margin-top:12px; background:rgba(255,255,255,.2); border-radius:12px; padding:8px 14px; }
    .perf-top-label { font-size:11px; color:rgba(255,255,255,.7); margin:0; }
    .perf-top-val { font-size:14px; font-weight:700; margin:2px 0 0; }
    .rest-showoff-section { margin-bottom:16px; }
    .rest-showoff-header { display:flex; align-items:center; justify-content:space-between; background:#fff; border-radius:1rem 1rem 0 0; padding:12px 16px; border-bottom:1px solid #f1f5f9; box-shadow:0 1px 3px rgba(0,0,0,.07); }
    .rest-showoff-name { font-size:13px; font-weight:700; color:#1e293b; }
    .rest-showoff-count { font-size:11px; color:var(--primary); background:rgba(232,84,108,.1); padding:1px 7px; border-radius:99px; font-weight:600; }

    .toast { position:fixed; bottom:1.5rem; right:1.5rem; z-index:100; background:#1e293b; color:#fff; padding:.75rem 1.25rem; border-radius:.75rem; font-size:.875rem; font-weight:500; box-shadow:0 8px 24px rgba(0,0,0,.2); animation:slideUp .3s ease; font-family:'Poppins',sans-serif; }

    /* ── Mobile tweaks ── */
    @media (max-width: 480px) {
      .content-inner { padding:.75rem; }
      .order-cust-name { font-size:15px; }
      .order-total-big { font-size:17px; }
      .deliver-btn { padding:10px 14px; font-size:13px; }
      .dots-btn { width:40px; height:40px; font-size:20px; }
      .dots-item { padding:15px 18px; font-size:15px; }
      .tag-orange.large-tag { font-size:14px; }
      .order-items-box { padding:10px 12px; }
      .order-item-row { font-size:13px; }
    }

    @keyframes slideUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes slideIn   { from{opacity:0;transform:translateX(-50%) translateY(-12px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.4} }
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  readonly adminService = inject(AdminService);
  private readonly ordersService = inject(OrdersService);
  private readonly auth          = inject(AuthService);
  private readonly router        = inject(Router);
  private readonly cdr           = inject(ChangeDetectorRef);

  readonly restaurants = restaurants;

  activeTab: AdminTab = 'overview';
  sidebarOpen = false;
  saving  = false;
  busy    = false;
  saveSuccess = false;
  statusMsg = '';
  closedMessage = '';
  deliveryTime = '';
  selectedRestaurantId = '';
  editingCoupon: Coupon | null = null;
  newCoupon: Omit<Coupon,'id'> = this.defaultCoupon();
  editingPrice: Record<string,boolean> = {};
  tempPrices: Record<string,number> = {};

  // Orders state
  ordersLoading = false;
  apiOrders: Order[] = [];
  localOrders: LocalOrder[] = [];
  prevApiCount = 0;
  ordersSearch = '';
  ordersExported = false;
  updModal: LocalOrder | null = null;
  payModal: LocalOrder | null = null;
  delModal: LocalOrder | null = null;
  updItems: OrderItem[] = [];
  newItemName = ''; newItemQty = 1;
  showSugg = false; filteredSugg: string[] = []; suggHiIdx = -1;
  paySelStatus: 'paid'|'unpaid'|'pending'|null = null;
  payPendingAmt = 0;

  // Dots menu
  dotsOpenId: number | string | null = null;

  // Toasts
  globalToastName = '';
  ordersToast = '';
  showoffToast = '';

  // Show off
  showoffExported = false;
  showoffUiCleared = false;
  selectedShowoffRestaurant = '';

  private pollInterval: any;
  private globalToastTimer: any;
  private ordersToastTimer: any;
  private showoffToastTimer: any;

  readonly groupItemsByRestaurant = groupItemsByRestaurant;

  ngOnInit(): void {
    this.closedMessage = this.adminService.settings().orders_off_message;
    this.deliveryTime  = this.adminService.settings().delivery_time;
    document.addEventListener('click', this.closeDotsMenu);
    this.loadOrdersData();
    this.pollInterval = setInterval(() => this.loadOrdersData(true), 15000);
  }
  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
    document.removeEventListener('click', this.closeDotsMenu);
  }

  // Close dots on outside click — but only if the click is not inside a dots-wrap
  private closeDotsMenu = (e: MouseEvent) => {
    if (this.dotsOpenId !== null) {
      const target = e.target as HTMLElement;
      if (!target.closest?.('.dots-wrap')) {
        this.dotsOpenId = null;
        this.cdr.detectChanges();
      }
    }
  };

  toggleDotsMenu(id: number | string): void {
    this.dotsOpenId = this.dotsOpenId === id ? null : id;
  }
  callUser(o: LocalOrder): void {
    if (o.phone && o.phone !== '—') window.open(`tel:${o.phone}`);
  }

  async loadOrdersData(silent = false): Promise<void> {
    if (!silent) this.ordersLoading = true;
    const orders = await this.ordersService.fetchOrders();
    if (this.prevApiCount > 0 && orders.length > this.prevApiCount) {
      const newest = orders[orders.length - 1];
      this.showGlobalToast(newest.customer_name ?? 'Customer');
    }
    if (this.ordersExported && orders.length > this.localOrders.length) this.ordersExported = false;
    this.prevApiCount = orders.length;
    this.apiOrders = orders;
    this.syncLocalOrders();
    this.ordersLoading = false;
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

  // ── Overview ──────────────────────────────────────────────────────────────
  get tabTitle(): string {
    const m: Record<AdminTab,string> = { overview:'📊 Overview', restaurants:'🏪 Restaurants', items:'🍽️ Menu Items', coupons:'🎟️ Coupons', orders:"📋 Today's Orders", showoff:'⭐ Show Off' };
    return m[this.activeTab];
  }
  get totalUnavailableItems(): number {
    return Object.values(this.adminService.settings().unavailable_items).reduce((s, arr) => s + (arr as string[]).length, 0);
  }
  get activeCoupons(): number { return this.adminService.coupons().filter(c => c.active).length; }

  get perRestaurantOrderCounts(): { name: string; orderCount: number; itemCount: number }[] {
    const map: Record<string, { orderCount: number; itemCount: number }> = {};
    this.apiOrders.forEach(o => {
      const restNames = new Set<string>();
      (o.items ?? []).forEach((it: any) => {
        const rn = it.restaurant_name || 'Other';
        if (!map[rn]) map[rn] = { orderCount: 0, itemCount: 0 };
        map[rn].itemCount += it.qty ?? 1;
        restNames.add(rn);
      });
      restNames.forEach(rn => { if (map[rn]) map[rn].orderCount++; });
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.orderCount - a.orderCount);
  }

  get overviewOrderStats() {
    const rev    = this.apiOrders.reduce((s,o) => s+(o.total??0),0);
    const codRev = this.apiOrders.filter(o=>o.payment_mode==='cod').reduce((s,o)=>s+(o.total??0),0);
    const preRev = this.apiOrders.filter(o=>o.payment_mode!=='cod').reduce((s,o)=>s+(o.total??0),0);
    const delivered = this.apiOrders.filter(o=>o.deliver_status==='delivered').length;
    const pending   = this.apiOrders.filter(o=>o.deliver_status!=='delivered').length;
    return [
      { label:'Revenue',      value:`₹${rev}`,                  icon:'📈', bg:'#FEF0E6' },
      { label:'Total Orders', value:`${this.apiOrders.length}`, icon:'🛍️', bg:'#E6EFFD' },
      { label:'Pending',      value:`${pending}`,               icon:'⏰', bg:'#FEF7E6' },
      { label:'Delivered',    value:`${delivered}`,             icon:'✅', bg:'#E6F5EA' },
      { label:'COD',          value:`₹${codRev}`,              icon:'💵', bg:'#F0EBFD' },
      { label:'Prepaid',      value:`₹${preRev}`,              icon:'💳', bg:'#E6FBF6' },
    ];
  }
  get recentOrders(): Order[] { return [...this.apiOrders].reverse().slice(0,5); }

  async toggleOrders(event: Event): Promise<void> {
    const checked = (event.target as HTMLInputElement).checked;
    await this.doSave(() => this.adminService.setOrdersAccepting(checked));
  }
  async saveClosedMessage(): Promise<void> { await this.doSave(() => this.adminService.setOrdersOffMessage(this.closedMessage)); }
  async saveDeliveryTime(): Promise<void>  { await this.doSave(() => this.adminService.setDeliveryTime(this.deliveryTime)); }

  // ── Restaurants ───────────────────────────────────────────────────────────
  isRestAvailable(id: string): boolean { return this.adminService.isRestaurantAvailable(id); }
  async toggleRestaurant(id: string, event: Event): Promise<void> {
    const available = (event.target as HTMLInputElement).checked;
    await this.doSave(() => this.adminService.setRestaurantAvailability(id, available));
  }

  // ── Menu Items ────────────────────────────────────────────────────────────
  get selectedRestaurant() { return restaurants.find(r => r.id === this.selectedRestaurantId); }
  isItemAvail(restaurantId: string, itemName: string): boolean { return this.adminService.isItemAvailable(restaurantId, itemName); }
  async toggleItem(restaurantId: string, itemName: string, event: Event): Promise<void> {
    const available = (event.target as HTMLInputElement).checked;
    await this.doSave(() => this.adminService.setItemAvailability(restaurantId, itemName, available));
  }
  startEditPrice(restaurantId: string, itemName: string, originalPrice: number): void {
    const key = `${restaurantId}::${itemName}`;
    this.tempPrices[key] = this.adminService.getItemPrice(restaurantId, itemName, originalPrice);
    this.editingPrice[key] = true;
  }
  async savePrice(restaurantId: string, itemName: string): Promise<void> {
    const key = `${restaurantId}::${itemName}`;
    if (this.tempPrices[key] > 0) await this.adminService.setItemPrice(restaurantId, itemName, this.tempPrices[key]);
    this.editingPrice[key] = false;
  }
  cancelEditPrice(restaurantId: string, itemName: string): void { this.editingPrice[`${restaurantId}::${itemName}`] = false; }
  async resetPrice(restaurantId: string, itemName: string): Promise<void> {
    await this.adminService.resetItemPrice(restaurantId, itemName);
    this.editingPrice[`${restaurantId}::${itemName}`] = false;
  }

  // ── Coupons ───────────────────────────────────────────────────────────────
  async saveCoupon(): Promise<void> {
    if (!this.newCoupon.code || !this.newCoupon.value) return;
    if (this.editingCoupon?.id) {
      await this.doSave(() => this.adminService.updateCoupon(this.editingCoupon!.id!, this.newCoupon));
    } else {
      await this.doSave(() => this.adminService.addCoupon(this.newCoupon));
    }
    this.newCoupon = this.defaultCoupon(); this.editingCoupon = null;
  }
  editCoupon(coupon: Coupon): void {
    this.editingCoupon = coupon;
    this.newCoupon = { code:coupon.code, type:coupon.type, value:coupon.value, min_order:coupon.min_order, active:coupon.active, description:coupon.description };
  }
  cancelEdit(): void { this.editingCoupon = null; this.newCoupon = this.defaultCoupon(); }
  async toggleCouponActive(coupon: Coupon): Promise<void> { await this.doSave(() => this.adminService.updateCoupon(coupon.id!, { active:!coupon.active })); }
  async deleteCoupon(coupon: Coupon): Promise<void> {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    await this.doSave(() => this.adminService.deleteCoupon(coupon.id!));
  }
  private defaultCoupon(): Omit<Coupon,'id'> { return { code:'', type:'percent', value:0, min_order:0, active:true, description:'' }; }

  // ── Today's Orders ────────────────────────────────────────────────────────
  openUpdModal(o: LocalOrder): void { this.updModal = o; this.updItems = o.items.map(i=>({...i})); }
  openPayModal(o: LocalOrder): void { this.payModal = o; this.paySelStatus = null; this.payPendingAmt = 0; }
  openDelModal(o: LocalOrder): void { this.delModal = o; }
  get payOk(): boolean { return this.paySelStatus==='paid' || this.paySelStatus==='unpaid' || (this.paySelStatus==='pending' && this.payPendingAmt>0); }

  async doUpdateOrder(): Promise<void> {
    if (!this.updModal) return;
    this.busy = true;
    const allItems = restaurants.flatMap(r => r.menu.flatMap(cat => cat.items));
    const newTotal = this.updItems.reduce((sum,it) => {
      const mi = allItems.find(m=>m.name===it.name);
      return sum + (mi ? mi.price*it.qty : 0);
    }, 0) || this.updModal.total;
    try {
      await this.ordersService.updateOrder(this.updModal.id, { items:this.updItems, total:newTotal });
      this.showOrdersToast('Order updated ✓');
      await this.loadOrdersData(true);
    } catch { this.showOrdersToast('Update failed ✗'); }
    this.busy = false;
    this.updModal = null;
  }

  async doDeliver(): Promise<void> {
    if (!this.payModal || !this.paySelStatus) return;
    this.busy = true;
    const { id } = this.payModal;
    const status = this.paySelStatus;
    const amount = status==='pending' ? this.payPendingAmt : undefined;
    this.localOrders = this.localOrders.map(o => o.id===id ? {...o, fadingOut:true, paymentStatus:status, pendingAmount:amount} : o);
    setTimeout(() => {
      this.localOrders = this.localOrders.map(o => o.id===id ? {...o, fadingOut:false, status:'delivered'} : o);
      this.cdr.detectChanges();
    }, 600);
    this.payModal = null;
    try {
      await this.ordersService.updateOrder(id, { deliver_status:'delivered', pay_status:status, pending_amount:status==='pending'?amount:null });
    } catch { this.showOrdersToast('Deliver save failed ✗'); }
    this.busy = false;
  }

  async doDeleteOrder(): Promise<void> {
    if (!this.delModal) return;
    this.busy = true;
    try {
      await this.ordersService.deleteOrder(this.delModal.id);
      this.localOrders = this.localOrders.filter(o=>o.id!==this.delModal!.id);
      this.showOrdersToast('Order deleted ✓');
      await this.loadOrdersData(true);
    } catch { this.showOrdersToast('Delete failed ✗'); }
    this.busy = false;
    this.delModal = null;
  }

  doExport(): void { this.ordersService.exportToXlsx(this.apiOrders); this.ordersExported=true; this.showOrdersToast('Exported ✓'); }

  async doClear(): Promise<void> {
    if (!this.ordersExported) return;
    if (!confirm('Clear ALL orders from the database?\n\nToken numbers will restart from #001.')) return;
    this.busy = true;
    try {
      await this.ordersService.clearAllOrders();
      this.localOrders=[]; this.apiOrders=[]; this.ordersExported=false;
      this.showOrdersToast('All orders cleared ✓');
    } catch { this.showOrdersToast('Clear failed ✗'); }
    this.busy = false;
  }

  /**
   * Search fix: handles plain numbers (1 → #001), #-prefixed (#001), names, phone.
   * Shows the order ONLY if it is an exact token match OR name/phone includes query.
   */
  private matchSearch(o: LocalOrder): boolean {
    const q = this.ordersSearch.trim().toLowerCase();
    if (!q) return true;

    // Normalise query for token comparison
    const qStripped = q.replace(/^#/, '').replace(/^0+/, '') || '0'; // remove # and leading zeros
    const tokenNum = String(o.tokenNum); // e.g. "1", "2", "12"

    // Token matches: "1" matches #001, "001" matches #001, "#001" matches #001
    const tokenMatch = tokenNum === qStripped || o.token.toLowerCase() === q;

    // Name / phone contains match (only for non-numeric queries or longer queries)
    const nameMatch  = o.name.toLowerCase().includes(q);
    const phoneMatch = o.phone.includes(q);

    return tokenMatch || nameMatch || phoneMatch;
  }

  get pendingOrders(): LocalOrder[]   { return this.localOrders.filter(o=>o.status==='pending'   && this.matchSearch(o)); }
  get deliveredOrders(): LocalOrder[] { return this.localOrders.filter(o=>o.status==='delivered' && this.matchSearch(o)).sort((a,b)=>a.tokenNum-b.tokenNum); }
  get pendingCount(): number   { return this.localOrders.filter(o=>o.status==='pending').length; }
  get deliveredCount(): number { return this.localOrders.filter(o=>o.status==='delivered').length; }

  // ── Suggestions ───────────────────────────────────────────────────────────
  onNewItemNameChange(): void {
    const q=this.newItemName.trim();
    this.filteredSugg=q ? MENU_SUGGESTIONS.filter(s=>s.toLowerCase().includes(q.toLowerCase())) : [];
    this.showSugg=this.filteredSugg.length>0; this.suggHiIdx=-1;
  }
  selSugg(name: string): void { this.newItemName=name; this.showSugg=false; this.suggHiIdx=-1; }
  addUpdItem(): void {
    const n=this.newItemName.trim(); if(!n) return;
    const ex=this.updItems.findIndex(i=>i.name.toLowerCase()===n.toLowerCase());
    if(ex>=0) this.updItems[ex].qty+=this.newItemQty;
    else this.updItems.push({name:n, qty:this.newItemQty});
    this.newItemName=''; this.newItemQty=1; this.showSugg=false;
  }
  chUpdQty(idx: number, d: number): void { if(this.updItems[idx].qty+d>=1) this.updItems[idx].qty+=d; }
  remUpdItem(idx: number): void { this.updItems.splice(idx,1); }

  // ── Show Off ──────────────────────────────────────────────────────────────
  get showoffTally(): { name: string; qty: number; restaurant: string }[] {
    const tally: Record<string,{ name:string; qty:number; restaurant:string }> = {};
    this.apiOrders.forEach(o=>(o.items??[]).forEach((it:any)=>{
      const key = `${it.restaurant_name||'Other'}::${it.name}`;
      if(!tally[key]) tally[key]={ name:it.name, qty:0, restaurant: it.restaurant_name||'Other' };
      tally[key].qty+=it.qty??1;
    }));
    return Object.values(tally).sort((a,b)=>b.qty-a.qty);
  }
  get showoffDisplay(): { name:string; qty:number; restaurant:string }[] { return this.showoffUiCleared ? [] : this.showoffTally; }
  get showoffTotal(): number { return this.showoffDisplay.reduce((s,i)=>s+i.qty,0); }
  get showoffTop(): { name:string; qty:number }|null { return this.showoffDisplay[0]??null; }
  get canShowOffClear(): boolean { return this.showoffExported && this.apiOrders.length===0 && !this.showoffUiCleared; }

  get showoffByRestaurant(): { restaurant:string; items:{name:string;qty:number}[]; totalItems:number }[] {
    const map: Record<string,{name:string;qty:number}[]> = {};
    this.showoffDisplay.forEach(it => {
      if (!map[it.restaurant]) map[it.restaurant] = [];
      map[it.restaurant].push({ name:it.name, qty:it.qty });
    });
    return Object.entries(map).map(([restaurant, items]) => ({
      restaurant,
      items: items.sort((a,b)=>b.qty-a.qty),
      totalItems: items.reduce((s,i)=>s+i.qty,0),
    })).sort((a,b)=>b.totalItems-a.totalItems);
  }

  get selectedShowoffSection() {
    if (!this.selectedShowoffRestaurant) return null;
    return this.showoffByRestaurant.find(r => r.restaurant === this.selectedShowoffRestaurant) ?? null;
  }

  doWhatsApp(): void {
    const lines = this.showoffByRestaurant
      .map(r => `*${r.restaurant}*\n` + r.items.map(i=>`  ${i.name} — ${i.qty}`).join('\n'))
      .join('\n\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(`🍛 *CLGBITES — Today's Bestsellers*\n\n${lines}\n\nTotal items: ${this.showoffTotal}`)}`, '_blank');
  }
  doRestaurantWhatsApp(r: { restaurant:string; items:{name:string;qty:number}[]; totalItems:number }): void {
    const lines = r.items.map(i=>`  ${i.name} — ${i.qty}`).join('\n');
    window.open(`https://wa.me/?text=${encodeURIComponent(`🍛 *CLGBITES — ${r.restaurant} Today's Sales*\n\n${lines}\n\nTotal items: ${r.totalItems}`)}`, '_blank');
  }
  doRestaurantExport(r: { restaurant:string; items:{name:string;qty:number}[] }): void {
    this.ordersService.exportShowOffXlsx(r.items.map(i=>({...i, restaurant:r.restaurant})), r.restaurant);
  }
  doShowOffExport(): void { this.ordersService.exportShowOffXlsx(this.showoffDisplay, undefined); this.showoffExported=true; this.showShowOffToast('Exported ✓'); }
  doShowOffClear(): void { if(!this.canShowOffClear) return; this.showoffUiCleared=true; this.showoffExported=false; this.showShowOffToast('List cleared ✓'); }

  // ── Helpers ───────────────────────────────────────────────────────────────
  fmtDT=(d:Date):string=>fmtDT(d);
  padToken(n:number):string { return String(n).padStart(3,'0'); }
  getItemNames(o:Order):string { return (o.items??[]).map((it:any)=>it.name).join(', '); }
  setTab(tab:AdminTab):void { this.activeTab=tab; }
  goHome():void { this.router.navigate(['/']); }
  logout():void { this.auth.logout(); this.router.navigate(['/admin/login']); }

  private async doSave(fn:()=>Promise<void>): Promise<void> {
    this.saving=true;
    try { await fn(); this.showToast(); }
    catch(e) { alert('Error saving. Check Supabase connection.'); console.error(e); }
    finally { this.saving=false; }
  }
  private showToast():void { this.saveSuccess=true; this.statusMsg='Saved ✓'; setTimeout(()=>{ this.saveSuccess=false; this.statusMsg=''; this.cdr.detectChanges(); },2500); }
  private showGlobalToast(name:string):void { this.globalToastName=name; clearTimeout(this.globalToastTimer); this.globalToastTimer=setTimeout(()=>{ this.globalToastName=''; this.cdr.detectChanges(); },6000); }
  private showOrdersToast(msg:string):void { this.ordersToast=msg; clearTimeout(this.ordersToastTimer); this.ordersToastTimer=setTimeout(()=>{ this.ordersToast=''; this.cdr.detectChanges(); },3500); }
  private showShowOffToast(msg:string):void { this.showoffToast=msg; clearTimeout(this.showoffToastTimer); this.showoffToastTimer=setTimeout(()=>{ this.showoffToast=''; this.cdr.detectChanges(); },3000); }
}