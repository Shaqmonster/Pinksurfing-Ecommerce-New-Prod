import { formatDay } from "../../utils/formatDate";
import React from "react";
import { unlockFeePolicy } from "./unlockPolicy";
import DealImage from "./DealImage";
import { Link } from "react-router-dom";
import { formatMoney } from "../../api/offMarketDeals";

const CSS = `
.deal-card{background:var(--ps-color-surface);border:1.5px solid var(--ps-color-border);border-radius:10px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .15s,transform .15s;}
.deal-card:hover{border-color:rgba(151, 71, 255,.4);transform:translateY(-2px);}
.deal-card-img{position:relative;aspect-ratio:16/10;background:var(--ps-color-surface-sunken);overflow:hidden;}
.deal-card-img img{width:100%;height:100%;object-fit:cover;filter:blur(8px);transform:scale(1.05);}
.deal-card-img.unlocked img{filter:none;transform:none;}
.deal-card-badges{position:absolute;top:10px;left:10px;display:flex;gap:6px;flex-wrap:wrap;}
.deal-badge{font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;}
.deal-badge.verified{background:rgba(52,211,153,.15);color:var(--ps-color-success);border:1px solid rgba(52,211,153,.3);}
.deal-badge.unverified{background:rgba(14,15,19,.88);color:#e5e7eb;border:1px solid #6b7280/* theme-ok: on photo scrim */}
.deal-badge.sale{background:rgba(151, 71, 255,.12);color:var(--ps-color-action-text);border:1px solid rgba(151, 71, 255,.28);}
.deal-card-body{padding:16px;flex:1;display:flex;flex-direction:column;gap:10px;}
.deal-card-type{font-size:10px;color:var(--ps-color-text-meta);text-transform:uppercase;font-weight:700;letter-spacing:.06em;}
.deal-card-price{font-size:24px;font-weight:800;color:var(--ps-color-action-text);line-height:1;}
.deal-card-loc{font-size:13px;color:var(--ps-color-text-secondary);}
.deal-card-summary{font-size:12px;color:var(--ps-color-text-meta);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.deal-metrics{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;background:var(--ps-color-surface-sunken);border-radius:6px;padding:10px;}
.deal-met-k{font-size:9px;color:var(--ps-color-text-meta);text-transform:uppercase;font-weight:700;}
.deal-met-v{font-size:14px;font-weight:800;color:var(--ps-color-text);}
.deal-met-v.green{color:var(--ps-color-success);}
.deal-slots{font-size:11px;color:var(--ps-color-text-meta);}
.deal-slots-bar{height:4px;background:var(--ps-color-border);border-radius:2px;margin-top:4px;overflow:hidden;}
.deal-slots-fill{height:100%;background:var(--ps-primary);border-radius:2px;}
.deal-tags-row{display:flex;flex-wrap:wrap;gap:4px;}
.deal-mini-tag{font-size:10px;padding:2px 6px;border-radius:3px;background:var(--ps-color-surface-sunken);color:var(--ps-color-text-secondary);}
.deal-cta{margin-top:auto;padding-top:8px;}
.deal-cta-btn{display:block;width:100%;text-align:center;padding:10px;border-radius:6px;font-size:13px;font-weight:700;background:var(--ps-primary);color:#fff;border:none;cursor:pointer;text-decoration:none;}
.deal-cta-btn:hover{background:#d4246f;color:#fff;}
.deal-cta-btn.secondary{background:transparent;border:1.5px solid var(--ps-primary);color:var(--ps-color-action-text);}
.deal-lock{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;background:linear-gradient(180deg,rgba(14,15,19,.15),rgba(14,15,19,.55));color:#fff;pointer-events:none;/* theme-ok: on photo scrim */}
.deal-lock svg{width:26px;height:26px;opacity:.9;}
.deal-lock span{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;background:rgba(14,15,19,.7);padding:3px 8px;border-radius:4px;/* theme-ok: on photo scrim */}
.deal-deadline{font-size:11px;font-weight:700;color:var(--ps-color-warning);}
.deal-cta-note{font-size:11px;color:var(--ps-color-text-meta);text-align:center;margin-top:6px;line-height:1.4;}
`;

const DEADLINE_LABELS = {
  close_of_escrow: "Escrow closes",
  offers_due: "Offers due",
};

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

