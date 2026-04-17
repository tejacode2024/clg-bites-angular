import { Component, OnInit, OnDestroy, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { AdminService, Coupon } from '../../services/admin.service';
import { OrdersService } from '../../services/orders.service';
import { isOrderingAllowed } from '../../services/time-utils';
import { FloatingEmojisComponent } from '../../components/floating-emojis/floating-emojis.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, FloatingEmojisComponent],
  template: `
    <!-- Empty cart -->
    <div *ngIf="items().length === 0" style="position:relative;min-height:100vh;background:var(--background);">
      <app-floating-emojis></app-floating-emojis>
      <div class="cart-header">
        <button class="back-btn" (click)="goBack()">←</button>
        <h1>Your Cart</h1>
      </div>
      <div class="empty-state fade-slide-in">
        <div class="empty-icon">🛍️</div>
        <h2>Your cart is empty</h2>
        <p>Add some delicious items from your favorite restaurants</p>
        <button class="browse-btn" (click)="goHome()">Browse Restaurants</button>
      </div>
    </div>

    <!-- Cart with items -->
    <div *ngIf="items().length > 0" style="position:relative;min-height:100vh;background:var(--background);padding-bottom:9rem;">
      <app-floating-emojis></app-floating-emojis>

      <div class="cart-header">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <button class="back-btn" (click)="goBack()">←</button>
          <h1>Your Cart</h1>
        </div>
        <button class="clear-btn" (click)="clearCart()">Clear All</button>
      </div>

      <div style="position:relative;z-index:10;padding:1rem;">

        <!-- Orders closed banner -->
        <div *ngIf="!adminService.settings().orders_accepting" class="closed-banner">
          🔴 {{ adminService.settings().orders_off_message }}
        </div>

        <!-- Restaurant count -->
        <div class="notice-bar" style="margin-bottom:1rem;">
          <p style="font-size:0.875rem;font-weight:500;color:var(--primary);">
            Ordering from {{ restaurantNames.length }} {{ restaurantNames.length === 1 ? 'restaurant' : 'restaurants' }}
          </p>
        </div>

        <!-- Cart items grouped by restaurant -->
        <div style="margin-bottom:1.5rem;display:flex;flex-direction:column;gap:1.5rem;">
          <div *ngFor="let entry of itemsByRestaurantEntries" class="rest-group">
            <div class="rest-group-header">
              🏪 <h3>{{ entry.restaurantName }}</h3>
            </div>
            <div>
              <div *ngFor="let item of entry.items" class="cart-item">
                <div style="flex:1;">
                  <h4>{{ item.name }}</h4>
                  <p style="font-size:0.875rem;color:var(--muted-foreground);">₹{{ item.price }} each</p>
                </div>
                <div style="display:flex;align-items:center;gap:0.75rem;">
                  <div class="qty-row">
                    <button class="qty-btn" (click)="updateQty(item.id, item.quantity - 1)">−</button>
                    <span class="qty-num">{{ item.quantity }}</span>
                    <button class="qty-btn" (click)="updateQty(item.id, item.quantity + 1)">+</button>
                  </div>
                  <span style="min-width:4rem;text-align:right;font-weight:600;color:var(--foreground);">₹{{ item.price * item.quantity }}</span>
                  <button class="remove-btn" (click)="removeItem(item.id)">🗑️</button>
                </div>
              </div>
            </div>
            <div class="rest-subtotal">
              <span style="font-size:0.875rem;color:var(--muted-foreground);">Subtotal</span>
              <span style="font-weight:600;color:var(--foreground);">₹{{ entry.subtotal }}</span>
            </div>
          </div>
        </div>

        <!-- Coupon section -->
        <div class="summary-card" style="margin-bottom:1.5rem;">
          <h3 class="card-title">🎟️ Coupon Code</h3>
          <div class="coupon-input-row">
            <input
              type="text"
              [(ngModel)]="couponCode"
              placeholder="Enter coupon code"
              class="form-input coupon-input"
              [disabled]="!!appliedCoupon"
              (input)="couponCode = couponCode.toUpperCase()"
            />
            <button *ngIf="!appliedCoupon" class="apply-btn" (click)="applyCoupon()" [disabled]="!couponCode.trim()">Apply</button>
            <button *ngIf="appliedCoupon" class="remove-coupon-btn" (click)="removeCoupon()">✕ Remove</button>
          </div>
          <div *ngIf="couponError" class="coupon-error">❌ {{ couponError }}</div>
          <div *ngIf="appliedCoupon" class="coupon-success">
            ✅ <strong>{{ appliedCoupon.code }}</strong> applied!
            {{ appliedCoupon.type === 'percent' ? appliedCoupon.value + '% off' : '₹' + appliedCoupon.value + ' off' }}
            — You save ₹{{ couponDiscount }}
          </div>
        </div>

        <!-- Price summary -->
        <div class="summary-card" style="margin-bottom:1.5rem;">
          <h3 class="card-title">Order Summary</h3>
          <div style="display:flex;flex-direction:column;gap:0.5rem;">
            <div class="summary-row">
              <span style="color:var(--muted-foreground);">Items Total ({{ totalItems() }} items)</span>
              <span>₹{{ totalAmount() }}</span>
            </div>
            <div class="summary-row">
              <span style="color:var(--muted-foreground);">Delivery Charges</span>
              <span style="font-weight:500;color:#16a34a;">🚚 Free</span>
            </div>
            <div *ngIf="appliedCoupon" class="summary-row">
              <span style="color:#16a34a;">Coupon Discount ({{ appliedCoupon.code }})</span>
              <span style="color:#16a34a;font-weight:600;">− ₹{{ couponDiscount }}</span>
            </div>
            <div class="summary-row">
              <span style="color:var(--muted-foreground);">GST</span>
              <span style="color:#16a34a;font-weight:500;">No GST</span>
            </div>
            <div style="border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.25rem;">
              <div class="summary-row">
                <span style="font-weight:600;color:var(--foreground);">Final Total</span>
                <span style="font-size:1.125rem;font-weight:700;color:var(--primary);">₹{{ grandTotal }}</span>
              </div>
            </div>
          </div>
          <div class="delivery-tip">
            <p style="font-size:0.875rem;font-weight:500;color:var(--primary);">
              🎉 Free Delivery on all orders!
            </p>
          </div>
        </div>

        <!-- Delivery Type -->
        <div class="summary-card" style="margin-bottom:1.5rem;">
          <h3 class="card-title">Delivery Type</h3>
          <div style="display:flex;gap:1.5rem;">
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.875rem;font-weight:500;">
              <input type="radio" name="deliveryType" value="prepay" [(ngModel)]="deliveryType"> PrePay
            </label>
            <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.875rem;font-weight:500;">
              <input type="radio" name="deliveryType" value="cod" [(ngModel)]="deliveryType"> COD (Cash on Delivery)
            </label>
          </div>
        </div>

        <!-- Customer Details -->
        <div class="summary-card" style="margin-bottom:1.5rem;">
          <h3 class="card-title">Customer Details</h3>
          <div *ngIf="validationError" class="error-box">{{ validationError }}</div>
          <div style="display:flex;flex-direction:column;gap:1rem;">
            <div>
              <label style="display:block;font-size:0.875rem;font-weight:500;color:var(--foreground);margin-bottom:0.375rem;">Name <span style="color:var(--destructive);">*</span></label>
              <input type="text" [(ngModel)]="name" placeholder="Enter your name" class="form-input" />
            </div>
            <div>
              <label style="display:block;font-size:0.875rem;font-weight:500;color:var(--foreground);margin-bottom:0.375rem;">Mobile Number <span style="color:var(--destructive);">*</span></label>
              <input type="tel" [(ngModel)]="mobile" placeholder="Enter your mobile number" class="form-input" />
            </div>
          </div>
        </div>

      </div>

      <!-- Checkout button -->
      <div class="checkout-bar">
        <button class="checkout-btn" [class.valid]="isFormValid" [disabled]="isSubmitting || !isFormValid" (click)="handleCheckout()">
          💬 {{ isSubmitting ? 'Placing Order...' : 'Checkout via WhatsApp — ₹' + grandTotal }}
        </button>
        <div *ngIf="!adminService.settings().orders_accepting && !orderingAllowed"
          style="margin-top:0.5rem;text-align:center;font-size:0.75rem;color:var(--destructive);">
          🕐 Orders not accepted right now
        </div>
        <p *ngIf="(orderingAllowed && adminService.settings().orders_accepting) && !isFormValid"
          style="margin-top:0.5rem;text-align:center;font-size:0.75rem;color:var(--destructive);">
          Please fill all required fields to checkout
        </p>
        <p style="margin-top:0.5rem;text-align:center;font-size:0.75rem;color:var(--muted-foreground);">
          Order is saved to database &amp; sent to restaurant via WhatsApp
        </p>
      </div>
    </div>
  `,
  styles: [`
    .cart-header { position:sticky; top:0; z-index:30; display:flex; align-items:center; justify-content:space-between; gap:0.75rem; background:rgba(255,255,255,0.95); padding:1rem; box-shadow:0 1px 2px rgba(0,0,0,0.05); backdrop-filter:blur(12px); }
    .cart-header h1 { font-size:1.125rem; font-weight:600; color:var(--foreground); margin:0; }
    .back-btn { border:none; background:transparent; cursor:pointer; border-radius:50%; padding:0.5rem; color:var(--foreground); font-size:1.1rem; transition:background 0.2s; }
    .back-btn:hover { background:var(--secondary); }
    .clear-btn { border:none; background:transparent; cursor:pointer; border-radius:0.5rem; padding:0.375rem 0.75rem; font-size:0.875rem; font-weight:500; color:var(--destructive); }
    .clear-btn:hover { background:rgba(239,68,68,0.1); }
    .closed-banner { background:#fee2e2; border:1px solid #fca5a5; border-radius:0.75rem; padding:0.75rem 1rem; color:#dc2626; font-weight:600; font-size:0.875rem; margin-bottom:1rem; }
    .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:5rem 1rem; }
    .empty-icon { font-size:4rem; margin-bottom:1rem; }
    .empty-state h2 { font-size:1.25rem; font-weight:600; color:var(--foreground); margin:0 0 0.5rem; }
    .empty-state p { color:var(--muted-foreground); text-align:center; }
    .browse-btn { margin-top:1.5rem; border-radius:0.75rem; background:var(--primary); padding:0.75rem 2rem; font-weight:600; color:white; border:none; cursor:pointer; font-family:'Poppins',sans-serif; }
    .notice-bar { border-radius:0.75rem; background:rgba(232,84,108,0.1); padding:0.75rem; }
    .rest-group { border-radius:0.75rem; background:var(--card); overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
    .rest-group-header { display:flex; align-items:center; gap:0.75rem; background:rgba(253,232,236,0.5); padding:0.75rem 1rem; border-bottom:1px solid var(--border); font-weight:600; color:var(--foreground); }
    .rest-group-header h3 { margin:0; font-size:0.95rem; }
    .cart-item { display:flex; align-items:center; justify-content:space-between; padding:1rem; border-bottom:1px solid var(--border); }
    .cart-item:last-child { border-bottom:none; }
    .cart-item h4 { font-weight:500; color:var(--card-foreground); margin:0 0 0.125rem; }
    .qty-row { display:flex; align-items:center; gap:0.25rem; border-radius:9999px; background:var(--secondary); padding:0 0.25rem; }
    .qty-btn { display:flex; align-items:center; justify-content:center; width:1.75rem; height:1.75rem; border-radius:50%; border:none; cursor:pointer; background:transparent; color:var(--foreground); font-size:1rem; }
    .qty-btn:hover { background:rgba(253,232,236,0.8); }
    .qty-num { min-width:1.25rem; text-align:center; font-size:0.875rem; font-weight:600; color:var(--foreground); }
    .remove-btn { border:none; background:transparent; cursor:pointer; border-radius:50%; padding:0.4rem; font-size:1rem; }
    .rest-subtotal { display:flex; justify-content:space-between; align-items:center; background:rgba(253,232,236,0.3); padding:0.75rem 1rem; border-top:1px solid var(--border); }
    .summary-card { border-radius:0.75rem; background:var(--card); padding:1rem; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
    .card-title { font-size:1rem; font-weight:700; margin:0 0 1rem; color:var(--foreground); }
    .summary-row { display:flex; justify-content:space-between; font-size:0.875rem; }
    .delivery-tip { margin-top:1rem; border-radius:0.5rem; background:rgba(232,84,108,0.1); padding:0.75rem; text-align:center; }
    .error-box { margin-bottom:1rem; border-radius:0.5rem; background:rgba(239,68,68,0.1); padding:0.75rem 1rem; font-size:0.875rem; color:var(--destructive); }
    .form-input { width:100%; padding:0.75rem 1rem; border:2px solid var(--input); border-radius:0.75rem; background:var(--background); color:var(--foreground); outline:none; font-size:0.875rem; font-family:'Poppins',sans-serif; box-sizing:border-box; transition:all 0.2s; }
    .form-input:focus { border-color:var(--primary); box-shadow:0 0 0 2px rgba(232,84,108,0.2); }
    /* Coupon */
    .coupon-input-row { display:flex; gap:0.75rem; }
    .coupon-input { flex:1; }
    .apply-btn { padding:0 1.25rem; border-radius:0.75rem; background:var(--primary); color:white; border:none; cursor:pointer; font-weight:600; font-family:'Poppins',sans-serif; white-space:nowrap; transition:all 0.2s; }
    .apply-btn:hover { opacity:0.9; }
    .apply-btn:disabled { opacity:0.5; cursor:not-allowed; }
    .remove-coupon-btn { padding:0 1rem; border-radius:0.75rem; background:#fee2e2; color:#dc2626; border:none; cursor:pointer; font-weight:600; font-family:'Poppins',sans-serif; white-space:nowrap; }
    .coupon-error { margin-top:0.5rem; font-size:0.8rem; color:var(--destructive); }
    .coupon-success { margin-top:0.5rem; font-size:0.8rem; color:#16a34a; background:#dcfce7; padding:0.5rem 0.75rem; border-radius:0.5rem; }
    /* Checkout */
    .checkout-bar { position:fixed; bottom:0; left:0; right:0; z-index:50; background:rgba(255,255,255,0.95); backdrop-filter:blur(12px); padding:1rem 1rem 1.5rem; box-shadow:0 -4px 20px rgba(0,0,0,0.1); }
    .checkout-btn { width:100%; border-radius:1rem; padding:1rem; font-size:1rem; font-weight:700; border:none; cursor:pointer; transition:all 0.2s; background:var(--muted); color:var(--muted-foreground); font-family:'Poppins',sans-serif; }
    .checkout-btn.valid { background:var(--primary); color:white; box-shadow:0 0 20px rgba(232,84,108,0.3); }
    .checkout-btn.valid:hover { transform:scale(1.02); }
    .checkout-btn:disabled { opacity:0.7; cursor:not-allowed; transform:none; }
  `]
})
export class CartComponent implements OnInit, OnDestroy {
  name = '';
  mobile = '';
  isSubmitting = false;
  validationError = '';
  orderingAllowed = true;
  couponCode = '';
  couponError = '';
  appliedCoupon: Coupon | null = null;
  deliveryType: 'prepay' | 'cod' = 'prepay';
  private timerRef: any;

