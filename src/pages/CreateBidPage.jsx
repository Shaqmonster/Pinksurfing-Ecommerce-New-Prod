import React, { useState, useContext, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  IoCamera,
  IoDocumentText,
  IoHelpCircle,
  IoArrowForward,
  IoShieldCheckmark,
  IoClose,
  IoCloudUpload,
  IoAlertCircle,
  IoCheckmarkCircle,
  IoArrowBack,
  IoLockClosed,
  IoSparkles,
  IoRefresh,
  IoMapOutline,
  IoCalendarOutline,
  IoImageOutline,
} from "react-icons/io5";
import {
  FaHome,
  FaTint,
  FaBolt,
  FaPaintBrush,
  FaShieldAlt,
  FaTree,
  FaTools,
  FaHardHat,
  FaTruck,
  FaDesktop,
  FaHammer,
  FaDollarSign,
  FaCheck,
  FaEdit,
  FaSave,
  FaTag,
} from "react-icons/fa";
import { authContext } from "../context/authContext";
import { createBuyerRequest, getCategories } from "../api/buyerRequests";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { label: "Get Started", shortLabel: "Start" },
  { label: "Photos", shortLabel: "Photos" },
  { label: "Category", shortLabel: "Category" },
  { label: "Location", shortLabel: "Location" },
  { label: "AI Scope", shortLabel: "Scope" },
  { label: "Budget", shortLabel: "Budget" },
  { label: "Review", shortLabel: "Review" },
];

const CATEGORIES = [
  { id: "renovation", label: "Renovation", Icon: FaHome },
  { id: "plumbing", label: "Plumbing", Icon: FaTint },
  { id: "electrical", label: "Electrical", Icon: FaBolt },
  { id: "painting", label: "Painting", Icon: FaPaintBrush },
  { id: "roofing", label: "Roofing", Icon: FaHammer },
  { id: "landscaping", label: "Landscaping", Icon: FaTree },
  { id: "general", label: "General Repair", Icon: FaTools },
  { id: "construction", label: "Construction", Icon: FaHardHat },
  { id: "moving", label: "Moving", Icon: FaTruck },
  { id: "technology", label: "Technology", Icon: FaDesktop },
];

const SUBCATEGORIES = {
  renovation: ["Kitchen", "Bathroom", "Basement", "Full Home", "Addition"],
  plumbing: ["Leak Repair", "Water Heater", "Clogged Drain", "Pipe Replacement", "Fixture Install"],
  electrical: ["Wiring", "Panel Upgrade", "Lighting", "Outlet Install", "Smart Home"],
  painting: ["Interior", "Exterior", "Cabinet", "Deck / Fence", "Commercial"],
  roofing: ["Leak Repair", "Full Replacement", "Gutter Install", "Inspection", "Flashing"],
  landscaping: ["Lawn Care", "Hardscape", "Tree Service", "Irrigation", "Design"],
  general: ["Drywall", "Flooring", "Door / Window", "Appliance", "Other"],
  construction: ["New Build", "Commercial", "Foundation", "Framing", "Demolition"],
  moving: ["Local Move", "Long Distance", "Packing", "Storage", "Junk Removal"],
  technology: ["Networking", "Security Cameras", "AV Setup", "Computer Repair", "Software"],
};

const BUDGET_OPTIONS = [
  { value: "under1k", label: "Under $1K", num: 500 },
  { value: "1k-5k", label: "$1K \u2013 $5K", num: 1000 },
  { value: "5k-15k", label: "$5K \u2013 $15K", num: 5000 },
  { value: "15k-50k", label: "$15K \u2013 $50K", num: 15000 },
  { value: "50k-100k", label: "$50K \u2013 $100K", num: 50000 },
  { value: "100k+", label: "$100K+", num: 100000 },
  { value: "unsure", label: "Not sure", num: 1 },
];

const TIMELINE_OPTIONS = [
  { value: "asap", label: "ASAP", days: 7 },
  { value: "2weeks", label: "Within 2 weeks", days: 14 },
  { value: "month", label: "This month", days: 30 },
  { value: "flexible", label: "Flexible", days: 60 },
  { value: "researching", label: "Just researching", days: null },
];

