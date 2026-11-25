/** Plain-language labels for order item statuses (backend enums never reach the shopper). */
const LABELS = {
  PENDING: "Awaiting payment",
  RECEIVED: "Order received",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELED: "Canceled",
  "RETURN-REQUESTED": "Return requested",
  "RETURN-DELIVERED": "Return received by store",
  "RETURN-DISPUTED": "Return under review",
  RETURNED: "Returned",
  ERROR: "Payment problem",
};

export function orderStatusLabel(status) {
  const key = String(status || "").toUpperCase();
  return LABELS[key] || (key ? key.charAt(0) + key.slice(1).toLowerCase().replace(/-/g, " ") : "Unknown");
}

/** Token text colour per status — calm: only problems get the warning tone. */
export function orderStatusTone(status) {
  const key = String(status || "").toUpperCase();
  if (key === "DELIVERED" || key === "RETURNED") return "text-ps-success";
  if (key === "CANCELED" || key === "ERROR" || key === "RETURN-DISPUTED") return "text-ps-warning";
  return "text-ps-fg2";
}
