import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
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
      <button *ngIf="value" class="clear-btn" (click)="clear()" aria-label="Clear search">✕</button>
    </div>
  `,
  styles: [`
    .search-wrapper { position: relative; }
    .search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); font-size: 0.875rem; }
    .search-input {
      width: 100%; border-radius: 0.875rem; border: 1px solid #fde8c8;
      background: white; padding: 0.7rem 2.5rem 0.7rem 2.5rem;
      font-size: 0.875rem; color: #1f2937; outline: none;
      transition: all 0.2s; box-sizing: border-box; font-family: inherit;
    }
    .search-input.focused { border-color: #f97316; box-shadow: 0 0 0 2px rgba(249,115,22,0.15); }
    .clear-btn {
      position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
      border: none; background: #fff7ed; cursor: pointer; color: #9ca3af;
      padding: 0.2rem 0.4rem; border-radius: 0.375rem; font-size: 0.75rem;
    }
  `]
})
export class SearchBarComponent {
  @Input() value = '';
  @Output() onChange = new EventEmitter<string>();
  isFocused = false;
  clear(): void { this.value = ''; this.onChange.emit(''); }
}