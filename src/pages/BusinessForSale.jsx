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

const DATA = [
  { id:1, title:"Revenue-Generating RPM & CCM Company — EMR, Website & Dev Team", industry:"Healthcare", state:"TX", city:"Dallas", zip:"75201", asking:850000, revenue:420000, ebitda:180000, multi:4.7, remote:true, smart:["cash-flow","ai-auto","hc-compliant"], tags:["Seller Financing", "Recurring Rev", "Growing"], growth:"Growing" },
  { id:2, title:"SaaS HR Platform — 800+ MRR Customers, 78% Gross Margin", industry:"SaaS / Tech", state:"CA", city:"San Francisco", zip:"94105", asking:4200000, revenue:1800000, ebitda:620000, multi:6.8, remote:true, smart:["roll-up","cash-flow","ai-auto"], tags:["SBA-Eligible", "Recurring Rev", "High Margin"], growth:"Growing" },
  { id:3, title:"E-Commerce Pet Supplies Brand — Amazon FBA & DTC, $2.1M Revenue", industry:"E-Commerce", state:"FL", city:"Miami", zip:"33101", asking:1100000, revenue:2100000, ebitda:310000, multi:3.5, remote:true, smart:["owner-op","ai-auto","undervalued"], tags:["Seller Financing", "SBA-Eligible", "Growing"], growth:"Growing" },
  { id:4, title:"Regional HVAC Services — 22 Years Operating, Absentee Owner", industry:"Professional Services", state:"GA", city:"Atlanta", zip:"30301", asking:2800000, revenue:3400000, ebitda:580000, multi:4.8, remote:false, smart:["owner-op","cash-flow","roll-up"], tags:["Absentee Owner", "Multi-Location", "SBA-Eligible"], growth:"Stable" },
];

