export const BPS = 10_000n;
export const SERVICES_ESCROW_BPS = 7000n;
export const SERVICES_SATISFACTION_BPS = 3000n;
export const SERVICES_PROTOCOL_FEE_BPS = 400n;
export const SERVICES_TIMELINESS_PENALTY_BPS = 900n;
export const SERVICES_TIMELINESS_HALF_PENALTY_BPS = 450n;

/** Weights for R/C/Q (sum = 70 → "70% of the final 30% satisfaction slice"). */
export const RCQ_WEIGHT_BPS = { respect: 1000n, comm: 500n, quality: 5500n };
export const RCQ_WEIGHT_SUM_BPS = 7000n;
export const TIMELINESS_WEIGHT_BPS = 3000n;

export function servicesInitialWei(totalWei) {
  return (BigInt(totalWei) * SERVICES_ESCROW_BPS) / BPS;
}

export function servicesSatisfactionWei(totalWei) {
  return (BigInt(totalWei) * SERVICES_SATISFACTION_BPS) / BPS;
}

/** On-chain integer RCQ 1–7 (ServicesEscrow._starRCQ). */
export function servicesStarRCQ(respect, comm, quality) {
  const s = Number(respect) * 10 + Number(comm) * 5 + Number(quality) * 55;
  let v = Math.floor((s + 35) / 70);
  if (v < 1) v = 1;
  if (v > 7) v = 7;
  return v;
}

/** workflow.md worked example: (R/7·10% + C/7·5% + Q/7·55%) / 70% × 7 */
export function servicesRcqStarsExact(respect, comm, quality) {
  const r = Number(respect);
  const c = Number(comm);
  const q = Number(quality);
  const raw =
    (r / 7) * (Number(RCQ_WEIGHT_BPS.respect) / Number(BPS)) +
    (c / 7) * (Number(RCQ_WEIGHT_BPS.comm) / Number(BPS)) +
    (q / 7) * (Number(RCQ_WEIGHT_BPS.quality) / Number(BPS));
  return (raw / (Number(RCQ_WEIGHT_SUM_BPS) / Number(BPS))) * 7;
}

export function servicesRcqWeightedParts(respect, comm, quality) {
  const r = Number(respect);
  const c = Number(comm);
  const q = Number(quality);
  return {
    respect: (r / 7) * (Number(RCQ_WEIGHT_BPS.respect) / Number(BPS)),
    comm: (c / 7) * (Number(RCQ_WEIGHT_BPS.comm) / Number(BPS)),
    quality: (q / 7) * (Number(RCQ_WEIGHT_BPS.quality) / Number(BPS)),
    sum: servicesRcqStarsExact(respect, comm, quality),
  };
}

/** 70% × RCQ + 30% × timeliness (integer stars, matches _workflowOverallStars). */
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

/** True when R/C/Q band passes for auto satisfaction (≥3★), per workflow.md. */
export function servicesRcqPassesForSatisfaction(respect, comm, quality) {
  if (servicesLowQualityDisputeOnly(respect, comm, quality)) return false;
  return servicesStarRCQ(respect, comm, quality) >= 3;
}

export function servicesFinalReviewMsgValue(amountWei, respect, comm, timeliness, quality) {
  const amount = BigInt(amountWei);
  if (amount <= 0n) return 0n;
  if (!servicesRcqPassesForSatisfaction(respect, comm, quality)) return 0n;

  const t = Number(timeliness);
  let totalRelease = servicesSatisfactionWei(amount);
  if (t <= 2) {
    const penalty = (amount * SERVICES_TIMELINESS_PENALTY_BPS) / BPS;
    totalRelease = penalty >= totalRelease ? 0n : totalRelease - penalty;
  } else if (t === 3) {
    const penalty = (amount * SERVICES_TIMELINESS_HALF_PENALTY_BPS) / BPS;
    totalRelease = penalty >= totalRelease ? 0n : totalRelease - penalty;
  }
  return totalRelease;
}

