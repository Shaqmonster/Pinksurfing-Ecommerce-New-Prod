import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  IoPaperPlaneOutline,
  IoTimeOutline,
  IoTrashOutline,
  IoStorefrontOutline,
  IoChevronDown,
  IoChevronUp,
  IoImageOutline,
} from "react-icons/io5";
import { FaGavel, FaDollarSign } from "react-icons/fa";
import { getMySubmittedBids, withdrawBidOffer } from "../../api/buyerRequests";
import BidsNavBar from "../../components/BidsNavBar";

const BID_STATUS_STYLES = {
  PENDING: {
    bg: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    label: "Pending",
  },
  SHORTLISTED: {
    bg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    label: "Shortlisted",
  },
  ACCEPTED: {
    bg: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    label: "Accepted",
  },
  REJECTED: {
    bg: "bg-red-500/20 text-red-400 border-red-500/30",
    label: "Rejected",
  },
};

const FILTER_TABS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "SHORTLISTED", label: "Shortlisted" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "REJECTED", label: "Rejected" },
];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const OfferCard = ({ bid, onWithdraw, withdrawing }) => {
  const [expanded, setExpanded] = useState(false);
  const status = BID_STATUS_STYLES[bid.status] || BID_STATUS_STYLES.PENDING;
  const images = [bid.image1, bid.image2, bid.image3, bid.image4].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
    >
      <div className="p-5 sm:p-6">
        {/* Top row: status + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${status.bg}`}
              >
                {status.label}
              </span>
              {bid.created_at && (
                <span className="text-xs text-white/30">{timeAgo(bid.created_at)}</span>
              )}
            </div>
            <h3 className="text-white font-semibold text-base sm:text-lg truncate">
              {bid.request_title || `Request #${bid.request_id || bid.request}`}
            </h3>
          </div>

          {bid.status === "PENDING" && (
            <button
              onClick={() => onWithdraw(bid.id)}
              disabled={withdrawing}
              className="shrink-0 p-2 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors disabled:opacity-40"
              title="Withdraw offer"
            >
              <IoTrashOutline className="text-lg" />
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-1.5">
            <FaDollarSign className="text-emerald-400 text-xs" />
            <span className="text-emerald-400 font-semibold">${bid.bid_amount}</span>
          </div>
          <div className="flex items-center gap-1.5 text-white/60">
            <IoTimeOutline />
            <span>{bid.delivery_time_days} days delivery</span>
          </div>
          {images.length > 0 && (
            <div className="flex items-center gap-1.5 text-white/60">
              <IoImageOutline />
              <span>{images.length} attachment{images.length !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* Expand proposal */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 flex items-center gap-2 text-pink-400 hover:text-pink-300 text-sm font-medium transition-colors"
        >
          {expanded ? <IoChevronUp /> : <IoChevronDown />}
          {expanded ? "Hide" : "View"} Proposal
        </button>
      </div>

      {/* Expanded proposal */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-5 sm:p-6 space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">
                  Your Proposal
                </p>
                <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
                  {bid.proposal || "No proposal text."}
                </p>
              </div>

              {images.length > 0 && (
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-wider font-semibold mb-2">
                    Attachments
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {images.map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`offer-img-${i}`}
                        className="w-16 h-16 rounded-lg object-cover border border-white/10"
                      />
                    ))}
                  </div>
                </div>
              )}

              {bid.request_id && (
                <Link
                  to={`/bids/requests/${bid.request_id || bid.request}`}
                  className="inline-flex items-center gap-1.5 text-sm text-pink-400 hover:text-pink-300 font-medium transition-colors"
                >
                  <IoStorefrontOutline />
                  View Original Request
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function MyOffersPage() {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);
  const [filter, setFilter] = useState("all");

  const fetchBids = async () => {
    if (!cookies.access_token) return;
    try {
      setLoading(true);
      const res = await getMySubmittedBids(cookies.access_token);
      const data = res.data?.results ?? res.data ?? [];
      setBids(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[MyOffersPage] Failed to load submitted bids:", err);
      toast.error("Failed to load your offers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    fetchBids();
  }, [cookies.access_token]);

  const handleWithdraw = async (bidId) => {
    if (!window.confirm("Withdraw this offer? This cannot be undone.")) return;
    try {
      setWithdrawing(bidId);
      await withdrawBidOffer(cookies.access_token, bidId);
      toast.success("Offer withdrawn.");
      setBids((prev) => prev.filter((b) => b.id !== bidId));
    } catch {
      toast.error("Failed to withdraw offer.");
    } finally {
      setWithdrawing(null);
    }
  };

  const filtered = filter === "all" ? bids : bids.filter((b) => b.status === filter);

  const counts = bids.reduce(
    (acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
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
                  <IoPaperPlaneOutline className="text-pink-400 text-xl" />
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">My Offers</h1>
                </div>
                <p className="text-white/50 text-sm">
                  Track proposals you've submitted on open requests.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/bids/marketplace")}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm shadow-lg hover:shadow-pink-500/30 transition-all flex items-center gap-2"
              >
                <FaGavel className="text-sm" />
                Browse Requests
              </motion.button>
            </div>
          </motion.div>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mb-6 pb-1">
            {FILTER_TABS.map(({ key, label }) => {
              const count = key === "all" ? bids.length : counts[key] || 0;
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
              <IoPaperPlaneOutline className="text-5xl text-white/10 mx-auto mb-4" />
              <p className="text-white/40 text-base">
                {filter === "all"
                  ? "You haven't submitted any offers yet."
                  : `No ${filter.toLowerCase()} offers.`}
              </p>
              <button
                onClick={() => navigate("/bids/marketplace")}
                className="mt-4 text-pink-400 hover:text-pink-300 text-sm underline underline-offset-4 transition-colors"
              >
                Browse open requests
              </button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filtered.map((bid) => (
                <OfferCard
                  key={bid.id}
                  bid={bid}
                  onWithdraw={handleWithdraw}
                  withdrawing={withdrawing === bid.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
