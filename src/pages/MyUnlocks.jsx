import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMyUnlocks, formatMoney } from "../api/offMarketDeals";
import { useAccessToken } from "../hooks/useAccessToken";

const PAGE_CSS = `
.mu-page{min-height:100vh;background:#0d0d10;color:#f0f0f4;font-family:'DM Sans',sans-serif;padding:24px 32px 80px;}
.mu-inner{max-width:960px;margin:0 auto;}
.mu-nav{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;}
.mu-nav a{font-size:13px;font-weight:600;color:#b0b0c0;text-decoration:none;padding:6px 12px;border-radius:6px;border:1px solid #2a2a33;}
.mu-nav a.active,.mu-nav a:hover{color:#f0318a;border-color:rgba(240,49,138,.35);}
.mu-hero{margin-bottom:28px;}
.mu-hero h1{font-size:28px;font-weight:800;letter-spacing:-.4px;margin-bottom:8px;}
.mu-hero h1 span{color:#f0318a;}
.mu-hero p{color:#66667a;font-size:14px;line-height:1.55;}
.mu-section{margin-bottom:32px;}
.mu-section h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#66667a;margin-bottom:14px;}
.mu-card{display:flex;gap:16px;background:#141418;border:1.5px solid #2a2a33;border-radius:10px;padding:16px;margin-bottom:12px;transition:border-color .15s;}
.mu-card:hover{border-color:rgba(240,49,138,.35);}
.mu-img{width:120px;height:88px;border-radius:8px;object-fit:cover;background:#1c1c22;flex-shrink:0;}
.mu-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;}
.mu-title{font-size:16px;font-weight:700;color:#f0f0f4;margin:0;}
.mu-meta{font-size:13px;color:#b0b0c0;}
.mu-metrics{display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#66667a;}
.mu-metrics strong{color:#f0f0f4;font-weight:700;}
.mu-metrics .green{color:#34d399;}
.mu-row{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:auto;padding-top:4px;}
.mu-pill{font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:.04em;}
.mu-pill.unlocked{background:rgba(52,211,153,.15);color:#34d399;}
.mu-pill.in_deal_room{background:rgba(240,49,138,.12);color:#f0318a;}
.mu-pill.closed{background:rgba(148,163,184,.15);color:#94a3b8;}
.mu-pill.pending_payment{background:rgba(251,191,36,.12);color:#fbbf24;}
.mu-cta{font-size:13px;font-weight:700;padding:8px 14px;border-radius:6px;background:#f0318a;color:#fff;text-decoration:none;}
.mu-cta:hover{background:#d4246f;color:#fff;}
.mu-empty{text-align:center;padding:60px 20px;color:#66667a;}
.mu-empty a{color:#f0318a;font-weight:600;}
.mu-loading,.mu-error{text-align:center;padding:40px;color:#66667a;}
.mu-error{color:#f87171;}
@media(max-width:640px){.mu-card{flex-direction:column}.mu-img{width:100%;height:140px}.mu-page{padding:16px}}
`;

const STATUS_LABEL = {
  unlocked: "Unlocked",
  in_deal_room: "In deal room",
  closed: "Closed",
  pending_payment: "Incomplete",
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
      const [paidRes, pendingRes] = await Promise.all([
        fetchMyUnlocks(token, "paid"),
        fetchMyUnlocks(token, "pending"),
      ]);
      setPaid(paidRes.results || []);
      setPending(pendingRes.results || []);
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
            <div className="mu-loading">Loading unlocks…</div>
          ) : error ? (
            <div className="mu-error">{error}</div>
          ) : (
            <>
              {pending.length > 0 && (
                <section className="mu-section">
                  <h2>Incomplete</h2>
                  {pending.map((item) => (
                    <UnlockCard key={item.unlock_id} item={item} />
                  ))}
                </section>
              )}

              <section className="mu-section">
                <h2>Unlocked deals</h2>
                {paid.length === 0 ? (
                  <div className="mu-empty">
                    <p>No unlocked deals yet.</p>
                    <p style={{ marginTop: 8 }}>
                      Browse <Link to="/deals">off-market deals</Link> to unlock your first listing.
                    </p>
                  </div>
                ) : (
                  paid.map((item) => <UnlockCard key={item.unlock_id} item={item} />)
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
