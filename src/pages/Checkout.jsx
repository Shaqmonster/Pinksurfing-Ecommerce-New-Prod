import { PencilIcon } from "@heroicons/react/24/outline";
import React, { useContext, useEffect, useState } from "react";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import AddressForm from "../components/AddressForm";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import OrderConfirm from "../components/OrderConfirm";
import PaymentOptionsModal from "./PaymentOptionsModal";


const Checkout = () => {
  const { setIsAddressFormOpen, currency, isAddressFormOpen } =
    useContext(authContext);
  const { cartProducts, setCartProducts } = useContext(dataContext);
  const [orderConfirm, setorderConfirm] = useState(false);
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [addressesId, setAddressesId] = useState("");
  const [cookies, removeCookie] = useCookies([]);
  const [isModalOpen, setModalOpen] = useState(false);

  const [order_id, setOrderId] = useState();
  const [loading, setLoading] = useState(false);

  const PlaceOrder = async () => {
    if (!cookies.token) {
      navigate("/signin");
    }
    if (!addresses[0]) {
      console.log("No address found, opening address form...");
      setIsAddressFormOpen(true);
      return;
    } else if (!addressesId) {
      toast.error("Select an Address");
      return;
    }
    setLoading(true);
    console.log(loading);
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/create-order/`,
        {
          address: addressesId,
        },
        {
          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        console.log(response.data);
        setOrderId(response.data.order_id);
        setModalOpen(true);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response.data.error || "An error occurred", {
          position: "top-center",
          autoClose: 3000,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const GetAddresses = async () => {
    if (!cookies.token) {
      navigate("/signin");
    }
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/address/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((response) => {
        const addressesArray = Array.isArray(response.data.addresses)
          ? response.data.addresses
          : Object.values(response.data.addresses).filter(
            (value) => value !== null && value !== undefined
          );

        const sortedAddresses = addressesArray.sort((a, b) => {
          return new Date(b.updated) - new Date(a.updated);
        });

        // Set the latest updated address as the default
        const defaultAddress = sortedAddresses[0];

        setAddressesId(defaultAddress?.id);
        setAddresses(addressesArray);
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response.data.error || "An error occurred", {
          position: "top-center",
          autoClose: 3000,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };
  // function calculateSum(cartProducts) {

  const subTotal = cartProducts?.reduce((acc, product) => {
    const priceToAdd =
      product.additional_price > 0
        ? Number(product.product.unit_price) + Number(product.additional_price)
        : product.product.unit_price;

    return acc + priceToAdd * product.quantity;
  }, 0);

  // return total;
  // }
  // fetch cart products --------------------------------------------------------
  const GetCartProducts = async () => {
    if (!cookies.token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((response) => {
        if (response.data.length == 0) {
          navigate("/");
        }
        setCartProducts(response.data);
        // console.log(subTotal);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Unable to load cart", {
          position: "top-center",
          autoClose: 3000,
        });
      });
  };

  useEffect(() => {
    GetAddresses();
    GetCartProducts();
  }, [cookies, navigate, isAddressFormOpen, removeCookie]);

  useEffect(() => {
    if (addresses.length > 0) {
      setAddressesId(addresses[0].id);
    }
  }, [addresses]);

  return (
    <>
      {orderConfirm && <OrderConfirm />}
      <div className="flex flex-col items-center border-b bg-white dark:bg-[#0E0F13] py-4 sm:flex-row sm:px-10 lg:px-20 xl:px-32">
        <Link
          to="/"
          className="text-2xl font-bold text-gray-800 dark:text-purple-600"
        >
          PinkSurfing
        </Link>
        <div className="mt-4 py-2 text-xs   dark:bg-[#0E0F13] sm:mt-0 sm:ml-auto sm:text-base">
          <div className="relative">
            <ul className="relative flex w-full items-center justify-between space-x-2 sm:space-x-4">
              <li className="flex items-center space-x-3 text-left sm:space-x-4">
                <a
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-xs font-semibold text-emerald-700"
                  href="#"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </a>
                <span className="font-semibold text-gray-900 dark:text-[#f5f5f5]">
                  Shop
                </span>
              </li>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <li className="flex items-center space-x-3 text-left sm:space-x-4">
                <a
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-600 text-xs font-semibold text-white ring ring-gray-600 ring-offset-2"
                  href="#"
                >
                  2
                </a>
                <span className="font-semibold text-gray-900 dark:text-[#f5f5f5]">
                  Shipping & Payment
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <svg
        className="fixed top-0 right-0 z-[0] pointer-events-none"
        width="536"
        height="1071"
        viewBox="0 0 536 1071"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#filter0_f_1_3190)">
          <circle cx="535.5" cy="535.5" r="207.5" fill="#8B33FE" fillOpacity="0.4" />
        </g>
        <defs>
          <filter
            id="filter0_f_1_3190"
            x="0"
            y="0"
            width="1071"
            height="1071"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="164" result="effect1_foregroundBlur_1_3190" />
          </filter>
        </defs>
      </svg>
      <div className="grid sm:px-10 h-min min-h-screen pb-8 bg-white dark:bg-[#0E0F13] dark:text-[#f5f5f5] text-black lg:grid-cols-2 lg:px-20 xl:px-32">
        <div className=" px-2 sm:px-4 pt-8">
          <p className="text-xl font-medium">Order Summary</p>
          <p className="text-gray-400">
            Check your items. And select a suitable shipping method.
          </p>
          <div className="mt-8 space-y-3 rounded-lg  w-[95vw] sm:w-full max-h-[340px] overflow-y-auto  border bg-white dark:bg-[#0E0F13]  sm:py-4 sm:px-6">
            {cartProducts.map((product) => {
              return (
                <div className="flex flex-row items-center rounded-lg bg-white dark:bg-[#0E0F13] sm:flex-row">
                  <img
                    className="m-2 h-24 w-28 rounded-md border object-cover object-center"
                    src={`${product.product.image1}`}
                    // src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OHx8c25lYWtlcnxlbnwwfHwwfHw%3D&auto=htmlFormat&fit=crop&w=500&q=60"
                    alt=""
                  />
                  <div className="flex lg:w-full flex-col px-4 py-4">
                    <span className="font-semibold">
                      {product.product.name}
                    </span>
                    <span className="float-right text-gray-400">
                      Quantity: {product.quantity}
                    </span>
                    <p className="mt-auto text-lg font-bold">
                      {currency}
                      {product.additional_price > 0
                        ? Number(product.product.unit_price) +
                        Number(product.additional_price)
                        : product.product.unit_price}
                    </p>
                    {product.additional_price > 0 && (
                      <p className="text-[14px] sm:text-[14.5px] text-gray-200 whitespace-normal">
                        {/* Additional Price: {currency} {product.additional_price} */}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-lg flex  items-center font-medium">
            Shipping Address{" "}
            <PencilIcon
              onClick={() => {
                setIsAddressFormOpen(true);
              }}
              className=" ml-3 cursor-pointer w-[19px] "
            />
          </p>
          <form className="mt-5 gap-6 w-[95vw] sm:w-full overflow-x-hidden flex flex-col dark:bg-[#0E0F13] dark:border dark:border-white overflow-y-scroll p-1 h-[180px] justify-between">
            {addresses?.slice().map((address, index) => (
              <div
                key={address.id || index + address.zip_code}
                className={`relative ${addressesId === address.id
                  ? "border-2 border-blue-400 rounded-md"
                  : "border border-gray-300 rounded-md"
                  }`}
                onClick={() => {
                  setAddressesId(address.id);
                }}
              >
                <span
                  className={`absolute right-4 top-1/2 box-content block h-3 w-3 -translate-y-1/2 rounded-full border-8 ${addressesId === address.id
                    ? "border-blue-400"
                    : "border-gray-300 hidden"
                    } bg-white dark:bg-black`}
                ></span>
                <label
                  className="dark:text-[#f5f5f5] dark:bg-gray-800 flex cursor-pointer select-none rounded-md p-4"
                  htmlFor={`radio_${index}`}
                >
                  <div className="ml-5 flex items-center overflow-hidden overflow-ellipsis justify-between w-[85%]">
                    <div className="flex flex-col">
                      <span className="mt-2 font-semibold">
                        Address - {index + 1}
                      </span>
                      <p className="text-slate-500 dark:text-[#f5f5f5] text-sm leading-6">
                        {address.street1},{address.street2},
                        <span className="block">
                          {address.city},{address.state},
                        </span>
                        <span>{address.country}.</span>
                        <span className="inline">
                          zip code: {address.zip_code}
                        </span>
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </form>
        </div>
        <div className="sm:mt-10 h-fit w-[98vw] sm:w-full   bg-white dark:bg-[#0E0F13] dark:text-[#f5f5f5] px-4 pt-4 sm:pt-8 lg:mt-0">
          <p className="text-xl font-medium">Payment Details</p>
          <p className="text-gray-400">
            Complete your order by providing your payment details.
          </p>
          <div className="">
            <div className="mt-6 border-t border-b py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-[#f5f5f5]">
                  Subtotal
                </p>
                <p className="font-semibold text-gray-900 dark:text-[#f5f5f5]">
                  {currency}
                  {subTotal}
                </p>
              </div>
              {/* <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900 dark:text-[#f5f5f5]">
                  Shipping
                </p>
                <p className="font-semibold text-gray-900 dark:text-[#f5f5f5]">
                  {currency} 8.00
                </p>
              </div> */}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 dark:text-[#f5f5f5]">
                Total
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-[#f5f5f5]">
                {currency}
                {subTotal}
              </p>
            </div>
          </div>

          <div>
            <button
              className="mt-4 mb-8 w-full rounded-md bg-[#9747FF] px-6 py-3 font-medium text-white"
              onClick={PlaceOrder}
            >
              Place Order
            </button>

            <PaymentOptionsModal
              isOpen={isModalOpen}
              onClose={() => setModalOpen(false)}
              order_id={order_id}
              cartProducts={cartProducts}
            />
            {isAddressFormOpen && <AddressForm />}
          </div>
        </div>
      </div>
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <img src="/loading.svg" alt="Loading..." className="w-16 h-16" />
        </div>
      )}
    </>
  );
};

export default Checkout;
