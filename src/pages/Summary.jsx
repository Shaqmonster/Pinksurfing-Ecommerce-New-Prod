import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { authContext } from "../context/authContext";
import { useCookies } from "react-cookie";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { IoStar, IoStarOutline } from "react-icons/io5";
import CancelDialog from "../components/CancelDialog";
import { toast } from "react-toastify";
import RatingForm from "../components/RatingForm";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import TrackingTimeline from "../components/TrackingTimeline";
import { formatMoney } from "../utils/formatMoney";

const Summary = () => {
  const { user, isRatingFormOpen, currency, setIsRatingFormOpen } =
    React.useContext(authContext);
  const [cookies, removeCookie] = useCookies([]);
  const [orders, setOrders] = useState([]);
  const [order, setOrder] = useState();
  const [addresses, setAddresses] = useState([]);
  let [isOpen, setIsOpen] = useState(false);
  let [deleteOrderId, setDeleteOrderId] = useState("");
  let [orderStatus, setOrderStatus] = useState("");

  const navigate = useNavigate();
  const { orderId } = useParams();
  let [rating, setRating] = useState(2);
  const [review, setReview] = useState({
    title: "",
    body: "",
  });
  const { title, body } = review;
  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setInputValue({
      ...inputValue,
      [name]: value,
    });
  };
  function openModal() {
    setIsOpen(true);
  }

  const GetOrder = async () => {
    if (!cookies.access_token) {
      navigate("/signin");
    }
    axios
      .get(
        `${import.meta.env.VITE_SERVER_URL}/api/order/track-order/${orderId}/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      )
      .then((response) => {
        console.log(response.data);
        setOrder(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const GetAddresses = async () => {
    if (!cookies.access_token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/address/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token}`,
        },
      })
      .then((response) => {
        // console.log(response);
        setAddresses(response.data);
        // console.log(user);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  useEffect(() => {
    GetOrder();
    GetAddresses();
  }, [cookies, navigate, removeCookie]);

  // Fetch ratings for this product once the order (and its product) is loaded
  useEffect(() => {
    if (!order?.product?.id) return;
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/ratings/get-ratings/${order.product.id}/`, {
        headers: { "Content-Type": "application/json" },
      })
      .then((res) => setReviews(res.data.ratings_reviews || []))
      .catch(() => {});
  }, [order?.product?.id]);

  const handleOptimisticCancel = (cancelledOrderId) => {
    setOrder((prev) =>
      prev ? { ...prev, order_status: "CANCELED" } : prev
    );
  };

  const handleReturnOrder = async (orderItemId) => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/order/return-order/${orderItemId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      );
      if (response.status === 202 || response.status === 200) {
        setOrder((prev) =>
          prev ? { ...prev, order_status: "RETURN-REQUESTED" } : prev
        );
        toast.success(
          "Return Scheduled! A carrier will arrive at your door tomorrow to collect the package. No printing required\u2014they will bring the label with them.",
          { position: "top-center", autoClose: 6000 }
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.error || "Failed to initiate return. Please try again.",
        { position: "top-center", autoClose: 3000 }
      );
    }
  };

  if (!order) {
    return null;
  }
  const GetOrders = async () => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/my-orders/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      );
      setOrders(response.data);
      setLoading(false);
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      <div className=" px-4 py-4 md:px-6 2xl:px-20 w-full min-h-screen dark:bg-[#1A1C1E] bg-white pb-10">
        <div className="flex justify-start item-start space-y-2 flex-col">
          <h1 className="text-xl flex items-center gap-1 dark:text-white lg:text-4xl font-semibold  text-black">
            <ArrowLeftCircleIcon
              onClick={() => {
                navigate(-1);
              }}
              className=" cursor-pointer block w-[27px] sm:w-[30px]  dark:text-[#f5f5f5]  top-1.5 "
            />
            Order Id : {order.order_number || orderId}
          </h1>
        </div>
        <svg width="601" height="1031" viewBox="0 0 601 1031" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-[10%] left-0 z-[0] pointer-events-none hidden lg:block">
          <g filter="url(#filter0_f_1_3194)">
            <circle cx="85.5" cy="515.5" r="207.5" fill="#8B33FE" fill-opacity="0.4" />
          </g>
          <defs>
            <filter id="filter0_f_1_3194" x="-430" y="0" width="1031" height="1031" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="154" result="effect1_foregroundBlur_1_3194" />
            </filter>
          </defs>
        </svg>
        <div className=" ">
          <div className="grid grid-cols-7 gap-4 px-5 my-4 justify-start items-start w-full h-full ">
            <div className=" flex col-span-7 lg:col-span-7 justify-between items-start dark:bg-transparent  w-full h-full">
              <p className="text-lg md:text-xl dark:text-white font-semibold leading-6 xl:leading-5 text-gray-800"></p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-2 w-full h-full text-white bg-[#2d1e5f] border-purple-900 dark:border dark:border-white/30 dark:text-[#f5f5f5] items-center shadow-md shadow-black/20 border-2 border-black/20 rounded-md p-4 justify-between">
                <div className="w-full sm:w-auto sm:col-span-1 max-w-[300px] max-h-[200px] overflow-hidden">
                  <img
                    className="w-full h-full object-contain"
                    alt="img"
                    src={`${order.product.image1}`}
                  />
                </div>
                <div className=" flex flex-col  w-full h-full col-span-2 sm:col-span-1  p-4 px-6  ">
                  <p className=" font-bold mb-1 text-[18px] sm:text-[20px] capitalize">
                    {order.product.name}
                  </p>
                  <p className="  mb-1 text-[13px] sm:text-[15px] capitalize">
                    {/* {order.product.description} */}
                  </p>
                  <p className=" font-medium mb-2 text-[14px] sm:text-[15px]">
                    Total Price : {currency} {formatMoney(order.total_price)}
                  </p>
                </div>
                <div className=" flex flex-col -mb-2 sm:mb-0 w-full h-full p-4 px-2 sm:px-6 col-span-3 sm:col-span-1 ">
                  <p className=" text-[13.5px] sm:text-[14.5px] font-medium mb-1">
                    {" "}
                    Quantity : {order.quantity}
                  </p>
                  <p className="  text-[13.5px] sm:text-[14.5px] font-medium mb-1">
                    {" "}
                    Date of Order :{" "}
                    <span className=" font-normal">
                      {new Date(order.date_of_order).toDateString()}
                    </span>
                  </p>
                  <p className="  text-[13.5px] sm:text-[14.5px] font-medium mb-1">
                    {" "}
                    status :{" "}
                    <span
                      className={`${order.order_status === "DELIVERED"
                        ? "text-green-500 bg-green-100"
                        : order.order_status === "PENDING" || order.order_status === "RECEIVED" || order.order_status === "PACKED"
                          ? "text-yellow-500 bg-yellow-100"
                          : order.order_status === "CANCELED"
                            ? "text-red-500 bg-red-100"
                            : order.order_status === "RETURN-REQUESTED" || order.order_status === "RETURN-DELIVERED"
                              ? "text-orange-500 bg-orange-100"
                              : "text-gray-500 bg-gray-100"
                        } rounded-md px-2 py-1`}
                    >
                      {order.order_status}
                    </span>

                  </p>
                </div>
                <RatingForm order={order} />
                <div className=" grid grid-cols-2 col-span-3 sm:col-span-1 sm:flex flex-col justify-evenly sm:justify-center gap-4  w-full h-full sm:p-4 px-2 ">
                  {["PENDING", "RECEIVED", "PACKED"].includes(
                    order.order_status.toUpperCase()
                  ) && (
                    <button
                      onClick={() => {
                        openModal();
                        setDeleteOrderId(order.id);
                      }}
                      className="text-red-600 bg-transparent font-medium text-sm sm:text-[16px] py-2 sm:py-2.5 hover:bg-red-100 dark:hover:bg-red-600 dark:hover:text-white rounded-md border border-red-500"
                    >
                      Cancel Order
                    </button>
                  )}
                  {order.order_status.toUpperCase() === "DELIVERED" && (
                    <button
                      onClick={() => handleReturnOrder(order.id)}
                      className="text-orange-600 bg-transparent font-medium text-sm sm:text-[16px] py-2 sm:py-2.5 hover:bg-orange-100 dark:hover:bg-orange-600 dark:hover:text-white rounded-md border border-orange-500"
                    >
                      Return Order
                    </button>
                  )}
                  <button
                    onClick={() => {
                      navigate(
                        `/product/productDetail/${order.product.slug}?productId=${order.product.id}`
                      );
                    }}
                    className=" text-purple-700 bg-white hover:scale-[1.02] font-medium text-sm sm:text-[16px] py-2 sm:py-2.5  rounded-md "
                  >
                    View Product
                  </button>
                </div>
              </div>
            </div>

            {/* ── Package Tracking Section ── */}
            {order.order_status &&
              ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
                order.order_status.toUpperCase().replace(/\s+/g, "_")
              ) && (
                <div className="col-span-7">
                  <TrackingTimeline orderItemId={orderId} />
                </div>
              )}

            <div className=" h-full w-full col-span-7 lg:col-span-2">
              {order.order_status.toLowerCase() === "delivered" && (() => {
                // Check if this specific order item has already been reviewed
                const myRating = reviews.find(
                  (r) => String(r.order_item) === String(order.id)
                );

                if (myRating) {
                  // Already rated — display the existing review
                  return (
                    <div className="border-2 border-yellow-500 bg-yellow-500/10 w-full py-4 px-4 h-full rounded-md flex flex-col items-center justify-center gap-2">
                      <h2 className="font-semibold text-lg text-white">Your Review</h2>
                      {/* Stars (1–7 scale) */}
                      <div className="flex gap-1">
                        {Array.from({ length: 7 }, (_, i) => (
                          <span key={i}>
                            {myRating.rating >= i + 1
                              ? <IoStar className="text-yellow-400 text-xl" />
                              : <IoStarOutline className="text-yellow-400 text-xl" />}
                          </span>
                        ))}
                      </div>
                      {myRating.title && (
                        <p className="font-semibold text-white text-sm text-center">{myRating.title}</p>
                      )}
                      {myRating.body && (
                        <p className="text-gray-300 text-xs text-center line-clamp-3">{myRating.body}</p>
                      )}
                      <button
                        onClick={() => setIsRatingFormOpen(true)}
                        className="mt-1 text-xs text-yellow-400 underline hover:text-yellow-300"
                      >
                        Edit Review
                      </button>
                    </div>
                  );
                }

                // Not yet rated — show the rate button
                return (
                  <div className="bg-green-600 border-2 border-green-700 w-full py-3 lg:py-0 h-full rounded-md flex flex-col dark:text-[#f5f5f5] items-center justify-center">
                    <h2 className="font-semibold text-xl text-white">Rate this Product</h2>
                    <p className="text-[#f5f5f5] mt-0.5 mb-4">Share your review about this product.</p>
                    <button
                      onClick={() => setIsRatingFormOpen(true)}
                      className="font-medium text-sm sm:text-[16px] py-2 sm:py-2.5 px-5 bg-green-600 text-white border-white hover:text-green-500 hover:bg-white rounded-md border"
                    >
                      Rate This Product
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className=" col-span-7 justify-center flex-col md:flex-row items-stretch w-full ">
              <div className="flex flex-col px-4 py-6 md:p-6 xl:p-8 w-full bg-gray-100 rounded-md border-purple-700 border-2 mt-4 dark:bg-[#1A1C1E] space-y-6">
                <h3 className="text-xl dark:text-white font-semibold leading-5 text-gray-800">
                  Summary
                </h3>
                <div className="flex justify-center items-center w-full space-y-4 flex-col border-gray-200 border-b pb-4">
                  <div className="flex justify-between w-full">
                    <p className="text-base dark:text-white leading-4 text-gray-800">
                      Subtotal
                    </p>
                    <p className="text-base dark:text-gray-300 leading-4 text-gray-600">
                      {currency}
                      {formatMoney(order.total_price)}
                    </p>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <p className="text-base dark:text-white leading-4 text-gray-800">
                      Discount{" "}
                    </p>
                    <p className="text-base dark:text-gray-300 leading-4 text-gray-600">
                      -{currency}
                      {formatMoney(order.shipping_price || 0)}
                    </p>
                  </div>
                  {/* <div className="flex justify-between items-center w-full">
                          <p className="text-base dark:text-white leading-4 text-gray-800">
                            Shipping
                          </p>
                          <p className="text-base dark:text-gray-300 leading-4 text-gray-600">
                            {currency} {order.shipping_price || "8.00"}
                          </p>
                        </div> */}
                </div>
                <div className="flex justify-between items-center w-full">
                  <p className="text-base dark:text-white font-semibold leading-4 text-gray-800">
                    Total
                  </p>
                  <p className="text-base dark:text-gray-300 font-semibold leading-4 text-gray-600">
                    {currency}{" "}
                    {formatMoney(
                      Number(order.total_price) + Number(order.shipping_price || 0)
                    )}
                  </p>
                </div>
              </div>

              {isOpen && (
                <CancelDialog
                  isOpen={isOpen}
                  orderId={deleteOrderId}
                  setIsOpen={setIsOpen}
                  GetOrders={GetOrder}
                  onOptimisticCancel={handleOptimisticCancel}
                />
              )}
            </div>

            {/* Payment Protection Status */}
            <div className="col-span-7 mt-4">
              <div className="bg-gray-100 rounded-md border-purple-700 border-2 dark:bg-[#1A1C1E] p-6">
                <h3 className="text-xl dark:text-white font-semibold leading-5 text-gray-800 mb-4">
                  Payment Status
                </h3>
                <div className="flex items-start gap-3">
                  {order.held_in_escrow > 0 ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-700 dark:text-blue-400 text-[15px]">
                          Payment Protected
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          Your payment of {currency}
                          {formatMoney(order.held_in_escrow)} is held securely until your order is fulfilled. 
                          This protects you from any issues with your purchase.
                        </p>
                      </div>
                    </>
                  ) : order.vendor_earnings_status === "PAID_OUT" || order.vendor_earnings_status === "CLEARED" ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-green-700 dark:text-green-400 text-[15px]">
                          Payment Released
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          Your transaction has been completed successfully. The payment has been released to the seller.
                        </p>
                      </div>
                    </>
                  ) : order.vendor_earnings_status === "PENDING" ? (
                    <>
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-yellow-700 dark:text-yellow-400 text-[15px]">
                          Payment Processing
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          Your order has been fulfilled and the payment is being processed. Funds will be released after the holding period.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300 text-[15px]">
                          Payment Received
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          Your payment has been received and your order is being processed.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* <div className="col-span-7 hidden sm:block">
              {order.paid_with_escrow ? (
                <div className="col-span-7">
                  <h2 className="text-lg font-semibold dark:text-gray-300 text-black mb-4">
                    Your Escrow Process Status
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-green-500 dark:bg-green-400">
                        <span className="text-white">1</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Order Confirmed</p>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">2</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Packaged for delivery</p>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">3</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Delivered to Post Office</p>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">4</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Product Delivered</p>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">5</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Product in Possession</p>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">6</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Product Satisfaction</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="col-span-7 mt-2">
                  <h2 className="text-lg font-semibold dark:text-gray-300 text-black mb-4">
                    Your Delivery Status
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-green-500 dark:bg-green-400">
                        <span className="text-white">1</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Order Confirmed</p>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">2</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Shipped</p>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">3</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Out for Delivery</p>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">4</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Delivered</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-7 block sm:hidden">
              {order.paid_with_escrow ? (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-4">
                  <h2 className="text-lg font-semibold dark:text-gray-300 text-black mb-4">
                    Your Escrow Process Status
                  </h2>
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-green-500 dark:bg-green-400">
                        <span className="text-white">1</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">
                        Order Confirmed
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">2</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">
                        Packaged for delivery
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">3</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">
                        Delivered to Post Office
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">4</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">
                        Product Delivered
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">5</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">
                        Product in Possession
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">6</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">
                        Product Satisfaction
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-4">
                  <h2 className="text-lg font-semibold dark:text-gray-300 mb-4">
                    Your Delivery Status
                  </h2>
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-green-500 dark:bg-green-400">
                        <span className="text-white">1</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">
                        Order Confirmed
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">2</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Shipped</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">3</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">
                        Out for Delivery
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">4</span>
                      </div>
                      <p className="text-sm dark:text-gray-300 text-black">Delivered</p>
                    </div>
                  </div>
                </div>
              )}
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
};

export default Summary;
