import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import {
  createGig,
  addGigPackage,
  addGigMedia,
  getGigCategories,
  getGigSubcategories,
} from "../../api/gigs";
import {
  IoImageOutline,
  IoCloseCircle,
  IoCheckmarkCircle,
  IoAddCircleOutline,
  IoTrashOutline,
} from "react-icons/io5";
import { FaBriefcase, FaPlus } from "react-icons/fa";

const TIERS = ["basic", "standard", "premium"];
const TIER_LABELS = { basic: "Basic", standard: "Standard", premium: "Premium" };

const emptyPkg = (tier) => ({
  tier,
  title: "",
  description: "",
  price: "",
  delivery_days: "",
  revisions: 1,
  enabled: tier === "basic",
});

const STEPS = ["Details", "Packages", "Media & Publish"];

const CreateGigPage = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdGigId, setCreatedGigId] = useState(null);

  // Step 1 — Details
  const [details, setDetails] = useState({
    id: null,
    title: "",
    description: "",
    category: "",
    subcategory: "",
    status: "active",
  });

  // Step 2 — Packages
  const [packages, setPackages] = useState(
    TIERS.map((t) => emptyPkg(t))
  );

  // Step 3 — Media
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  useEffect(() => {
    // if (!cookies.access_token) {
    //   toast.error("Please sign in to create a gig.");
    //   navigate("/signin");
    //   return;
    // }
    getGigCategories()
      .then((res) => setCategories(res.data.results))
      .catch(() => {});
  }, []);

  useEffect(()=> {
    console.log("categories:", categories, subcategories);
  }, [categories, subcategories]);
  useEffect(() => {
    if (details.category) {
      getGigSubcategories(details.category)
        .then((res) => setSubcategories(res.data.results))
        .catch(() => setSubcategories([]));
    } else {
      setSubcategories([]);
    }
  }, [details.category]);

  const handleDetailChange = (e) =>
    setDetails((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const updatePkg = (tier, field, value) => {
    setPackages((prev) =>
      prev.map((p) => (p.tier === tier ? { ...p, [field]: value } : p))
    );
  };

  const togglePkg = (tier) => {
    setPackages((prev) =>
      prev.map((p) => (p.tier === tier ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const handleMediaAdd = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 6 - mediaFiles.length;
    if (!remaining) return;
    const toAdd = files.slice(0, remaining);
    setMediaFiles((prev) => [...prev, ...toAdd]);
    setMediaPreviews((prev) => [...prev, ...toAdd.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  };

  const removeMedia = (idx) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== idx));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // Step 1 → Step 2 — create the gig
  const handleDetailsNext = async () => {
    if (!details.title.trim() || !details.description.trim()) {
      toast.error("Title and description are required.");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        title: details.title.trim(),
        description: details.description.trim(),
        status: details.status,
      };
      if (details.category) payload.category = Number(details.category);
      if (details.subcategory) payload.subcategory = Number(details.subcategory);

      const res = await createGig(cookies.access_token, payload);
      setCreatedGigId(res.data.id);
      setStep(1);
    } catch (err) {
      const errData = err?.response?.data;
      const msg =
        errData?.detail ||
        (typeof errData === "object" ? Object.values(errData).flat().join(" ") : null) ||
        "Failed to save gig details.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2 → Step 3 — add packages
  const handlePackagesNext = async () => {
    const activePkgs = packages.filter((p) => p.enabled);
    if (activePkgs.length === 0) {
      toast.error("Please enable and configure at least one package.");
      return;
    }
    for (const p of activePkgs) {
      if (!p.price || !p.delivery_days) {
        toast.error(`Please complete all fields for the ${TIER_LABELS[p.tier]} package.`);
        return;
      }
    }
    try {
      setSubmitting(true);
      for (const p of activePkgs) {
        await addGigPackage(cookies.access_token, createdGigId, {
          tier: p.tier,
          title: p.title || undefined,
          description: p.description,
          price: p.price,
          delivery_days: Number(p.delivery_days),
          revisions: Number(p.revisions),
        });
      }
      setStep(2);
    } catch (err) {
      const errData = err?.response?.data;
      const msg =
        errData?.detail ||
        (typeof errData === "object" ? Object.values(errData).flat().join(" ") : null) ||
        "Failed to save packages.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3 — upload media and finish
  const handlePublish = async () => {
    try {
      setSubmitting(true);
      for (let i = 0; i < mediaFiles.length; i++) {
        await addGigMedia(cookies.access_token, createdGigId, mediaFiles[i], i === 0);
      }
      toast.success("Gig published successfully!");
      navigate(`/gigs/${createdGigId}`);
    } catch (err) {
      // Media upload failure is non-fatal; gig is already created
      toast.warning("Gig created, but some media failed to upload.");
      navigate(`/gigs/${createdGigId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const TIER_COLORS = {
    basic: { border: "border-blue-500/30", badge: "text-blue-400 bg-blue-500/10" },
    standard: { border: "border-purple-500/30", badge: "text-purple-400 bg-purple-500/10" },
    premium: { border: "border-yellow-500/30", badge: "text-yellow-400 bg-yellow-500/10" },
  };

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden py-8 px-4">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4">
            <FaBriefcase className="text-pink-400 text-sm" />
            <span className="text-white/60 text-sm font-medium">Create a Gig</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Post Your Service</h1>
          <p className="text-white/50 text-sm">Complete the steps below to publish your gig.</p>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                    i < step
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 border-transparent text-white"
                      : i === step
                      ? "border-purple-500 text-white bg-purple-500/20"
                      : "border-white/10 text-white/30"
                  }`}
                >
                  {i < step ? <IoCheckmarkCircle className="text-base" /> : i + 1}
                </div>
                <span
                  className={`text-xs mt-1 whitespace-nowrap ${
                    i === step ? "text-white/80" : "text-white/30"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-16 sm:w-24 mx-2 mb-5 transition-all ${
                    i < step ? "bg-purple-500/60" : "bg-white/10"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className="bg-[#13131a] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-5"
              >
                <h2 className="text-white font-bold text-lg">Gig Details</h2>

                <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">Title <span className="text-pink-400">*</span></label>
            <input
              name="title"
              value={details.title}
              onChange={handleDetailChange}
              placeholder="I will design your professional logo"
              maxLength={255}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all"
            />
                </div>

                <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">Description <span className="text-pink-400">*</span></label>
            <textarea
              name="description"
              value={details.description}
              onChange={handleDetailChange}
              placeholder="Describe your service in detail — what you offer, your process, what buyers can expect…"
              rows={5}
              className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all resize-none"
            />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-white/70 text-sm font-medium">Category</label>
              <select
                name="category"
                value={details.category}
                onChange={(e) => setDetails((prev) => ({ ...prev, category: e.target.selectedOptions[0]?.id || e.target.value }))}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm outline-none focus:border-pink-400 transition-all [&>option]:bg-[#1a1a24]"
              >
                <option value="">Select category…</option>
                {categories.length > 0  && categories.map((c) => (
                  <option key={c.id} id={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-white/70 text-sm font-medium">Subcategory</label>
              <select
                name="subcategory"
                value={details.subcategory}
                onChange={(e) => setDetails((prev) => ({ ...prev, subcategory: e.target.selectedOptions[0]?.id || e.target.value }))}
                disabled={!details.category || subcategories.length === 0}
                className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm outline-none focus:border-pink-400 transition-all [&>option]:bg-[#1a1a24] disabled:opacity-40"
              >
                <option value="">Select subcategory…</option>
                {subcategories.length > 0 && subcategories.map((s) => (
                  <option key={s.id} id={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
                </div>

                <div className="space-y-1.5">
            <label className="text-white/70 text-sm font-medium">Status</label>
            <div className="flex gap-3">
              {["active", "draft"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDetails((prev) => ({ ...prev, status: s }))}
                  className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-all ${
              details.status === s
                ? "bg-gradient-to-r from-purple-600 to-pink-500 border-transparent text-white"
                : "bg-transparent border-white/10 text-white/50 hover:border-white/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-white/30 text-xs">
              {details.status === "active"
                ? "Your gig will be visible to buyers immediately."
                : "Your gig will be saved as a draft and not visible to buyers."}
            </p>
                </div>

                <motion.button
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: submitting ? 1 : 0.98 }}
            onClick={handleDetailsNext}
            disabled={submitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-base shadow-lg hover:shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
            {submitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
            ) : (
              "Continue to Packages →"
            )}
                </motion.button>
              </motion.div>
            )}

            {/* ── STEP 1: Packages ── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-[#13131a] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <div>
                <h2 className="text-white font-bold text-lg">Pricing Packages</h2>
                <p className="text-white/40 text-sm mt-1">
                  Enable and configure one or more packages. Basic is required.
                </p>
              </div>

              {packages.map((pkg) => {
                const colors = TIER_COLORS[pkg.tier];
                return (
                  <div
                    key={pkg.tier}
                    className={`border rounded-2xl p-4 transition-all ${
                      pkg.enabled ? colors.border + " bg-white/2" : "border-white/5 opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${colors.badge} ${colors.border}`}>
                        {TIER_LABELS[pkg.tier]}
                      </span>
                      {pkg.tier !== "basic" && (
                        <button
                          type="button"
                          onClick={() => togglePkg(pkg.tier)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                            pkg.enabled
                              ? "bg-red-500/10 border-red-500/30 text-red-400"
                              : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                          }`}
                        >
                          {pkg.enabled ? "Remove" : "+ Add"}
                        </button>
                      )}
                    </div>

                    {pkg.enabled && (
                      <div className="space-y-3">
                        <input
                          value={pkg.title}
                          onChange={(e) => updatePkg(pkg.tier, "title", e.target.value)}
                          placeholder={`${TIER_LABELS[pkg.tier]} package title (optional)`}
                          className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm outline-none focus:border-purple-400 transition-all"
                        />
                        <textarea
                          value={pkg.description}
                          onChange={(e) => updatePkg(pkg.tier, "description", e.target.value)}
                          placeholder="Describe what's included in this package…"
                          rows={2}
                          className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm outline-none focus:border-purple-400 transition-all resize-none"
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-white/40 text-xs">Price ($) *</label>
                            <input
                              type="number"
                              min="1"
                              step="0.01"
                              value={pkg.price}
                              onChange={(e) => updatePkg(pkg.tier, "price", e.target.value)}
                              placeholder="0.00"
                              className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm outline-none focus:border-purple-400 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-white/40 text-xs">Delivery (days) *</label>
                            <input
                              type="number"
                              min="1"
                              value={pkg.delivery_days}
                              onChange={(e) => updatePkg(pkg.tier, "delivery_days", e.target.value)}
                              placeholder="3"
                              className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm outline-none focus:border-purple-400 transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-white/40 text-xs">Revisions</label>
                            <input
                              type="number"
                              min="0"
                              value={pkg.revisions}
                              onChange={(e) => updatePkg(pkg.tier, "revisions", e.target.value)}
                              className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/30 text-sm outline-none focus:border-purple-400 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:border-white/20 transition-all"
                >
                  ← Back
                </button>
                <motion.button
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  onClick={handlePackagesNext}
                  disabled={submitting}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm shadow-lg hover:shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : (
                    "Continue to Media →"
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Media & Publish ── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="bg-[#13131a] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              <div>
                <h2 className="text-white font-bold text-lg">Gig Media</h2>
                <p className="text-white/40 text-sm mt-1">
                  Add up to 6 images or videos. The first image is used as the thumbnail.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2, 3, 4, 5].map((slot) => {
                  const src = mediaPreviews[slot];
                  return src ? (
                    <motion.div
                      key={slot}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative aspect-video rounded-xl overflow-hidden border border-white/10 group"
                    >
                      {mediaFiles[slot]?.type?.startsWith("video") ? (
                        <video src={src} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={src} alt="" className="w-full h-full object-cover" />
                      )}
                      {slot === 0 && (
                        <span className="absolute top-1 left-1 bg-purple-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                          MAIN
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeMedia(slot)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <IoCloseCircle className="text-red-400 text-xl" />
                      </button>
                    </motion.div>
                  ) : (
                    <label
                      key={slot}
                      className="aspect-video rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-pink-400 hover:bg-white/5 transition-all"
                    >
                      <IoImageOutline className="text-xl text-white/20" />
                      <span className="text-white/20 text-xs">Add</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        className="hidden"
                        onChange={handleMediaAdd}
                      />
                    </label>
                  );
                })}
              </div>

              <div className="bg-[#1a1a24] border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <IoCheckmarkCircle className="text-green-400 text-base" />
                  <p className="text-white font-semibold text-sm">Gig is ready to publish!</p>
                </div>
                <p className="text-white/40 text-xs">
                  Your gig has been created with all package details. Adding media is optional but strongly recommended.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:border-white/20 transition-all"
                >
                  ← Back
                </button>
                <motion.button
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                  onClick={handlePublish}
                  disabled={submitting}
                  className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-semibold text-sm shadow-lg hover:shadow-green-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Publishing…</>
                  ) : (
                    <>
                      <IoCheckmarkCircle className="text-base" />
                      Publish Gig
                    </>
                  )}
                </motion.button>
              </div>

              <button
                onClick={() => navigate(`/gigs/${createdGigId}`)}
                className="w-full text-center text-white/30 text-xs hover:text-white/50 transition-colors"
              >
                Skip media and view gig →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateGigPage;
