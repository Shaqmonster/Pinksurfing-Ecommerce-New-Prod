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

export default function ServicesFinalSliceBreakdown({ breakdown, viewer, satisfactionReleased }) {
  if (!breakdown?.path) return null;

  const isSeller = viewer === "seller";

  if (breakdown.path !== "satisfaction") {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100/90">
        {breakdown.headline || "No automatic final payment — dispute or admin path."}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-2.5 text-[11px] space-y-1">
      <p className="text-emerald-200/95 font-medium">Final payment · {breakdown.overall}★ overall</p>
      <p className="text-white/65">
        Gross {weiStr(breakdown.grossBuyerSentWei)} ETH
        {BigInt(breakdown.timelinessPenaltyWei ?? 0) > 0n && (
          <> (late fee −{weiStr(breakdown.timelinessPenaltyWei)})</>
        )}
        {" → "}
        <span className="text-emerald-300">
          {isSeller ? "You get" : "Seller gets"} {weiStr(breakdown.sellerNetWei)} ETH net
        </span>
      </p>
      {isSeller && satisfactionReleased && (
        <p className="text-white/45">Withdraw when ready if funds show as pending.</p>
      )}
    </div>
  );
}
