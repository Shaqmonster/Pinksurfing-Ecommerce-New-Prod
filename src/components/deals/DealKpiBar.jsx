import React from "react";
import { formatMoney } from "../../api/offMarketDeals";

const CSS = `
.deal-kpi{display:grid;grid-template-columns:repeat(2,minmax(0,240px));gap:12px;margin-bottom:24px;}
.deal-kpi-item{background:var(--ps-color-surface);border:1px solid var(--ps-color-border);border-radius:8px;padding:16px 18px;}
.deal-kpi-val{font-size:22px;font-weight:800;color:var(--ps-color-text);line-height:1.1;}
.deal-kpi-val.pink{color:var(--ps-color-action-text);}
.deal-kpi-label{font-size:11px;color:var(--ps-color-text-meta);text-transform:uppercase;letter-spacing:.06em;margin-top:6px;font-weight:600;}
`;

export default function DealKpiBar({ stats, loading }) {
  if (loading || !stats) {
    return (
      <>
        <style>{CSS}</style>
        <div className="deal-kpi">
          {[1, 2].map((i) => (
            <div key={i} className="deal-kpi-item">
              <div className="deal-kpi-val">—</div>
              <div className="deal-kpi-label">Loading…</div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Only figures computed from live listings. "Closed deals" and "satisfaction" were
  // admin-entered headline numbers ($2.4B+ / 94% by default) that read as inflated next to
  // a handful of listings, so they are not shown.
  const items = [
    { label: "Active Listings", value: String(stats.active_listings_count ?? 0), pink: true },
    {
      label: "Avg Spread",
      value: formatMoney(stats.avg_spread),
    },
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
