import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCookies } from "react-cookie";
import {
  IoArrowForward,
  IoSparkles,
  IoCamera,
  IoTimeOutline,
  IoCalendarOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";
import {
  FaShieldAlt,
  FaBriefcase,
  FaDollarSign,
  FaBolt,
  FaGavel,
  FaTag,
  FaArrowRight,
} from "react-icons/fa";
import { getOpenRequests } from "../../api/buyerRequests";
import BidsNavBar from "../../components/BidsNavBar";

// ─── Constants ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: FaShieldAlt, label: "Escrow Protected", desc: "Funds held securely until work is complete" },
  { Icon: FaBriefcase, label: "Multi-Industry", desc: "Construction, tech, creative, and more" },
  { Icon: FaDollarSign, label: "Milestone Payments", desc: "Pay in stages as work progresses" },
  { Icon: FaBolt, label: "Under 60 Seconds", desc: "Post a detailed job request in seconds" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Post Your Job Request",
    desc: "Describe your project in detail. Add photos, set your budget, and let AI refine your scope.",
  },
  {
    step: "02",
    title: "Receive Competitive Proposals",
    desc: "Qualified contractors and freelancers send structured offers directly to your request.",
  },
  {
    step: "03",
    title: "Award the Best Offer",
    desc: "Review proposals, compare prices and timelines, then accept the best fit for your project.",
  },
];

