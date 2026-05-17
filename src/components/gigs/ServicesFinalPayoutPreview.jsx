import React from "react";
import { ethers } from "ethers";
import { servicesFinalPayoutPreview } from "../../lib/servicesEscrowMath";

function fmtEth(wei) {
  try {
    return Number(ethers.formatEther(BigInt(wei ?? 0))).toFixed(4);
  } catch {
    return "0.0000";
  }
}

export default function ServicesFinalPayoutPreview({ amountWei, scores }) {
  const basis = amountWei && BigInt(amountWei) > 0n ? BigInt(amountWei) : 0n;
  if (basis <= 0n) return null;

  const { timeliness, quality } = scores;
  const { rcqExact, overall, buyerSendsWei, sellerPct, rcqPasses } = servicesFinalPayoutPreview(
    basis,
    scores.respect,
    scores.comm,
    timeliness,
    quality
  );

  const sendsZero = BigInt(buyerSendsWei ?? 0) === 0n;
  const t = Number(timeliness);

  let timelinessNote = "Timing OK — no extra penalty.";
  if (t <= 2) timelinessNote = "Very late (1–2★): −9% of total.";
  else if (t === 3) timelinessNote = "A bit late (3★): −4.5% of total.";

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 text-[11px] space-y-1.5 ${
        sendsZero ? "border-amber-500/35 bg-amber-500/10 text-amber-100/90" : "border-cyan-500/30 bg-cyan-500/5 text-white/75"
      }`}
    >
      <p className="font-medium text-white/90">
        {sendsZero
          ? "No satisfaction payment on submit"
          : `You pay ${fmtEth(buyerSendsWei)} ETH now (~${(sellerPct * 100).toFixed(0)}% of gig)`}
      </p>
      <p className="text-white/55 leading-snug">
        Work score: <span className="text-white/80">{rcqExact.toFixed(1)}★</span>
        {rcqPasses ? " (passes)" : " (too low)"} · Overall {overall}★
      </p>
      <p className="text-white/50">{timelinessNote}</p>
      {Number(quality) <= 2 && <p className="text-amber-200/90">Quality 1–2★ → dispute only.</p>}
      {!rcqPasses && Number(quality) > 2 && (
        <p className="text-amber-200/90">Work score under 3★ → 0 ETH; use dispute if unfair.</p>
      )}
    </div>
  );
}
