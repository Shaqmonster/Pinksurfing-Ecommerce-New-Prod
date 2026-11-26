import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import DealRoomPanel from "../components/deals/DealRoomPanel";
import DealImage from "../components/deals/DealImage";
import UnlockDealModal from "../components/deals/UnlockDealModal";
import { unlockFeePolicy } from "../components/deals/unlockPolicy";
import { slotsText } from "../components/deals/DealCard";
import {
  fetchDealDetail,
  fetchDealFull,
  fetchDealRoom,
  formatMoney,
  initiateDealUnlock,
} from "../api/offMarketDeals";
import { useAccessToken } from "../hooks/useAccessToken";
import { formatDay } from "../utils/formatDate";

import { notify } from "../lib/notify";
const CSS = `
.deal-detail-page{min-height:100vh;background:var(--ps-color-bg);color:var(--ps-color-text);font-family:'DM Sans',sans-serif;padding:28px 32px 80px;}
.deal-detail-inner{max-width:1200px;margin:0 auto;}
.deal-detail-grid{display:grid;grid-template-columns:1fr 360px;gap:28px;align-items:start;}
@media(max-width:900px){.deal-detail-grid{grid-template-columns:1fr;}}
.deal-gallery{border-radius:12px;overflow:hidden;border:1px solid var(--ps-color-border);background:var(--ps-color-surface);}
.deal-gallery-main{aspect-ratio:16/9;position:relative;overflow:hidden;background:var(--ps-color-surface-sunken);}
.deal-gallery-main img{width:100%;height:100%;object-fit:cover;}
.deal-gallery-main.blurred img{filter:blur(12px);transform:scale(1.08);}
.deal-hero{background:var(--ps-color-surface);border:1.5px solid var(--ps-color-border);border-radius:8px;padding:22px;margin-top:20px;}
.deal-hero h1{font-size:24px;font-weight:800;margin-bottom:8px;}
.deal-metrics-row{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid var(--ps-color-border);border-radius:8px;overflow:hidden;margin-top:16px;}
.deal-met-cell{padding:14px 16px;border-right:1px solid var(--ps-color-border);background:var(--ps-color-surface-sunken);}
.deal-met-cell:last-child{border-right:none;}
.deal-side{position:sticky;top:80px;background:var(--ps-color-surface);border:1.5px solid var(--ps-color-border);border-radius:8px;padding:20px;}
.deal-side-cta{width:100%;padding:14px;border-radius:8px;font-weight:700;font-size:15px;background:var(--ps-primary);color:#fff;border:none;cursor:pointer;margin-top:12px;}
.deal-side-cta:disabled{opacity:.5;cursor:not-allowed;}
.deal-locked-note{font-size:13px;color:var(--ps-color-text-meta);line-height:1.5;margin-top:12px;}
.deal-docs{margin-top:20px;}
.deal-doc-item{padding:10px 12px;border:1px solid var(--ps-color-border);border-radius:6px;margin-bottom:8px;font-size:13px;}
.deal-back{color:var(--ps-color-text-secondary);text-decoration:none;font-size:13px;display:inline-block;margin-bottom:20px;}
.deal-back:hover{color:var(--ps-color-action-text);}
`;