const STATS = [
  { value: "10K+", label: "Job Requests Posted" },
  { value: "50K+", label: "Offers Submitted" },
  { value: "98%", label: "Satisfaction Rate" },
  { value: "$2M+", label: "In Transactions" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

// ─── Preview Request Card ───────────────────────────────────────────────────────

const PreviewCard = ({ req }) => {
  const images = [req.image1, req.image2, req.image3, req.image4].filter(Boolean);
  const bidCount = req.bids?.length ?? 0;

  return (
    <Link to={`/bids/requests/${req.id}`}>
      <motion.div
        whileHover={{ y: -2, borderColor: "rgba(236,72,153,0.3)" }}
        className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-200 cursor-pointer"
      >
        {/* Photo */}
        <div className="w-full h-36 bg-white/5 border-b border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
          {images[0] ? (
            <img src={images[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <IoCamera className="text-4xl text-white/15" />
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-2.5 flex-1">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-pink-400 transition-colors leading-snug">
                {req.title}
              </h3>
            </div>
            {req.status === "OPEN" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0">
                Open
              </span>
            )}
          </div>

          {req.category_name && (
            <span className="inline-flex items-center gap-1 text-xs text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full w-fit">
              <FaTag className="text-[9px]" />
              {req.category_name}
            </span>
          )}

          <p className="text-xs text-white/50 line-clamp-2 flex-1 leading-relaxed">
            {req.description || "No description provided."}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span className="text-sm font-bold text-emerald-400">${req.budget}</span>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <span>{bidCount} bid{bidCount !== 1 ? "s" : ""}</span>
              <span>·</span>
              <span>{timeAgo(req.created_at)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BidsLandingPage() {
  const [cookies] = useCookies(["access_token"]);
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    if (!cookies.access_token) return;
    setLoadingRequests(true);
    getOpenRequests(cookies.access_token)
      .then((res) => {
        const data = res.data?.results ?? res.data ?? [];
        setRequests(Array.isArray(data) ? data.slice(0, 6) : []);
      })
      .catch(() => {})
      .finally(() => setLoadingRequests(false));
  }, [cookies.access_token]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <BidsNavBar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-br from-purple-600/12 to-pink-500/8 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-700/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-pink-600/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-400 text-xs font-semibold mb-6 tracking-wide"
          >
            <IoSparkles />
            Proposals Sourcing — PS
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-5"
          >
            Post a Job. Receive{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Competitive Proposals.
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-white/60 max-w-xl mx-auto mb-8 leading-relaxed"
          >
            Create structured, escrow-protected bids in under 60 seconds.
            Built for contractors, freelancers, and businesses.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-center mb-14"
          >
            <Link to="/create-bid">
              <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-base hover:opacity-90 transition-all shadow-lg shadow-pink-500/20 w-full sm:w-auto">
                Post a Job Request
                <IoArrowForward />
              </button>
            </Link>
            <Link to="/bids/marketplace">
              <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold text-base hover:bg-white/5 transition-all w-full sm:w-auto">
                Browse Marketplace
                <IoArrowForward />
              </button>
            </Link>
          </motion.div>

          {/* Feature grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto"
          >
            {FEATURES.map(({ Icon, label }) => (
              <div
                key={label}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 text-center hover:border-pink-500/20 transition-colors"
              >
                <Icon className="text-lg text-pink-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-white/60">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      {/* <section className="px-4 pb-14">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {value}
              </p>
              <p className="text-xs text-white/50 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section> */}

      {/* ── Latest Requests Preview ─────────────────────────────────────────── */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Latest Open{" "}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Requests
                </span>
              </h2>
              <p className="text-sm text-white/50 mt-1">Browse open job requests from verified buyers</p>
            </div>
            <Link
              to="/bids/marketplace"
              className="flex items-center gap-1.5 text-sm text-pink-400 hover:text-pink-300 transition-colors font-medium"
            >
              View all
              <IoArrowForward />
            </Link>
          </div>

          {loadingRequests ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-2xl h-64 animate-pulse"
                />
              ))}
            </div>
          ) : !cookies.access_token ? (
            <div className="text-center py-20 bg-white/5 border border-white/10 rounded-2xl">
              <FaGavel className="text-5xl text-white/15 mx-auto mb-4" />
              <p className="text-white/50 mb-2 text-base font-medium">Sign in to view open job requests</p>
              <p className="text-white/30 text-sm mb-6">Join thousands of buyers and contractors already on the platform</p>
              <div className="flex gap-3 justify-center">
                <Link to="/signin">
                  <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm hover:opacity-90 transition-all">
                    Sign In
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="px-6 py-2.5 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-all">
                    Create Account
                  </button>
                </Link>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
              <FaGavel className="text-4xl text-white/15 mx-auto mb-4" />
              <p className="text-white/50 mb-4">No open requests yet.</p>
              <Link to="/create-bid">
                <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm hover:opacity-90 transition-all">
                  Post the First Request
                </button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {requests.map((req) => (
                <PreviewCard key={req.id} req={req} />
              ))}
            </div>
          )}

          {requests.length > 0 && (
            <div className="text-center mt-8">
              <Link to="/bids/marketplace">
                <button className="flex items-center gap-2 px-7 py-3 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-all mx-auto">
                  View All Requests
                  <IoArrowForward />
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────────── */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              How It{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Works
              </span>
            </h2>
            <p className="text-sm text-white/50">Simple. Fast. Secure.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center relative"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center text-white text-sm font-bold mx-auto mb-4 shadow-lg shadow-pink-500/20">
                  {step}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 text-white/20">
                    <FaArrowRight className="text-lg" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust / Benefits ────────────────────────────────────────────────── */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8">
            <h3 className="text-lg font-bold text-white mb-6 text-center">Why PinkSurfing Proposals?</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: IoCheckmarkCircle, text: "Escrow-protected payments — funds released only when you approve" },
                { icon: IoCheckmarkCircle, text: "AI-powered scope generation to describe your project perfectly" },
                { icon: IoCheckmarkCircle, text: "Multi-industry support: construction, tech, creative, and more" },
                { icon: IoCheckmarkCircle, text: "Milestone-based billing to keep projects on track" },
                { icon: IoCheckmarkCircle, text: "Verified buyer and contractor profiles" },
                { icon: IoCheckmarkCircle, text: "Structured proposals make it easy to compare offers" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <Icon className="text-pink-400 text-base flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-white/60">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section className="px-4 pb-20">
        <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-purple-900/40 via-pink-900/20 to-purple-900/40 border border-white/10 rounded-3xl p-10 md:p-14 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-pink-600/5 pointer-events-none" />
          <h2 className="relative text-2xl md:text-3xl font-bold text-white mb-3">
            Ready to Get Started?
          </h2>
          <p className="relative text-white/60 mb-8 text-sm leading-relaxed">
            Join thousands of buyers and contractors already using the PinkSurfing Proposals Marketplace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center relative">
            <Link to="/create-bid">
              <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold hover:opacity-90 transition-all shadow-lg shadow-pink-500/20 w-full sm:w-auto">
                Post a Job Request
                <IoArrowForward />
              </button>
            </Link>
            <Link to="/bids/marketplace">
              <button className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/5 transition-all w-full sm:w-auto">
                Browse Marketplace
                <IoArrowForward />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
