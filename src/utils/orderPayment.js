import axios from "axios";

const SERVER = import.meta.env.VITE_SERVER_URL || "";

/** An order item counts as paid once the payment webhook has moved it past PENDING. */
export function isItemPaid(item) {
  if (!item) return false;
  if (item.paid_with_other || item.paid_with_wallet || item.paid_with_escrow) return true;
  const s = String(item.order_status || "").toUpperCase();
  return s !== "" && !["PENDING", "CANCELED", "ERROR"].includes(s);
}

export function isItemFailed(item) {
  const s = String(item?.order_status || "").toUpperCase();
  return s === "CANCELED" || s === "ERROR";
}

/** How long a PENDING order is shown as "confirming" before we call it unpaid. */
export const CONFIRMING_WINDOW_MS = 15 * 60 * 1000;

/**
 * Label for an order group that still has PENDING items.
 * Recent ones are probably waiting on the payment webhook; older ones were never paid.
 */
export function pendingLabel(items, now = Date.now()) {
  const newest = Math.max(
    ...items.map((i) => new Date(i.date_of_order || i.created_at || 0).getTime() || 0)
  );
  return now - newest < CONFIRMING_WINDOW_MS ? "Confirming payment" : "Not paid";
}

export function vendorIdOf(item) {
  const v = item?.vendor ?? item?.product?.vendor;
  return String(typeof v === "object" && v ? v.id : v ?? "");
}

export function storeNameOf(item) {
  return item?.product?.vendor?.store_name || item?.vendor?.store_name || "this store";
}

/** Items of one order, from the my-orders list. */
export function itemsForOrder(allItems, orderId) {
  return (Array.isArray(allItems) ? allItems : []).filter((i) => String(i.order) === String(orderId));
}

/** Unpaid items grouped by vendor: [{ vendorId, storeName, items, total }]. */
export function unpaidByVendor(items) {
  const groups = new Map();
  for (const item of items) {
    if (isItemPaid(item) || isItemFailed(item)) continue;
    const vendorId = vendorIdOf(item);
    if (!vendorId) continue;
    const g = groups.get(vendorId) || { vendorId, storeName: storeNameOf(item), items: [], total: 0 };
    g.items.push(item);
    g.total += Number(item.total_price || 0) + Number(item.shipping_cost || 0);
    groups.set(vendorId, g);
  }
  return [...groups.values()];
}

export async function fetchMyOrderItems(token) {
  const res = await axios.get(`${SERVER}/api/customer/my-orders/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Turn a Square payment-link error into words for the shopper.
 * Vendor-side detail (expired tokens, scopes) belongs in logs, not in front of the buyer.
 */
export function shopperPaymentError(error) {
  if (!error?.response) {
    return "We couldn't reach the payment service. Check your connection and try again.";
  }
  const code = error.response.data?.square_error_code;
  if (
    code === "UNAUTHORIZED" ||
    code === "ACCESS_TOKEN_EXPIRED" ||
    code === "ACCESS_TOKEN_REVOKED" ||
    code === "INSUFFICIENT_SCOPES" ||
    error.response.status === 403
  ) {
    return "This store can't take payments right now. Your order is saved — you can pay the other stores, or contact support.";
  }
  return "We couldn't start this payment. Your order is saved — please try again in a moment.";
}

/** Ask the backend for this vendor's Square checkout link. Throws on failure. */
export async function createVendorPaymentLink(orderId, vendorId, token) {
  const res = await axios.post(
    `${SERVER}/api/payments/square/create-order/${orderId}/vendor/${vendorId}/`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.data?.payment_link) throw new Error("No payment link returned");
  return res.data.payment_link;
}
