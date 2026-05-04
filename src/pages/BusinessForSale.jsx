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
  IoArrowForwardOutline
} from "react-icons/io5";
import useCategoryProducts from "./categoryProducts/useCategoryProducts";

const DATA = [
  { id:1, title:"Healthcare bznes for sale", industry:"Healthcare", state:"Iowa", city:"Hyderabad", zip:"75201", asking:1000, revenue:0, ebitda:0, yrs:"3-5", emp:"11-50", owner:"Part-Time", growth:"↑ Growing", sale_type:"Asset Sale", fin:["Seller Financing"], trans:"90 Days", remote:true, smart:["owner-operator-friendly","strong-cash-flow"], tags:["Seller Financing"], desc:"Medical distribution business with existing hospital relationships." },
  { id:2, title:"revenue generating RPM and CCM company, EMR, website and developers", industry:"Healthcare", state:"California", city:"bakersfield", zip:"94105", asking:10000, revenue:0, ebitda:0, yrs:"1-3", emp:"11-50", owner:"Part-Time", growth:"↑ Growing", sale_type:"Asset Sale", fin:["SBA-Eligible"], trans:"6 Months+", remote:true, smart:["strong-cash-flow","ai-automatable"], tags:["SBA-Eligible"], desc:"Remote care management company with proprietary EMR and developer team." },
];

