import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  IoRefresh,
} from "react-icons/io5";
import {
  FaTag,
  FaCheck,
  FaShieldAlt,
  FaCheckCircle,
  FaSort,
  FaGavel,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { getOpenJobs } from "../../api/buyerRequests";
import { useJobCategories } from "../../hooks/useJobCategories";
import BidsNavBar from "../../components/BidsNavBar";
import { requestCategoryText, requestCategoryLabel } from "../../constants/jobCategories";
import { useAccessToken } from "../../hooks/useAccessToken";
import { jobBudgetLabel } from "../../constants/jobBudgets";

// ─── Filter Data ───────────────────────────────────────────────────────────────
// Only filters backed by real job fields. (The old sidebar had ~14 groups, most of which
// filtered nothing: location, escrow, compliance, complexity and so on aren't stored on jobs.)

// Budget ranges match the ones on the job form (BUDGET_OPTIONS).
const BUDGET_FILTERS = [
  { value: "under1k", label: "Under $1K", min: 1.01, max: 999.99 },
  { value: "1k-5k", label: "$1K – $5K", min: 1000, max: 4999.99 },
  { value: "5k-15k", label: "$5K – $15K", min: 5000, max: 14999.99 },
  { value: "15k-50k", label: "$15K – $50K", min: 15000, max: 49999.99 },
  { value: "50k-100k", label: "$50K – $100K", min: 50000, max: 99999.99 },
  { value: "100k+", label: "$100K+", min: 100000, max: Infinity },
  { value: "unsure", label: "Not sure", min: -Infinity, max: 1 },
];

const PROPOSAL_COUNT_FILTERS = [
  { value: "0", label: "No proposals yet", min: 0, max: 0 },
  { value: "1-3", label: "1–3 proposals", min: 1, max: 3 },
  { value: "4-10", label: "4–10 proposals", min: 4, max: 10 },
  { value: "10+", label: "More than 10", min: 11, max: Infinity },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const POSTED_FILTERS = [
  { value: "today", label: "Last 24 hours", maxAgeMs: DAY_MS },
  { value: "this-week", label: "Last 7 days", maxAgeMs: 7 * DAY_MS },
  { value: "this-month", label: "Last 30 days", maxAgeMs: 30 * DAY_MS },
];

const inRange = (n, o) => Number.isFinite(n) && n >= o.min && n <= o.max;

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

const TOP_CATEGORIES = 6;

/**
 * Category filter built from the open jobs on the page (retest P2.10): only categories
 * that have jobs are listed, busiest first, with counts; the top few show by default.
 */
const CategoryFilter = ({ selected, onToggle, jobs = [] }) => {
  const [expandedCat, setExpandedCat] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const { categories: CATEGORY_FILTERS } = useJobCategories();

  const catCounts = {};
  const subCounts = {};
  jobs.forEach((j) => {
    if (j.job_category) catCounts[j.job_category] = (catCounts[j.job_category] || 0) + 1;
    if (j.job_subcategory) subCounts[j.job_subcategory] = (subCounts[j.job_subcategory] || 0) + 1;
  });

  const withJobs = Object.entries(CATEGORY_FILTERS)
    .map(([cat, subs]) => ({ cat, subs, count: catCounts[cat] || 0 }))
    .filter(({ subs, count }) => count > 0 || subs.some((sub) => selected.includes(sub)))
    .sort((a, b) => b.count - a.count || a.cat.localeCompare(b.cat));

  if (withJobs.length === 0) {
    return <p className="text-[11px] text-white/40 px-2 py-1.5">No categories with open jobs yet.</p>;
  }

  const visible = showAll ? withJobs : withJobs.slice(0, TOP_CATEGORIES);

  return (
    <div className="space-y-0.5">
      {visible.map(({ cat, subs, count }) => {
        const subsWithJobs = subs.filter((sub) => subCounts[sub] || selected.includes(sub));
        const subList = subsWithJobs.length > 0 ? subsWithJobs : subs;
        return (
          <div key={cat}>
            <button
              type="button"
              onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
              aria-expanded={expandedCat === cat}
              className="flex items-center justify-between w-full text-[11px] text-white/70 hover:text-white transition-colors py-1.5 px-2 rounded-md hover:bg-white/5"
            >
              <span className="font-medium text-left">{cat}</span>
              <span className="flex items-center gap-1 flex-shrink-0 ml-1">
                <span className="text-white/40">{count}</span>
                <IoChevronDown
                  className={`text-xs transition-transform ${expandedCat === cat ? "rotate-180" : ""}`}
                />
              </span>
            </button>
            {expandedCat === cat && (
              <div className="ml-2 pl-2 border-l border-white/10 flex flex-wrap gap-1 py-1.5">
                {subList.map((sub) => {
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
                      {subCounts[sub] ? ` (${subCounts[sub]})` : ""}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {withJobs.length > TOP_CATEGORIES && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="text-[11px] text-pink-400 hover:text-pink-300 px-2 py-1.5"
        >
          {showAll ? "Show fewer" : `Show all ${withJobs.length}`}
        </button>
      )}
    </div>
  );
};

// ─── FilterSidebar ─────────────────────────────────────────────────────────────

const FilterSidebar = ({ filters, onFilterChange, onClearAll, activeCount, jobs }) => {
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

      <FilterSection title="Category" defaultOpen>
        <CategoryFilter
          selected={filters.category || []}
          onToggle={(v) => toggle("category", v)}
          jobs={jobs}
        />
      </FilterSection>

      <FilterSection title="Budget" defaultOpen>
        <ChipFilter
          options={BUDGET_FILTERS}
          selected={filters.budget || []}
          onToggle={(v) => toggle("budget", v)}
        />
      </FilterSection>

      <FilterSection title="Proposals so far">
        <ChipFilter
          options={PROPOSAL_COUNT_FILTERS}
          selected={filters.proposals || []}
          onToggle={(v) => toggle("proposals", v)}
        />
      </FilterSection>

      <FilterSection title="Posted">
        <ChipFilter
          options={POSTED_FILTERS}
          selected={filters.posted || []}
          onToggle={(v) => toggle("posted", v)}
        />
      </FilterSection>
    </div>
  );
};

// ─── Request Card ──────────────────────────────────────────────────────────────

const RequestCard = ({ request }) => {
  const images = [request.image1, request.image2, request.image3, request.image4].filter(Boolean);
  const bidCount = request.proposal_count ?? 0;
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
                {requestCategoryLabel(request) && (
                  <span className="flex items-center gap-1 text-xs text-white/50">
                    <FaTag className="text-pink-400 text-[10px]" />
                    {requestCategoryLabel(request)}
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
            {request.description || "No description provided."}
          </p>

          {/* Meta row */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-sm font-bold text-emerald-400">
                {jobBudgetLabel(request.budget)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">
                {bidCount} proposal{bidCount !== 1 ? "s" : ""}
              </span>
              <Link
                to={`/gigs/jobs/${request.id}`}
                className="flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-[14px] bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-white text-sm font-semibold"
              >
                Send a proposal
                <IoArrowForward className="text-sm" aria-hidden="true" />
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
  const accessToken = useAccessToken();
  const [cookies] = useCookies(["access_token"]);
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [filters, setFilters] = useState({});
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  // ?category=<gig category slug>, e.g. from the GigHub "Jobs Offered" category.
  const [searchParams, setSearchParams] = useSearchParams();
  const categorySlug = searchParams.get("category") || "";
  const { slugByName } = useJobCategories();
  const categorySlugName =
    Object.keys(slugByName).find((name) => slugByName[name] === categorySlug) || categorySlug;

  // Redirect if not logged in
  useEffect(() => {
    if (!accessToken) {
      navigate("/signin");
    }
  }, [accessToken, navigate]);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError(false);
    getOpenJobs(accessToken, categorySlug)
      .then((res) => {
        const data = res.data?.results ?? res.data ?? [];
        setRequests(Array.isArray(data) ? data : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [accessToken, categorySlug]);

  const handleFilterChange = useCallback((group, values) => {
    setFilters((prev) => ({ ...prev, [group]: values }));
  }, []);

  const clearAll = useCallback(() => {
    setFilters({});
  }, []);

  const activeFilterCount = useMemo(
    () => Object.values(filters).reduce((sum, arr) => sum + arr.length, 0),
    [filters]
  );

  const filtered = useMemo(() => {
    let list = [...requests];

    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          requestCategoryText(r).toLowerCase().includes(q)
      );
    }

    // Category filter (matches the job category / subcategory chosen on the job form)
    const catSelected = filters.category || [];
    if (catSelected.length > 0) {
      list = list.filter((r) => {
        const text = requestCategoryText(r).toLowerCase();
        return catSelected.some((c) => text.includes(c.toLowerCase()));
      });
    }

    const budgetSelected = BUDGET_FILTERS.filter((o) => (filters.budget || []).includes(o.value));
    if (budgetSelected.length > 0) {
      list = list.filter((r) => budgetSelected.some((o) => inRange(Number(r.budget), o)));
    }

    const proposalSelected = PROPOSAL_COUNT_FILTERS.filter((o) => (filters.proposals || []).includes(o.value));
    if (proposalSelected.length > 0) {
      list = list.filter((r) => proposalSelected.some((o) => inRange(Number(r.proposal_count ?? 0), o)));
    }

    const postedSelected = POSTED_FILTERS.filter((o) => (filters.posted || []).includes(o.value));
    if (postedSelected.length > 0) {
      const maxAge = Math.max(...postedSelected.map((o) => o.maxAgeMs));
      list = list.filter((r) => Date.now() - new Date(r.created_at).getTime() <= maxAge);
    }

    // Sort
    if (sortBy === "newest") {
      list = list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (sortBy === "budget-high") {
      list = list.sort((a, b) => parseFloat(b.budget) - parseFloat(a.budget));
    } else if (sortBy === "budget-low") {
      list = list.sort((a, b) => parseFloat(a.budget) - parseFloat(b.budget));
    } else if (sortBy === "fewest-bids") {
      list = list.sort((a, b) => (a.proposal_count ?? 0) - (b.proposal_count ?? 0));
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
    onClearAll: clearAll,
    activeCount: activeFilterCount,
    jobs: requests,
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <BidsNavBar />

      {/* Mobile filter drawer */}
      <MobileFilterDrawer isOpen={mobileFilterOpen} onClose={() => setMobileFilterOpen(false)}>
        <FilterSidebar {...filterSidebarProps} />
      </MobileFilterDrawer>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page title + publish CTA */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Find{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Jobs
              </span>
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Freelance work posted in GigHub. Send a proposal; the poster picks who to hire.
            </p>
            {categorySlug && (
              <button
                type="button"
                onClick={() => setSearchParams({})}
                className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-pink-500/15 text-pink-300 border border-pink-500/30"
              >
                {categorySlugName} <span aria-hidden="true">×</span>
                <span className="sr-only">Clear category</span>
              </button>
            )}
          </div>
          <Link to="/gigs/jobs/post" className="flex-shrink-0">
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md shadow-pink-500/20 whitespace-nowrap">
              <IoAdd className="text-base" />
              <span className="hidden sm:inline">Post a Job</span>
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
              <option value="fewest-bids" className="bg-[#13131a]">Fewest Proposals</option>
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
                    {filtered.length} open job request{filtered.length !== 1 ? "s" : ""}
                    {activeFilterCount > 0 && (
                      <span className="ml-2 text-pink-400">({activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""} active)</span>
                    )}
                  </p>
                </div>
                {filtered.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
                    <FaGavel className="text-5xl text-white/15 mx-auto mb-4" />
                    {activeFilterCount > 0 || searchQuery.trim() ? (
                      <>
                        <p className="text-white/50 mb-2">No job requests match your filters.</p>
                        <button
                          type="button"
                          onClick={clearAll}
                          className="text-pink-400 text-sm hover:text-pink-300 transition-colors"
                        >
                          Clear all filters
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-white/70 mb-1">No open jobs{categorySlug ? " in this category" : ""} yet.</p>
                        <p className="text-white/40 text-sm mb-4">Be the first: post the work you need and get proposals from freelancers.</p>
                        <Link
                          to="/gigs/jobs/post"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold"
                        >
                          Post a job
                        </Link>
                      </>
                    )}
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
