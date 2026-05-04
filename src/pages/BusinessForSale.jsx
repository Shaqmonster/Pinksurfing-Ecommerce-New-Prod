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
  IoBusinessOutline 
} from "react-icons/io5";

const DATA = [
  { id:1, title:"Revenue-Generating RPM & CCM Company — EMR, Website & Dev Team", industry:"Healthcare", state:"TX", city:"Dallas", zip:"75201", asking:850000, revenue:420000, ebitda:180000, yrs:"3-5", emp:"11-50", owner:"Part-Time", growth:"↑ Growing", sale_type:"Asset Sale", fin:["Seller Financing"], trans:"90 Days", recurring:true, remote:true, multi:false, hfin:true, smart:["strong-cash-flow","ai-automatable","healthcare-compliance"], tags:["Seller Financing","Recurring Rev"], desc:"Established remote care management company with proprietary EMR, full developer team, active revenue contracts in RPM and CCM billing. Owner part-time. Transition support included." },
  { id:2, title:"SaaS HR Platform — 800+ MRR Customers, 78% Gross Margin", industry:"SaaS / Tech", state:"CA", city:"San Francisco", zip:"94105", asking:4200000, revenue:1800000, ebitda:620000, yrs:"5-10", emp:"11-50", owner:"Full-Time", growth:"↑ Growing", sale_type:"Stock Sale", fin:["SBA-Eligible"], trans:"6 Months+", recurring:true, remote:true, multi:false, hfin:true, smart:["roll-up-candidate","strong-cash-flow","ai-automatable"], tags:["SBA-Eligible","Recurring Rev","High Margin"], desc:"Profitable SaaS HR platform with enterprise contracts, documented SOPs, and senior engineering team retained through transition." },
  { id:3, title:"E-Commerce Pet Supplies Brand — Amazon FBA & DTC, $2.1M Revenue", industry:"E-commerce", state:"FL", city:"Miami", zip:"33101", asking:1100000, revenue:2100000, ebitda:310000, yrs:"3-5", emp:"1-10", owner:"Part-Time", growth:"↑ Growing", sale_type:"Asset Sale", fin:["Seller Financing","SBA-Eligible"], trans:"30 Days", recurring:false, remote:true, multi:false, hfin:true, smart:["owner-operator-friendly","ai-automatable","undervalued"], tags:["Seller Financing","SBA-Eligible"], desc:"Established Amazon FBA and Shopify brand in the pet category. AI-automated fulfillment and advertising. Part-time owner. Strong supplier relationships." },
  { id:4, title:"Regional HVAC Services — 22 Years Operating, Absentee Owner", industry:"Professional Services", state:"GA", city:"Atlanta", zip:"30301", asking:2800000, revenue:3400000, ebitda:580000, yrs:"10+", emp:"51-200", owner:"Absentee", growth:"→ Stable", sale_type:"Asset Sale", fin:["SBA-Eligible"], trans:"90 Days", recurring:true, remote:false, multi:true, hfin:true, smart:["owner-operator-friendly","strong-cash-flow","roll-up-candidate"], tags:["Absentee Owner","Multi-Location","SBA-Eligible"], desc:"Long-established HVAC contractor across 4 Georgia locations. Trained management team, recurring residential maintenance contracts, and clean books." },
  { id:5, title:"Digital Marketing Agency — $4.2M Revenue, 45% EBITDA Margin", industry:"Professional Services", state:"NY", city:"New York", zip:"10001", asking:6500000, revenue:4200000, ebitda:1890000, yrs:"10+", emp:"51-200", owner:"Full-Time", growth:"↑ Growing", sale_type:"Stock Sale", fin:[], trans:"6 Months+", recurring:true, remote:true, multi:false, hfin:true, smart:["private-equity","strong-cash-flow","roll-up-candidate"], tags:["Recurring Rev","High Margin"], desc:"Full-service digital agency with Fortune 500 enterprise retainer clients. Senior leadership team in place. Ideal platform for PE roll-up." },
  { id:6, title:"Fast Casual Restaurant Chain — 3 Locations, Franchise-Ready", industry:"Food & Beverage", state:"TX", city:"Austin", zip:"78701", asking:980000, revenue:2800000, ebitda:210000, yrs:"3-5", emp:"51-200", owner:"Full-Time", growth:"↑ Growing", sale_type:"Asset Sale", fin:["Seller Financing"], trans:"90 Days", recurring:false, remote:false, multi:true, hfin:true, smart:["roll-up-candidate","owner-operator-friendly"], tags:["Multi-Location","Seller Financing"], desc:"Growing fast-casual concept with 3 profitable Texas locations, documented franchise playbook, and consistent year-over-year revenue growth." },
  { id:7, title:"Medical Equipment Distributor — Motivated Seller, Undervalued", industry:"Healthcare", state:"IL", city:"Chicago", zip:"60601", asking:750000, revenue:1900000, ebitda:240000, yrs:"5-10", emp:"1-10", owner:"Part-Time", growth:"↓ Declining", sale_type:"Asset Sale", fin:["Seller Financing"], trans:"30 Days", recurring:true, remote:false, multi:false, hfin:true, smart:["undervalued","turnaround"], tags:["Motivated Seller","Seller Financing"], desc:"Established medical distribution business with existing hospital relationships. Revenue dip due to owner health — strong turnaround for an operator-buyer." },
  { id:8, title:"Amazon DSP Logistics Operation — 45 Vans, Guaranteed Route Volume", industry:"Logistics", state:"WA", city:"Seattle", zip:"98101", asking:1650000, revenue:3100000, ebitda:390000, yrs:"3-5", emp:"51-200", owner:"Part-Time", growth:"↑ Growing", sale_type:"Asset Sale", fin:["SBA-Eligible"], trans:"90 Days", recurring:true, remote:false, multi:false, hfin:true, smart:["strong-cash-flow","owner-operator-friendly"], tags:["SBA-Eligible","Recurring Rev"], desc:"Amazon Delivery Service Partner with 45 vans, trained driver workforce, and guaranteed route volume. Consistent YoY growth." },
];

