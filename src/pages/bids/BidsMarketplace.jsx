import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import {
  IoSearchSharp,
  IoClose,
  IoCamera,
  IoTimeOutline,
  IoCalendarOutline,
  IoMapOutline,
  IoArrowForward,
  IoAlertCircle,
  IoSparkles,
  IoChevronDown,
  IoChevronUp,
  IoFilterSharp,
  IoAdd,
  IoNavigateCircleOutline,
  IoRefresh,
} from "react-icons/io5";
import {
  FaTag,
  FaDollarSign,
  FaCheck,
  FaShieldAlt,
  FaCheckCircle,
  FaSort,
  FaGavel,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { getOpenRequests } from "../../api/buyerRequests";

// ─── Filter Data (from bidding/src/components/marketplace/filterData.ts) ───────

const PROPOSAL_SOURCE_FILTERS = [
  { value: "personal", label: "Personal" },
  { value: "business", label: "Business" },
  { value: "enterprise", label: "Enterprise" },
  { value: "public", label: "Public (Gov / Municipal)" },
];

const CATEGORY_FILTERS = {
  "Construction & Property": [
    "General Contracting", "Home Remodeling", "Kitchen Remodeling", "Bathroom Remodeling",
    "Roofing", "Flooring", "Painting", "Plumbing", "Electrical", "HVAC", "Landscaping",
    "Masonry", "Windows & Doors", "Pool Construction", "Demolition", "Structural Engineering",
    "Architecture & Design", "Commercial Construction", "Facility Maintenance",
  ],
  "Real Estate & Property Services": [
    "Property Management", "Appraisal", "Inspection", "Property Marketing",
    "Leasing Services", "Real Estate Photography", "Title & Escrow Services",
  ],
  "Professional Services": [
    "Legal", "Accounting", "Tax Preparation", "Business Consulting",
    "Management Consulting", "Financial Advisory", "HR & Recruiting",
    "Market Research", "Compliance & Regulatory",
  ],
  "Technology & Software": [
    "Software Development", "Web Development", "Mobile App Development",
    "AI / Machine Learning", "Blockchain", "Data Engineering", "Cybersecurity",
    "DevOps / Cloud", "IT Support", "System Integration", "ERP Implementation",
  ],
  "Creative & Marketing": [
    "Graphic Design", "Branding", "Advertising", "Digital Marketing", "SEO",
    "Social Media Management", "Content Creation", "Copywriting",
    "Video Production", "Photography", "UI / UX Design",
  ],
  "Manufacturing & Product Development": [
    "Industrial Design", "Prototyping", "Product Engineering", "Tooling",
    "Contract Manufacturing", "Packaging Design", "Quality Assurance",
  ],
  "Logistics & Transportation": [
    "Freight Shipping", "Trucking", "Last Mile Delivery", "Warehousing",
    "Fulfillment", "Supply Chain Logistics", "Customs Brokerage",
  ],
  "Equipment & Procurement": [
    "Equipment Purchase", "Equipment Leasing", "Industrial Machinery",
    "Medical Equipment", "Construction Equipment", "IT Hardware",
  ],
  "Maintenance & Field Services": [
    "Appliance Repair", "Equipment Repair", "Cleaning Services",
    "Security Services", "Pest Control", "Elevator Maintenance",
  ],
  "Healthcare Services": [
    "Telehealth Providers", "Medical Staffing", "Medical Billing",
    "Healthcare IT", "Medical Equipment Installation",
  ],
  "Government & Public Contracts": [
    "Infrastructure Projects", "Public Works", "Government IT",
    "Defense Contracts", "Municipal Services",
  ],
};

const TIMELINE_FILTERS = [
  { value: "immediate", label: "Immediate" },
  { value: "1-week", label: "Within 1 week" },
  { value: "1-month", label: "Within 1 month" },
  { value: "3-months", label: "Within 3 months" },
  { value: "flexible", label: "Flexible" },
  { value: "long-term", label: "Long-term contract" },
];

const CONTRACT_TYPE_FILTERS = [
  { value: "one-time", label: "One-time project" },
  { value: "recurring", label: "Recurring service" },
  { value: "retainer", label: "Retainer" },
  { value: "contract-employment", label: "Contract employment" },
  { value: "equipment-purchase", label: "Equipment purchase" },
  { value: "lease-rental", label: "Lease / rental" },
  { value: "government-solicitation", label: "Government solicitation" },
];

const BID_STATUS_FILTERS = [
  { value: "open", label: "Open for bids" },
  { value: "closing-soon", label: "Closing soon" },
  { value: "under-review", label: "Under review" },
  { value: "awarded", label: "Awarded" },
  { value: "archived", label: "Archived" },
];

const VENDOR_REQUIREMENT_FILTERS = [
  { value: "licensed", label: "Licensed" },
  { value: "insured", label: "Insured" },
  { value: "bonded", label: "Bonded" },
  { value: "verified-business", label: "Verified business" },
  { value: "min-experience", label: "Min. years of experience" },
  { value: "minority-owned", label: "Minority-owned business" },
  { value: "local-preference", label: "Local vendor preference" },
];

const ESCROW_PAYMENT_FILTERS = [
  { value: "escrow-required", label: "Escrow required" },
  { value: "escrow-optional", label: "Escrow optional" },
  { value: "milestone", label: "Milestone payments" },
  { value: "net-terms", label: "Net payment terms" },
  { value: "financing", label: "Financing available" },
];

const COMPLEXITY_FILTERS = [
  { value: "simple", label: "Simple" },
  { value: "moderate", label: "Moderate" },
  { value: "complex", label: "Complex" },
  { value: "enterprise-scale", label: "Enterprise-scale" },
];

const RISK_COMPLIANCE_FILTERS = [
  { value: "nda", label: "NDA required" },
  { value: "compliance-cert", label: "Compliance certification" },
  { value: "security-clearance", label: "Security clearance" },
  { value: "environmental", label: "Environmental compliance" },
  { value: "regulatory", label: "Regulatory approval" },
];

const VENDOR_ACTIVITY_FILTERS = [
  { value: "high-probability", label: "High probability of award" },
  { value: "high-budget", label: "High budget" },
  { value: "few-bids", label: "Few competing bids" },
  { value: "buyer-verified", label: "Buyer verified" },
  { value: "repeat-buyer", label: "Repeat buyer" },
];

const BID_COMPETITION_FILTERS = [
  { value: "no-bids", label: "No bids yet" },
  { value: "1-3", label: "1\u20133 bids" },
  { value: "3-10", label: "3\u201310 bids" },
  { value: "10+", label: "10+ bids" },
];

const REQUEST_AGE_FILTERS = [
  { value: "today", label: "Posted today" },
  { value: "this-week", label: "Posted this week" },
  { value: "this-month", label: "Posted this month" },
];

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Australia",
  "Germany", "France", "Mexico", "India", "Brazil", "Japan",
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming",
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

// ─── Filter Sub-components ─────────────────────────────────────────────────────

const FilterSection = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/10 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full text-xs font-semibold text-white/80 hover:text-white transition-colors py-1"
      >
        {title}
        {open ? <IoChevronUp className="text-sm" /> : <IoChevronDown className="text-sm" />}
      </button>
      {open && <div className="mt-2 space-y-1.5">{children}</div>}
    </div>
  );
};

