import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { listGigs, getGigCategories } from "../../api/gigs";
import {
  IoSearchSharp,
  IoStarSharp,
  IoTimeOutline,
  IoArrowForwardOutline,
  IoCheckmarkCircle,
  IoShieldCheckmarkOutline,
  IoTrendingUpOutline,
  IoPersonOutline,
  IoRocketOutline,
  IoGridOutline,
  IoChevronBackOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import {
  FaBriefcase,
  FaCode,
  FaPaintBrush,
  FaVideo,
  FaBullhorn,
  FaPen,
  FaMusic,
  FaCogs,
  FaChartBar,
  FaCamera,
  FaRobot,
  FaGlobe,
} from "react-icons/fa";

const CATEGORY_ICONS = {
  default: FaBriefcase,
  design: FaPaintBrush,
  writing: FaPen,
  video: FaVideo,
  marketing: FaBullhorn,
  programming: FaCode,
  music: FaMusic,
  business: FaChartBar,
  photography: FaCamera,
  ai: FaRobot,
  digital: FaRobot,
  tech: FaCogs,
  web: FaGlobe,
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Post a Gig",
    desc: "Create your service listing with packages and pricing. Be as detailed as possible.",
    icon: <FaPen className="text-pink-400 text-2xl" />,
  },
  {
    step: "02",
    title: "Buyer Places Order",
    desc: "Buyers browse, select a package, and complete payment securely via Stripe.",
    icon: <IoPersonOutline className="text-purple-400 text-2xl" />,
  },
  {
    step: "03",
    title: "Deliver Your Work",
    desc: "Complete the order, deliver the files, and communicate with the buyer.",
    icon: <IoRocketOutline className="text-blue-400 text-2xl" />,
  },
  {
    step: "04",
    title: "Get Paid",
    desc: "Once the buyer accepts the delivery, you receive 95% of the order value.",
    icon: <IoTrendingUpOutline className="text-green-400 text-2xl" />,
  },
];

const TRUST_STATS = [
  { value: "10K+", label: "Active Gigs" },
  { value: "50K+", label: "Happy Buyers" },
  { value: "95%", label: "Satisfaction Rate" },
  { value: "$2M+", label: "Paid to Sellers" },
];

