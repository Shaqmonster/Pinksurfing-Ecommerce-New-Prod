import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { authContext } from "../context/authContext";
import { useCookies } from "react-cookie";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { FaStar } from "react-icons/fa";
import { IoStarOutline } from "react-icons/io5";
import CancelDialog from "../components/CancelDialog";
import { toast } from "react-toastify";
import RatingForm from "../components/RatingForm";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";

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
    if (!cookies.token) {
      navigate("/signin");
    }
    axios
      .get(
        `${import.meta.env.VITE_SERVER_URL}/api/order/track-order/${orderId}/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
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
    if (!cookies.token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/address/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.token}`,
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

  if (!order) {
    return null;
  }
  const GetOrders = async () => {
    if (!cookies.token) {
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
            Authorization: `Bearer ${cookies.token}`,
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
      <div className=" px-4 py-4 md:px-6 2xl:px-20 w-full min-h-screen dark:bg-black pb-10">
        <div className="flex justify-start item-start space-y-2 flex-col">
          <h1 className="text-xl flex items-center gap-1 dark:text-white lg:text-4xl font-semibold  text-gray-800">
            <ArrowLeftCircleIcon
              onClick={() => {
                navigate(-1);
              }}
              className=" cursor-pointer block w-[27px] sm:w-[30px]  dark:text-[#f5f5f5]  top-1.5 "
            />
            Order Id : {orderId}
          </h1>
        </div>
        <div className=" ">
          <div className="grid grid-cols-7 gap-4 px-5 my-4 justify-start items-start w-full h-full ">
            <div className=" flex col-span-7 lg:col-span-7 justify-between items-start dark:bg-transparent  w-full h-full">
              <p className="text-lg md:text-xl dark:text-white font-semibold leading-6 xl:leading-5 text-gray-800"></p>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 py-2 w-full h-full text-white bg-[#2d1e5f] border-purple-900 dark:border dark:border-white/30 dark:text-[#f5f5f5] items-center shadow-md shadow-black/20 border-2 border-black/20 rounded-md p-4 justify-between">
                <div className="w-full sm:w-auto sm:col-span-1 max-w-[300px] max-h-[200px] overflow-hidden">
                  <img
                    className="w-full h-full object-cover"
                    alt="img"
                    src={`${order.product.image1}`}
                    // src="https://images.unsplash.com/photo-1494726161322-5360d4d0eeae?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=334&q=80"
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
                    Total Price : {currency} {order.total_price}
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
                    <span className=" text-green-500 bg-black/50 rounded-md px-2 py-1">
                      {order.order_status}
                    </span>
                  </p>
                </div>
                <RatingForm order={order} />
                <div className=" grid grid-cols-2 col-span-3 sm:col-span-1 sm:flex flex-col justify-evenly sm:justify-center gap-4  w-full h-full sm:p-4 px-2 ">
                  <button
                    disabled={
                      order.order_status.toUpperCase() === "SHIPPED" ||
                      order.order_status.toUpperCase() === "DELIVERED" ||
                      order.order_status.toUpperCase() === "RETURNED" ||
                      order.order_status.toUpperCase() === "RETURN-REQUESTED" ||
                      order.order_status.toUpperCase() === "CANCELED"
                    }
                    onClick={() => {
                      openModal();
                      setDeleteOrderId(order.id);
                    }}
                    className=" disabled:text-gray-400 disabled:hover:bg-transparent disabled:border-gray-400 disabled:bg-transparent bg-red-600 font-medium text-sm sm:text-[16px] py-2 sm:py-2.5 dark:disabled:hover:bg-transparent dark:disabled:hover:text-gray-400 hover:bg-red-100 dark:hover:bg-red-600 dark:hover:text-white rounded-md border border-red-500 "
                  >
                    {order.order_status === "shipped"
                      ? "Shipped"
                      : "Cancel Order"}
                  </button>
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

            <div className=" h-full w-full col-span-7 lg:col-span-2">
              {order.order_status.toLowerCase() ===
                ("delivered" || "returned" || "return-requested") && (
                <div className=" bg-green-600 border-2 border-green-700 w-full py-3 lg:py-0  h-full rounded-md flex flex-col dark:text-[#f5f5f5] items-center justify-center">
                  <h2 className=" font-semibold text-xl text-white">
                    Rate this Product
                  </h2>
                  <p className=" text-[#f5f5f5] mt-0.5 mb-4">
                    Share your Reviews about this product.
                  </p>
                  <button
                    onClick={() => {
                      setIsRatingFormOpen(true);
                    }}
                    className=" disabled:text-gray-400 disabled:hover:bg-transparent disabled:border-gray-300 font-medium text-sm sm:text-[16px] py-2 sm:py-2.5 px-5 bg-green-600 text-white border-white  hover:text-green-500 hover:bg-white  rounded-md border "
                  >
                    Rate This Product
                  </button>
                </div>
              )}
            </div>

            <div className=" col-span-7 justify-center flex-col md:flex-row items-stretch w-full ">
              <div className="flex flex-col px-4 py-6 md:p-6 xl:p-8 w-full bg-gray-100 rounded-md border-purple-700 border-2 mt-4 dark:bg-gray-800 space-y-6">
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
                      {order.total_price}
                    </p>
                  </div>
                  <div className="flex justify-between items-center w-full">
                    <p className="text-base dark:text-white leading-4 text-gray-800">
                      Discount{" "}
                    </p>
                    <p className="text-base dark:text-gray-300 leading-4 text-gray-600">
                      -{currency}
                      {order.shipping_price || "0.00"}
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
                    {Number(order.total_price) +
                      Number(order.shipping_price || 0)}
                  </p>
                </div>
              </div>

              {isOpen && (
                <CancelDialog
                  isOpen={isOpen}
                  orderId={deleteOrderId}
                  setIsOpen={setIsOpen}
                  GetOrders={GetOrder}
                />
              )}
            </div>

            <div className="col-span-7 hidden sm:block">
              {order.paid_with_escrow ? (
                <div className="col-span-7">
                  <h2 className="text-lg font-semibold dark:text-gray-300 mb-4">
                    Your Escrow Process Status
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-green-500 dark:bg-green-400">
                      <span className="text-white">1</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                      <span className="text-white">2</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                      <span className="text-white">3</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                      <span className="text-white">4</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                      <span className="text-white">5</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                      <span className="text-white">6</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm dark:text-gray-300">
                      Order Confirmed
                    </p>
                    <p className="text-sm dark:text-gray-300">
                      Packaged for delivery
                    </p>
                    <p className="text-sm dark:text-gray-300">
                      Delivered to Post Office
                    </p>
                    <p className="text-sm dark:text-gray-300">
                      Product Delivered
                    </p>
                    <p className="text-sm dark:text-gray-300">
                      Product in Possession
                    </p>
                    <p className="text-sm dark:text-gray-300">
                      Product Satisfaction
                    </p>
                  </div>
                </div>
              ) : (
                <div className="col-span-7">
                  <h2 className="text-lg font-semibold dark:text-gray-300 mb-4">
                    Your Delivery Status
                  </h2>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-green-500 dark:bg-green-400">
                      <span className="text-white">1</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                      <span className="text-white">2</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                      <span className="text-white">3</span>
                    </div>
                    <div className="flex-1 h-1 bg-gray-300 dark:bg-gray-700"></div>
                    <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                      <span className="text-white">4</span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-sm dark:text-gray-300">
                      Order Confirmed
                    </p>
                    <p className="text-sm dark:text-gray-300">Shipped</p>
                    <p className="text-sm dark:text-gray-300">
                      Out for Delivery
                    </p>
                    <p className="text-sm dark:text-gray-300">Delivered</p>
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-7 block sm:hidden">
              {order.paid_with_escrow ? (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 space-y-4">
                  <h2 className="text-lg font-semibold dark:text-gray-300 mb-4">
                    Your Escrow Process Status
                  </h2>
                  <div className="flex flex-col space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-green-500 dark:bg-green-400">
                        <span className="text-white">1</span>
                      </div>
                      <p className="text-sm dark:text-gray-300">
                        Order Confirmed
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">2</span>
                      </div>
                      <p className="text-sm dark:text-gray-300">
                        Packaged for delivery
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">3</span>
                      </div>
                      <p className="text-sm dark:text-gray-300">
                        Delivered to Post Office
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">4</span>
                      </div>
                      <p className="text-sm dark:text-gray-300">
                        Product Delivered
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">5</span>
                      </div>
                      <p className="text-sm dark:text-gray-300">
                        Product in Possession
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">6</span>
                      </div>
                      <p className="text-sm dark:text-gray-300">
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
                      <p className="text-sm dark:text-gray-300">
                        Order Confirmed
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">2</span>
                      </div>
                      <p className="text-sm dark:text-gray-300">Shipped</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">3</span>
                      </div>
                      <p className="text-sm dark:text-gray-300">
                        Out for Delivery
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 flex justify-center items-center rounded-full bg-gray-300 dark:bg-gray-700">
                        <span className="text-white">4</span>
                      </div>
                      <p className="text-sm dark:text-gray-300">Delivered</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Summary;
