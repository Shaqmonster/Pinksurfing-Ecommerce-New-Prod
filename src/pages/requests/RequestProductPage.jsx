import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { IoCloseCircle, IoImageOutline } from "react-icons/io5";
import { createBuyerRequest, getCategories } from "../../api/buyerRequests";
import { useAccessToken } from "../../hooks/useAccessToken";

const CONDITIONS = [
  { value: "any", label: "Any" },
  { value: "new", label: "New" },
  { value: "used", label: "Used is fine" },
];

const MAX_PHOTOS = 4;

const field =
  "w-full rounded-xl bg-[#13131a] border border-white/10 px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-pink-500/50";
const label = "block text-sm font-medium text-white mb-1.5";

function apiErrorText(err) {
  const data = err?.response?.data;
  if (!data) return "Could not post your request. Please try again.";
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  return Object.entries(data)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
    .join(" · ");
}

/**
 * Bids: a buyer asks for a product the marketplace doesn't have (e.g. a PS5 Pro). Vendors see it
 * in their Buyer Requests page and send offers; the buyer accepts one from My Bids and it goes to
 * the cart. (Freelance work is a different feature: GigHub jobs at /gigs/jobs.)
 */
export default function RequestProductPage() {
  const accessToken = useAccessToken();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState({
    title: searchParams.get("q") || "",
    category: "",
    description: "",
    budget: "",
    quantity: "1",
    condition: "any",
    shipToZip: "",
  });

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(Array.isArray(res.data?.categories) ? res.data.categories : []))
      .catch(() => setCategories([]));
  }, []);

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const addPhotos = (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith("image/"));
    setPhotos((prev) => [...prev, ...files].slice(0, MAX_PHOTOS));
    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accessToken) {
      toast.info("Sign in to request a product.");
      navigate("/signin");
      return;
    }
    const title = form.title.trim();
    const budget = Number(form.budget);
    const quantity = Math.max(1, parseInt(form.quantity, 10) || 1);
    if (!title) return toast.error("Tell vendors what you're looking for.");
    if (!Number.isFinite(budget) || budget <= 0) return toast.error("Enter your budget per item.");

    try {
      setSubmitting(true);
      await createBuyerRequest(accessToken, {
        requestType: "product",
        title: title.slice(0, 255),
        description: form.description.trim() || title,
        budget: budget.toFixed(2),
        category: form.category || undefined,
        quantity,
        condition: form.condition,
        shipToZip: form.shipToZip.trim(),
        images: photos,
      });
      toast.success("Request posted! Vendors can now send you offers.");
      navigate("/my-bids");
    } catch (err) {
      toast.error(apiErrorText(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Request a product</h1>
        <p className="text-white/50 text-sm mt-2">
          Can&apos;t find it in the Shopping Mall? Tell vendors what you want. They send offers with a
          price, shipping and delivery time, and you pick one. Accepted offers go straight to your cart.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="rp-title" className={label}>
              What are you looking for?
            </label>
            <input
              id="rp-title"
              className={field}
              value={form.title}
              onChange={set("title")}
              maxLength={255}
              placeholder="e.g. PS5 Pro, 2TB, disc edition"
              required
            />
          </div>

          <div>
            <label htmlFor="rp-category" className={label}>
              Category <span className="text-white/40 font-normal">(optional)</span>
            </label>
            <select id="rp-category" className={field} value={form.category} onChange={set("category")}>
              <option value="">Choose a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rp-desc" className={label}>
              Details <span className="text-white/40 font-normal">(optional)</span>
            </label>
            <textarea
              id="rp-desc"
              className={`${field} min-h-[110px]`}
              value={form.description}
              onChange={set("description")}
              placeholder="Model, colour, size, bundle, anything that matters to you"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="rp-budget" className={label}>
                Budget per item ($)
              </label>
              <input
                id="rp-budget"
                className={field}
                type="number"
                min="1"
                step="0.01"
                inputMode="decimal"
                value={form.budget}
                onChange={set("budget")}
                placeholder="700"
                required
              />
            </div>
            <div>
              <label htmlFor="rp-qty" className={label}>
                Quantity
              </label>
              <input
                id="rp-qty"
                className={field}
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                value={form.quantity}
                onChange={set("quantity")}
              />
            </div>
            <div>
              <label htmlFor="rp-condition" className={label}>
                Condition
              </label>
              <select id="rp-condition" className={field} value={form.condition} onChange={set("condition")}>
                {CONDITIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="rp-zip" className={label}>
              Ship to ZIP code <span className="text-white/40 font-normal">(optional, helps vendors quote shipping)</span>
            </label>
            <input
              id="rp-zip"
              className={field}
              value={form.shipToZip}
              onChange={set("shipToZip")}
              maxLength={20}
              autoComplete="postal-code"
            />
          </div>

          <div>
            <span className={label}>
              Photos <span className="text-white/40 font-normal">(optional, up to {MAX_PHOTOS})</span>
            </span>
            <div className="flex flex-wrap gap-3">
              {previews.map((src, i) => (
                <div key={src} className="relative w-20 h-20">
                  <img src={src} alt="" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute -top-2 -right-2 text-white/80 hover:text-white"
                    aria-label={`Remove photo ${i + 1}`}
                  >
                    <IoCloseCircle className="text-2xl" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <label className="w-20 h-20 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-white/40 hover:text-white/70 hover:border-pink-500/40 cursor-pointer">
                  <IoImageOutline className="text-xl" />
                  <span className="text-[10px] mt-1">Add</span>
                  <input type="file" accept="image/*" multiple className="sr-only" onChange={addPhotos} />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-sm disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post request — free"}
          </button>
          <p className="text-center text-xs text-white/40">
            Track offers in{" "}
            <Link to="/my-bids" className="underline hover:text-white/70">
              My Bids
            </Link>
            . Need a service instead?{" "}
            <Link to="/gigs/jobs/post" className="underline hover:text-white/70">
              Post a job in GigHub
            </Link>
            .
          </p>
        </form>
      </div>
    </div>
  );
}
