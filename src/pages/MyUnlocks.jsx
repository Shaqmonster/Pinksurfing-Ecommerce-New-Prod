import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyUnlocks, formatMoney } from "../api/offMarketDeals";
import { useAccessToken } from "../hooks/useAccessToken";

const PAGE_CSS = `
.mu-page{min-height:100vh;background:var(--ps-color-bg);color:var(--ps-color-text);font-family:'DM Sans',sans-serif;padding:24px 32px 80px;}
.mu-inner{max-width:960px;margin:0 auto;}
.mu-nav{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;}
.mu-nav a{font-size:13px;font-weight:600;color:var(--ps-color-text-secondary);text-decoration:none;padding:6px 12px;border-radius:6px;border:1px solid var(--ps-color-border);}
.mu-nav a.active,.mu-nav a:hover{color:var(--ps-color-action-text);border-color:rgba(151, 71, 255,.35);}
.mu-hero{margin-bottom:28px;}
.mu-hero h1{font-size:28px;font-weight:800;letter-spacing:-.4px;margin-bottom:8px;}
.mu-hero h1 span{color:var(--ps-color-action-text);}
.mu-hero p{color:var(--ps-color-text-meta);font-size:14px;line-height:1.55;}
.mu-section{margin-bottom:32px;}
.mu-section h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--ps-color-text-meta);margin-bottom:14px;}
.mu-card{display:flex;gap:16px;background:var(--ps-color-surface);border:1.5px solid var(--ps-color-border);border-radius:10px;padding:16px;margin-bottom:12px;transition:border-color .15s;}
.mu-card:hover{border-color:rgba(151, 71, 255,.35);}
.mu-img{width:120px;height:88px;border-radius:8px;object-fit:cover;background:var(--ps-color-surface-sunken);flex-shrink:0;}
.mu-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;}
.mu-title{font-size:16px;font-weight:700;color:var(--ps-color-text);margin:0;}
.mu-meta{font-size:13px;color:var(--ps-color-text-secondary);}
.mu-metrics{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:var(--ps-color-text-meta);}
.mu-metrics strong{color:var(--ps-color-text);font-weight:700;}
.mu-metrics .green{color:var(--ps-color-success);}
.mu-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:auto;padding-top:4px;}
.mu-pill{font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;}
.mu-pill.unlocked{background:rgba(52,211,153,.15);color:var(--ps-color-success);}
.mu-pill.in_deal_room{background:rgba(151, 71, 255,.12);color:var(--ps-color-action-text);}
.mu-pill.closed{background:rgba(148,163,184,.15);color:var(--ps-color-text-meta);}
.mu-pill.pending_payment{background:rgba(251,191,36,.12);color:var(--ps-color-warning);}
.mu-pill.refunded{background:rgba(56,189,248,.14);color:var(--ps-color-info);}
.mu-pill.cancelled{background:rgba(248,113,113,.14);color:var(--ps-color-danger);}
.mu-note{font-size:12px;color:var(--ps-color-text-secondary);margin:2px 0 0;}
.mu-tabs{display:flex;gap:8px;margin:0 0 20px;flex-wrap:wrap;}
.mu-tab{font-size:13px;font-weight:600;padding:7px 14px;border-radius:999px;border:1px solid var(--ps-color-border);background:transparent;color:var(--ps-color-text-secondary);cursor:pointer;}
.mu-tab[aria-selected="true"]{background:var(--ps-primary);border-color:var(--ps-primary);color:#fff;}
.mu-cta{font-size:13px;font-weight:700;padding:8px 14px;border-radius:6px;background:var(--ps-primary);color:#fff;text-decoration:none;}
.mu-cta:hover{background:#d4246f;color:#fff;}
.mu-empty{text-align:center;padding:60px 20px;color:var(--ps-color-text-meta);}
.mu-empty a{color:var(--ps-color-action-text);font-weight:600;}
.mu-loading,.mu-error{text-align:center;padding:40px;color:var(--ps-color-text-meta);}
.mu-error{color:var(--ps-color-danger);}
@media(max-width:640px){.mu-card{flex-direction:column}.mu-img{width:100%;height:140px}.mu-page{padding:16px}}
`;

const STATUS_LABEL = {
  unlocked: "Unlocked",
  in_deal_room: "In deal room",
  closed: "Closed",
  pending_payment: "Incomplete",
  refunded: "Refunded",
  cancelled: "Cancelled",
};

const ENDED_NOTE = {
  refunded: "The deal was cancelled and your unlock fee was refunded. It can take 5 to 10 business days to show.",
  cancelled: "This deal room was cancelled.",
};

