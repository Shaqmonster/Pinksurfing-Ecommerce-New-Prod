import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { IoCloseOutline, IoStar, IoStarOutline } from "react-icons/io5";
import { FaStar } from "react-icons/fa";
import { useAccessToken } from "../hooks/useAccessToken";

import { notify } from "../lib/notify";
export default function RatingForm({ order }) {
  const accessToken = useAccessToken();
  const { isRatingFormOpen, setIsRatingFormOpen } = useContext(authContext);
  const [cookies] = useCookies(["access_token"]);
  const navigate = useNavigate();
  const [starRating, setStarRating] = useState(0);
  const [review, setReview] = useState({
    rating: 1,
    title: "",
    body: "",
    order_item: order.id,
  });

  const { title, body } = review;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setReview(prev => ({ ...prev, [name]: value }));
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!accessToken) {
      navigate("/signin");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/ratings/rate-order/${order.id}/`,
        review,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      notify.success("Thanks — your review is posted.");
      setIsRatingFormOpen(false);
    } catch (error) {
      if (error.response?.data?.error === "You have already reviewed this order") {
        try {
          await axios.put(
            `${import.meta.env.VITE_SERVER_URL}/api/ratings/rate-order/${order.id}/`,
            review,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );
          notify.success("Your review is updated.");
          setIsRatingFormOpen(false);
        } catch (fallbackError) {
          notify.error("Failed to update review");
        }
      } else {
        notify.error("We couldn’t post your review. Please try again.");
      }
    }
  };

  const STYLES = [
    { label: "Dreadful", color: "text-rose-500" },
    { label: "Mediocre", color: "text-orange-500" },
    { label: "So-so", color: "text-amber-500" },
    { label: "Decent", color: "text-yellow-500" },
    { label: "Impressive", color: "text-emerald-400" },
    { label: "Exceptional", color: "text-blue-400" },
    { label: "Phenomenal", color: "text-purple-400" },
  ];

  return (
    <Transition appear show={isRatingFormOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={() => setIsRatingFormOpen(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-ps-surface border border-ps-border p-6 sm:p-8 shadow-[var(--ps-shadow-3)] transition-all">
                <div className="flex justify-between items-center mb-8">
                  <Dialog.Title as="h3" className="text-xl font-semibold tracking-tight">
                    Rate this product
                  </Dialog.Title>
                  <button onClick={() => setIsRatingFormOpen(false)} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center text-ps-fg2 hover:bg-ps-hover hover:text-ink">
                    <IoCloseOutline className="text-2xl" />
                  </button>
                </div>

                <form onSubmit={handleReview} className="space-y-8">
                  <fieldset>
                    <legend className="text-sm font-medium text-ink mb-3">Your rating</legend>
                    <div
                      role="radiogroup"
                      aria-label="Rating"
                      className="flex justify-between items-center gap-1 rounded-2xl border border-ps-border bg-ps-sunken p-4"
                      onKeyDown={(e) => {
                        const next =
                          e.key === "ArrowRight" || e.key === "ArrowUp"
                            ? Math.min(STYLES.length, (starRating || 0) + 1)
                            : e.key === "ArrowLeft" || e.key === "ArrowDown"
                            ? Math.max(1, (starRating || 1) - 1)
                            : null;
                        if (next == null) return;
                        e.preventDefault();
                        setStarRating(next);
                        setReview((prev) => ({ ...prev, rating: next }));
                        e.currentTarget.querySelector(`[data-level="${next}"]`)?.focus();
                      }}
                    >
                      {STYLES.map((style, idx) => {
                        const level = idx + 1;
                        const isActive = starRating >= level;
                        const selected = starRating === level;
                        return (
                          <button
                            type="button"
                            key={idx}
                            role="radio"
                            aria-checked={selected}
                            aria-label={`${level} of ${STYLES.length}: ${style.label}`}
                            data-level={level}
                            tabIndex={selected || (!starRating && level === 1) ? 0 : -1}
                            onClick={() => {
                              setStarRating(level);
                              setReview((prev) => ({ ...prev, rating: level }));
                            }}
                            className="flex min-h-[44px] min-w-[36px] flex-col items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ps-focus"
                          >
                            <IoStar className={`text-2xl ${isActive ? "text-[var(--ps-gold)]" : "text-ps-border-strong"}`} aria-hidden />
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-sm text-ps-fg2 min-h-[20px]" aria-live="polite">
                      {starRating ? STYLES[starRating - 1].label : "Choose from 1 to 7 stars."}
                    </p>
                  </fieldset>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">Headline</label>
                      <input
                        className="w-full bg-ink/5 border border-ink/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-all text-ink placeholder-ps-meta"
                        name="title"
                        type="text"
                        placeholder="Summarize your experience..."
                        value={title}
                        onChange={handleOnChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink mb-2">Your review</label>
                      <textarea
                        className="w-full bg-ink/5 border border-ink/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-all text-ink placeholder-ps-meta leading-relaxed"
                        rows={5}
                        name="body"
                        placeholder="What did you like or dislike? How was the quality?"
                        value={body}
                        onChange={handleOnChange}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={starRating === 0}
                    className="w-full min-h-[48px] rounded-xl bg-ps-action text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Post review
                  </button>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
