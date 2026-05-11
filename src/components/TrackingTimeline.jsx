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
          err.response?.data?.error ||
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

  if (loading) {
    return (
      <div className="w-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Syncing with carrier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isNotShipped = error.toLowerCase().includes("not been shipped");
    if (isNotShipped) {
      return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white/[0.02] border border-white/5 p-12 md:p-20 flex flex-col items-center text-center group">
          {/* Decorative Background Glows */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-pink-500/10 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="relative mb-10">
            <div className="w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-xl group-hover:scale-110 transition-transform duration-500">
              <div className="relative">
                <FaBox className="text-4xl text-purple-400/80" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-[#0E0F13] animate-pulse" />
              </div>
            </div>
            {/* Pulsing ring around icon */}
            <div className="absolute inset-0 w-24 h-24 rounded-3xl border border-purple-500/20 animate-ping [animation-duration:3s]" />
          </div>

          <h4 className="text-3xl font-black uppercase tracking-tighter mb-4 bg-gradient-to-r from-white via-white/80 to-white/60 bg-clip-text text-transparent">
            Item Has Not Shipped Yet
          </h4>
          
          <div className="space-y-4 max-w-sm">
            <p className="text-gray-400 text-sm leading-relaxed">
              The vendor is currently preparing your package for dispatch. We'll update this timeline with live tracking data as soon as the carrier receives the item.
            </p>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Processing at warehouse</span>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="w-full bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] p-10 text-center">
        <p className="text-rose-400 text-sm font-medium tracking-tight">{error}</p>
      </div>
    );
  }

  if (!tracking) return null;

  const isPending =
    tracking.status === "pending" ||
    (tracking.tracking_details && tracking.tracking_details.length === 0);
  const stageIndex = getStageIndex(tracking.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-6"
    >
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-[2.5rem] overflow-hidden">
        {/* Header Section */}
        <div className="p-8 md:p-10 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight mb-1 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              Live Shipment Data
            </h3>
            <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
              <span>{tracking.carrier}</span>
              <span className="w-1 h-1 rounded-full bg-white/10" />
              <span>#{tracking.tracking_code}</span>
            </div>
          </div>

          {tracking.est_delivery_date && !isPending && (
            <div className="bg-purple-600/10 border border-purple-500/20 rounded-2xl px-6 py-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-purple-400 mb-0.5">Est. Arrival</p>
              <p className="text-base font-black tracking-tight">{formatDeliveryDate(tracking.est_delivery_date)}</p>
            </div>
          )}
        </div>

        {isPending ? (
          <div className="relative overflow-hidden p-12 md:p-20 flex flex-col items-center text-center group">
            {/* Decorative Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
            
            <div className="relative mb-10">
              <div className="w-24 h-24 bg-gradient-to-br from-white/10 to-white/5 rounded-3xl flex items-center justify-center border border-white/10 shadow-2xl backdrop-blur-xl group-hover:scale-110 transition-transform duration-500">
                <IoTimeOutline className="text-4xl text-amber-400/80" />
              </div>
              <div className="absolute inset-0 w-24 h-24 rounded-3xl border border-amber-500/20 animate-ping [animation-duration:4s]" />
            </div>

            <h4 className="text-3xl font-black uppercase tracking-tighter mb-4 bg-gradient-to-r from-white via-white/80 to-white/60 bg-clip-text text-transparent">
              Awaiting Carrier Scan
            </h4>
            <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-8">
              Your package is prepared and ready. Once the carrier processes the initial scan, live updates will appear here.
            </p>
            
            {tracking.tracking_url && (
              <a
                href={tracking.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 px-8 py-3.5 bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2"
              >
                <IoOpenOutline className="text-lg" />
                Track on Website
              </a>
            )}
          </div>
        ) : (
          <div className="p-8 md:p-10">
            {/* Progress Visualization */}
            <div className="mb-12">
              <div className="relative flex items-center justify-between max-w-4xl mx-auto">
                <div className="absolute top-5 left-0 right-0 h-[2px] bg-white/5 rounded-full" />
                <div
                  className="absolute top-5 left-0 h-[2px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-[length:200%_auto] animate-gradient transition-all duration-1000 ease-in-out"
                  style={{ width: stageIndex >= 0 ? `${(stageIndex / (TRACKING_STAGES.length - 1)) * 100}%` : "0%" }}
                />

                {TRACKING_STAGES.map((stage, idx) => {
                  const isCompleted = idx <= stageIndex;
                  const isCurrent = idx === stageIndex;
                  const Icon = stage.icon;

                  return (
                    <div key={stage.key} className="relative z-10 flex flex-col items-center group">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                        isCompleted 
                          ? "bg-white border-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                          : "bg-[#1A1C1E] border-white/5 text-gray-600"
                      }`}>
                        {idx < stageIndex ? <IoCheckmarkCircle className="text-lg" /> : <Icon className="text-lg" />}
                      </div>
                      <span className={`mt-4 text-[9px] font-black uppercase tracking-widest transition-colors ${isCompleted ? "text-white" : "text-gray-600"}`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event Log */}
            {tracking.tracking_details?.length > 0 && (
              <div className="space-y-6 pt-10 border-t border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Movement History</h4>
                <div className="relative pl-8 space-y-10">
                  <div className="absolute left-[3px] top-2 bottom-2 w-[1px] bg-white/10" />
                  {tracking.tracking_details.map((detail, idx) => {
                    const isFirst = idx === 0;
                    const location = detail.tracking_location;
                    const locationStr = [location?.city, location?.state].filter(Boolean).join(", ");

                    return (
                      <div key={idx} className="relative group">
                        <div className={`absolute -left-[33px] top-1 w-2 h-2 rounded-full border ${isFirst ? "bg-purple-500 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]" : "bg-black border-white/20"}`} />
                        <div>
                          <p className={`text-sm font-bold tracking-tight mb-1 ${isFirst ? "text-white" : "text-gray-400"}`}>{detail.message}</p>
                          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                            <span>{formatDate(detail.datetime)}</span>
                            {locationStr && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-pink-500/60">{locationStr}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {tracking.tracking_url && (
              <div className="mt-12 flex justify-center">
                <a
                  href={tracking.tracking_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-10 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all flex items-center gap-3"
                >
                  <IoOpenOutline className="text-lg text-purple-400" />
                  Detailed Carrier Log
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TrackingTimeline;
