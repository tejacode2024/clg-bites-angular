import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, Coupon } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { restaurants } from '../../services/restaurants';

type Tab = 'overview' | 'restaurants' | 'items' | 'coupons';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-wrap">

      <!-- Sidebar -->
      <aside class="sidebar" [class.open]="sidebarOpen">
        <div class="sidebar-logo">
          <div>🍔</div>
          <div>
            <h1>ClgBites</h1>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav class="nav">
          <button class="nav-item" [class.active]="activeTab === 'overview'" (click)="setTab('overview'); sidebarOpen=false">
            <span class="nav-icon">📊</span> Overview
          </button>
          <button class="nav-item" [class.active]="activeTab === 'restaurants'" (click)="setTab('restaurants'); sidebarOpen=false">
            <span class="nav-icon">🏪</span> Restaurants
          </button>
          <button class="nav-item" [class.active]="activeTab === 'items'" (click)="setTab('items'); sidebarOpen=false">
            <span class="nav-icon">🍽️</span> Menu Items
          </button>
          <button class="nav-item" [class.active]="activeTab === 'coupons'" (click)="setTab('coupons'); sidebarOpen=false">
            <span class="nav-icon">🎟️</span> Coupons
          </button>
        </nav>

        <div class="sidebar-footer">
          <button class="view-site-btn" (click)="goHome()">← View Site</button>
          <button class="logout-btn" (click)="logout()">🚪 Logout</button>
        </div>
      </aside>

      <!-- Main content -->
      <div class="main">

        <!-- Top bar -->
        <header class="topbar">
          <button class="menu-toggle" (click)="sidebarOpen = !sidebarOpen">☰</button>
          <h2 class="page-title">{{ tabTitle }}</h2>
          <div class="topbar-right">
            <span class="status-dot" [class.green]="settings().orders_accepting" [class.red]="!settings().orders_accepting"></span>
            <span class="status-text">{{ settings().orders_accepting ? 'Orders Open' : 'Orders Closed' }}</span>
          </div>
        </header>

        <!-- Loading -->
        <div *ngIf="adminService.loading()" class="loading-state">
          <div class="spinner"></div>
          <p>Connecting to Firebase...</p>
        </div>

        <div *ngIf="!adminService.loading()" class="content">

          <!-- ── OVERVIEW TAB ── -->
          <div *ngIf="activeTab === 'overview'">

            <!-- Global orders toggle - BIG CARD -->
            <div class="orders-card" [class.open]="settings().orders_accepting" [class.closed]="!settings().orders_accepting">
              <div class="orders-card-left">
                <div class="orders-icon">{{ settings().orders_accepting ? '✅' : '🔴' }}</div>
                <div>
                  <h3>Order Acceptance</h3>
                  <p>{{ settings().orders_accepting ? 'Customers can place orders right now' : 'Orders are currently closed for customers' }}</p>
                </div>
              </div>
              <div class="toggle-wrap">
                <label class="toggle">
                  <input type="checkbox" [checked]="settings().orders_accepting"
                    (change)="toggleOrders($event)" [disabled]="saving">
                  <span class="slider"></span>
                </label>
                <span class="toggle-label">{{ settings().orders_accepting ? 'ON' : 'OFF' }}</span>
              </div>
            </div>

            <!-- Closed message editor -->
            <div *ngIf="!settings().orders_accepting" class="card" style="margin-top:1rem;">
              <h3 class="card-title">📢 Closed Message (shown to customers)</h3>
              <textarea
                [(ngModel)]="closedMessage"
                class="form-textarea"
                rows="3"
                placeholder="E.g. Orders closed for today. Back tomorrow at 10 AM!"
              ></textarea>
              <button class="btn-primary" (click)="saveClosedMessage()" [disabled]="saving">
                {{ saving ? 'Saving...' : '💾 Save Message' }}
              </button>
            </div>

            <!-- Stats row -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-num">{{ restaurants.length }}</div>
                <div class="stat-label">Total Restaurants</div>
              </div>
              <div class="stat-card warn">
                <div class="stat-num">{{ settings().unavailable_restaurants.length }}</div>
                <div class="stat-label">Unavailable Restaurants</div>
              </div>
              <div class="stat-card warn">
                <div class="stat-num">{{ totalUnavailableItems }}</div>
                <div class="stat-label">Unavailable Items</div>
              </div>
              <div class="stat-card green">
                <div class="stat-num">{{ activeCoupons }}</div>
                <div class="stat-label">Active Coupons</div>
              </div>
            </div>
          </div>

          <!-- ── RESTAURANTS TAB ── -->
          <div *ngIf="activeTab === 'restaurants'">
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
                  <label class="toggle">
                    <input type="checkbox"
                      [checked]="isRestAvailable(r.id)"
                      (change)="toggleRestaurant(r.id, $event)"
                      [disabled]="saving">
                    <span class="slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- ── ITEMS TAB ── -->
          <div *ngIf="activeTab === 'items'">
            <p class="tab-desc">Disable specific menu items per restaurant. Disabled items show as "Unavailable" to customers.</p>

            <!-- Restaurant selector -->
            <div class="select-wrap">
              <select [(ngModel)]="selectedRestaurantId" class="form-select">
                <option value="">— Select a restaurant —</option>
                <option *ngFor="let r of restaurants" [value]="r.id">{{ r.name }}</option>
              </select>
            </div>

            <!-- Menu items for selected restaurant -->
            <div *ngIf="selectedRestaurant" class="list" style="margin-top:1rem;">
              <div *ngFor="let cat of selectedRestaurant.menu">
                <div class="category-header">{{ cat.category }}</div>
                <div *ngFor="let item of cat.items" class="list-item item-row">
                  <div class="list-item-left">
                    <div>
                      <h4>{{ item.name }}</h4>
                      <p class="list-sub">₹{{ item.price }}</p>
                    </div>
                  </div>
                  <div class="list-item-right">
                    <span class="badge" [class.badge-green]="isItemAvail(selectedRestaurantId, item.name)" [class.badge-red]="!isItemAvail(selectedRestaurantId, item.name)">
                      {{ isItemAvail(selectedRestaurantId, item.name) ? 'Available' : 'Disabled' }}
                    </span>
                    <label class="toggle">
                      <input type="checkbox"
                        [checked]="isItemAvail(selectedRestaurantId, item.name)"
                        (change)="toggleItem(selectedRestaurantId, item.name, $event)"
                        [disabled]="saving">
                      <span class="slider"></span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div *ngIf="!selectedRestaurantId" class="empty-hint">
              👆 Select a restaurant above to manage its menu items
            </div>
          </div>

          <!-- ── COUPONS TAB ── -->
          <div *ngIf="activeTab === 'coupons'">
            <p class="tab-desc">Create coupon codes for discounts. Customers enter codes at checkout.</p>

            <!-- Add coupon form -->
            <div class="card">
              <h3 class="card-title">➕ {{ editingCoupon ? 'Edit Coupon' : 'Add New Coupon' }}</h3>
              <div class="coupon-form">
                <div class="form-row">
                  <div class="form-field">
                    <label>Coupon Code *</label>
                    <input type="text" [(ngModel)]="newCoupon.code" placeholder="e.g. SAVE20"
                      class="form-input" style="text-transform:uppercase;" (input)="newCoupon.code = newCoupon.code.toUpperCase()">
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
                    <label>{{ newCoupon.type === 'percent' ? 'Discount %' : 'Discount ₹' }} *</label>
                    <input type="number" [(ngModel)]="newCoupon.value" [placeholder]="newCoupon.type === 'percent' ? 'e.g. 20' : 'e.g. 50'"
                      class="form-input" min="1">
                  </div>
                  <div class="form-field">
                    <label>Min. Order Amount (₹)</label>
                    <input type="number" [(ngModel)]="newCoupon.min_order" placeholder="e.g. 200"
                      class="form-input" min="0">
                  </div>
                </div>
                <div class="form-field">
                  <label>Description (shown to customer)</label>
                  <input type="text" [(ngModel)]="newCoupon.description" placeholder="e.g. Get 20% off on orders above ₹200"
                    class="form-input">
                </div>
                <div class="form-check">
                  <input type="checkbox" [(ngModel)]="newCoupon.active" id="couponActive">
                  <label for="couponActive">Active (customers can use this coupon)</label>
                </div>
                <div class="form-actions">
                  <button class="btn-primary" (click)="saveCoupon()" [disabled]="saving">
                    {{ saving ? 'Saving...' : editingCoupon ? '💾 Update Coupon' : '➕ Add Coupon' }}
                  </button>
                  <button *ngIf="editingCoupon" class="btn-ghost" (click)="cancelEdit()">Cancel</button>
                </div>
              </div>
            </div>

            <!-- Coupons list -->
            <div class="list" style="margin-top:1.5rem;">
              <div *ngIf="adminService.coupons().length === 0" class="empty-hint">
                No coupons yet. Add your first coupon above!
              </div>
              <div *ngFor="let coupon of adminService.coupons()" class="coupon-item">
                <div class="coupon-left">
                  <div class="coupon-code">{{ coupon.code }}</div>
                  <div class="coupon-meta">
                    <span class="badge" [class.badge-green]="coupon.active" [class.badge-red]="!coupon.active">
                      {{ coupon.active ? 'Active' : 'Inactive' }}
                    </span>
                    <span class="coupon-detail">
                      {{ coupon.type === 'percent' ? coupon.value + '% off' : '₹' + coupon.value + ' off' }}
                    </span>
                    <span *ngIf="coupon.min_order > 0" class="coupon-detail">
                      Min: ₹{{ coupon.min_order }}
                    </span>
                  </div>
                  <p *ngIf="coupon.description" class="coupon-desc">{{ coupon.description }}</p>
                </div>
                <div class="coupon-actions">
                  <button class="btn-icon" title="Toggle active" (click)="toggleCouponActive(coupon)">
                    {{ coupon.active ? '🔴' : '🟢' }}
                  </button>
                  <button class="btn-icon" title="Edit" (click)="editCoupon(coupon)">✏️</button>
                  <button class="btn-icon danger" title="Delete" (click)="deleteCoupon(coupon)">🗑️</button>
                </div>
              </div>
            </div>
          </div>

        </div><!-- /content -->
      </div><!-- /main -->

      <!-- Save indicator -->
      <div *ngIf="saveSuccess" class="toast">✅ Saved successfully!</div>
    </div>
  `,
  styles: [`
    .admin-wrap { display: flex; min-height: 100vh; background: #f8fafc; font-family: 'Poppins', sans-serif; }

    /* ─── Sidebar ─── */
    .sidebar {
      width: 240px; background: white; border-right: 1px solid #e2e8f0;
      display: flex; flex-direction: column; position: fixed; height: 100vh;
      z-index: 40; transition: transform 0.3s;
    }
    @media (max-width: 768px) {
      .sidebar { transform: translateX(-100%); }
      .sidebar.open { transform: translateX(0); box-shadow: 4px 0 20px rgba(0,0,0,0.15); }
    }
    .sidebar-logo {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 1.25rem 1rem; border-bottom: 1px solid #e2e8f0;
      font-size: 1.5rem;
    }
    .sidebar-logo h1 { font-size: 1.1rem; font-weight: 800; color: var(--primary); margin: 0; }
    .sidebar-logo p { font-size: 0.7rem; color: var(--muted-foreground); margin: 0; }
    .nav { flex: 1; padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.75rem 1rem; border-radius: 0.75rem; border: none;
      background: none; cursor: pointer; font-size: 0.875rem;
      font-weight: 500; color: #64748b; text-align: left;
      transition: all 0.2s; font-family: 'Poppins', sans-serif;
    }
    .nav-item:hover { background: #f1f5f9; color: var(--primary); }
    .nav-item.active { background: rgba(232,84,108,0.1); color: var(--primary); font-weight: 600; }
    .nav-icon { font-size: 1.1rem; }
    .sidebar-footer { padding: 1rem; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.5rem; }
    .view-site-btn, .logout-btn {
      padding: 0.5rem; border-radius: 0.5rem; border: none; cursor: pointer;
      font-size: 0.8rem; font-family: 'Poppins', sans-serif; transition: all 0.2s;
    }
    .view-site-btn { background: #f1f5f9; color: #64748b; }
    .view-site-btn:hover { background: #e2e8f0; }
    .logout-btn { background: rgba(239,68,68,0.1); color: var(--destructive); }
    .logout-btn:hover { background: rgba(239,68,68,0.2); }

    /* ─── Main ─── */
    .main { flex: 1; margin-left: 240px; display: flex; flex-direction: column; }
    @media (max-width: 768px) { .main { margin-left: 0; } }

    .topbar {
      display: flex; align-items: center; gap: 1rem;
      background: white; border-bottom: 1px solid #e2e8f0;
      padding: 1rem 1.5rem; position: sticky; top: 0; z-index: 30;
    }
    .menu-toggle {
      display: none; border: none; background: none; font-size: 1.25rem; cursor: pointer;
    }
    @media (max-width: 768px) { .menu-toggle { display: block; } }
    .page-title { font-size: 1.125rem; font-weight: 700; flex: 1; margin: 0; color: #1e293b; }
    .topbar-right { display: flex; align-items: center; gap: 0.5rem; }
    .status-dot { width: 10px; height: 10px; border-radius: 50%; }
    .status-dot.green { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
    .status-dot.red { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
    .status-text { font-size: 0.8rem; font-weight: 600; color: #64748b; }

    .content { padding: 1.5rem; max-width: 900px; }

    /* ─── Loading ─── */
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: #64748b; }
    .spinner { width: 2.5rem; height: 2.5rem; border: 3px solid #e2e8f0; border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── Orders card ─── */
    .orders-card {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.5rem; border-radius: 1rem; gap: 1rem; flex-wrap: wrap;
    }
    .orders-card.open { background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 2px solid #86efac; }
    .orders-card.closed { background: linear-gradient(135deg, #fee2e2, #fecaca); border: 2px solid #fca5a5; }
    .orders-card-left { display: flex; align-items: center; gap: 1rem; }
    .orders-icon { font-size: 2rem; }
    .orders-card h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.25rem; color: #1e293b; }
    .orders-card p { font-size: 0.875rem; color: #475569; margin: 0; }
    .toggle-wrap { display: flex; align-items: center; gap: 0.75rem; }
    .toggle-label { font-size: 0.875rem; font-weight: 600; color: #1e293b; }

    /* Toggle switch */
    .toggle { position: relative; display: inline-block; width: 52px; height: 28px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute; cursor: pointer; inset: 0;
      background: #cbd5e1; border-radius: 28px; transition: 0.3s;
    }
    .slider::before {
      content: ''; position: absolute; width: 22px; height: 22px;
      left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s;
    }
    input:checked + .slider { background: var(--primary); }
    input:checked + .slider::before { transform: translateX(24px); }
    input:disabled + .slider { opacity: 0.5; cursor: not-allowed; }

    /* ─── Stats ─── */
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px,1fr)); gap: 1rem; margin-top: 1.5rem; }
    .stat-card { background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.07); border-left: 4px solid #e2e8f0; }
    .stat-card.warn { border-left-color: #f59e0b; }
    .stat-card.green { border-left-color: #22c55e; }
    .stat-num { font-size: 2rem; font-weight: 800; color: #1e293b; }
    .stat-label { font-size: 0.75rem; color: #64748b; font-weight: 500; }

    /* ─── Card ─── */
    .card { background: white; border-radius: 1rem; padding: 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .card-title { font-size: 1rem; font-weight: 700; margin: 0 0 1rem; color: #1e293b; }

    /* ─── List ─── */
    .list { background: white; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.07); overflow: hidden; }
    .list-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; gap: 1rem;
    }
    .list-item:last-child { border-bottom: none; }
    .list-item-left { display: flex; align-items: center; gap: 0.75rem; flex: 1; min-width: 0; }
    .list-item-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .rest-thumb { width: 3rem; height: 3rem; border-radius: 0.5rem; object-fit: cover; flex-shrink: 0; }
    .list-item h4 { font-size: 0.9rem; font-weight: 600; color: #1e293b; margin: 0; }
    .list-sub { font-size: 0.75rem; color: #64748b; margin: 0.125rem 0 0; }
    .category-header { padding: 0.5rem 1.25rem; background: #f8fafc; font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; }

    /* ─── Badges ─── */
    .badge { padding: 0.2rem 0.6rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #16a34a; }
    .badge-red { background: #fee2e2; color: #dc2626; }

    /* ─── Forms ─── */
    .tab-desc { font-size: 0.875rem; color: #64748b; margin-bottom: 1rem; }
    .select-wrap { background: white; border-radius: 1rem; padding: 1rem 1.25rem; box-shadow: 0 1px 3px rgba(0,0,0,0.07); }
    .form-select {
      width: 100%; padding: 0.625rem 0.875rem; border: 2px solid #e2e8f0;
      border-radius: 0.625rem; font-size: 0.875rem; outline: none;
      font-family: 'Poppins', sans-serif; background: white; cursor: pointer;
    }
    .form-select:focus { border-color: var(--primary); }
    .form-input {
      width: 100%; padding: 0.625rem 0.875rem; border: 2px solid #e2e8f0;
      border-radius: 0.625rem; font-size: 0.875rem; outline: none;
      font-family: 'Poppins', sans-serif; box-sizing: border-box;
    }
    .form-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(232,84,108,0.1); }
    .form-textarea {
      width: 100%; padding: 0.625rem 0.875rem; border: 2px solid #e2e8f0;
      border-radius: 0.625rem; font-size: 0.875rem; outline: none;
      font-family: 'Poppins', sans-serif; resize: vertical; box-sizing: border-box;
    }
    .form-textarea:focus { border-color: var(--primary); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
    .form-field { display: flex; flex-direction: column; gap: 0.375rem; }
    .form-field label { font-size: 0.8rem; font-weight: 600; color: #374151; }
    .form-check { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: #374151; cursor: pointer; }
    .form-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .coupon-form { display: flex; flex-direction: column; gap: 1rem; }

    /* Buttons */
    .btn-primary {
      padding: 0.625rem 1.5rem; border-radius: 0.625rem;
      background: var(--primary); color: white; border: none; cursor: pointer;
      font-size: 0.875rem; font-weight: 600; font-family: 'Poppins', sans-serif;
      transition: all 0.2s;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(232,84,108,0.3); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .btn-ghost {
      padding: 0.625rem 1.25rem; border-radius: 0.625rem;
      background: #f1f5f9; color: #64748b; border: none; cursor: pointer;
      font-size: 0.875rem; font-weight: 500; font-family: 'Poppins', sans-serif;
    }
    .btn-icon { border: none; background: none; cursor: pointer; font-size: 1.1rem; padding: 0.25rem; border-radius: 0.375rem; transition: background 0.2s; }
    .btn-icon:hover { background: #f1f5f9; }
    .btn-icon.danger:hover { background: #fee2e2; }

    /* ─── Coupons ─── */
    .coupon-item { display: flex; align-items: flex-start; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; gap: 1rem; }
    .coupon-item:last-child { border-bottom: none; }
    .coupon-left { flex: 1; }
    .coupon-code { font-size: 1.1rem; font-weight: 800; color: var(--primary); font-family: monospace; letter-spacing: 0.1em; }
    .coupon-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.375rem; }
    .coupon-detail { font-size: 0.75rem; color: #64748b; background: #f1f5f9; padding: 0.125rem 0.5rem; border-radius: 9999px; }
    .coupon-desc { font-size: 0.8rem; color: #94a3b8; margin-top: 0.25rem; }
    .coupon-actions { display: flex; align-items: center; gap: 0.25rem; flex-shrink: 0; }

    /* ─── Misc ─── */
    .empty-hint { padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.875rem; }
    .toast {
      position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 100;
      background: #1e293b; color: white; padding: 0.75rem 1.25rem;
      border-radius: 0.75rem; font-size: 0.875rem; font-weight: 500;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  `]
})
export class AdminDashboardComponent implements OnInit {
  readonly adminService = inject(AdminService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly restaurants = restaurants;
  activeTab: Tab = 'overview';
  sidebarOpen = false;
  saving = false;
  saveSuccess = false;
  closedMessage = '';
  selectedRestaurantId = '';
  editingCoupon: Coupon | null = null;

  newCoupon: Omit<Coupon, 'id'> = this.defaultCoupon();

  get settings() { return this.adminService.settings; }
  get tabTitle(): string {
    const map: Record<Tab, string> = { overview: '📊 Overview', restaurants: '🏪 Restaurants', items: '🍽️ Menu Items', coupons: '🎟️ Coupons' };
    return map[this.activeTab];
  }
  get selectedRestaurant() { return restaurants.find(r => r.id === this.selectedRestaurantId); }
  get totalUnavailableItems(): number {
    return Object.values(this.settings().unavailable_items).reduce((s, arr) => s + (arr as string[]).length, 0);
  }
  get activeCoupons(): number { return this.adminService.coupons().filter(c => c.active).length; }

  ngOnInit(): void {
    this.closedMessage = this.settings().orders_off_message;
  }

  setTab(tab: Tab): void { this.activeTab = tab; }

  // ─── Orders ───
  async toggleOrders(event: Event): Promise<void> {
    const checked = (event.target as HTMLInputElement).checked;
    await this.doSave(() => this.adminService.setOrdersAccepting(checked));
  }

  async saveClosedMessage(): Promise<void> {
    await this.doSave(() => this.adminService.setOrdersOffMessage(this.closedMessage));
  }

  // ─── Restaurants ───
  isRestAvailable(id: string): boolean { return this.adminService.isRestaurantAvailable(id); }

  async toggleRestaurant(id: string, event: Event): Promise<void> {
    const available = (event.target as HTMLInputElement).checked;
    await this.doSave(() => this.adminService.setRestaurantAvailability(id, available));
  }

  // ─── Items ───
  isItemAvail(restaurantId: string, itemName: string): boolean {
    return this.adminService.isItemAvailable(restaurantId, itemName);
  }

  async toggleItem(restaurantId: string, itemName: string, event: Event): Promise<void> {
    const available = (event.target as HTMLInputElement).checked;
    await this.doSave(() => this.adminService.setItemAvailability(restaurantId, itemName, available));
  }

  // ─── Coupons ───
  async saveCoupon(): Promise<void> {
    if (!this.newCoupon.code || !this.newCoupon.value) return;
    if (this.editingCoupon?.id) {
      await this.doSave(() => this.adminService.updateCoupon(this.editingCoupon!.id!, this.newCoupon));
    } else {
      await this.doSave(() => this.adminService.addCoupon(this.newCoupon));
    }
    this.newCoupon = this.defaultCoupon();
    this.editingCoupon = null;
  }

  editCoupon(coupon: Coupon): void {
    this.editingCoupon = coupon;
    this.newCoupon = { code: coupon.code, type: coupon.type, value: coupon.value, min_order: coupon.min_order, active: coupon.active, description: coupon.description };
  }

  cancelEdit(): void {
    this.editingCoupon = null;
    this.newCoupon = this.defaultCoupon();
  }

  async toggleCouponActive(coupon: Coupon): Promise<void> {
    await this.doSave(() => this.adminService.updateCoupon(coupon.id!, { active: !coupon.active }));
  }

  async deleteCoupon(coupon: Coupon): Promise<void> {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    await this.doSave(() => this.adminService.deleteCoupon(coupon.id!));
  }

  // ─── Helpers ───
  private async doSave(fn: () => Promise<void>): Promise<void> {
    this.saving = true;
    try {
      await fn();
      this.showToast();
    } catch (e) {
      alert('Error saving. Check Firebase connection.');
      console.error(e);
    } finally {
      this.saving = false;
    }
  }

  private showToast(): void {
    this.saveSuccess = true;
    setTimeout(() => (this.saveSuccess = false), 2500);
  }

  private defaultCoupon(): Omit<Coupon, 'id'> {
    return { code: '', type: 'percent', value: 0, min_order: 0, active: true, description: '' };
  }

  goHome(): void { this.router.navigate(['/']); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
