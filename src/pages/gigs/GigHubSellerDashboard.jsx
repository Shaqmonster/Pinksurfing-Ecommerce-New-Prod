import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import {
  getMyGigOrders,
  getMyGigs,
  getMyGigWorkerProfile,
  deleteGig,
  gigUrl,
} from "../../api/gigs";
import { resolveAccessToken } from "../../utils/authSession";
import {
  IoStarSharp,
  IoTimeOutline,
  IoCheckmarkCircle,
  IoAlertCircleOutline,
  IoAddCircleOutline,
  IoTrashOutline,
  IoPencilOutline,
  IoEyeOutline,
  IoWalletOutline,
  IoChatbubbleOutline,
  IoStorefrontOutline,
} from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";
import { FiCreditCard } from "react-icons/fi";

const STATUS_CONFIG = {
  pending_requirements: {
    label: "Awaiting Requirements",
    color: "text-amber-400/95 bg-amber-500/10 border-amber-500/25",
    dot: "bg-amber-400",
  },
  in_progress: {
    label: "In Progress",
    color: "text-pink-400/95 bg-pink-500/10 border-pink-500/25",
    dot: "bg-pink-400",
  },
  delivered: {
    label: "Delivered",
    color: "text-violet-400/95 bg-violet-500/10 border-violet-500/25",
    dot: "bg-violet-400",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-400/95 bg-emerald-500/10 border-emerald-500/25",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    dot: "bg-red-400",
  },
};