  readonly cartService = inject(CartService);
  readonly adminService = inject(AdminService);
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);

  readonly items = this.cartService.items;
  readonly totalItems = this.cartService.totalItems;
  readonly totalAmount = this.cartService.totalAmount;
  readonly deliveryCharges = this.cartService.deliveryCharges;
  readonly finalTotal = this.cartService.finalTotal;

  get couponDiscount(): number {
    if (!this.appliedCoupon) return 0;
    if (this.appliedCoupon.type === 'percent') {
      return Math.round(this.totalAmount() * this.appliedCoupon.value / 100);
    }
    return Math.min(this.appliedCoupon.value, this.totalAmount());
  }

  get grandTotal(): number {
    return Math.max(0, this.finalTotal() - this.couponDiscount);
  }

  get isFormValid(): boolean {
    const adminOverride = this.adminService.settings().orders_accepting;
    const timeAllowed = this.orderingAllowed || adminOverride;
    return this.name.trim() !== '' && this.mobile.trim() !== '' && timeAllowed && adminOverride;
  }

  get itemsByRestaurantEntries() {
    const grouped = this.cartService.getItemsByRestaurant();
    return Object.entries(grouped).map(([restaurantId, items]) => ({
      restaurantId,
      restaurantName: items[0]?.restaurantName || 'Unknown',
      items,
      subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }));
  }

  get restaurantNames(): string[] { return this.cartService.getRestaurantNames(); }

  ngOnInit(): void { this.checkTime(); this.timerRef = setInterval(() => this.checkTime(), 60000); }
  ngOnDestroy(): void { if (this.timerRef) clearInterval(this.timerRef); }
  private checkTime(): void { this.orderingAllowed = isOrderingAllowed(); }

  goBack(): void { this.router.navigate(['/']); }
  goHome(): void { this.router.navigate(['/']); }
  clearCart(): void { this.cartService.clearCart(); }
  updateQty(itemId: string, qty: number): void { this.cartService.updateQuantity(itemId, qty); }
  removeItem(itemId: string): void { this.cartService.removeItem(itemId); }

  applyCoupon(): void {
    this.couponError = '';
    const coupon = this.adminService.validateCoupon(this.couponCode, this.totalAmount());
    if (!coupon) {
      this.couponError = this.couponCode.trim() ? 'Invalid or expired coupon code.' : '';
      return;
    }
    if (this.totalAmount() < coupon.min_order) {
      this.couponError = `Minimum order ₹${coupon.min_order} required for this coupon.`;
      return;
    }
    this.appliedCoupon = coupon;
  }

  removeCoupon(): void { this.appliedCoupon = null; this.couponCode = ''; this.couponError = ''; }

  async handleCheckout(): Promise<void> {
    // ── Guards ──────────────────────────────────────────────────────────────
    const adminOverride = this.adminService.settings().orders_accepting;
    if (!adminOverride && !this.orderingAllowed) {
      this.validationError = 'Sorry, orders are not accepted right now.';
      return;
    }
    if (!this.name.trim() || !this.mobile.trim()) {
      this.validationError = 'Please fill all required customer details before checkout.';
      return;
    }
    if (this.items().length === 0) { this.validationError = 'Your cart is empty'; return; }

    this.validationError = '';
    this.isSubmitting = true;

    // ── Build flat items list ───────────────────────────────────────────────
    const allItems = this.itemsByRestaurantEntries.flatMap(entry =>
      entry.items.map(i => ({
        name: i.name,
        qty: i.quantity,
        restaurant_name: entry.restaurantName,
      }))
    );

    // ── Build WhatsApp message text BEFORE any async work ──────────────────
    //
    // FIX #1 — iOS Safari and Android Chrome block window.open() when called
    // inside an async callback (after an `await`). The browser treats it as a
    // popup rather than a direct user-gesture response.
    //
    // Solution: call window.open() FIRST with a blank target to "claim" the
    // user-gesture window, THEN do all async work and fill in the final URL.
    // This keeps the original tab open and the new tab loads WhatsApp once
    // the order is saved.
    //
    // We pre-build a placeholder message so the tab opens immediately, then
    // replace the location after the DB call succeeds.

    // Open the WhatsApp tab right away (while user gesture is still "fresh")
    const waTab = window.open('', '_blank');

    // ── FIX #2 & #3 — Get token atomically from the DB ─────────────────────
    // This calls a Postgres function that atomically increments today's
    // counter and returns a unique token. Two simultaneous orders will NEVER
    // receive the same token.
    let tokenNumber: number;
    try {
      tokenNumber = await this.ordersService.fetchNextToken();
    } catch {
      tokenNumber = Date.now() % 100000; // extreme fallback, should never hit
    }

    // ── FIX #4 — Save to DB with id = token_number ─────────────────────────
    const savedOrder = await this.ordersService.placeOrder(
      {
        customer_name: this.name.trim(),
        customer_phone: this.mobile.trim(),
        items: allItems,
        payment_mode: this.deliveryType === 'cod' ? 'cod' : 'prepaid',
        total: this.grandTotal,
        token_number: tokenNumber,
      },
      tokenNumber
    );

    if (!savedOrder) {
      // Order failed — close the blank tab and show error
      waTab?.close();
      this.validationError = 'Failed to save order. Please try again.';
      this.isSubmitting = false;
      return;
    }

    // ── Build the full WhatsApp message ────────────────────────────────────
    const grouped = this.cartService.getItemsByRestaurant();
    let orderDetails = '';
    Object.entries(grouped).forEach(([, rItems]) => {
      const rName = rItems[0]?.restaurantName || 'Unknown';
      const sub = rItems.reduce((s, i) => s + i.price * i.quantity, 0);
      orderDetails += `\n*${rName}*\n`;
      rItems.forEach(i => { orderDetails += `  - ${i.name} × ${i.quantity} = ₹${i.price * i.quantity}\n`; });
      orderDetails += `  Subtotal: ₹${sub}\n`;
    });

    const couponLine = this.appliedCoupon
      ? `\n*Coupon (${this.appliedCoupon.code}):* − ₹${this.couponDiscount}`
      : '';
    const tokenLine = `*Token: #${String(tokenNumber).padStart(3, '0')}*`;

    const message = this.deliveryType === 'cod'
      ? `Hello, I would like to place an order.\n\n${tokenLine}\n\n*Customer Details:*\nName: ${this.name}\nMobile: ${this.mobile}\n\n*Order Details:*${orderDetails}\n*Items Total:* ₹${this.totalAmount()}\n*Delivery Charges:* FREE${couponLine}\n*GST:* No GST\n\n*Final Total:* ₹${this.grandTotal}\n\nPlease confirm my order on COD`
      : `Hello, I would like to place an order.\n\n${tokenLine}\n\n*Customer Details:*\nName: ${this.name}\nMobile: ${this.mobile}\n\n*Order Details:*${orderDetails}\n*Items Total:* ₹${this.totalAmount()}\n*Delivery Charges:* FREE${couponLine}\n*GST:* No GST\n\n*Final Total:* ₹${this.grandTotal}\n\nPlease confirm my order and send the payment QR.`;

    const waUrl = `https://wa.me/917842960252?text=${encodeURIComponent(message)}`;

    // ── FIX #1 (continued) — Navigate the already-open tab to WhatsApp ─────
    //
    // The tab was opened synchronously during the user gesture, so iOS/Android
    // will NOT block it. Now we simply redirect it to the real WhatsApp URL.
    if (waTab) {
      waTab.location.href = waUrl;
    } else {
      // Fallback: if the tab was blocked anyway (very rare), try direct open
      // and show a manual link.
      const fallback = window.open(waUrl, '_blank');
      if (!fallback) {
        // Last resort for heavily restricted browsers: navigate current tab
        window.location.href = waUrl;
        return;
      }
    }

    this.cartService.clearCart();
    this.router.navigate(['/']);
  }
}