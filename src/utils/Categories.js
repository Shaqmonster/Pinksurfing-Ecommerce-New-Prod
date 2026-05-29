export const categories = [
  {
    id: 1,
    name: "Shopping Mall",
    image: "/new/shopping mall.jpg",
    link: "/shoppingMall/all",
    coming_soon: true,
  },
  {
    id: 2,
    name: "Shop by Store concierge game",
    image: "/new/shp.jpg",
    link: "/home",
    coming_soon: true,
  },
  {
    id: 3,
    name: "My Store",
    image: "/new/mystore2.jpg",
    link: "/pinksurfing.com",
  },
];

/**
 * Order: (1) Business for sale → (2–3) Real estate → (4) Cars & trucks →
 * (5) Perfumes → (6) Trading cards → (7) Electronics (Computer Parts is a subcategory).
 * Remaining categories are coming soon.
 * Computer Parts is a subcategory under Electronics (see filter.json), not a top-level tile.
 * Removed: Toys.
 */
export const subCategories = [
  // —— Live / ordered ——
  {
    id: "16",
    name: "Business For Sale",
    category: "business-for-sale",
    image: "/new/business for sale.jpg",
    extraclass: "",
    link: "/home",
  },
  {
    id: "20",
    name: "Residential Real Estate",
    category: "residential-realestate",
    image: "/new/residentail_re.png",
    extraclass: "object-cover",
    link: "/home",
  },
  {
    id: "21",
    name: "Commercial Real Estate",
    category: "commercial-realestate",
    image: "/new/commercial_re.png",
    extraclass: "object-cover",
    link: "/home",
  },
  {
    id: "12",
    name: "Cars and Trucks",
    category: "cars",
    image: "/new/cars_and_trucks.jpg",
    extraclass: "",
    link: "/home",
  },
  {
    id: "6",
    name: "Perfumes",
    category: "perfumes",
    image2: "/new/beauty.jpg",
    extraclass: "object-cover",
    image: "/new/perfume.jpg",
    link: "/home",
  },
  {
    id: "1",
    name: "Trading Cards",
    image: "/new/trading_cards1.jpg",
    category: "trading-cards",
    extraclass: "object-cover",
    link: "/home",
  },
  {
    id: "4",
    name: "Electronics",
    category: "electronics",
    image: "/new/electronics.jpg",
    extraclass: "object-cover",
    link: "/home",
  },
  // —— Coming soon ——
  // {
  //   id: "2",
  //   name: "Beauty/Makeup",
  //   category: "beauty-makeup",
  //   image: "/new/beauty_makeup.jpg",
  //   extraclass: "object-cover",
  //   link: "/home",
  //   coming_soon: true,
  // },
  // {
  //   id: "14",
  //   name: "Video Games",
  //   category: "videogames",
  //   image: "/new/viedo_games.jpg",
  //   extraclass: "w-full h-full",
  //   link: "/home",
  //   coming_soon: true,
  // },
  // {
  //   id: "5",
  //   name: "Jobs/Gigs",
  //   category: "jobs",
  //   image: "/comingsoon/jobs.png",
  //   extraclass: "object-cover",
  //   link: "/home",
  //   coming_soon: true,
  // },
  // {
  //   id: "9",
  //   name: " AI Agents 4 Sale",
  //   category: "AI Agents",
  //   image: "/comingsoon/ai_agents.png",
  //   extraclass: "",
  //   link: "/home",
  //   coming_soon: true,
  // },
  // {
  //   id: "11",
  //   name: "Entertainment",
  //   category: "entertainment",
  //   image: "/comingsoon/entertainment.png",
  //   extraclass: "",
  //   link: "/home",
  //   coming_soon: true,
  // },
  // {
  //   id: "13",
  //   name: "Building Materials",
  //   category: "building-materials",
  //   image: "/comingsoon/building_materials.png",
  //   extraclass: "",
  //   link: "/home",
  //   coming_soon: true,
  // },
  // {
  //   id: "15",
  //   name: "Hotels",
  //   category: "hotels",
  //   image: "/comingsoon/hotels.png",
  //   extraclass: "",
  //   link: "/home",
  //   coming_soon: true,
  // },
];
