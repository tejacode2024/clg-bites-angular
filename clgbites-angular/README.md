# ClgBites - Angular

A complete Angular 17 conversion of the original Next.js ClgBites college food ordering app.

## 🍔 Project Structure (matches the VS Code file tree)

```
src/
└── app/
    ├── components/
    │   ├── app-header/          → app-header.component.ts
    │   ├── category-filters/    → category-filters.component.ts
    │   ├── floating-cart-bar/   → floating-cart-bar.component.ts
    │   ├── floating-emojis/     → floating-emojis.component.ts
    │   ├── menu-item-card/      → menu-item-card.component.ts
    │   ├── restaurant-card/     → restaurant-card.component.ts
    │   └── search-bar/          → search-bar.component.ts
    ├── pages/
    │   ├── cart/                → cart.component.ts
    │   ├── home/                → home.component.ts
    │   └── restaurant/          → restaurant.component.ts
    ├── services/
    │   ├── cart.service.ts      ← CartService (replaces cart-context.tsx)
    │   ├── restaurants.ts       ← All restaurant data + interfaces
    │   └── time-utils.ts        ← Time/ordering utility functions
    ├── app.component.ts
    ├── app.config.ts
    └── app.routes.ts
```

## 🔁 Migration Mapping (Next.js → Angular)

| Next.js (Original) | Angular (Converted) |
|---|---|
| `lib/restaurants.ts` | `services/restaurants.ts` |
| `lib/cart-context.tsx` | `services/cart.service.ts` (Angular Signal-based) |
| `lib/time-utils.ts` | `services/time-utils.ts` |
| `components/app-header.tsx` | `components/app-header/` |
| `components/search-bar.tsx` | `components/search-bar/` |
| `components/category-filters.tsx` | `components/category-filters/` |
| `components/restaurant-card.tsx` | `components/restaurant-card/` |
| `components/floating-cart-bar.tsx` | `components/floating-cart-bar/` |
| `components/floating-emojis.tsx` | `components/floating-emojis/` |
| `components/menu-item-card.tsx` | `components/menu-item-card/` |
| `app/page.tsx` | `pages/home/home.component.ts` |
| `app/cart/page.tsx` | `pages/cart/cart.component.ts` |
| `app/restaurant/[id]/page.tsx` | `pages/restaurant/restaurant.component.ts` |
| Next.js routing | `app.routes.ts` (Angular Router) |
| React Context | Angular Signals + Injectable Service |
| `framer-motion` | CSS animations |
| `next/image` | Native `<img>` with CSS |
| `next/navigation` | `@angular/router` |

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Build for production
ng build
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

## ✨ Features (all preserved from original)

- 🏠 **Home page** – restaurant grid with search and category filters
- 🍽️ **Restaurant page** – full menu with sticky category navigation
- 🛒 **Cart page** – multi-restaurant cart, order summary, WhatsApp checkout
- ⏰ **Time-based ordering** – no orders after 6 PM; Food Corner restrictions
- 📱 **Floating cart bar** – shows item count, total, delivery charges
- 💬 **WhatsApp checkout** – generates pre-filled message to `+91 7842960252`
- 🎨 **Exact same design** – all CSS variables, colors, and animations preserved
- 🍔 **Floating food emojis** – background decoration
- ❤️ **Favorite button** – per restaurant card
- ⭐ **Star ratings** – per restaurant

## 🔧 Angular 17 Features Used

- **Standalone Components** – no NgModule needed
- **Angular Signals** – reactive state in CartService
- **`@Input()` / `@Output()`** – component communication
- **Reactive Router** – `ActivatedRoute`, `Router`
- **OnInit / OnDestroy** – lifecycle hooks for timers
- **`computed()`** – derived signal values
