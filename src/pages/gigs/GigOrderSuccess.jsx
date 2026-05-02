import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { IoCheckmarkCircle, IoArrowForwardOutline } from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";

const GigOrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [count, setCount] = useState(5);

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden flex items-center justify-center px-4">
      {/* Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-green-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.7 }}
        className="relative z-10 text-center max-w-md w-full"
      >
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 mb-6 mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <IoCheckmarkCircle className="text-green-400 text-4xl" />
          </motion.div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Payment Successful!</h1>
        <p className="text-white/50 text-base mb-2">
          Your gig order has been placed. The seller will begin working once you submit your requirements.
        </p>
        {sessionId && (
          <p className="text-white/25 text-xs mb-8 font-mono">Session: {sessionId.slice(0, 20)}…</p>
        )}

        {/* Steps */}
        <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5 mb-6 text-left space-y-0">
          {[
            { step: "1", label: "Payment confirmed", done: true },
            { step: "2", label: "Submit your requirements to start the order", done: false },
            { step: "3", label: "Seller delivers your work", done: false },
            { step: "4", label: "Accept delivery & leave a review", done: false },
          ].map((item, i) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-3 py-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  item.done
                    ? "bg-green-500/20 border border-green-500/40 text-green-400"
                    : "bg-white/5 border border-white/10 text-white/30"
                }`}>
                  {item.done ? <IoCheckmarkCircle className="text-sm" /> : item.step}
                </div>
                <p className={`text-sm ${item.done ? "text-white/70" : "text-white/40"}`}>{item.label}</p>
              </div>
              {i < 3 && <div className="border-t border-white/5" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/gigs/orders"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/30 transition-all"
          >
            View My Orders
            <IoArrowForwardOutline className="text-base" />
          </Link>
          <Link
            to="/gigs"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#13131a] border border-white/10 text-white/60 font-semibold text-sm hover:border-white/20 transition-all"
          >
            <FaBriefcase className="text-sm" />
            Browse More Gigs
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default GigOrderSuccess;