function UnlockCard({ item }) {
  const slug = item.slug || item.product_id;
  const status = item.status || "unlocked";
  const cta =
    status === "in_deal_room" || status === "unlocked"
      ? "Enter deal room"
      : status === "pending_payment"
        ? "Complete unlock"
        : "View deal";

  return (
    <article className="mu-card">
      {item.hero_image ? (
        <img className="mu-img" src={item.hero_image} alt="" />
      ) : (
        <div className="mu-img" />
      )}
      <div className="mu-body">
        <h3 className="mu-title">{item.title || "Off-market deal"}</h3>
        <div className="mu-meta">
          {[item.city, item.state].filter(Boolean).join(", ") || "Location TBD"}
        </div>
        <div className="mu-metrics">
          {item.asking_price != null && (
            <span>
              Ask <strong>{formatMoney(item.asking_price)}</strong>
            </span>
          )}
          {item.arv != null && (
            <span>
              ARV <strong>{formatMoney(item.arv)}</strong>
            </span>
          )}
          {item.spread_amount != null && (
            <span>
              Spread <strong className="green">{formatMoney(item.spread_amount)}</strong>
            </span>
          )}
        </div>
        {ENDED_NOTE[status] && <p className="mu-note">{ENDED_NOTE[status]}</p>}
        <div className="mu-row">
          <span className={`mu-pill ${status}`}>{STATUS_LABEL[status] || status}</span>
          <Link className="mu-cta" to={`/deals/${slug}`}>
            {cta}
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function MyUnlocks() {
  const token = useAccessToken();
  const [paid, setPaid] = useState([]);
  const [pending, setPending] = useState([]);
  const [ended, setEnded] = useState([]);
  const [tab, setTab] = useState("all"); // all | active | ended
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [paidRes, pendingRes, endedRes] = await Promise.all([
        fetchMyUnlocks(token, "paid"),
        fetchMyUnlocks(token, "pending"),
        // Cancelled / refunded unlocks (older API versions ignore this and return the paid list).
        fetchMyUnlocks(token, "ended").catch(() => ({ results: [] })),
      ]);
      setPaid(paidRes.results || []);
      setPending(pendingRes.results || []);
      const paidIds = new Set((paidRes.results || []).map((i) => i.unlock_id));
      setEnded((endedRes.results || []).filter((i) => !paidIds.has(i.unlock_id)));
    } catch {
      setError("Could not load your unlocks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (!token && !loading) {
    return (
      <>
        <style>{PAGE_CSS}</style>
        <div className="mu-page">
          <div className="mu-inner">
            <div className="mu-empty">
              <p>Sign in to view your unlocked off-market deals.</p>
              <Link to="/signin">Sign in</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="mu-page">
        <div className="mu-inner">
          <nav className="mu-nav">
            <Link to="/deals">Deals Home</Link>
            <Link to="/my-unlocks" className="active">
              My Unlocks
            </Link>
            <Link to="/my-ndas">Business Financials</Link>
          </nav>

          <header className="mu-hero">
            <h1>
              My <span>Unlocks</span>
            </h1>
            <p>
              Off-market deals you&apos;ve unlocked. Open a deal to enter the deal room or finish an
              incomplete payment.
            </p>
          </header>

          {loading ? (
            <div className="mu-loading" aria-busy="true" aria-label="Loading unlocks" style={{ padding: 0 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{ height: 112, borderRadius: 12, background: "rgba(255,255,255,.05)", marginBottom: 12 }}
                />
              ))}
            </div>
          ) : error ? (
            <div className="mu-error">{error}</div>
          ) : (
            <>
              <div className="mu-tabs" role="tablist" aria-label="Filter unlocks">
                {[
                  ["all", "All"],
                  ["active", "Active"],
                  ["ended", "Cancelled & refunded"],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    className="mu-tab"
                    onClick={() => setTab(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab !== "ended" && pending.length > 0 && (
                <section className="mu-section">
                  <h2>Incomplete</h2>
                  {pending.map((item) => (
                    <UnlockCard key={item.unlock_id} item={item} />
                  ))}
                </section>
              )}

              {tab !== "ended" && (
              <section className="mu-section">
                <h2>Unlocked deals</h2>
                {paid.length === 0 ? (
                  <div className="mu-empty">
                    {ended.length > 0 || pending.length > 0 ? (
                      <>
                        <p>No active unlocks right now.</p>
                        <p style={{ marginTop: 8 }}>
                          Browse <Link to="/deals">off-market deals</Link> to unlock another listing.
                        </p>
                      </>
                    ) : (
                      <>
                        <p>No unlocked deals yet.</p>
                        <p style={{ marginTop: 8 }}>
                          Browse <Link to="/deals">off-market deals</Link> to unlock your first listing.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  paid.map((item) => <UnlockCard key={item.unlock_id} item={item} />)
                )}
              </section>
              )}

              {tab !== "active" && (ended.length > 0 || tab === "ended") && (
                <section className="mu-section">
                  <h2>Cancelled &amp; refunded</h2>
                  {ended.length === 0 ? (
                    <div className="mu-empty">
                      <p>No cancelled or refunded deals.</p>
                    </div>
                  ) : (
                    ended.map((item) => <UnlockCard key={item.unlock_id} item={item} />)
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