const GigCard = ({ gig }) => {
  const mainImage = gig.media_files?.find((m) => m.is_main) || gig.media_files?.[0];
  const lowestPkg = gig.packages?.length
    ? gig.packages.reduce((min, p) =>
        parseFloat(p.price) < parseFloat(min.price) ? p : min,
        gig.packages[0]
      )
    : null;

  return (
    <motion.div
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="bg-[#13131a] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-purple-500/10 hover:border-white/10 transition-all flex flex-col"
    >
      <div className="relative h-44 overflow-hidden bg-[#1a1a24] flex-shrink-0">
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
        {gig.category_details && (
          <span className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white/80 text-[10px] font-medium px-2 py-0.5 rounded-full border border-white/10">
            {gig.category_details.name}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-[10px] font-bold uppercase">
            {(gig.worker?.name || gig.worker?.username)?.[0] || "?"}
          </div>
          <span className="text-white/50 text-xs">{gig.worker?.name || gig.worker?.username}</span>
          <div className="ml-auto flex items-center gap-1">
            <IoStarSharp className="text-yellow-400 text-xs" />
            <span className="text-white/70 text-xs">{gig.rating}</span>
          </div>
        </div>

        <h3 className="text-white text-sm font-semibold leading-snug mb-3 flex-1 line-clamp-2">
          {gig.title}
        </h3>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          {lowestPkg ? (
            <>
              <div className="flex items-center gap-1 text-white/40 text-xs">
                <IoTimeOutline className="text-sm" />
                <span>{lowestPkg.delivery_days}d</span>
              </div>
              <div className="text-right">
                <span className="text-white/30 text-[10px]">From</span>
                <p className="text-white font-bold text-base leading-tight">
                  ${parseFloat(lowestPkg.price).toFixed(2)}
                </p>
              </div>
            </>
          ) : (
            <span className="text-white/30 text-xs">Contact for pricing</span>
          )}
        </div>
      </div>

      <Link to={`/gigs/${gig.id}`} className="block px-4 pb-4">
        <button className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600/70 to-pink-500/70 hover:from-purple-600 hover:to-pink-500 text-white text-sm font-semibold transition-all">
          View Gig
        </button>
      </Link>
    </motion.div>
  );
};

const GigHubLanding = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const [featuredGigs, setFeaturedGigs] = useState([]);
  const [loadingGigs, setLoadingGigs] = useState(true);

  // Category browsing state
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [categoryGigs, setCategoryGigs] = useState([]);
  const [loadingCategoryGigs, setLoadingCategoryGigs] = useState(false);
  const categoryPanelRef = useRef(null);

  useEffect(() => {
    getGigCategories()
      .then((res) => {
        const data = res.data;
        setCategories(Array.isArray(data) ? data : data.results || []);
      })
      .catch(() => {});

    listGigs({ page: 1 })
      .then((res) => {
        const data = res.data;
        const gigs = data.results || (Array.isArray(data) ? data : []);
        setFeaturedGigs(gigs.slice(0, 8));
      })
      .catch(() => {})
      .finally(() => setLoadingGigs(false));
  }, []);

  const handleCategoryClick = (cat) => {
    if (selectedCategory?.id === cat.id) {
      // Toggle off
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setCategoryGigs([]);
      return;
    }
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    fetchCategoryGigs({ category_slug: cat.slug });
    setTimeout(() => {
      categoryPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const handleSubcategoryClick = (subcat) => {
    if (selectedSubcategory?.id === subcat.id) {
      setSelectedSubcategory(null);
      fetchCategoryGigs({ category_slug: selectedCategory.slug });
      return;
    }
    setSelectedSubcategory(subcat);
    fetchCategoryGigs({ subcategory_slug: subcat.slug });
  };

  const fetchCategoryGigs = (params) => {
    setLoadingCategoryGigs(true);
    listGigs(params)
      .then((res) => {
        const data = res.data;
        setCategoryGigs(data.results || (Array.isArray(data) ? data : []));
      })
      .catch(() => setCategoryGigs([]))
      .finally(() => setLoadingCategoryGigs(false));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/gigs?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/gigs");
    }
  };

  return (
    <div className="bg-[#0a0a0f] min-h-screen">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6"
          >
            <FaBriefcase className="text-pink-400 text-sm" />
            <span className="text-white/60 text-sm font-medium">Gig Marketplace by PinkSurfing</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl font-bold text-white mb-5 leading-tight"
          >
            Find & Hire{" "}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Top Freelancers
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-white/50 text-lg max-w-2xl mx-auto mb-10"
          >
            Browse thousands of services from verified professionals. Get quality work
            done faster with our secure marketplace.
          </motion.p>

          {/* Search bar */}
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
          >
            <div className="relative flex-1">
              <IoSearchSharp className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-xl" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for any service..."
                className="w-full pl-12 pr-4 py-4 bg-[#13131a] border border-white/10 rounded-2xl text-white placeholder-white/30 text-base outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-base shadow-lg hover:shadow-purple-500/30 transition-all whitespace-nowrap"
            >
              Search
            </motion.button>
          </motion.form>

          {/* Dashboard & Create links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-3 mt-6"
          >
            <Link
              to="/gighub/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-white/70 text-sm font-medium hover:bg-white/10 hover:border-purple-500/50 hover:text-white transition-all"
            >
              <IoStorefrontOutline className="text-base" />
              My Dashboard
            </Link>
            <Link
              to="/gigs/create"
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600/80 to-pink-500/80 hover:from-purple-600 hover:to-pink-500 text-white text-sm font-medium transition-all shadow-lg shadow-purple-500/10"
            >
              <IoGridOutline className="text-base" />
              Create a Gig
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-2 mt-4"
          >
            <span className="text-white/30 text-sm">Popular:</span>
            {["Logo Design", "Web Development", "Video Editing", "SEO", "Copywriting"].map((tag) => (
              <button
                key={tag}
                onClick={() => navigate(`/gigs?q=${encodeURIComponent(tag)}`)}
                className="px-3 py-1 text-xs text-white/50 border border-white/10 rounded-full hover:border-purple-500/50 hover:text-white/80 transition-all"
              >
                {tag}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TRUST STATS ── */}
      <section className="py-10 px-4 border-y border-white/5 bg-white/2">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {TRUST_STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {stat.value}
              </p>
              <p className="text-white/40 text-sm mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── BROWSE BY CATEGORY ── */}
      {categories.length > 0 && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
                Browse by{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Category
                </span>
              </h2>
              <p className="text-white/40 text-sm max-w-xl mx-auto">
                Click a category to explore subcategories and services.
              </p>
            </div>

            {/* Category cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 12).map((cat, i) => {
                const iconKey = Object.keys(CATEGORY_ICONS).find((k) =>
                  cat.name.toLowerCase().includes(k)
                );
                const Icon = CATEGORY_ICONS[iconKey] || CATEGORY_ICONS.default;
                const gradients = [
                  "from-purple-600/20 to-pink-500/10",
                  "from-blue-600/20 to-cyan-500/10",
                  "from-green-600/20 to-emerald-500/10",
                  "from-yellow-600/20 to-orange-500/10",
                  "from-pink-600/20 to-rose-500/10",
                  "from-indigo-600/20 to-violet-500/10",
                ];
                const gradient = gradients[i % gradients.length];
                const isSelected = selectedCategory?.id === cat.id;

                return (
                  <motion.button
                    key={cat.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 6) * 0.05 }}
                    whileHover={{ y: -4, scale: 1.03 }}
                    onClick={() => handleCategoryClick(cat)}
                    className={`flex flex-col items-center gap-3 p-4 bg-gradient-to-b ${gradient} border rounded-2xl transition-all text-center group ${
                      isSelected
                        ? "border-purple-500/60 ring-2 ring-purple-500/30 scale-105"
                        : "border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isSelected ? "bg-purple-500/20" : "bg-white/5 group-hover:bg-white/10"}`}>
                      <Icon className={`text-xl transition-colors ${isSelected ? "text-purple-300" : "text-white/60 group-hover:text-white/90"}`} />
                    </div>
                    <span className={`text-xs font-medium leading-snug transition-colors ${isSelected ? "text-white" : "text-white/60 group-hover:text-white/90"}`}>
                      {cat.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] text-purple-400 font-semibold">Selected ▾</span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Inline Category Browser Panel */}
            <AnimatePresence>
              {selectedCategory && (
                <motion.div
                  ref={categoryPanelRef}
                  key={selectedCategory.id}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6 border border-white/10 rounded-3xl overflow-hidden bg-[#0e0e16]"
                >
                  {/* Panel header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/2">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setCategoryGigs([]); }}
                        className="flex items-center gap-1 text-white/40 hover:text-white/70 text-xs transition-colors"
                      >
                        <IoChevronBackOutline /> All Categories
                      </button>
                      <span className="text-white/20">/</span>
                      <span className="text-white font-semibold text-sm">{selectedCategory.name}</span>
                      {selectedSubcategory && (
                        <>
                          <span className="text-white/20">/</span>
                          <span className="text-purple-300 text-sm">{selectedSubcategory.name}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/gigs?category_slug=${selectedCategory.slug}`)}
                      className="flex items-center gap-1 text-purple-400 hover:text-purple-300 text-xs transition-colors"
                    >
                      See all <IoArrowForwardOutline />
                    </button>
                  </div>

                  <div className="flex flex-col lg:flex-row min-h-[400px]">
                    {/* Left: Subcategory sidebar */}
                    {selectedCategory.subcategories?.length > 0 && (
                      <div className="w-full lg:w-56 xl:w-64 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 p-4 space-y-1">
                        <p className="text-white/30 text-[11px] font-semibold uppercase tracking-wider px-2 mb-3">
                          Subcategories
                        </p>
                        <button
                          onClick={() => { setSelectedSubcategory(null); fetchCategoryGigs({ category_slug: selectedCategory.slug }); }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                            !selectedSubcategory
                              ? "bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30"
                              : "text-white/50 hover:text-white/80 hover:bg-white/5"
                          }`}
                        >
                          All in {selectedCategory.name}
                        </button>
                        {selectedCategory.subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleSubcategoryClick(sub)}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${
                              selectedSubcategory?.id === sub.id
                                ? "bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30"
                                : "text-white/50 hover:text-white/80 hover:bg-white/5"
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Right: Gigs grid */}
                    <div className="flex-1 p-5">
                      {loadingCategoryGigs ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="bg-[#13131a] rounded-2xl overflow-hidden animate-pulse">
                              <div className="h-36 bg-white/5" />
                              <div className="p-4 space-y-2">
                                <div className="h-3 bg-white/5 rounded-full w-1/2" />
                                <div className="h-4 bg-white/5 rounded-full" />
                                <div className="h-7 bg-white/5 rounded-xl mt-3" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : categoryGigs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                          <FaBriefcase className="text-4xl text-white/10 mb-3" />
                          <p className="text-white/40 text-sm">No services in this category yet.</p>
                          <Link
                            to="/gigs/create"
                            className="mt-3 text-purple-400 hover:text-purple-300 text-sm"
                          >
                            Be the first to post →
                          </Link>
                        </div>
                      ) : (
                        <>
                          <p className="text-white/30 text-xs mb-4">
                            {categoryGigs.length} service{categoryGigs.length !== 1 ? "s" : ""} found
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {categoryGigs.slice(0, 9).map((gig) => (
                              <GigCard key={gig.id} gig={gig} />
                            ))}
                          </div>
                          {categoryGigs.length > 9 && (
                            <div className="text-center mt-6">
                              <button
                                onClick={() => navigate(
                                  selectedSubcategory
                                    ? `/gigs?subcategory_slug=${selectedSubcategory.slug}`
                                    : `/gigs?category_slug=${selectedCategory.slug}`
                                )}
                                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
                              >
                                View all {categoryGigs.length} services <IoArrowForwardOutline />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center mt-8">
              <Link
                to="/gigs"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium transition-colors"
              >
                View all categories <IoArrowForwardOutline />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED GIGS ── */}
      <section className="py-16 px-4 bg-white/2 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                Featured{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Services
                </span>
              </h2>
              <p className="text-white/40 text-sm">Hand-picked top-rated services for you</p>
            </div>
            <Link
              to="/gigs"
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-[#13131a] border border-white/10 rounded-xl text-white/60 text-sm hover:border-white/20 transition-all"
            >
              View all <IoArrowForwardOutline />
            </Link>
          </div>

          {loadingGigs ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-[#13131a] rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-44 bg-white/5" />
                  <div className="p-4 space-y-3">
                    <div className="h-3 bg-white/5 rounded-full w-1/2" />
                    <div className="h-4 bg-white/5 rounded-full" />
                    <div className="h-4 bg-white/5 rounded-full w-3/4" />
                    <div className="h-8 bg-white/5 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredGigs.length === 0 ? (
            <div className="text-center py-16">
              <FaBriefcase className="text-5xl text-white/10 mx-auto mb-4" />
              <p className="text-white/40">No gigs available yet.</p>
              <Link
                to="/gigs/create"
                className="mt-4 inline-block text-purple-400 hover:text-purple-300 text-sm"
              >
                Be the first to post a gig →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {featuredGigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          )}

          <div className="text-center mt-8 sm:hidden">
            <Link
              to="/gigs"
              className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-medium"
            >
              See all gigs <IoArrowForwardOutline />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
              How It{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-white/40 text-sm max-w-xl mx-auto">
              From posting to getting paid — simple, fast, and secure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="relative bg-[#13131a] border border-white/5 rounded-2xl p-6 text-center hover:border-white/10 transition-all"
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center shadow-lg">
                  {item.step.split("0")[1]}
                </div>
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4 mt-2">
                  {item.icon}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-purple-950/20">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-r from-purple-900/40 to-pink-900/30 border border-white/10 rounded-3xl p-10 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-600/20 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">
                Start Selling Your Skills Today
              </h2>
              <p className="text-white/50 text-base max-w-xl mx-auto mb-8">
                Join thousands of freelancers earning on PinkSurfing. Keep 95% of every sale.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/gigs/create"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-base shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  Create a Gig
                </Link>
                <Link
                  to="/gigs"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-base hover:bg-white/10 transition-all"
                >
                  Browse Services
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 mt-8">
                {[
                  { icon: <IoShieldCheckmarkOutline className="text-green-400 text-lg" />, text: "Secure payments" },
                  { icon: <IoCheckmarkCircle className="text-blue-400 text-lg" />, text: "Money-back guarantee" },
                  { icon: <IoTrendingUpOutline className="text-purple-400 text-lg" />, text: "95% seller earnings" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/40 text-sm">
                    {item.icon}
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GigHubLanding;
