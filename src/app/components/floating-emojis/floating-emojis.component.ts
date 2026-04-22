import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface EmojiItem {
  id: number;
  emoji: string;
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
}

@Component({
  selector: 'app-floating-emojis',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="pointer-events-none"
      style="position: fixed; inset: 0; overflow: hidden; z-index: 0;"
      aria-hidden="true"
    >
      <span
        *ngFor="let item of emojis"
        class="select-none"
        style="position: absolute; opacity: 0.06;"
        [style.left]="item.left + '%'"
        [style.top]="item.top + '%'"
        [style.font-size]="item.size + 'px'"
        [style.animation]="'floatEmoji ' + item.duration + 's ease-in-out ' + item.delay + 's infinite'"
      >{{ item.emoji }}</span>
    </div>
  `
})
export class FloatingEmojisComponent implements OnInit {
  emojis: EmojiItem[] = [];
  private readonly foodEmojis = ['🍔', '🍕', '🍟', '☕', '🍜', '🍗', '🥪'];

  ngOnInit(): void {
    this.emojis = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      emoji: this.foodEmojis[i % this.foodEmojis.length],
      left: Math.random() * 90 + 5,
      top: Math.random() * 90 + 5,
      size: Math.random() * 24 + 20,
      delay: Math.random() * 5,
      duration: Math.random() * 8 + 12,
    }));
  }
}