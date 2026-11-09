/** Cache-bust when overwriting /public/brand hero + tile JPGs (CDN/browser). */
const BRAND_IMG_V = "3";

export const categories = [
  {
    id: 1,
    name: "Shopping Mall",
    image: `/brand/hero-shopping-mall.jpg?v=${BRAND_IMG_V}`,
    link: "/shoppingMall",
    coming_soon: false,
  },
  {
    id: 2,
    name: "GigHub",
    image: `/brand/hero-gighub.jpg?v=${BRAND_IMG_V}`,
    link: "/gighub",
    coming_soon: false,
  },
  {
    id: 3,
    name: "Deals",
    image: `/brand/hero-deals.jpg?v=${BRAND_IMG_V}`,
    link: "/deals",
    coming_soon: false,
  },
];

/**
 * Live browse categories — photographic tiles under /public/brand.
 */
export const subCategories = [
  {
    id: "16",
    name: "Business For Sale",
    category: "business-for-sale",
    image: `/brand/tile-business.jpg?v=${BRAND_IMG_V}`,
    extraclass: "object-cover",
    link: "/category/business-for-sale",
  },
  {
    id: "20",
    name: "Residential Real Estate",
    category: "residential-realestate",
    image: `/brand/tile-realestate.jpg?v=${BRAND_IMG_V}`,
    extraclass: "object-cover",
    link: "/category/residential-realestate",
  },
  {
    id: "21",
    name: "Commercial Real Estate",
    category: "commercial-realestate",
    image: `/brand/tile-commercial.jpg?v=${BRAND_IMG_V}`,
    extraclass: "object-cover",
    link: "/category/commercial-realestate",
  },
  {
    id: "12",
    name: "Cars and Trucks",
    category: "cars",
    image: `/brand/tile-cars.jpg?v=${BRAND_IMG_V}`,
    extraclass: "object-cover",
    link: "/category/cars",
  },
  {
    id: "6",
    name: "Perfumes",
    category: "perfumes",
    image: `/brand/tile-perfume.jpg?v=${BRAND_IMG_V}`,
    extraclass: "object-cover",
    link: "/category/perfumes",
  },
  {
    id: "4",
    name: "Electronics",
    category: "electronics",
    image: `/brand/tile-electronics.jpg?v=${BRAND_IMG_V}`,
    extraclass: "object-cover",
    link: "/category/electronics",
  },
];
