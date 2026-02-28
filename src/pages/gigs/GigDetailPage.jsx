import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import { getGig, createGigOrder, createStripeCheckoutSession } from "../../api/gigs";
import GigSellerChatModal from "../../components/gigs/GigSellerChatModal";
import {
  IoStarSharp,
  IoTimeOutline,
  IoRefreshOutline,
  IoCheckmarkCircle,
  IoChevronBackOutline,
  IoChevronForwardOutline,
  IoShieldCheckmarkOutline,
  IoPersonCircleOutline,
  IoChatbubbleOutline,
} from "react-icons/io5";
import { FaBriefcase, FaCheck } from "react-icons/fa";

const TIER_STYLES = {
  basic: {
    label: "Basic",
    gradient: "from-blue-600/20 to-blue-500/10",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    btn: "from-blue-600 to-blue-500",
    shadow: "hover:shadow-blue-500/20",
  },
  standard: {
    label: "Standard",
    gradient: "from-purple-600/20 to-purple-500/10",
    border: "border-purple-500/30",
    badge: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    btn: "from-purple-600 to-purple-500",
    shadow: "hover:shadow-purple-500/20",
    popular: true,
  },
  premium: {
    label: "Premium",
    gradient: "from-yellow-600/20 to-yellow-500/10",
    border: "border-yellow-500/30",
    badge: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    btn: "from-yellow-600 to-yellow-500",
    shadow: "hover:shadow-yellow-500/20",
  },
};

const GigDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    getGig(id)
      .then((res) => {
        setGig(res.data);
        if (res.data.packages?.length > 0) {
          const std = res.data.packages.find((p) => p.tier === "standard") || res.data.packages[0];
          setSelectedPkg(std);
        }
      })
      .catch(() => toast.error("Failed to load gig."))
      .finally(() => setLoading(false));
  }, [id]);

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  };

  const totalPrice = () => {
    const base = parseFloat(selectedPkg?.price || 0);
    const addonSum = selectedAddons.reduce((s, a) => s + parseFloat(a.price), 0);
    return (base + addonSum + (base + addonSum) * 0.05).toFixed(2); // +5% buyer fee
  };

  const handleBuy = async () => {
    if (!cookies.access_token) {
      toast.error("Please sign in to purchase.");
      navigate("/signin");
      return;
    }
    if (!selectedPkg) {
      toast.error("Please select a package.");
      return;
    }
    try {
      setPurchasing(true);
      const orderRes = await createGigOrder(cookies.access_token, {
        gig_id: gig.id,
        package_id: selectedPkg.id,
        addons: selectedAddons.map((a) => a.id),
      });
      const order = orderRes.data;
      const sessionRes = await createStripeCheckoutSession(cookies.access_token, order.id);
      const { url } = sessionRes.data;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("Failed to create Stripe session.");
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.response?.data?.error || "Purchase failed.";
      toast.error(msg);
    } finally {
      setPurchasing(false);
    }
  };

  const images = gig?.media_files?.filter((m) => m.media_type === "image") || [];
  const prevImage = () => setActiveImageIdx((i) => (i === 0 ? images.length - 1 : i - 1));
  const nextImage = () => setActiveImageIdx((i) => (i === images.length - 1 ? 0 : i + 1));

  if (loading) {
    return (
      <div className="bg-[#0a0a0f] min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="bg-[#0a0a0f] min-h-screen flex flex-col items-center justify-center">
        <FaBriefcase className="text-5xl text-white/10 mb-4" />
        <p className="text-white/40 text-lg">Gig not found</p>
        <Link to="/gigs" className="mt-4 text-purple-400 hover:text-purple-300 text-sm">
          ← Browse gigs
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden">
      {/* Orbs */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-600/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-white/40 text-sm mb-6">
          <Link to="/gigs" className="hover:text-white/70 transition-colors">Gigs</Link>
          <span>/</span>
          {gig.category_details && (
            <>
              <span className="hover:text-white/70 cursor-pointer">{gig.category_details.name}</span>
              <span>/</span>
            </>
          )}
          <span className="text-white/70 truncate max-w-xs">{gig.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── LEFT COLUMN ── */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight"
            >
              {gig.title}
            </motion.h1>

            {/* Worker row */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold uppercase text-sm">
                {gig.worker?.username?.[0] || "?"}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{gig.worker?.username}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1">
                    <IoStarSharp className="text-yellow-400 text-xs" />
                    <span className="text-white/70 text-xs font-medium">{gig.rating}</span>
                  </div>
                  <span className="text-white/20">•</span>
                  <span className="text-white/40 text-xs">{gig.total_orders_completed} orders completed</span>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            {images.length > 0 ? (
              <div className="relative rounded-2xl overflow-hidden bg-[#13131a] mb-6 aspect-video">
                <img
                  src={images[activeImageIdx]?.file}
                  alt={gig.title}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    >
                      <IoChevronBackOutline />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-all"
                    >
                      <IoChevronForwardOutline />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIdx(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === activeImageIdx ? "bg-white" : "bg-white/30"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-[#13131a] border border-white/5 aspect-video flex items-center justify-center mb-6">
                <FaBriefcase className="text-6xl text-white/10" />
              </div>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      i === activeImageIdx ? "border-purple-500" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <img src={img.file} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 border-b border-white/5 mb-5">
              {["overview", "packages", "addons"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-purple-500 text-white"
                      : "border-transparent text-white/40 hover:text-white/60"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{gig.description}</p>
                  {gig.requirements?.length > 0 && (
                    <div className="bg-[#13131a] border border-white/5 rounded-xl p-4">
                      <p className="text-white font-semibold text-sm mb-3">Seller will ask for:</p>
                      <ul className="space-y-2">
                        {gig.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-2 text-white/60 text-sm">
                            <IoCheckmarkCircle className="text-purple-400 text-base mt-0.5 flex-shrink-0" />
                            {req.question}
                            {req.is_mandatory && (
                              <span className="text-pink-400 text-[10px] ml-1">(required)</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "packages" && (
                <motion.div
                  key="packages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                >
                  {gig.packages?.map((pkg) => {
                    const style = TIER_STYLES[pkg.tier] || TIER_STYLES.basic;
                    const isSelected = selectedPkg?.id === pkg.id;
                    return (
                      <motion.div
                        key={pkg.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedPkg(pkg)}
                        className={`relative cursor-pointer bg-gradient-to-b ${style.gradient} border rounded-2xl p-4 transition-all ${
                          isSelected ? `${style.border} shadow-lg` : "border-white/5 hover:border-white/10"
                        }`}
                      >
                        {style.popular && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                            POPULAR
                          </span>
                        )}
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center">
                            <FaCheck className="text-white text-[9px]" />
                          </div>
                        )}
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mb-3 ${style.badge}`}>
                          {style.label}
                        </span>
                        {pkg.title && <p className="text-white font-semibold text-sm mb-1">{pkg.title}</p>}
                        <p className="text-white/50 text-xs leading-relaxed mb-3">{pkg.description}</p>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-white/60 text-xs">
                            <IoTimeOutline className="text-sm" />
                            <span>{pkg.delivery_days} day delivery</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-white/60 text-xs">
                            <IoRefreshOutline className="text-sm" />
                            <span>{pkg.revisions} revision{pkg.revisions !== 1 ? "s" : ""}</span>
                          </div>
                        </div>
                        <p className="text-white font-bold text-xl mt-3">${parseFloat(pkg.price).toFixed(2)}</p>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === "addons" && (
                <motion.div
                  key="addons"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {gig.addons?.length > 0 ? (
                    <div className="space-y-3">
                      {gig.addons.map((addon) => {
                        const checked = selectedAddons.find((a) => a.id === addon.id);
                        return (
                          <motion.div
                            key={addon.id}
                            whileHover={{ scale: 1.01 }}
                            onClick={() => toggleAddon(addon)}
                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                              checked
                                ? "bg-purple-600/10 border-purple-500/40"
                                : "bg-[#13131a] border-white/5 hover:border-white/10"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                checked ? "bg-purple-600 border-purple-500" : "border-white/20"
                              }`}>
                                {checked && <FaCheck className="text-white text-[9px]" />}
                              </div>
                              <div>
                                <p className="text-white text-sm font-medium">{addon.name}</p>
                                {addon.additional_days > 0 && (
                                  <p className="text-white/40 text-xs">+{addon.additional_days} days</p>
                                )}
                              </div>
                            </div>
                            <span className="text-white font-semibold">+${parseFloat(addon.price).toFixed(2)}</span>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-white/30 text-sm text-center py-8">No add-ons available for this gig.</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── RIGHT COLUMN — Order Sidebar ── */}
          <div className="lg:w-80 xl:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              {/* Package selector (compact) */}
              {gig.packages?.length > 0 && (
                <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
                  <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Select Package</p>
                  <div className="flex gap-2">
                    {gig.packages.map((pkg) => {
                      const style = TIER_STYLES[pkg.tier] || TIER_STYLES.basic;
                      const isSelected = selectedPkg?.id === pkg.id;
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPkg(pkg)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? `bg-gradient-to-r ${style.btn} border-transparent text-white shadow-md`
                              : "bg-transparent border-white/10 text-white/50 hover:border-white/20"
                          }`}
                        >
                          {style.label}
                        </button>
                      );
                    })}
                  </div>

                  {selectedPkg && (
                    <motion.div
                      key={selectedPkg.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 space-y-2"
                    >
                      {selectedPkg.title && (
                        <p className="text-white font-semibold text-sm">{selectedPkg.title}</p>
                      )}
                      <p className="text-white/50 text-xs leading-relaxed">{selectedPkg.description}</p>
                      <div className="flex gap-4 pt-1">
                        <div className="flex items-center gap-1 text-white/60 text-xs">
                          <IoTimeOutline />
                          <span>{selectedPkg.delivery_days}d</span>
                        </div>
                        <div className="flex items-center gap-1 text-white/60 text-xs">
                          <IoRefreshOutline />
                          <span>{selectedPkg.revisions} revisions</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Order summary */}
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Order Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Package ({TIER_STYLES[selectedPkg?.tier]?.label || "—"})</span>
                    <span>${parseFloat(selectedPkg?.price || 0).toFixed(2)}</span>
                  </div>
                  {selectedAddons.map((a) => (
                    <div key={a.id} className="flex justify-between text-white/60">
                      <span>{a.name}</span>
                      <span>+${parseFloat(a.price).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-white/40 text-xs">
                    <span>Service fee (5%)</span>
                    <span>
                      ${(
                        (parseFloat(selectedPkg?.price || 0) +
                          selectedAddons.reduce((s, a) => s + parseFloat(a.price), 0)) *
                        0.05
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-2 flex justify-between text-white font-bold text-base">
                    <span>Total</span>
                    <span>${totalPrice()}</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: purchasing ? 1 : 1.02 }}
                  whileTap={{ scale: purchasing ? 1 : 0.98 }}
                  onClick={handleBuy}
                  disabled={purchasing || !selectedPkg}
                  className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {purchasing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Continue to Checkout"
                  )}
                </motion.button>

                {!user && (
                  <p className="text-center text-white/30 text-xs mt-2">
                    <Link to="/signin" className="text-purple-400 hover:text-purple-300">Sign in</Link> to purchase
                  </p>
                )}

                {/* Trust badges */}
                <div className="mt-4 space-y-2">
                  {[
                    { icon: <IoShieldCheckmarkOutline className="text-green-400" />, text: "Secure payment via Stripe" },
                    { icon: <IoRefreshOutline className="text-blue-400" />, text: "Revisions as specified" },
                    { icon: <IoCheckmarkCircle className="text-purple-400" />, text: "Money-back guarantee" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-white/40 text-xs">
                      {item.icon}
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worker card */}
              <div className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">About the Seller</p>
                <div className="flex items-center gap-3">
                  {gig.worker?.profile_picture ? (
                    <img src={gig.worker.profile_picture} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-lg uppercase">
                      {gig.worker?.username?.[0] || "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-semibold text-sm">{gig.worker?.username}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <IoStarSharp className="text-yellow-400 text-xs" />
                      <span className="text-white/60 text-xs">{gig.worker?.rating} rating</span>
                    </div>
                  </div>
                </div>
                {gig.worker?.bio && (
                  <p className="text-white/40 text-xs mt-3 leading-relaxed line-clamp-3">{gig.worker.bio}</p>
                )}
                <div className="mt-3 flex items-center gap-2 text-white/40 text-xs">
                  <IoCheckmarkCircle className="text-green-400 text-sm" />
                  <span>{gig.worker?.total_orders_completed} orders completed</span>
                </div>

                {/* Message Seller */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!cookies.access_token) {
                      toast.error("Please sign in to message this seller.");
                      navigate("/signin");
                      return;
                    }
                    setChatOpen(true);
                  }}
                  className="mt-4 w-full py-2.5 rounded-xl border border-purple-500/30 bg-purple-600/10 text-purple-400 font-semibold text-sm hover:bg-purple-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <IoChatbubbleOutline className="text-base" />
                  Message Seller
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Chat Modal */}
      <GigSellerChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        accessToken={cookies.access_token}
        sellerEmail={gig.worker?.email}
        sellerName={gig.worker?.name || gig.worker?.username || "Seller"}
        currentUserEmail={user?.email}
      />
    </div>
  );
};

export default GigDetailPage;
