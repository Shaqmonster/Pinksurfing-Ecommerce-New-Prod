import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
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

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "pending_requirements", label: "Pending" },
    { key: "in_progress", label: "In Progress" },
    { key: "delivered", label: "Delivered" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: orders.length, icon: <FaBriefcase className="text-purple-400" /> },
          { label: "In Progress", value: orders.filter((o) => o.status === "in_progress").length, icon: <IoTimeOutline className="text-blue-400" /> },
          { label: "Delivered", value: orders.filter((o) => o.status === "delivered").length, icon: <IoAlertCircleOutline className="text-yellow-400" /> },
          { label: "Completed", value: orders.filter((o) => o.status === "completed").length, icon: <IoCheckmarkCircle className="text-green-400" /> },
        ].map((card, i) => (
          <div key={i} className="bg-[#13131a] border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-lg">{card.icon}</div>
              <p className="text-white/40 text-xs">{card.label}</p>
            </div>
            <p className="text-white font-bold text-2xl">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              filter === f.key
                ? "bg-gradient-to-r from-purple-600 to-pink-500 border-transparent text-white"
                : "bg-transparent border-white/10 text-white/50 hover:border-white/20"
            }`}
          >
            {f.label}
            {f.key !== "all" && (
              <span className="ml-1.5 text-xs opacity-60">({orders.filter((o) => o.status === f.key).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#13131a] rounded-2xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <FaBriefcase className="text-5xl text-white/10 mx-auto mb-4" />
          <p className="text-white/40">No orders found</p>
          <Link to="/gigs" className="mt-3 inline-block text-purple-400 hover:text-purple-300 text-sm">
            Browse gigs to get started →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress;
            return (
              <Link
                key={order.id}
                to={`/gigs/orders/${order.id}`}
                className="block bg-[#13131a] border border-white/5 rounded-2xl p-4 hover:border-white/10 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-white font-semibold text-sm line-clamp-1">
                        {order.gig?.title || `Order #${order.id}`}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/40 text-xs">
                      <span>Order #{order.id}</span>
                      {order.package && <span className="capitalize">{order.package.tier} pkg</span>}
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-white font-bold">${parseFloat(order.total_price || 0).toFixed(2)}</p>
                    <p className="text-white/30 text-xs">total paid</p>
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
                          to={`/gigs/${gig.id}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs hover:bg-white/10 transition-all"
                        >
                          <IoEyeOutline className="text-sm" /> View
                        </Link>
                        <button
                          onClick={() => navigate(`/gigs/create?edit=${gig.id}`)}
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
                        {order.expected_delivery_date && (
                          <span className="text-white/30">
                            Due: {new Date(order.expected_delivery_date).toLocaleDateString()}
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
      setAllOrders(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch {
      toast.error("Failed to load orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchWorkerAndGigs = async () => {
    setLoadingWorker(true);
    setLoadingGigs(true);
    try {
      const wRes = await getMyGigWorkerProfile(cookies.access_token);
      setWorkerProfile(wRes.data);
    } catch {
      setWorkerProfile(null);
    } finally {
      setLoadingWorker(false);
    }

    try {
      const gRes = await getMyGigs(cookies.access_token);
      setMyGigs(Array.isArray(gRes.data) ? gRes.data : gRes.data.results || []);
    } catch {
      setMyGigs([]);
    } finally {
      setLoadingGigs(false);
    }
  };

  // Split orders into buyer orders vs seller orders using API-provided flags
  const buyerOrders = allOrders.filter((o) => o.is_buyer === true);
  const sellerOrders = allOrders.filter((o) => o.is_seller === true);

  const TABS = [
    { key: "buying", label: "Buying", icon: <FaBriefcase /> },
    { key: "selling", label: "Selling", icon: <IoStorefrontOutline /> },
  ];

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/8 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-600/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8"
        >
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-2">
              <FaBriefcase className="text-pink-400 text-xs" />
              <span className="text-white/60 text-xs font-medium">GigHub Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {user?.first_name ? `Welcome back, ${user.first_name}` : "Dashboard"}
            </h1>
            <p className="text-white/40 text-sm mt-1">Manage your gigs and orders</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/gigs"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#13131a] border border-white/10 rounded-xl text-white/60 text-sm hover:border-white/20 transition-all"
            >
              <IoEyeOutline /> Browse
            </Link>
            <Link
              to="/gighub/messages"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#13131a] border border-white/10 rounded-xl text-white/60 text-sm hover:border-white/20 transition-all"
            >
              <IoChatbubbleOutline /> Messages
            </Link>
          </div>
        </motion.div>

        {/* Tab selector */}
        <div className="flex gap-1 bg-[#13131a] border border-white/5 rounded-2xl p-1 w-fit mb-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md"
                  : "text-white/50 hover:text-white/70"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Seller notice if not a worker yet (on selling tab) */}
        <AnimatePresence>
          {activeTab === "selling" && !loadingWorker && !workerProfile && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/20 border border-purple-500/20 rounded-2xl p-6 text-center">
                <IoPersonOutline className="text-5xl text-purple-400/50 mx-auto mb-3" />
                <h3 className="text-white font-bold text-lg mb-2">Start Selling Your Skills</h3>
                <p className="text-white/40 text-sm mb-5 max-w-sm mx-auto">
                  Create a gig worker profile to start offering services and earning money.
                </p>
                <Link
                  to="/gigs/become-a-seller"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  <FaBriefcase /> Set Up Seller Profile
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
              {(workerProfile || loadingWorker) && (
                <SellerTab
                  workerProfile={workerProfile}
                  sellerOrders={sellerOrders}
                  myGigs={myGigs}
                  loadingOrders={loadingOrders}
                  loadingGigs={loadingGigs}
                  refetchGigs={fetchWorkerAndGigs}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GigHubDashboard;
