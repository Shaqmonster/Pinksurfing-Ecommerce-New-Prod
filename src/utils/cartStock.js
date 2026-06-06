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

/** True when the cart line cannot be increased further. */
export function isCartItemAtMaxStock(cartItem) {
  const stockQty = getCartItemStockQty(cartItem);
  const cartQty = Number(cartItem?.quantity) || 0;
  if (stockQty === null) return true;
  return cartQty >= stockQty;
}

export function cartStockLimitMessage(stockQty) {
  if (stockQty === 1) return "Only 1 available in stock";
  return `Maximum ${stockQty} available in stock`;
}
