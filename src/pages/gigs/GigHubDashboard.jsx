import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import {
  getMyGigOrders,
  getMyGigs,
  getMyGigWorkerProfile,
  deleteGig,
} from "../../api/gigs";
import {
  IoStarSharp,
  IoTimeOutline,
  IoCheckmarkCircle,
  IoAlertCircleOutline,
  IoAddCircleOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoEyeOutline,
  IoTrendingUpOutline,
  IoWalletOutline,
  IoChatbubbleOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";
import { FiCreditCard } from "react-icons/fi";

const STATUS_CONFIG = {
  pending_requirements: {
    label: "Awaiting Requirements",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    dot: "bg-yellow-400",
  },
  in_progress: {
    label: "In Progress",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    dot: "bg-blue-400",
  },
  delivered: {
    label: "Delivered",
    color: "text-purple-400 bg-purple-500/10 border-purple-500/30",
    dot: "bg-purple-400",
  },
  completed: {
    label: "Completed",
    color: "text-green-400 bg-green-500/10 border-green-500/30",
    dot: "bg-green-400",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    dot: "bg-red-400",
  },
};

// ── BUYER TAB ──────────────────────────────────────────────────────────────

const BuyerTab = ({ orders, loading, refetch }) => {
  const [filter, setFilter] = useState("all");

  // "Active" groups in-progress + awaiting-requirements (both are paid orders simply
  // waiting on work or buyer input). We never expose unpaid states.
  const matchesFilter = (o) => {
    if (filter === "all") return true;
    if (filter === "in_progress") return ["in_progress", "pending_requirements"].includes(o.status);
    return o.status === filter;
  };
  const filteredOrders = orders.filter(matchesFilter);

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "in_progress", label: "Active" },
    { key: "delivered", label: "Delivered" },
    { key: "completed", label: "Completed" },
  ];

  const totalSpent = orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
  const activeCount = orders.filter((o) =>
    ["in_progress", "pending_requirements"].includes(o.status)
  ).length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-10">
      {/* Hero metrics — 3 meaningful figures, restrained typography */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Total spent",
            value: `$${totalSpent.toFixed(2)}`,
            sub: `${orders.length} ${orders.length === 1 ? "order" : "orders"}`,
          },
          {
            label: "Active",
            value: activeCount,
            sub: activeCount === 0 ? "nothing in flight" : "in progress",
          },
          {
            label: "Completed",
            value: completedCount,
            sub: completedCount === 0 ? "no completed yet" : "delivered & approved",
          },
        ].map((m, i) => (
          <div
            key={i}
            className="bg-white/[0.025] border border-white/[0.06] rounded-2xl p-5 backdrop-blur-xl"
          >
            <p className="text-white/45 text-[13px] font-medium tracking-tight">{m.label}</p>
            <p className="text-white text-[34px] leading-none font-semibold tracking-tight mt-3">
              {m.value}
            </p>
            <p className="text-white/30 text-xs mt-2">{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Section header + filter (segmented control, iOS-style) */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-white text-[22px] font-semibold tracking-tight">Your orders</h2>
          <p className="text-white/40 text-sm mt-1">
            All payments completed securely via Square.
          </p>
        </div>

        {orders.length > 0 && (
          <div className="inline-flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                  filter === f.key
                    ? "bg-white text-black shadow-sm"
                    : "text-white/55 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/[0.03] rounded-2xl animate-pulse h-[88px]" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-dashed border-white/[0.08] rounded-3xl">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <FaBriefcase className="text-white/30 text-lg" />
          </div>
          <p className="text-white/70 font-medium tracking-tight">
            {orders.length === 0 ? "No orders yet" : "Nothing here"}
          </p>
          <p className="text-white/35 text-sm mt-1 mb-6">
            {orders.length === 0
              ? "Discover talented sellers ready to help."
              : "Try a different filter to see your other orders."}
          </p>
          {orders.length === 0 && (
            <Link
              to="/gigs"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full text-[13px] font-medium hover:bg-white/90 transition-all"
            >
              Explore GigHub
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress;
            return (
              <Link
                key={order.id}
                to={`/gigs/orders/${order.id}`}
                className="group block bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-5 transition-all duration-200"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      <p className="text-white/55 text-[11px] font-semibold uppercase tracking-[0.08em]">
                        {statusCfg.label}
                      </p>
                    </div>
                    <p className="text-white font-semibold text-[15px] tracking-tight line-clamp-1">
                      {order.gig?.title || `Order #${order.id}`}
                    </p>
                    <div className="flex items-center gap-2 text-white/35 text-xs mt-2">
                      {order.package && (
                        <>
                          <span className="capitalize">{order.package.tier} package</span>
                          <span className="text-white/15">·</span>
                        </>
                      )}
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-semibold text-[17px] tracking-tight">
                      ${parseFloat(order.total_price || 0).toFixed(2)}
                    </p>
                    <div className="inline-flex items-center gap-1 text-emerald-400/80 text-[11px] mt-1 font-medium">
                      <IoCheckmarkCircle className="text-[13px]" />
                      <span>Paid</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── SELLER TAB ─────────────────────────────────────────────────────────────

const SellerTab = ({ workerProfile, sellerOrders, myGigs, loadingOrders, loadingGigs, refetchGigs }) => {
  const [cookies] = useCookies(["access_token"]);
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  const handleSquareOnboarding = async () => {
    if (!workerProfile?.id) {
      toast.error("Seller account setup incomplete.");
      return;
    }
    setOnboardingLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/payments/square/onboarding-link/${workerProfile.id}/?type=gigworker`,
        {},
        {
          headers: {
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      );
      if (response.data?.action_url) {
        window.location.href = response.data.action_url;
      }
    } catch (error) {
      toast.error("Failed to get Square onboarding link.");
    } finally {
      setOnboardingLoading(false);
    }
  };

  const totalEarnings = sellerOrders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + parseFloat(o.seller_net_earnings || 0), 0);

  const activeOrders = sellerOrders.filter((o) =>
    ["pending_requirements", "in_progress", "delivered"].includes(o.status)
  ).length;

  const completedOrders = sellerOrders.filter((o) => o.status === "completed").length;

  const handleDeleteGig = async (gigId) => {
    if (!window.confirm("Are you sure you want to delete this gig?")) return;
    try {
      setDeletingId(gigId);
      await deleteGig(cookies.access_token, gigId);
      toast.success("Gig deleted.");
      refetchGigs();
    } catch {
      toast.error("Failed to delete gig.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Analytics cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Total Earnings",
            value: `$${totalEarnings.toFixed(2)}`,
            icon: <IoWalletOutline className="text-green-400 text-xl" />,
            sub: "95% of sales",
          },
          {
            label: "Active Orders",
            value: activeOrders,
            icon: <IoTimeOutline className="text-blue-400 text-xl" />,
            sub: "in progress",
          },
          {
            label: "Completed",
            value: completedOrders,
            icon: <IoCheckmarkCircle className="text-purple-400 text-xl" />,
            sub: "total orders",
          },
          {
            label: "Avg Rating",
            value: workerProfile?.rating || "0.00",
            icon: <IoStarSharp className="text-yellow-400 text-xl" />,
            sub: "from buyers",
          },
        ].map((card, i) => (
          <div key={i} className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/40 text-xs">{card.label}</p>
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">{card.icon}</div>
            </div>
            <p className="text-white font-bold text-2xl">{card.value}</p>
            <p className="text-white/25 text-xs mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Payouts & Square Connection */}
      <div className="bg-[#13131a] border border-white/5 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl">
              <FiCreditCard />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Payouts & Square</h3>
              <p className="text-white/40 text-sm">Receive your gig earnings directly to your Square account.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
              workerProfile?.square_connected 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              {workerProfile?.square_connected ? "Square Connected" : "Square Not Linked"}
            </div>
            <button
              onClick={handleSquareOnboarding}
              disabled={onboardingLoading}
              className="px-6 py-2.5 bg-white text-black font-bold rounded-xl hover:bg-white/90 transition-all text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {onboardingLoading ? (
                <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <FiCreditCard />
              )}
              {workerProfile?.square_connected ? "Reconnect Square" : "Connect Square"}
            </button>
          </div>
        </div>
        {!workerProfile?.square_connected && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
            <IoAlertCircleOutline className="text-amber-400 text-lg flex-shrink-0 mt-0.5" />
            <p className="text-amber-400/80 text-xs leading-relaxed">
              To accept payments for your gigs, you must connect a Square account. 
              Earnings will be deposited into your account minus the platform fees.
            </p>
          </div>
        )}
      </div>

      {/* My Gigs section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">My Gigs</h3>
          <Link
            to="/gigs/create"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600/80 to-pink-500/80 hover:from-purple-600 hover:to-pink-500 text-white text-xs font-semibold transition-all"
          >
            <IoAddCircleOutline className="text-base" />
            New Gig
          </Link>
        </div>

        {loadingGigs ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="bg-[#13131a] rounded-2xl p-5 animate-pulse h-20" />)}
          </div>
        ) : myGigs.length === 0 ? (
          <div className="text-center py-12 bg-[#13131a] border border-white/5 rounded-2xl border-dashed">
            <FaBriefcase className="text-4xl text-white/10 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No gigs yet</p>
            <Link to="/gigs/create" className="mt-3 inline-block text-purple-400 hover:text-purple-300 text-sm">
              Create your first gig →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myGigs.map((gig) => {
              const mainImg = gig.media_files?.find((m) => m.is_main) || gig.media_files?.[0];
              const lowestPkg = gig.packages?.length
                ? gig.packages.reduce((min, p) => parseFloat(p.price) < parseFloat(min.price) ? p : min, gig.packages[0])
                : null;
              const statusColor =
                gig.status === "active"
                  ? "text-green-400 bg-green-500/10 border-green-500/30"
                  : gig.status === "paused"
                  ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                  : "text-gray-400 bg-gray-500/10 border-gray-500/30";

              return (
                <div
                  key={gig.id}
                  className="bg-[#13131a] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all"
                >
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1a1a24] flex-shrink-0">
                      {mainImg ? (
                        <img src={mainImg.file} alt={gig.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaBriefcase className="text-white/15 text-xl" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start gap-2 mb-1">
                        <p className="text-white font-semibold text-sm flex-1 line-clamp-1">{gig.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusColor}`}>
                          {gig.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/40 text-xs mb-2">
                        {gig.category_details && <span>{gig.category_details.name}</span>}
                        {lowestPkg && <span>From ${parseFloat(lowestPkg.price).toFixed(2)}</span>}
                        <span className="flex items-center gap-1">
                          <IoStarSharp className="text-yellow-400 text-xs" />
                          {gig.rating}
                        </span>
                        <span>{gig.total_orders_completed} orders</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          to={`/gigs/${gig.gig_id || gig.id}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition-all"
                        >
                          <IoEyeOutline className="text-sm" /> View
                        </Link>
                        <button
                          onClick={() => navigate(`/gigs/create?edit=${gig.gig_id || gig.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs hover:bg-purple-500/20 transition-all"
                        >
                          <IoPencilOutline className="text-sm" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteGig(gig.id)}
                          disabled={deletingId === gig.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-all disabled:opacity-50"
                        >
                          <IoTrashOutline className="text-sm" />
                          {deletingId === gig.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Orders to fulfill */}
      <div>
        <h3 className="text-white font-bold text-lg mb-4">Orders to Fulfill</h3>
        {loadingOrders ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="bg-[#13131a] rounded-2xl p-5 animate-pulse h-20" />)}
          </div>
        ) : sellerOrders.filter((o) => ["pending_requirements", "in_progress", "delivered"].includes(o.status)).length === 0 ? (
          <div className="text-center py-10 bg-[#13131a] border border-white/5 rounded-2xl">
            <IoCheckmarkCircle className="text-4xl text-green-400/30 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No pending orders. You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sellerOrders
              .filter((o) => ["pending_requirements", "in_progress", "delivered"].includes(o.status))
              .map((order) => {
                const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress;
                return (
                  <Link
                    key={order.id}
                    to={`/gigs/orders/${order.id}`}
                    className="flex items-center gap-4 bg-[#13131a] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-semibold line-clamp-1 mb-1">
                        {order.gig?.title || `Order #${order.id}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className="text-white/30">#{order.id}</span>
                        <span className="text-white/30">Buyer: {order.buyer_username || "—"}</span>
                        {order.due_date && (
                          <span className="text-white/30">
                            Due: {new Date(order.due_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-bold">${parseFloat(order.seller_net_earnings || 0).toFixed(2)}</p>
                      <p className="text-white/30 text-xs">you earn</p>
                    </div>
                  </Link>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

// ── MAIN DASHBOARD ─────────────────────────────────────────────────────────

const GigHubDashboard = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [activeTab, setActiveTab] = useState("buying");
  const [workerProfile, setWorkerProfile] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [loadingWorker, setLoadingWorker] = useState(true);

  useEffect(() => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    fetchAll();
  }, [cookies.access_token]);

  const fetchAll = () => {
    fetchOrders();
    fetchWorkerAndGigs();
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getMyGigOrders(cookies.access_token);
      const data = res.data;
      setAllOrders(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      toast.error("Failed to load orders.");
      setAllOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchWorkerAndGigs = async () => {
    setLoadingWorker(true);
    setLoadingGigs(true);
    // Run both calls in parallel
    const [workerResult, gigsResult] = await Promise.allSettled([
      getMyGigWorkerProfile(cookies.access_token),
      getMyGigs(cookies.access_token),
    ]);

    if (workerResult.status === "fulfilled") {
      setWorkerProfile(workerResult.value.data);
    } else {
      setWorkerProfile(null);
    }
    setLoadingWorker(false);

    if (gigsResult.status === "fulfilled") {
      const data = gigsResult.value.data;
      setMyGigs(Array.isArray(data) ? data : data.results || []);
    } else {
      setMyGigs([]);
    }
    setLoadingGigs(false);
  };

  // Split orders into buyer orders vs seller orders using API-provided flags.
  // The backend now returns both types for customers who are also sellers.
  const buyerOrders = allOrders.filter((o) => o.is_buyer === true);
  const sellerOrders = allOrders.filter((o) => o.is_seller === true);

  const TABS = [
    { key: "buying", label: "Buying", icon: <FaBriefcase /> },
    { key: "selling", label: "Selling", icon: <IoStorefrontOutline /> },
  ];

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden">
      <div className="absolute -top-32 right-0 w-[640px] h-[640px] bg-purple-600/[0.06] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute -bottom-32 -left-20 w-[520px] h-[520px] bg-pink-600/[0.05] rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-12 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10"
        >
          <div className="flex-1">
            <p className="text-white/40 text-[13px] font-medium tracking-tight mb-3">
              GigHub
            </p>
            <h1 className="text-white text-[40px] sm:text-[44px] leading-[1.05] font-semibold tracking-[-0.02em]">
              {user?.first_name ? `Welcome back, ${user.first_name}.` : "Welcome back."}
            </h1>
            <p className="text-white/45 text-[15px] mt-3 tracking-tight">
              A quiet place to manage your gigs and orders.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/gigs"
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-full text-white/70 text-[13px] font-medium hover:bg-white/[0.07] hover:text-white transition-all"
            >
              <IoEyeOutline className="text-[15px]" /> Browse
            </Link>
            <Link
              to="/gighub/messages"
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] rounded-full text-white/70 text-[13px] font-medium hover:bg-white/[0.07] hover:text-white transition-all"
            >
              <IoChatbubbleOutline className="text-[15px]" /> Messages
            </Link>
          </div>
        </motion.div>

        {/* Tab selector — iOS-style segmented control */}
        <div className="inline-flex gap-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-[13px] font-medium tracking-tight transition-all ${
                activeTab === tab.key
                  ? "bg-white text-black shadow-sm"
                  : "text-white/55 hover:text-white"
              }`}
            >
              <span className="text-[14px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === "buying" ? (
            <motion.div
              key="buying"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <BuyerTab orders={buyerOrders} loading={loadingOrders} refetch={fetchOrders} />
            </motion.div>
          ) : (
            <motion.div
              key="selling"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <SellerTab
                workerProfile={workerProfile}
                sellerOrders={sellerOrders}
                myGigs={myGigs}
                loadingOrders={loadingOrders}
                loadingGigs={loadingGigs}
                refetchGigs={fetchWorkerAndGigs}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GigHubDashboard;
