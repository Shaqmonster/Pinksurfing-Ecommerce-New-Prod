import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import DealRoomPanel from "../components/deals/DealRoomPanel";
import UnlockDealModal from "../components/deals/UnlockDealModal";
import {
  fetchDealDetail,
  fetchDealFull,
  fetchDealRoom,
  formatMoney,
  initiateDealUnlock,
} from "../api/offMarketDeals";
import { useAccessToken } from "../hooks/useAccessToken";

const CSS = `
.deal-detail-page{min-height:100vh;background:#0d0d10;color:#f0f0f4;font-family:'DM Sans',sans-serif;padding:28px 32px 80px;}
.deal-detail-inner{max-width:1200px;margin:0 auto;}
.deal-detail-grid{display:grid;grid-template-columns:1fr 360px;gap:28px;align-items:start;}
@media(max-width:900px){.deal-detail-grid{grid-template-columns:1fr;}}
.deal-gallery{border-radius:12px;overflow:hidden;border:1px solid #2a2a33;background:#141418;}
.deal-gallery-main{aspect-ratio:16/9;position:relative;overflow:hidden;background:#1c1c22;}
.deal-gallery-main img{width:100%;height:100%;object-fit:cover;}
.deal-gallery-main.blurred img{filter:blur(12px);transform:scale(1.08);}
.deal-hero{background:#141418;border:1.5px solid #2a2a33;border-radius:8px;padding:22px;margin-top:20px;}
.deal-hero h1{font-size:24px;font-weight:800;margin-bottom:8px;}
.deal-metrics-row{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:1px solid #2a2a33;border-radius:8px;overflow:hidden;margin-top:16px;}
.deal-met-cell{padding:14px 16px;border-right:1px solid #2a2a33;background:#1c1c22;}
.deal-met-cell:last-child{border-right:none;}
.deal-side{position:sticky;top:80px;background:#141418;border:1.5px solid #2a2a33;border-radius:8px;padding:20px;}
.deal-side-cta{width:100%;padding:14px;border-radius:8px;font-weight:700;font-size:15px;background:#f0318a;color:#fff;border:none;cursor:pointer;margin-top:12px;}
.deal-side-cta:disabled{opacity:.5;cursor:not-allowed;}
.deal-locked-note{font-size:13px;color:#66667a;line-height:1.5;margin-top:12px;}
.deal-docs{margin-top:20px;}
.deal-doc-item{padding:10px 12px;border:1px solid #2a2a33;border-radius:6px;margin-bottom:8px;font-size:13px;}
.deal-back{color:#b0b0c0;text-decoration:none;font-size:13px;display:inline-block;margin-bottom:20px;}
.deal-back:hover{color:#f0318a;}
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

  const isUnlocked = full?.is_unlocked || deal?.is_unlocked || searchParams.get("deal_unlocked") === "1";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const teaser = await fetchDealDetail(slug, token);
      setDeal(teaser);
      if (teaser.is_unlocked || searchParams.get("deal_unlocked") === "1") {
        if (token) {
          const unlocked = await fetchDealFull(slug, token);
          setFull(unlocked);
          if (unlocked.deal_room_id) {
            const r = await fetchDealRoom(unlocked.deal_room_id, token);
            setRoom(r);
          }
        }
      } else {
        setFull(null);
        setRoom(null);
      }
    } catch (e) {
      toast.error("Could not load deal");
    } finally {
      setLoading(false);
    }
  }, [slug, token, searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUnlock = async () => {
    if (!token) {
      toast.info("Please sign in to unlock this deal");
      return;
    }
    setUnlockLoading(true);
    try {
      const res = await initiateDealUnlock(slug, token);
      if (res.detail === "already_unlocked") {
        toast.success("Already unlocked");
        setShowUnlock(false);
        load();
        return;
      }
      if (res.payment_url) {
        window.location.href = res.payment_url;
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Unlock failed");
    } finally {
      setUnlockLoading(false);
    }
  };

  const display = full || deal;

  if (loading) {
    return (
      <div className="deal-detail-page">
        <div className="deal-detail-inner">Loading…</div>
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
                  {heroImg ? (
                    <img src={heroImg} alt="" />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#232329" }} />
                  )}
                </div>
              </div>

              <div className="deal-hero">
                <h1>{display.title || "Off-Market Deal"}</h1>
                <p style={{ color: "#66667a", fontSize: 14 }}>
                  {isUnlocked && full?.full_address
                    ? full.full_address
                    : `${display.city}, ${display.state}`}
                  {display.beds ? ` · ${display.beds} beds` : ""}
                </p>
                {display.teaser_summary && (
                  <p style={{ marginTop: 12, color: "#b0b0c0", lineHeight: 1.6 }}>
                    {display.teaser_summary}
                  </p>
                )}
                <div className="deal-metrics-row">
                  <div className="deal-met-cell">
                    <div style={{ fontSize: 10, color: "#66667a", textTransform: "uppercase" }}>
                      ARV
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>{formatMoney(display.arv)}</div>
                    <div style={{ fontSize: 10, color: "#66667a" }}>Seller confirmed</div>
                  </div>
                  <div className="deal-met-cell">
                    <div style={{ fontSize: 10, color: "#66667a", textTransform: "uppercase" }}>
                      Asking
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#f0318a" }}>
                      {formatMoney(display.asking_price)}
                    </div>
                  </div>
                  <div className="deal-met-cell">
                    <div style={{ fontSize: 10, color: "#66667a", textTransform: "uppercase" }}>
                      Spread
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#34d399" }}>
                      {formatMoney(display.spread_amount)}
                    </div>
                    <div style={{ fontSize: 10, color: "#34d399" }}>
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
                      style={{ display: "block", color: "#f0318a" }}
                    >
                      {doc.document_name || doc.document_type}
                    </a>
                  ))}
                </div>
              )}

              {isUnlocked && room && token && (
                <DealRoomPanel room={room} token={token} onUpdate={setRoom} />
              )}
            </div>

            <aside className="deal-side">
              <div style={{ fontSize: 11, color: "#66667a", textTransform: "uppercase" }}>
                {display.deadline_type === "offers_due" ? "Offers due by" : "Close of escrow by"}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                {display.deadline_at
                  ? new Date(display.deadline_at).toLocaleDateString()
                  : "—"}
              </div>
              {display.days_left != null && (
                <div style={{ fontSize: 13, color: "#fbbf24", marginTop: 4 }}>
                  {display.days_left} days left
                </div>
              )}

              <div style={{ marginTop: 16, fontSize: 13, color: "#b0b0c0" }}>
                {display.slots_remaining ?? 0} / {display.max_unlock_slots} unlock slots open
              </div>

              {!isUnlocked ? (
                <>
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
                    Full address, photos, comps, and deal room unlock after payment. Fee credited
                    at close.
                  </p>
                </>
              ) : (
                <>
                  <button type="button" className="deal-side-cta" onClick={() => room && null}>
                    Deal Unlocked ✓
                  </button>
                  <p className="deal-locked-note">
                    Use the deal room below to negotiate and track escrow.
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