export default function OffMarketDealDetail() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const token = useAccessToken();
  const [deal, setDeal] = useState(null);
  const [full, setFull] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUnlock, setShowUnlock] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const dealUnlockedParam = searchParams.get("deal_unlocked");
  const isUnlocked =
    full?.is_unlocked || deal?.is_unlocked || dealUnlockedParam === "1";

  const load = useCallback(async (signal) => {
    setLoading(true);
    try {
      const teaser = await fetchDealDetail(slug, token);
      if (signal?.aborted) return;
      setDeal(teaser);
      // Show the deal as soon as the basics arrive; the unlocked details and the deal room fill in after.
      setLoading(false);
      if (teaser.is_unlocked || dealUnlockedParam === "1") {
        if (token) {
          const unlocked = await fetchDealFull(slug, token);
          if (signal?.aborted) return;
          setFull(unlocked);
          if (unlocked.deal_room_id) {
            const r = await fetchDealRoom(unlocked.deal_room_id, token);
            if (signal?.aborted) return;
            setRoom(r);
          }
        }
      } else {
        setFull(null);
        setRoom(null);
      }
    } catch (e) {
      if (signal?.aborted) return;
      notify.error("Could not load deal");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [slug, token, dealUnlockedParam]);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  const handleUnlock = async () => {
    if (!token) {
      notify.info("Please sign in to unlock this deal");
      return;
    }
    setUnlockLoading(true);
    try {
      const res = await initiateDealUnlock(slug, token);
      if (res.detail === "already_unlocked") {
        notify.success("Already unlocked");
        setShowUnlock(false);
        load();
        return;
      }
      if (res.payment_url) {
        window.location.href = res.payment_url;
      }
    } catch (e) {
      notify.error(e.response?.data?.detail || "Unlock failed");
    } finally {
      setUnlockLoading(false);
    }
  };

  const display = full || deal;

  if (loading) {
    return (
      <div className="deal-detail-page" aria-busy="true">
        <div className="deal-detail-inner">
          <div style={{ height: 28, width: "40%", borderRadius: 8, background: "rgba(255,255,255,.06)", marginBottom: 16 }} />
          <div style={{ height: 260, borderRadius: 16, background: "rgba(255,255,255,.05)", marginBottom: 16 }} />
          <div style={{ height: 16, width: "70%", borderRadius: 6, background: "rgba(255,255,255,.05)", marginBottom: 10 }} />
          <div style={{ height: 16, width: "55%", borderRadius: 6, background: "rgba(255,255,255,.05)" }} />
        </div>
      </div>
    );
  }

  if (!display) {
    return (
      <div className="deal-detail-page">
        <div className="deal-detail-inner">
          <Link to="/deals" className="deal-back">
            ← Back to Deals
          </Link>
          <p>Deal not found.</p>
        </div>
      </div>
    );
  }

  const heroImg =
    isUnlocked && full?.gallery?.length
      ? full.gallery[0]
      : display.hero_image_blurred || display.hero_image;

  return (
    <>
      <style>{CSS}</style>
      <div className="deal-detail-page">
        <div className="deal-detail-inner">
          <Link to="/deals" className="deal-back">
            ← Back to Deals Home
          </Link>

          <div className="deal-detail-grid">
            <div>
              <div className="deal-gallery">
                <div className={`deal-gallery-main ${!isUnlocked ? "blurred" : ""}`}>
                  <DealImage src={heroImg} propertyClass={display.property_class} />
                </div>
              </div>

              <div className="deal-hero">
                <h1>{display.title || "Off-Market Deal"}</h1>
                <p style={{ color: "var(--ps-color-text-meta)", fontSize: 14 }}>
                  {isUnlocked && full?.full_address
                    ? full.full_address
                    : `${display.city}, ${display.state}`}
                  {display.beds ? ` · ${display.beds} beds` : ""}
                </p>
                {display.teaser_summary && (
                  <p style={{ marginTop: 12, color: "var(--ps-color-text-secondary)", lineHeight: 1.6 }}>
                    {display.teaser_summary}
                  </p>
                )}
                <div className="deal-metrics-row">
                  <div className="deal-met-cell">
                    <div style={{ fontSize: 10, color: "var(--ps-color-text-meta)", textTransform: "uppercase" }}>
                      ARV
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{formatMoney(display.arv)}</div>
                    <div style={{ fontSize: 10, color: "var(--ps-color-text-meta)" }}>Seller confirmed</div>
                  </div>
                  <div className="deal-met-cell">
                    <div style={{ fontSize: 10, color: "var(--ps-color-text-meta)", textTransform: "uppercase" }}>
                      Asking
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ps-color-action-text)" }}>
                      {formatMoney(display.asking_price)}
                    </div>
                  </div>
                  <div className="deal-met-cell">
                    <div style={{ fontSize: 10, color: "var(--ps-color-text-meta)", textTransform: "uppercase" }}>
                      Spread
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--ps-color-success)" }}>
                      {formatMoney(display.spread_amount)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--ps-color-success)" }}>
                      {Number(display.spread_pct).toFixed(0)}% below ARV
                    </div>
                  </div>
                </div>
              </div>

              {isUnlocked && full?.documents?.length > 0 && (
                <div className="deal-docs">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Documents</h3>
                  {full.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="deal-doc-item"
                      style={{ display: "block", color: "var(--ps-color-action-text)" }}
                    >
                      {doc.document_name || doc.document_type}
                    </a>
                  ))}
                </div>
              )}

              {isUnlocked && full && !(full.documents?.length > 0) && (
                <div className="deal-docs">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Documents</h3>
                  <p style={{ fontSize: 13, color: "var(--ps-color-text-secondary)", lineHeight: 1.5 }}>
                    The seller hasn&apos;t added documents or comps yet. Ask for them in the deal
                    room{full.gallery?.length ? "" : ", along with photos"}.
                  </p>
                </div>
              )}

              {isUnlocked && full?.gallery?.length > 1 && (
                <div className="deal-docs">
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Photos</h3>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {full.gallery.map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt=""
                          loading="lazy"
                          style={{ width: 96, height: 72, objectFit: "cover", borderRadius: 6 }}
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {isUnlocked && room && token && (
                <DealRoomPanel room={room} token={token} onUpdate={setRoom} />
              )}
            </div>

            <aside className="deal-side">
              <div style={{ fontSize: 11, color: "var(--ps-color-text-meta)", textTransform: "uppercase" }}>
                {display.deadline_type === "offers_due" ? "Offers due by" : "Close of escrow by"}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                {display.deadline_at
                  ? formatDay(display.deadline_at)
                  : "—"}
              </div>
              {display.days_left != null && (
                <div style={{ fontSize: 13, color: "var(--ps-color-warning)", marginTop: 4 }}>
                  {display.days_left} days left
                </div>
              )}

              <div style={{ marginTop: 16, fontSize: 13, color: "var(--ps-color-text-secondary)" }}>
                {slotsText(display)}
              </div>

              {display.is_owner ? (
                <p className="deal-locked-note">
                  This is your listing. Buyers who unlock it appear in your vendor portal under
                  NDAs &amp; Leads.
                </p>
              ) : !isUnlocked ? (
                <>
                  {display.my_unlock_status && (
                    <p className="deal-locked-note" role="status" style={{ color: "var(--ps-color-text)" }}>
                      {display.my_unlock_status === "refunded"
                        ? "You unlocked this deal earlier. It was cancelled and your unlock fee was refunded."
                        : "You unlocked this deal earlier, but its deal room was cancelled."}{" "}
                      <a href="/my-unlocks" style={{ color: "var(--ps-color-action-text)" }}>
                        See My Unlocks
                      </a>
                    </p>
                  )}
                  <button
                    type="button"
                    className="deal-side-cta"
                    disabled={display.is_slots_full}
                    onClick={() => setShowUnlock(true)}
                  >
                    {display.is_slots_full
                      ? "Slots Full"
                      : `Unlock from ${formatMoney(display.unlock_fee)}`}
                  </button>
                  <p className="deal-locked-note">
                    Full address, photos, comps and the deal room unlock after payment.{" "}
                    {unlockFeePolicy(display)}
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="deal-side-cta"
                    onClick={() =>
                      document.querySelector(".deal-room")?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Go to deal room ✓
                  </button>
                  <p className="deal-locked-note">
                    Message the seller and track escrow in the deal room below.
                  </p>
                </>
              )}
            </aside>
          </div>
        </div>
      </div>

      {showUnlock && (
        <UnlockDealModal
          deal={display}
          onClose={() => setShowUnlock(false)}
          onConfirm={handleUnlock}
          loading={unlockLoading}
        />
      )}
    </>
  );
}
