export const BPS = 10_000n;
export const SERVICES_ESCROW_BPS = 7000n;
export const SERVICES_SATISFACTION_BPS = 3000n;
export const SERVICES_PROTOCOL_FEE_BPS = 400n;
export const SERVICES_TIMELINESS_PENALTY_BPS = 900n;
export const SERVICES_TIMELINESS_HALF_PENALTY_BPS = 450n;

export function servicesInitialWei(totalWei) {
  return (BigInt(totalWei) * SERVICES_ESCROW_BPS) / BPS;
}

export function servicesSatisfactionWei(totalWei) {
  return (BigInt(totalWei) * SERVICES_SATISFACTION_BPS) / BPS;
}

export function servicesStarRCQ(respect, comm, quality) {
  const s = Number(respect) * 10 + Number(comm) * 5 + Number(quality) * 55;
  let v = Math.floor((s + 35) / 70);
  if (v < 1) v = 1;
  if (v > 7) v = 7;
  return v;
}

export function servicesWeightedOverallStars(respect, comm, timeliness, quality) {
  const rcq = servicesStarRCQ(respect, comm, quality);
  const t = Number(timeliness);
  let v = Math.floor((rcq * 70 + t * 30 + 50) / 100);
  if (v < 1) v = 1;
  if (v > 7) v = 7;
  return v;
}

function servicesLowQualityDisputeOnly(respect, comm, quality) {
  const rcq = servicesStarRCQ(respect, comm, quality);
  return Number(quality) <= 2 || rcq <= 2;
}

export function servicesFinalReviewMsgValue(amountWei, respect, comm, timeliness, quality) {
  const amount = BigInt(amountWei);
  if (amount <= 0n) return 0n;
  if (servicesLowQualityDisputeOnly(respect, comm, quality)) return 0n;
  const t = Number(timeliness);
  const overall = servicesWeightedOverallStars(respect, comm, t, quality);
  let totalRelease = servicesSatisfactionWei(amount);
  if (overall >= 3) {
    if (t <= 2) {
      const penalty = (amount * SERVICES_TIMELINESS_PENALTY_BPS) / BPS;
      totalRelease = penalty >= totalRelease ? 0n : totalRelease - penalty;
    } else if (t === 3) {
      const penalty = (amount * SERVICES_TIMELINESS_HALF_PENALTY_BPS) / BPS;
      totalRelease = penalty >= totalRelease ? 0n : totalRelease - penalty;
    }
    return totalRelease;
  }
  return 0n;
}

export function servicesProtocolFeeWei(grossWei) {
  return (BigInt(grossWei) * SERVICES_PROTOCOL_FEE_BPS) / BPS;
}

export function servicesSellerNetAfterFeeWei(grossWei) {
  const gross = BigInt(grossWei);
  const fee = servicesProtocolFeeWei(gross);
  return gross - fee;
}

/**
 * Explains final satisfaction leg in plain terms (mirrors ServicesEscrow.submitFinalReview).
 * `amountWei` is the gig total `e.amount` (100% basis), not the 70% escrow deposit.
 */
export function servicesFinalSatisfactionBreakdown(amountWei, respect, comm, timeliness, quality) {
  const amount = BigInt(amountWei);
  const t = Number(timeliness);
  const q = Number(quality);
  const rcq = servicesStarRCQ(respect, comm, quality);
  const overall = servicesWeightedOverallStars(respect, comm, timeliness, quality);
  const nominal30SliceWei = amount > 0n ? (amount * SERVICES_SATISFACTION_BPS) / BPS : 0n;

  let timelinessPenaltyWei = 0n;
  let timelinessSummary = "Timeliness 4–7: no timeliness deduction from the 30% slice.";
  if (t <= 2) {
    timelinessPenaltyWei = (amount * SERVICES_TIMELINESS_PENALTY_BPS) / BPS;
    timelinessSummary =
      "Timeliness 1–2: contract subtracts 9% of the gig total from the 30% satisfaction slice (before the 4% platform fee).";
  } else if (t === 3) {
    timelinessPenaltyWei = (amount * SERVICES_TIMELINESS_HALF_PENALTY_BPS) / BPS;
    timelinessSummary =
      "Timeliness 3: contract subtracts 4.5% of the gig total from the 30% satisfaction slice (half of the full timeliness penalty).";
  }

  const lowQualityBlocked = q <= 2 || rcq <= 2;

  if (lowQualityBlocked) {
    return {
      path: "low_quality_no_auto",
      overall,
      rcq,
      respect,
      comm,
      timeliness,
      quality,
      nominal30SliceWei,
      timelinessPenaltyWei,
      timelinessSummary,
      grossBuyerSentWei: 0n,
      protocolFeeWei: 0n,
      sellerNetWei: 0n,
      headline:
        "No automatic final payment: quality or blended RCQ is in the 1–2 band. The buyer did not fund the satisfaction slice on final review; use the dispute path if applicable.",
    };
  }

  if (overall <= 2) {
    return {
      path: "low_overall_no_auto",
      overall,
      rcq,
      respect,
      comm,
      timeliness,
      quality,
      nominal30SliceWei,
      timelinessPenaltyWei,
      timelinessSummary,
      grossBuyerSentWei: 0n,
      protocolFeeWei: 0n,
      sellerNetWei: 0n,
      headline:
        "No automatic final payment: workflow overall is 1–2. The buyer sends 0 ETH on final review; dispute or admin resolution may follow.",
    };
  }

  let grossAfterTimelinessWei = nominal30SliceWei;
  if (t <= 2) {
    grossAfterTimelinessWei = timelinessPenaltyWei >= nominal30SliceWei ? 0n : nominal30SliceWei - timelinessPenaltyWei;
  } else if (t === 3) {
    grossAfterTimelinessWei = timelinessPenaltyWei >= nominal30SliceWei ? 0n : nominal30SliceWei - timelinessPenaltyWei;
  }

  const protocolFeeWei = servicesProtocolFeeWei(grossAfterTimelinessWei);
  const sellerNetWei = servicesSellerNetAfterFeeWei(grossAfterTimelinessWei);

  return {
    path: "satisfaction",
    overall,
    rcq,
    respect,
    comm,
    timeliness,
    quality,
    nominal30SliceWei,
    timelinessPenaltyWei,
    timelinessSummary,
    grossAfterTimelinessWei,
    grossBuyerSentWei: grossAfterTimelinessWei,
    protocolFeeWei,
    sellerNetWei,
    headline:
      "The client funds this satisfaction slice (gross). On-chain: ~4% of that gross goes to the platform; the remainder is credited to the freelancer (pending withdraw).",
  };
}