const fmt = (n) => {
  if (!n && n !== 0) return "—";
  if (typeof n === 'string') n = parseFloat(n.replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return "—";
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
  return "$" + n.toLocaleString();
};

const multi = (p, e) => {
  if (!p || !e) return "—";
  const pf = typeof p === 'string' ? parseFloat(p.replace(/[^0-9.]/g, '')) : p;
  const ef = typeof e === 'string' ? parseFloat(e.replace(/[^0-9.]/g, '')) : e;
  if (isNaN(pf) || isNaN(ef) || ef === 0) return "—";
  return (pf / ef).toFixed(1) + "x";
};

const smartLabel = (s) => {
  const m = {
    "owner-operator-friendly": "👤 OWNER-OPERATOR",
    "strong-cash-flow": "💸 STRONG CASH FLOW",
    "roll-up-candidate": "📈 ROLL-UP",
    "private-equity": "🏦 PE ADD-ON",
    "turnaround": "🔄 TURNAROUND",
    "ai-automatable": "🤖 AI-AUTOMATABLE",
    "undervalued": "📊 UNDERVALUED",
    "healthcare-compliance": "🏥 HC COMPLIANT",
  };
  return m[s] || s.toUpperCase();
};

const growthClass = (g) => {
  if (g && g.includes("↑")) return "text-green-500 bg-green-500/10 border-green-500/20";
  if (g && g.includes("↓")) return "text-red-500 bg-red-500/10 border-red-500/20";
  return "text-gray-500 bg-gray-500/10 border-gray-500/20";
};

const BusinessForSale = () => {
  const hook = useCategoryProducts();
  const { filteredProducts, loading } = hook;

  const [kw, setKw] = useState("");
  const [industry, setIndustry] = useState("");
  const [pmin, setPmin] = useState("");
  const [pmax, setPmax] = useState("");
  const [state, setState] = useState("");
  const [rmin, setRmin] = useState("");
  const [rmax, setRmax] = useState("");
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("");
  const [growth, setGrowth] = useState("");
  const [saleType, setSaleType] = useState("");
  
  const [isAdvOpen, setIsAdvOpen] = useState(false);
  const [emin, setEmin] = useState("");
  const [emax, setEmax] = useState("");
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
      yrs: getAttr("years operating") || "—",
      emp: getAttr("team size") || "—",
      growth: getAttr("growth trend") || "—",
      sale_type: getAttr("sale type") || "Asset Sale",
      remote: getAttr("remote") === "Yes",
      smart: (getAttr("smart match") || "").split(",").map(s => s.trim()).filter(Boolean),
      image: p.product_image1 || p.image,
      desc: p.product_description || p.description
    };
  };

  const toggleSmart = (id) => {
    const next = new Set(activeSmarts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActiveSmarts(next);
  };

  const toggleSave = (id) => {
    const next = new Set(saved);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSaved(next);
  };

  const runFilters = useCallback(() => {
    const baseData = filteredProducts.length > 0 ? filteredProducts.map(mapProduct) : DATA;
    
    let result = baseData.filter((l) => {
      if (kw && !l.title.toLowerCase().includes(kw.toLowerCase()) && !l.industry.toLowerCase().includes(kw.toLowerCase())) return false;
      if (industry && l.industry !== industry) return false;
      if (pmin && l.asking < parseFloat(pmin)) return false;
      if (pmax && l.asking > parseFloat(pmax)) return false;
      if (state && state !== "Any State" && l.state !== state) return false;
      if (rmin && l.revenue < parseFloat(rmin)) return false;
      if (rmax && l.revenue > parseFloat(rmax)) return false;
      if (growth && growth !== "Any Trend" && l.growth !== growth) return false;
      if (saleType && saleType !== "Any" && l.sale_type !== saleType) return false;
      if (emin && l.ebitda < parseFloat(emin)) return false;
      if (emax && l.ebitda > parseFloat(emax)) return false;
      
      if (activeSmarts.size > 0 && ![...activeSmarts].some((s) => l.smart.includes(s))) return false;
      
      return true;
    });

    if (sort === "price-asc") result.sort((a, b) => a.asking - b.asking);
    else if (sort === "price-desc") result.sort((a, b) => b.asking - a.asking);
    else if (sort === "revenue-desc") result.sort((a, b) => b.revenue - a.revenue);

    setDisplayData(result);
  }, [filteredProducts, kw, industry, pmin, pmax, state, rmin, rmax, growth, saleType, emin, emax, activeSmarts, sort]);

  useEffect(() => {
    runFilters();
  }, [runFilters]);

  return (
    <div className="min-h-screen bg-[#070707] text-white font-['Plus_Jakarta_Sans'] pt-24 selection:bg-pink-500/30">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        
        {/* Header Section */}
        <div className="mb-12">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-pink-500 mb-4 ml-1">Pinksurfing Marketplace</div>
          <div className="flex items-center gap-4 mb-4">
            <IoBusinessOutline className="text-4xl text-gray-400" />
            <h1 className="text-6xl sm:text-7xl font-black tracking-[-0.05em] uppercase font-['Syne'] leading-none">
              Business for Sale
            </h1>
          </div>
          <p className="text-gray-500 max-w-xl text-sm font-medium leading-relaxed ml-1">
            Acquire established, cash-flowing businesses across every industry. Filtered and verified opportunities for strategic acquirers.
          </p>
        </div>

        {/* Search Panel - Modern Stealth Design */}
        <div className="bg-[#121212] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden mb-12">
          <div className="p-8 space-y-8">
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-6 items-end">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Search</label>
                <div className="relative group">
                  <IoSearchSharp className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pink-500 transition-colors" />
                  <input 
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm focus:bg-white/[0.05] focus:border-white/20 outline-none transition-all placeholder:text-gray-700 font-medium"
                    placeholder="Industry, keyword, business name..."
                    value={kw}
                    onChange={(e) => setKw(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Industry</label>
                <select className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-5 text-sm outline-none appearance-none cursor-pointer hover:bg-white/[0.05] transition-all font-medium" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">All Industries</option>
                  <option>SaaS / Tech</option><option>Healthcare</option><option>E-commerce</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Asking Price</label>
                <div className="flex items-center gap-2">
                  <input className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-4 text-sm outline-none placeholder:text-gray-700 font-medium" placeholder="Min $" type="number" value={pmin} onChange={(e) => setPmin(e.target.value)} />
                  <span className="text-gray-800 font-bold">−</span>
                  <input className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-4 text-sm outline-none placeholder:text-gray-700 font-medium" placeholder="Max $" type="number" value={pmax} onChange={(e) => setPmax(e.target.value)} />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">State</label>
                <select className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-5 text-sm outline-none appearance-none cursor-pointer font-medium" value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="Any State">Any State</option><option>California</option><option>Texas</option><option>New York</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Annual Revenue</label>
                <div className="flex items-center gap-2">
                  <input className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-4 text-sm outline-none placeholder:text-gray-700 font-medium" placeholder="Min $" type="number" value={rmin} onChange={(e) => setRmin(e.target.value)} />
                  <span className="text-gray-800 font-bold">−</span>
                  <input className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-4 text-sm outline-none placeholder:text-gray-700 font-medium" placeholder="Max $" type="number" value={rmax} onChange={(e) => setRmax(e.target.value)} />
                </div>
              </div>

              <button onClick={runFilters} className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-pink-500/20">Search</button>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-8 border-t border-white/[0.03]">
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1 flex items-center gap-2"><IoLocationOutline className="text-pink-500" /> Zip Code</label>
                <input className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-5 text-sm outline-none font-medium placeholder:text-gray-700" placeholder="e.g. 90210" value={zip} onChange={(e) => setZip(e.target.value)} />
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Radius</label>
                <select className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-5 text-sm outline-none appearance-none cursor-pointer font-medium" value={radius} onChange={(e) => setRadius(e.target.value)}>
                  <option value="">Any Distance</option>
                  {[10, 25, 50, 100, 250, 500].map(r => (<option key={r} value={r}>{r} Miles</option>))}
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Growth Trend</label>
                <select className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-5 text-sm outline-none appearance-none cursor-pointer font-medium" value={growth} onChange={(e) => setGrowth(e.target.value)}>
                  <option value="Any Trend">Any Trend</option><option>↑ Growing</option><option>→ Stable</option>
                </select>
              </div>
              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">Sale Type</label>
                <select className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-4 px-5 text-sm outline-none appearance-none cursor-pointer font-medium" value={saleType} onChange={(e) => setSaleType(e.target.value)}>
                  <option value="Any">Any</option><option>Asset Sale</option><option>Stock Sale</option>
                </select>
              </div>
            </div>

            {/* Advanced Toggle */}
            <button onClick={() => setIsAdvOpen(!isAdvOpen)} className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-all pt-4">
              <IoFilterOutline className="text-pink-500" /> Advanced Filters
              {isAdvOpen ? <IoChevronUp className="text-xs" /> : <IoChevronDown className="text-xs" />}
            </button>
          </div>
        </div>

        {/* Smart Match Strips */}
        <div className="flex items-center gap-3 mb-16 overflow-x-auto no-scrollbar pb-2">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-600 mr-2 whitespace-nowrap">Smart Match:</span>
          {[
            { id: "owner-operator-friendly", label: "Owner-Operator", icon: "👤" },
            { id: "strong-cash-flow", label: "Strong Cash Flow", icon: "💸" },
            { id: "roll-up-candidate", label: "Roll-Up", icon: "📈" },
            { id: "private-equity", label: "PE Add-On", icon: "🏦" },
            { id: "turnaround", label: "Turnaround", icon: "🔄" },
            { id: "ai-automatable", label: "AI-Automatable", icon: "🤖" },
            { id: "undervalued", label: "Undervalued", icon: "📊" },
            { id: "healthcare-compliance", label: "HC Compliant", icon: "🏥" },
          ].map(s => (
            <button key={s.id} onClick={() => toggleSmart(s.id)} className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${activeSmarts.has(s.id) ? "bg-white text-black border-white" : "bg-[#111] border-white/5 text-gray-500 hover:border-white/20"}`}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Results Bar */}
        <div className="bg-[#111] rounded-3xl border border-white/5 p-6 mb-8 flex items-center justify-between">
          <div className="text-xs text-gray-500 font-medium tracking-tight">
            Showing <span className="text-white font-black">{displayData.length}</span> verified businesses
          </div>
          <div className="flex items-center gap-8">
            <div className="flex items-center bg-black rounded-xl p-1 border border-white/5">
              {["grid", "list", "liner"].map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] transition-all ${view === v ? "bg-[#222] text-purple-400" : "text-gray-600 hover:text-white"}`}>{v}</button>
              ))}
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.3em]">
              <span className="text-gray-600">Sort:</span>
              <select className="bg-transparent text-white outline-none cursor-pointer" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price-asc">Price Low</option>
                <option value="price-desc">Price High</option>
              </select>
            </div>
          </div>
        </div>

        {/* Grid Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {displayData.map((biz) => (
              <motion.div key={biz.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group bg-[#111] rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all duration-500 relative overflow-hidden">
                <div className="p-10 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest">{biz.industry}</div>
                    <button onClick={() => toggleSave(biz.id)} className="w-10 h-10 rounded-full bg-white/[0.03] flex items-center justify-center text-gray-600 hover:bg-pink-500/20 hover:text-pink-500 transition-all">
                      {saved.has(biz.id) ? <IoHeart className="text-pink-500" /> : <IoHeartOutline />}
                    </button>
                  </div>

                  <div className="text-4xl font-black text-pink-500 tracking-[-0.05em] font-['Syne'] mb-6 uppercase leading-none">
                    {fmt(biz.asking)}
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight leading-snug mb-2 group-hover:text-pink-400 transition-colors min-h-[3rem]">{biz.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-8">
                    <IoLocationOutline className="text-purple-500 text-sm" /> {biz.city}, {biz.state}
                  </div>

                  <div className="grid grid-cols-3 gap-1 p-1 bg-black rounded-2xl border border-white/5 mb-8">
                    <div className="bg-[#111] rounded-xl py-4 px-2 text-center space-y-1">
                      <div className="text-[11px] font-black text-white font-['Syne']">{fmt(biz.revenue)}</div>
                      <div className="text-[7px] font-black uppercase tracking-widest text-gray-600">Revenue</div>
                    </div>
                    <div className="bg-[#111] rounded-xl py-4 px-2 text-center space-y-1">
                      <div className="text-[11px] font-black text-white font-['Syne']">{fmt(biz.ebitda)}</div>
                      <div className="text-[7px] font-black uppercase tracking-widest text-gray-600">EBITDA</div>
                    </div>
                    <div className="bg-[#111] rounded-xl py-4 px-2 text-center space-y-1">
                      <div className="text-[11px] font-black text-white font-['Syne']">{multi(biz.asking, biz.ebitda)}</div>
                      <div className="text-[7px] font-black uppercase tracking-widest text-gray-600">Multiple</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/[0.03]">
                    <div className="flex gap-2">
                      <button className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white transition-all">
                        <IoAddOutline className="text-lg" />
                      </button>
                      <button className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-500">
                        <IoArrowForwardOutline />
                      </button>
                    </div>
                    <Link to={`/product/productDetail/${biz.slug}`} className="text-[9px] font-black uppercase tracking-[0.2em] text-pink-500 hover:text-white transition-colors">View Details →</Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default BusinessForSale;
