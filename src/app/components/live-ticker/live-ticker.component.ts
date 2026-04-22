import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ActivityItem {
  name: string;
  block: string;
  item: string;
  restaurant: string;
  mins: number;
}

const ACTIVITY: ActivityItem[] = [
  { name: 'Ravi',   block: 'B-Block',  item: 'Mixed Biryani',           restaurant: 'Food Corner',           mins: 2  },
  { name: 'Priya',  block: 'A-Hostel', item: 'Mughalai Biryani',         restaurant: 'Amrutha',               mins: 4  },
  { name: 'Kiran',  block: 'C-Block',  item: 'Chicken Noodles',          restaurant: 'Food Corner',           mins: 6  },
  { name: 'Sai',    block: 'B-Hostel', item: 'Andhra Fry Piece Palao',   restaurant: 'Konaseema Kodi Palao',  mins: 9  },
  { name: 'Anjali', block: 'A-Block',  item: 'Masala Dosa',              restaurant: 'Tiffins',               mins: 11 },
  { name: 'Arjun',  block: 'C-Hostel', item: '3 Pulkhas + Egg Burji',    restaurant: 'Ruchi Pulkha Point',    mins: 14 },
  { name: 'Meena',  block: 'D-Block',  item: 'Chicken Lollipop Biryani', restaurant: 'Hotel Bheemasena',      mins: 7  },
  { name: 'Rahul',  block: 'B-Block',  item: 'Dum Biryani',              restaurant: 'Hotel Sindhu',          mins: 3  },
];

@Component({
  selector: 'app-live-ticker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ticker-wrap" *ngIf="current">
      <div class="ticker-avatar">{{ current.name[0] }}</div>
      <div class="ticker-body">
        <p class="ticker-main">
          <strong>{{ current.name }}</strong>
          <span class="ticker-block"> · {{ current.block }} </span>
          <span class="ticker-item">{{ current.item }}</span>
        </p>
        <p class="ticker-sub">
          <svg class="ticker-clock" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {{ current.mins }}m ago · {{ current.restaurant }}
        </p>
      </div>
      <span class="ticker-pulse"></span>
    </div>
  `,
  styles: [`
    .ticker-wrap {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-radius: 0.75rem;
      padding: 0.625rem 0.875rem;
      margin-top: 0.75rem;
      animation: tickerFade 0.4s ease;
    }
    @keyframes tickerFade {
      from { opacity: 0; transform: translateY(-4px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .ticker-avatar {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      background: #f97316;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .ticker-body { flex: 1; min-width: 0; }
    .ticker-main {
      font-size: 0.72rem;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ticker-block { color: #9ca3af; }
    .ticker-item  { color: #ea580c; font-weight: 700; }
    .ticker-sub {
      font-size: 0.65rem;
      color: #9ca3af;
      margin-top: 0.125rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .ticker-clock { color: #9ca3af; flex-shrink: 0; }
    .ticker-pulse {
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 50%;
      background: #f97316;
      flex-shrink: 0;
      animation: pulseAnim 1.5s ease-in-out infinite;
    }
    @keyframes pulseAnim {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%       { opacity: 0.4; transform: scale(0.8); }
    }
  `]
})
export class LiveTickerComponent implements OnInit, OnDestroy {
  current: ActivityItem = ACTIVITY[0];
  private idx = 0;
  private timer: any;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.idx = (this.idx + 1) % ACTIVITY.length;
      this.current = ACTIVITY[this.idx];
    }, 3500);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
