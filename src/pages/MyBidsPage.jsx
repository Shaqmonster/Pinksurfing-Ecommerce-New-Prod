import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  IoChevronDown,
  IoChevronUp,
  IoTrashOutline,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoStorefrontOutline,
  IoReceiptOutline,
  IoImageOutline,
} from "react-icons/io5";
import { FaGavel } from "react-icons/fa";
import { authContext } from "../context/authContext";
import { getMyRequests, acceptBid, deleteRequest, addToCart } from "../api/buyerRequests";
import BidsNavBar from "../components/BidsNavBar";

const STATUS_COLORS = {
  OPEN: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  EVALUATING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  AWARDED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
};

const BID_STATUS_COLORS = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  SHORTLISTED: "bg-blue-500/20 text-blue-400",
  ACCEPTED: "bg-emerald-500/20 text-emerald-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "EVALUATING", label: "Evaluating" },
  { key: "AWARDED", label: "Awarded" },
  { key: "CLOSED", label: "Closed" },
];

const RequestCard = ({ req, onAcceptBid, onDelete, accepting }) => {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[req.status] || STATUS_COLORS.OPEN;
  const images = [req.image1, req.image2, req.image3, req.image4].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
    >
      {/* Card Header */}
      <div className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusColor}`}
              >
                {req.status}
              </span>
              {req.category_name && (
                <span className="text-xs text-white/40 bg-white/10 px-2.5 py-0.5 rounded-full">
                  {req.category_name}
                </span>
              )}
            </div>
            <h3 className="text-white font-semibold text-base sm:text-lg truncate">
              {req.title}
            </h3>
            <p className="text-white/50 text-sm mt-1 line-clamp-2">{req.description}</p>
          </div>
          <button
            onClick={() => onDelete(req.id)}
            className="shrink-0 p-2 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
            title="Delete request"
          >
            <IoTrashOutline className="text-lg" />
          </button>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1.5 text-white/60">
            <span className="text-emerald-400 font-semibold">${req.budget}</span>
            <span className="text-white/30">budget</span>
          </div>
          {req.deadline && (
            <div className="flex items-center gap-1.5 text-white/60">
              <IoTimeOutline className="shrink-0" />
              <span>
                {new Date(req.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-white/60">
            <FaGavel className="text-pink-400 text-xs shrink-0" />
            <span>
              {req.bids?.length || 0}{" "}
              {req.bids?.length === 1 ? "bid" : "bids"}
            </span>
          </div>
        </div>

        {/* Images row */}
        {images.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`img-${i}`}
                className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
              />
            ))}
          </div>
        )}

        {/* Toggle bids */}
        {req.bids?.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-4 flex items-center gap-2 text-pink-400 hover:text-pink-300 text-sm font-medium transition-colors"
          >
            {expanded ? <IoChevronUp /> : <IoChevronDown />}
            {expanded ? "Hide" : "View"} {req.bids?.length}{" "}
            {req.bids?.length === 1 ? "bid" : "bids"}
          </button>
        )}
      </div>

      {/* Bids List */}
      <AnimatePresence>
        {expanded && req.bids?.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 sm:p-6 space-y-4">
              <p className="text-white/40 text-xs uppercase tracking-wider font-semibold">
                Vendor Bids
              </p>
              {req.bids.map((bid) => (
                <BidRow
                  key={bid.id}
                  bid={bid}
                  requestStatus={req.status}
                  requestId={req.id}
                  onAcceptBid={onAcceptBid}
                  accepting={accepting === bid.id}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const BidRow = ({ bid, requestStatus, requestId, onAcceptBid, accepting }) => {
  const bidImages = [bid.image1, bid.image2, bid.image3, bid.image4].filter(Boolean);
  const canAccept = ["OPEN", "EVALUATING"].includes(requestStatus) && bid.status === "PENDING";

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <IoStorefrontOutline className="text-purple-400 text-lg shrink-0" />
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{bid.vendor_store_name}</p>
            <p className="text-white/40 text-xs truncate">{bid.vendor_email}</p>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${
            BID_STATUS_COLORS[bid.status] || "bg-gray-500/20 text-gray-400"
          }`}
        >
          {bid.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="bg-white/5 rounded-lg p-2.5">
          <p className="text-white/40 text-xs">Bid Amount</p>
          <p className="text-emerald-400 font-bold text-sm sm:text-base">${bid.bid_amount}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5">
          <p className="text-white/40 text-xs">Delivery</p>
          <p className="text-white font-semibold text-sm">{bid.delivery_time_days} days</p>
        </div>
      </div>

      <div className="bg-white/5 rounded-lg p-3">
        <p className="text-white/40 text-xs mb-1">Proposal</p>
        <p className="text-white/80 text-sm leading-relaxed">{bid.proposal}</p>
      </div>

      {bidImages?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {bidImages.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`bid-img-${i}`}
              className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0"
            />
          ))}
        </div>
      )}

      {canAccept && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAcceptBid(requestId, bid.id)}
          disabled={accepting}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/30 transition-all"
        >
          {accepting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              <IoCheckmarkCircle className="text-lg" />
              Accept This Bid
            </>
          )}
        </motion.button>
      )}

      {bid.status === "ACCEPTED" && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
          <IoCheckmarkCircle className="text-lg shrink-0" />
          Bid accepted — check your cart to checkout
        </div>
      )}
    </div>
  );
};

