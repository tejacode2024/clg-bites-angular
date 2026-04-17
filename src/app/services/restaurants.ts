export interface MenuItem {
  name: string;
  price: number;
  isStudentChoice?: boolean;
  
}

export interface MenuCategory {
  category: string;
  items: MenuItem[];
  isVeg?: boolean;
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  description: string;
  categories: string[];
  bestItem: string;
  menu: MenuCategory[];
}

export const restaurants: Restaurant[] = [
  {
    id: 'fruits',
    name: 'Fruit Market',
    image: 'assets/images/fruits.jpg',
    rating: 4,
    description: 'Fresh fruits available daily at market prices',
    categories: ['Fruits'],
    bestItem: 'Fresh Seasonal Fruits',
    menu: [
      {
        category: 'Fresh Fruits', isVeg: true ,
        items: [
          { name: 'Bananas 1kg', price: 60 },
          { name: 'Bananas 1/2kg', price: 35 },
          { name: 'Oranges 1kg', price: 110 },
          { name: 'Oranges 1/2kg', price: 60 },
          { name: 'Pomegranate 1kg', price: 210 },
          { name: 'Pomegranate 1/2kg', price: 110 },
          { name: 'Green Grapes 1kg', price: 210 },
          { name: 'Green Grapes 1/2kg', price: 110 },
          { name: 'Green Grapes 250g', price: 60 },
          { name: 'Black Grapes 1kg', price: 360 },
          { name: 'Black Grapes 1/2kg', price: 185 },
          { name: 'Black Grapes 250g', price: 100 },
          { name: 'Apples 1kg', price: 210 },
          { name: 'Apples 1/2kg', price: 110 },
        ],
      },
    ],
  },
  // {
  //   id: 'haleem',
  //   name: 'Haleem',
  //   image: 'assets/images/haleem.jpg',
  //   rating: 5,
  //   description: 'Slow-cooked by tradition, seasoned with love, and perfected by time.',
  //   categories: ['Haleem'],
  //   bestItem: 'Mutton Haleem',
  //   menu: [
  //     {
  //       category: "Student's Choice",isVeg : false,
  //       items: [
  //         { name: 'Mutton Haleem (1/4 kg)', price: 210, isStudentChoice: true },
  //       ],
  //     },
  //     {
  //       category: "Haleem",isVeg : false,
  //       items: [
  //         { name: 'Mutton Haleem(1/4 kg)', price: 210},
  //         { name: 'Mutton Haleem(1/2 kg)', price: 360},
  //         { name: 'Mutton Haleem(1 kg)', price: 710},
  //         // { name: 'Chicken Haleem (1/4 kg)', price: 200},
  //         // { name: 'Chicken Haleem (1/2 kg)', price: 200},
  //         // { name: 'Chicken Haleem (1 kg)', price: 200},
  //       ],
  //     },
  //   ]
  // },
    {
    id: 'KonaseemaRuchulu',
    name: 'Konaseema Kodi Palao',
    image: 'assets/images/kp.jpeg',
    rating: 5,
    description: 'Bagara Rice + Fry Piece Curry',
    categories: ['Biryani'],
    bestItem: 'Andhra Fry Piece Palao',
    menu: [
      {
        category: "Student's Choice",isVeg : false,
        items: [
          { name: 'Andhra Fry Piece Paloa', price: 220, isStudentChoice: true },
        ],
      },
      {
        category: "Biryani",isVeg : false,
        items: [
          { name: 'Andhra Fry Piece Palao', price: 220},
          // { name: 'Fry Biryani', price: 200},
          // { name: 'Mixed Biryani', price: 200},
          // { name: 'Fish Fry Biryani', price: 200},
          // { name: 'Prawns Biryani', price: 250},
          //{ name: 'Mutton Biryani', price: 710},
          // { name: 'Chicken Haleem (1/4 kg)', price: 200},
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },
      // {
      //   category: "Double Biryani",isVeg : false,
      //   items: [
      //     { name: 'Double Dum Biryani', price: 390},
      //     { name: 'Double Fry Biryani', price: 390},
      //     { name: 'Double Mixed Biryani', price: 390},
      //     { name: 'Double Fish Fry Biryani', price: 390},
      //     //{ name: 'Prawns Biryani', price: 550},
      //     //{ name: 'Mutton Biryani', price: 550},
      //     // { name: 'Chicken Haleem (1/4 kg)', price: 200},
      //     // { name: 'Chicken Haleem (1/2 kg)', price: 200},
      //     // { name: 'Chicken Haleem (1 kg)', price: 200},
      //   ],
      // },
    ]
  },
  {
    id: 'Amrutha',
    name: 'Amrutha (Earlier Nellore Ruchulu)',
    image: 'assets/images/amrutha.jpeg',
    rating: 5,
    
    description: 'Mughalai Birynai is Famous Here',
    categories: ['Biryani'],
    bestItem: 'Mughalai Biryani',
    menu: [
      {
        category: "Student's Choice",isVeg : false,
        items: [
          { name: 'Mughalai Biryani', price: 239, isStudentChoice: true },
          { name: 'Tandoori Chicken Full', price: 550 , isStudentChoice: true},
          { name: 'Tandoori Chicken Half', price: 300 , isStudentChoice: true},
          ],
      },
      {
        category: "Non Veg Biryani",isVeg : false,
        items: [
          { name: 'Dum Biryani', price: 199},
          { name: 'Fry Piece Biryani', price: 219},
          { name: 'Mixed Biryani', price: 219},
          { name: 'Mughalai Biryani', price: 239},
          
        
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },
      // {
      //   category: "Amrutha Student combo",isVeg : false,
      //   items: [
      //     { name: '3 Members Rice + Chicken Curry + Half Starter + 3 Pulkhas + 3 Eggs', price: 999},
          
      //   ],
      // },
      {
        category: "veg Biryanis & Fried Rices",isVeg : true,
        items: [
          { name: 'Veg Biryani', price: 160},
          { name: 'sp Veg Biryani', price: 180},
          { name: 'Panner Biryani', price: 225},
          { name: 'Veg Fried Rice', price: 165},
          { name: 'Sp Veg Fried Rice', price: 235},
        
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },
      {
        category: "Tandoori",isVeg : true,
        items: [
          { name: 'Tandoori Chicken Full', price: 550},
          { name: 'Tandoori Chicken Half', price: 300},
          { name: 'Kalmi Kabab(4pc)', price: 390},
          { name: 'Chicken Tikka', price: 350},
          { name: 'Chicken Seekh kabab', price: 350},
          //{ name: 'Sp Veg Fried Rice', price: 235},
        
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },

    ]
  },
  {
    id: 'A1Biryani',
    name: 'A1 Biryani',
    image: 'assets/images/A1.jpeg',
    rating: 5,
    description: 'Gaining popularity Briyanis',
    categories: ['Biryani'],
    bestItem: 'Dum Biryani',
    menu: [
      {
        category: "Student's Choice",isVeg : false,
        items: [
          { name: 'Dum Biryani', price: 200, isStudentChoice: true },
        ],
      },
      {
        category: "Biryani",isVeg : false,
        items: [
          { name: 'Dum Biryani', price: 170},
          { name: 'Fry Biryani', price: 190},
          { name: 'Mixed Biryani', price: 200},
          // { name: 'Fish Fry Biryani', price: 200},
          // { name: 'Prawns Biryani', price: 250},
          //{ name: 'Mutton Biryani', price: 710},
          // { name: 'Chicken Haleem (1/4 kg)', price: 200},
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },
      // {
      //   category: "Double Biryani",isVeg : false,
      //   items: [
      //     { name: 'Double Dum Biryani', price: 390},
      //     { name: 'Double Fry Biryani', price: 390},
      //     { name: 'Double Mixed Biryani', price: 390},
      //     { name: 'Double Fish Fry Biryani', price: 390},
      //     //{ name: 'Prawns Biryani', price: 550},
      //     //{ name: 'Mutton Biryani', price: 550},
      //     // { name: 'Chicken Haleem (1/4 kg)', price: 200},
      //     // { name: 'Chicken Haleem (1/2 kg)', price: 200},
      //     // { name: 'Chicken Haleem (1 kg)', price: 200},
      //   ],
      // },
    ]
  },
  {
    id: 'sindhu',
    name: 'Hotel Sindhu',
    image: 'assets/images/sindhu.jpg',
    rating: 5,
    description: 'Best Biryanis in Mandadam',
    categories: ['Biryani'],
    bestItem: 'Dum Biryani',
    menu: [
      {
        category: "Student's Choice",isVeg : false,
        items: [
          { name: 'Dum Biryani', price: 200, isStudentChoice: true },
        ],
      },
      {
        category: "Biryani",isVeg : false,
        items: [
          { name: 'Dum Biryani', price: 200},
          { name: 'Fry Biryani', price: 200},
          { name: 'Mixed Biryani', price: 200},
          { name: 'Fish Fry Biryani', price: 200},
          { name: 'Prawns Biryani', price: 250},
          //{ name: 'Mutton Biryani', price: 710},
          // { name: 'Chicken Haleem (1/4 kg)', price: 200},
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },
      {
        category: "Double Biryani",isVeg : false,
        items: [
          { name: 'Double Dum Biryani', price: 390},
          { name: 'Double Fry Biryani', price: 390},
          { name: 'Double Mixed Biryani', price: 390},
          { name: 'Double Fish Fry Biryani', price: 390},
          //{ name: 'Prawns Biryani', price: 550},
          //{ name: 'Mutton Biryani', price: 550},
          // { name: 'Chicken Haleem (1/4 kg)', price: 200},
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },
    ]
  },
  {
    id: 'cafe999',
    name: 'Cafe 999',
    image: 'assets/images/cafe999.jpeg',
    rating: 5,
    
    description: 'Food & Bavarages',
    categories: ['Food'],
    bestItem: 'pizza',
    menu: [
      {
        category: "Student's Choice",isVeg : false,
        items: [
          { name: 'Chicken pizza', price: 189, isStudentChoice: true },
          { name: 'Sweet corn pizza', price: 169, isStudentChoice: true },
          { name: 'Chicken Burger', price: 119, isStudentChoice: true },
          { name: 'Veg Burger', price: 99, isStudentChoice: true },
          { name: 'Chicken wings(10pc)', price: 239, isStudentChoice: true},
          
          

          
        ],
      },
      // {
      //   category: "Bavarages",isVeg : true,
      //   items: [
      //     { name: 'Mint Mojito', price: 99},
      //     { name: 'Blue Cirracao', price: 99},
        
      //     { name: 'Mango Burst Milkshake', price: 119},
      //     { name: 'Butter Scotch Milkshake', price: 119},
          
      //     // { name: 'Chicken Haleem (1/2 kg)', price: 200},
      //     // { name: 'Chicken Haleem (1 kg)', price: 200},
      //   ],
      // },
      {
        category: "Non Veg",isVeg : false,
        items: [
          { name: 'Chicken Sandwich', price: 149},
          { name: 'Chicken burger', price: 119},
          { name: 'Chicken pizza', price: 189},
          { name: 'Chicken wings(5pc)', price: 159},
          { name: 'Chicken wings(10pc)', price: 239},
          { name: 'Chicken lollipop(5pc)', price: 209},
          { name: 'Chicken lollipop(10pc)', price: 359},

          { name: 'Chicken pizza', price: 189},
          { name: 'chicken momo fried', price: 109},
        
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },
      {
        category: "Veg",isVeg : true,
        items: [
          { name: 'Corn Samosa (5 pc)', price:69},
           {name: 'Veg Burger', price: 89},
           { name: 'sweet corn pizza', price: 169},

          { name: 'Salted French Fries', price:99},
          
          { name: 'Masala French Fries', price: 109},


          { name: 'Veg Momo Fried', price: 99},
          { name: 'Paneer Momo Fried', price: 119},
          { name: 'veg sandwich', price: 129},
          
                    
        
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },
    ]
  },
  
  // {
  //   id: 'spice-magic',
  //   name: 'Spice Magic',
  //   image: 'assets/images/spice-magic.jpg',
  //   rating: 4,
  //   description: 'Famous for their aromatic Mixed Biryani',
  //   categories: ['Biryani', 'Fast Food'],
  //   bestItem: 'Mixed Biryani',
  //   menu: [
  //     {
  //       category: "Student's Choice",isVeg : false,
  //       items: [{ name: 'Mixed Biryani', price: 190, isStudentChoice: true },
  //               { name: 'chicken 65 Biryani', price: 240, isStudentChoice: true  },
  //               { name: 'Boxer Fried Rice', price: 260, isStudentChoice: true  },
  //               //{ name: 'SP Fried Rice', price: 250, isStudentChoice: true  },
  //       ],

  //     },
  //     {
  //       category: "Newly Added",isVeg : false,
  //       items: [{ name: 'Chicken 65 Biryani', price: 240},
  //               { name: 'Mughalai Biryani', price: 250},
  //               { name: 'Chicken Special biryani', price: 240},
  //              // { name: 'Boxer Fried Rice', price: 260},
  //               //{ name: 'SP Fried Rice', price: 250},
  //       ],

  //     },

      
  //     {
  //       category: 'Bucket Biryanis',isVeg : false,
  //       items: [
  //         { name: 'Bucket Dum Biryani (For 4)', price: 640 },
  //         { name: 'Bucket Fry Piece Biryani (For 4)', price: 670 },
  //         { name: 'Bucket Mixed Biryani (For 4)', price: 730 },
  //       ],
  //     },
  //     {
  //       category: 'Biryanis',isVeg : false,
  //       items: [
  //         { name: 'Dum Biryani', price: 160 },
  //         { name: 'Fry Biryani', price: 180 },
  //         {name: 'Mixed Biryani', price: 190},
  //         { name: 'Chicken 65 biryani', price: 240 },
  //         { name: 'Chicken Special biryani', price: 240 },
  //         { name: 'Mughalai Biryani', price: 250 },
  //       ],
  //     },
      
  //     {
  //       category: 'Chinese/Fast Food',isVeg : false ,
  //       items: [
  //         // { name: 'Veg Noodles', price: 90 },
  //         // { name: 'Veg Fried Rice', price: 90 },
  //         { name: 'Egg Noodles', price: 110 },
  //         { name: 'Egg Fried Rice', price: 110 },
  //         { name: 'Chicken Noodles', price: 130 },
  //         { name: 'Chicken Fried Rice', price: 130 },
  //        // { name: 'SP Fried Rice', price: 20 },
  //        // { name: 'Boxer Fried Rice', price: 250 },
  //         { name: 'Chicken Manchurian', price: 160 },
  //         { name: 'Chilli Chicken', price: 160 },
  //         { name: 'Chicken Lollipop (4 pcs)', price: 160 },
  //       ],
  //     },
  //     {
  //       category : 'Veg Chinese/Fast Food', isVeg : true,
  //       items:[
  //          { name: 'Veg Noodles', price: 90 },
  //         { name: 'Veg Fried Rice', price: 90 },
  //       ]
  //     },
  //   ],
  // },

  
  {
    id: 'food-corner',
    name: 'Food Corner',
    image: 'assets/images/food-corner.jpg',
    rating: 4,
    description: 'Your go-to spot for quick Chinese & Fast Foods',
    categories: ['Fast Food'],
    bestItem: 'Chicken Noodles',
    menu: [
      {
        category: "Student's Choice",isVeg : false ,
        items: [
          { name: 'Veg Noodles', price: 80, isStudentChoice: true },
          { name: 'Egg Noodles', price: 90, isStudentChoice: true },
          { name: 'Chicken Noodles', price: 100, isStudentChoice: true },
        ],
      },
      {
        category :'Veg Items',isVeg : true,
        items:[
          { name: 'Veg Noodles', price: 80 },
          { name: 'Veg Fried Rice', price: 80 },
           { name: 'Veg Manchurian', price: 80 },
          
        ]
      },
      {
        category: 'NV Noodles',isVeg : false ,
        items: [
          // { name: 'Veg Noodles', price: 80 },
          { name: 'Egg Noodles', price: 90 },
          { name: 'Chicken Noodles', price: 100 },
          { name: 'Veg Manchurian Noodles', price: 90 },
          { name: 'Egg Manchurian Noodles', price: 100 },
        ],
      },
      {
        category: 'NV Fried Rice',isVeg : false ,
        items: [
          // { name: 'Veg Fried Rice', price: 80 },
          { name: 'Egg Fried Rice', price: 90 },
          { name: 'Chicken Fried Rice', price: 100 },
          { name: 'Veg Manchurian Fried Rice', price: 90 },
          { name: 'Egg Manchurian Fried Rice', price: 100 },
        ],
      },
      {
        category: 'NV Starters',isVeg : false ,
        items: [
          // { name: 'Veg Manchurian', price: 80 },
          { name: 'Egg Manchurian', price: 90 },
          { name: 'Chicken Manchurian', price: 170 },
          { name: 'Chilli Chicken', price: 170 },
          { name: '4P Chicken Lollipop', price: 150 },
        ],
      },
    ],
  },

  {
    id: 'RoyalGrand',
    name: 'Hotel Royal Grand',
    image: 'assets/images/royalgrand.png',
    rating: 5,
    description: 'Lollipop Biryani is famous here',
    categories: ['Biryani'],
    bestItem: 'Lollipop Biryani',
    menu: [
      {
        category: "Student's Choice",isVeg : false,
        items: [
          { name: 'Lollipop Biryani', price: 269, isStudentChoice: true },
        ],
      },
      {
        category: "Biryani",isVeg : false,
        items: [
          { name: 'Dum Biryani', price: 199},
          { name: 'Fry Piece Biryani', price: 219},
          { name: 'Lollipop Biryani', price: 269},
          { name: 'Wing Biryani', price: 269},
          { name: 'Mughalai Biryani', price: 269},
          { name: 'Tikka Biryani', price: 269},
          { name: 'Sp Biryani', price: 269},
          
        
          // { name: 'Chicken Haleem (1/2 kg)', price: 200},
          // { name: 'Chicken Haleem (1 kg)', price: 200},
        ],
      },
    ]
  },
  
  
  
  {
    id: 'hotel-bheemasena',
    name: 'Hotel Bheemasena',
    image: 'assets/images/hotel-bheemasena.jpg',
    rating: 5,
    description: 'Authentic restaurant-style veg and non-veg dishes',
    categories: ['Biryani', 'Veg Meals'],
    bestItem: 'Biryanis, Starters, Soups & Curries',
    menu: [
      {
        category: 'Veg Biryanis',isVeg : true,
        items: [
          { name: 'Biryani Rice', price: 180 },
          { name: 'Veg Biryani', price: 240 },
          { name: 'Spl Veg Biryani', price: 260 },
          { name: 'Ulavacharu Biryani', price: 270 },
          { name: 'Kaju Biryani', price: 290},
          { name: 'Spl Kaju Biryani', price: 310 },
          { name: 'Mushroom Biryani', price: 270 },
          { name: 'Spl Mushroom Biryani', price: 290 },
          { name: 'Paneer Biryani', price: 270 },
          { name: 'Spl Paneer Biryani', price: 290 },
          { name: 'Paneer Tikka Biryani', price: 310 },
          { name: 'Bheemasena Spl Biryani', price: 310},
        ],
      },
      {
        category: 'Non-Veg Biryanis',isVeg : false,
        items: [
          { name: 'Spl Egg Biryani', price: 280 },
          { name: 'Chicken Dum Biryani', price: 270 },
          { name: 'Chicken Fry Biryani', price: 280 },
          { name: 'Chicken Fry Roasted Biryani', price: 290 },
          { name: 'Spl Chicken Biryani', price: 300 },
          { name: 'Joint Biryani', price: 310 },
          { name: 'Kalmi Biryani', price: 320 },
          { name: 'Chicken Tikka Biryani', price: 320 },
          { name: 'Chicken Mughlai Biryani', price: 310 },
          { name: 'Ulavacharu Chicken Biryani', price: 320 },
          { name: 'Wings Biryani', price: 310 },
          { name: 'Chicken Lollipop Biryani', price: 330 },
          { name: 'Kundan Biryani', price: 360 },
          { name: 'Nawab Biryani', price: 370 },
          { name: 'Tandoori Chicken Biryani', price: 370 },
          { name: 'Oanpur Biryani', price: 400 },
          { name: 'Nalli Gosht', price: 500 },
          { name: 'Mutton Fry Biryani', price: 400 },
          { name: 'Mutton Afgani Biryani', price: 400 },
          { name: 'Mutton Dum Biryani', price: 410 },
          { name: 'Mutton Keema Biryani', price: 480 },
          { name: 'Mutton Mughlai Biryani', price: 430 },
          { name: 'Prawns Biryani', price: 390 },
          { name: 'Spl Prawns Biryani', price: 410 },
          { name: 'Fish Biryani', price: 390 },
          { name: 'Bheemasena Spl Non Veg Biryani', price: 460 },
        ],
      },
      {
        category: 'Bucket Biryanis',isVeg : false,
        items: [
          { name: 'Chicken Dum Bucket Biryani', price: 800 },
          { name: 'Fry Chicken Bucket Biryani', price: 850 },
          { name: 'Spl Chicken Bucket Biryani', price: 880 },
          { name: 'Wings Bucket Biryani', price: 890 },
          { name: 'Lollipop Bucket Biryani', price: 950 },
          { name: 'Kundan Bucket Biryani', price: 1150 },
          { name: 'Prawns Bucket Biryani', price: 1100 },
          { name: 'Fish Bucket Biryani', price: 1000 },
          { name: 'Mutton Bucket Biryani', price: 1200 },
        ],
      },
      {
        category: 'Mini Biryanis',isVeg : false,
        items: [
          { name: 'Mini Dum Biryani', price: 170 },
          { name: 'Mini Fry Biryani', price: 180 },
          { name: 'Mini Boneless Biryani', price: 190 },
          // { name: 'Mini Paneer Biryani', price: 190 },
          // { name: 'Mini Mushroom Biryani', price: 180 },
        ],
      },
      {
        category: 'Mini Veg Biryanis',isVeg : true,
        items: [
          // { name: 'Mini Dum Biryani', price: 170 },
          // { name: 'Mini Fry Biryani', price: 180 },
          // { name: 'Mini Boneless Biryani', price: 190 },
          { name: 'Mini Paneer Biryani', price: 190 },
          { name: 'Mini Mushroom Biryani', price: 180 },
        ],
      },

      // {
      //   category: 'Fried Rice',
      //   items: [
      //     { name: 'Zeera Rice', price: 204 },
      //     { name: 'Veg Fried Rice', price: 223 },
      //     { name: 'Paneer Fried Rice', price: 252 },
      //     { name: 'Kaju Fried Rice', price: 262 },
      //     { name: 'Mushroom Fried Rice', price: 242 },
      //     { name: 'Bheemasena Spl Fried Rice', price: 300 },
      //     { name: 'Egg Fried Rice', price: 252 },
      //     { name: 'Chicken Fried Rice', price: 271 },
      //     { name: 'Spl Chicken Fried Rice', price: 291 },
      //     { name: "Prawn's Fried Rice", price: 320 },
      //     { name: 'Mutton Fried Rice', price: 350 },
      //     { name: 'Bheemasena Spl Non Veg Fried Rice', price: 378 },
      //   ],
      // },
      // {
      //   category: 'Soups',
      //   items: [
      //     { name: 'Veg Corn Soup', price: 130 },
      //     { name: 'Veg Manchow Soup', price: 130 },
      //     { name: 'Veg H/S Soup', price: 130 },
      //     { name: 'Bheemasena Spl Soup (Veg)', price: 140 },
      //     { name: 'Chicken Corn Soup', price: 140 },
      //     { name: 'Chicken Manchow Soup', price: 140 },
      //     { name: 'Chicken H/S Soup', price: 140 },
      //     { name: 'Chicken Coriander Soup', price: 140 },
      //     { name: 'Mutton Bone Soup', price: 170 },
      //     { name: 'Mutton Sharbh Soup', price: 170 },
      //     { name: 'Bheemasena Spl Soup (Non-Veg)', price: 160 },
      //   ],
      // },
      {
        category: 'Veg Starters',isVeg : true,
        items: [
          { name: 'Veg Manchuria', price: 210 },
          { name: 'Gobi Manchuria', price: 210 },
        ],
      },
      {
        category: 'Non Veg Starters',isVeg : false,
        items: [
          { name: 'Chilli Chicken', price: 290 },
          { name: 'Chicken Manchuria', price: 290 },
          { name: 'Chicken 65', price: 290 },
          { name: 'Chicken Majestic', price: 290 },
          { name: 'Dragon Chicken', price: 300 },
          { name: 'Chicken 555', price: 290 },
          { name: 'Royal Chicken', price: 300 },
          { name: 'Chicken Lollipop', price: 310 },
          { name: 'Apollo Fish', price: 330 },
          { name: 'Chilli Fish', price: 340 },
          { name: 'Bheemasena Spl Non Veg', price: 360 },
          { name: 'Chicken Wings', price: 310 },
          { name: 'Basket Chicken', price: 320 },
          { name: 'Chicken Fry Bone', price: 270 },
          { name: 'Chicken Popcorn', price: 290 },
          { name: 'Chilli Egg', price: 250 },
          { name: 'Crispy Chicken', price: 310 },
          { name: 'Hong Kong Chicken', price: 300 },
          { name: 'Pepper Chicken', price: 320 },
          { name: 'Loose Prawns', price: 360 },
          { name: 'Chilli Prawn', price: 370 },
        ],
      },
      // {
      //   category: 'Curries',
      //   items: [
      //     { name: 'Plain Palak/Paneer', price: 190 },
      //     { name: 'Mix Veg Curry', price: 270 },
      //     { name: 'Paneer Butter M/S', price: 280 },
      //     { name: 'Kaju Masala', price: 300 },
      //     { name: 'Mushroom Masala', price: 280 },
      //     { name: 'Kaju Paneer Curry', price: 300 },
      //     { name: 'Veg Jaipuri', price: 280 },
      //     { name: 'Veg Chat Pat', price: 290 },
      //     { name: 'Tomato Kaju Curry', price: 300 },
      //     { name: 'Methi Chaman', price: 300 },
      //     { name: 'Bheemasena Spl Veg Curry', price: 330 },
      //     { name: 'Chicken Curry', price: 270 },
      //     { name: 'Chicken Fry Bone Curry', price: 260 },
      //     { name: 'Egg Burji', price: 190 },
      //     { name: 'Egg Curry', price: 230 },
      //     { name: 'Methi Chicken Curry', price: 290 },
      //     { name: 'Mughlai Chicken Curry', price: 290 },
      //     { name: 'Mutton Boneless Curry', price: 410 },
      //     { name: 'Prawns Fry', price: 350 },
      //     { name: 'Andhra Chicken Curry', price: 290 },
      //     { name: 'Kadai Chicken', price: 290 },
      //     { name: 'Butter Chicken', price: 290 },
      //     { name: 'Hyderabad Chicken', price: 290 },
      //     { name: 'Chicken Tikka Masala', price: 290 },
      //     { name: 'Punjabi Chicken Masala', price: 310 },
      //     { name: 'Prawns Curry', price: 350 },
      //     { name: 'Mutton Curry', price: 380 },
      //     { name: 'Fish Curry BL', price: 330 },
      //     { name: 'Mutton Rogan Josh', price: 410 },
      //     { name: 'Bheemasena Spl N.V. Curry', price: 400 },
      //   ],
      // },
      {
        category: 'Breads',isVeg : true,
        items: [
          { name: 'Pulka', price: 15 },
          { name: 'Butter Pulka', price: 20 },
          { name: 'Roti', price: 25 },
          { name: 'Butter Roti', price: 30 },
          { name: 'Butter Naan', price: 45 },
          { name: 'Plain Naan', price: 35 },
          { name: 'Kulcha', price: 50 },
          { name: 'M/S Kulcha', price: 60 },
          { name: 'Methi Parota', price: 60 },
          { name: 'Garlic Naan', price: 70 },
        ],
      },
      {
        category: 'Tandoori Starters',isVeg : false,
        items: [
          { name: 'Tandoori Chicken 1/2', price: 300 },
          { name: 'Tandoori Chicken Full', price: 580 },
          { name: 'Tangdi Kebab', price: 330 },
          { name: 'Chicken Tikka', price: 310 },
          { name: 'Malai Tikka', price: 340 },
          { name: 'Fish Tikka', price: 330 },
        ],
      },
      {
        category: 'Thali/Beverages',isVeg : true,
        items: [
          { name: 'Thali', price: 140 },
          { name: 'Thali Parcel', price: 160 },
          { name: 'Thali Parcel Single', price: 130 },
          { name: 'Ragi Sangati', price: 110 },
          { name: 'Natukodi Curry', price: 350 },
          { name: 'White Rice', price: 80 },
          { name: 'Curd Rice', price: 90 },
          { name: 'Spl Curd Rice', price: 150 },
          { name: 'Water Bottle', price: 20 },
          { name: 'Soft Drink', price: 25 },
          { name: 'Butter Milk', price: 50 },
          { name: 'Lassi', price: 70 },
        ],
      },
    ],
  },
  // {
  //   id: 'palleturu-palahaaram',
  //   name: 'Palleturu Palaharam',
  //   image: 'assets/images/palleturu-palahaaram.jpg',
  //   rating: 4,
  //   description: 'Authentic village-style non-veg biryani delicacies',
  //   categories: ['Biryani'],
  //   bestItem: 'Mutton Biryani & Prawns Biryani',
  //   menu: [
  //     {
  //       category: "Student's Choice(Revised Prices By Restaurent)",
  //       items: [
  //         { name: 'Mutton Biryani', price: 320, isStudentChoice: true },
  //         { name: 'Prawns Biryani', price: 300, isStudentChoice: true },
  //       ],
  //     },
  //     {
  //       category: 'Full Biryani Menu(Revised Prices By Restaurent)',
  //       items: [
  //         { name: 'Mutton Fry Biryani', price: 320 },
  //         { name: 'Prawns Fry Biryani', price: 300 },
  //         { name: 'Chicken Dhum Biryani', price: 220 },
  //         { name: 'Chicken Fry Biryani', price: 250 },
  //       ],
  //     },
  //   ],
  // },
  // {
  //   id: 'hotel-mourya',
  //   name: 'Hotel Mourya',
  //   image: 'assets/images/hotel-mourya.jpg',
  //   rating: 4,
  //   description: 'Home of the legendary Chicken Mughalai Biryani',
  //   categories: ['Biryani'],
  //   bestItem: 'Chicken Mughalai Biryani',
  //   menu: [
  //     {
  //       category: "Student's Choice",
  //       items: [
  //         { name: 'Chicken Mughalai Biryani', price: 400, isStudentChoice: true },
  //       ],
  //     },
  //     {
  //       category: 'Non-Veg Biryani',
  //       items: [
  //         { name: 'Chicken Dum Biryani', price: 290 },
  //         { name: 'SP Chicken Biryani', price: 350 },
  //         { name: 'Chicken Fry Piece Biryani', price: 330 },
  //         { name: 'Chicken Tikka Biryani', price: 400 },
  //         { name: 'Chicken Wings Biryani', price: 430 },
  //         { name: 'Chicken Mughalai Biryani', price: 400 },
  //         { name: 'Mutton Biryani', price: 530 },
  //         { name: 'SP Mutton Biryani', price: 620 },
  //         { name: 'Mutton Mughalai Biryani', price: 580 },
  //         { name: 'Fish Biryani', price: 490 },
  //         { name: 'Prawns Biryani', price: 490 },
  //         { name: 'SP Prawns Biryani', price: 590 },
  //       ],
  //     },
  //     {
  //       category: 'Mourya Specials',
  //       items: [
  //         { name: 'Mourya SP Chicken Biryani', price: 430 },
  //         { name: 'Mourya SP Mutton Biryani', price: 710 },
  //         { name: 'Mourya SP Veg Biryani', price: 360 },
  //         { name: 'Mourya SP Chicken Family Pack', price: 1500 },
  //         { name: 'Mourya SP Chicken Curry', price: 330 },
  //       ],
  //     },
  //     {
  //       category: 'Veg Biryani',
  //       items: [
  //         { name: 'Biryani Rice', price: 190 },
  //         { name: 'Biryani Rice Half', price: 140 },
  //         { name: 'Baby Corn Biryani', price: 240 },
  //         { name: 'Egg Biryani', price: 280 },
  //         { name: 'Kaju Biryani', price: 300 },
  //         { name: 'Mushroom Biryani', price: 270 },
  //         { name: 'Veg Biryani', price: 260 },
  //         { name: 'Paneer Biryani', price: 280 },
  //         { name: 'Veg Palav', price: 240 },
  //       ],
  //     },
  //     {
  //       category: 'Family Packs',
  //       items: [
  //         { name: 'Chicken Dum Family Pack', price: 860 },
  //         { name: 'Chicken Fry Piece Family Pack', price: 910 },
  //         { name: 'Chicken SP Family Pack', price: 960 },
  //         { name: 'Mutton Family Pack', price: 1410 },
  //         { name: 'Fish Family Pack', price: 1310 },
  //         { name: 'Prawns Family Pack', price: 1410 },
  //         { name: 'Veg Family Pack', price: 760 },
  //       ],
  //     },
  //     {
  //       category: 'Fried Rice',
  //       items: [
  //         { name: 'Egg Fried Rice', price: 250 },
  //         { name: 'SP Egg Fried Rice', price: 300 },
  //         { name: 'Egg Schezwan Fried Rice', price: 270 },
  //         { name: 'Ghee Fried Rice', price: 240 },
  //         { name: 'Kaju Fried Rice', price: 280 },
  //         { name: 'Mixed Veg Fried Rice', price: 290 },
  //         { name: 'Mushroom Fried Rice', price: 260 },
  //         { name: 'Paneer Fried Rice', price: 280 },
  //         { name: 'Veg Fried Rice', price: 240 },
  //         { name: 'SP Veg Fried Rice', price: 290 },
  //         { name: 'Tomato Rice', price: 230 },
  //         { name: 'Veg Schezwan Fried Rice', price: 240 },
  //         { name: 'Zeera Rice', price: 220 },
  //         { name: 'Curd Rice', price: 120 },
  //         { name: 'SP Curd Rice', price: 170 },
  //         { name: 'Chicken Fried Rice', price: 280 },
  //         { name: 'Mixed Non-Veg Fried Rice', price: 330 },
  //         { name: 'Non-Veg Schezwan Fried Rice', price: 330 },
  //         { name: 'Mutton Fried Rice', price: 440 },
  //       ],
  //     },
  //     {
  //       category: 'Snacks',
  //       items: [
  //         { name: 'Loose Prawns', price: 360 },
  //         { name: 'Prawns Fry', price: 360 },
  //         { name: 'Chilli Fish', price: 360 },
  //         { name: 'Chilli Prawns', price: 360 },
  //         { name: 'Apollo Fish', price: 360 },
  //         { name: 'Baby Corn Manchurian', price: 270 },
  //         { name: 'Chilli Baby Corn', price: 260 },
  //         { name: 'Chilli Mushroom', price: 260 },
  //         { name: 'Chilli Paneer', price: 280 },
  //         { name: 'Crispy Baby Corn', price: 260 },
  //         { name: 'Kaju Fry', price: 320 },
  //         { name: 'Mushroom 65', price: 270 },
  //         { name: 'Gobi Manchurian', price: 260 },
  //         { name: 'Paneer 65', price: 280 },
  //         { name: 'Paneer 555', price: 280 },
  //         { name: 'Paneer Manchurian', price: 280 },
  //         { name: 'Paneer Majestic', price: 280 },
  //         { name: 'Veg Manchurian', price: 260 },
  //         { name: 'Chicken 555', price: 330 },
  //         { name: 'Chicken 65', price: 320 },
  //         { name: 'Chilly Chicken', price: 310 },
  //         { name: 'Chicken Lollipop', price: 350 },
  //         { name: 'Chicken Wings Full', price: 340 },
  //         { name: 'Mutton Fry', price: 470 },
  //       ],
  //     },
  //     {
  //       category: 'Curries',
  //       items: [
  //         { name: 'Andhra Chicken Curry BL', price: 310 },
  //         { name: 'Butter Chicken', price: 330 },
  //         { name: 'Chicken Tikka Masala Curry', price: 330 },
  //         { name: 'Mutton Curry', price: 460 },
  //         { name: 'Prawns Curry', price: 360 },
  //         { name: 'Kadai Paneer', price: 280 },
  //         { name: 'Paneer Butter Masala', price: 270 },
  //         { name: 'Egg Curry', price: 200 },
  //       ],
  //     },
  //   ],
  // },
  {
    id: 'ruchi-pulkha-point',
    name: 'Ruchi Pulkha Point',
    image: 'assets/images/ruchi-pulkha.jpg',
    rating: 4,
    description: 'Best Pulkha & Egg Burji combos at budget prices',
    categories: ['Veg Meals'],
    bestItem: '3 Pulkha + Egg Burji Combo',
    menu: [
      {
        category: "Student's Choice",isVeg : false,
        items: [
          { name: '3 Pulkhas + Egg Burji Combo', price: 70, isStudentChoice: true },
        ],
      },
      {
        category: 'Non Veg Combos',isVeg : false,
        items: [
          { name: '1 Pulka', price: 12 },
          { name: 'Only Egg Burji(Half)', price: 35 },
          { name: 'Only Egg Burji(Full)', price: 55 },
          { name: '3 Pulkas (2 Veg Curries)', price: 60 },
          { name: '3 Pulkas + Chicken Curry', price: 90 },
          { name: 'Single Egg Omelette', price: 25 },
          { name: 'Double Egg Omelette', price: 45 },
          { name: '2 Chapatis + 2 Veg Curries', price: 60 },
        ],
      },
      {
        category: 'Veg Combos',isVeg : true,
        items: [
          { name: '1 Pulka', price: 12 },
          // { name: 'Only Egg Burji(Half)', price: 35 },
          // { name: 'Only Egg Burji(Full)', price: 55 },
          { name: '3 Pulkas (2 Veg Curries)', price: 60 },
          // { name: '3 Pulkas + Chicken Curry', price: 90 },
          // { name: 'Single Egg Omelette', price: 25 },
          // { name: 'Double Egg Omelette', price: 45 },
          { name: '2 Chapatis + 2 Veg Curries', price: 60 },
        ],
      },
    ],
  },
  {
    id: 'tiffens',
    name: 'Tiffins',
    image: 'assets/images/tiffens.jpg',
    rating: 4,
    description: 'Choose from two or more outlets for South Indian breakfast',
    categories: ['Tiffins'],
    bestItem: 'Masala Dosa & Idli',
    menu: [
      {
        category: 'Breakfast & Snacks(Prices Revised By Restaurents)',isVeg : true,
        items: [
          { name: 'Idli (4 pcs)', price: 55 },
          { name: 'Gare (4 pcs)', price: 55 },
          { name: 'Bajji (4 pcs)', price: 55 },
          { name: 'Mirchi Bajji (4 pcs)', price: 55 },
          { name: 'Punugulu', price: 55 },
          { name: 'Poori (2 pcs)', price: 50 },
        ],
      },
      {
        category: 'Non Veg Dosa Corner',isVeg : false,
        items: [
          // { name: 'Masala Dosa', price: 65 },
          // { name: 'Onion Dosa', price: 60 },
          { name: 'Single Egg Dosa', price: 60 },
          { name: 'Double Egg Dosa', price: 75 },
        ],
      },
      {
        category: 'Veg Dosa Corner',isVeg : true,
        items: [
          { name: 'Masala Dosa', price: 65 },
          { name: 'Onion Dosa', price: 60 },
          // { name: 'Single Egg Dosa', price: 60 },
          // { name: 'Double Egg Dosa', price: 75 },
        ],
      },
      {
        category: 'Tawa Items',isVeg : true,
        items: [
          { name: 'Chapati', price: 60 },
          { name: 'Parotha', price: 60 },
        ],
      },
    ],
  },
  
  
];

export const categories = ['All','Haleem' ,'Biryani', 'Fast Food', 'Tiffins','Fruits', 'Veg Meals'];
