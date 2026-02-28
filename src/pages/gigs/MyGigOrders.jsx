import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import { getMyGigOrders, submitOrderRequirements } from "../../api/gigs";
import {
  IoTimeOutline,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoAddCircleOutline,
  IoDocumentTextOutline,
  IoRefreshOutline,
} from "react-icons/io5";
import { FaBriefcase, FaSpinner } from "react-icons/fa";

const STATUS_CONFIG = {
  pending_requirements: {
    label: "Awaiting Your Input",
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

const RequirementsModal = ({ order, onClose, onSubmit }) => {
  const [answers, setAnswers] = useState([]);

  const updateAnswer = (question, value) => {
    setAnswers((prev) => {
      const existing = prev.findIndex((a) => a.requirement_question === question);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], answer: value };
        return updated;
      }
      return [...prev, { requirement_question: question, answer: value }];
    });
  };

  const getAnswer = (question) =>
    answers.find((a) => a.requirement_question === question)?.answer || "";

  // If no requirements, just submit with empty
  const requirements =
    order.gig?.requirements || order.requirement_questions || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#13131a] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <h3 className="text-white font-bold text-lg mb-1">Submit Order Requirements</h3>
        <p className="text-white/40 text-sm mb-5">
          Answer the seller's questions to start your order.
        </p>

        {requirements.length > 0 ? (
          <div className="space-y-4">
            {requirements.map((req, i) => (
              <div key={i} className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium">
                  {req.question || req}
                  {req.is_mandatory && <span className="text-pink-400 ml-1">*</span>}
                </label>
                <textarea
                  value={getAnswer(req.question || req)}
                  onChange={(e) => updateAnswer(req.question || req, e.target.value)}
                  rows={3}
                  placeholder="Your answer…"
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-purple-400 transition-all resize-none"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <IoDocumentTextOutline className="text-4xl text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">
              No specific questions from the seller. Click submit to start the order.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:border-white/20 transition-all"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSubmit(order.id, answers)}
            className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            Submit & Start Order
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MyGigOrders = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [requirementsOrder, setRequirementsOrder] = useState(null);
  const [submittingReq, setSubmittingReq] = useState(false);

  useEffect(() => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getMyGigOrders(cookies.access_token);
      setOrders(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      toast.error("Failed to load gig orders.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequirements = async (orderId, answers) => {
    try {
      setSubmittingReq(true);
      await submitOrderRequirements(cookies.access_token, orderId, answers);
      toast.success("Requirements submitted! Your order is now in progress.");
      setRequirementsOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit requirements.");
    } finally {
      setSubmittingReq(false);
    }
  };

  const filteredOrders =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const FILTERS = [
    { key: "all", label: "All Orders" },
    { key: "pending_requirements", label: "Pending" },
    { key: "in_progress", label: "In Progress" },
    { key: "delivered", label: "Delivered" },
    { key: "completed", label: "Completed" },
  ];

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden py-8 px-4">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-2">
              <FaBriefcase className="text-pink-400 text-xs" />
              <span className="text-white/60 text-xs font-medium">Gig Orders</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">My Gig Orders</h1>
            <p className="text-white/40 text-sm mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""} total</p>
          </div>
          <Link
            to="/gigs"
            className="px-4 py-2 bg-[#13131a] border border-white/10 rounded-xl text-white/60 text-sm hover:border-white/20 transition-all"
          >
            Browse Gigs
          </Link>
        </motion.div>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
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
                <span className="ml-1.5 text-xs opacity-60">
                  ({orders.filter((o) => o.status === f.key).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Orders list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#13131a] rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-white/5 rounded-full w-1/2" />
                    <div className="h-3 bg-white/5 rounded-full w-1/3" />
                    <div className="h-6 bg-white/5 rounded-lg w-24 mt-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FaBriefcase className="text-5xl text-white/10 mx-auto mb-4" />
            <p className="text-white/40 text-lg">No orders found</p>
            {filter !== "all" ? (
              <button
                onClick={() => setFilter("all")}
                className="mt-3 text-purple-400 text-sm hover:text-purple-300"
              >
                Show all orders
              </button>
            ) : (
              <Link to="/gigs" className="mt-3 inline-block text-purple-400 text-sm hover:text-purple-300">
                Browse gigs to get started
              </Link>
            )}
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.in_progress;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#13131a] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Gig image placeholder */}
                    <div className="w-full sm:w-20 h-20 rounded-xl bg-[#1a1a24] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <FaBriefcase className="text-white/15 text-2xl" />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Order header */}
                      <div className="flex flex-wrap items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm leading-snug line-clamp-1">
                            {order.gig?.title || `Gig Order #${order.id}`}
                          </p>
                          <p className="text-white/40 text-xs mt-0.5">Order #{order.id}</p>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusCfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Order meta */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/40 text-xs mb-3">
                        {order.package && (
                          <span className="capitalize">{order.package.tier} package</span>
                        )}
                        <span className="flex items-center gap-1">
                          <IoTimeOutline className="text-sm" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="font-semibold text-white/60">
                          ${parseFloat(order.total_price || 0).toFixed(2)}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {order.status === "pending_requirements" && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setRequirementsOrder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-semibold hover:bg-yellow-500/20 transition-all"
                          >
                            <IoAddCircleOutline className="text-sm" />
                            Submit Requirements
                          </motion.button>
                        )}
                        {order.status === "delivered" && (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold hover:bg-green-500/20 transition-all"
                          >
                            <IoCheckmarkCircle className="text-sm" />
                            Accept Delivery
                          </motion.button>
                        )}
                        <Link
                          to={`/gigs/orders/${order.id}`}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-all"
                        >
                          View Details
                        </Link>
                        {order.gig?.id && (
                          <Link
                            to={`/gigs/${order.gig.id}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs font-semibold hover:bg-white/10 transition-all"
                          >
                            View Gig
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Price breakdown (expanded for pending orders) */}
                  {order.status === "pending_requirements" && (
                    <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: "Gig Price", value: `$${parseFloat(order.gig_price || 0).toFixed(2)}` },
                        { label: "Buyer Fee (5%)", value: `$${parseFloat(order.buyer_fee || 0).toFixed(2)}` },
                        { label: "Total Paid", value: `$${parseFloat(order.total_price || 0).toFixed(2)}` },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <p className="text-white/30 text-[10px] uppercase tracking-wide">{item.label}</p>
                          <p className="text-white font-semibold text-sm">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Requirements Modal */}
      <AnimatePresence>
        {requirementsOrder && (
          <RequirementsModal
            order={requirementsOrder}
            onClose={() => setRequirementsOrder(null)}
            onSubmit={handleSubmitRequirements}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyGigOrders;
