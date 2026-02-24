import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { listGigs, getGigCategories } from "../../api/gigs";
import {
  IoSearchSharp,
  IoFilterOutline,
  IoStarSharp,
  IoTimeOutline,
  IoCloseOutline,
  IoChevronForwardOutline,
  IoChevronBackOutline,
} from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";

const TIER_COLOR = {
  basic: "text-blue-400 bg-blue-500/10 border-blue-500/30",
  standard: "text-purple-400 bg-purple-500/10 border-purple-500/30",
  premium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
};

const GigCard = ({ gig }) => {
  const mainImage = gig.media_files?.find((m) => m.is_main) || gig.media_files?.[0];
  const lowestPkg = gig.packages?.reduce(
    (min, p) => (parseFloat(p.price) < parseFloat(min.price) ? p : min),
    gig.packages[0]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-purple-500/10 hover:border-white/10 transition-all flex flex-col"
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[#1a1a24] flex-shrink-0">
        {mainImage ? (
          <img
            src={mainImage.file}
            alt={gig.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaBriefcase className="text-4xl text-white/10" />
          </div>
        )}
        {/* Category badge */}
        {gig.category_details && (
          <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-medium px-2 py-1 rounded-full border border-white/10">
            {gig.category_details.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Worker */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold uppercase">
            {gig.worker?.username?.[0] || "?"}
          </div>
          <span className="text-white/50 text-xs">{gig.worker?.username}</span>
          <div className="ml-auto flex items-center gap-1">
            <IoStarSharp className="text-yellow-400 text-xs" />
            <span className="text-white/70 text-xs font-medium">{gig.rating}</span>
            <span className="text-white/30 text-xs">({gig.total_orders_completed})</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-white text-sm font-semibold leading-snug mb-3 line-clamp-2 flex-1">
          {gig.title}
        </h3>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
          <div className="flex items-center gap-1 text-white/40 text-xs">
            <IoTimeOutline className="text-sm" />
            <span>{lowestPkg?.delivery_days}d delivery</span>
          </div>
          <div className="text-right">
            <span className="text-white/40 text-[10px]">Starting at</span>
            <p className="text-white font-bold text-base leading-tight">
              ${parseFloat(lowestPkg?.price || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* CTA overlay */}
      <Link
        to={`/gigs/${gig.id}`}
        className="block px-4 pb-4"
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-500/80 hover:from-purple-600 hover:to-pink-500 text-white text-sm font-semibold transition-all"
        >
          View Gig
        </motion.button>
      </Link>
    </motion.div>
  );
};

const GigsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [gigs, setGigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  const [filters, setFilters] = useState({
    min_price: searchParams.get("min_price") || "",
    max_price: searchParams.get("max_price") || "",
    category_slug: searchParams.get("category_slug") || "",
    min_rating: searchParams.get("min_rating") || "",
    delivery_days: searchParams.get("delivery_days") || "",
    page: searchParams.get("page") || 1,
  });

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
      if (filters.category_slug) params.category_slug = filters.category_slug;
      if (filters.min_rating) params.min_rating = filters.min_rating;
      if (filters.delivery_days) params.delivery_days = filters.delivery_days;
      if (filters.page && filters.page > 1) params.page = filters.page;

      const res = await listGigs(params);
      const data = res.data;
      if (data.results) {
        setGigs(data.results);
        setTotalCount(data.count);
        setNextPage(data.next);
        setPrevPage(data.previous);
      } else {
        setGigs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setGigs([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  useEffect(() => {
    getGigCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const applyFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ min_price: "", max_price: "", category_slug: "", min_rating: "", delivery_days: "", page: 1 });
    setSearchQuery("");
  };

  const hasActiveFilters =
    filters.min_price || filters.max_price || filters.category_slug || filters.min_rating || filters.delivery_days;

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden">
      {/* Background orb */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">

        {/* ── Hero Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4">
            <FaBriefcase className="text-pink-400 text-sm" />
            <span className="text-white/60 text-sm font-medium">Gig Services Marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-3">
            Find the perfect{" "}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              freelance service
            </span>
          </h1>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            Browse thousands of services from verified professionals. Pay only when you're satisfied.
          </p>

          {/* Search + filter row */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 max-w-2xl mx-auto">
            <div className="relative flex-1 w-full">
              <IoSearchSharp className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-lg" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilter("q", searchQuery)}
                placeholder="Search gigs…"
                className="w-full pl-11 pr-4 py-3 bg-[#13131a] border border-white/10 rounded-xl text-white placeholder-white/30 text-sm outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all whitespace-nowrap ${
                showFilters || hasActiveFilters
                  ? "bg-purple-600 border-purple-500 text-white"
                  : "bg-[#13131a] border-white/10 text-white/70 hover:border-white/20"
              }`}
            >
              <IoFilterOutline className="text-base" />
              Filters
              {hasActiveFilters && (
                <span className="bg-pink-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  !
                </span>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Filter Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Min price */}
                <div className="space-y-1">
                  <label className="text-white/50 text-xs">Min Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={filters.min_price}
                    onChange={(e) => applyFilter("min_price", e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                {/* Max price */}
                <div className="space-y-1">
                  <label className="text-white/50 text-xs">Max Price ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={filters.max_price}
                    onChange={(e) => applyFilter("max_price", e.target.value)}
                    placeholder="Any"
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                {/* Category */}
                <div className="space-y-1">
                  <label className="text-white/50 text-xs">Category</label>
                  <select
                    value={filters.category_slug}
                    onChange={(e) => applyFilter("category_slug", e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-all [&>option]:bg-[#1a1a24]"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Min rating */}
                <div className="space-y-1">
                  <label className="text-white/50 text-xs">Min Rating</label>
                  <select
                    value={filters.min_rating}
                    onChange={(e) => applyFilter("min_rating", e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-all [&>option]:bg-[#1a1a24]"
                  >
                    <option value="">Any</option>
                    {[4.5, 4, 3.5, 3].map((r) => (
                      <option key={r} value={r}>
                        {r}+ ★
                      </option>
                    ))}
                  </select>
                </div>
                {/* Delivery days */}
                <div className="space-y-1">
                  <label className="text-white/50 text-xs">Delivery (days)</label>
                  <select
                    value={filters.delivery_days}
                    onChange={(e) => applyFilter("delivery_days", e.target.value)}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-purple-500 transition-all [&>option]:bg-[#1a1a24]"
                  >
                    <option value="">Any</option>
                    {[1, 3, 7, 14, 30].map((d) => (
                      <option key={d} value={d}>
                        Up to {d} days
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-2 flex items-center gap-1 text-pink-400 text-xs hover:text-pink-300 transition-colors"
                >
                  <IoCloseOutline className="text-base" />
                  Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Category pills ── */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            <button
              onClick={() => applyFilter("category_slug", "")}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                !filters.category_slug
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 border-transparent text-white"
                  : "bg-transparent border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => applyFilter("category_slug", cat.slug)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-all ${
                  filters.category_slug === cat.slug
                    ? "bg-gradient-to-r from-purple-600 to-pink-500 border-transparent text-white"
                    : "bg-transparent border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* ── Stats bar ── */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-white/40 text-sm">
            {loading ? "Loading…" : `${totalCount || gigs.length} services available`}
          </p>
          <div className="flex items-center gap-3">
            <Link
              to="/gigs/create"
              className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600/80 to-pink-500/80 hover:from-purple-600 hover:to-pink-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all"
            >
              + Post a Gig
            </Link>
          </div>
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-[#13131a] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/5" />
                <div className="p-4 space-y-3">
                  <div className="h-3 bg-white/5 rounded-full w-1/2" />
                  <div className="h-4 bg-white/5 rounded-full" />
                  <div className="h-4 bg-white/5 rounded-full w-3/4" />
                  <div className="h-8 bg-white/5 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <FaBriefcase className="text-5xl text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-lg">No gigs found</p>
            <p className="text-white/25 text-sm mt-1">Try adjusting your filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-purple-600/30 border border-purple-500/30 text-purple-400 rounded-xl text-sm hover:bg-purple-600/50 transition-all"
              >
                Clear filters
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {(prevPage || nextPage) && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!prevPage}
              onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, Number(f.page) - 1) }))}
              className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-white/10 rounded-xl text-white/70 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/20 transition-all"
            >
              <IoChevronBackOutline /> Previous
            </motion.button>
            <span className="text-white/30 text-sm">Page {filters.page}</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={!nextPage}
              onClick={() => setFilters((f) => ({ ...f, page: Number(f.page) + 1 }))}
              className="flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-white/10 rounded-xl text-white/70 text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:border-white/20 transition-all"
            >
              Next <IoChevronForwardOutline />
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GigsPage;
