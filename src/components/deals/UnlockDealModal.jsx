import React, { useState } from "react";
import { formatMoney } from "../../api/offMarketDeals";

const CSS = `
.unlock-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;}
.unlock-modal{background:#141418;border:1px solid #2a2a33;border-radius:12px;max-width:420px;width:100%;padding:28px;}
.unlock-modal h3{font-size:20px;font-weight:800;margin-bottom:8px;}
.unlock-modal p{font-size:14px;color:#b0b0c0;line-height:1.55;margin-bottom:20px;}
.unlock-fee{font-size:28px;font-weight:800;color:#f0318a;margin-bottom:16px;}
.unlock-actions{display:flex;gap:10px;}
.unlock-btn{flex:1;padding:12px;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;border:none;}
.unlock-btn.primary{background:#f0318a;color:#fff;}
.unlock-btn.ghost{background:transparent;border:1.5px solid #2a2a33;color:#b0b0c0;}
`;

export default function UnlockDealModal({ deal, onClose, onConfirm, loading }) {
  if (!deal) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="unlock-modal-overlay" onClick={onClose} role="presentation">
        <div className="unlock-modal" onClick={(e) => e.stopPropagation()}>
          <h3>Unlock this deal</h3>
          <p>
            Pay the unlock fee to access full address, photos, comps, and the deal room. Fee is
            {deal.unlock_fee_credited_at_close !== false
              ? " credited toward closing costs when you close."
              : " non-refundable if you do not proceed."}
          </p>
          <div className="unlock-fee">{formatMoney(deal.unlock_fee)}</div>
          <p style={{ fontSize: 12, color: "#66667a", marginBottom: 16 }}>
            {deal.slots_remaining} of {deal.max_unlock_slots} slots remaining
          </p>
          <div className="unlock-actions">
            <button type="button" className="unlock-btn ghost" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="unlock-btn primary"
              onClick={onConfirm}
              disabled={loading || deal.is_slots_full}
            >
              {loading ? "Redirecting…" : "Pay & Unlock"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