// "20/20 slots open" read as "no one wants this"; lead with demand when there is some.
export function slotsText(deal) {
  const unlocked = Number(deal.unlock_count) || 0;
  const remaining = deal.slots_remaining ?? 0;
  if (deal.is_slots_full) return "All unlock spots taken";
  if (unlocked === 0) return `Be the first to unlock · ${remaining} spots available`;
  return `${unlocked} investor${unlocked === 1 ? "" : "s"} unlocked · ${remaining} spot${remaining === 1 ? "" : "s"} left`;
}

function deadlineText(deal) {
  if (deal.days_left == null) return null;
  const label = DEADLINE_LABELS[deal.deadline_type] || "Deadline";
  // UTC, like the deal page, so the card and the page always show the same day.
  const when = deal.deadline_at ? formatDay(deal.deadline_at, { month: "short", day: "numeric", year: "numeric" }) : null;
  if (deal.days_left === 0) return `${label} today`;
  const rel = `${label} in ${deal.days_left} day${deal.days_left === 1 ? "" : "s"}`;
  return when ? `${rel} · ${when}` : rel;
}

export default function DealCard({ deal }) {
  const slug = deal.slug || deal.product_id;
  const pctUsed =
    deal.max_unlock_slots > 0
      ? Math.min(100, (deal.unlock_count / deal.max_unlock_slots) * 100)
      : 0;
  const img = deal.is_unlocked ? deal.hero_image : deal.hero_image_blurred || deal.hero_image;

  return (
    <>
      <style>{CSS}</style>
      <article className="deal-card">
        <Link to={`/deals/${slug}`} className={`deal-card-img ${deal.is_unlocked ? "unlocked" : ""}`}>
          <DealImage src={img} propertyClass={deal.property_class} />
          {!deal.is_unlocked && (
            <div className="deal-lock">
              <LockIcon />
              <span>Address hidden</span>
            </div>
          )}
          <div className="deal-card-badges">
            {/* Only PinkSurfing staff can verify a deal (retest P2.12). */}
            {deal.is_verified ? (
              <span
                className="deal-badge verified"
                title={deal.verification_note || "Checked by the PinkSurfing team."}
              >
                Verified by PinkSurfing
              </span>
            ) : (
              <span
                className="deal-badge unverified"
                title="The PinkSurfing team hasn't checked this deal yet. Unlocking shows the seller's documents."
              >
                Not yet verified
              </span>
            )}
            <span className="deal-badge sale">
              {deal.listing_intent === "for_lease" ? "For Lease" : "For Sale"}
            </span>
          </div>
        </Link>
        <div className="deal-card-body">
          <div className="deal-card-type">{deal.property_class?.replace("_", " ")}</div>
          <Link to={`/deals/${slug}`} className="deal-card-price" style={{ textDecoration: "none" }}>
            {formatMoney(deal.asking_price)}
          </Link>
          <div className="deal-card-loc">
            {deal.city}, {deal.state}
            {deal.beds ? ` · ${deal.beds} beds` : ""}
          </div>
          {deal.teaser_summary && <p className="deal-card-summary">{deal.teaser_summary}</p>}
          <div className="deal-metrics">
            <div>
              <div className="deal-met-k">ARV</div>
              <div className="deal-met-v">{formatMoney(deal.arv)}</div>
            </div>
            <div>
              <div className="deal-met-k">Spread</div>
              <div className="deal-met-v green">{formatMoney(deal.spread_amount)}</div>
            </div>
            <div>
              <div className="deal-met-k">Below ARV</div>
              <div className="deal-met-v green">{Number(deal.spread_pct).toFixed(0)}%</div>
            </div>
          </div>
          {deadlineText(deal) && <div className="deal-deadline">{deadlineText(deal)}</div>}
          <div className="deal-slots">
            {slotsText(deal)}
            <div className="deal-slots-bar">
              <div className="deal-slots-fill" style={{ width: `${pctUsed}%` }} />
            </div>
          </div>
          {deal.popular_tags?.length > 0 && (
            <div className="deal-tags-row">
              {deal.popular_tags.slice(0, 3).map((t) => (
                <span key={t} className="deal-mini-tag">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="deal-cta">
            <Link
              to={`/deals/${slug}`}
              className={`deal-cta-btn ${deal.is_unlocked ? "secondary" : ""}`}
            >
              {deal.is_unlocked
                ? "View Deal Room"
                : deal.is_slots_full
                  ? "Slots Full"
                  : `Unlock address & photos · ${formatMoney(deal.unlock_fee)}`}
            </Link>
            {!deal.is_unlocked && !deal.is_slots_full && (
              <p className="deal-cta-note">
                One-time fee. Reveals the address, photos, documents and deal room.{" "}
                {unlockFeePolicy(deal)}
              </p>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