const BUDGET_LABELS = Object.fromEntries(BUDGET_OPTIONS.map((o) => [o.value, o.label]));
const TIMELINE_LABELS = Object.fromEntries(TIMELINE_OPTIONS.map((o) => [o.value, o.label]));

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
  <div className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/10 px-4 py-3">
    <div className="max-w-6xl mx-auto">
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
      <div className="hidden md:flex items-center gap-1">
        {STEPS.map((step, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={i} className="flex items-center flex-1">
              <div
                className={`flex items-center gap-2 text-xs font-medium px-2 py-1.5 rounded-md w-full ${
                  done ? "text-pink-400" : active ? "text-white" : "text-white/30"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
                    done
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                      : active
                      ? "border-2 border-pink-400 text-pink-400"
                      : "border border-white/20 text-white/30"
                  }`}
                >
                  {done ? <FaCheck className="text-[8px]" /> : i + 1}
                </div>
                <span className="hidden lg:inline truncate">{step.shortLabel}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-px flex-shrink-0 ${done ? "bg-pink-400/50" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const StickyFooter = ({ currentStep, onBack, onNext, onSaveDraft }) => (
  <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-t border-white/10 px-4 py-3">
    <div className="max-w-3xl mx-auto flex items-center justify-between">
      <div className="flex items-center gap-2">
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
        {onSaveDraft && (
          <button
            type="button"
            onClick={onSaveDraft}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 text-sm transition-colors"
          >
            <FaSave className="text-sm" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={onNext}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-semibold text-sm transition-all min-w-[120px] justify-center"
      >
        Continue
        <IoArrowForward />
      </button>
    </div>
  </div>
);

const RequestPreviewSidebar = ({ data }) => (
  <div className="sticky top-24">
    <div className="bg-[#13131a] border border-white/10 rounded-2xl p-5 space-y-4">
      <p className="text-xs font-mono text-pink-400 font-semibold tracking-wider uppercase">
        Request Preview
      </p>

      {data.category ? (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Category</p>
          <p className="text-white/80 text-sm">
            {data.category}
            {data.subcategory ? ` \u2192 ${data.subcategory}` : ""}
          </p>
        </div>
      ) : (
        <p className="text-xs text-white/25 italic">Fill in the form to see your request preview</p>
      )}

      {data.address && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Location</p>
          <p className="text-white/80 text-sm">{data.address}</p>
        </div>
      )}

      {data.scopeDraft && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Scope</p>
          <p className="text-white/60 text-xs line-clamp-4 whitespace-pre-line">{data.scopeDraft}</p>
        </div>
      )}

      {data.budgetRange && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Budget</p>
          <p className="text-green-400 text-sm font-semibold">{BUDGET_LABELS[data.budgetRange]}</p>
        </div>
      )}

      {data.timeline && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Timeline</p>
          <p className="text-white/80 text-sm">{TIMELINE_LABELS[data.timeline]}</p>
        </div>
      )}

      {data.photos.length > 0 && (
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">
            Photos ({data.photos.length})
          </p>
          <div className="flex gap-2 flex-wrap">
            {data.photos.slice(0, 3).map((photo, i) => (
              <img
                key={i}
                src={photo.preview}
                alt=""
                className="w-12 h-12 rounded-lg object-cover border border-white/10"
              />
            ))}
            {data.photos.length > 3 && (
              <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/40 text-xs">
                +{data.photos.length - 3}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-white/10">
        <div className="flex flex-wrap gap-1.5">
          {data.isUrgent && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
              🚨 Urgent
            </span>
          )}
          {data.verifiedOnly && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
              ✓ Verified Only
            </span>
          )}
          {data.lockScope && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/40 border border-white/10">
              🔒 Scope Locked
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// ─── Step Components ────────────────────────────────────────────────────────────

const StartStep = ({ onContinue, onStartWith }) => {
  const startOptions = [
    {
      id: "photos",
      Icon: IoCamera,
      title: "Start with photos",
      desc: "Upload images and we\u2019ll help define the scope",
    },
    {
      id: "describe",
      Icon: IoDocumentText,
      title: "Describe it instead",
      desc: "Write what you need done in your own words",
    },
    {
      id: "help",
      Icon: IoHelpCircle,
      title: "I\u2019m not sure \u2014 help me",
      desc: "Answer a few questions and we\u2019ll build the request",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          What do you need done?
        </h1>
        <p className="text-white/50">
          Create a job request and receive bids from qualified vendors.
        </p>
      </div>

      <div className="space-y-3">
        {startOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => { onStartWith(opt.id); onContinue(); }}
            className="w-full bg-[#13131a] border border-white/10 rounded-xl p-5 flex items-center gap-4 text-left hover:border-pink-500/50 hover:bg-white/5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-pink-500/20 transition-colors">
              <opt.Icon className="text-xl text-pink-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">{opt.title}</p>
              <p className="text-xs text-white/50 mt-0.5">{opt.desc}</p>
            </div>
            <IoArrowForward className="text-white/30 group-hover:text-pink-400 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>

      <div className="bg-[#13131a] border border-pink-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <IoShieldCheckmark className="text-xl text-pink-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Verified vendors only</p>
            <p className="text-xs text-white/50 mt-0.5">
              Vendors pay to bid so you don&apos;t get spam. Only serious, qualified professionals respond.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const PhotosStep = ({ data, onUpdate }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    const remaining = 10 - data.photos.length;
    if (!remaining) return;
    const toAdd = Array.from(files).slice(0, remaining);
    const newPhotos = toAdd.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    onUpdate("photos", [...data.photos, ...newPhotos]);
  };

  const removePhoto = (i) => {
    onUpdate("photos", data.photos.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Upload Photos</h2>
        <p className="text-sm text-white/50 mt-1">
          Photos help vendors give more accurate bids \u2014 upload 3\u201310
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? "border-pink-500 bg-pink-500/5"
            : "border-white/10 hover:border-pink-500/50 hover:bg-white/5"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <IoCloudUpload className="text-3xl text-white/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-white">Drag photos here or tap to upload</p>
        <p className="text-xs text-white/40 mt-1">JPG, PNG, HEIC up to 10MB each</p>
      </div>

      {/* Photo grid */}
      {data.photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {data.photos.map((photo, i) => (
            <div
              key={i}
              className="relative aspect-square rounded-lg bg-[#1a1a24] border border-white/10 overflow-hidden group"
            >
              <img src={photo.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IoClose className="text-white text-xs" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 text-[10px] text-white/40 font-mono">
                {i + 1}
              </span>
            </div>
          ))}
          {data.photos.length < 10 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-white/10 hover:border-pink-500/50 flex items-center justify-center transition-colors"
            >
              <IoCamera className="text-xl text-white/30" />
            </button>
          )}
        </div>
      )}

      {/* Toggles */}
      <div className="bg-[#13131a] border border-white/10 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IoAlertCircle className="text-yellow-400 text-lg flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Emergency / Urgent</p>
              <p className="text-xs text-white/40">Rush \u2014 need help ASAP</p>
            </div>
          </div>
          <Toggle checked={data.isUrgent} onChange={(v) => onUpdate("isUrgent", v)} />
        </div>
        <div className="border-t border-white/5" />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Need Permits?</p>
            <p className="text-xs text-white/40">Work may require local permits</p>
          </div>
          <Toggle checked={data.needsPermits} onChange={(v) => onUpdate("needsPermits", v)} />
        </div>
      </div>
    </div>
  );
};

const CategoryStep = ({ data, onUpdate }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">Category</h2>
      <p className="text-sm text-white/50 mt-1">What type of work do you need?</p>
    </div>

    {/* Category grid */}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => { onUpdate("category", cat.id); onUpdate("subcategory", ""); }}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200 ${
            data.category === cat.id
              ? "bg-[#13131a] border border-pink-500/50 shadow-lg shadow-pink-500/10"
              : "bg-[#13131a] border border-white/10 hover:border-pink-500/30 hover:bg-white/5"
          }`}
        >
          <cat.Icon
            className={`text-lg ${data.category === cat.id ? "text-pink-400" : "text-white/40"}`}
          />
          <span
            className={`text-xs font-medium text-center ${
              data.category === cat.id ? "text-white" : "text-white/40"
            }`}
          >
            {cat.label}
          </span>
        </button>
      ))}
    </div>

    {/* Subcategory chips */}
    {data.category && SUBCATEGORIES[data.category] && (
      <div className="space-y-3">
        <p className="text-sm font-medium text-white">What specifically?</p>
        <div className="flex flex-wrap gap-2">
          {SUBCATEGORIES[data.category].map((sub) => (
            <button
              key={sub}
              onClick={() => onUpdate("subcategory", sub)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                data.subcategory === sub
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-pink-500/20"
                  : "bg-[#1a1a24] border border-white/10 text-white/50 hover:text-white hover:border-pink-500/30"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

const LocationStep = ({ data, onUpdate }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">Location &amp; Property</h2>
      <p className="text-sm text-white/50 mt-1">Where is the work needed?</p>
    </div>

    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/70">Address</label>
        <div className="relative">
          <IoMapOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-lg" />
          <input
            value={data.address}
            onChange={(e) => onUpdate("address", e.target.value)}
            placeholder="Start typing an address..."
            className="w-full bg-[#1a1a24] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Property Type</label>
          <select
            value={data.propertyType}
            onChange={(e) => onUpdate("propertyType", e.target.value)}
            className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all [color-scheme:dark]"
          >
            <option value="">Select</option>
            <option value="house">House</option>
            <option value="condo">Condo</option>
            <option value="apartment">Apartment</option>
            <option value="commercial">Commercial</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Ownership</label>
          <select
            value={data.ownership}
            onChange={(e) => onUpdate("ownership", e.target.value)}
            className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all [color-scheme:dark]"
          >
            <option value="">Select</option>
            <option value="owner">Owner</option>
            <option value="tenant">Tenant</option>
            <option value="agent">Agent / Manager</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/70">Access Restrictions</label>
        <textarea
          value={data.accessNotes}
          onChange={(e) => onUpdate("accessNotes", e.target.value)}
          placeholder="HOA rules, parking restrictions, access hours..."
          rows={3}
          className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all resize-none"
        />
      </div>
    </div>
  </div>
);

const ScopeAIStep = ({ data, onUpdate }) => {
  const [generating, setGenerating] = useState(false);
  const [realism, setRealism] = useState(50);
  const [tone, setTone] = useState("concise");

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      const mock = `${data.subcategory || data.category || "General"} project scope:\n\n\u2022 Full assessment and preparation of work area\n\u2022 Removal of existing materials as needed\n\u2022 Supply and installation of new materials per specifications\n\u2022 Clean-up and final inspection\n\u2022 1-year workmanship warranty included\n\nEstimated complexity: Medium\nLikely hidden costs: Permit fees, material upgrades, structural surprises behind walls.`;
      onUpdate("scopeDraft", mock);
      setGenerating(false);
    }, 1500);
  };

  const realismLabel = realism < 33 ? "Conservative" : realism < 66 ? "Normal" : "Aggressive";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">AI Scope Draft</h2>
        <p className="text-sm text-white/50 mt-1">
          AI generates a realistic scope from your inputs
        </p>
      </div>

      {/* Context preview */}
      <div className="bg-[#13131a] border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs font-mono text-pink-400 font-semibold tracking-wider">YOUR INPUTS</p>
        <div className="flex items-center gap-4 text-sm text-white/50 flex-wrap">
          {data.photos.length > 0 && (
            <span className="flex items-center gap-1.5">
              <IoCamera className="text-pink-400" />
              {data.photos.length} photo{data.photos.length !== 1 ? "s" : ""}
            </span>
          )}
          {data.category && (
            <span className="px-2 py-0.5 rounded-full bg-[#1a1a24] border border-white/10 text-xs text-white/60">
              {data.category}{data.subcategory ? ` \u2192 ${data.subcategory}` : ""}
            </span>
          )}
          {!data.photos.length && !data.category && (
            <span className="text-white/30 italic text-xs">Complete earlier steps to see context</span>
          )}
        </div>
      </div>

      {/* Generate controls */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {["concise", "detailed"].map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                tone === t
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                  : "bg-[#1a1a24] border border-white/10 text-white/50 hover:text-white"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Realism</span>
            <span className="text-xs font-mono text-white/40">{realismLabel}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={realism}
            onChange={(e) => setRealism(Number(e.target.value))}
            className="w-full h-1.5 rounded-full bg-white/10 appearance-none cursor-pointer accent-pink-500"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-pink-500/20 disabled:opacity-60 transition-all"
        >
          {generating ? <IoRefresh className="animate-spin" /> : <IoSparkles />}
          {generating ? "Generating..." : "Generate Scope with AI"}
        </button>
      </div>

      {/* Scope editor */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-white/70">Scope Draft</label>
        <textarea
          value={data.scopeDraft}
          onChange={(e) => onUpdate("scopeDraft", e.target.value)}
          placeholder="AI-generated scope will appear here, or write your own..."
          rows={8}
          className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all resize-none font-mono"
        />
      </div>

      {/* Warning */}
      {data.scopeDraft && (
        <div className="bg-[#13131a] border border-yellow-500/20 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <IoAlertCircle className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/50">
              AI can be wrong. Review before publishing. Vendors can still clarify in chat.
            </p>
          </div>
        </div>
      )}

      {/* Lock toggle */}
      <div className="bg-[#13131a] border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IoLockClosed className="text-pink-400" />
            <div>
              <p className="text-sm font-medium text-white">Lock Scope</p>
              <p className="text-xs text-white/40">
                Changes require a change order after publishing
              </p>
            </div>
          </div>
          <Toggle checked={data.lockScope} onChange={(v) => onUpdate("lockScope", v)} />
        </div>
      </div>
    </div>
  );
};

const BudgetStep = ({ data, onUpdate }) => (
  <div className="space-y-6">
    <div>
      <h2 className="text-xl font-bold text-white">Budget &amp; Preferences</h2>
      <p className="text-sm text-white/50 mt-1">Help vendors understand your expectations</p>
    </div>

    {/* Budget chips */}
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-white/70">
        <FaDollarSign className="text-pink-400" />
        Budget Range
      </div>
      <div className="flex flex-wrap gap-2">
        {BUDGET_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onUpdate("budgetRange", opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              data.budgetRange === opt.value
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-pink-500/20"
                : "bg-[#1a1a24] border border-white/10 text-white/50 hover:text-white hover:border-pink-500/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>

    {/* Timeline chips */}
    <div className="space-y-3">
      <div className="text-sm font-medium text-white/70">Timeline</div>
      <div className="flex flex-wrap gap-2">
        {TIMELINE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onUpdate("timeline", opt.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              data.timeline === opt.value
                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg shadow-pink-500/20"
                : "bg-[#1a1a24] border border-white/10 text-white/50 hover:text-white hover:border-pink-500/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>

    {/* Vendor preferences */}
    <div className="bg-[#13131a] border border-white/10 rounded-xl p-4 space-y-4">
      <p className="text-sm font-semibold text-white">Vendor Preferences</p>
      {[
        { field: "verifiedOnly", label: "Verified vendors only", desc: "Only verified businesses can bid" },
        { field: "licensedOnly", label: "Licensed required", desc: "Must hold valid trade license" },
        { field: "insuranceRequired", label: "Insurance required", desc: "Must carry liability insurance" },
        { field: "financingInterest", label: "Interested in financing", desc: "Open to payment plans" },
      ].map((pref, i) => (
        <React.Fragment key={pref.field}>
          {i > 0 && <div className="border-t border-white/5" />}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{pref.label}</p>
              <p className="text-xs text-white/40">{pref.desc}</p>
            </div>
            <Toggle
              checked={data[pref.field]}
              onChange={(v) => onUpdate(pref.field, v)}
            />
          </div>
        </React.Fragment>
      ))}
    </div>
  </div>
);

const RequestReviewStep = ({ data, onPublish, submitting, onEdit }) => {
  const sections = [
    {
      Icon: FaTag,
      title: "Category",
      step: 2,
      content: (
        <p className="text-sm text-white/50">
          {data.category || "Not set"}
          {data.subcategory ? ` \u2192 ${data.subcategory}` : ""}
        </p>
      ),
    },
    {
      Icon: IoMapOutline,
      title: "Location",
      step: 3,
      content: (
        <div className="text-sm text-white/50 space-y-0.5">
          <p>{data.address || "Not set"}</p>
          {data.propertyType && <p className="capitalize">{data.propertyType}</p>}
        </div>
      ),
    },
    {
      Icon: IoDocumentText,
      title: "Scope",
      step: 4,
      badge: data.scopeDraft ? "AI" : null,
      content: (
        <div className="text-sm text-white/50">
          {data.scopeDraft ? (
            <p className="line-clamp-4 whitespace-pre-line">{data.scopeDraft}</p>
          ) : (
            <p className="italic">No scope defined</p>
          )}
        </div>
      ),
    },
    {
      Icon: FaDollarSign,
      title: "Budget",
      step: 5,
      content: <p className="text-sm text-white/50">{BUDGET_LABELS[data.budgetRange] || "Not set"}</p>,
    },
    {
      Icon: IoCalendarOutline,
      title: "Timeline",
      step: 5,
      content: <p className="text-sm text-white/50">{TIMELINE_LABELS[data.timeline] || "Not set"}</p>,
    },
    {
      Icon: IoCamera,
      title: "Photos",
      step: 1,
      content: (
        <p className="text-sm text-white/50">
          {data.photos.length} photo{data.photos.length !== 1 ? "s" : ""} uploaded
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Review &amp; Publish</h2>
        <p className="text-sm text-white/50 mt-1">
          Confirm everything looks right before going live
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {data.isUrgent && (
          <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">
            🚨 Urgent
          </span>
        )}
        {data.verifiedOnly && (
          <span className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium flex items-center gap-1">
            <IoShieldCheckmark className="text-[10px]" /> Verified Only
          </span>
        )}
        {data.lockScope && (
          <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-white/40 text-xs font-medium">
            🔒 Scope Locked
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="space-y-3">
        {sections.map((section) => (
          <div
            key={section.title}
            className="bg-[#13131a] border border-white/10 rounded-xl p-4 group"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <section.Icon className="text-pink-400 text-sm" />
                <h4 className="text-sm font-semibold text-white">{section.title}</h4>
                {section.badge && (
                  <span className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400 text-[10px] font-mono font-semibold flex items-center gap-0.5">
                    <IoSparkles className="text-[8px]" />
                    {section.badge}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => onEdit(section.step)}
                className="text-xs text-pink-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <FaEdit className="text-[10px]" />
                Edit
              </button>
            </div>
            {section.content}
          </div>
        ))}
      </div>

      {/* Publish CTA */}
      <motion.button
        onClick={onPublish}
        disabled={submitting}
        whileHover={{ scale: submitting ? 1 : 1.02 }}
        whileTap={{ scale: submitting ? 1 : 0.98 }}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-base shadow-lg hover:shadow-pink-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Publishing...
          </>
        ) : (
          "Publish Request \u2014 Free"
        )}
      </motion.button>
      <p className="text-xs text-white/30 text-center">
        Expect bids in 2\u201324 hours. You can edit anytime before a vendor is awarded.
      </p>
    </div>
  );
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const CreateBidPage = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [apiCategories, setApiCategories] = useState([]);

  const [requestData, setRequestData] = useState({
    startMethod: "",
    photos: [],          // { file: File, preview: string }[]
    isUrgent: false,
    needsPermits: false,
    category: "",
    subcategory: "",
    address: "",
    propertyType: "",
    ownership: "",
    accessNotes: "",
    scopeDraft: "",
    lockScope: false,
    budgetRange: "",
    timeline: "",
    verifiedOnly: false,
    licensedOnly: false,
    insuranceRequired: false,
    financingInterest: false,
  });

  useEffect(() => {
    getCategories()
      .then((res) => {
        if (Array.isArray(res.data)) {
          setApiCategories(res.data);
        } else {
          console.error("[CreateBidPage:L997] getCategories response is not an array:", typeof res.data, res.data);
          setApiCategories([]);
        }
      })
      .catch((err) => {
        console.error("[CreateBidPage:L1002] getCategories failed:", err);
      });
  }, []);

  const updateField = useCallback((field, value) => {
    setRequestData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 6));
  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const handleSaveDraft = () => toast.info("Draft saved!");

  const handlePublish = async () => {
    if (!cookies.access_token) {
      toast.error("Please sign in to post a request.");
      navigate("/signin");
      return;
    }

    if (!Array.isArray(BUDGET_OPTIONS)) {
      console.error("[CreateBidPage:L1016] BUDGET_OPTIONS is not an array:", typeof BUDGET_OPTIONS, BUDGET_OPTIONS);
    }
    const budgetOpt = BUDGET_OPTIONS.find((o) => o.value === requestData.budgetRange);
    const budget = budgetOpt ? budgetOpt.num : 1;

    if (!Array.isArray(TIMELINE_OPTIONS)) {
      console.error("[CreateBidPage:L1022] TIMELINE_OPTIONS is not an array:", typeof TIMELINE_OPTIONS, TIMELINE_OPTIONS);
    }
    const timelineOpt = TIMELINE_OPTIONS.find((o) => o.value === requestData.timeline);
    const deadline = timelineOpt?.days
      ? new Date(Date.now() + timelineOpt.days * 86400000).toISOString().split("T")[0]
      : undefined;

    if (typeof requestData.scopeDraft !== "string") {
      console.error("[CreateBidPage:L1030] scopeDraft is not a string:", typeof requestData.scopeDraft, requestData.scopeDraft);
    }
    const scopeLines = (typeof requestData.scopeDraft === "string" ? requestData.scopeDraft : String(requestData.scopeDraft || "")).split("\n");
    if (!Array.isArray(scopeLines)) {
      console.error("[CreateBidPage:L1034] scopeLines is not an array:", typeof scopeLines, scopeLines);
    }
    const firstLine = scopeLines.find((l) => l.trim()) || "";
    const title = (firstLine.replace(/^[\u2022#\-*\s]+/, "").slice(0, 255) ||
      [requestData.category, requestData.subcategory].filter(Boolean).join(" - ") ||
      "Buyer Request").trim();

    const descParts = [
      requestData.scopeDraft,
      requestData.address && `\nLocation: ${requestData.address}`,
      requestData.propertyType && `Property Type: ${requestData.propertyType}`,
      requestData.accessNotes && `Access Notes: ${requestData.accessNotes}`,
      requestData.isUrgent && "\n\u26A1 URGENT Request",
      requestData.needsPermits && "Permits required",
      requestData.verifiedOnly && "Verified vendors only",
      requestData.licensedOnly && "Licensed vendors only",
      requestData.insuranceRequired && "Insurance required",
    ].filter(Boolean);
    const description = descParts.join("\n").trim() || title;

    if (!Array.isArray(apiCategories)) {
      console.error("[CreateBidPage:L1055] apiCategories is not an array:", typeof apiCategories, apiCategories);
    }
    const catMatch = Array.isArray(apiCategories)
      ? apiCategories.find(
          (c) => c.name?.toLowerCase() === requestData.category.toLowerCase()
        )
      : undefined;
    const category = catMatch?.id;

    const images = requestData.photos.slice(0, 4).map((p) => p.file);

    try {
      setSubmitting(true);
      await createBuyerRequest(cookies.access_token, {
        title,
        description,
        budget,
        deadline,
        category,
        images,
      });
      toast.success("Request published! Expect bids in 2\u201324 hours.");
      navigate("/my-bids");
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "Failed to publish. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PhotosStep data={requestData} onUpdate={updateField} />;
      case 2:
        return <CategoryStep data={requestData} onUpdate={updateField} />;
      case 3:
        return <LocationStep data={requestData} onUpdate={updateField} />;
      case 4:
        return <ScopeAIStep data={requestData} onUpdate={updateField} />;
      case 5:
        return <BudgetStep data={requestData} onUpdate={updateField} />;
      case 6:
        return (
          <RequestReviewStep
            data={requestData}
            onPublish={handlePublish}
            submitting={submitting}
            onEdit={(step) => setCurrentStep(step)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0a0a0f] min-h-screen">
      {/* Progress Bar — hidden on step 0 */}
      {currentStep > 0 && <StepProgressBar currentStep={currentStep} />}

      <div className="max-w-6xl mx-auto px-4 py-6 pb-28">
        {currentStep === 0 ? (
          /* ── Step 0: centered, no sidebar ── */
          <div className="max-w-lg mx-auto pt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key="start"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <StartStep
                  onContinue={handleNext}
                  onStartWith={(m) => updateField("startMethod", m)}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        ) : (
          /* ── Steps 1–6: sidebar + main ── */
          <div className="flex gap-8">
            {/* Sidebar visible on steps 1–5 */}
            {currentStep < 6 && (
              <div className="hidden lg:block w-72 flex-shrink-0">
                <RequestPreviewSidebar data={requestData} />
              </div>
            )}

            {/* Main form */}
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
        )}
      </div>

      {/* Sticky footer — only for steps 1–5 */}
      {currentStep > 0 && currentStep < 6 && (
        <StickyFooter
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          onSaveDraft={handleSaveDraft}
        />
      )}
    </div>
  );
};

export default CreateBidPage;