const ChipFilter = ({ options, selected, onToggle }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map((opt) => {
      const active = selected.includes(opt.value);
      return (
        <button
          key={opt.value}
          type="button"
          onClick={() => onToggle(opt.value)}
          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
            active
              ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
              : "bg-white/5 text-white/50 border border-white/10 hover:border-white/20 hover:text-white/80"
          }`}
        >
          {opt.label}
        </button>
      );
    })}
  </div>
);

const CategoryFilter = ({ selected, onToggle }) => {
  const [expandedCat, setExpandedCat] = useState(null);
  return (
    <div className="space-y-0.5">
      {Object.entries(CATEGORY_FILTERS).map(([cat, subs]) => (
        <div key={cat}>
          <button
            type="button"
            onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
            className="flex items-center justify-between w-full text-[11px] text-white/70 hover:text-white transition-colors py-1.5 px-2 rounded-md hover:bg-white/5"
          >
            <span className="font-medium text-left">{cat}</span>
            <IoChevronDown
              className={`text-xs transition-transform flex-shrink-0 ml-1 ${expandedCat === cat ? "rotate-180" : ""}`}
            />
          </button>
          {expandedCat === cat && (
            <div className="ml-2 pl-2 border-l border-white/10 flex flex-wrap gap-1 py-1.5">
              {subs.map((sub) => {
                const active = selected.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => onToggle(sub)}
                    className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                      active
                        ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                        : "bg-white/5 text-white/40 hover:text-white/70"
                    }`}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ─── FilterSidebar ─────────────────────────────────────────────────────────────

const FilterSidebar = ({ filters, onFilterChange, locationFilters, onLocationChange, onClearAll, activeCount }) => {
  const toggle = (group, value) => {
    const current = filters[group] || [];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFilterChange(group, next);
  };

  return (
    <div className="overflow-y-auto h-[calc(100vh-180px)] pr-2 scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <h2 className="text-xs font-bold text-white uppercase tracking-widest">Filters</h2>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
          >
            <IoClose className="text-sm" />
            Clear ({activeCount})
          </button>
        )}
      </div>

      {/* Geolocation toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <IoNavigateCircleOutline className="text-pink-400 text-base" />
          <span className="text-xs font-medium text-white/70">Use my location</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={locationFilters.geolocation}
          onClick={() => onLocationChange("geolocation", !locationFilters.geolocation)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            locationFilters.geolocation ? "bg-pink-500" : "bg-white/20"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
              locationFilters.geolocation ? "translate-x-4" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Proposal Source */}
      <FilterSection title="Proposal Source" defaultOpen>
        <ChipFilter
          options={PROPOSAL_SOURCE_FILTERS}
          selected={filters.source || []}
          onToggle={(v) => toggle("source", v)}
        />
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category" defaultOpen>
        <CategoryFilter
          selected={filters.category || []}
          onToggle={(v) => toggle("category", v)}
        />
      </FilterSection>

      {/* Location */}
      <FilterSection title="Location" defaultOpen>
        <div className="space-y-2">
          <select
            value={locationFilters.country}
            onChange={(e) => onLocationChange("country", e.target.value)}
            className="w-full h-8 px-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white/70 outline-none focus:border-pink-500/50"
          >
            <option value="" className="bg-[#1a1a24]">Country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c} className="bg-[#1a1a24]">{c}</option>
            ))}
          </select>
          <select
            value={locationFilters.state}
            onChange={(e) => onLocationChange("state", e.target.value)}
            className="w-full h-8 px-2 text-xs bg-white/5 border border-white/10 rounded-lg text-white/70 outline-none focus:border-pink-500/50"
          >
            <option value="" className="bg-[#1a1a24]">State / Province</option>
            {US_STATES.map((s) => (
              <option key={s} value={s} className="bg-[#1a1a24]">{s}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="City"
            value={locationFilters.city}
            onChange={(e) => onLocationChange("city", e.target.value)}
            className="w-full h-8 px-3 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-pink-500/50"
          />
          <input
            type="text"
            placeholder="Zip code radius (miles)"
            value={locationFilters.zipRadius}
            onChange={(e) => onLocationChange("zipRadius", e.target.value)}
            className="w-full h-8 px-3 text-xs bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 outline-none focus:border-pink-500/50"
          />
          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
            <button
              type="button"
              role="switch"
              aria-checked={locationFilters.remoteAllowed}
              onClick={() => onLocationChange("remoteAllowed", !locationFilters.remoteAllowed)}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors flex-shrink-0 ${
                locationFilters.remoteAllowed ? "bg-pink-500" : "bg-white/20"
              }`}
            >
              <span
                className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
                  locationFilters.remoteAllowed ? "translate-x-3.5" : "translate-x-0.5"
                }`}
              />
            </button>
            Remote allowed
          </label>
        </div>
      </FilterSection>

      {/* Timeline */}
      <FilterSection title="Timeline / Urgency">
        <ChipFilter
          options={TIMELINE_FILTERS}
          selected={filters.timeline || []}
          onToggle={(v) => toggle("timeline", v)}
        />
      </FilterSection>

      {/* Contract Type */}
      <FilterSection title="Contract Type">
        <ChipFilter
          options={CONTRACT_TYPE_FILTERS}
          selected={filters.contractType || []}
          onToggle={(v) => toggle("contractType", v)}
        />
      </FilterSection>

      {/* Bid Status */}
      <FilterSection title="Bid Status">
        <ChipFilter
          options={BID_STATUS_FILTERS}
          selected={filters.bidStatus || []}
          onToggle={(v) => toggle("bidStatus", v)}
        />
      </FilterSection>

      {/* Vendor Requirements */}
      <FilterSection title="Vendor Requirements">
        <ChipFilter
          options={VENDOR_REQUIREMENT_FILTERS}
          selected={filters.vendorRequirements || []}
          onToggle={(v) => toggle("vendorRequirements", v)}
        />
      </FilterSection>

      {/* Escrow / Payment */}
      <FilterSection title="Escrow / Payment">
        <ChipFilter
          options={ESCROW_PAYMENT_FILTERS}
          selected={filters.escrowPayment || []}
          onToggle={(v) => toggle("escrowPayment", v)}
        />
      </FilterSection>

      {/* Complexity */}
      <FilterSection title="Complexity (AI Generated)">
        <ChipFilter
          options={COMPLEXITY_FILTERS}
          selected={filters.complexity || []}
          onToggle={(v) => toggle("complexity", v)}
        />
      </FilterSection>

      {/* Risk / Compliance */}
      <FilterSection title="Risk / Compliance">
        <ChipFilter
          options={RISK_COMPLIANCE_FILTERS}
          selected={filters.riskCompliance || []}
          onToggle={(v) => toggle("riskCompliance", v)}
        />
      </FilterSection>

      {/* Vendor Activity */}
      <FilterSection title="Vendor Activity">
        <ChipFilter
          options={VENDOR_ACTIVITY_FILTERS}
          selected={filters.vendorActivity || []}
          onToggle={(v) => toggle("vendorActivity", v)}
        />
      </FilterSection>

      {/* Bid Competition */}
      <FilterSection title="Bid Competition">
        <ChipFilter
          options={BID_COMPETITION_FILTERS}
          selected={filters.bidCompetition || []}
          onToggle={(v) => toggle("bidCompetition", v)}
        />
      </FilterSection>

      {/* Request Age */}
      <FilterSection title="Request Age">
        <ChipFilter
          options={REQUEST_AGE_FILTERS}
          selected={filters.requestAge || []}
          onToggle={(v) => toggle("requestAge", v)}
        />
      </FilterSection>
    </div>
  );
};

