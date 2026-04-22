import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-wrapper">
      <svg class="search-icon" [class.focused]="isFocused"
        xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
        viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="text"
        placeholder="Search restaurants or dishes..."
        [(ngModel)]="value"
        (ngModelChange)="onChange.emit($event)"
        (focus)="isFocused = true"
        (blur)="isFocused = false"
        [class.focused]="isFocused"
        class="search-input"
      />
      <button *ngIf="value" class="clear-btn" (click)="clear()" aria-label="Clear search">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none"
          viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .search-wrapper {
      position: relative;
    }
    .search-icon {
      position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%);
      color: var(--muted-foreground); transition: color 0.2s;
    }
    .search-icon.focused { color: var(--primary); }
    .search-input {
      width: 100%; border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--card);
      padding: 0.75rem 2.5rem 0.75rem 2.5rem;
      font-size: 0.875rem; color: var(--card-foreground);
      outline: none; transition: all 0.2s;
    }
    .search-input.focused {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(232,84,108,0.2);
    }
    .clear-btn {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      border: none; background: transparent; cursor: pointer;
      color: var(--muted-foreground); padding: 0.25rem;
      border-radius: 50%;
    }
    .clear-btn:hover { background: var(--secondary); color: var(--foreground); }
  `]
})
export class SearchBarComponent {
  @Input() value = '';
  @Output() onChange = new EventEmitter<string>();
  isFocused = false;

  clear(): void {
    this.value = '';
    this.onChange.emit('');
  }
}