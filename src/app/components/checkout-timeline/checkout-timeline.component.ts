import { Component, OnInit, OnDestroy, inject, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../services/cart.service';
import { UserProfile } from '../../services/user.service';

@Component({
  selector: 'app-checkout-timeline',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="timeline-screen">
      <!-- Gradient header -->
      <div class="tl-header">
        <div class="tl-header-inner">
          <div class="tl-icon" [class.confirmed]="timeLeft() === 0">
            {{ timeLeft() > 0 ? '⏱️' : '✅' }}
          </div>
          <div>
            <p class="tl-header-label">{{ timeLeft() > 0 ? 'Confirming your order' : 'Order Confirmed!' }}</p>
            <p class="tl-header-count" *ngIf="timeLeft() > 0">{{ timeLeft() }}s remaining to cancel</p>
          </div>
        </div>
        <!-- Countdown bar -->
        <div *ngIf="timeLeft() > 0" class="countdown-bar-wrap">
          <div class="countdown-bar" [style.width]="((30 - timeLeft()) / 30 * 100) + '%'"></div>
        </div>
      </div>

      <!-- Order Preview Card -->
      <div class="preview-card">
        <div class="preview-header">
          <span class="preview-title">🧾 Order Preview</span>
          <span class="preview-total">₹{{ cartTotal + deliveryFee }}</span>
        </div>

        <div class="preview-items">
          <div *ngFor="let item of cart" class="preview-item">
            <span class="preview-item-dot" [class.nonveg]="isNonVeg(item.name)">
              {{ isNonVeg(item.name) ? '🔴' : '🟢' }}
            </span>
            <span class="preview-item-name">{{ item.name }}</span>
            <span class="preview-item-qty">×{{ item.quantity }}</span>
            <span class="preview-item-price">₹{{ item.price * item.quantity }}</span>
          </div>
        </div>

        <div class="preview-divider"></div>
        <div class="preview-row"><span>Subtotal</span><span>₹{{ cartTotal }}</span></div>
        <div class="preview-row"><span>Delivery</span>
          <span [class.free]="deliveryFee === 0">{{ deliveryFee === 0 ? 'FREE' : '₹' + deliveryFee }}</span>
        </div>
        <div class="preview-row total-row"><span>Total</span><span>₹{{ cartTotal + deliveryFee }}</span></div>
      </div>

      <!-- Delivery info -->
      <div class="info-row">
        <div class="info-box">
          <span class="info-icon">👤</span>
          <div>
            <p class="info-title">{{ user.name }}</p>
            <p class="info-sub">{{ user.phone }}</p>
          </div>
        </div>
        <div class="info-box">
          <span class="info-icon">📍</span>
          <div>
            <p class="info-title">{{ user.location }}</p>
            <p class="info-sub">{{ payMode === 'cod' ? 'Cash on Delivery' : 'Prepaid (UPI)' }}</p>
          </div>
        </div>
      </div>

      <!-- Warning -->
      <div class="warn-box" *ngIf="timeLeft() > 0">
        ⚠️ Once the timer ends, your order is sent to the restaurant and <strong>can't be cancelled</strong>.
      </div>

      <!-- Action buttons -->
      <div class="action-btns" *ngIf="timeLeft() > 0">
        <button class="cancel-btn" (click)="onCancel.emit()">
          ✕ Cancel Order
        </button>
        <button class="confirm-btn" (click)="placeNow()">
          Place Order Now →
        </button>
      </div>

      <div *ngIf="timeLeft() === 0 && !confirmed()" class="placing-msg">
        ⏳ Placing your order...
      </div>
    </div>
  `,
  styles: [`
    .timeline-screen {
      min-height: 100vh;
      background: linear-gradient(160deg, #ea580c 0%, #f97316 40%, #fff7ed 100%);
      padding: 0 0 6rem;
      font-family: inherit;
    }
    .tl-header {
      background: linear-gradient(135deg, #dc2626, #ea580c);
      padding: 2rem 1.25rem 1.25rem;
      color: white;
    }
    .tl-header.confirmed-bg {
      background: linear-gradient(135deg, #16a34a, #059669);
    }
    .tl-header-inner {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin-bottom: 0.875rem;
    }
    .tl-icon {
      font-size: 2.25rem;
      width: 3rem;
      text-align: center;
    }
    .tl-header-label {
      font-size: 1rem;
      font-weight: 800;
      margin: 0 0 0.2rem;
    }
    .tl-header-count {
      font-size: 0.82rem;
      opacity: 0.85;
      margin: 0;
      font-weight: 600;
    }
    .countdown-bar-wrap {
      height: 6px;
      background: rgba(255,255,255,0.25);
      border-radius: 99px;
      overflow: hidden;
    }
    .countdown-bar {
      height: 100%;
      background: white;
      border-radius: 99px;
      transition: width 1s linear;
    }
    .preview-card {
      background: white;
      margin: 1rem;
      border-radius: 1.25rem;
      border: 1px solid #fed7aa;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }
    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1rem;
      border-bottom: 1px solid #fff7ed;
    }
    .preview-title { font-weight: 800; font-size: 0.9rem; color: #111827; }
    .preview-total { font-weight: 900; font-size: 1rem; color: #ea580c; }
    .preview-items { padding: 0.5rem 0; }
    .preview-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 1rem;
    }
    .preview-item-name { flex: 1; font-size: 0.82rem; font-weight: 600; color: #374151; }
    .preview-item-qty { font-size: 0.78rem; color: #9ca3af; }
    .preview-item-price { font-size: 0.82rem; font-weight: 700; color: #111827; }
    .preview-divider { height: 1px; border-top: 1px dashed #fed7aa; margin: 0.5rem 1rem; }
    .preview-row {
      display: flex;
      justify-content: space-between;
      padding: 0.3rem 1rem;
      font-size: 0.82rem;
      color: #6b7280;
    }
    .preview-row span:last-child { font-weight: 700; color: #111827; }
    .preview-row .free { color: #16a34a !important; }
    .total-row {
      padding: 0.6rem 1rem;
      border-top: 1px solid #fff7ed;
    }
    .total-row span { font-weight: 900 !important; font-size: 0.95rem; }
    .total-row span:last-child { color: #ea580c !important; }
    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin: 0 1rem;
    }
    .info-box {
      background: white;
      border: 1px solid #fed7aa;
      border-radius: 1rem;
      padding: 0.75rem;
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
    }
    .info-icon { font-size: 1.1rem; }
    .info-title { font-size: 0.82rem; font-weight: 700; color: #111827; margin: 0 0 0.1rem; }
    .info-sub { font-size: 0.75rem; color: #9ca3af; margin: 0; }
    .warn-box {
      margin: 0.75rem 1rem;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 1rem;
      padding: 0.75rem 1rem;
      font-size: 0.8rem;
      color: #92400e;
      line-height: 1.5;
    }
    .action-btns {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      padding: 1rem 1rem 1.5rem;
      background: rgba(255,255,255,0.96);
      backdrop-filter: blur(12px);
      border-top: 1px solid #fed7aa;
    }
    .cancel-btn {
      padding: 1rem;
      border-radius: 1rem;
      border: 2px solid #fca5a5;
      background: white;
      color: #dc2626;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
    }
    .cancel-btn:active { transform: scale(0.97); }
    .confirm-btn {
      padding: 1rem;
      border-radius: 1rem;
      border: none;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: white;
      font-weight: 800;
      font-size: 0.9rem;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.15s;
      box-shadow: 0 4px 12px rgba(22,163,74,0.3);
    }
    .confirm-btn:active { transform: scale(0.97); }
    .placing-msg {
      text-align: center;
      padding: 2rem;
      font-size: 1rem;
      color: #6b7280;
      font-weight: 700;
    }
  `]
})
export class CheckoutTimelineComponent implements OnInit, OnDestroy {
  @Input() cart: CartItem[] = [];
  @Input() cartTotal = 0;
  @Input() deliveryFee = 0;
  @Input() user!: UserProfile;
  @Input() payMode: 'cod' | 'prepay' = 'cod';
  @Output() onCancel = new EventEmitter<void>();
  @Output() onConfirm = new EventEmitter<void>();

  timeLeft = signal(30);
  confirmed = signal(false);

  private timer: any;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      const t = this.timeLeft();
      if (t <= 1) {
        clearInterval(this.timer);
        this.timeLeft.set(0);
        if (!this.confirmed()) {
          this.confirmed.set(true);
          this.onConfirm.emit();
        }
      } else {
        this.timeLeft.set(t - 1);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  placeNow(): void {
    clearInterval(this.timer);
    this.timeLeft.set(0);
    if (!this.confirmed()) {
      this.confirmed.set(true);
      this.onConfirm.emit();
    }
  }

  isNonVeg(name: string): boolean {
    return /chicken|mutton|fish|prawn|egg|non.veg|lollipop|bone|wings|tandoori|apollo|kebab/i.test(name);
  }
}
