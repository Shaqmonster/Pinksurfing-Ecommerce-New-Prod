import axios from "axios";

const baseUrl = () => (import.meta.env.VITE_SERVER_URL || "").replace(/\/$/, "");

/** Live goods categories used for lightweight home/related sections. */
export const HOME_FEATURED_CATEGORY_SLUGS = [
  "electronics",
  "perfumes",
  "trading-cards",
];

export async function fetchCategoryProducts(categorySlug) {
  if (!categorySlug) return [];
  const response = await axios.get(
    `${baseUrl()}/api/product/category-products/${encodeURIComponent(categorySlug)}/`,
    { headers: { "Content-Type": "application/json" } }
  );
  return Array.isArray(response.data) ? response.data : [];
}

export async function fetchDiscountedProducts(percent = 5) {
  const response = await axios.get(
    `${baseUrl()}/api/product/discounted-products/${percent}/`,
    { headers: { "Content-Type": "application/json" } }
  );
  return Array.isArray(response.data?.products) ? response.data.products : [];
}

export async function fetchHomeFeaturedProducts(limit = 12) {
  const batches = await Promise.all(
    HOME_FEATURED_CATEGORY_SLUGS.map((slug) => fetchCategoryProducts(slug))
  );
  const seen = new Set();
  const merged = [];

  for (const batch of batches) {
    for (const product of batch) {
      if (!product?.id || seen.has(product.id)) continue;
      seen.add(product.id);
      merged.push(product);
    }
  }

  return merged
    .sort(
      (a, b) =>
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
    )
    .slice(0, limit);
}

export async function fetchRelatedProducts(product, limit = 6) {
  const categorySlug = product?.category?.slug;
  if (!categorySlug || !product?.id) return [];

  const items = await fetchCategoryProducts(categorySlug);
  return items.filter((item) => item.id !== product.id).slice(0, limit);
}
