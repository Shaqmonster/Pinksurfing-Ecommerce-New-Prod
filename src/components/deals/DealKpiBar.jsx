import React from "react";
import { formatMoney } from "../../api/offMarketDeals";

const CSS = `
.deal-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px;}
@media(max-width:768px){.deal-kpi{grid-template-columns:repeat(2,1fr);}}
.deal-kpi-item{background:#141418;border:1px solid #2a2a33;border-radius:8px;padding:16px 18px;}
.deal-kpi-val{font-size:22px;font-weight:800;color:#f0f0f4;line-height:1.1;}
.deal-kpi-val.pink{color:#f0318a;}
.deal-kpi-label{font-size:11px;color:#66667a;text-transform:uppercase;letter-spacing:.06em;margin-top:6px;font-weight:600;}
`;

export default function DealKpiBar({ stats, loading }) {
  if (loading || !stats) {
    return (
      <>
        <style>{CSS}</style>
        <div className="deal-kpi">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="deal-kpi-item">
              <div className="deal-kpi-val">—</div>
              <div className="deal-kpi-label">Loading…</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  const items = [
    { label: "Closed Deals", value: formatMoney(stats.closed_deals_volume), pink: true },
    { label: "Active Listings", value: String(stats.active_listings_count ?? 0) },
    {
      label: "Avg Spread",
      value: formatMoney(stats.avg_spread),
    },
    { label: "Satisfaction", value: `${stats.satisfaction_pct ?? 0}%` },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="deal-kpi">
        {items.map((item) => (
          <div key={item.label} className="deal-kpi-item">
            <div className={`deal-kpi-val ${item.pink ? "pink" : ""}`}>{item.value}</div>
            <div className="deal-kpi-label">{item.label}</div>
          </div>
        ))}
      </div>
    </>
  );
}