const MyBidsPage = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchRequests = async () => {
    if (!cookies.access_token) return;
    try {
      setLoading(true);
      const res = await getMyRequests(cookies.access_token);
      const data = res.data?.results ?? res.data ?? [];
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[MyBidsPage] Failed to load requests:", err);
      toast.error("Failed to load your bid requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    fetchRequests();
  }, [cookies.access_token]);

  const handleAcceptBid = async (requestId, bidId) => {
    try {
      setAccepting(bidId);
      const res = await acceptBid(cookies.access_token, requestId, bidId);
      const productId = res.data.product_id;

      await addToCart(cookies.access_token, productId);

      toast.success("Bid accepted and added to your cart!");
      fetchRequests();
    } catch (err) {
      toast.error(
        err?.response?.data?.error || "Failed to accept bid. Please try again."
      );
    } finally {
      setAccepting(null);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm("Delete this bid request? This cannot be undone.")) return;
    try {
      await deleteRequest(cookies.access_token, requestId);
      toast.success("Request deleted.");
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      toast.error("Failed to delete request.");
    }
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = requests.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <BidsNavBar />

      {/* Background glow */}
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-700/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-pink-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-8">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <IoReceiptOutline className="text-pink-400 text-xl" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">My Bid Requests</h1>
                </div>
                <p className="text-white/50 text-sm">
                  Track your requests and review vendor bids.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/create-bid")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm shadow-lg hover:shadow-pink-500/30 transition-all flex items-center gap-2"
              >
                <FaGavel className="text-sm" />
                New Request
              </motion.button>
            </div>
          </motion.div>

          {/* Stats summary */}
          {!loading && requests.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Requests", value: requests.length, color: "text-white" },
                { label: "Open", value: counts["OPEN"] || 0, color: "text-emerald-400" },
                { label: "Bids Received", value: requests.reduce((sum, r) => sum + (r.bids?.length || 0), 0), color: "text-pink-400" },
                { label: "Awarded", value: counts["AWARDED"] || 0, color: "text-purple-400" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center">
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-white/40 mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
            {FILTER_TABS.map(({ key, label }) => {
              const count = key === "all" ? requests.length : counts[key] || 0;
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                    active
                      ? "bg-gradient-to-r from-purple-600/20 to-pink-500/20 text-pink-400 border border-pink-500/30"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-white/10"
                  }`}
                >
                  {label}
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        active ? "bg-pink-500/30 text-pink-300" : "bg-white/10 text-white/40"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <span className="w-8 h-8 border-2 border-white/20 border-t-pink-400 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl"
            >
              <FaGavel className="text-5xl text-white/10 mx-auto mb-4" />
              <p className="text-white/40 text-base">
                {filter === "all"
                  ? "No bid requests yet."
                  : `No ${filter.toLowerCase()} requests.`}
              </p>
              <button
                onClick={() => navigate("/create-bid")}
                className="mt-4 text-pink-400 hover:text-pink-300 text-sm underline underline-offset-4 transition-colors"
              >
                Create your first request
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filtered.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  onAcceptBid={handleAcceptBid}
                  onDelete={handleDelete}
                  accepting={accepting}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBidsPage;
