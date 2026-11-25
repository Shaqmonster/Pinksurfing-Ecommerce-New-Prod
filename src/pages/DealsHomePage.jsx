import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageSEO from "../components/PageSEO";
import DealCard from "../components/deals/DealCard";
import DealFilterBar from "../components/deals/DealFilterBar";
import DealKpiBar from "../components/deals/DealKpiBar";
import DealProcessStrip from "../components/deals/DealProcessStrip";
import DealAlertSignup from "../components/deals/DealAlertSignup";
import { fetchDealStats, fetchDealTags, fetchDeals } from "../api/offMarketDeals";
import { useAccessToken } from "../hooks/useAccessToken";
import { VENDOR_PORTAL_BASE } from "../utils/envUrls";

const PAGE_CSS = `
.deals-page{min-height:100vh;background:var(--ps-bg,var(--ps-color-bg));color:var(--ps-color-text);font-family:var(--ps-font-sans),'Plus Jakarta Sans',sans-serif;padding:24px 16px 80px;}
.deals-inner{max-width:1280px;margin:0 auto;}
.deals-hero{margin-bottom:28px;}
.deals-hero h1{font-size:32px;font-weight:800;letter-spacing:-.5px;margin-bottom:8px;}
.deals-hero h1 span{color:var(--ps-color-action-text);}
.deals-hero p{color:var(--ps-color-text-meta);font-size:15px;max-width:640px;line-height:1.55;}
.deals-nav{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;}
.deals-nav a{font-size:13px;font-weight:600;color:var(--ps-color-text-secondary);text-decoration:none;padding:6px 12px;border-radius:6px;border:1px solid var(--ps-color-border);}
.deals-nav a.active,.deals-nav a:hover{color:var(--ps-color-action-text);border-color:rgba(151, 71, 255,.35);}
.deals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;}
.deals-empty{text-align:center;padding:60px 20px;color:var(--ps-color-text-meta);}
.deals-loading{text-align:center;padding:40px;color:var(--ps-color-text-meta);}
.deals-more{margin-top:20px;border:1.5px dashed var(--ps-color-border);border-radius:10px;padding:20px;text-align:center;color:var(--ps-color-text-secondary);}
.deals-more strong{display:block;color:var(--ps-color-text);font-size:15px;margin-bottom:6px;}
.deals-more a{color:var(--ps-color-action-text);font-weight:700;text-decoration:none;}
`;

export default function DealsHomePage() {
  const token = useAccessToken();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [propertyClass, setPropertyClass] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sort, setSort] = useState("spread_desc");

  useEffect(() => {
    fetchDealStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
    fetchDealTags()
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const loadDeals = useCallback(() => {
    setLoading(true);
    const params = { sort, page_size: 24 };
    if (propertyClass) params.property_class = propertyClass;
    selectedTags.forEach((t) => {
      if (!params.tags) params.tags = [];
      if (Array.isArray(params.tags)) params.tags.push(t);
    });
    fetchDeals(params, token)
      .then((data) => setDeals(data.results || []))
      .catch(() => setDeals([]))
      .finally(() => setLoading(false));
  }, [propertyClass, selectedTags, sort, token]);

  useEffect(() => {
    loadDeals();
  }, [loadDeals]);

  const hasFilters = Boolean(propertyClass) || selectedTags.length > 0;
  const clearFilters = () => {
    setPropertyClass("");
    setSelectedTags([]);
  };

  // Shown under a short (or empty) list so the page still invites buyers and sellers in.
  const moreDealsPrompt = (
    <div className="deals-more">
      <strong>More deals are on the way</strong>
      New off-market deals go live as sellers list them. Set up an alert below to hear about them first. Have a deal to sell?{" "}
      <a href={VENDOR_PORTAL_BASE} target="_blank" rel="noreferrer">
        List it on PinkSurfing
      </a>
    </div>
  );

  const onTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <>
      <PageSEO
        title="Off-market deals"
        description="Browse exclusive off-market investment deals on PinkSurfing — unlock listings and enter the deal room."
        path="/deals"
      />
      <style>{PAGE_CSS}</style>
      <div className="deals-page">
        <div className="deals-inner">
          <nav className="deals-nav">
            <Link to="/deals" className="active">
              Deals Home
            </Link>
            <Link to="/category/residential-realestate">Residential RE</Link>
            <Link to="/my-unlocks">My Unlocks</Link>
          </nav>

          <header className="deals-hero">
            <h1>
              Off-Market <span>Deals</span>
            </h1>
            <p>
              Exclusive investor deals — not on Zillow or Redfin. See ARV and spread before you
              unlock. Pay once, enter the deal room, close with PinkSurfing.
            </p>
          </header>

          <DealKpiBar stats={stats} loading={statsLoading} />
          <DealProcessStrip />

          <DealFilterBar
            propertyClass={propertyClass}
            onPropertyClassChange={setPropertyClass}
            selectedTags={selectedTags}
            onTagToggle={onTagToggle}
            sort={sort}
            onSortChange={setSort}
            availableTags={tags}
          />

          {loading ? (
            <div className="deals-loading">Loading deals…</div>
          ) : deals.length === 0 ? (
            hasFilters ? (
              <div className="deals-empty">
                <p>No off-market deals match your filters.</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  style={{ color: "var(--ps-color-action-text)", background: "none", border: "none", cursor: "pointer", marginTop: 10 }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              moreDealsPrompt
            )
          ) : (
            <>
              <div className="deals-grid">
                {deals.map((deal) => (
                  <DealCard key={deal.id} deal={deal} />
                ))}
              </div>
              {!hasFilters && deals.length < 6 && moreDealsPrompt}
            </>
          )}

          <DealAlertSignup token={token} />
        </div>
      </div>
    </>
  );
}
