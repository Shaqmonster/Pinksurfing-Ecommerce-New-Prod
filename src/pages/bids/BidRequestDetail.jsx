import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import {
  IoArrowBack,
  IoArrowForward,
  IoClose,
  IoAdd,
  IoTrash,
  IoCloudUpload,
  IoCheckmarkCircle,
  IoAlertCircle,
  IoShieldCheckmark,
  IoCalendarOutline,
  IoTimeOutline,
  IoDocumentText,
  IoFlag,
  IoAttach,
  IoCreate,
  IoSave,
  IoSparkles,
  IoCamera,
  IoCheckmark,
} from "react-icons/io5";
import {
  FaDollarSign,
  FaTag,
  FaCheck,
  FaCheckCircle,
  FaShieldAlt,
  FaEdit,
  FaMapMarkerAlt,
} from "react-icons/fa";
import {
  getOpenRequestDetail,
  createBidOffer,
  getMySubmittedBids,
  withdrawBidOffer,
} from "../../api/buyerRequests";
import { toast } from "react-toastify";

// ─── Constants ─────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Job Overview", shortLabel: "Overview" },
  { label: "Offer Basics", shortLabel: "Basics" },
  { label: "Price & Payment", shortLabel: "Price" },
  { label: "Timeline", shortLabel: "Timeline" },
  { label: "Scope & Inclusions", shortLabel: "Scope" },
  { label: "Milestones", shortLabel: "Milestones" },
  { label: "Attachments", shortLabel: "Files" },
  { label: "Review & Send", shortLabel: "Review" },
];

const BID_STATUS_COLORS = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  SHORTLISTED: "bg-blue-500/20 text-blue-400",
  ACCEPTED: "bg-emerald-500/20 text-emerald-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

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

// ─── Helper Components ─────────────────────────────────────────────────────────

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      checked ? "bg-pink-500" : "bg-white/20"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
        checked ? "translate-x-4" : "translate-x-0.5"
      }`}
    />
  </button>
);

const StepProgressBar = ({ currentStep }) => (
  <div className="w-full">
    {/* Mobile */}
    <div className="flex items-center justify-between md:hidden">
      <span className="text-sm font-medium text-white">
        Step {currentStep + 1} of {STEPS.length}
      </span>
      <span className="text-sm text-white/50">{STEPS[currentStep]?.label}</span>
    </div>
    <div className="md:hidden mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
      />
    </div>
    {/* Desktop */}
    <div className="hidden md:flex items-center gap-0.5">
      {STEPS.map((step, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={i} className="flex items-center flex-1">
            <div
              className={`flex items-center gap-1.5 text-xs font-medium px-1.5 py-1 rounded-md w-full ${
                done ? "text-pink-400" : active ? "text-white" : "text-white/30"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all ${
                  done
                    ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                    : active
                    ? "border-2 border-pink-400 text-pink-400"
                    : "border border-white/20 text-white/30"
                }`}
              >
                {done ? <FaCheck className="text-[7px]" /> : i + 1}
              </div>
              <span className="hidden xl:inline truncate text-[11px]">{step.shortLabel}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-3 h-px flex-shrink-0 ${done ? "bg-pink-400/50" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  </div>
);

const StickyFooter = ({ currentStep, onBack, onNext, isLastStep, isLoading }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-t border-white/10 px-4 py-3">
    <div className="max-w-3xl mx-auto flex items-center justify-between">
      <div>
        {currentStep > 0 && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            <IoArrowBack />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={isLoading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold text-sm transition-all min-w-[130px] justify-center disabled:opacity-60 disabled:cursor-not-allowed ${
          isLastStep
            ? "bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg shadow-pink-500/25 hover:opacity-90"
            : "bg-white/10 hover:bg-white/15"
        }`}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {isLastStep ? "Send Offer" : "Continue"}
            {!isLastStep && <IoArrowForward />}
          </>
        )}
      </button>
    </div>
  </div>
);

// ─── Job Sidebar ───────────────────────────────────────────────────────────────

