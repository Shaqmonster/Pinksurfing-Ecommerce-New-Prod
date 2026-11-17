import { formatMoney } from "../utils/formatMoney";

// The job form sends one number per range (the API stores a single budget), so a job posted
// as "Under $1K" is saved as 500. Show the range the poster picked, not a made-up exact figure.
export const BUDGET_OPTIONS = [
  { value: "under1k", label: "Under $1K", num: 500 },
  { value: "1k-5k", label: "$1K – $5K", num: 1000 },
  { value: "5k-15k", label: "$5K – $15K", num: 5000 },
  { value: "15k-50k", label: "$15K – $50K", num: 15000 },
  { value: "50k-100k", label: "$50K – $100K", num: 50000 },
  { value: "100k+", label: "$100K+", num: 100000 },
  { value: "unsure", label: "Not sure", num: 1 },
];

const LABEL_BY_NUM = new Map(
  BUDGET_OPTIONS.map((o) => [o.num, o.value === "unsure" ? "Budget not set" : o.label])
);

/** Display text for a stored job budget, e.g. "Under $1K" or "$2,500.00". */
export function jobBudgetLabel(budget) {
  const n = Number(budget);
  if (!Number.isFinite(n) || n <= 0) return "Budget not set";
  return LABEL_BY_NUM.get(n) || `$${formatMoney(n)}`;
}
