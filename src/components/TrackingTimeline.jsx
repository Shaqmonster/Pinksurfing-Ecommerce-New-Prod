import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoLocationSharp,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoOpenOutline,
  IoAirplaneSharp,
} from "react-icons/io5";
import {
  FaTruckMoving,
  FaBoxOpen,
  FaShippingFast,
  FaBox,
} from "react-icons/fa";

// The 4 progress stages as defined by the backend
const TRACKING_STAGES = [
  { key: "pre_transit", label: "Pre-Transit", icon: FaBox },
  { key: "in_transit", label: "In Transit", icon: FaTruckMoving },
  { key: "out_for_delivery", label: "Out for Delivery", icon: FaShippingFast },
  { key: "delivered", label: "Delivered", icon: FaBoxOpen },
];

/**
 * Returns the index (0-3) of the current stage in the progress bar.
 * Falls back to -1 for "pending" or unknown statuses.
 */
const getStageIndex = (status) => {
  if (!status) return -1;
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  const idx = TRACKING_STAGES.findIndex((s) => s.key === normalized);
  return idx;
};

/**
 * Formats an ISO datetime string into a user-friendly display.
 */
const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Formats an ISO datetime string to show only the date portion prominently.
 */
const formatDeliveryDate = (isoString) => {
  if (!isoString) return "N/A";
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * TrackingTimeline Component
 *
 * Accepts an `orderItemId` prop and fetches live tracking data from:
 *   GET /api/shipping/tracking/<order_item_id>/
 *
 * Renders:
 *  - Estimated delivery date at the top
 *  - Horizontal progress bar (pre_transit → in_transit → out_for_delivery → delivered)
 *  - Vertical chronological timeline of tracking events
 *  - "View on Carrier Website" fallback button
 */
const TrackingTimeline = ({ orderItemId }) => {
  const [cookies] = useCookies(["access_token"]);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!orderItemId || !cookies.access_token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/shipping/tracking/${orderItemId}/`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.access_token}`,
            },
          }
        );
        setTracking(response.data);
      } catch (err) {
        console.error("Failed to fetch tracking data:", err);
        setError(
          err.response?.data?.message ||
            err.response?.data?.detail ||
            "Unable to load tracking information."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTracking();
  }, [orderItemId, cookies.access_token]);

  // ── Loading State ──
  if (loading) {
    return (
      <div className="w-full mt-6 rounded-2xl border border-white/10 bg-white/5 dark:bg-[#13131a] p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading tracking info…</p>
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <div className="w-full mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <p className="text-red-400 text-sm text-center">{error}</p>
      </div>
    );
  }

  // ── No tracking data at all ──
  if (!tracking) return null;

  const isPending =
    tracking.status === "pending" ||
    (tracking.tracking_details && tracking.tracking_details.length === 0);
  const stageIndex = getStageIndex(tracking.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full mt-6"
    >
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#13131a] to-[#1a1a24] overflow-hidden shadow-xl">
        {/* ── Header: Title + Tracking Code ── */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <FaTruckMoving className="text-purple-400" />
                Package Tracking
              </h3>
              {tracking.tracking_code && (
                <p className="text-gray-400 text-sm mt-1">
                  Tracking #:{" "}
                  <span className="text-purple-300 font-mono font-medium">
                    {tracking.tracking_code}
                  </span>
                </p>
              )}
              {tracking.carrier && (
                <p className="text-gray-400 text-sm mt-0.5">
                  Carrier:{" "}
                  <span className="text-white font-semibold">
                    {tracking.carrier}
                  </span>
                </p>
              )}
            </div>

            {/* Estimated Delivery Date — Prominent */}
            {tracking.est_delivery_date && !isPending && (
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl px-5 py-3 text-center sm:text-right">
                <p className="text-[11px] uppercase tracking-wider text-purple-300 font-semibold mb-0.5">
                  Estimated Delivery
                </p>
                <p className="text-white font-bold text-base sm:text-lg">
                  {formatDeliveryDate(tracking.est_delivery_date)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pending State ── */}
        {isPending && (
          <div className="px-6 py-10 flex flex-col items-center text-center">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="mb-4"
            >
              <IoTimeOutline className="text-5xl text-yellow-400" />
            </motion.div>
            <h4 className="text-white text-lg font-semibold mb-2">
              Waiting for Carrier Scan
            </h4>
            <p className="text-gray-400 text-sm max-w-md mb-6">
              Your package has been shipped but the carrier hasn't scanned it
              yet. Tracking updates will appear here automatically once
              available.
            </p>
            {tracking.tracking_url && (
              <a
                href={tracking.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors shadow-lg hover:shadow-purple-500/30"
              >
                <IoOpenOutline className="text-lg" />
                View on Carrier Website
              </a>
            )}
          </div>
        )}

        {/* ── Active Tracking ── */}
        {!isPending && (
          <>
            {/* ── Progress Bar ── */}
            <div className="px-6 py-6">
              {/* Desktop: Horizontal */}
              <div className="hidden sm:block">
                <div className="relative flex items-center justify-between">
                  {/* Background track line */}
                  <div className="absolute top-5 left-0 right-0 h-1 bg-white/10 rounded-full" />
                  {/* Active track line */}
                  <div
                    className="absolute top-5 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width:
                        stageIndex >= 0
                          ? `${(stageIndex / (TRACKING_STAGES.length - 1)) * 100}%`
                          : "0%",
                    }}
                  />

                  {TRACKING_STAGES.map((stage, idx) => {
                    const isCompleted = idx <= stageIndex;
                    const isCurrent = idx === stageIndex;
                    const Icon = stage.icon;

                    return (
                      <div
                        key={stage.key}
                        className="relative z-10 flex flex-col items-center"
                      >
                        <motion.div
                          initial={false}
                          animate={{
                            scale: isCurrent ? 1.15 : 1,
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isCompleted
                              ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/40"
                              : "bg-white/10 border border-white/20"
                          }`}
                        >
                          {isCompleted ? (
                            idx < stageIndex ? (
                              <IoCheckmarkCircle className="text-white text-xl" />
                            ) : (
                              <Icon className="text-white text-lg" />
                            )
                          ) : (
                            <Icon className="text-gray-500 text-lg" />
                          )}
                        </motion.div>
                        <p
                          className={`mt-2 text-xs font-medium text-center max-w-[80px] ${
                            isCompleted
                              ? "text-purple-300"
                              : "text-gray-500"
                          }`}
                        >
                          {stage.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile: Vertical */}
              <div className="block sm:hidden space-y-3">
                {TRACKING_STAGES.map((stage, idx) => {
                  const isCompleted = idx <= stageIndex;
                  const isCurrent = idx === stageIndex;
                  const Icon = stage.icon;

                  return (
                    <div key={stage.key} className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/30"
                            : "bg-white/10 border border-white/20"
                        }`}
                      >
                        {isCompleted ? (
                          idx < stageIndex ? (
                            <IoCheckmarkCircle className="text-white text-lg" />
                          ) : (
                            <Icon className="text-white text-sm" />
                          )
                        ) : (
                          <Icon className="text-gray-500 text-sm" />
                        )}
                      </div>
                      <p
                        className={`text-sm font-medium ${
                          isCompleted ? "text-white" : "text-gray-500"
                        } ${isCurrent ? "font-bold" : ""}`}
                      >
                        {stage.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Weight & Signed By ── */}
            {(tracking.weight || tracking.signed_by) && (
              <div className="px-6 pb-4 flex flex-wrap gap-4">
                {tracking.weight && (
                  <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-400">Weight: </span>
                    <span className="text-white font-medium">
                      {tracking.weight} oz
                    </span>
                  </div>
                )}
                {tracking.signed_by && (
                  <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm">
                    <span className="text-gray-400">Signed by: </span>
                    <span className="text-white font-medium">
                      {tracking.signed_by}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* ── Event Timeline ── */}
            {tracking.tracking_details &&
              tracking.tracking_details.length > 0 && (
                <div className="px-6 pb-6">
                  <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                    <IoLocationSharp className="text-pink-400" />
                    Tracking Timeline
                  </h4>
                  <div className="relative">
                    {/* Vertical connector line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-purple-500/60 via-purple-500/30 to-transparent" />

                    <div className="space-y-4">
                      {tracking.tracking_details.map((detail, idx) => {
                        const isFirst = idx === 0;
                        const location = detail.tracking_location;
                        const locationStr = [
                          location?.city,
                          location?.state,
                          location?.country,
                        ]
                          .filter(Boolean)
                          .join(", ");

                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="relative flex gap-4 pl-1"
                          >
                            {/* Dot */}
                            <div className="relative z-10 flex-shrink-0 mt-1">
                              <div
                                className={`w-[12px] h-[12px] rounded-full border-2 ${
                                  isFirst
                                    ? "bg-purple-500 border-purple-400 shadow-md shadow-purple-500/50"
                                    : "bg-white/10 border-white/30"
                                }`}
                              />
                            </div>

                            {/* Content */}
                            <div
                              className={`flex-1 rounded-xl p-3 ${
                                isFirst
                                  ? "bg-purple-500/10 border border-purple-500/20"
                                  : "bg-white/[0.03] border border-white/5"
                              }`}
                            >
                              <p
                                className={`text-sm font-medium ${
                                  isFirst ? "text-white" : "text-gray-300"
                                }`}
                              >
                                {detail.message}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                <p className="text-xs text-gray-500">
                                  {formatDate(detail.datetime)}
                                </p>
                                {locationStr && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <IoLocationSharp className="text-[10px] text-pink-400/60" />
                                    {locationStr}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            {/* ── Carrier Website Button (Always visible) ── */}
            {tracking.tracking_url && (
              <div className="px-6 pb-6">
                <a
                  href={tracking.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 font-medium rounded-xl hover:bg-white/10 hover:text-white hover:border-purple-500/30 transition-all text-sm"
                >
                  <IoOpenOutline className="text-lg text-purple-400" />
                  View on Carrier Website
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default TrackingTimeline;
