// Labels for product-request fields, shared by My Bids and the request detail page.
const CONDITION_LABELS = { any: "Any condition", new: "New only", used: "Used is fine" };

export const conditionLabel = (value) => CONDITION_LABELS[value] || value || "Any condition";
