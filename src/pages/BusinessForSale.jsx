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
    <div className="min-h-screen bg-[#070707] text-white font-['Plus_Jakarta_Sans'] pt-24 selection:bg-pink-500/30 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-pink-600/10 rounded-full blur-[150px] animate-pulse [animation-delay:2s]"></div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-8 relative z-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <div className="text-[10px] font-black uppercase tracking-[0.5em] text-pink-500 mb-6 ml-1 flex items-center gap-3">
            <span className="w-12 h-[1px] bg-pink-500/30"></span>
            Pinksurfing Marketplace
          </div>
          <div className="flex items-center gap-6 mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl shadow-purple-500/10">
              <IoBusinessOutline className="text-4xl text-white" />
            </div>
            <h1 className="text-6xl sm:text-8xl font-black tracking-[-0.06em] uppercase font-['Syne'] leading-none text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              Business for Sale
            </h1>
          </div>
          <p className="text-gray-400 max-w-2xl text-base font-medium leading-relaxed ml-1 opacity-80">
            Acquire established, cash-flowing businesses across every industry. Filtered and verified opportunities for strategic acquirers.
          </p>
        </motion.div>

        {/* Search Panel - Modern Stealth Design */}
        <div className="bg-[#0c0c0c]/80 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden mb-16">
          <div className="p-10 space-y-10">
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr_1.2fr_1fr_1.2fr_auto] gap-8 items-end">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          <AnimatePresence>
            {displayData.map((biz, idx) => (
              <motion.div 
                key={biz.id} 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="group bg-[#090909] rounded-[3rem] border border-white/5 hover:border-purple-500/40 transition-all duration-700 relative overflow-hidden shadow-2xl hover:shadow-purple-500/10"
              >
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-transparent to-pink-600/0 group-hover:from-purple-600/5 group-hover:to-pink-600/5 transition-all duration-700 opacity-0 group-hover:opacity-100"></div>

                <div className="p-10 flex flex-col h-full relative z-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="px-4 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 text-white/60 text-[8px] font-black uppercase tracking-[0.2em] group-hover:border-purple-500/30 transition-colors">{biz.industry}</div>
                    <button onClick={() => toggleSave(biz.id)} className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-600 hover:bg-pink-500/20 hover:text-pink-500 transition-all active:scale-90">
                      {saved.has(biz.id) ? <IoHeart className="text-xl text-pink-500" /> : <IoHeartOutline className="text-xl" />}
                    </button>
                  </div>

                  <div className="text-5xl font-black text-pink-500 tracking-[-0.07em] font-['Syne'] mb-6 uppercase leading-none drop-shadow-2xl">
                    {fmt(biz.asking)}
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight leading-snug mb-3 group-hover:text-purple-400 transition-colors min-h-[3.5rem] line-clamp-2">{biz.title}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-[0.1em] mb-10 opacity-60">
                    <IoLocationOutline className="text-pink-500 text-base" /> {biz.city}, {biz.state}
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 mb-10 group-hover:border-white/10 transition-colors">
                    <div className="bg-white/[0.02] rounded-xl py-5 px-2 text-center space-y-2 border border-transparent group-hover:border-white/5">
                      <div className="text-[13px] font-black text-white font-['Syne'] tracking-tighter">{fmt(biz.revenue)}</div>
                      <div className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-600">Revenue</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl py-5 px-2 text-center space-y-2 border border-transparent group-hover:border-white/5">
                      <div className="text-[13px] font-black text-white font-['Syne'] tracking-tighter">{fmt(biz.ebitda)}</div>
                      <div className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-600">EBITDA</div>
                    </div>
                    <div className="bg-white/[0.02] rounded-xl py-5 px-2 text-center space-y-2 border border-transparent group-hover:border-white/5">
                      <div className="text-[13px] font-black text-white font-['Syne'] tracking-tighter">{multi(biz.asking, biz.ebitda)}</div>
                      <div className="text-[7px] font-black uppercase tracking-[0.2em] text-gray-600">Multiple</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-8 border-t border-white/5">
                    <div className="flex gap-3">
                      <button className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 hover:text-white transition-all active:scale-95 shadow-xl">
                        <IoAddOutline className="text-2xl" />
                      </button>
                      <button className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600/10 to-pink-600/10 border border-white/5 flex items-center justify-center text-purple-400 hover:brightness-125 transition-all active:scale-95 shadow-xl">
                        <IoArrowForwardOutline className="text-xl" />
                      </button>
                    </div>
                    <Link to={`/product/productDetail/${biz.slug}`} className="px-6 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 hover:text-white transition-all shadow-2xl">View Details</Link>
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
