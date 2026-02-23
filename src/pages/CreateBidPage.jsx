import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  IoCloseCircle,
  IoImageOutline,
  IoInformationCircleOutline,
  IoAddCircleOutline,
} from "react-icons/io5";
import { FaGavel, FaBullhorn, FaHandshake, FaTruck } from "react-icons/fa";
import { authContext } from "../context/authContext";
import { createBuyerRequest, getCategories } from "../api/buyerRequests";

const HOW_IT_WORKS = [
  {
    icon: <FaBullhorn className="text-lg text-pink-400" />,
    title: "Post Your Request",
    desc: "Describe what you need, set your budget and deadline.",
  },
  {
    icon: <FaGavel className="text-lg text-purple-400" />,
    title: "Receive Bids",
    desc: "Vendors submit competitive bids with price and delivery time.",
  },
  {
    icon: <FaHandshake className="text-lg text-pink-400" />,
    title: "Choose the Best Bid",
    desc: "Compare proposals and accept the one that fits your needs.",
  },
  {
    icon: <FaTruck className="text-lg text-purple-400" />,
    title: "Complete Your Order",
    desc: "Accepted bid is added to your cart for checkout.",
  },
];

const CreateBidPage = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { user } = useContext(authContext);

  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    budget: "",
    deadline: "",
    category: "",
  });

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    const remaining = 4 - images.length;
    if (!remaining) return;
    const toAdd = files.slice(0, remaining);
    setImages((prev) => [...prev, ...toAdd]);
    setImagePreviews((prev) => [
      ...prev,
      ...toAdd.map((f) => URL.createObjectURL(f)),
    ]);
    e.target.value = "";
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cookies.access_token) {
      toast.error("Please sign in to create a bid request.");
      navigate("/signin");
      return;
    }
    if (!form.title.trim() || !form.description.trim() || !form.budget) {
      toast.error("Please fill in Title, Description and Budget.");
      return;
    }
    try {
      setSubmitting(true);
      await createBuyerRequest(cookies.access_token, {
        title: form.title.trim(),
        description: form.description.trim(),
        budget: form.budget,
        deadline: form.deadline || undefined,
        category: form.category || undefined,
        images,
      });
      toast.success("Your bid request has been posted! Vendors will respond soon.");
      navigate("/my-bids");
    } catch (err) {
      toast.error(
        err?.response?.data?.detail || "Failed to post request. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-[#0a0a0f] min-h-screen relative overflow-hidden py-8 px-4">
      {/* Decorative orb — matches ProfilePage */}
      <svg
        width="601"
        height="1031"
        viewBox="0 0 601 1031"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute top-[5%] left-0 z-0 pointer-events-none hidden lg:block"
      >
        <g filter="url(#filter0_f_bid_create)">
          <circle cx="85.5" cy="515.5" r="207.5" fill="#8B33FE" fillOpacity="0.4" />
        </g>
        <defs>
          <filter
            id="filter0_f_bid_create"
            x="-430"
            y="0"
            width="1031"
            height="1031"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="154" result="effect1_foregroundBlur_bid_create" />
          </filter>
        </defs>
      </svg>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-4">
            <FaGavel className="text-pink-400 text-sm" />
            <span className="text-white/60 text-sm font-medium">Buyer Requests</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Create a Bid Request
          </h1>
          <p className="text-white/50 text-base max-w-xl mx-auto">
            Tell vendors exactly what you need. Get competitive bids and pick the
            best one — all within PinkSurfing&apos;s marketplace.
          </p>
        </motion.div>

        {/* Two-column layout: form (left) + guide (right) */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full lg:w-[58%]"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-[#13131a] border border-white/5 rounded-2xl shadow-xl shadow-purple-500/10 p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center gap-2">
                <IoInformationCircleOutline className="text-pink-400 text-xl" />
                <h2 className="text-white font-bold text-lg">Request Details</h2>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium">
                  Title <span className="text-pink-400">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Custom leather jacket, size M, brown"
                  maxLength={255}
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-white/70 text-sm font-medium">
                  Description <span className="text-pink-400">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe your requirement in detail — materials, dimensions, colour, quantity, any special notes…"
                  rows={5}
                  className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all resize-none"
                />
              </div>

              {/* Budget & Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-white/70 text-sm font-medium">
                    Budget (USD) <span className="text-pink-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                      $
                    </span>
                    <input
                      name="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.budget}
                      onChange={handleChange}
                      placeholder="0.00"
                      className="w-full bg-[#1a1a24] border border-white/10 rounded-xl pl-7 pr-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-white/70 text-sm font-medium">
                    Deadline{" "}
                    <span className="text-white/30 text-xs font-normal">(optional)</span>
                  </label>
                  <input
                    name="deadline"
                    type="date"
                    min={today}
                    value={form.deadline}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white/70 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Category */}
              {categories.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-white/70 text-sm font-medium">
                    Category{" "}
                    <span className="text-white/30 text-xs font-normal">(optional)</span>
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-3 text-white/80 text-sm outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all [&>option]:bg-[#1a1a24]"
                  >
                    <option value="">Select a category…</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Images — 4 fixed slots */}
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-medium">
                  Reference Images{" "}
                  <span className="text-white/30 text-xs font-normal">(up to 4, optional)</span>
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {[0, 1, 2, 3].map((slot) => {
                    const src = imagePreviews[slot];
                    return src ? (
                      <motion.div
                        key={slot}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group"
                      >
                        <img
                          src={src}
                          alt={`ref-${slot}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(slot)}
                          className="absolute top-1 right-1 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <IoCloseCircle className="text-red-400 text-xl" />
                        </button>
                      </motion.div>
                    ) : (
                      <label
                        key={slot}
                        className="aspect-square rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-pink-400 hover:bg-white/5 transition-all"
                      >
                        <IoImageOutline className="text-xl text-white/20" />
                        <span className="text-white/20 text-xs">Add</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageAdd}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.98 }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-base shadow-lg hover:shadow-pink-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Posting Request…
                  </>
                ) : (
                  <>
                    <IoAddCircleOutline className="text-xl" />
                    Post Bid Request
                  </>
                )}
              </motion.button>

              {!user && (
                <p className="text-center text-white/40 text-xs">
                  You need to be signed in to post a request.
                </p>
              )}
            </form>
          </motion.div>

          {/* ── How It Works — compact side panel ── */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="w-full lg:w-[42%] lg:sticky lg:top-8"
          >
            <div className="bg-[#13131a] border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/30 mb-4">
                How It Works
              </p>
              <div className="space-y-0">
                {HOW_IT_WORKS.map((step, i) => (
                  <React.Fragment key={i}>
                    <div className="flex items-start gap-3 py-3">
                      {/* Number pill */}
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">{i + 1}</span>
                      </div>
                      {/* Icon + text */}
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <span className="flex-shrink-0 mt-0.5">{step.icon}</span>
                        <div>
                          <p className="font-medium text-sm text-white/80 leading-snug">
                            {step.title}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                    {i < HOW_IT_WORKS.length - 1 && (
                      <div className="border-t border-white/5" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default CreateBidPage;
