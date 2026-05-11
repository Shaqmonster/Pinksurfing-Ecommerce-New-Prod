import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FaCalendarAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import {
  createPropertyVisit,
  createVisitPaymentLink,
  buyerRescheduleVisit,
} from "../../api/propertyVisits";

function pad(n) {
  return String(n).padStart(2, "0");
}

function toDatetimeLocalValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function ceilToNextHalfHour(d) {
  const x = new Date(d.getTime());
  x.setSeconds(0, 0);
  const m = x.getMinutes();
  if (m === 0 || m === 30) return x;
  if (m < 30) {
    x.setMinutes(30);
    return x;
  }
  x.setHours(x.getHours() + 1);
  x.setMinutes(0);
  return x;
}

export default function VisitScheduleModal({
  open,
  onClose,
  accessToken,
  productId,
  visitKind,
  rescheduleVisitId,
  onSuccess,
}) {
  const { minLocal, maxLocal, defaultLocal } = useMemo(() => {
    const now = new Date();
    const minD = ceilToNextHalfHour(now);
    const maxD = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    maxD.setHours(23, 30, 0, 0);
    return {
      minLocal: toDatetimeLocalValue(minD),
      maxLocal: toDatetimeLocalValue(maxD),
      defaultLocal: toDatetimeLocalValue(minD),
    };
  }, [open]);

  const [slot, setSlot] = useState("");
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) setSlot(defaultLocal);
  }, [open, defaultLocal]);

  if (!open) return null;

  const isReschedule = Boolean(rescheduleVisitId);
  const title = isReschedule ? "Reschedule your visit" : "Schedule a visit";

  const handlePay = async () => {
    if (!accessToken) {
      toast.info("Please sign in to schedule a visit.");
      return;
    }
    if (!slot) {
      toast.error("Choose a date and time.");
      return;
    }
    const dt = new Date(slot);
    if (Number.isNaN(dt.getTime())) {
      toast.error("Invalid date.");
      return;
    }
    if (dt.getMinutes() !== 0 && dt.getMinutes() !== 30) {
      toast.error("Use 30-minute slots (on the hour or half-hour).");
      return;
    }
    setSubmitting(true);
    try {
      const visit = await createPropertyVisit(accessToken, {
        product_id: productId,
        scheduled_at: dt.toISOString(),
        visit_kind: visitKind,
      });
      const pay = await createVisitPaymentLink(accessToken, visit.id);
      const url = pay.payment_link || pay.payment_link_url;
      if (url) {
        window.location.href = url;
        return;
      }
      toast.error("Could not start checkout.");
    } catch (e) {
      const d = e?.response?.data?.detail || e?.message || "Request failed";
      toast.error(typeof d === "string" ? d : JSON.stringify(d));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async () => {
    if (!accessToken) {
      toast.info("Please sign in.");
      return;
    }
    if (!slot) {
      toast.error("Choose a new time.");
      return;
    }
    const dt = new Date(slot);
    setSubmitting(true);
    try {
      await buyerRescheduleVisit(accessToken, rescheduleVisitId, dt.toISOString());
      toast.success("Your new time was sent to the listing agent.");
      onSuccess?.();
      onClose();
    } catch (e) {
      const d = e?.response?.data?.detail || e?.message || "Request failed";
      toast.error(typeof d === "string" ? d : JSON.stringify(d));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#111] text-white shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-300">
                <FaCalendarAlt />
              </div>
              <h2 className="text-sm font-black uppercase tracking-widest">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-gray-400"
              aria-label="Close"
            >
              <IoClose size={22} />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-xs text-gray-400 leading-relaxed">
              Choose any slot from the next available half-hour up to 30 days ahead.
              You will complete a small scheduling fee on our secure checkout (same as
              listing activation). Emails are sent only after payment succeeds.
            </p>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500">
              Date &amp; time
            </label>
            <input
              type="datetime-local"
              min={minLocal}
              max={maxLocal}
              step={1800}
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/5"
              >
                Cancel
              </button>
              {isReschedule ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleReschedule}
                  className="flex-[2] py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-xs font-black uppercase tracking-widest disabled:opacity-50"
                >
                  {submitting ? "Sending…" : "Send new time"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handlePay}
                  className="flex-[2] py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-black uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-purple-600/30"
                >
                  {submitting ? "Redirecting…" : "Continue to payment"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