const fmt = (n) => {
  if (!n && n !== 0) return "—";
  if (typeof n === 'string') n = parseFloat(n.replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return "—";
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
  return "$" + n.toLocaleString();
};

const BusinessForSale = () => {
  const hook = useCategoryProducts();
  const { filteredProducts, loading } = hook;

  const [kw, setKw] = useState("");
  const [industry, setIndustry] = useState("");
  const [pmin, setPmin] = useState("");
  const [pmax, setPmax] = useState("");
  const [state, setState] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("");
  const [growth, setGrowth] = useState("");
  const [saleType, setSaleType] = useState("");
  
  const [isAdvOpen, setIsAdvOpen] = useState(false);
  const [activeSmarts, setActiveSmarts] = useState(new Set());
  const [saved, setSaved] = useState(new Set());
  const [displayData, setDisplayData] = useState([]);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");

  const mapProduct = (p) => {
    const attrs = p.product_attributes || p.attributes || [];
    const getAttr = (name) => attrs.find(a => a.name?.toLowerCase() === name.toLowerCase())?.value || "";
    return {
      id: p.id,
      slug: p.slug || p.id,
      title: p.product_name || p.name,
      industry: p.subcategory?.name || "Other",
      state: getAttr("state") || p.state || "—",
      city: getAttr("city") || p.city || "—",
      zip: getAttr("zip") || p.zip_code || "",
      asking: parseFloat(p.unit_price) || 0,
      revenue: parseFloat(getAttr("annual revenue")) || 0,
      ebitda: parseFloat(getAttr("ebitda")) || 0,
      multi: parseFloat(getAttr("ebitda multiple")) || (parseFloat(p.unit_price) / (parseFloat(getAttr("ebitda")) || 1)).toFixed(1),
      remote: getAttr("remote") === "Yes",
      smart: (getAttr("smart match") || "").split(",").map(s => s.trim()).filter(Boolean),
      tags: (getAttr("tags") || "").split(",").map(s => s.trim()).filter(Boolean),
      growth: getAttr("growth trend") || "Stable",
      desc: p.product_description || p.description
    };
  };

  const toggleSmart = (id) => {
    const next = new Set(activeSmarts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveSmarts(next);
  };

  const runFilters = useCallback(() => {
    const baseData = filteredProducts.length > 0 ? filteredProducts.map(mapProduct) : DATA;
    let result = baseData.filter((l) => {
      if (kw && !l.title.toLowerCase().includes(kw.toLowerCase()) && !l.industry.toLowerCase().includes(kw.toLowerCase())) return false;
      if (industry && l.industry !== industry) return false;
      if (pmin && l.asking < parseFloat(pmin)) return false;
      if (pmax && l.asking > parseFloat(pmax)) return false;
      if (activeSmarts.size > 0 && ![...activeSmarts].some((s) => l.smart.includes(s))) return false;
      return true;
    });
    if (sort === "price-desc") result.sort((a, b) => b.asking - a.asking);
    else if (sort === "price-asc") result.sort((a, b) => a.asking - b.asking);
    setDisplayData(result);
  }, [filteredProducts, kw, industry, pmin, pmax, activeSmarts, sort]);

  useEffect(() => {
    runFilters();
  }, [runFilters]);

  return (
    <div className="min-h-screen bg-[#070707] text-white font-['Plus_Jakarta_Sans'] pt-16">
      <div className="max-w-[1800px] mx-auto px-8 py-4">
        
        {/* Breadcrumb & Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mb-3">
            <span>Home</span> <span className="opacity-30">/</span> <span className="text-gray-300">Business for Sale</span>
          </div>
          <div className="flex items-center gap-4 mb-2">
            <IoBusinessOutline className="text-3xl text-white/80" />
            <h1 className="text-4xl font-extrabold tracking-tight font-['Syne']">Business for Sale</h1>
          </div>
          <p className="text-gray-500 text-xs">Acquire established businesses across every industry.</p>
        </div>

        {/* Unified Filter Panel */}
        <div className="bg-[#111] rounded-xl border border-white/5 shadow-2xl overflow-hidden mb-6">
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1.2fr_1fr_1.2fr_auto] gap-3 items-end">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Search</label>
                <input className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none focus:border-pink-500/50 transition-all font-medium" placeholder="Industry, keyword, business name..." value={kw} onChange={(e) => setKw(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Industry</label>
                <select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none cursor-pointer" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">All Industries</option>
                  <option>Healthcare</option><option>SaaS / Tech</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Asking Price</label>
                <div className="flex items-center gap-2">
                  <input className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none" placeholder="Min $" />
                  <span className="text-gray-700">−</span>
                  <input className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none" placeholder="Max $" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">State</label>
                <select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none"><option>Any State</option></select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Annual Revenue</label>
                <div className="flex items-center gap-2">
                  <input className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none" placeholder="Min $" />
                  <span className="text-gray-700">−</span>
                  <input className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none" placeholder="Max $" />
                </div>
              </div>
              <button className="bg-[#e8237a] hover:bg-[#c91d69] text-white px-6 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                <IoSearchSharp /> Search
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1.5fr_1.5fr] gap-3 pt-4 border-t border-white/5">
              <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Search by Zip Code</label><input className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none" placeholder="e.g. 90210" /></div>
              <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Radius</label><select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none"><option>Any Distance</option></select></div>
              <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Growth Trend</label><select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none"><option>Any Trend</option></select></div>
              <div className="space-y-1.5"><label className="text-[9px] font-bold uppercase tracking-widest text-gray-500 ml-1">Sale Type</label><select className="w-full bg-white/5 border border-white/5 rounded-lg py-2.5 px-3 text-xs outline-none"><option>Any</option></select></div>
            </div>

            <button onClick={() => setIsAdvOpen(!isAdvOpen)} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-all pt-2">
              <IoFilterOutline /> Advanced Filters {isAdvOpen ? <IoChevronUp /> : <IoChevronDown />}
            </button>
          </div>
        </div>

        {/* Smart Match Strip */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2 border-b border-white/5">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mr-2 whitespace-nowrap">Smart Match:</span>
          {["Owner-Operator", "Strong Cash Flow", "Roll-Up", "PE Add-On", "Turnaround", "AI-Automatable", "Undervalued", "HC Compliant"].map(s => (
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

        {/* Grid Display - 5 columns for density */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          <AnimatePresence>
            {displayData.map((biz) => (
              <motion.div key={biz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="group bg-[#111] border border-white/10 rounded-lg hover:border-[#e8237a]/50 transition-all duration-300 shadow-xl overflow-hidden">
                <div className="p-4 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-wrap gap-1">
                      <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-bold uppercase">{biz.industry}</div>
                      {biz.remote && <div className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-bold uppercase">Remote</div>}
                    </div>
                    <button className="w-8 h-8 rounded border border-white/10 flex items-center justify-center text-gray-600 hover:text-[#e8237a] hover:border-[#e8237a] transition-all">
                      <IoHeartOutline className="text-sm" />
                    </button>
                  </div>

                  <div className="text-2xl font-bold text-[#e8237a] tracking-tight font-['Syne'] mb-1">{fmt(biz.asking)}</div>
                  <h3 className="text-[13px] font-bold text-white leading-tight mb-2 line-clamp-2 h-[2.2rem] group-hover:text-[#e8237a] transition-colors">{biz.title}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium mb-4">
                    <IoLocationOutline className="text-pink-500" /> {biz.city}, {biz.state}
                  </div>

                  <div className="grid grid-cols-3 gap-1 bg-white/[0.03] rounded p-2 mb-4">
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-white">{fmt(biz.revenue)}</div>
                      <div className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">Revenue</div>
                    </div>
                    <div className="text-center border-x border-white/5">
                      <div className="text-[11px] font-bold text-white">{fmt(biz.ebitda)}</div>
                      <div className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">EBITDA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[11px] font-bold text-white">{biz.multi}x</div>
                      <div className="text-[7px] text-gray-500 uppercase font-bold tracking-widest">Multiple</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {biz.smart.map(s => (
                      <div key={s} className="px-2 py-0.5 rounded bg-[#e8237a]/10 border border-[#e8237a]/20 text-[#e8237a] text-[8px] font-bold uppercase tracking-tighter">
                        {s.replace("-", " ")}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                    <div className="flex gap-1.5">
                      {biz.tags.slice(0, 2).map(t => (
                        <div key={t} className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 text-[8px] font-medium">{t}</div>
                      ))}
                      <div className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-bold uppercase">{biz.growth}</div>
                    </div>
                    <Link to={`/product/productDetail/${biz.slug}`} className="text-[10px] font-bold text-[#e8237a] hover:underline flex items-center gap-1">View <IoArrowForwardOutline /></Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default BusinessForSale;
