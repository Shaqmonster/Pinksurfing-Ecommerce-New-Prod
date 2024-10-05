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
  const [cookies, removeCookie] = useCookies([]);
  const navigate = useNavigate();
  function closeModal() {
    setIsRatingFormOpen(false);
  }
  const [starRating, setStarRating] = useState(0);
  const [review, setReview] = useState({
    rating: 1,
    title: "",
    body: "",
    order_item: order.id,
    customer: order.customer,
  });

  const { title, body } = review;
  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setReview({
      ...review,
      [name]: value,
    });
  };
  const handleReview = async (e) => {
    e.preventDefault();
    if (!cookies.token) {
      navigate("/signin");
    }
    // console.log(order);
    // console.log(review);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/ratings/rate-order/${order.id}/`,
        review,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      );
      // .then((response) => {
      // console.log(response);
      toast.success("Review Posted", { position: "top-center" });
      closeModal();
      // })
      // .catch((error) => {
      //   toast.error(error, { position: "top-center" });
      //   console.log(order);
      //   console.error(error);
      // });
    } catch (error) {
      try {
        const fallbackResponse = await axios.put(
          `${import.meta.env.VITE_SERVER_URL}/api/ratings/rate-order/${order.id}/`,
          review,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cookies.token}`,
            },
          }
        );
        // .then((response) => {
        // console.log(fallbackResponse);
        toast.success("Review Updated", { position: "top-center" });
        closeModal();
        // });
      } catch (fallbackError) {
        // Log the fallback error
        console.error(fallbackError);
        toast.error("Fallback Review Failed", { position: "top-center" });
      }
    }
  };

  const Stars = ({ stars }) => {
    const ratingStars = Array.from({ length: 7 }, (elem, index) => {
      return (
        <span key={index}>
          {stars >= index + 1 ? (
            <IoStar className=" text-[27px] text-yellow-500 " />
          ) : (
            <IoStarOutline className=" text-[27px] text-yellow-500" />
          )}
        </span>
      );
    });
    return (
      <div className=" flex justify-evenly px-2 sm:px-4 items-center gap-3 sm:gap-5 mt-3 mb-4">
        {ratingStars}
      </div>
    );
  };

  return (
    <>
      <Transition appear show={isRatingFormOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-black p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg mb-4 flex items-center justify-between font-medium leading-6 text-gray-900"
                  >
                    Ratings and Review
                    <IoCloseOutline
                      className=" text-[23px] cursor-pointer"
                      onClick={closeModal}
                    />
                  </Dialog.Title>
                  <form onSubmit={handleReview} className="w-full max-w-lg">
                    {/* satr rating --------------------------------------------------------------------------------- */}
                    <div className=" flex justify-evenly px-2 sm:px-4 items-center gap-3 sm:gap-5 mt-3 mb-4">
                      <div
                        onClick={() => {
                          setStarRating(1);
                          setReview({ ...review, rating: 1 });
                        }}
                        className=" relative cursor-pointer group "
                      >
                        <span className=" text-[13px] absolute -top-4 -left-3 hidden group-hover:block ">
                          DREADFUL
                        </span>
                        {starRating >= 1 ? (
                          <IoStar className=" text-yellow-500 text-[27px]" />
                        ) : (
                          <IoStarOutline className=" text-yellow-500 text-[27px]" />
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setStarRating(2);
                          setReview({ ...review, rating: 2 });
                        }}
                        className=" relative cursor-pointer group "
                      >
                        <span className=" text-[13px] absolute -top-4 -left-3 hidden group-hover:block ">
                          MEDIOCRE
                        </span>
                        {starRating >= 2 ? (
                          <IoStar className=" text-yellow-500 text-[27px]" />
                        ) : (
                          <IoStarOutline className=" text-yellow-500 text-[27px]" />
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setStarRating(3);
                          setReview({ ...review, rating: 3 });
                        }}
                        className=" relative cursor-pointer group "
                      >
                        <span className=" text-[13px] absolute -top-4 -left-3 hidden group-hover:block ">
                          SO-SO
                        </span>
                        {starRating >= 3 ? (
                          <IoStar className=" text-yellow-500 text-[27px]" />
                        ) : (
                          <IoStarOutline className=" text-yellow-500 text-[27px]" />
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setStarRating(4);
                          setReview({ ...review, rating: 4 });
                        }}
                        className=" relative cursor-pointer group "
                      >
                        <span className=" text-[13px] absolute -top-4 -left-3 hidden group-hover:block ">
                          DECENT
                        </span>
                        {starRating >= 4 ? (
                          <IoStar className=" text-yellow-500 text-[27px]" />
                        ) : (
                          <IoStarOutline className=" text-yellow-500 text-[27px]" />
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setStarRating(5);
                          setReview({ ...review, rating: 5 });
                        }}
                        className=" relative cursor-pointer group "
                      >
                        <span className=" text-[13px] absolute -top-4 -left-3 hidden group-hover:block ">
                          IMPRESSIVE
                        </span>
                        {starRating >= 5 ? (
                          <IoStar className=" text-yellow-500 text-[27px]" />
                        ) : (
                          <IoStarOutline className=" text-yellow-500 text-[27px]" />
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setStarRating(6);
                          setReview({ ...review, rating: 6 });
                        }}
                        className=" relative cursor-pointer group "
                      >
                        <span className=" text-[13px] absolute -top-4 -left-3 hidden group-hover:block ">
                          EXCEPTIONAL
                        </span>
                        {starRating >= 6 ? (
                          <IoStar className=" text-yellow-500 text-[27px]" />
                        ) : (
                          <IoStarOutline className=" text-yellow-500 text-[27px]" />
                        )}
                      </div>
                      <div
                        onClick={() => {
                          setStarRating(7);
                          setReview({ ...review, rating: 7 });
                        }}
                        className=" relative cursor-pointer group "
                      >
                        <span className=" text-[13px] absolute -top-4 -left-3 hidden group-hover:block ">
                          PHENOMENAL'
                        </span>
                        {starRating >= 7 ? (
                          <IoStar className=" text-yellow-500 text-[27px]" />
                        ) : (
                          <IoStarOutline className=" text-yellow-500 text-[27px]" />
                        )}
                      </div>
                    </div>
                    {/* satr rating --------------------------------------------------------------------------------- */}
                    <div className="flex flex-wrap -mx-3 mb-2">
                      <div className="w-full px-3">
                        <label
                          className="block capitalize tracking-wide text-black text-sm  font-semibold mb-2"
                          htmlFor="title"
                        >
                          Title
                        </label>
                        <input
                          className="appearance-none block w-full text-black border border-black rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white bg-transparent focus:border-gray-500"
                          id="title"
                          name="title"
                          type="text"
                          placeholder="title"
                          value={title}
                          onChange={handleOnChange}
                          required
                        />
                      </div>
                      <div className="w-full px-3">
                        <label
                          className="block capitalize tracking-wide text-black text-sm  font-semibold mb-2"
                          htmlFor="body"
                        >
                          Share Your Review
                        </label>
                        <textarea
                          className="appearance-none block w-full text-black border border-black rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white bg-transparent focus:border-gray-500"
                          id="body"
                          rows={5}
                          name="body"
                          type="text"
                          placeholder="Share you user experience "
                          value={body}
                          onChange={handleOnChange}
                          required
                        />
                      </div>
                    </div>

                    <button
                      disabled={starRating === 0}
                      className=" w-full flex items-center justify-center disabled:bg-gray-500 bg-yellow-500 text-black font-semibold py-3 rounded-lg"
                    >
                      Submit My Review{" "}
                    </button>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
