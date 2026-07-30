// ─── ClgBites Restaurant & Menu Data ─────────────────────────────────────────
// Each item has:
//   veg: true   → pure vegetarian
//   veg: false  → non-vegetarian
// Each category has:
//   isVeg: true / false  → category-level default (used for Veg Only filter)
//
// To add a new item:  { name: 'Item Name', veg: true/false, price: 000 }
// To add a new category: { category: 'Category Name', isVeg: true/false, items: [...] }
// ─────────────────────────────────────────────────────────────────────────────

export interface MenuItem {
  name: string;
  price: number;
  veg: boolean;           // ← THE key: true = veg, false = non-veg
  isStudentChoice?: boolean;
}

export interface MenuCategory {
  category: string;
  isVeg?: boolean;        // category-level flag (true=veg, false=non-veg)
  items: MenuItem[];
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  description: string;
  categories: string[];
  bestItem: string;
  todayOrders: number;
  menu: MenuCategory[];
}

// Category isVeg sets the default for all items in that category.
export const RESTAURANTS: Restaurant[] = [
  {
    id: 'food-corner', name: 'Food Corner',
    image: 'assets/images/food-corner.jpg',
    rating: 4, description: 'Your go-to spot for quick Chinese & Fast Foods',
    categories: ['Fast Food'], bestItem: 'Chicken Noodles', todayOrders: 0,
    menu: [
      { category: 'Noodles', isVeg: false, items: [
        { name: 'Veg Noodles',                veg: true,  price: 110 },
        { name: 'Veg Manchurian Noodles',     veg: true,  price: 130 },
        { name: 'Veg Paneer Noodles',         veg: true,  price: 140 },
        { name: 'Egg Noodles',                veg: false, price: 120 },
        { name: 'Double Egg Noodles',         veg: false, price: 130 },
        { name: 'Egg Manchurian Noodles',     veg: false, price: 130 },
        { name: 'Egg Paneer Noodles',         veg: false, price: 150 },
        { name: 'Chicken Noodles',            veg: false, price: 140 },
        { name: 'Double Egg Chicken Noodles', veg: false, price: 150 },
      ]},
      { category: 'Fried Rice', isVeg: false, items: [
        { name: 'Veg Fried Rice',                 veg: true,  price: 110 },
        { name: 'Veg Manchurian Fried Rice',      veg: true,  price: 120 },
        { name: 'Veg Paneer Fried Rice',          veg: true,  price: 140 },
        { name: 'Egg Fried Rice',                 veg: false, price: 120 },
        { name: 'Double Egg Fried Rice',          veg: false, price: 120 },
        { name: 'Egg Manchurian Fried Rice',      veg: false, price: 120 },
        { name: 'Egg Paneer Fried Rice',          veg: false, price: 150 },
        { name: 'Chicken Fried Rice',             veg: false, price: 140 },
        { name: 'Double Egg Chicken Fried Rice',  veg: false, price: 150 },
      ]},
      { category: 'Manchurian', isVeg: false, items: [
        { name: 'Veg Manchurian',        veg: true,  price: 110 },
        { name: 'Egg Manchurian',        veg: false, price: 120 },
        { name: 'Double Egg Manchurian', veg: false, price: 130 },
      ]},
      { category: 'Starters', isVeg: false, items: [
        { name: 'Chicken Manchurian',  veg: false, price: 200 },
        { name: 'Chicken Chilli',      veg: false, price: 200 },
        { name: '4P Chicken Lollipop', veg: false, price: 180 },
      ]},
    ],
  },
  {
    id: 'fruits', name: 'Fruit Market',
    image: 'assets/images/fruits.jpg',
    rating: 4, description: 'Fresh fruits available daily at market prices',
    categories: ['Fruits'], bestItem: 'Fresh Seasonal Fruits', todayOrders: 0,
    menu: [
      { category: 'Fresh Fruits', isVeg: true, items: [
        { name: 'Pomegranate 500g',  veg: true, price: 185 },
        { name: 'Pomegranate 1kg',   veg: true, price: 285 },
        { name: 'Apples 500g',       veg: true, price: 160 },
        { name: 'Apples 1kg',        veg: true, price: 285 },
        { name: 'Bananas 30g',       veg: true, price: 65  },
        { name: 'Bananas 1kg',       veg: true, price: 95  },
        { name: 'Guava 500g',        veg: true, price: 95  },
        { name: 'Guava 1kg',         veg: true, price: 155 },
        { name: 'Black Grapes 500g', veg: true, price: 95  },
        { name: 'Black Grapes 1kg',  veg: true, price: 155 },
        { name: 'Dragon Fruit 500g', veg: true, price: 115 },
        { name: 'Dragon Fruit 1kg',  veg: true, price: 195 },
        { name: 'Papaya 1kg',        veg: true, price: 95  },
      ]},
    ],
  },
  {
    id: 'A1Biryani', name: 'A1 Biryani',
    image: 'assets/images/A1.jpeg',
    rating: 5, description: 'Gaining popularity Biryanis',
    categories: ['Biryani'], bestItem: 'Dum Biryani', todayOrders: 0,
    menu: [
      { category: 'Biryani', isVeg: false, items: [
        { name: 'Dum Biryani',   veg: false, price: 200 },
        { name: 'Fry Biryani',   veg: false, price: 220 },
        { name: 'Mixed Biryani', veg: false, price: 230 },
      ]},
    ],
  },
  {
    id: 'hotel-bheemasena', name: 'Hotel Bheemasena',
    image: 'assets/images/hotel-bheemasena.jpg',
    rating: 5, description: 'Authentic restaurant-style veg and non-veg dishes',
    categories: ['Biryani', 'Fast Food', 'Veg Meals'], bestItem: 'Biryani, Starters & Curries', todayOrders: 0,
    menu: [
      { category: 'Veg Starters', isVeg: true, items: [
        { name: 'Veg Manchuria',     veg: true, price: 230 },
        { name: 'Chilli Mushroom',   veg: true, price: 250 },
        { name: 'Crispy Baby Corn',  veg: true, price: 250 },
        { name: 'Paneer 65',         veg: true, price: 300 },
        { name: 'Paneer Majestic',   veg: true, price: 310 },
      ]},
      { category: 'Non-Veg Starters', isVeg: false, items: [
        { name: 'Chilli Chicken',    veg: false, price: 310 },
        { name: 'Chicken Manchuria', veg: false, price: 310 },
        { name: 'Chicken 65',        veg: false, price: 310 },
        { name: 'Chicken Majestic',  veg: false, price: 310 },
      ]},
      { category: 'Veg Biryani', isVeg: true, items: [
        { name: 'Special Paneer Biryani',   veg: true, price: 310 },
        { name: 'Special Mushroom Biryani', veg: true, price: 310 },
        { name: 'Special Veg Biryani',      veg: true, price: 280 },
        { name: 'Ulavacharu Biryani',       veg: true, price: 290 },
        { name: 'Kaju Biryani',             veg: true, price: 310 },
        { name: 'Special Kaju Biryani',     veg: true, price: 330 },
      ]},
      { category: 'Non-Veg Biryani', isVeg: false, items: [
        { name: 'Special Egg Biryani',                          veg: false, price: 300 },
        { name: 'Chicken Dum Biryani',                          veg: false, price: 290 },
        { name: 'Chicken Fry Biryani',                          veg: false, price: 300 },
        { name: 'Special Chicken Biryani',                      veg: false, price: 320 },
        { name: 'Joint Biryani',                                veg: false, price: 330 },
        { name: 'Chicken Mughlai Biryani',                      veg: false, price: 330 },
        { name: 'Gongura Chicken Fry Biryani (Thursday Only)',  veg: false, price: 340 },
        { name: 'Chicken Lollipop Biryani',                     veg: false, price: 350 },
        { name: 'Kundan Biryani',                               veg: false, price: 380 },
      ]},
      { category: 'Single Biryani', isVeg: false, items: [
        { name: 'Single Dum Biryani',                  veg: false, price: 210 },
        { name: 'Single Fry Biryani',                  veg: false, price: 220 },
        { name: 'Single Paneer Biryani',               veg: true,  price: 220 },
        { name: 'Single Mushroom Biryani',             veg: true,  price: 220 },
        { name: 'Single Special Biryani',              veg: false, price: 240 },
        { name: 'Single Mughlai Biryani',              veg: false, price: 240 },
        { name: 'Mixed Biryani',                       veg: false, price: 240 },
        { name: 'Single Gongura Biryani (Thursday Only)', veg: false, price: 250 },
      ]},
      { category: 'Veg Curries', isVeg: true, items: [
        { name: 'Paneer Butter Masala',      veg: true, price: 300 },
        { name: 'Kaju Paneer Butter Masala', veg: true, price: 320 },
      ]},
      { category: 'Non-Veg Curries', isVeg: false, items: [
        { name: 'Egg Burji',      veg: false, price: 210 },
        { name: 'Chicken Curry',  veg: false, price: 290 },
        { name: 'Butter Chicken', veg: false, price: 310 },
      ]},
      { category: 'Breads', isVeg: true, items: [
        { name: 'Roti',       veg: true, price: 35 },
        { name: 'Butter Nan', veg: true, price: 55 },
      ]},
    ],
  },
];

// ─── Available top-level categories ──────────────────────────────────────────
export const categories = ['All', 'Biryani', 'Fast Food', 'Fruits', 'Veg Meals'];

// Backward-compatible alias used by admin dashboard
export const restaurants = RESTAURANTS;