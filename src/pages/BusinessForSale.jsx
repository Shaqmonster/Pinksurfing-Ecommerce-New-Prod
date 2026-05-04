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

const BusinessForSale = () => {
  const hook = useCategoryProducts();
  const { filteredProducts } = hook;

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
      if (growth && growth !== "Any Trend" && l.growth !== growth) return false;
      if (saleType && saleType !== "Any" && l.sale_type !== saleType) return false;
      if (activeSmarts.size > 0 && ![...activeSmarts].some((s) => l.smart.includes(s))) return false;
      return true;
    });

    if (sort === "price-asc") result.sort((a, b) => a.asking - b.asking);
    else if (sort === "price-desc") result.sort((a, b) => b.asking - a.asking);
    setDisplayData(result);
  }, [filteredProducts, kw, industry, pmin, pmax, state, growth, saleType, activeSmarts, sort]);

  useEffect(() => {
    runFilters();
  }, [runFilters]);

  return (
    <div className="min-h-screen bg-[#070707] text-white font-['Plus_Jakarta_Sans'] pt-20 selection:bg-pink-500/30 relative">
      <div className="max-w-[1600px] mx-auto px-6 py-6 relative z-10">
        
        {/* Header Section */}
        <div className="mb-10">
          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-pink-500 mb-4 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-pink-500/30"></span>
            Pinksurfing Marketplace
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter uppercase font-['Syne'] leading-none">
            Business for Sale
          </h1>
        </div>

        {/* Search Panel */}
        <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 shadow-xl overflow-hidden mb-10">
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Search</label>
                <div className="relative">
                  <IoSearchSharp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 pl-9 pr-3 text-xs outline-none focus:bg-white/[0.06] transition-all font-medium" placeholder="Industry, name..." value={kw} onChange={(e) => setKw(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Industry</label>
                <select className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none font-medium appearance-none cursor-pointer" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                  <option value="">All Industries</option>
                  <option>Healthcare</option><option>Tech</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Asking Price</label>
                <div className="flex items-center gap-2">
                  <input className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none font-medium" placeholder="Min" value={pmin} onChange={(e) => setPmin(e.target.value)} />
                  <input className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none font-medium" placeholder="Max" value={pmax} onChange={(e) => setPmax(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">State</label>
                <select className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none font-medium appearance-none" value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="Any State">Any State</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Revenue</label>
                <input className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none font-medium" placeholder="Min" />
              </div>
              <button onClick={runFilters} className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-[9px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all">Search</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-white/[0.03]">
              <div className="space-y-2"><label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Zip Code</label><input className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none font-medium" placeholder="90210" value={zip} onChange={(e) => setZip(e.target.value)} /></div>
              <div className="space-y-2"><label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Radius</label><select className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none font-medium" value={radius} onChange={(e) => setRadius(e.target.value)}><option value="">Any</option><option>25 Miles</option></select></div>
              <div className="space-y-2"><label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Growth</label><select className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none font-medium" value={growth} onChange={(e) => setGrowth(e.target.value)}><option value="Any Trend">Any Trend</option><option>↑ Growing</option></select></div>
              <div className="space-y-2"><label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Sale Type</label><select className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none font-medium" value={saleType} onChange={(e) => setSaleType(e.target.value)}><option value="Any">Any</option></select></div>
            </div>

            {/* Advanced Toggle */}
            <button onClick={() => setIsAdvOpen(!isAdvOpen)} className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-all pt-2">
              <IoFilterOutline className="text-pink-500" /> Advanced Filters
              {isAdvOpen ? <IoChevronUp className="text-[10px]" /> : <IoChevronDown className="text-[10px]" />}
            </button>

            <AnimatePresence>
              {isAdvOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 mt-6 border-t border-white/5">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">EBITDA</label>
                      <div className="flex gap-2">
                        <input className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none" placeholder="Min" />
                        <input className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none" placeholder="Max" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Years Operating</label>
                      <select className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none"><option>Any</option></select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Team Size</label>
                      <select className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-2.5 px-3 text-xs outline-none"><option>Any</option></select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Qualifiers</label>
                      <div className="flex flex-wrap gap-1.5">
                        {["SBA", "Seller Fin", "Remote"].map(q => (
                          <button key={q} className="px-2 py-1 rounded-md bg-white/5 border border-white/5 text-[7px] font-black uppercase hover:bg-pink-500/10 hover:border-pink-500/30 transition-all">{q}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Smart Match Bar */}
        <div className="flex items-center gap-2 mb-12 overflow-x-auto no-scrollbar pb-1">
          <span className="text-[7px] font-black uppercase tracking-widest text-gray-600 mr-2">Smart Match:</span>
          {[
            { id: "owner-operator-friendly", label: "Owner-Operator", icon: "👤" },
            { id: "strong-cash-flow", label: "Strong Cash Flow", icon: "💸" },
            { id: "roll-up-candidate", label: "Roll-Up", icon: "📈" },
            { id: "private-equity", label: "PE Add-On", icon: "🏦" },
            { id: "turnaround", label: "Turnaround", icon: "🔄" },
            { id: "ai-automatable", label: "AI-Automatable", icon: "🤖" },
            { id: "undervalued", label: "Undervalued", icon: "📊" },
          ].map(s => (
            <button key={s.id} onClick={() => toggleSmart(s.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${activeSmarts.has(s.id) ? "bg-white text-black border-white" : "bg-[#111] border-white/5 text-gray-600 hover:border-white/15"}`}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence>
            {displayData.map((biz, idx) => (
              <motion.div key={biz.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="group bg-[#0c0c0c] rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden">
                <div className="p-5 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="px-3 py-1 rounded-md bg-white/5 text-white/40 text-[7px] font-black uppercase tracking-widest">{biz.industry}</div>
                    <button onClick={() => toggleSave(biz.id)} className="text-gray-700 hover:text-pink-500 transition-all">
                      {saved.has(biz.id) ? <IoHeart className="text-pink-500 text-sm" /> : <IoHeartOutline className="text-sm" />}
                    </button>
                  </div>
                  <div className="text-2xl font-black text-pink-500 tracking-tighter font-['Syne'] mb-4 uppercase">{fmt(biz.asking)}</div>
                  <h3 className="text-sm font-bold text-white tracking-tight mb-1 line-clamp-1 group-hover:text-pink-400 transition-colors">{biz.title}</h3>
                  <div className="flex items-center gap-1.5 text-[8px] text-gray-600 font-bold uppercase tracking-widest mb-6"><IoLocationOutline /> {biz.city}, {biz.state}</div>
                  
                  <div className="grid grid-cols-3 gap-1 bg-black/40 rounded-xl p-1 mb-6">
                    <div className="bg-[#111] rounded-lg py-3 text-center space-y-1">
                      <div className="text-[10px] font-black text-white font-['Syne']">{fmt(biz.revenue)}</div>
                      <div className="text-[6px] font-black uppercase tracking-widest text-gray-700">Revenue</div>
                    </div>
                    <div className="bg-[#111] rounded-lg py-3 text-center space-y-1 border-x border-white/5">
                      <div className="text-[10px] font-black text-white font-['Syne']">{fmt(biz.ebitda)}</div>
                      <div className="text-[6px] font-black uppercase tracking-widest text-gray-700">EBITDA</div>
                    </div>
                    <div className="bg-[#111] rounded-lg py-3 text-center space-y-1">
                      <div className="text-[10px] font-black text-white font-['Syne']">{fmt(biz.asking)}</div>
                      <div className="text-[6px] font-black uppercase tracking-widest text-gray-700">Multiple</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div className="flex gap-2">
                      <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-600 hover:bg-white/10 hover:text-white transition-all"><IoAddOutline /></button>
                      <button className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400"><IoArrowForwardOutline /></button>
                    </div>
                    <Link to={`/product/productDetail/${biz.slug}`} className="text-[8px] font-black uppercase tracking-widest text-pink-500 hover:text-white transition-colors">Details →</Link>
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
