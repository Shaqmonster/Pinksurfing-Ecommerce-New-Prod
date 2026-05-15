import React from "react";
import { ethers } from "ethers";

function weiStr(wei) {
  if (wei === undefined || wei === null) return "0.0000";
  try {
    return Number(ethers.formatEther(BigInt(wei))).toFixed(4);
  } catch {
    return "0.0000";
  }
}

/**
 * @param {{ path: string, headline?: string, overall?: number, rcq?: number } & Record<string, unknown>} breakdown — from servicesFinalSatisfactionBreakdown
 * @param {"buyer"|"seller"} viewer
 * @param {boolean} satisfactionReleased — on-chain flag after successful auto satisfaction
 */
export default function ServicesFinalSliceBreakdown({ breakdown, viewer, satisfactionReleased }) {
  if (!breakdown || !breakdown.path) return null;

  const isSeller = viewer === "seller";
  const title = isSeller ? "Final slice — what you get (seller view)" : "Final satisfaction payment — breakdown (preview)";

  return (
    <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-3 space-y-2">
      <h4 className="text-emerald-200/95 text-sm font-semibold">{title}</h4>
      {breakdown.headline && <p className="text-[11px] text-white/70 leading-snug">{breakdown.headline}</p>}

      <div className="rounded-lg border border-white/10 bg-black/20 p-2 space-y-1.5 text-[11px] text-white/65">
        <div className="flex justify-between gap-2">
          <span>Stars stored (Respect / Communication / Timeliness / Quality)</span>
          <span className="text-white/85 font-mono shrink-0">
            {breakdown.respect}/{breakdown.comm}/{breakdown.timeliness}/{breakdown.quality}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Workflow overall (70% RCQ blend + 30% timeliness)</span>
          <span className="text-white/85 font-mono shrink-0">{breakdown.overall}★</span>
        </div>
        <div className="flex justify-between gap-2">
          <span>Blended RCQ (10%·R + 5%·C + 55%·Q → 1–7)</span>
          <span className="text-white/85 font-mono shrink-0">{breakdown.rcq}★</span>
        </div>
        <p className="text-white/40 pt-1 border-t border-white/5">
          Star weights only set the workflow overall / dispute gates. Dollar amounts use fixed contract slices (30% leg ± timeliness penalty + 4% fee).
        </p>
      </div>

      {breakdown.path === "satisfaction" && (
        <ul className="space-y-1.5 text-[11px] text-white/70">
          <li className="flex justify-between gap-2">
            <span>① Nominal final slice (30% of gig total)</span>
            <span className="text-amber-200/90 font-mono shrink-0">{weiStr(breakdown.nominal30SliceWei)} ETH</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>② Timeliness deduction (from gig total)</span>
            <span className="text-rose-200/90 font-mono shrink-0">−{weiStr(breakdown.timelinessPenaltyWei)} ETH</span>
          </li>
          <li className="text-white/45 pl-0 leading-snug">{breakdown.timelinessSummary}</li>
          <li className="flex justify-between gap-2 pt-1 border-t border-white/10">
            <span>③ Gross buyer sends (② applied → msg.value)</span>
            <span className="text-cyan-200/90 font-mono shrink-0">{weiStr(breakdown.grossBuyerSentWei)} ETH</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>④ Platform fee (~4% of ③)</span>
            <span className="text-white/50 font-mono shrink-0">−{weiStr(breakdown.protocolFeeWei)} ETH</span>
          </li>
          <li className="flex justify-between gap-2 font-semibold text-white/90">
            <span>⑤ {isSeller ? "Credited to you (seller net)" : "Seller receives (net)"}</span>
            <span className="text-emerald-300 font-mono shrink-0">{weiStr(breakdown.sellerNetWei)} ETH</span>
          </li>
        </ul>
      )}

      {(breakdown.path === "low_quality_no_auto" || breakdown.path === "low_overall_no_auto") && (
        <ul className="space-y-1 text-[11px] text-white/65">
          <li className="flex justify-between gap-2">
            <span>Reference: 30% slice before timeliness rule</span>
            <span className="font-mono text-white/75">{weiStr(breakdown.nominal30SliceWei)} ETH</span>
          </li>
          <li className="flex justify-between gap-2">
            <span>Would-be timeliness deduction (info only)</span>
            <span className="font-mono text-white/75">−{weiStr(breakdown.timelinessPenaltyWei)} ETH</span>
          </li>
          <li className="text-white/45">{breakdown.timelinessSummary}</li>
          <li className="pt-1 text-amber-200/90">Automatic satisfaction payment: 0 ETH — no ④/⑤ until dispute resolution or other contract path.</li>
        </ul>
      )}

      {isSeller && satisfactionReleased && breakdown.path === "satisfaction" && (
        <p className="text-[11px] text-emerald-300/90">
          On-chain: satisfaction was released. Run &quot;Move earnings to my wallet&quot; if you still have pending withdrawals.
        </p>
      )}
    </div>
  );
}