// ─── Request Card ──────────────────────────────────────────────────────────────

const RequestCard = ({ request }) => {
  const images = [request.image1, request.image2, request.image3, request.image4].filter(Boolean);
  const bidCount = request.bids?.length ?? 0;
  const isUrgent = request.description?.includes("URGENT") || request.description?.includes("urgent");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 hover:border-pink-500/30 transition-all duration-200 group"
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Photo thumbnail */}
        <div className="flex md:flex-col gap-2 flex-shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
            {images[0] ? (
              <img src={images[0]} alt="" className="w-full h-full object-cover" />
            ) : (
              <IoCamera className="text-2xl text-white/20" />
            )}
          </div>
          {images.length > 1 && (
            <span className="text-[10px] text-white/40 font-mono self-end">
              +{images.length - 1} more
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white group-hover:text-pink-400 transition-colors text-base">
                {request.title}
              </h3>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {request.category_name && (
                  <span className="flex items-center gap-1 text-xs text-white/50">
                    <FaTag className="text-pink-400 text-[10px]" />
                    {request.category_name}
                  </span>
                )}
                {request.deadline && (
                  <span className="flex items-center gap-1 text-xs text-white/50">
                    <IoCalendarOutline className="text-sm" />
                    Due {new Date(request.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                )}
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <IoTimeOutline className="text-sm" />
                  {timeAgo(request.created_at)}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono border border-white/10 text-white/40">
                  {request.customer_first_name} {request.customer_last_name}
                </span>
              </div>
            </div>
            {isUrgent && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-semibold flex-shrink-0">
                <IoAlertCircle className="text-sm" />
                Urgent
              </span>
            )}
          </div>

          {/* Scope snippet */}
          <p className="text-sm text-white/50 line-clamp-2 leading-relaxed">
            {request.description
              ? (
                <>
                  <span className="inline-flex items-center gap-0.5 mr-1.5 px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-[10px] font-mono font-semibold align-middle">
                    <IoSparkles className="text-[10px]" />AI
                  </span>
                  {request.description}
                </>
              )
              : "No description provided."
            }
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm font-bold text-emerald-400">
                <FaDollarSign className="text-emerald-500 text-base" />
                {request.budget}
              </span>
              <span className="flex items-center gap-1 text-xs text-white/40">
                <FaShieldAlt className="text-pink-400 text-xs" />
                Verified
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">
                {bidCount} bid{bidCount !== 1 ? "s" : ""}
              </span>
              <Link to={`/bids/requests/${request.id}`}>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold hover:opacity-90 transition-all shadow-md shadow-pink-500/20">
                  Send Offer
                  <IoArrowForward className="text-sm" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Mobile Filter Drawer ───────────────────────────────────────────────────────

const MobileFilterDrawer = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 lg:hidden"
        />
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed left-0 top-0 bottom-0 w-[300px] bg-[#13131a] border-r border-white/10 z-50 lg:hidden flex flex-col"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <span className="text-sm font-bold text-white">Filters</span>
            <button type="button" onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <IoClose className="text-xl" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BidsMarketplace() {
  const [cookies] = useCookies(["access_token"]);
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({});
  const [locationFilters, setLocationFilters] = useState({
    country: "", state: "", city: "", zipRadius: "", remoteAllowed: false, geolocation: false,
  });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!cookies.access_token) {
      navigate("/signin");
    }
  }, [cookies.access_token, navigate]);

  useEffect(() => {
    if (!cookies.access_token) return;
    setLoading(true);
    setError(false);
    getOpenRequests(cookies.access_token)
      .then((res) => {
        const data = res.data?.results ?? res.data ?? [];
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [cookies.access_token]);

  const handleFilterChange = useCallback((group, values) => {
    setFilters((prev) => ({ ...prev, [group]: values }));
  }, []);

  const handleLocationChange = useCallback((key, value) => {
    setLocationFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters({});
    setLocationFilters({ country: "", state: "", city: "", zipRadius: "", remoteAllowed: false, geolocation: false });
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);
    if (locationFilters.country) count++;
    if (locationFilters.state) count++;
    if (locationFilters.city) count++;
    if (locationFilters.zipRadius) count++;
    if (locationFilters.remoteAllowed) count++;
    return count;
  }, [filters, locationFilters]);

  const filtered = useMemo(() => {
    let list = [...requests];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.category_name?.toLowerCase().includes(q)
      );
    }

    // Category filter (matches category_name)
    const catSelected = filters.category || [];
    if (catSelected.length > 0) {
      list = list.filter((r) =>
        catSelected.some((c) => r.category_name?.toLowerCase().includes(c.toLowerCase()))
      );
    }

    // Sort
    if (sortBy === "newest") {
      list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "budget-high") {
      list = list.sort((a, b) => parseFloat(b.budget) - parseFloat(a.budget));
    } else if (sortBy === "budget-low") {
      list = list.sort((a, b) => parseFloat(a.budget) - parseFloat(b.budget));
    } else if (sortBy === "fewest-bids") {
      list = list.sort((a, b) => (a.bids?.length ?? 0) - (b.bids?.length ?? 0));
    } else if (sortBy === "urgent") {
      list = list.sort((a, b) => {
        const aUrgent = a.description?.includes("URGENT") ? 1 : 0;
        const bUrgent = b.description?.includes("URGENT") ? 1 : 0;
        return bUrgent - aUrgent;
      });
    }

    return list;
  }, [requests, searchQuery, filters, sortBy]);

  const filterSidebarProps = {
    filters,
    onFilterChange: handleFilterChange,
    locationFilters,
    onLocationChange: handleLocationChange,
    onClearAll: clearAll,
    activeCount: activeFilterCount,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Mobile filter drawer */}
      <MobileFilterDrawer isOpen={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}>
        <FilterSidebar {...filterSidebarProps} />
      </MobileFilterDrawer>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page title + publish CTA */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Proposals{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Marketplace
              </span>
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Publish a Request. Receive Competitive Proposals.
            </p>
          </div>
          <Link to="/create-bid" className="flex-shrink-0">
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-pink-500/20 whitespace-nowrap">
              <IoAdd className="text-base" />
              <span className="hidden sm:inline">Publish a Request</span>
              <span className="sm:hidden">Post</span>
            </button>
          </Link>
        </div>

        {/* Search + Sort + Mobile filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <IoSearchSharp className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 text-base" />
            <input
              type="text"
              placeholder="Search proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 outline-none focus:border-pink-500/40 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <IoClose />
              </button>
            )}
          </div>

          <div className="relative">
            <FaSort className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-10 pl-8 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-pink-500/40 appearance-none cursor-pointer w-full sm:w-[180px]"
            >
              <option value="newest" className="bg-[#13131a]">Newest First</option>
              <option value="budget-high" className="bg-[#13131a]">Highest Budget</option>
              <option value="budget-low" className="bg-[#13131a]">Lowest Budget</option>
              <option value="fewest-bids" className="bg-[#13131a]">Fewest Bids</option>
              <option value="urgent" className="bg-[#13131a]">Urgent First</option>
            </select>
          </div>

          {/* Mobile filter button */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-2 h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:bg-white/10 transition-all"
          >
            <IoFilterSharp />
            Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Two-column layout */}
        <div className="flex gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <div className="sticky top-24 bg-[#13131a] border border-white/10 rounded-2xl p-4">
              <FilterSidebar {...filterSidebarProps} />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl h-40 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                <IoAlertCircle className="text-5xl text-white/20 mx-auto mb-4" />
                <p className="text-white/50 mb-4">Failed to load requests.</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/15 transition-all mx-auto"
                >
                  <IoRefresh />
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-white/50">
                    {filtered.length} open request{filtered.length !== 1 ? "s" : ""}
                    {activeFilterCount > 0 && (
                      <span className="ml-2 text-pink-400">({activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active)</span>
                    )}
                  </p>
                </div>
                {filtered.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                    <FaGavel className="text-5xl text-white/15 mx-auto mb-4" />
                    <p className="text-white/50 mb-2">No requests match your filters.</p>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-pink-400 text-sm hover:text-pink-300 transition-colors"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filtered.map((request) => (
                      <RequestCard key={request.id} request={request} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
