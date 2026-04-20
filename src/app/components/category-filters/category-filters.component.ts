import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { categories } from '../../services/restaurants';

@Component({
  selector: 'app-category-filters',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="filters-row scrollbar-hide" role="tablist">
      <button
        *ngFor="let category of categories"
        role="tab"
        [attr.aria-selected]="selected === category"
        (click)="onSelect.emit(category)"
        [class.active]="selected === category"
        class="filter-btn">
        {{ category }}
      </button>
    </div>
  `,
  styles: [`
    .filters-row {
      display: flex; gap: 0.5rem;
      overflow-x: auto; padding-bottom: 0.25rem;
      -ms-overflow-style: none; scrollbar-width: none;
    }
    .filters-row::-webkit-scrollbar { display: none; }
    .filter-btn {
      flex-shrink: 0; padding: 0.45rem 1rem; border-radius: 0.75rem;
      font-size: 0.8rem; font-weight: 700; border: 1px solid #fde8c8;
      cursor: pointer; background: white; color: #6b7280;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06); transition: all 0.2s;
    }
    .filter-btn:active { transform: scale(0.95); }
    .filter-btn.active {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: white; border-color: transparent;
      box-shadow: 0 4px 12px rgba(249,115,22,0.35);
    }
  `]
})
export class CategoryFiltersComponent {
  @Input() selected = 'All';
  @Output() onSelect = new EventEmitter<string>();
  readonly categories = categories;
}