/** Seller share of gig total after timeliness rules (before protocol fee). */
export function servicesSellerGrossPercentOfTotal(respect, comm, timeliness, quality) {
  const amount = 10000n;
  const gross = servicesFinalReviewMsgValue(amount, respect, comm, timeliness, quality);
  return Number((gross * 100n) / amount) / 100;
}

export function servicesProtocolFeeWei(grossWei) {
  return (BigInt(grossWei) * SERVICES_PROTOCOL_FEE_BPS) / BPS;
}

export function servicesSellerNetAfterFeeWei(grossWei) {
  const gross = BigInt(grossWei);
  return gross - servicesProtocolFeeWei(gross);
}

export function servicesFinalPayoutPreview(amountWei, respect, comm, timeliness, quality) {
  const rcq = servicesStarRCQ(respect, comm, quality);
  const rcqExact = servicesRcqStarsExact(respect, comm, quality);
  const parts = servicesRcqWeightedParts(respect, comm, quality);
  const overall = servicesWeightedOverallStars(respect, comm, timeliness, quality);
  const breakdown = servicesFinalSatisfactionBreakdown(amountWei, respect, comm, timeliness, quality);
  const buyerSendsWei =
    breakdown.grossBuyerSentWei ?? breakdown.grossAfterTimelinessWei ?? servicesFinalReviewMsgValue(
      amountWei,
      respect,
      comm,
      timeliness,
      quality
    );
  const sellerPct = servicesSellerGrossPercentOfTotal(respect, comm, timeliness, quality);
  return { rcq, rcqExact, parts, overall, buyerSendsWei, breakdown, sellerPct, rcqPasses: servicesRcqPassesForSatisfaction(respect, comm, quality) };
}

export function servicesFinalSatisfactionBreakdown(amountWei, respect, comm, timeliness, quality) {
  const amount = BigInt(amountWei);
  const t = Number(timeliness);
  const q = Number(quality);
  const rcq = servicesStarRCQ(respect, comm, quality);
  const rcqExact = servicesRcqStarsExact(respect, comm, quality);
  const overall = servicesWeightedOverallStars(respect, comm, timeliness, quality);
  const nominal30SliceWei = amount > 0n ? (amount * SERVICES_SATISFACTION_BPS) / BPS : 0n;

  let timelinessPenaltyWei = 0n;
  let timelinessSummary = "Timeliness 4–7: no deduction (9% / 4.5% penalties do not apply).";
  if (t <= 2) {
    timelinessPenaltyWei = (amount * SERVICES_TIMELINESS_PENALTY_BPS) / BPS;
    timelinessSummary =
      "Timeliness 1–2: subtract 9% of gig total from the 30% satisfaction slice (30% of the final 30% leg).";
  } else if (t === 3) {
    timelinessPenaltyWei = (amount * SERVICES_TIMELINESS_HALF_PENALTY_BPS) / BPS;
    timelinessSummary =
      "Timeliness 3: subtract 4.5% of gig total (half of the 9% timeliness penalty).";
  }

  const lowQualityBlocked = q <= 2 || rcq <= 2;

  if (lowQualityBlocked) {
    return {
      path: "low_quality_no_auto",
      overall,
      rcq,
      rcqExact,
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
        "Quality ≤2 or RCQ ≤2: no automatic satisfaction payment — dispute / admin path.",
    };
  }

  if (!servicesRcqPassesForSatisfaction(respect, comm, quality)) {
    return {
      path: "low_rcq_no_auto",
      overall,
      rcq,
      rcqExact,
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
        "RCQ below 3★: does not pass for the 70% (R/C/Q) portion — buyer sends 0 ETH; use dispute if overall is 1–2★.",
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

  const sellerPct = Number((grossAfterTimelinessWei * 10000n) / (amount || 1n)) / 100;

  return {
    path: "satisfaction",
    overall,
    rcq,
    rcqExact,
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
    sellerPctOfTotal: sellerPct,
    headline: `RCQ ${rcqExact.toFixed(2)}★ (≥3 passes 70% leg). Buyer funds ${sellerPct.toFixed(1)}% of gig total on this submit (30% slice minus timeliness penalty).`,
  };
}
