import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  IoSearchSharp, 
  IoChevronDown, 
  IoChevronUp, 
  IoFilterOutline, 
  IoHeartOutline, 
  IoHeart, 
  IoLocationOutline, 
  IoBusinessOutline,
  IoAddOutline,
  IoArrowForwardOutline,
  IoGridOutline,
  IoListOutline,
  IoMenuOutline
} from "react-icons/io5";
import useCategoryProducts from "./categoryProducts/useCategoryProducts";

// Smart tag labels must match exactly what the vendor wizard saves (SMART_TAG_DEFS labels)
const SMART_TAG_OPTIONS = [
  "Absentee-Run",
  "SBA Pre-Qualified",
  "Recurring Revenue",
  "B2B",
  "B2C",
  "IP / Assets Included",
];

const fmt = (n) => {
  if (!n && n !== 0) return "—";
  if (typeof n === 'string') n = parseFloat(n.replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return "—";
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
  return "$" + n.toLocaleString();
};

const GROWTH_TREND_OPTIONS = ["Declining", "Flat", "Moderate growth", "High growth", "Up", "Neutral", "Down"];
const SALE_TYPE_OPTIONS = ["Asset Sale", "Stock Sale", "Merger", "Other"];

const BusinessForSale = () => {
  const hook = useCategoryProducts();
  const { filteredProducts, loading } = hook;

  const [kw, setKw] = useState("");
  const [industry, setIndustry] = useState("");
  const [pmin, setPmin] = useState("");
  const [pmax, setPmax] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [zip, setZip] = useState("");
  const [growth, setGrowth] = useState("");
  const [saleType, setSaleType] = useState("");
  const [revMin, setRevMin] = useState("");
  const [revMax, setRevMax] = useState("");

  const [isAdvOpen, setIsAdvOpen] = useState(false);
  const [activeSmarts, setActiveSmarts] = useState(new Set());
  const [displayData, setDisplayData] = useState([]);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");

  const mapProduct = (p) => {
    const attrs = p.product_attributes || p.attributes || [];
    const getAttr = (...names) => {
      for (const name of names) {
        const found = attrs.find(a => a.name?.toLowerCase() === name.toLowerCase());
        if (found?.value) return found.value;
      }
      return "";
    };
    return {
      id: p.id,
      slug: p.slug || p.id,
      title: p.product_name || p.name,
      industry: p.subcategory?.name || "Other",
      state: getAttr("state") || p.state || "",
      city: getAttr("city") || p.city || "",
      zip: getAttr("zip", "zip_code") || p.zip_code || "",
      asking: parseFloat(p.unit_price) || 0,
      revenue: parseFloat(getAttr("revenue", "annual revenue", "annual_revenue")) || 0,
      ebitda: parseFloat(getAttr("ebitda")) || 0,
      multi: parseFloat(getAttr("ebitda multiple")) || (parseFloat(p.unit_price) / (parseFloat(getAttr("ebitda")) || 1)).toFixed(1),
      remote: getAttr("remote")?.toLowerCase() === "yes",
      smart: (() => {
        const v = getAttr("smart_tags");
        if (!v) return [];
        if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
        return String(v).split(",").map(s => s.trim()).filter(Boolean);
      })(),
      tags: (() => {
        const v = getAttr("tags");
        if (!v) return [];
        if (Array.isArray(v)) return v.map(s => String(s).trim()).filter(Boolean);
        return String(v).split(",").map(s => s.trim()).filter(Boolean);
      })(),
      growth: getAttr("growth_trend", "growth trend", "growth") || "",
      saleType: getAttr("sale_type", "sale type") || "",
      desc: p.product_description || p.description || "",
    };
  };

  // Derive unique industries and states from real data for dropdowns
  const allMapped = filteredProducts.map(mapProduct);
  const industryOptions = [...new Set(allMapped.map(l => l.industry).filter(Boolean))].sort();
  const stateOptions = [...new Set(allMapped.map(l => l.state).filter(v => v && v !== "—"))].sort();

  const toggleSmart = (tag) => {
    const next = new Set(activeSmarts);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    setActiveSmarts(next);
  };

  const runFilters = useCallback(() => {
    const baseData = filteredProducts.map(mapProduct);
    let result = baseData.filter((l) => {
      if (kw && !l.title.toLowerCase().includes(kw.toLowerCase()) && !l.industry.toLowerCase().includes(kw.toLowerCase()) && !l.desc.toLowerCase().includes(kw.toLowerCase())) return false;
      if (industry && l.industry !== industry) return false;
      if (pmin && l.asking < parseFloat(pmin)) return false;
      if (pmax && l.asking > parseFloat(pmax)) return false;
      if (revMin && l.revenue < parseFloat(revMin)) return false;
      if (revMax && l.revenue > parseFloat(revMax)) return false;
      if (stateFilter === "__remote__" && !l.remote) return false;
      if (stateFilter && stateFilter !== "__remote__" && l.state.toLowerCase() !== stateFilter.toLowerCase()) return false;
      if (zip && !l.zip.startsWith(zip.trim())) return false;
      if (growth && l.growth.toLowerCase() !== growth.toLowerCase()) return false;
      if (saleType && l.saleType.toLowerCase() !== saleType.toLowerCase()) return false;
      if (activeSmarts.size > 0 && ![...activeSmarts].some((s) => l.smart.includes(s))) return false;
      return true;
    });
    if (sort === "price-desc") result.sort((a, b) => b.asking - a.asking);
    else if (sort === "price-asc") result.sort((a, b) => a.asking - b.asking);
    else result.sort((a, b) => b.asking - a.asking); // newest approx
    setDisplayData(result);
  }, [filteredProducts, kw, industry, pmin, pmax, revMin, revMax, stateFilter, zip, growth, saleType, activeSmarts, sort]);

  useEffect(() => {
    runFilters();
  }, [runFilters]);

  return (
    <div className="min-h-screen bg-[#070707] text-white font-['Plus_Jakarta_Sans',sans-serif] pt-16">
      <div className="max-w-[1800px] mx-auto px-8 py-4">
        
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mb-3">
            <span>Home</span> <span className="opacity-30">/</span> <span className="text-gray-300">Business for Sale</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <IoBusinessOutline className="text-3xl text-white/80" />
            <h1 className="text-4xl font-extrabold tracking-tight font-['Raleway',sans-serif]">Business for Sale</h1>
          </div>
          <p className="text-gray-500 text-xs">Acquire established businesses across every industry.</p>
        </div>

        {/* Unified Filter Panel */}
        <div className="bg-[#111] rounded-xl border border-white/5 shadow-2xl overflow-hidden mb-6">
          <div className="p-4 space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.2fr_1fr_1.2fr_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Search</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none focus:border-pink-500/50 transition-all font-medium" placeholder="Industry, keyword, business name..." value={kw} onChange={(e) => setKw(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Industry</label>
                <select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none cursor-pointer" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">All Industries</option>
                  {industryOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Asking Price</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none focus:border-pink-500/50" placeholder="Min $" value={pmin} onChange={(e) => setPmin(e.target.value)} />
                  <span className="text-gray-700">−</span>
                  <input type="number" min="0" className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none focus:border-pink-500/50" placeholder="Max $" value={pmax} onChange={(e) => setPmax(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">State</label>
                <select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none cursor-pointer" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
                  <option value="">Any State</option>
                  {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Annual Revenue</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="0" className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none focus:border-pink-500/50" placeholder="Min $" value={revMin} onChange={(e) => setRevMin(e.target.value)} />
                  <span className="text-gray-700">−</span>
                  <input type="number" min="0" className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none focus:border-pink-500/50" placeholder="Max $" value={revMax} onChange={(e) => setRevMax(e.target.value)} />
                </div>
              </div>
              <button
                onClick={() => { setKw(""); setIndustry(""); setPmin(""); setPmax(""); setRevMin(""); setRevMax(""); setStateFilter(""); setZip(""); setGrowth(""); setSaleType(""); setActiveSmarts(new Set()); }}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 px-4 py-2.5 rounded-lg text-xs font-bold transition-all"
              >
                Clear
              </button>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr] gap-3 pt-4 border-t border-white/5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Search by Zip Code</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none focus:border-pink-500/50" placeholder="e.g. 90210" value={zip} onChange={(e) => setZip(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Remote Only</label>
                <select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none cursor-pointer" value={stateFilter === "__remote__" ? "__remote__" : ""} onChange={(e) => setStateFilter(e.target.value)}>
                  <option value="">All Listings</option>
                  <option value="__remote__">Remote Only</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Growth Trend</label>
                <select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none cursor-pointer" value={growth} onChange={(e) => setGrowth(e.target.value)}>
                  <option value="">Any Trend</option>
                  {GROWTH_TREND_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Sale Type</label>
                <select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none cursor-pointer" value={saleType} onChange={(e) => setSaleType(e.target.value)}>
                  <option value="">Any</option>
                  {SALE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Smart Match Strip */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2 border-b border-white/5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mr-2 whitespace-nowrap">Smart Match:</span>
          {SMART_TAG_OPTIONS.map(s => (
            <button key={s} onClick={() => toggleSmart(s)} className={`px-4 py-1.5 rounded-full border border-white/10 text-[10px] font-semibold whitespace-nowrap transition-all ${activeSmarts.has(s) ? "bg-[#e8237a] text-white border-[#e8237a]" : "bg-white/5 text-gray-400 hover:border-white/20"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Results Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-xs text-gray-500"><span className="text-white font-bold">{displayData.length}</span> businesses found</div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 text-[11px] font-medium text-gray-500">
              Sort: <select className="bg-transparent text-gray-200 outline-none border-none cursor-pointer" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest First</option>
                <option value="price-desc">Price High</option>
                <option value="price-asc">Price Low</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setView("grid")} className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${view === "grid" ? "border-[#e8237a] text-[#e8237a] bg-[#e8237a]/10" : "border-white/5 text-gray-500"}`}><IoGridOutline /></button>
              <button onClick={() => setView("list")} className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${view === "list" ? "border-[#e8237a] text-[#e8237a] bg-[#e8237a]/10" : "border-white/5 text-gray-500"}`}><IoListOutline /></button>
              <button onClick={() => setView("liner")} className={`w-8 h-8 rounded border flex items-center justify-center transition-all ${view === "liner" ? "border-[#e8237a] text-[#e8237a] bg-[#e8237a]/10" : "border-white/5 text-gray-500"}`}><IoMenuOutline /></button>
            </div>
          </div>
        </div>

        {/* Loading / Empty states */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 border-2 border-[#e8237a]/20 border-t-[#e8237a] rounded-full animate-spin" />
          </div>
        ) : displayData.length === 0 ? (
          <div className="text-center py-24">
            <IoBusinessOutline className="text-5xl text-white/20 mx-auto mb-4" />
            <p className="text-gray-400 font-semibold text-base">No listings found</p>
            <p className="text-gray-600 text-sm mt-1">Try adjusting your filters or check back soon.</p>
          </div>
        ) : null}

        {/* ── GRID view ── */}
        {view === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            <AnimatePresence>
              {!loading && displayData.map((biz) => (
                <motion.div key={biz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group bg-[#111] border border-white/10 rounded-lg hover:border-[#e8237a]/50 transition-all duration-300 shadow-xl overflow-hidden">
                  <Link to={`/product/productDetail/${biz.slug}${biz.id ? `?productId=${biz.id}` : ""}`} className="p-4 flex flex-col h-full cursor-pointer">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex flex-wrap gap-1">
                        <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold uppercase">{biz.industry}</div>
                        {biz.remote && <div className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-bold uppercase">Remote</div>}
                      </div>
                      <button className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-gray-600 hover:text-[#e8237a] hover:border-[#e8237a] transition-all" onClick={(e) => e.preventDefault()}>
                        <IoHeartOutline className="text-sm" />
                      </button>
                    </div>
                    <div className="text-2xl font-bold text-[#e8237a] tracking-tight font-['Raleway',sans-serif] mb-1">{fmt(biz.asking)}</div>
                    <h3 className="text-[13px] font-bold text-white leading-tight mb-2 line-clamp-2 h-[2.2rem] group-hover:text-[#e8237a] transition-colors">{biz.title}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mb-4">
                      <IoLocationOutline className="text-pink-500" /> {biz.city}, {biz.state}
                    </div>
                    <div className="grid grid-cols-3 gap-1 bg-white/[0.03] rounded p-2 mb-4">
                      <div className="text-center"><div className="text-[11px] font-bold text-white">{fmt(biz.revenue)}</div><div className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">Revenue</div></div>
                      <div className="text-center border-x border-white/5"><div className="text-[11px] font-bold text-white">{fmt(biz.ebitda)}</div><div className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">EBITDA</div></div>
                      <div className="text-center"><div className="text-[11px] font-bold text-white">{biz.multi}x</div><div className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">Multiple</div></div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {biz.smart.map(s => <div key={s} className="px-2 py-0.5 rounded bg-[#e8237a]/10 border border-[#e8237a]/20 text-[#e8237a] text-[8px] font-bold uppercase tracking-tighter">{s}</div>)}
                    </div>
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                      <div className="flex gap-1.5">
                        {biz.growth && <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-bold uppercase">{biz.growth}</div>}
                        {biz.saleType && <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 text-[8px] font-medium">{biz.saleType}</div>}
                      </div>
                      <span className="text-[10px] font-bold text-[#e8237a] flex items-center gap-1">View <IoArrowForwardOutline /></span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── LIST view (2 columns, more info) ── */}
        {view === "list" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {!loading && displayData.map((biz) => (
                <motion.div key={biz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group bg-[#111] border border-white/10 rounded-lg hover:border-[#e8237a]/50 transition-all duration-300 shadow-xl overflow-hidden">
                  <Link to={`/product/productDetail/${biz.slug}${biz.id ? `?productId=${biz.id}` : ""}`} className="p-5 flex gap-4 cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1 mb-2">
                        <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold uppercase">{biz.industry}</div>
                        {biz.remote && <div className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-bold uppercase">Remote</div>}
                        {biz.growth && <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-bold uppercase">{biz.growth}</div>}
                      </div>
                      <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 group-hover:text-[#e8237a] transition-colors">{biz.title}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-gray-500 mb-2">
                        <IoLocationOutline className="text-pink-500" /> {biz.city}, {biz.state}
                      </div>
                      {biz.desc && <p className="text-[11px] text-gray-600 line-clamp-2 mb-3">{biz.desc}</p>}
                      <div className="flex flex-wrap gap-1">
                        {biz.smart.map(s => <div key={s} className="px-2 py-0.5 rounded bg-[#e8237a]/10 border border-[#e8237a]/20 text-[#e8237a] text-[8px] font-bold uppercase">{s}</div>)}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end justify-between">
                      <div className="text-xl font-bold text-[#e8237a] font-['Raleway',sans-serif]">{fmt(biz.asking)}</div>
                      <div className="space-y-1 text-right mt-2">
                        <div className="text-[10px] text-gray-500">Rev: <span className="text-white font-semibold">{fmt(biz.revenue)}</span></div>
                        <div className="text-[10px] text-gray-500">EBITDA: <span className="text-white font-semibold">{fmt(biz.ebitda)}</span></div>
                        <div className="text-[10px] text-gray-500">Multiple: <span className="text-white font-semibold">{biz.multi}x</span></div>
                      </div>
                      <span className="text-[10px] font-bold text-[#e8237a] flex items-center gap-1 mt-3">View <IoArrowForwardOutline /></span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── LINER view (compact single-row table) ── */}
        {view === "liner" && (
          <div className="flex flex-col gap-1">
            {/* Header */}
            {!loading && displayData.length > 0 && (
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-gray-600 border-b border-white/5">
                <span>Business</span><span>Asking</span><span>Revenue</span><span>EBITDA</span><span>Multiple</span><span></span>
              </div>
            )}
            <AnimatePresence>
              {!loading && displayData.map((biz) => (
                <motion.div key={biz.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="group bg-[#111] border border-white/5 rounded-lg hover:border-[#e8237a]/30 transition-all">
                  <Link to={`/product/productDetail/${biz.slug}${biz.id ? `?productId=${biz.id}` : ""}`} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-4 py-3 items-center cursor-pointer">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[7px] font-bold uppercase">{biz.industry}</span>
                        {biz.remote && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[7px] font-bold uppercase">Remote</span>}
                      </div>
                      <p className="text-xs font-semibold text-white truncate group-hover:text-[#e8237a] transition-colors">{biz.title}</p>
                      <p className="text-[10px] text-gray-600 truncate">{biz.city}, {biz.state}</p>
                    </div>
                    <span className="text-sm font-bold text-[#e8237a]">{fmt(biz.asking)}</span>
                    <span className="text-xs text-white">{fmt(biz.revenue)}</span>
                    <span className="text-xs text-white">{fmt(biz.ebitda)}</span>
                    <span className="text-xs text-white">{biz.multi}x</span>
                    <span className="text-[10px] font-bold text-[#e8237a] flex items-center gap-1">View <IoArrowForwardOutline /></span>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessForSale;
