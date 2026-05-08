import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import { getMyGigOrders } from "../../api/gigs";
import { IoEyeOutline, IoChatbubbleOutline, IoStorefrontOutline } from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";

const STATUS_CONFIG = {
  pending_requirements: {
    label: "Awaiting requirements",
    dot: "bg-amber-400",
  },
  in_progress: {
    label: "In progress",
    dot: "bg-pink-400",
  },
  delivered: {
    label: "Delivered",
    dot: "bg-violet-400",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "Cancelled",
    dot: "bg-red-400",
  },
};

const BuyerDashboardContent = ({ orders, loading }) => {
  const [filter, setFilter] = useState("all");

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

  const ordersTotalValue = orders.reduce((s, o) => s + parseFloat(o.total_price || 0), 0);
  const activeCount = orders.filter((o) =>
    ["in_progress", "pending_requirements"].includes(o.status)
  ).length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Order total",
            value: `$${ordersTotalValue.toFixed(2)}`,
            sub: `${orders.length} ${orders.length === 1 ? "order" : "orders"} — combined line items`,
          },
          {
            label: "Active",
            value: activeCount,
            sub: activeCount === 0 ? "No active orders" : "Being worked on",
          },
          {
            label: "Completed",
            value: completedCount,
            sub: completedCount === 0 ? "None finished yet" : "Closed out",
          },
        ].map((m, i) => (
          <div
            key={i}
            className="rounded-3xl p-6 bg-[#13131a]/70 border border-pink-500/[0.09] backdrop-blur-md"
          >
            <p className="text-white/50 text-[13px] font-medium">{m.label}</p>
            <p className="text-white text-[32px] leading-none font-semibold tracking-tight mt-4">{m.value}</p>
            <p className="text-white/35 text-[12px] mt-3 leading-snug">{m.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
        <div>
          <h2 className="text-white text-[26px] font-semibold tracking-tight">Your orders</h2>
          <p className="text-white/45 text-[15px] mt-2 max-w-lg leading-relaxed">
            Status reflects where the gig is in delivery — not whether checkout has cleared. Open an order for full details.
          </p>
        </div>

        {orders.length > 0 && (
          <div className="inline-flex flex-wrap gap-1 p-1 rounded-2xl bg-[#13131a]/90 border border-white/[0.08]">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                  filter === f.key
                    ? "text-white bg-gradient-to-r from-violet-600 to-pink-500 shadow-md shadow-pink-500/15"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl h-[100px] bg-[#13131a]/50 animate-pulse border border-white/[0.04]" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-24 rounded-[28px] border border-dashed border-pink-500/15 bg-gradient-to-b from-pink-500/[0.04] to-transparent">
          <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <FaBriefcase className="text-pink-400/70 text-xl" />
          </div>
          <p className="text-white text-[17px] font-semibold tracking-tight">
            {orders.length === 0 ? "No orders yet" : "No matches"}
          </p>
          <p className="text-white/40 text-sm mt-2 mb-8 max-w-sm mx-auto leading-relaxed">
            {orders.length === 0
              ? "Browse GigHub and book a service you need."
              : "Pick another filter to see more orders."}
          </p>
          {orders.length === 0 && (
            <Link
              to="/gigs"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-500 hover:opacity-95 transition-opacity shadow-lg shadow-pink-500/20"
            >
              Browse gigs
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3 list-none p-0 m-0">
          {filteredOrders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress;
            return (
              <li key={order.id}>
                <Link
                  to={`/gigs/orders/${order.id}`}
                  className="block rounded-3xl p-5 sm:p-6 bg-[#13131a]/75 border border-white/[0.06] hover:border-pink-500/25 hover:bg-[#16161f]/90 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusCfg.dot}`} aria-hidden />
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-white font-semibold text-[17px] tracking-tight line-clamp-2">
                        {order.gig?.title || `Order #${order.id}`}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/38 text-[13px] mt-3">
                        <span className="tabular-nums">#{order.id}</span>
                        {order.package && (
                          <>
                            <span className="text-white/15">·</span>
                            <span className="capitalize">{order.package.tier} package</span>
                          </>
                        )}
                        <span className="text-white/15">·</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0 pt-2 sm:pt-0 border-t border-white/[0.06] sm:border-0 sm:pl-6">
                      <p className="text-white/40 text-[11px] font-medium uppercase tracking-wider mb-1">
                        Order total
                      </p>
                      <p className="text-white text-[22px] font-semibold tracking-tight tabular-nums">
                        ${parseFloat(order.total_price || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const GigHubDashboard = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [allOrders, setAllOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    fetchOrders();
  }, [cookies.access_token]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await getMyGigOrders(cookies.access_token);
      const data = res.data;
      setAllOrders(Array.isArray(data) ? data : data.results || []);
    } catch {
      toast.error("Failed to load orders.");
      setAllOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const buyerOrders = allOrders.filter((o) => o.is_buyer === true);

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden">
      <div className="absolute -top-40 right-0 w-[680px] h-[680px] bg-pink-500/[0.07] rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 -left-32 w-[420px] h-[420px] bg-violet-600/[0.06] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-8 pt-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14"
        >
          <div className="flex-1 max-w-2xl">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-pink-400/85 mb-4">
              GigHub · Buyer
            </p>
            <h1 className="text-white text-[36px] sm:text-[42px] leading-[1.06] font-semibold tracking-[-0.025em]">
              {user?.first_name ? `Welcome back, ${user.first_name}.` : "Welcome back."}
            </h1>
            <p className="text-white/45 text-[15px] mt-4 leading-relaxed">
              Orders you&apos;ve placed on GigHub. Selling has its own space — switch anytime without mixing the two.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 shrink-0">
            <Link
              to="/gigs"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold bg-[#13131a]/90 border border-white/[0.08] text-white/80 hover:border-pink-500/30 hover:text-white transition-colors"
            >
              <IoEyeOutline className="text-base text-pink-400/90" /> Browse
            </Link>
            <Link
              to="/gighub/messages"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold bg-[#13131a]/90 border border-white/[0.08] text-white/80 hover:border-pink-500/30 hover:text-white transition-colors"
            >
              <IoChatbubbleOutline className="text-base text-pink-400/90" /> Messages
            </Link>
            <Link
              to="/gighub/seller"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold text-white bg-gradient-to-r from-violet-600 to-pink-500 shadow-lg shadow-pink-500/20 hover:opacity-95 transition-opacity"
            >
              <IoStorefrontOutline className="text-base" /> Seller studio
            </Link>
          </div>
        </motion.div>

        <BuyerDashboardContent orders={buyerOrders} loading={loadingOrders} />
      </div>
    </div>
  );
};

export default GigHubDashboard;