import useCategoryProducts from "./categoryProducts/useCategoryProducts";

const FALLBACK_DATA = [
  { id:1, title:"Revenue-Generating RPM & CCM Company — EMR, Website & Dev Team", industry:"Healthcare", state:"TX", city:"Dallas", zip:"75201", asking:850000, revenue:420000, ebitda:180000, yrs:"3-5", emp:"11-50", owner:"Part-Time", growth:"↑ Growing", sale_type:"Asset Sale", fin:["Seller Financing"], trans:"90 Days", recurring:true, remote:true, multi:false, hfin:true, smart:["strong-cash-flow","ai-automatable","healthcare-compliance"], tags:["Seller Financing","Recurring Rev"], desc:"Established remote care management company with proprietary EMR, full developer team, active revenue contracts in RPM and CCM billing. Owner part-time. Transition support included." },
  // ... rest of hardcoded data kept for demo if needed
];

const fmt = (n) => {
  if (!n && n !== 0) return "—";
  if (typeof n === 'string') n = parseFloat(n.replace(/[^0-9.]/g, ''));
  if (isNaN(n)) return "—";
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + Math.round(n / 1000) + "K";
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
    "owner-operator-friendly": "👤 Owner-Op",
    "strong-cash-flow": "💸 Cash Flow",
    "roll-up-candidate": "📈 Roll-Up",
    "private-equity": "🏦 PE Add-On",
    turnaround: "🔄 Turnaround",
    "ai-automatable": "🤖 AI-Auto",
    undervalued: "📊 Undervalued",
    "healthcare-compliance": "🏥 HC Compliant",
  };
  return m[s] || s;
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
  const [yrs, setYrs] = useState("");
  const [emp, setEmp] = useState("");
  const [ownerInv, setOwnerInv] = useState("");
  const [transSupport, setTransSupport] = useState("");
  const [activePills, setActivePills] = useState(new Set());
  const [activeSmarts, setActiveSmarts] = useState(new Set());
  const [saved, setSaved] = useState(new Set());
  const [displayData, setDisplayData] = useState([]);
  const [sort, setSort] = useState("newest");

  // Map real products to Business format
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
      owner: getAttr("owner involvement") || "—",
      growth: getAttr("growth trend") || "—",
      sale_type: getAttr("sale type") || "Asset Sale",
      fin: getAttr("financing") ? [getAttr("financing")] : [],
      remote: getAttr("remote") === "Yes",
      smart: (getAttr("smart match") || "").split(",").map(s => s.trim()).filter(Boolean),
      image: p.product_image1 || p.image,
      desc: p.product_description || p.description
    };
  };

  const [view, setView] = useState("grid"); // grid, list, liner

  const togglePill = (id) => {
    const next = new Set(activePills);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActivePills(next);
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

  const clearFilter = (type) => {
    if (type === 'kw') setKw("");
    if (type === 'industry') setIndustry("");
    if (type === 'state') setState("");
    if (type === 'zip') { setZip(""); setRadius(""); }
    runFilters();
  };

  const runFilters = useCallback(() => {
    const baseData = filteredProducts.length > 0 ? filteredProducts.map(mapProduct) : DATA;
    
    let result = baseData.filter((l) => {
      if (kw && !l.title.toLowerCase().includes(kw.toLowerCase()) && !l.industry.toLowerCase().includes(kw.toLowerCase())) return false;
      if (industry && l.industry !== industry) return false;
      if (pmin && l.asking < parseFloat(pmin)) return false;
      if (pmax && l.asking > parseFloat(pmax)) return false;
      if (state && state !== "Remote / Online" && l.state !== state) return false;
      if (rmin && l.revenue < parseFloat(rmin)) return false;
      if (rmax && l.revenue > parseFloat(rmax)) return false;
      if (growth && l.growth !== growth) return false;
      if (saleType && l.sale_type !== saleType) return false;
      if (emin && l.ebitda < parseFloat(emin)) return false;
      if (emax && l.ebitda > parseFloat(emax)) return false;
      
      if (activePills.has("p-sfin") && !l.fin.includes("Seller Financing")) return false;
      if (activePills.has("p-sba") && !l.fin.includes("SBA-Eligible")) return false;
      if (activePills.has("p-remote") && !l.remote) return false;
      if (activePills.has("p-rec") && !l.recurring) return false;

      if (activeSmarts.size > 0 && ![...activeSmarts].some((s) => l.smart.includes(s))) return false;
      
      return true;
    });

    if (sort === "price-asc") result.sort((a, b) => a.asking - b.asking);
    else if (sort === "price-desc") result.sort((a, b) => b.asking - a.asking);
    else if (sort === "revenue-desc") result.sort((a, b) => b.revenue - a.revenue);

    setDisplayData(result);
  }, [filteredProducts, kw, industry, pmin, pmax, state, rmin, rmax, growth, saleType, emin, emax, activePills, activeSmarts, sort]);

  useEffect(() => {
    runFilters();
  }, [runFilters]);

  return (
    <div className="min-h-screen bg-[#0E0F13] text-white font-['Plus_Jakarta_Sans'] pt-24">
      <div className="max-w-[1800px] mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-500 mb-3">PinkSurfing Marketplace</div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4 font-['Syne']">🏢 Business for Sale</h1>
          <p className="text-gray-400 max-w-2xl font-medium leading-relaxed">
            Acquire established, cash-flowing businesses across every industry. 
            Filtered and verified opportunities for strategic acquirers.
          </p>
        </div>

        {/* Search Panel */}
        <div className="relative group bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden transition-all duration-500 hover:border-white/10 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px_250px_200px_250px_auto] gap-4 p-8 items-end border-b border-white/5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Search</label>
              <div className="relative">
                <IoSearchSharp className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:bg-white/10 focus:border-purple-500/50 outline-none transition-all"
                  placeholder="Industry, keyword, business name..."
                  value={kw}
                  onChange={(e) => setKw(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Industry</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none transition-all appearance-none cursor-pointer" value={industry} onChange={(e) => setIndustry(e.target.value)}>
                <option value="">All Industries</option>
                <option>SaaS / Tech</option><option>Healthcare</option><option>E-commerce</option><option>Retail</option>
                <option>Food & Beverage</option><option>Manufacturing</option><option>Professional Services</option><option>Logistics</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Asking Price</label>
              <div className="flex items-center gap-2">
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none" placeholder="Min $" type="number" value={pmin} onChange={(e) => setPmin(e.target.value)} />
                <span className="text-gray-600">−</span>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none" placeholder="Max $" type="number" value={pmax} onChange={(e) => setPmax(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">State</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none appearance-none cursor-pointer" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Any State</option><option>CA</option><option>NY</option><option>TX</option><option>FL</option><option>Remote / Online</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Annual Revenue</label>
              <div className="flex items-center gap-2">
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none" placeholder="Min $" type="number" value={rmin} onChange={(e) => setRmin(e.target.value)} />
                <span className="text-gray-600">−</span>
                <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none" placeholder="Max $" type="number" value={rmax} onChange={(e) => setRmax(e.target.value)} />
              </div>
            </div>

            <button onClick={runFilters} className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-white text-sm font-black uppercase tracking-widest transition-all">Search</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-8 bg-white/[0.01]">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><IoLocationOutline className="text-purple-500" /> ZIP Code</label>
              <input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none" placeholder="e.g. 90210" maxLength={5} value={zip} onChange={(e) => setZip(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Radius</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none appearance-none cursor-pointer" value={radius} onChange={(e) => setRadius(e.target.value)}>
                <option value="">Any Distance</option>
                {[1, 2, 5, 10, 15, 20, 25, 50, 100, 200, 500].map(r => (<option key={r} value={r}>Within {r} miles</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Growth Trend</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none appearance-none cursor-pointer" value={growth} onChange={(e) => setGrowth(e.target.value)}>
                <option value="">Any Trend</option><option>↑ Growing</option><option>→ Stable</option><option>↓ Declining</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sale Type</label>
              <select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none appearance-none cursor-pointer" value={saleType} onChange={(e) => setSaleType(e.target.value)}>
                <option value="">Any</option><option>Asset Sale</option><option>Stock Sale</option><option>Merger</option>
              </select>
            </div>
          </div>

          <div onClick={() => setIsAdvOpen(!isAdvOpen)} className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/5 transition-all border-t border-white/5">
            <div className="flex items-center gap-3 text-xs font-black uppercase tracking-widest text-gray-400"><IoFilterOutline className="text-purple-500" /> Advanced Filters</div>
            {isAdvOpen ? <IoChevronUp className="text-gray-600" /> : <IoChevronDown className="text-gray-600" />}
          </div>

          <AnimatePresence>
            {isAdvOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-white/[0.01] border-t border-white/5">
                <div className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="col-span-full border-b border-white/5 pb-2 mb-2"><span className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-500/50">Financials</span></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500">EBITDA Min</label><input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none" type="number" value={emin} onChange={(e) => setEmin(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500">EBITDA Max</label><input className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none" type="number" value={emax} onChange={(e) => setEmax(e.target.value)} /></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Years Operating</label><select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none" value={yrs} onChange={(e) => setYrs(e.target.value)}><option value="">Any</option><option>1-3</option><option>3-5</option><option>5-10</option><option>10+</option></select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Team Size</label><select className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm outline-none" value={emp} onChange={(e) => setEmp(e.target.value)}><option value="">Any</option><option>1-10</option><option>11-50</option><option>51-200</option><option>200+</option></select></div>
                  <div className="col-span-full mt-4"><label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 block">Qualifiers</label><div className="flex flex-wrap gap-3">
                      {[{ id: "p-sfin", label: "Seller Financing" }, { id: "p-sba", label: "SBA-Eligible" }, { id: "p-remote", label: "Remote / Online" }, { id: "p-multi", label: "Multi-Location" }, { id: "p-hfin", label: "Historical Financials" }, { id: "p-rec", label: "Recurring Revenue" }].map(pill => (
                        <button key={pill.id} onClick={() => togglePill(pill.id)} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${activePills.has(pill.id) ? "bg-purple-600 border-purple-500 text-white" : "bg-white/5 border-white/10 text-gray-400"}`}>{pill.label}</button>
                      ))}
                    </div></div>
                  <div className="col-span-full flex justify-end gap-4 mt-8 pt-6 border-t border-white/5">
                    <button onClick={() => { setEmin(""); setEmax(""); setYrs(""); setEmp(""); setActivePills(new Set()); }} className="px-6 py-2.5 text-xs font-black text-gray-500">Clear All</button>
                    <button onClick={() => { runFilters(); setIsAdvOpen(false); }} className="px-8 py-2.5 bg-white text-black rounded-xl text-xs font-black uppercase tracking-widest">Apply Filters</button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Smart Match Strip */}
        <div className="mb-12 overflow-x-auto no-scrollbar pb-4">
          <div className="flex items-center gap-4 min-w-max">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Smart Match:</span>
            {[
              { id: "owner-operator-friendly", label: "Owner-Operator", icon: "👤" },
              { id: "strong-cash-flow", label: "Strong Cash Flow", icon: "💸" },
              { id: "roll-up-candidate", label: "Roll-Up", icon: "📈" },
              { id: "private-equity", label: "PE Add-On", icon: "🏦" },
              { id: "turnaround", label: "Turnaround", icon: "🔄" },
              { id: "ai-automatable", label: "AI-Automatable", icon: "🤖" },
              { id: "undervalued", label: "Undervalued", icon: "📊" },
              { id: "healthcare-compliance", label: "HC Compliant", icon: "🏥" },
            ].map(smart => (
              <button key={smart.id} onClick={() => toggleSmart(smart.id)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeSmarts.has(smart.id) ? "bg-purple-600 border-purple-500 text-white" : "bg-white/[0.02] border-white/5 text-gray-400"}`}>
                <span>{smart.icon}</span>{smart.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Chips Row */}
        <div className="flex flex-wrap gap-2 mb-8">
          {kw && (
            <span className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest">
              "{kw}" <button onClick={() => clearFilter('kw')} className="hover:text-pink-500">×</button>
            </span>
          )}
          {industry && (
            <span className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest">
              {industry} <button onClick={() => clearFilter('industry')} className="hover:text-pink-500">×</button>
            </span>
          )}
          {state && (
            <span className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest">
              {state} <button onClick={() => clearFilter('state')} className="hover:text-pink-500">×</button>
            </span>
          )}
          {zip && radius && (
            <span className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest">
              📍 {zip} +{radius}mi <button onClick={() => clearFilter('zip')} className="hover:text-pink-500">×</button>
            </span>
          )}
          {[...activeSmarts].map(s => (
            <span key={s} className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest">
              {smartLabel(s)} <button onClick={() => toggleSmart(s)} className="hover:text-pink-500">×</button>
            </span>
          ))}
        </div>

        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 bg-white/[0.02] p-6 rounded-3xl border border-white/5">
          <div className="text-sm text-gray-400 font-medium font-['Syne']">
            Showing <span className="text-white font-bold">{displayData.length}</span> verified businesses
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center bg-white/5 p-1 rounded-2xl border border-white/5">
              {[
                { id: "grid", label: "Grid", icon: "⊞" },
                { id: "list", label: "List", icon: "≣" },
                { id: "liner", label: "Table", icon: "≡" },
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setView(v.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    view === v.id ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20" : "text-gray-500 hover:text-white"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 font-black uppercase tracking-widest">Sort:</span>
              <select 
                className="bg-transparent border-none text-xs font-black uppercase tracking-widest outline-none cursor-pointer text-white"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="newest" className="bg-[#0E0F13]">Newest</option>
                <option value="price-asc" className="bg-[#0E0F13]">Price Low</option>
                <option value="price-desc" className="bg-[#0E0F13]">Price High</option>
                <option value="revenue-desc" className="bg-[#0E0F13]">Revenue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listing Container */}
        <div className={`
          ${view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6' : ''}
          ${view === 'list' ? 'flex flex-col gap-4' : ''}
          ${view === 'liner' ? 'flex flex-col gap-2' : ''}
        `}>
          <AnimatePresence mode="popLayout">
            {displayData.map((biz, idx) => {
              if (view === "grid") return (
                <motion.div key={biz.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3, delay: idx * 0.05 }} className="group bg-white/[0.03] backdrop-blur-3xl rounded-[2rem] border border-white/5 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-2">
                  <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <div className="flex gap-2 mb-2">
                          <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest">{biz.industry}</span>
                          {biz.remote && <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest">🌐 Remote</span>}
                        </div>
                        <div className="text-2xl font-black text-pink-500 tracking-tighter font-['Syne']">{fmt(biz.asking)}</div>
                      </div>
                      <button onClick={() => toggleSave(biz.id)} className={`p-3 rounded-2xl transition-all ${saved.has(biz.id) ? "bg-pink-500/20 text-pink-500" : "bg-white/5 text-gray-500"}`}>
                        {saved.has(biz.id) ? <IoHeart className="text-lg" /> : <IoHeartOutline className="text-lg" />}
                      </button>
                    </div>
                    <h3 className="text-base font-black text-white tracking-tight leading-snug mb-3 group-hover:text-purple-400 transition-colors line-clamp-2 min-h-[3rem]">{biz.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-8"><IoLocationOutline className="text-purple-500" />{biz.city}, {biz.state}</div>
                    <div className="grid grid-cols-3 gap-2 p-4 bg-white/[0.02] rounded-2xl border border-white/5 mb-6 text-center">
                      <div className="space-y-1"><div className="text-[10px] font-black text-white/80 font-['Syne']">{fmt(biz.revenue)}</div><div className="text-[7px] font-black uppercase tracking-widest text-gray-500">Revenue</div></div>
                      <div className="space-y-1 border-x border-white/5 px-2"><div className="text-[10px] font-black text-white/80 font-['Syne']">{fmt(biz.ebitda)}</div><div className="text-[7px] font-black uppercase tracking-widest text-gray-500">EBITDA</div></div>
                      <div className="space-y-1 pl-2"><div className="text-[10px] font-black text-white/80 font-['Syne']">{multi(biz.asking, biz.ebitda)}</div><div className="text-[7px] font-black uppercase tracking-widest text-gray-500">Multiple</div></div>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <span className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${growthClass(biz.growth)}`}>{biz.growth}</span>
                      <Link to={`/product/productDetail/${biz.slug}`} className="text-[9px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">View Details →</Link>
                    </div>
                  </div>
                </motion.div>
              );

              if (view === "list") return (
                <motion.div key={biz.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="group flex bg-white/[0.03] backdrop-blur-3xl rounded-3xl border border-white/5 hover:border-purple-500/30 transition-all duration-300 p-6 gap-8">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-3">
                      <span className="px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-widest">{biz.industry}</span>
                      <span className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${growthClass(biz.growth)}`}>{biz.growth}</span>
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight mb-2 group-hover:text-purple-400 transition-colors font-['Syne']">{biz.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-6"><IoLocationOutline className="text-purple-500" />{biz.city}, {biz.state}</div>
                    <div className="flex gap-12">
                      <div className="space-y-1"><div className="text-lg font-black text-white font-['Syne']">{fmt(biz.revenue)}</div><div className="text-[8px] font-black uppercase tracking-widest text-gray-500">Annual Revenue</div></div>
                      <div className="space-y-1"><div className="text-lg font-black text-white font-['Syne']">{fmt(biz.ebitda)}</div><div className="text-[8px] font-black uppercase tracking-widest text-gray-500">Annual EBITDA</div></div>
                      <div className="space-y-1"><div className="text-lg font-black text-white font-['Syne']">{multi(biz.asking, biz.ebitda)}</div><div className="text-[8px] font-black uppercase tracking-widest text-gray-500">Multiple</div></div>
                    </div>
                  </div>
                  <div className="w-[200px] border-l border-white/5 pl-8 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Asking Price</div>
                      <div className="text-2xl font-black text-pink-500 tracking-tighter font-['Syne']">{fmt(biz.asking)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleSave(biz.id)} className={`p-3 rounded-2xl transition-all ${saved.has(biz.id) ? "bg-pink-500/20 text-pink-500" : "bg-white/5 text-gray-500"}`}>
                        {saved.has(biz.id) ? <IoHeart className="text-lg" /> : <IoHeartOutline className="text-lg" />}
                      </button>
                      <Link to={`/product/productDetail/${biz.slug}`} className="flex-1 py-3 bg-white text-black rounded-2xl text-[9px] font-black uppercase tracking-widest text-center">View Details</Link>
                    </div>
                  </div>
                </motion.div>
              );

              // 1-LINER (Table View)
              return (
                <motion.div key={biz.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group grid grid-cols-[30px_1fr_150px_120px_120px_100px_150px_100px] items-center gap-4 bg-white/[0.01] hover:bg-white/[0.05] border border-white/5 rounded-xl px-6 py-4 transition-all">
                  <button onClick={() => toggleSave(biz.id)} className={`${saved.has(biz.id) ? "text-pink-500" : "text-gray-700 hover:text-gray-500"}`}>
                    {saved.has(biz.id) ? <IoHeart /> : <IoHeartOutline />}
                  </button>
                  <div className="text-xs font-bold text-white truncate pr-4">{biz.title}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 truncate">{biz.industry}</div>
                  <div className="text-xs font-black text-pink-500 font-['Syne']">{fmt(biz.asking)}</div>
                  <div className="text-xs font-bold text-gray-300 font-['Syne']">{fmt(biz.revenue)}</div>
                  <div className="text-xs font-bold text-gray-300 font-['Syne']">{multi(biz.asking, biz.ebitda)}</div>
                  <div className="text-[10px] font-medium text-gray-500 truncate">📍 {biz.city}, {biz.state}</div>
                  <Link to={`/product/productDetail/${biz.slug}`} className="text-[9px] font-black uppercase tracking-widest text-purple-400 hover:text-white transition-colors">View →</Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {displayData.length === 0 && (
          <div className="py-32 text-center">
            <IoBusinessOutline className="text-7xl text-white/5 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
            <button onClick={() => { setKw(""); setIndustry(""); setPmin(""); setPmax(""); setEmin(""); setEmax(""); setActivePills(new Set()); setActiveSmarts(new Set()); }} className="mt-8 px-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest">Reset All Filters</button>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default BusinessForSale;
