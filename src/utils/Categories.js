export const categories = [
  {
    id: 1,
    name: "Shopping Mall",
    image: "/new/shopping mall.jpg",
    link: "/shoppingMall",
    coming_soon: false,
  },
  {
    id: 2,
    name: "Shop by store",
    image: "/new/shp.jpg",
    link: "/shopByStore",
    coming_soon: false,
  },
  {
    id: 3,
    name: "My Store",
    image: "/new/mystore2.jpg",
    link: "/profile",
  },
];

/**
 * Order: (1) Business for sale → (2–3) Real estate → (4) Cars & trucks →
 * (5) Perfumes → (6) Electronics (Computer Parts is a subcategory).
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
    link: "/category/business-for-sale",
  },
  {
    id: "20",
    name: "Residential Real Estate",
    category: "residential-realestate",
    image: "/new/residentail_re.png",
    extraclass: "object-cover",
    link: "/category/residential-realestate",
  },
  {
    id: "21",
    name: "Commercial Real Estate",
    category: "commercial-realestate",
    image: "/new/commercial_re.png",
    extraclass: "object-cover",
    link: "/category/commercial-realestate",
  },
  {
    id: "12",
    name: "Cars and Trucks",
    category: "cars",
    image: "/new/cars_and_trucks.jpg",
    extraclass: "",
    link: "/category/cars",
  },
  {
    id: "6",
    name: "Perfumes",
    category: "perfumes",
    image2: "/new/beauty.jpg",
    extraclass: "object-cover",
    image: "/new/perfume.jpg",
    link: "/category/perfumes",
  },
  {
    id: "4",
    name: "Electronics",
    category: "electronics",
    image: "/new/electronics.jpg",
    extraclass: "object-cover",
    link: "/category/electronics",
  },
];
