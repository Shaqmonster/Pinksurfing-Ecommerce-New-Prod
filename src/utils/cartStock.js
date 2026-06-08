/** Categories where quantity is not sellable inventory (listings, single cars, etc.). */
export const NON_INVENTORY_CATEGORY_SLUGS = new Set([
  "business-for-sale",
  "business4sale",
  "residential-realestate",
  "commercial-realestate",
  "cars",
]);

/** True only for standard goods/products that track purchasable stock. */
export function usesInventoryStock(product) {
  const slug =
    product?.category?.slug ??
    product?.product?.category?.slug ??
    "";
  return slug ? !NON_INVENTORY_CATEGORY_SLUGS.has(slug) : true;
}

/** Read vendor stock from a catalog product. */
export function getProductStockQty(product) {
  const raw = product?.quantity ?? product?.available_stock;
  if (raw === null || raw === undefined || raw === "") return null;
  const stockQty = Number(raw);
  if (!Number.isFinite(stockQty) || stockQty < 0) return null;
  return stockQty;
}

/** True when a goods/product cannot be purchased (stock is 0). */
export function isOutOfStock(product) {
  if (!usesInventoryStock(product)) return false;
  const stockQty = getProductStockQty(product);
  return stockQty !== null && stockQty <= 0;
}

/** Read vendor stock from a cart line item (nested product.quantity). */
export function getCartItemStockQty(cartItem) {
  const raw =
    cartItem?.available_stock ??
    cartItem?.product?.quantity;
  if (raw === null || raw === undefined || raw === "") return null;
  const stockQty = Number(raw);
  if (!Number.isFinite(stockQty) || stockQty < 0) return null;
  return stockQty;
}

/** Cart line references a product with zero stock. */
export function isCartItemOutOfStock(cartItem) {
  if (!usesInventoryStock(cartItem?.product)) return false;
  const stockQty = getCartItemStockQty(cartItem);
  return stockQty !== null && stockQty <= 0;
}

/** Cart quantity exceeds current stock. */
export function isCartItemOverStock(cartItem) {
  if (!usesInventoryStock(cartItem?.product)) return false;
  const stockQty = getCartItemStockQty(cartItem);
  const cartQty = Number(cartItem?.quantity) || 0;
  return stockQty !== null && stockQty > 0 && cartQty > stockQty;
}

/** True when the cart line cannot be increased further. */
export function isCartItemAtMaxStock(cartItem) {
  if (!usesInventoryStock(cartItem?.product)) return false;
  const stockQty = getCartItemStockQty(cartItem);
  const cartQty = Number(cartItem?.quantity) || 0;
  if (stockQty === null) return true;
  return cartQty >= stockQty;
}

/** Block checkout when any line is out of stock or over-ordered. */
export function cartBlocksCheckout(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) return true;
  return cartItems.some(
    (item) => isCartItemOutOfStock(item) || isCartItemOverStock(item)
  );
}

export function getCartStockIssueMessage(cartItems) {
  const names = (cartItems || [])
    .filter((item) => isCartItemOutOfStock(item) || isCartItemOverStock(item))
    .map((item) => item.product?.name || "An item")
    .slice(0, 3);
  if (names.length === 0) {
    return "Remove out-of-stock items before checkout.";
  }
  if (names.length === 1) {
    return `${names[0]} is out of stock — remove it to checkout.`;
  }
  return "Some items are out of stock — remove them to checkout.";
}

export function cartStockLimitMessage(stockQty) {
  if (stockQty === 1) return "Only 1 available in stock";
  return `Maximum ${stockQty} available in stock`;
}