/** Seller studio — payouts, gigs, and orders to fulfill (separate from buyer dashboard). */
const GigHubSellerDashboard = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user, authToken, openChatInbox } = useContext(authContext);
  const accessToken = resolveAccessToken(authToken, cookies.access_token);

  const [workerProfile, setWorkerProfile] = useState(null);
  const [allOrders, setAllOrders] = useState([]);
  const [myGigs, setMyGigs] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingGigs, setLoadingGigs] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      navigate("/signin");
      return;
    }
    fetchOrders();
    fetchWorkerAndGigs();
  }, [accessToken]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getMyGigOrders(accessToken);
      const data = res.data;
      setAllOrders(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error("Failed to load orders.");
      setAllOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchWorkerAndGigs = async () => {
    setLoadingGigs(true);
    const [workerResult, gigsResult] = await Promise.allSettled([
      getMyGigWorkerProfile(accessToken),
      getMyGigs(accessToken),
    ]);

    if (workerResult.status === "fulfilled") {
      setWorkerProfile(workerResult.value.data);
    } else {
      setWorkerProfile(null);
    }

    if (gigsResult.status === "fulfilled") {
      const data = gigsResult.value.data;
      setMyGigs(Array.isArray(data) ? data : data.results || []);
    } else {
      setMyGigs([]);
    }
    setLoadingGigs(false);
  };

  const sellerOrders = allOrders.filter((o) => {
    if (o.is_seller !== true) return false;
    if (o.status === "pending_payment") return false;
    if (o.payment_status && ["pending", "unpaid", "failed"].includes(o.payment_status)) return false;
    return true;
  });

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
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (response.data?.action_url) {
        window.location.href = response.data.action_url;
      }
    } catch {
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
      await deleteGig(accessToken, gigId);
      toast.success("Gig deleted.");
      fetchWorkerAndGigs();
    } catch {
      toast.error("Failed to delete gig.");
    } finally {
      setDeletingId(null);
    }
  };

  const fulfillOrders = sellerOrders.filter((o) =>
    ["pending_requirements", "in_progress", "delivered"].includes(o.status)
  );

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden">
      <div className="absolute -top-28 right-10 w-[560px] h-[560px] bg-pink-600/[0.09] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[480px] h-[480px] bg-violet-600/[0.07] rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-12 pb-16">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12"
        >
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Link
                to="/gighub/dashboard"
                className="text-white/45 text-[13px] font-medium hover:text-pink-400/90 transition-colors"
              >
                ← Buyer orders
              </Link>
              <span className="text-white/15 hidden sm:inline">|</span>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
                <IoStorefrontOutline className="text-pink-400 text-base" />
                Seller studio
              </span>
            </div>
            <h1 className="text-white text-[34px] sm:text-[40px] leading-[1.08] font-semibold tracking-[-0.02em]">
              {user?.first_name ? `${user.first_name}, your storefront.` : "Your storefront."}
            </h1>
            <p className="text-white/45 text-[15px] mt-3 max-w-xl tracking-tight">
              Gigs, payouts, and deliveries — kept separate from orders you place as a buyer.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={openChatInbox}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium bg-white/[0.04] border border-pink-500/15 text-white/75 hover:border-pink-500/35 hover:bg-pink-500/[0.06] transition-all"
            >
              <IoChatbubbleOutline className="text-[15px] text-pink-400/90" /> Messages
            </button>
            <Link
              to="/gigs/create"
              className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-500 shadow-lg shadow-pink-500/15 hover:opacity-95 transition-opacity"
            >
              <IoAddCircleOutline className="text-[17px]" /> New gig
            </Link>
          </div>
        </motion.div>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
          {[
            {
              label: "Completed earnings",
              value: `$${totalEarnings.toFixed(2)}`,
              sub: "from finished orders",
            },
            {
              label: "Active to fulfill",
              value: activeOrders,
              sub: "need your attention",
            },
            {
              label: "Completed orders",
              value: completedOrders,
              sub: "as seller",
            },
            {
              label: "Your rating",
              value: workerProfile?.rating ?? "—",
              sub: "buyer reviews",
            },
          ].map((m, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 bg-[#13131a]/80 border border-pink-500/[0.08] backdrop-blur-md"
            >
              <p className="text-white/45 text-[12px] font-medium">{m.label}</p>
              <p className="text-white text-2xl font-semibold tracking-tight mt-2">{m.value}</p>
              <p className="text-white/30 text-[11px] mt-1.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Square */}
        <div className="rounded-3xl p-6 sm:p-8 mb-10 bg-[#13131a]/90 border border-violet-500/15 backdrop-blur-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-white text-2xl shadow-lg shadow-pink-500/20">
                <FiCreditCard />
              </div>
              <div>
                <h2 className="text-white font-semibold text-lg tracking-tight">Payouts & Square</h2>
                <p className="text-white/45 text-sm mt-1 max-w-md">
                  Connect Square so PinkSurfing can route gig payouts to you.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div
                className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wide border text-center ${
                  workerProfile?.square_connected
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : "bg-pink-500/10 border-pink-500/25 text-pink-300"
                }`}
              >
                {workerProfile?.square_connected ? "Square connected" : "Square not linked"}
              </div>
              <button
                type="button"
                onClick={handleSquareOnboarding}
                disabled={onboardingLoading}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-white text-[#0a0a0f] hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
            <div className="mt-5 p-4 rounded-2xl bg-pink-500/[0.06] border border-pink-500/15 flex items-start gap-3">
              <IoAlertCircleOutline className="text-pink-400 text-lg flex-shrink-0 mt-0.5" />
              <p className="text-white/55 text-sm leading-relaxed">
                Link Square to publish gigs and receive payouts after orders complete.
              </p>
            </div>
          )}
        </div>

        {/* My gigs */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-white text-xl font-semibold tracking-tight">Your gigs</h2>
          </div>

          {loadingGigs ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#13131a]/60 rounded-2xl h-24 animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          ) : myGigs.length === 0 ? (
            <div className="text-center py-14 rounded-3xl border border-dashed border-pink-500/20 bg-pink-500/[0.03]">
              <FaBriefcase className="text-3xl text-pink-500/25 mx-auto mb-3" />
              <p className="text-white/55 font-medium">No gigs yet</p>
              <Link
                to="/gigs/create"
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-violet-600 to-pink-500 text-white"
              >
                Create your first gig
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {myGigs.map((gig) => {
                const mainImg = gig.media_files?.find((m) => m.is_main) || gig.media_files?.[0];
                const lowestPkg = gig.packages?.length
                  ? gig.packages.reduce(
                      (min, p) => (parseFloat(p.price) < parseFloat(min.price) ? p : min),
                      gig.packages[0]
                    )
                  : null;
                const statusColor =
                  gig.status === "active"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/25"
                    : gig.status === "paused"
                      ? "text-amber-400 bg-amber-500/10 border-amber-500/25"
                      : "text-white/50 bg-white/[0.05] border-white/10";

                return (
                  <div
                    key={gig.id}
                    className="rounded-2xl p-4 sm:p-5 bg-[#13131a]/80 border border-white/[0.06] hover:border-pink-500/20 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#1a1a24] flex-shrink-0 ring-1 ring-pink-500/10">
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
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/40 text-xs mb-3">
                          {gig.category_details && <span>{gig.category_details.name}</span>}
                          {lowestPkg && <span>From ${parseFloat(lowestPkg.price).toFixed(2)}</span>}
                          <span className="flex items-center gap-1">
                            <IoStarSharp className="text-pink-400 text-xs" />
                            {gig.rating}
                          </span>
                          <span>{gig.total_orders_completed} orders</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={gigUrl(gig)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/65 text-xs hover:border-pink-500/30 transition-all"
                          >
                            <IoEyeOutline /> View
                          </Link>
                          <button
                            type="button"
                            onClick={() => navigate(`/gigs/create?edit=${gig.id}`)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-pink-500/10 border border-pink-500/25 text-pink-300 text-xs hover:bg-pink-500/15 transition-all"
                          >
                            <IoPencilOutline /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteGig(gig.id)}
                            disabled={deletingId === gig.id}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-red-400 text-xs hover:bg-red-500/15 disabled:opacity-50"
                          >
                            <IoTrashOutline />
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

        {/* Fulfillment */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <IoTimeOutline className="text-pink-400 text-xl" />
            <h2 className="text-white text-xl font-semibold tracking-tight">Orders to fulfill</h2>
          </div>
          {loadingOrders ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-[#13131a]/60 rounded-2xl h-20 animate-pulse border border-white/[0.04]" />
              ))}
            </div>
          ) : fulfillOrders.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-[#13131a]/50 border border-white/[0.06]">
              <IoCheckmarkCircle className="text-4xl text-pink-500/30 mx-auto mb-3" />
              <p className="text-white/45 text-sm">Nothing queued. New buyer orders will show up here.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fulfillOrders.map((order) => {
                const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress;
                return (
                  <Link
                    key={order.id}
                    to={`/gigs/orders/${order.id}`}
                    className="flex items-center gap-4 rounded-2xl p-4 sm:p-5 bg-[#13131a]/80 border border-white/[0.06] hover:border-pink-500/25 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-white/50">
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-white font-semibold text-sm line-clamp-1">
                        {order.gig?.title || `Order #${order.id}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs mt-2 text-white/35">
                        <span>#{order.id}</span>
                        <span className="text-white/15">·</span>
                        <span>Buyer: {order.buyer_username || "—"}</span>
                        {order.due_date && (
                          <>
                            <span className="text-white/15">·</span>
                            <span>Due {new Date(order.due_date).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-white font-semibold">
                        ${parseFloat(order.seller_net_earnings || 0).toFixed(2)}
                      </p>
                      <p className="text-white/35 text-[11px] mt-0.5">your net</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GigHubSellerDashboard;
