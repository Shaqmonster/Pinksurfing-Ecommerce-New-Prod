import { Fragment, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { IoRemoveCircle } from "react-icons/io5";

export default function Cart() {
  const { isCartOpen, setIsCartOpen, currency, isDarkMode } =
    useContext(authContext);
  const { setCartProducts, cartProducts } = useContext(dataContext);
  const navigate = useNavigate();
  const [cookies, removeCookie] = useCookies([]);
  // fetch cart products --------------------------------------------------------
  const GetCartProducts = async () => {
    if (!cookies.token) {
      return navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((response) => {
        console.log(response.data);
        setCartProducts(response.data);
        // console.log(subTotal);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  useEffect(() => {
    GetCartProducts();
  }, [cookies, navigate, removeCookie]);

  //   remove product--------------------------------------------------------
  const RemoveCartProduct = (productId) => {
    // console.log(productId);
    // console.log(cookies.token);
    axios
      .post(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/customer/cart/remove/${productId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        // console.log(response.data);
        GetCartProducts();
      })
      .catch((error) => {
        // console.error(error);
        toast.error("An error occurred", {
          position: "top-center",
          autoClose: 3000,
        });
      });
  };
  //   increment product--------------------------------------------------------
  const IncrementQty = (productId) => {
    axios
      .post(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/customer/cart/increase-quantity/${productId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        GetCartProducts();
        console.log(response);
      })
      .catch((error) => {
        console.error(error);
        toast.error("An error occurred", {
          position: "top-center",
          autoClose: 3000,
        });
      });
  };
  //   decrement product--------------------------------------------------------
  const DecrementQty = (productId) => {
    axios
      .post(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/customer/cart/decrease-quantity/${productId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        // console.log(response);
        GetCartProducts();
      })
      .catch((error) => {
        console.error(error);
        toast.error("An error occurred", {
          position: "top-center",
          autoClose: 3000,
        });
      });
  };
  const subTotal = cartProducts?.reduce((acc, product) => {
    const priceToAdd =
      product.additional_price > 0
        ? Number(product.product.unit_price) + Number(product.additional_price)
        : product.product.unit_price;

    return acc + priceToAdd * product.quantity;
  }, 0);

  function htmlToText(html) {
    let doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  return (
    <Transition.Root show={isCartOpen} as={Fragment}>
      <Dialog
        as="div"
        className={`relative ${isDarkMode && "dark"}  z-50`}
        onClose={setIsCartOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70  bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0  overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto dark:bg-black  w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-black dark:border-l dark:border-white/70  shadow-xl">
                    <div className="flex-1 overflow-y-scroll   px-4 py-6 sm:px-6">
                      <div className="flex  items-start  justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-[#f5f5f5]">
                          Shopping cart
                        </Dialog.Title>
                        <div className="ml-3  flex h-7 items-center">
                          <button
                            type="button"
                            className="relative border-none outline-none -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={() => setIsCartOpen(false)}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8 ">
                        <div className="flow-root ">
                          <ul
                            role="list"
                            className="-my-6 divide-y  divide-gray-200"
                          >
                            {cartProducts.map((product, index) => (
                              <li
                                key={product.product.id + index}
                                className="flex items-center py-6 dark:border-white"
                              >
                                <div className=" h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                  <img
                                    src={`${product.product.image1}`}
                                    // src="/signin.jpg"
                                    alt={product.product.imageAlt}
                                    className="h-full w-full object-cover object-center"
                                  />
                                </div>

                                <div className="ml-4  flex flex-1 flex-col">
                                  <div>
                                    <div className="flex justify-between text-[15px] sm:text-base font-medium text-gray-900 dark:text-[#f5f5f5]">
                                    <h3 className="whitespace-normal">
                                        <a href={product.product.href}>
                                          {product.product.name.length > 17 ? `${product.product.name.slice(0, 17)}...` : product.product.name}
                                        </a>
                                      </h3>
                                      <p className="ml-4">
                                        {currency}{" "}
                                        {product.additional_price > 0
                                          ? Number(product.product.unit_price) +
                                            Number(product.additional_price)
                                          : product.product.unit_price}
                                      </p>
                                    </div>
                                    <p className="mt-1 text-[13.4px] sm:text-sm text-gray-500 whitespace-normal">
                                      {htmlToText(
                                        product.product.short_description
                                      ).slice(0, 10)}
                                      {product.product.short_description
                                        .length > 10
                                        ? "..."
                                        : ""}
                                    </p>
                                    <p className="text-[12.4px] sm:text-[13px] text-gray-500 whitespace-normal">
                                      {/* Additional Price: {currency}
                                    {product.additional_price > 0 ? product.additional_price : product.product.unit_price} */}
                                    </p>

                                    {/* )} */}
                                  </div>
                                  <div className="flex flex-1 items-end justify-between text-sm">
                                    <div className="text-gray-500">
                                      {/* Qty {product.quantity} */}
                                      {/* increment / decrement --------------------------------------------------------------------------------- */}
                                      <form className="max-w-xs flex items-center gap-2 mx-auto">
                                        <label
                                          htmlFor="counter-input"
                                          className=" block mb-1 text-xs font-medium text-gray-900 dark:text-[#f5f5f5]"
                                        >
                                          Qty:
                                        </label>
                                        <div className="relative flex items-center">
                                          <button
                                            onClick={() => {
                                              if (product.quantity === 1) {
                                                return RemoveCartProduct(
                                                  product.product.id
                                                );
                                              }
                                              DecrementQty(product.product.id);
                                            }}
                                            type="button"
                                            id="decrement-button"
                                            data-input-counter-decrement="counter-input"
                                            className="flex-shrink-0 bg-gray-200 dark:bg-black disabled:hidden  inline-flex items-center justify-center border border-gray-300 rounded-md h-5 w-5 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                                          >
                                            <svg
                                              className="w-2.5 h-2.5 text-gray-900 dark:text-[#f5f5f5] "
                                              aria-hidden="true"
                                              xmlns="http://www.w3.org/2000/svg"
                                              fill="none"
                                              viewBox="0 0 18 2"
                                            >
                                              <path
                                                stroke="currentColor"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M1 1h16"
                                              />
                                            </svg>
                                          </button>
                                          <span
                                            type="text"
                                            id="counter-input"
                                            className="flex-shrink-0 px-3 text-gray-900 dark:text-[#f5f5f5] border-0 bg-transparent text-sm font-normal focus:outline-none focus:ring-0 max-w-[2.5rem] text-center"
                                          >
                                            {product.quantity}
                                          </span>
                                          <button
                                            disabled={
                                              product.quantity ===
                                              product.product.quantity
                                            }
                                            onClick={() => {
                                              IncrementQty(product.product.id);
                                            }}
                                            type="button"
                                            id="increment-button"
                                            data-input-counter-increment="counter-input"
                                            className="flex-shrink-0 disabled:hidden  bg-gray-200 dark:bg-black  inline-flex items-center justify-center border border-gray-300 rounded-md h-5 w-5 focus:ring-gray-100 dark:focus:ring-gray-700 focus:ring-2 focus:outline-none"
                                          >
                                            <svg
                                              className="w-2.5 h-2.5 text-gray-900 dark:text-[#f5f5f5]"
                                              aria-hidden="true"
                                              xmlns="http://www.w3.org/2000/svg"
                                              fill="none"
                                              viewBox="0 0 18 18"
                                            >
                                              <path
                                                stroke="currentColor"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M9 1v16M1 9h16"
                                              />
                                            </svg>
                                          </button>
                                        </div>
                                      </form>{" "}
                                    </div>

                                    <div className="flex">
                                      <button
                                        onClick={() => {
                                          RemoveCartProduct(product.product.id);
                                        }}
                                        type="button"
                                        className="font-medium text-[13px] sm:text-sm text-[#fff] hover:text-purple-600"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                    {cartProducts.length === 0 && (
                      <div className=" w-full dark:bg-black h-full flex   flex-col items-center justify-center">
                        <img
                          className=" w-[60%] sm:w-[55%] object-contain "
                          src="/cartEmpty.svg"
                        />
                        <p className=" text-[16px] sm:text-[17px] dark:text-white mt-1 font-semibold">
                          Your Cart is Empty
                        </p>
                        <button
                          onClick={() => {
                            navigate("/shoppingMall/all");
                            setIsCartOpen(false);
                          }}
                          className=" bg-[#2d1e5f] px-3 text-sm sm:text-base py-1.5 rounded-md text-white mt-2"
                        >
                          Shop Now{" "}
                        </button>
                      </div>
                    )}

                    <div className="border-t border-gray-200 px-4 py-2 sm:py-6 sm:px-6">
                      <div className="flex justify-between text-base font-medium text-gray-900 dark:text-[#f5f5f5]">
                        <p>Subtotal</p>
                        <p>
                          {currency}
                          {subTotal}
                        </p>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        Shipping and taxes calculated at checkout.
                      </p>
                      <div className=" mt-2 sm:mt-6">
                        <Link to="/checkout">
                          <button
                            onClick={() => setIsCartOpen(false)}
                            disabled={cartProducts.length === 0}
                            className="flex items-center justify-center rounded-md border border-transparent bg-[#2d1e5f] disabled:bg-gray-500 w-full px-6 py-3 textsm sm:text-base font-medium text-white shadow-sm hover:bg-[#2d1e5f]"
                          >
                            Checkout
                          </button>
                        </Link>
                      </div>
                      <div className=" mt-2 sm:mt-6 flex justify-center text-center text-sm text-gray-500">
                        <p>
                          or
                          <button
                            type="button"
                            className="font-medium ml-1 text-[#6040ca]  hover:text-[#7b62cd]  "
                            onClick={() => setIsCartOpen(false)}
                          >
                            Continue Shopping
                            <span aria-hidden="true"> &rarr;</span>
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}