import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { AdminService, Coupon } from '../../services/admin.service';
import { OrdersService } from '../../services/orders.service';
import { isOrderingAllowed } from '../../services/time-utils';
import { FloatingEmojisComponent } from '../../components/floating-emojis/floating-emojis.component';

const LOCATIONS = [
  { label: 'VIT-AP University', fee: 0 },
  { label: 'Ainavolu Village', fee: 10 },
];

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, FloatingEmojisComponent],
  template: `
    <!-- Empty cart -->
    <div *ngIf="items().length === 0" style="min-height:100vh;background:#fffbf5;">
      <app-floating-emojis></app-floating-emojis>
      <div class="cart-header">
        <button class="back-btn" (click)="goBack()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 class="cart-title">Your Order</h1>
        <span class="cart-count">0 items</span>
      </div>
      <div class="empty-state fade-slide-in">
        <div class="empty-icon-wrap">🛒</div>
        <h2 class="empty-title">Your cart is empty</h2>
        <p class="empty-sub">Add some delicious items from your favourite restaurants</p>
        <button class="browse-btn" (click)="goHome()">Browse Restaurants</button>
      </div>
    </div>

    <!-- Cart with items -->
    <div *ngIf="items().length > 0" style="position:relative;min-height:100vh;background:#fffbf5;padding-bottom:9rem;">
      <app-floating-emojis></app-floating-emojis>

      <!-- Header -->
      <div class="cart-header">
        <button class="back-btn" (click)="goBack()">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 class="cart-title">Your Order</h1>
        <span class="cart-count">{{ totalItems() }} item{{ totalItems() !== 1 ? 's' : '' }}</span>
      </div>

      <div style="padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem;">

        <!-- Orders closed banner -->
        <div *ngIf="!adminService.settings().orders_accepting" class="status-banner closed-banner">
          🔴 {{ adminService.settings().orders_off_message }}
        </div>

        <!-- Cart Items Card -->
        <div class="section-card">
          <div class="section-card-header">
            <span>🛒</span>
            <span class="section-card-title">Your Items</span>
          </div>
          <div *ngFor="let entry of itemsByRestaurantEntries">
            <div class="rest-label">🏪 {{ entry.restaurantName }}</div>
            <div *ngFor="let item of entry.items" class="cart-item-row">
              <div style="flex:1;min-width:0;">
                <p class="item-name">{{ item.name }}</p>
                <p class="item-unit">₹{{ item.price }} each</p>
              </div>
              <div class="item-controls">
                <button class="qty-btn minus-btn" (click)="updateQty(item.id, item.quantity - 1)">−</button>
                <span class="qty-num">{{ item.quantity }}</span>
                <button class="qty-btn plus-btn" (click)="updateQty(item.id, item.quantity + 1)">+</button>
              </div>
              <span class="item-total">₹{{ item.price * item.quantity }}</span>
            </div>
          </div>
          <div class="add-more-row">
            <button class="add-more-btn" (click)="goBack()">+ Add More Items</button>
          </div>
        </div>

        <!-- Customer Details Card -->
        <div class="section-card">
          <div class="section-card-header">
            <span>👤</span>
            <span class="section-card-title">Delivery Details</span>
            <span *ngIf="saved" style="margin-left:auto;color:#16a34a;font-size:0.85rem;">✅ Saved</span>
          </div>
          <div style="padding: 0.875rem; display: flex; flex-direction: column; gap: 0.625rem;">
            <div *ngIf="validationError" class="error-box">{{ validationError }}</div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
              <div>
                <label class="field-label">👤 Name</label>
                <input type="text" [(ngModel)]="name" (input)="saved = false" placeholder="Your name"
                  class="form-input" [class.input-error]="triedSubmit && !name.trim()" />
                <p *ngIf="triedSubmit && !name.trim()" class="field-error">Required</p>
              </div>
              <div>
                <label class="field-label">📱 Mobile</label>
                <input type="tel" [(ngModel)]="mobile" (input)="saved = false" placeholder="10-digit no."
                  maxlength="10" class="form-input" [class.input-error]="triedSubmit && mobile.trim().length < 10" />
                <p *ngIf="triedSubmit && mobile.trim().length < 10" class="field-error">10 digits</p>
              </div>
            </div>

            <div>
              <label class="field-label">📍 Delivery Location</label>
              <div style="position:relative;">
                <select [(ngModel)]="selectedLocation" (change)="saved = false" class="form-input" style="appearance:none;padding-right:2rem;">
                  <option *ngFor="let loc of locations" [value]="loc.label">
                    {{ loc.label }}{{ loc.fee > 0 ? ' (+₹' + loc.fee + ')' : ' (Free)' }}
                  </option>
                </select>
                <span style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);color:#9ca3af;pointer-events:none;">▾</span>
              </div>
              <p class="delivery-note" [class.fee-note]="deliveryFee > 0">
                {{ deliveryFee > 0 ? '📍 +₹' + deliveryFee + ' delivery fee' : '📍 Free delivery' }}
              </p>
            </div>

            <button *ngIf="!saved" class="save-btn" (click)="handleSave()">Save Details</button>
            <div *ngIf="saved" class="saved-pill">✅ Details Saved</div>
          </div>
        </div>

        <!-- Payment Mode Card -->
        <div class="section-card">
          <div class="section-card-header">
            <span>📦</span>
            <span class="section-card-title">Payment Mode</span>
          </div>
          <div style="padding: 0.75rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <button *ngFor="let mode of ['cod', 'prepay']"
              class="pay-option" [class.pay-active]="deliveryType === mode"
              (click)="setDeliveryType(mode)">
              <span class="pay-label">{{ mode === 'cod' ? 'Cash on Delivery' : 'Prepaid (UPI)' }}</span>
              <span class="pay-sub">{{ mode === 'cod' ? 'Pay on arrival' : 'Get QR from us' }}</span>
            </button>
          </div>
        </div>

        <!-- Coupon Card -->
        <div class="section-card">
          <div class="section-card-header">
            <span>🎟️</span>
            <span class="section-card-title">Coupon Code</span>
          </div>
          <div style="padding: 0.75rem;">
            <div class="coupon-row">
              <input type="text" [(ngModel)]="couponCode" placeholder="Enter coupon code"
                class="form-input coupon-input" [disabled]="!!appliedCoupon"
                (input)="couponCode = couponCode.toUpperCase()" />
              <button *ngIf="!appliedCoupon" class="apply-btn" (click)="applyCoupon()" [disabled]="!couponCode.trim()">Apply</button>
              <button *ngIf="appliedCoupon" class="remove-coupon-btn" (click)="removeCoupon()">✕</button>
            </div>
            <div *ngIf="couponError" class="coupon-error">❌ {{ couponError }}</div>
            <div *ngIf="appliedCoupon" class="coupon-success">
              ✅ <strong>{{ appliedCoupon.code }}</strong> applied! You save ₹{{ couponDiscount }}
            </div>
          </div>
        </div>

        <!-- Price Summary Card -->
        <div class="section-card">
          <div class="section-card-header">
            <span>💰</span>
            <span class="section-card-title">Price Summary</span>
          </div>
          <div style="padding: 0.875rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div class="summary-row"><span>Subtotal</span><span>₹{{ totalAmount() }}</span></div>
            <div class="summary-row">
              <span>Delivery</span>
              <span [style.color]="deliveryFee > 0 ? '#d97706' : '#16a34a'" style="font-weight:600;">{{ deliveryFee > 0 ? '₹' + deliveryFee : 'FREE' }}</span>
            </div>
            <div *ngIf="appliedCoupon" class="summary-row" style="color:#16a34a;">
              <span>Coupon ({{ appliedCoupon.code }})</span>
              <span>− ₹{{ couponDiscount }}</span>
            </div>
            <div class="summary-row"><span>GST</span><span style="color:#16a34a;">No GST</span></div>
            <div class="summary-total">
              <span>Total</span>
              <span style="color:#f97316;">₹{{ grandTotal }}</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Sticky checkout bar -->
      <div class="checkout-bar">
        <p *ngIf="!saved" class="pre-order-note">Please save your details before ordering</p>
        <button class="checkout-btn"
          [class.checkout-ready]="saved && items().length > 0"
          [disabled]="isSubmitting || items().length === 0"
          (click)="handleCheckout()">
          💬 {{ isSubmitting ? 'Placing Order...' : 'Order on WhatsApp · ₹' + grandTotal }}
        </button>
        <div *ngIf="!adminService.settings().orders_accepting && !orderingAllowed"
          style="margin-top:0.5rem;text-align:center;font-size:0.75rem;color:#ef4444;">
          🕐 Orders not accepted right now
        </div>
        <p style="margin-top:0.5rem;text-align:center;font-size:0.7rem;color:#9ca3af;">
          Order is saved to database & sent via WhatsApp
        </p>
      </div>
    </div>
  `,
  styles: [`
    /* Header */
    .cart-header { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 0.75rem; background: rgba(255,255,255,0.95); padding: 0.875rem 1rem; border-bottom: 1px solid #fde8c8; box-shadow: 0 2px 8px rgba(0,0,0,0.05); backdrop-filter: blur(12px); }
    .cart-title { font-size: 1.1rem; font-weight: 900; color: #d97706; margin: 0; }
    .cart-count { margin-left: auto; font-size: 0.8rem; color: #9ca3af; font-weight: 500; }
    .back-btn { border: none; background: #fff7ed; cursor: pointer; border-radius: 0.75rem; padding: 0.5rem; color: #f97316; display: flex; align-items: center; transition: transform 0.15s; }
    .back-btn:active { transform: scale(0.9); }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 1rem; }
    .empty-icon-wrap { font-size: 3.5rem; margin-bottom: 1rem; }
    .empty-title { font-size: 1.2rem; font-weight: 700; color: #374151; }
    .empty-sub { color: #9ca3af; font-size: 0.85rem; text-align: center; margin-top: 0.375rem; }
    .browse-btn { margin-top: 1.25rem; border-radius: 1rem; background: linear-gradient(135deg, #f97316, #ea580c); padding: 0.75rem 2rem; font-weight: 700; color: white; border: none; cursor: pointer; font-size: 0.9rem; }

    /* Section cards */
    .section-card { background: white; border-radius: 1rem; border: 1px solid #fde8c8; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
    .section-card-header { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: linear-gradient(135deg, #fff7ed, #fef3e2); border-bottom: 1px solid #fde8c8; }
    .section-card-title { font-weight: 700; font-size: 0.875rem; color: #d97706; }

    /* Cart items */
    .rest-label { font-size: 0.75rem; font-weight: 700; color: #9ca3af; padding: 0.5rem 1rem 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .cart-item-row { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; border-bottom: 1px solid #fef3e2; }
    .cart-item-row:last-of-type { border-bottom: none; }
    .item-name { font-size: 0.85rem; font-weight: 600; color: #1f2937; }
    .item-unit { font-size: 0.72rem; color: #9ca3af; margin-top: 0.1rem; }
    .item-controls { display: flex; align-items: center; gap: 0.375rem; }
    .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: none; cursor: pointer; font-size: 1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; transition: transform 0.15s; }
    .qty-btn:active { transform: scale(0.9); }
    .minus-btn { background: #fff7ed; border: 1.5px solid #fed7aa; color: #f97316; }
    .plus-btn { background: linear-gradient(135deg, #f97316, #ea580c); color: white; }
    .qty-num { font-weight: 900; color: #1f2937; font-size: 0.875rem; min-width: 20px; text-align: center; }
    .item-total { font-weight: 900; color: #f97316; font-size: 0.875rem; min-width: 3rem; text-align: right; flex-shrink: 0; }
    .add-more-row { padding: 0.75rem 1rem; border-top: 1px solid #fef3e2; }
    .add-more-btn { width: 100%; padding: 0.6rem; border-radius: 0.75rem; font-weight: 600; font-size: 0.85rem; color: #f97316; background: #fff7ed; border: 1.5px dashed #fed7aa; cursor: pointer; }

    /* Status */
    .status-banner { border-radius: 0.75rem; padding: 0.75rem 1rem; font-weight: 600; font-size: 0.875rem; text-align: center; }
    .closed-banner { background: #fee2e2; border: 1px solid #fca5a5; color: #dc2626; }

    /* Form fields */
    .field-label { display: block; font-size: 0.72rem; font-weight: 700; color: #9ca3af; margin-bottom: 0.375rem; }
    .form-input { width: 100%; padding: 0.625rem 0.875rem; border-radius: 0.75rem; border: 1px solid #e5e7eb; background: #f9fafb; font-size: 0.85rem; color: #1f2937; outline: none; font-family: inherit; transition: border-color 0.2s, box-shadow 0.2s; box-sizing: border-box; }
    .form-input:focus { border-color: #f97316; box-shadow: 0 0 0 2px rgba(249,115,22,0.15); }
    .input-error { border-color: #fca5a5 !important; }
    .field-error { font-size: 0.7rem; color: #ef4444; margin-top: 0.25rem; }
    .delivery-note { font-size: 0.75rem; font-weight: 600; margin-top: 0.3rem; color: #16a34a; }
    .fee-note { color: #d97706 !important; }
    .save-btn { width: 100%; padding: 0.7rem; border-radius: 0.875rem; font-weight: 700; font-size: 0.9rem; color: white; border: none; cursor: pointer; background: linear-gradient(135deg, #f97316, #ea580c); }
    .saved-pill { width: 100%; padding: 0.7rem; border-radius: 0.875rem; background: #f0fdf4; border: 1.5px solid #bbf7d0; color: #16a34a; font-weight: 700; font-size: 0.875rem; text-align: center; }
    .error-box { border-radius: 0.5rem; background: rgba(239,68,68,0.1); padding: 0.6rem 0.75rem; font-size: 0.8rem; color: #ef4444; }

    /* Payment */
    .pay-option { padding: 0.75rem; border-radius: 0.875rem; border: 2px solid #e5e7eb; background: #f9fafb; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.2rem; transition: all 0.2s; }
    .pay-option:active { transform: scale(0.96); }
    .pay-active { border-color: #f97316 !important; background: #fff7ed !important; }
    .pay-label { font-size: 0.78rem; font-weight: 800; color: #374151; }
    .pay-active .pay-label { color: #c2410c; }
    .pay-sub { font-size: 0.68rem; color: #9ca3af; }
    .pay-active .pay-sub { color: #f97316; }

    /* Coupon */
    .coupon-row { display: flex; gap: 0.5rem; }
    .coupon-input { flex: 1; }
    .apply-btn { padding: 0 1rem; border-radius: 0.75rem; background: linear-gradient(135deg, #f97316, #ea580c); color: white; border: none; cursor: pointer; font-weight: 700; font-size: 0.85rem; white-space: nowrap; }
    .apply-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .remove-coupon-btn { padding: 0 0.875rem; border-radius: 0.75rem; background: #fee2e2; color: #dc2626; border: none; cursor: pointer; font-weight: 700; }
    .coupon-error { margin-top: 0.4rem; font-size: 0.78rem; color: #ef4444; }
    .coupon-success { margin-top: 0.4rem; font-size: 0.78rem; color: #16a34a; background: #dcfce7; padding: 0.4rem 0.6rem; border-radius: 0.5rem; }

    /* Summary */
    .summary-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: #6b7280; }
    .summary-total { display: flex; justify-content: space-between; font-weight: 900; font-size: 1rem; color: #1f2937; padding-top: 0.5rem; margin-top: 0.25rem; border-top: 1px solid #fde8c8; }

    /* Checkout */
    .checkout-bar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; background: rgba(255,255,255,0.96); backdrop-filter: blur(12px); padding: 1rem 1rem 1.5rem; border-top: 1px solid #fde8c8; box-shadow: 0 -8px 24px rgba(0,0,0,0.08); }
    .pre-order-note { text-align: center; font-size: 0.75rem; color: #d97706; font-weight: 600; margin-bottom: 0.5rem; }
    .checkout-btn { width: 100%; border-radius: 1rem; padding: 1rem; font-size: 1rem; font-weight: 800; border: none; cursor: pointer; background: #d1d5db; color: #9ca3af; font-family: inherit; transition: all 0.2s; }
    .checkout-btn.checkout-ready { background: linear-gradient(135deg, #16a34a, #15803d); color: white; box-shadow: 0 8px 24px rgba(22,163,74,0.4); }
    .checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .checkout-btn:not(:disabled):active { transform: scale(0.98); }
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
  selectedLocation = LOCATIONS[0].label;
  saved = false;
  triedSubmit = false;
  private timerRef: any;

  readonly locations = LOCATIONS;
  readonly cartService = inject(CartService);
  readonly adminService = inject(AdminService);
  private readonly ordersService = inject(OrdersService);
  private readonly router = inject(Router);

  readonly items = this.cartService.items;
  readonly totalItems = this.cartService.totalItems;
  readonly totalAmount = this.cartService.totalAmount;
  readonly finalTotal = this.cartService.finalTotal;

  get deliveryFee(): number {
    return LOCATIONS.find(l => l.label === this.selectedLocation)?.fee ?? 0;
  }

  get couponDiscount(): number {
    if (!this.appliedCoupon) return 0;
    if (this.appliedCoupon.type === 'percent')
      return Math.round(this.totalAmount() * this.appliedCoupon.value / 100);
    return Math.min(this.appliedCoupon.value, this.totalAmount());
  }

  get grandTotal(): number {
    return Math.max(0, this.totalAmount() + this.deliveryFee - this.couponDiscount);
  }

  get isFormValid(): boolean {
    const adminOverride = this.adminService.settings().orders_accepting;
    const timeAllowed = this.orderingAllowed || adminOverride;
    return this.name.trim() !== '' && this.mobile.trim().length >= 10 && timeAllowed && adminOverride;
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

  handleSave(): void {
    this.triedSubmit = true;
    if (this.name.trim() && this.mobile.trim().length >= 10) this.saved = true;
  }

  applyCoupon(): void {
    this.couponError = '';
    const coupon = this.adminService.validateCoupon(this.couponCode, this.totalAmount());
    if (!coupon) { this.couponError = this.couponCode.trim() ? 'Invalid or expired coupon code.' : ''; return; }
    if (this.totalAmount() < coupon.min_order) {
      this.couponError = `Minimum order ₹${coupon.min_order} required.`; return;
    }
    this.appliedCoupon = coupon;
  }

  removeCoupon(): void { this.appliedCoupon = null; this.couponCode = ''; this.couponError = ''; }

  setDeliveryType(mode: string): void { this.deliveryType = mode as 'cod' | 'prepay'; }

  async handleCheckout(): Promise<void> {
    if (!this.saved) { this.triedSubmit = true; return; }
    const adminOverride = this.adminService.settings().orders_accepting;
    if (!adminOverride && !this.orderingAllowed) { this.validationError = 'Sorry, orders are not accepted right now.'; return; }
    if (!this.name.trim() || this.mobile.trim().length < 10) { this.validationError = 'Please fill all customer details.'; return; }
    if (this.items().length === 0) { this.validationError = 'Your cart is empty'; return; }

    this.validationError = '';
    this.isSubmitting = true;

    const allItems = this.itemsByRestaurantEntries.flatMap(entry =>
      entry.items.map(i => ({ name: i.name, qty: i.quantity, restaurant_name: entry.restaurantName }))
    );

    let tokenNumber: number;
    try { tokenNumber = await this.ordersService.fetchNextToken(); }
    catch { tokenNumber = Date.now() % 100000; }

    const savedOrder = await this.ordersService.placeOrder({
      customer_name: this.name.trim(),
      customer_phone: this.mobile.trim(),
      items: allItems,
      payment_mode: this.deliveryType === 'cod' ? 'cod' : 'prepaid',
      total: this.grandTotal,
      token_number: tokenNumber,
    }, tokenNumber);

    if (!savedOrder) { this.validationError = 'Failed to save order. Please try again.'; this.isSubmitting = false; return; }

    const grouped = this.cartService.getItemsByRestaurant();
    let orderDetails = '';
    Object.entries(grouped).forEach(([, rItems]) => {
      const rName = rItems[0]?.restaurantName || 'Unknown';
      const sub = rItems.reduce((s, i) => s + i.price * i.quantity, 0);
      orderDetails += `\n*${rName}*\n`;
      rItems.forEach(i => { orderDetails += `  - ${i.name} × ${i.quantity} = ₹${i.price * i.quantity}\n`; });
      orderDetails += `  Subtotal: ₹${sub}\n`;
    });

    const couponLine = this.appliedCoupon ? `\n*Coupon (${this.appliedCoupon.code}):* − ₹${this.couponDiscount}` : '';
    const delivLine = this.deliveryFee > 0 ? `\n*Delivery:* ₹${this.deliveryFee}` : `\n*Delivery:* FREE`;
    const tokenLine = `*Token: #${String(tokenNumber).padStart(3, '0')}*`;
    const locationLine = `*Location:* ${this.selectedLocation}`;

    const message = this.deliveryType === 'cod'
      ? `Hello, I would like to place an order.\n\n${tokenLine}\n\n*Customer Details:*\nName: ${this.name}\nMobile: ${this.mobile}\n${locationLine}\n\n*Order Details:*${orderDetails}${delivLine}${couponLine}\n*GST:* No GST\n\n*Final Total:* ₹${this.grandTotal}\n\nPlease confirm my order on COD`
      : `Hello, I would like to place an order.\n\n${tokenLine}\n\n*Customer Details:*\nName: ${this.name}\nMobile: ${this.mobile}\n${locationLine}\n\n*Order Details:*${orderDetails}${delivLine}${couponLine}\n*GST:* No GST\n\n*Final Total:* ₹${this.grandTotal}\n\nPlease confirm my order and send the payment QR.`;

    const waUrl = `https://wa.me/917842960252?text=${encodeURIComponent(message)}`;
    this.cartService.clearCart();

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) { window.location.href = waUrl; }
    else { const tab = window.open(waUrl, '_blank'); if (!tab) window.location.href = waUrl; this.router.navigate(['/']); }
  }
}