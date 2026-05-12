import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { IoCloseOutline, IoStar, IoStarOutline } from "react-icons/io5";
import { FaStar } from "react-icons/fa";

export default function RatingForm({ order }) {
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
    if (!cookies.access_token) {
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
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      );
      toast.success("Review Posted Successfully");
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
                Authorization: `Bearer ${cookies.access_token}`,
              },
            }
          );
          toast.success("Review Updated Successfully");
          setIsRatingFormOpen(false);
        } catch (fallbackError) {
          toast.error("Failed to update review");
        }
      } else {
        toast.error("Failed to post review");
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
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-[2.5rem] bg-[#0E0F13] border border-white/10 p-10 shadow-2xl transition-all">
                <div className="flex justify-between items-center mb-8">
                  <Dialog.Title as="h3" className="text-3xl font-black uppercase tracking-tighter">
                    Rate Product
                  </Dialog.Title>
                  <button onClick={() => setIsRatingFormOpen(false)} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                    <IoCloseOutline className="text-2xl" />
                  </button>
                </div>

                <form onSubmit={handleReview} className="space-y-8">
                  <div className="flex justify-between items-center bg-white/5 p-6 rounded-3xl border border-white/5">
                    {STYLES.map((style, idx) => {
                      const level = idx + 1;
                      const isActive = starRating >= level;
                      return (
                        <div 
                          key={idx} 
                          onClick={() => { setStarRating(level); setReview(prev => ({ ...prev, rating: level })); }}
                          className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                          <div className={`transition-all duration-300 ${isActive ? style.color : "text-white/10 group-hover:text-white/30"}`}>
                            <IoStar className="text-3xl" />
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-widest transition-opacity ${starRating === level ? "opacity-100" : "opacity-0"}`}>
                            {style.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Headline</label>
                      <input
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-all text-white placeholder-gray-600 font-bold"
                        name="title"
                        type="text"
                        placeholder="Summarize your experience..."
                        value={title}
                        onChange={handleOnChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-2">Detailed Review</label>
                      <textarea
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-purple-500/50 transition-all text-white placeholder-gray-600 leading-relaxed font-medium"
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
                    className="w-full py-5 bg-white text-black rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-gray-200 transition-all disabled:opacity-20 disabled:grayscale"
                  >
                    Publish Review
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
