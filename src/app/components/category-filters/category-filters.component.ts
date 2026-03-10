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
        class="filter-btn"
      >
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
      flex-shrink: 0;
      padding: 0.5rem 1rem; border-radius: 9999px;
      font-size: 0.875rem; font-weight: 500;
      border: none; cursor: pointer;
      background: var(--card); color: var(--muted-foreground);
      transition: all 0.2s;
    }
    .filter-btn:hover { background: var(--secondary); color: var(--card-foreground); }
    .filter-btn.active {
      background: var(--primary); color: var(--primary-foreground);
      box-shadow: 0 4px 6px -1px rgba(232,84,108,0.3);
    }
  `]
})
export class CategoryFiltersComponent {
  @Input() selected = 'All';
  @Output() onSelect = new EventEmitter<string>();
  readonly categories = categories;
}
