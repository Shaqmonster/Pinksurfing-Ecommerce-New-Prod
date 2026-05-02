import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { IoCloseCircle, IoArrowBackOutline } from "react-icons/io5";
import { FaBriefcase } from "react-icons/fa";

const GigOrderCancel = () => (
  <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden flex items-center justify-center px-4">
    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/8 rounded-full blur-[140px] pointer-events-none" />

    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", duration: 0.7 }}
      className="relative z-10 text-center max-w-md w-full"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 mb-6 mx-auto">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <IoCloseCircle className="text-red-400 text-4xl" />
        </motion.div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Payment Cancelled</h1>
      <p className="text-white/50 text-base mb-8">
        Your payment was cancelled and no charges were made. You can try again or choose a different gig.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/gigs"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          <FaBriefcase className="text-sm" />
          Browse Gigs
        </Link>
        <button
          onClick={() => window.history.back()}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#13131a] border border-white/10 text-white/60 font-semibold text-sm hover:border-white/20 transition-all"
        >
          <IoArrowBackOutline className="text-base" />
          Go Back
        </button>
      </div>
    </motion.div>
  </div>
);

export default GigOrderCancel;
