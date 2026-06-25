import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DealCard from "../components/deals/DealCard";
import DealFilterBar from "../components/deals/DealFilterBar";
import DealKpiBar from "../components/deals/DealKpiBar";
import DealProcessStrip from "../components/deals/DealProcessStrip";
import { fetchDealStats, fetchDealTags, fetchDeals } from "../api/offMarketDeals";
import { useAccessToken } from "../hooks/useAccessToken";

const PAGE_CSS = `
.deals-page{min-height:100vh;background:#0d0d10;color:#f0f0f4;font-family:'DM Sans',sans-serif;padding:24px 32px 80px;}
.deals-inner{max-width:1280px;margin:0 auto;}
.deals-hero{margin-bottom:28px;}
.deals-hero h1{font-size:32px;font-weight:800;letter-spacing:-.5px;margin-bottom:8px;}
.deals-hero h1 span{color:#f0318a;}
.deals-hero p{color:#66667a;font-size:15px;max-width:640px;line-height:1.55;}
.deals-nav{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap;}
.deals-nav a{font-size:13px;font-weight:600;color:#b0b0c0;text-decoration:none;padding:6px 12px;border-radius:6px;border:1px solid #2a2a33;}
.deals-nav a.active,.deals-nav a:hover{color:#f0318a;border-color:rgba(240,49,138,.35);}
.deals-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;}
.deals-empty{text-align:center;padding:60px 20px;color:#66667a;}
.deals-loading{text-align:center;padding:40px;color:#66667a;}
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

  const onTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <>
      <style>{PAGE_CSS}</style>
      <div className="deals-page">
        <div className="deals-inner">
          <nav className="deals-nav">
            <Link to="/deals" className="active">
              Deals Home
            </Link>
            <Link to="/category/residential-realestate">Residential RE</Link>
            <Link to="/my-ndas">My Unlocks</Link>
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
            <div className="deals-empty">
              <p>No off-market deals match your filters.</p>
              <Link to="/deals" style={{ color: "#f0318a" }}>
                Clear filters
              </Link>
            </div>
          ) : (
            <div className="deals-grid">
              {deals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