const JobSidebar = ({ request }) => {
  const images = [request.image1, request.image2, request.image3, request.image4].filter(Boolean);
  return (
    <div className="sticky top-24 bg-[#13131a] border border-white/10 rounded-2xl p-4 space-y-4">
      <p className="text-xs font-mono text-pink-400 font-semibold tracking-wider uppercase">
        Job Request
      </p>
      {request.category_name && (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full">
          <FaTag className="text-[9px]" />
          {request.category_name}
        </span>
      )}
      <h3 className="text-base font-bold text-white leading-snug">{request.title}</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-white/60">
          <FaDollarSign className="text-emerald-500 flex-shrink-0" />
          <span className="font-semibold text-emerald-400 truncate">${request.budget}</span>
        </div>
        {request.deadline && (
          <div className="flex items-center gap-1.5 text-white/60">
            <IoCalendarOutline className="text-pink-400 flex-shrink-0" />
            <span className="text-xs truncate">
              {new Date(request.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-white/60 col-span-2">
          <FaShieldAlt className="text-pink-400 flex-shrink-0 text-xs" />
          <span className="text-xs">
            {request.customer_first_name} {request.customer_last_name}
          </span>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {images.map((src, i) => (
            <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/5">
              <img src={src} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-white/50 leading-relaxed line-clamp-4">{request.description}</p>

      <div className="pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>{request.bids?.length ?? 0} bid{(request.bids?.length ?? 0) !== 1 ? "s" : ""} submitted</span>
          <span>Posted {timeAgo(request.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

// ─── Step Components ────────────────────────────────────────────────────────────

const JobOverviewStep = ({ request, onContinue }) => {
  const reqImages = [request.image1, request.image2, request.image3, request.image4].filter(Boolean);
  return (
    <div className="space-y-6">
      {/* Mobile-only job card */}
      <div className="md:hidden bg-[#13131a] border border-white/10 rounded-2xl p-4 space-y-4">
        <span className="text-xs font-mono text-pink-400 font-semibold tracking-wider uppercase">Job Request</span>
        <h2 className="text-xl font-bold text-white">{request.title}</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { Icon: FaTag, text: request.category_name || "General" },
            { Icon: FaDollarSign, text: `$${request.budget}`, cls: "text-emerald-400" },
            ...(request.deadline
              ? [{ Icon: IoCalendarOutline, text: `Due ${new Date(request.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` }]
              : []),
          ].map(({ Icon, text, cls }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-white/60">
              <Icon className="text-pink-400 flex-shrink-0" />
              <span className={cls}>{text}</span>
            </div>
          ))}
        </div>
        {reqImages.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {reqImages.map((src, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <p className="text-sm text-white/60 leading-relaxed">{request.description}</p>
      </div>

      {/* Desktop prompt */}
      <div className="hidden md:block space-y-2">
        <h2 className="text-2xl font-bold text-white">Ready to Submit Your Offer?</h2>
        <p className="text-white/50">
          Review the job details on the left, then create a professional offer in just a few steps.
        </p>
      </div>

      {/* Pay-to-bid notice */}
      <div className="bg-[#13131a] border border-pink-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <IoAlertCircle className="text-pink-400 text-lg flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Pay-to-bid notice</p>
            <p className="text-xs text-white/50 mt-0.5">
              A small bid fee may apply to reach verified buyers. You&apos;ll only be charged upon submission.
            </p>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { Icon: IoShieldCheckmark, label: "Escrow Protected" },
          { Icon: FaShieldAlt, label: "Verified Buyer" },
          { Icon: FaCheckCircle, label: "Secure Payment" },
        ].map(({ Icon, label }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
            <Icon className="text-pink-400 text-base mx-auto mb-1.5" />
            <p className="text-[10px] font-medium text-white/60">{label}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-pink-500/20"
      >
        Create Offer
        <IoArrowForward />
      </button>
    </div>
  );
};

const fieldClass = "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#1a1a24] text-white text-sm outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-all placeholder-white/30";
const labelClass = "text-xs font-medium text-white/60";
const textareaClass = `${fieldClass} resize-none`;

const OfferBasicsStep = ({ data, onChange }) => {
  const offerTypes = [
    { value: "fixed", label: "Fixed Price", desc: "Single set price" },
    { value: "range", label: "Price Range", desc: "Min to max" },
    { value: "hourly", label: "Hourly", desc: "Per-hour rate" },
    { value: "negotiable", label: "Negotiable", desc: "Open to discuss" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Offer Basics</h2>
        <p className="text-sm text-white/50 mt-1">Start with the essentials</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Offer Title</label>
          <input
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
            placeholder="e.g. Full Kitchen Renovation — Premium Package"
            className={fieldClass}
          />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Pricing Type</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {offerTypes.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => onChange("offerType", t.value)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition-all ${
                  data.offerType === t.value
                    ? "border-pink-500/50 bg-pink-500/10 text-white"
                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
              >
                <span className="font-semibold">{t.label}</span>
                <span className="text-[10px] text-white/40">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Offer Summary</label>
          <textarea
            value={data.summary}
            onChange={(e) => onChange("summary", e.target.value)}
            rows={4}
            placeholder="Briefly describe your offer and why you're the best fit for this job..."
            className={textareaClass}
          />
        </div>
      </div>
    </div>
  );
};

const PricePaymentStep = ({ data, onChange }) => {
  const total = parseFloat(data.amount) || 0;
  const deposit = data.depositRequired ? (total * 0.25).toFixed(2) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Price &amp; Payment</h2>
        <p className="text-sm text-white/50 mt-1">Set your pricing and payment terms</p>
      </div>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Your Bid Amount (USD)</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 text-sm">$</span>
            <input
              type="number"
              min="1"
              value={data.amount}
              onChange={(e) => onChange("amount", e.target.value)}
              placeholder="e.g. 15000"
              className={`${fieldClass} pl-8`}
            />
          </div>
        </div>

        {/* Price summary */}
        {total > 0 && (
          <div className="bg-[#1a1a24] border border-white/10 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Base price</span><span>${total.toLocaleString()}</span>
            </div>
            {data.depositRequired && (
              <div className="flex justify-between text-amber-400">
                <span>Deposit (25%)</span><span>${deposit}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-white border-t border-white/10 pt-2">
              <span>Total</span><span>${total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div className="bg-[#13131a] border border-white/10 rounded-xl p-4 space-y-4">
          {[
            { key: "depositRequired", label: "Deposit Required", sub: "25% upfront before work begins" },
            { key: "taxesIncluded", label: "Taxes Included", sub: "Price includes applicable taxes" },
            { key: "financingAvailable", label: "Financing Available", sub: "Offer payment plan options" },
          ].map(({ key, label, sub }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/40">{sub}</p>
              </div>
              <Toggle checked={data[key]} onChange={(v) => onChange(key, v)} />
            </div>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Payment Schedule</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["On Completion", "Milestone-based", "50/50 Split", "Weekly", "Monthly", "Custom"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange("paymentSchedule", s)}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  data.paymentSchedule === s
                    ? "border-pink-500/50 bg-pink-500/10 text-pink-400"
                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TimelineStep = ({ data, onChange }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">Timeline</h2>
      <p className="text-sm text-white/50 mt-1">When can you start and finish?</p>
    </div>
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelClass}>Delivery Time (Days)</label>
        <div className="relative">
          <IoCalendarOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="number"
            min="1"
            value={data.deliveryDays}
            onChange={(e) => onChange("deliveryDays", e.target.value)}
            placeholder="e.g. 30"
            className={`${fieldClass} pl-10`}
          />
        </div>
        <p className="text-[11px] text-white/40">How many days from start to project completion?</p>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Proposed Start Date</label>
        <div className="relative">
          <IoCalendarOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="date"
            value={data.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            className={`${fieldClass} pl-10`}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Offer Duration / Project Duration (text)</label>
        <input
          value={data.duration}
          onChange={(e) => onChange("duration", e.target.value)}
          placeholder="e.g. 4–6 weeks"
          className={fieldClass}
        />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Availability</label>
        <div className="grid grid-cols-3 gap-2">
          {["immediate", "within-week", "within-month"].map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange("availability", v)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium capitalize transition-all ${
                data.availability === v
                  ? "border-pink-500/50 bg-pink-500/10 text-pink-400"
                  : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/80"
              }`}
            >
              {v.replace(/-/g, " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#13131a] border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-white">Rush Fee Available</p>
          <p className="text-xs text-white/40">Charge extra for expedited completion</p>
        </div>
        <Toggle checked={data.rushFee} onChange={(v) => onChange("rushFee", v)} />
      </div>

      <div className="space-y-1.5">
        <label className={labelClass}>Offer Expiration Date</label>
        <div className="relative">
          <IoTimeOutline className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="date"
            value={data.expirationDate}
            onChange={(e) => onChange("expirationDate", e.target.value)}
            className={`${fieldClass} pl-10`}
          />
        </div>
        <p className="text-[11px] text-white/40">When does this offer expire?</p>
      </div>
    </div>
  </div>
);

const ScopeStep = ({ data, onChange }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">Scope &amp; Inclusions</h2>
      <p className="text-sm text-white/50 mt-1">Define exactly what's included and excluded</p>
    </div>
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={labelClass}>Scope of Work</label>
        <textarea
          value={data.scope}
          onChange={(e) => onChange("scope", e.target.value)}
          rows={5}
          placeholder="Describe in detail what work you will perform..."
          className={textareaClass}
        />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>What's Included</label>
        <textarea
          value={data.inclusions}
          onChange={(e) => onChange("inclusions", e.target.value)}
          rows={3}
          placeholder="e.g. Materials, labor, permits, cleanup..."
          className={textareaClass}
        />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>What's Excluded</label>
        <textarea
          value={data.exclusions}
          onChange={(e) => onChange("exclusions", e.target.value)}
          rows={3}
          placeholder="e.g. Appliances, fixtures, landscaping..."
          className={textareaClass}
        />
      </div>
      <div className="space-y-1.5">
        <label className={labelClass}>Assumptions &amp; Conditions</label>
        <textarea
          value={data.assumptions}
          onChange={(e) => onChange("assumptions", e.target.value)}
          rows={3}
          placeholder="e.g. Assumes site access 8am–5pm weekdays, existing structure is sound..."
          className={textareaClass}
        />
      </div>
    </div>
  </div>
);

const MilestonesStep = ({ milestones, onAdd, onChange, onRemove, totalPrice }) => {
  const milestoneTotal = milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0);
  const remaining = (parseFloat(totalPrice) || 0) - milestoneTotal;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Milestones</h2>
        <p className="text-sm text-white/50 mt-1">Break the project into phases (optional)</p>
      </div>

      {parseFloat(totalPrice) > 0 && (
        <div className="bg-[#1a1a24] border border-white/10 rounded-xl p-4 text-sm">
          <div className="flex justify-between text-white/60 mb-1">
            <span>Total bid</span><span>${parseFloat(totalPrice).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-white/60 mb-1">
            <span>In milestones</span><span>${milestoneTotal.toLocaleString()}</span>
          </div>
          <div className={`flex justify-between font-bold border-t border-white/10 pt-2 ${remaining < 0 ? "text-red-400" : "text-white"}`}>
            <span>Remaining</span><span>${remaining.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {milestones.map((m, i) => (
          <div key={m.id} className="bg-[#13131a] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-pink-400 uppercase tracking-wider">
                Milestone {i + 1}
              </span>
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                className="text-white/30 hover:text-red-400 transition-colors"
              >
                <IoTrash className="text-sm" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={labelClass}>Title</label>
                <input
                  value={m.title}
                  onChange={(e) => onChange(m.id, "title", e.target.value)}
                  placeholder="e.g. Design & Planning"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>Amount ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    value={m.amount}
                    onChange={(e) => onChange(m.id, "amount", e.target.value)}
                    placeholder="0"
                    className={`${fieldClass} pl-7`}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Description</label>
              <input
                value={m.description}
                onChange={(e) => onChange(m.id, "description", e.target.value)}
                placeholder="What happens in this milestone?"
                className={fieldClass}
              />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Due (e.g. "Week 2", "Day 14")</label>
              <input
                value={m.dueTiming}
                onChange={(e) => onChange(m.id, "dueTiming", e.target.value)}
                placeholder="e.g. End of week 2"
                className={fieldClass}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-2 w-full py-3 rounded-xl border border-dashed border-white/20 text-white/50 hover:border-pink-500/40 hover:text-pink-400 text-sm font-medium transition-all"
      >
        <IoAdd className="text-lg" />
        Add Milestone
      </button>

      {milestones.length === 0 && (
        <p className="text-xs text-center text-white/30">
          No milestones added. You can skip this step or add payment phases.
        </p>
      )}
    </div>
  );
};

const AttachmentsStep = ({ attachments, onAdd, onRemove }) => {
  const fileInputRef = useRef(null);

  const handleFiles = (fileList) => {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.size <= 20 * 1024 * 1024);
    onAdd(files);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Attachments</h2>
        <p className="text-sm text-white/50 mt-1">Upload portfolio samples, plans, or documents (up to 4 files)</p>
      </div>

      {attachments.length < 4 && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          className="border-2 border-dashed border-white/15 rounded-xl p-8 text-center cursor-pointer hover:border-pink-500/40 hover:bg-white/3 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <IoCloudUpload className="text-4xl text-white/20 mx-auto mb-3" />
          <p className="text-sm font-medium text-white/60">Drag files here or tap to upload</p>
          <p className="text-xs text-white/30 mt-1">Images, PDF, Word — up to 20MB each (max 4 files)</p>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((file, i) => (
            <div key={i} className="flex items-center gap-3 bg-[#13131a] border border-white/10 rounded-xl p-3">
              <IoDocumentText className="text-pink-400 text-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{file.name}</p>
                <p className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-white/30 hover:text-red-400 transition-colors flex-shrink-0"
              >
                <IoClose />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReviewStep = ({ offerData, milestones, onEdit }) => {
  const sections = [
    {
      step: 1, title: "Offer Basics",
      fields: [
        { label: "Title", value: offerData.title || "Not set" },
        { label: "Type", value: offerData.offerType || "Not set" },
        { label: "Summary", value: offerData.summary || "Not set" },
      ],
    },
    {
      step: 2, title: "Price & Payment",
      fields: [
        { label: "Amount", value: offerData.amount ? `$${offerData.amount}` : "Not set" },
        { label: "Deposit", value: offerData.depositRequired ? "Required (25%)" : "No" },
        { label: "Payment Schedule", value: offerData.paymentSchedule || "Not set" },
        { label: "Taxes Included", value: offerData.taxesIncluded ? "Yes" : "No" },
      ],
    },
    {
      step: 3, title: "Timeline",
      fields: [
        { label: "Delivery Days", value: offerData.deliveryDays ? `${offerData.deliveryDays} days` : "Not set" },
        { label: "Start Date", value: offerData.startDate || "Not set" },
        { label: "Duration", value: offerData.duration || "Not set" },
        { label: "Availability", value: offerData.availability || "Not set" },
      ],
    },
    {
      step: 4, title: "Scope & Inclusions",
      fields: [
        { label: "Scope", value: offerData.scope || "Not set" },
        { label: "Included", value: offerData.inclusions || "Not set" },
        { label: "Excluded", value: offerData.exclusions || "Not set" },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Review &amp; Send</h2>
        <p className="text-sm text-white/50 mt-1">Review your offer before submission</p>
      </div>

      {sections.map(({ step, title, fields }) => (
        <div key={step} className="bg-[#13131a] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{title}</p>
            <button
              type="button"
              onClick={() => onEdit(step)}
              className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition-colors"
            >
              <IoCreate className="text-sm" />
              Edit
            </button>
          </div>
          <div className="p-4 space-y-2">
            {fields.map(({ label, value }) => (
              <div key={label} className="flex gap-3">
                <span className="text-xs text-white/40 w-28 flex-shrink-0">{label}:</span>
                <span className="text-xs text-white/80 flex-1 line-clamp-2">{value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {milestones.filter((m) => m.title).length > 0 && (
        <div className="bg-[#13131a] border border-white/10 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">Milestones</p>
            <button
              type="button"
              onClick={() => onEdit(5)}
              className="flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300 transition-colors"
            >
              <IoCreate className="text-sm" />Edit
            </button>
          </div>
          <div className="p-4 space-y-2">
            {milestones.filter((m) => m.title).map((m, i) => (
              <div key={m.id} className="flex items-center justify-between text-xs">
                <span className="text-white/60">{i + 1}. {m.title}</span>
                {m.amount && <span className="text-emerald-400 font-semibold">${m.amount}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Funds notice */}
      <div className="bg-[#13131a] border border-white/10 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <IoShieldCheckmark className="text-pink-400 text-lg flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Funds are held securely</p>
            <p className="text-xs text-white/50 mt-0.5">
              Once accepted, payment will be held in escrow and released to you upon project completion or milestone approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmationStep = ({ onGoBack }) => (
  <div className="text-center py-12 space-y-6">
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
      className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto shadow-xl shadow-pink-500/30"
    >
      <IoCheckmarkCircle className="text-4xl text-white" />
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="space-y-3"
    >
      <h2 className="text-2xl font-bold text-white">Offer Sent Successfully!</h2>
      <p className="text-white/50 max-w-sm mx-auto text-sm leading-relaxed">
        Your offer has been submitted. The buyer will review proposals and reach out if they&apos;re interested.
      </p>
    </motion.div>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center"
    >
      {[
        { label: "Submitted", active: true },
        { label: "Under Review", active: false },
        { label: "Decision", active: false },
      ].map(({ label, active }) => (
        <div
          key={label}
          className={`p-3 rounded-xl border text-xs ${
            active
              ? "bg-pink-500/10 border-pink-500/30 text-pink-400"
              : "bg-white/5 border-white/10 text-white/40"
          }`}
        >
          {label}
        </div>
      ))}
    </motion.div>
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      type="button"
      onClick={onGoBack}
      className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/5 transition-all mx-auto"
    >
      <IoArrowBack />
      View All Requests
    </motion.button>
  </div>
);

const ExistingBidView = ({ bid, onWithdraw, deleting }) => (
  <div className="bg-[#13131a] border border-white/10 rounded-2xl p-5 space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-base font-bold text-white">Your Submitted Offer</h3>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${BID_STATUS_COLORS[bid.status] ?? "bg-white/10 text-white/60"}`}>
        {bid.status}
      </span>
    </div>
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FaDollarSign className="text-emerald-500" />
        <span className="text-lg font-bold text-emerald-400">${bid.bid_amount}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-white/60">
        <IoCalendarOutline />
        <span>{bid.delivery_time_days} day{bid.delivery_time_days !== 1 ? "s" : ""} delivery</span>
      </div>
      {bid.proposal && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-xs text-white/50 leading-relaxed line-clamp-4">{bid.proposal}</p>
        </div>
      )}
    </div>
    {bid.status === "PENDING" && (
      <button
        type="button"
        onClick={onWithdraw}
        disabled={deleting}
        className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
      >
        <IoTrash className="text-sm" />
        {deleting ? "Withdrawing..." : "Withdraw Offer"}
      </button>
    )}
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function BidRequestDetail() {
  const { id: requestId } = useParams();
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const token = cookies.access_token;

  // Data
  const [request, setRequest] = useState(null);
  const [myBid, setMyBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [offerData, setOfferData] = useState({
    title: "",
    offerType: "fixed",
    summary: "",
    amount: "",
    currency: "USD",
    depositRequired: false,
    taxesIncluded: false,
    paymentSchedule: "",
    financingAvailable: false,
    startDate: "",
    duration: "",
    deliveryDays: "",
    availability: "immediate",
    expirationDate: "",
    rushFee: false,
    scope: "",
    inclusions: "",
    exclusions: "",
    assumptions: "",
  });

  const [milestones, setMilestones] = useState([]);
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    if (!token) { navigate("/signin"); return; }
    setLoading(true);
    Promise.all([
      getOpenRequestDetail(token, requestId),
      getMySubmittedBids(token),
    ])
      .then(([reqRes, bidsRes]) => {
        setRequest(reqRes.data);
        const myBids = bidsRes.data?.results ?? bidsRes.data ?? [];
        const found = Array.isArray(myBids)
          ? myBids.find((b) => String(b.request) === String(requestId) || String(b.request_id) === String(requestId))
          : null;
        setMyBid(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, requestId, navigate]);

  const updateOfferData = useCallback((field, value) => {
    setOfferData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const addMilestone = useCallback(() => {
    setMilestones((prev) => [
      ...prev,
      { id: Date.now().toString(), title: "", amount: "", description: "", dueTiming: "" },
    ]);
  }, []);

  const updateMilestone = useCallback((id, field, value) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  }, []);

  const removeMilestone = useCallback((id) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleSendOffer = async () => {
    if (!offerData.amount) {
      toast.error("Please fill in your bid amount in the Price & Payment step.");
      setCurrentStep(2);
      return;
    }
    if (!offerData.deliveryDays) {
      toast.error("Please fill in the delivery days in the Timeline step.");
      setCurrentStep(3);
      return;
    }

    const proposalParts = [
      offerData.title,
      offerData.summary && `\n${offerData.summary}`,
      offerData.scope && `\n\nScope of Work:\n${offerData.scope}`,
      offerData.inclusions && `\n\nIncluded:\n${offerData.inclusions}`,
      offerData.exclusions && `\n\nExcluded:\n${offerData.exclusions}`,
      offerData.assumptions && `\n\nAssumptions:\n${offerData.assumptions}`,
      milestones.some((m) => m.title) &&
        `\n\nMilestones:\n${milestones
          .filter((m) => m.title)
          .map((m, i) => `${i + 1}. ${m.title}${m.amount ? ` ($${m.amount})` : ""}`)
          .join("\n")}`,
    ].filter(Boolean);
    const proposal = proposalParts.join("").trim() || "Offer submitted via PinkSurfing Marketplace";

    try {
      setSubmitting(true);
      await createBidOffer(
        token,
        {
          request_id: requestId,
          bid_amount: offerData.amount,
          delivery_time_days: offerData.deliveryDays,
          proposal,
        },
        attachments.slice(0, 4)
      );
      setIsConfirmed(true);
      toast.success("Offer sent successfully!");
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? "Failed to send offer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBid = async () => {
    if (!myBid) return;
    if (!confirm("Withdraw your offer? This cannot be undone.")) return;
    try {
      setDeleting(true);
      await withdrawBidOffer(token, myBid.id);
      toast.success("Offer withdrawn.");
      setMyBid(null);
    } catch {
      toast.error("Failed to withdraw offer.");
    } finally {
      setDeleting(false);
    }
  };

  const handleNext = () => {
    if (currentStep === STEPS.length - 1) { handleSendOffer(); return; }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <IoAlertCircle className="text-5xl text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-4">Request not found.</p>
          <Link to="/bids/marketplace">
            <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
              Back to Marketplace
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Confirmed ──
  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <ConfirmationStep onGoBack={() => navigate("/bids/marketplace")} />
        </div>
      </div>
    );
  }

  // ── Existing bid ──
  if (myBid) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Link
            to="/bids/marketplace"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-pink-400 transition-colors"
          >
            <IoArrowBack />
            Back to Marketplace
          </Link>

          <div className="bg-[#13131a] border border-white/10 rounded-2xl p-5 space-y-3">
            {request.category_name && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full">
                <FaTag className="text-[9px]" />
                {request.category_name}
              </span>
            )}
            <h1 className="text-xl font-bold text-white">{request.title}</h1>
            <p className="text-sm text-white/60">{request.description}</p>
          </div>

          <ExistingBidView bid={myBid} onWithdraw={handleDeleteBid} deleting={deleting} />

          {request.bids?.length > 0 && (
            <div className="bg-[#13131a] border border-white/10 rounded-2xl p-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">
                All Bids ({request.bids.length})
              </p>
              {request.bids.map((bid) => (
                <div
                  key={bid.id}
                  className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl text-sm"
                >
                  <span className="text-white/70 truncate">{bid.vendor_store_name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-semibold text-emerald-400">${bid.bid_amount}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BID_STATUS_COLORS[bid.status] ?? "bg-white/10 text-white/60"}`}>
                      {bid.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Step renderer ──
  const renderStep = () => {
    switch (currentStep) {
      case 0: return <JobOverviewStep request={request} onContinue={handleNext} />;
      case 1: return <OfferBasicsStep data={offerData} onChange={updateOfferData} />;
      case 2: return <PricePaymentStep data={offerData} onChange={updateOfferData} />;
      case 3: return <TimelineStep data={offerData} onChange={updateOfferData} />;
      case 4: return <ScopeStep data={offerData} onChange={updateOfferData} />;
      case 5:
        return (
          <MilestonesStep
            milestones={milestones}
            onAdd={addMilestone}
            onChange={updateMilestone}
            onRemove={removeMilestone}
            totalPrice={offerData.amount}
          />
        );
      case 6:
        return (
          <AttachmentsStep
            attachments={attachments}
            onAdd={(files) => setAttachments((prev) => [...prev, ...files].slice(0, 4))}
            onRemove={(i) => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
          />
        );
      case 7:
        return (
          <ReviewStep
            offerData={offerData}
            milestones={milestones}
            onEdit={(step) => setCurrentStep(step)}
          />
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-28">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back link */}
        <Link
          to="/bids/marketplace"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-pink-400 transition-colors mb-6"
        >
          <IoArrowBack />
          Back to Marketplace
        </Link>

        {/* Progress bar */}
        <div className="mb-6">
          <StepProgressBar currentStep={currentStep} />
        </div>

        {/* Layout */}
        <div className="flex gap-8">
          {/* Job sidebar — desktop only, steps 1+ */}
          {currentStep > 0 && (
            <div className="hidden lg:block w-72 flex-shrink-0">
              <JobSidebar request={request} />
            </div>
          )}

          {/* Main step content */}
          <div className="flex-1 max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Sticky footer — steps 1–7 */}
      {currentStep > 0 && (
        <StickyFooter
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          isLastStep={currentStep === STEPS.length - 1}
          isLoading={submitting}
        />
      )}
    </div>
  );
}
