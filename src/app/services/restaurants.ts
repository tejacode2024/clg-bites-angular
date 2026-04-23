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
    id: 'fruits', name: 'Fruit Market',
    image: 'assets/images/fruits.jpg',
    rating: 4, description: 'Fresh fruits available daily at market prices',
    categories: ['Fruits'], bestItem: 'Fresh Seasonal Fruits', todayOrders: 0,
    menu: [
      { category: 'Fresh Fruits', isVeg: true, items: [
        { name: 'Bananas 1kg',         veg: true, price: 60  },
        { name: 'Bananas 1/2kg',       veg: true, price: 35  },
        { name: 'Oranges 1kg',         veg: true, price: 110 },
        { name: 'Oranges 1/2kg',       veg: true, price: 60  },
        { name: 'Pomegranate 1kg',     veg: true, price: 210 },
        { name: 'Pomegranate 1/2kg',   veg: true, price: 110 },
        { name: 'Green Grapes 1kg',    veg: true, price: 210 },
        { name: 'Green Grapes 1/2kg',  veg: true, price: 110 },
        { name: 'Green Grapes 250g',   veg: true, price: 60  },
        { name: 'Black Grapes 1kg',    veg: true, price: 360 },
        { name: 'Black Grapes 1/2kg',  veg: true, price: 185 },
        { name: 'Black Grapes 250g',   veg: true, price: 100 },
        { name: 'Apples 1kg',          veg: true, price: 210 },
        { name: 'Apples 1/2kg',        veg: true, price: 110 },
      ]},
    ],
  },
  {
    id: 'KonaseemaRuchulu', name: 'Konaseema Kodi Palao',
    image: 'assets/images/kp.jpeg',
    rating: 5, description: 'Bagara Rice + Fry Piece Curry',
    categories: ['Biryani'], bestItem: 'Andhra Fry Piece Palao', todayOrders: 0,
    menu: [
      { category: "Student's Choice", isVeg: false, items: [
        { name: 'Andhra Fry Piece Paloa', veg: false, price: 220, isStudentChoice: true },
      ]},
      { category: 'Biryani', isVeg: false, items: [
        { name: 'Andhra Fry Piece Palao', veg: false, price: 220 },
      ]},
    ],
  },
  {
    id: 'Amrutha', name: 'Amrutha (Earlier Nellore Ruchulu)',
    image: 'assets/images/amrutha.jpeg',
    rating: 5, description: 'Mughalai Biryani is Famous Here',
    categories: ['Biryani', 'Fast Food'], bestItem: 'Mughalai Biryani', todayOrders: 0,
    menu: [
      { category: "Student's Choice", isVeg: false, items: [
        { name: 'Mughalai Biryani',      veg: false, price: 239, isStudentChoice: true },
        { name: 'Tandoori Chicken Full', veg: false, price: 550, isStudentChoice: true },
        { name: 'Tandoori Chicken Half', veg: false, price: 300, isStudentChoice: true },
      ]},
      { category: 'Non Veg Biryani', isVeg: false, items: [
        { name: 'Dum Biryani',       veg: false, price: 199 },
        { name: 'Fry Piece Biryani', veg: false, price: 219 },
        { name: 'Mixed Biryani',     veg: false, price: 219 },
        { name: 'Mughalai Biryani',  veg: false, price: 239 },
      ]},
      { category: 'Veg Biryanis & Fried Rices', isVeg: true, items: [
        { name: 'Veg Biryani',      veg: true, price: 160 },
        { name: 'Sp Veg Biryani',   veg: true, price: 180 },
        { name: 'Paneer Biryani',   veg: true, price: 225 },
        { name: 'Veg Fried Rice',   veg: true, price: 165 },
        { name: 'Sp Veg Fried Rice',veg: true, price: 235 },
      ]},
      { category: 'Tandoori', isVeg: false, items: [
        { name: 'Tandoori Chicken Full',  veg: false, price: 550 },
        { name: 'Tandoori Chicken Half',  veg: false, price: 300 },
        { name: 'Kalmi Kabab (4pc)',       veg: false, price: 390 },
        { name: 'Chicken Tikka',          veg: false, price: 350 },
        { name: 'Chicken Seekh Kabab',    veg: false, price: 350 },
      ]},
    ],
  },
  {
    id: 'kelvin', name: 'Kelvin Fast Food',
    image: 'assets/images/kelvin.jpeg',
    rating: 5, description: 'Best for fast food',
    categories: ['Fast Food'], bestItem: 'Chicken Rice', todayOrders: 0,
    menu: [
      { category: "Student's Choice", isVeg: false, items: [
        { name: 'Chicken Rice', veg: false, price: 90, isStudentChoice: true },
      ]},
      { category: 'Rice & Noodles', isVeg: false, items: [
        { name: 'Double Chicken Rice',     veg: false, price: 110 },
        { name: 'Double Chicken Noodles',  veg: false, price: 110 },
        { name: 'Chicken Rice',            veg: false, price: 100  },
        { name: 'Chicken Noodles',         veg: false, price: 100 },
        { name: 'Egg Rice',                veg: false, price: 90  },
        { name: 'Egg Noodles',             veg: false, price: 90 },
        { name: 'Egg Manchurian Rice',     veg: false, price: 100  },
        { name: 'Egg Manchurian Noodles',  veg: false, price: 100 },
      ]},
      { category: 'Veg Rice & Noodles', isVeg: true, items: [
        { name: 'Veg Rice',    veg: true, price: 80 },
        { name: 'Veg Noodles', veg: true, price: 80 },
        { name: 'Veg Manchurian Rice', veg: true, price: 90 },
        { name: 'Veg Manchurian Noodles', veg: true, price: 90 },
      ]},
      { category: 'Starters', isVeg: false, items: [
        { name: 'Chilli Chicken',        veg: false, price: 150 },
        { name: 'Chicken Manchurian',    veg: false, price: 140 },
        { name: 'Double Egg Manchurian',        veg: false, price: 90 },
        { name: 'Double Egg Manchurian', veg: false, price: 100 },
      ]},
      { category: 'Veg Starters', isVeg: true, items: [
        { name: 'Veg Manchurian', veg: true, price: 80},
      ]},
    ],
  },
  {
    id: 'A1Biryani', name: 'A1 Biryani',
    image: 'assets/images/A1.jpeg',
    rating: 5, description: 'Gaining popularity Biryanis',
    categories: ['Biryani'], bestItem: 'Dum Biryani', todayOrders: 0,
    menu: [
      { category: "Student's Choice", isVeg: false, items: [
        { name: 'Mixed Biryani', veg: false, price: 200, isStudentChoice: true },
      ]},
      { category: 'Biryani', isVeg: false, items: [
        { name: 'Dum Biryani',   veg: false, price: 170 },
        { name: 'Fry Biryani',   veg: false, price: 190 },
        { name: 'Mixed Biryani', veg: false, price: 200 },
      ]},
    ],
  },
  {
    id: 'sindhu', name: 'Hotel Sindhu',
    image: 'assets/images/sindhu.jpg',
    rating: 5, description: 'Best Biryanis in Mandadam',
    categories: ['Biryani'], bestItem: 'Dum Biryani', todayOrders: 0,
    menu: [
      { category: "Student's Choice", isVeg: false, items: [
        { name: 'Dum Biryani', veg: false, price: 200, isStudentChoice: true },
      ]},
      { category: 'Biryani', isVeg: false, items: [
        { name: 'Dum Biryani',       veg: false, price: 200 },
        { name: 'Fry Biryani',       veg: false, price: 200 },
        { name: 'Mixed Biryani',     veg: false, price: 200 },
        { name: 'Fish Fry Biryani',  veg: false, price: 200 },
        { name: 'Prawns Biryani',    veg: false, price: 250 },
      ]},
      { category: 'Double Biryani', isVeg: false, items: [
        { name: 'Double Dum Biryani',       veg: false, price: 390 },
        { name: 'Double Fry Biryani',       veg: false, price: 390 },
        { name: 'Double Mixed Biryani',     veg: false, price: 390 },
        { name: 'Double Fish Fry Biryani',  veg: false, price: 390 },
      ]},
    ],
  },
  {
    id: 'cafe999', name: 'Cafe 999',
    image: 'assets/images/cafe999.jpeg',
    rating: 5, description: 'Food & Beverages',
    categories: ['Fast Food'], bestItem: 'Chicken Pizza', todayOrders: 0,
    menu: [
      { category: "Student's Choice", isVeg: false, items: [
        { name: 'Chicken Pizza',        veg: false, price: 189, isStudentChoice: true },
        { name: 'Sweet Corn Pizza',     veg: true,  price: 169, isStudentChoice: true },
        { name: 'Chicken Burger',       veg: false, price: 119, isStudentChoice: true },
        { name: 'Veg Burger',           veg: true,  price: 99,  isStudentChoice: true },
        { name: 'Chicken Wings (10pc)', veg: false, price: 239, isStudentChoice: true },
      ]},
      { category: 'Non Veg', isVeg: false, items: [
        { name: 'Chicken Sandwich',       veg: false, price: 149 },
        { name: 'Chicken Burger',         veg: false, price: 119 },
        { name: 'Chicken Pizza',          veg: false, price: 189 },
        { name: 'Chicken Wings (5pc)',    veg: false, price: 159 },
        { name: 'Chicken Wings (10pc)',   veg: false, price: 239 },
        { name: 'Chicken Lollipop (5pc)', veg: false, price: 209 },
        { name: 'Chicken Lollipop (10pc)',veg: false, price: 359 },
        { name: 'Chicken Momo Fried',     veg: false, price: 109 },
      ]},
      { category: 'Veg', isVeg: true, items: [
        { name: 'Corn Samosa (5pc)',    veg: true, price: 69  },
        { name: 'Veg Burger',          veg: true, price: 89  },
        { name: 'Sweet Corn Pizza',    veg: true, price: 169 },
        { name: 'Salted French Fries', veg: true, price: 99  },
        { name: 'Masala French Fries', veg: true, price: 109 },
        { name: 'Veg Momo Fried',      veg: true, price: 99  },
        { name: 'Paneer Momo Fried',   veg: true, price: 119 },
        { name: 'Veg Sandwich',        veg: true, price: 129 },
      ]},
    ],
  },
  {
    id: 'food-corner', name: 'Food Corner',
    image: 'assets/images/food-corner.jpg',
    rating: 4, description: 'Your go-to spot for quick Chinese & Fast Foods',
    categories: ['Fast Food'], bestItem: 'Chicken Noodles', todayOrders: 0,
    menu: [
      { category: "Student's Choice", isVeg: false, items: [
        { name: 'Veg Noodles',     veg: true,  price: 80,  isStudentChoice: true },
        { name: 'Egg Noodles',     veg: false, price: 90,  isStudentChoice: true },
        { name: 'Chicken Noodles', veg: false, price: 100, isStudentChoice: true },
      ]},
      { category: 'Veg Items', isVeg: true, items: [
        { name: 'Veg Noodles',    veg: true, price: 80 },
        { name: 'Veg Fried Rice', veg: true, price: 80 },
        { name: 'Veg Manchurian', veg: true, price: 80 },
      ]},
      { category: 'NV Noodles', isVeg: false, items: [
        { name: 'Egg Noodles',            veg: false, price: 90  },
        { name: 'Chicken Noodles',        veg: false, price: 100 },
        { name: 'Veg Manchurian Noodles', veg: false, price: 90  },
        { name: 'Egg Manchurian Noodles', veg: false, price: 100 },
      ]},
      { category: 'NV Fried Rice', isVeg: false, items: [
        { name: 'Egg Fried Rice',            veg: false, price: 90  },
        { name: 'Chicken Fried Rice',        veg: false, price: 100 },
        { name: 'Veg Manchurian Fried Rice', veg: false, price: 90  },
        { name: 'Egg Manchurian Fried Rice', veg: false, price: 100 },
      ]},
      { category: 'NV Starters', isVeg: false, items: [
        { name: 'Egg Manchurian',    veg: false, price: 90  },
        { name: 'Chicken Manchurian',veg: false, price: 170 },
        { name: 'Chilli Chicken',    veg: false, price: 170 },
        { name: '4P Chicken Lollipop',veg: false,price: 150 },
      ]},
    ],
  },
  {
    id: 'RoyalGrand', name: 'Hotel Royal Grand',
    image: 'assets/images/royalgrand.png',
    rating: 5, description: 'Lollipop Biryani is famous here',
    categories: ['Biryani'], bestItem: 'Lollipop Biryani', todayOrders: 0,
    menu: [
      { category: "Student's Choice", isVeg: false, items: [
        { name: 'Lollipop Biryani', veg: false, price: 269, isStudentChoice: true },
      ]},
      { category: 'Biryani', isVeg: false, items: [
        { name: 'Dum Biryani',      veg: false, price: 199 },
        { name: 'Fry Piece Biryani',veg: false, price: 219 },
        { name: 'Lollipop Biryani', veg: false, price: 269 },
        { name: 'Wing Biryani',     veg: false, price: 269 },
        { name: 'Mughalai Biryani', veg: false, price: 269 },
        { name: 'Tikka Biryani',    veg: false, price: 269 },
        { name: 'Sp Biryani',       veg: false, price: 269 },
      ]},
    ],
  },
  {
    id: 'hotel-bheemasena', name: 'Hotel Bheemasena',
    image: 'assets/images/hotel-bheemasena.jpg',
    rating: 5, description: 'Authentic restaurant-style veg and non-veg dishes',
    categories: ['Biryani', 'Fast Food', 'Veg Meals'], bestItem: 'Biryanis, Starters, Soups & Curries', todayOrders: 0,
    menu: [
      { category: 'Veg Biryanis', isVeg: true, items: [
        { name: 'Biryani Rice',         veg: true, price: 180 },
        { name: 'Veg Biryani',          veg: true, price: 240 },
        { name: 'Spl Veg Biryani',      veg: true, price: 260 },
        { name: 'Ulavacharu Biryani',   veg: true, price: 270 },
        { name: 'Kaju Biryani',         veg: true, price: 290 },
        { name: 'Spl Kaju Biryani',     veg: true, price: 310 },
        { name: 'Mushroom Biryani',     veg: true, price: 270 },
        { name: 'Spl Mushroom Biryani', veg: true, price: 290 },
        { name: 'Paneer Biryani',       veg: true, price: 270 },
        { name: 'Spl Paneer Biryani',   veg: true, price: 290 },
        { name: 'Paneer Tikka Biryani', veg: true, price: 310 },
        { name: 'Bheemasena Spl Biryani',veg: true,price: 310 },
      ]},
      { category: 'Non-Veg Biryanis', isVeg: false, items: [
        { name: 'Spl Egg Biryani',               veg: false, price: 280 },
        { name: 'Chicken Dum Biryani',           veg: false, price: 270 },
        { name: 'Chicken Fry Biryani',           veg: false, price: 280 },
        { name: 'Chicken Fry Roasted Biryani',   veg: false, price: 290 },
        { name: 'Spl Chicken Biryani',           veg: false, price: 300 },
        { name: 'Joint Biryani',                 veg: false, price: 310 },
        { name: 'Kalmi Biryani',                 veg: false, price: 320 },
        { name: 'Chicken Tikka Biryani',         veg: false, price: 320 },
        { name: 'Chicken Mughlai Biryani',       veg: false, price: 310 },
        { name: 'Ulavacharu Chicken Biryani',    veg: false, price: 320 },
        { name: 'Wings Biryani',                 veg: false, price: 310 },
        { name: 'Chicken Lollipop Biryani',      veg: false, price: 330 },
        { name: 'Kundan Biryani',                veg: false, price: 360 },
        { name: 'Nawab Biryani',                 veg: false, price: 370 },
        { name: 'Tandoori Chicken Biryani',      veg: false, price: 370 },
        { name: 'Oanpur Biryani',                veg: false, price: 400 },
        { name: 'Nalli Gosht',                   veg: false, price: 500 },
        { name: 'Mutton Fry Biryani',            veg: false, price: 400 },
        { name: 'Mutton Afgani Biryani',         veg: false, price: 400 },
        { name: 'Mutton Dum Biryani',            veg: false, price: 410 },
        { name: 'Mutton Keema Biryani',          veg: false, price: 480 },
        { name: 'Mutton Mughlai Biryani',        veg: false, price: 430 },
        { name: 'Prawns Biryani',                veg: false, price: 390 },
        { name: 'Spl Prawns Biryani',            veg: false, price: 410 },
        { name: 'Fish Biryani',                  veg: false, price: 390 },
        { name: 'Bheemasena Spl Non Veg Biryani',veg: false, price: 460 },
      ]},
      { category: 'Bucket Biryanis', isVeg: false, items: [
        { name: 'Chicken Dum Bucket Biryani', veg: false, price: 800  },
        { name: 'Fry Chicken Bucket Biryani', veg: false, price: 850  },
        { name: 'Spl Chicken Bucket Biryani', veg: false, price: 880  },
        { name: 'Wings Bucket Biryani',       veg: false, price: 890  },
        { name: 'Lollipop Bucket Biryani',    veg: false, price: 950  },
        { name: 'Kundan Bucket Biryani',      veg: false, price: 1150 },
        { name: 'Prawns Bucket Biryani',      veg: false, price: 1100 },
        { name: 'Fish Bucket Biryani',        veg: false, price: 1000 },
        { name: 'Mutton Bucket Biryani',      veg: false, price: 1200 },
      ]},
      { category: 'Mini Biryanis', isVeg: false, items: [
        { name: 'Mini Dum Biryani',      veg: false, price: 170 },
        { name: 'Mini Fry Biryani',      veg: false, price: 180 },
        { name: 'Mini Boneless Biryani', veg: false, price: 190 },
      ]},
      { category: 'Mini Veg Biryanis', isVeg: true, items: [
        { name: 'Mini Paneer Biryani',   veg: true, price: 190 },
        { name: 'Mini Mushroom Biryani', veg: true, price: 180 },
      ]},
      { category: 'Veg Starters', isVeg: true, items: [
        { name: 'Veg Manchuria',  veg: true, price: 210 },
        { name: 'Gobi Manchuria', veg: true, price: 210 },
      ]},
      { category: 'Non Veg Starters', isVeg: false, items: [
        { name: 'Chilli Chicken',          veg: false, price: 290 },
        { name: 'Chicken Manchuria',       veg: false, price: 290 },
        { name: 'Chicken 65',              veg: false, price: 290 },
        { name: 'Chicken Majestic',        veg: false, price: 290 },
        { name: 'Dragon Chicken',          veg: false, price: 300 },
        { name: 'Chicken 555',             veg: false, price: 290 },
        { name: 'Royal Chicken',           veg: false, price: 300 },
        { name: 'Chicken Lollipop',        veg: false, price: 310 },
        { name: 'Apollo Fish',             veg: false, price: 330 },
        { name: 'Chilli Fish',             veg: false, price: 340 },
        { name: 'Bheemasena Spl Non Veg',  veg: false, price: 360 },
        { name: 'Chicken Wings',           veg: false, price: 310 },
        { name: 'Basket Chicken',          veg: false, price: 320 },
        { name: 'Chicken Fry Bone',        veg: false, price: 270 },
        { name: 'Chicken Popcorn',         veg: false, price: 290 },
        { name: 'Chilli Egg',              veg: false, price: 250 },
        { name: 'Crispy Chicken',          veg: false, price: 310 },
        { name: 'Hong Kong Chicken',       veg: false, price: 300 },
        { name: 'Pepper Chicken',          veg: false, price: 320 },
        { name: 'Loose Prawns',            veg: false, price: 360 },
        { name: 'Chilli Prawn',            veg: false, price: 370 },
      ]},
      { category: 'Breads', isVeg: true, items: [
        { name: 'Pulka',        veg: true, price: 15 },
        { name: 'Butter Pulka', veg: true, price: 20 },
        { name: 'Roti',         veg: true, price: 25 },
        { name: 'Butter Roti',  veg: true, price: 30 },
        { name: 'Butter Naan',  veg: true, price: 45 },
        { name: 'Plain Naan',   veg: true, price: 35 },
        { name: 'Kulcha',       veg: true, price: 50 },
        { name: 'M/S Kulcha',   veg: true, price: 60 },
        { name: 'Methi Parota', veg: true, price: 60 },
        { name: 'Garlic Naan',  veg: true, price: 70 },
      ]},
      { category: 'Tandoori Starters', isVeg: false, items: [
        { name: 'Tandoori Chicken 1/2', veg: false, price: 300 },
        { name: 'Tandoori Chicken Full',veg: false, price: 580 },
        { name: 'Tangdi Kebab',         veg: false, price: 330 },
        { name: 'Chicken Tikka',        veg: false, price: 310 },
        { name: 'Malai Tikka',          veg: false, price: 340 },
        { name: 'Fish Tikka',           veg: false, price: 330 },
      ]},
      { category: 'Thali/Beverages', isVeg: true, items: [
        { name: 'Thali',              veg: true, price: 140 },
        { name: 'Thali Parcel',       veg: true, price: 160 },
        { name: 'Thali Parcel Single',veg: true, price: 130 },
        { name: 'Ragi Sangati',       veg: true, price: 110 },
        { name: 'Natukodi Curry',     veg: false,price: 350 },
        { name: 'White Rice',         veg: true, price: 80  },
        { name: 'Curd Rice',          veg: true, price: 90  },
        { name: 'Spl Curd Rice',      veg: true, price: 150 },
        { name: 'Water Bottle',       veg: true, price: 20  },
        { name: 'Soft Drink',         veg: true, price: 25  },
        { name: 'Butter Milk',        veg: true, price: 50  },
        { name: 'Lassi',              veg: true, price: 70  },
      ]},
    ],
  },
  {
    id: 'ruchi-pulkha-point', name: 'Ruchi Pulkha Point',
    image: 'assets/images/ruchi-pulkha.jpg',
    rating: 4, description: 'Best Pulkha & Egg Burji combos at budget prices',
    categories: ['Veg Meals'], bestItem: '3 Pulkha + Egg Burji Combo', todayOrders: 0,
    menu: [
      { category: "Student's Choice", isVeg: false, items: [
        { name: '3 Pulkhas + Egg Burji Combo', veg: false, price: 70, isStudentChoice: true },
      ]},
      { category: 'Non Veg Combos', isVeg: false, items: [
        { name: '1 Pulka',               veg: true,  price: 12 },
        { name: 'Only Egg Burji (Half)', veg: false, price: 35 },
        { name: 'Only Egg Burji (Full)', veg: false, price: 55 },
        { name: '3 Pulkas (2 Veg Curries)',veg: true, price: 60 },
        { name: '3 Pulkas + Chicken Curry',veg: false,price: 90 },
        { name: 'Single Egg Omelette',   veg: false, price: 25 },
        { name: 'Double Egg Omelette',   veg: false, price: 45 },
        { name: '2 Chapatis + 2 Veg Curries',veg: true,price: 60 },
      ]},
      { category: 'Veg Combos', isVeg: true, items: [
        { name: '1 Pulka',                   veg: true, price: 12 },
        { name: '3 Pulkas (2 Veg Curries)',  veg: true, price: 60 },
        { name: '2 Chapatis + 2 Veg Curries',veg: true, price: 60 },
      ]},
    ],
  },
  {
    id: 'tiffens', name: 'Tiffins',
    image: 'assets/images/tiffens.jpg',
    rating: 4, description: 'Choose from two or more outlets for South Indian breakfast',
    categories: ['Tiffins'], bestItem: 'Masala Dosa & Idli', todayOrders: 0,
    menu: [
      { category: 'Breakfast & Snacks', isVeg: true, items: [
        { name: 'Idli (4 pcs)',       veg: true, price: 55 },
        { name: 'Gare (4 pcs)',       veg: true, price: 55 },
        { name: 'Bajji (4 pcs)',      veg: true, price: 55 },
        { name: 'Mirchi Bajji (4 pcs)',veg: true,price: 55 },
        { name: 'Punugulu',           veg: true, price: 55 },
        { name: 'Poori (2 pcs)',      veg: true, price: 50 },
      ]},
      { category: 'Non Veg Dosa Corner', isVeg: false, items: [
        { name: 'Single Egg Dosa', veg: false, price: 60 },
        { name: 'Double Egg Dosa', veg: false, price: 75 },
      ]},
      { category: 'Veg Dosa Corner', isVeg: true, items: [
        { name: 'Masala Dosa', veg: true, price: 65 },
        { name: 'Onion Dosa',  veg: true, price: 60 },
      ]},
      { category: 'Tawa Items', isVeg: true, items: [
        { name: 'Chapati', veg: true, price: 60 },
        { name: 'Parotha', veg: true, price: 60 },
      ]},
    ],
  },
];

// ─── Available top-level categories ──────────────────────────────────────────
export const categories = ['All', 'Biryani', 'Fast Food', 'Tiffins', 'Fruits', 'Veg Meals'];

// Backward-compatible alias used by admin dashboard
export const restaurants = RESTAURANTS;