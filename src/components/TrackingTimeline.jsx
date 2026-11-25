import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  IoLocationSharp,
  IoCheckmarkCircle,
  IoTimeOutline,
  IoOpenOutline,
  IoAirplaneSharp,
} from "react-icons/io5";
import { useAccessToken } from "../hooks/useAccessToken";
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
  const accessToken = useAccessToken();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!orderItemId || !accessToken) {
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
              Authorization: `Bearer ${accessToken}`,
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
  }, [orderItemId, accessToken]);

  if (loading) {
    return (
      <div className="w-full rounded-2xl border border-ps-border bg-ps-surface p-10 flex flex-col items-center gap-3" aria-busy="true">
        <div className="w-8 h-8 border-2 border-ps-border border-t-[var(--ps-primary)] rounded-full motion-safe:animate-spin" aria-hidden />
        <p className="text-sm text-ps-meta" role="status">Getting the latest from the carrier…</p>
      </div>
    );
  }

  if (error) {
    const isNotShipped = error.toLowerCase().includes("not been shipped");
    if (isNotShipped) {
      return (
        <div className="rounded-2xl border border-ps-border bg-ps-surface p-8 sm:p-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ps-action-soft">
            <FaBox className="text-2xl text-ps-action-text" aria-hidden />
          </div>
          <h4 className="text-lg font-semibold tracking-tight text-ink mb-2">Not shipped yet</h4>
          <p className="max-w-sm text-sm leading-relaxed text-ps-fg2">
            The store is preparing your order. Tracking appears here as soon as the carrier scans the package.
          </p>
        </div>
      );
    }
    return (
      <div role="alert" className="w-full rounded-2xl border border-ps-border bg-ps-surface p-8 text-center">
        <p className="text-sm text-ps-fg2">
          We couldn’t load tracking right now. Your order isn’t affected — try again in a little while.
        </p>
      </div>
    );
  }

  if (!tracking) return null;

  const isPending =
    tracking.status === "pending" ||
    (tracking.tracking_details && tracking.tracking_details.length === 0);
  const stageIndex = getStageIndex(tracking.status);

  return (
    <div className="w-full rounded-2xl border border-ps-border bg-ps-surface overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-ps-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-ink mb-1">Shipment</h3>
          <div className="flex items-center gap-3 text-xs text-ps-meta">
            <span>{tracking.carrier}</span>
            <span aria-hidden>·</span>
            <span className="font-mono">{tracking.tracking_code}</span>
          </div>
        </div>
        {tracking.est_delivery_date && !isPending && (
          <div className="rounded-xl border border-ps-border bg-ps-sunken px-4 py-2">
            <p className="text-xs text-ps-meta">Estimated arrival</p>
            <p className="text-sm font-semibold text-ink">{formatDeliveryDate(tracking.est_delivery_date)}</p>
          </div>
        )}
      </div>

      {isPending ? (
        <div className="p-8 sm:p-10 flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ps-action-soft">
            <IoTimeOutline className="text-2xl text-ps-action-text" aria-hidden />
          </div>
          <h4 className="text-lg font-semibold tracking-tight text-ink mb-2">Waiting for the first carrier scan</h4>
          <p className="max-w-sm text-sm leading-relaxed text-ps-fg2 mb-6">
            The label is ready. Updates appear here once the carrier picks up the package.
          </p>
          {tracking.tracking_url && (
            <a
              href={tracking.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[44px] rounded-xl border border-ps-border px-5 text-sm font-medium text-ink hover:bg-ps-hover"
            >
              <IoOpenOutline aria-hidden />
              Track on the carrier’s site
            </a>
          )}
        </div>
      ) : (
        <div className="p-6 sm:p-8">
          <ol className="relative flex items-start justify-between max-w-3xl mx-auto mb-10" aria-label="Shipment progress">
            <div className="absolute top-5 left-0 right-0 h-px bg-ps-border" aria-hidden />
            <div
              className="absolute top-5 left-0 h-px bg-[var(--ps-primary)] motion-safe:transition-all motion-safe:duration-700"
              style={{ width: stageIndex >= 0 ? `${(stageIndex / (TRACKING_STAGES.length - 1)) * 100}%` : "0%" }}
              aria-hidden
            />
            {TRACKING_STAGES.map((stage, idx) => {
              const isCompleted = idx <= stageIndex;
              const isCurrent = idx === stageIndex;
              const Icon = stage.icon;
              return (
                <li key={stage.key} className="relative z-10 flex flex-col items-center" aria-current={isCurrent ? "step" : undefined}>
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                      isCompleted
                        ? "bg-ps-action border-transparent text-white"
                        : "bg-ps-surface border-ps-border text-ps-meta"
                    }`}
                  >
                    {idx < stageIndex ? <IoCheckmarkCircle className="text-lg" aria-hidden /> : <Icon className="text-lg" aria-hidden />}
                  </div>
                  <span className={`mt-2 text-xs ${isCompleted ? "text-ink font-medium" : "text-ps-meta"}`}>{stage.label}</span>
                </li>
              );
            })}
          </ol>

          {tracking.tracking_details?.length > 0 && (
            <div className="pt-6 border-t border-ps-border">
              <h4 className="text-sm font-semibold text-ink mb-5">Updates</h4>
              <ol className="relative pl-6 space-y-6">
                <div className="absolute left-[3px] top-2 bottom-2 w-px bg-ps-border" aria-hidden />
                {tracking.tracking_details.map((detail, idx) => {
                  const isFirst = idx === 0;
                  const location = detail.tracking_location;
                  const locationStr = [location?.city, location?.state].filter(Boolean).join(", ");
                  return (
                    <li key={idx} className="relative">
                      <div
                        className={`absolute -left-[26px] top-1.5 w-2 h-2 rounded-full ${isFirst ? "bg-[var(--ps-primary)]" : "bg-ps-border-strong"}`}
                        aria-hidden
                      />
                      <p className={`text-sm mb-0.5 ${isFirst ? "text-ink font-medium" : "text-ps-fg2"}`}>{detail.message}</p>
                      <p className="text-xs text-ps-meta">
                        {formatDate(detail.datetime)}
                        {locationStr ? ` · ${locationStr}` : ""}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {tracking.tracking_url && (
            <div className="mt-8 flex justify-center">
              <a
                href={tracking.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 min-h-[44px] rounded-xl border border-ps-border px-5 text-sm font-medium text-ink hover:bg-ps-hover"
              >
                <IoOpenOutline aria-hidden />
                Full carrier history
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackingTimeline;
