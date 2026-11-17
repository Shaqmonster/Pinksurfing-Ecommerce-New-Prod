// One wording for the unlock-fee policy everywhere it's shown (retest N2.11). The backend
// enforces the same rule in off_market_deals/refunds.py.
export const REFUND_RULE =
  "Fully refunded if the seller cancels or the deal expires without closing. Not refunded if you back out.";

export function unlockFeePolicy(deal) {
  const credit =
    deal?.unlock_fee_credited_at_close !== false ? "Credited toward closing costs when you close. " : "";
  return `${credit}${REFUND_RULE}`;
}
