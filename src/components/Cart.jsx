import { Fragment, useContext, useMemo } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { useAccessToken } from "../hooks/useAccessToken";
import { formatMoney } from "../utils/formatMoney";
import {
  cartBlocksCheckout,
  cartStockLimitMessage,
  getCartItemStockQty,
  getCartStockIssueMessage,
  isCartItemAtMaxStock,
  isCartItemOutOfStock,
} from "../utils/cartStock";

export default function Cart() {
  const { isCartOpen, setIsCartOpen, currency, isDarkMode } =
    useContext(authContext);
  const { setCartProducts, cartProducts } = useContext(dataContext);
  const navigate = useNavigate();
  const accessToken = useAccessToken();
  const checkoutBlocked = useMemo(
    () => cartBlocksCheckout(cartProducts),
    [cartProducts]
  );
  const isEmpty = !cartProducts?.length;

  const GetCartProducts = async () => {
    if (!accessToken) return;
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const payload = response.data;
      setCartProducts(Array.isArray(payload) ? payload : payload?.items || []);
    } catch (error) {
      console.error(error);
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setCartProducts([]);
        return;
      }
      toast.error("Unable to load cart", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  useEffect(() => {
    if (!isCartOpen || !accessToken) return;
    GetCartProducts();
  }, [isCartOpen, accessToken]);

  const RemoveCartProduct = (productId) => {
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/remove/${productId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then(() => GetCartProducts())
      .catch((error) => {
        toast.error(
          error.response?.data?.detail ||
            "An error occurred while removing product from cart",
          { position: "top-center", autoClose: 3000 }
        );
      });
  };

  const IncrementQty = (productId) => {
    if (!accessToken) {
      toast.error("Please sign in to update your cart", {
        position: "top-center",
      });
      return;
    }
    const cartItem = cartProducts?.find(
      (item) => String(item.product?.id) === String(productId)
    );
    if (cartItem && isCartItemAtMaxStock(cartItem)) {
      const stockQty = getCartItemStockQty(cartItem);
      toast.info(
        stockQty != null
          ? cartStockLimitMessage(stockQty)
          : "Unable to increase quantity for this item",
        { position: "top-center", autoClose: 2500 }
      );
      return;
    }
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/increase-quantity/${productId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then(() => GetCartProducts())
      .catch((error) => {
        GetCartProducts();
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.Status ||
            error.response?.data?.detail ||
            "An error occurred",
          { position: "top-center", autoClose: 3000 }
        );
      });
  };

  const DecrementQty = (productId) => {
    if (!accessToken) {
      toast.error("Please sign in to update your cart", {
        position: "top-center",
      });
      return;
    }
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/decrease-quantity/${productId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then(() => GetCartProducts())
      .catch((error) => {
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.Status ||
            error.response?.data?.detail ||
            "An error occurred",
          { position: "top-center", autoClose: 3000 }
        );
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
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }

  const handleContinueShopping = () => {
    setIsCartOpen(false);
    navigate("/shoppingMall");
  };

  const checkoutDisabled = isEmpty || checkoutBlocked;

  return (
    <Transition.Root show={isCartOpen} as={Fragment}>
      <Dialog
        as="div"
        className={`relative ${isDarkMode ? "dark" : ""} z-50`}
        onClose={setIsCartOpen}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white dark:bg-[#0E0F13] dark:border-l dark:border-white/10 shadow-xl">
                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-white/10">
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-[#f5f5f5]">
                        Shopping cart
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-white"
                        onClick={() => setIsCartOpen(false)}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      {isEmpty ? (
                        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
                          <img
                            className="w-[55%] max-w-[220px] object-contain opacity-90"
                            src="/cartEmpty.svg"
                            alt=""
                          />
                          <p className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                            Your Cart is Empty
                          </p>
                        </div>
                      ) : (
                        <ul
                          role="list"
                          className="flex-1 divide-y divide-gray-200 overflow-y-auto px-6 dark:divide-white/10"
                        >
                          {cartProducts.map((product, index) => {
                            const stockQty = getCartItemStockQty(product);
                            const isAtMaxStock = isCartItemAtMaxStock(product);
                            const unitPrice =
                              product.additional_price > 0
                                ? Number(product.product.unit_price) +
                                  Number(product.additional_price)
                                : Number(product.product.unit_price);

                            return (
                              <li
                                key={`${product.product.id}-${index}`}
                                className="flex gap-4 py-5"
                              >
                                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                                  <img
                                    src={product.product.image1}
                                    alt={product.product.imageAlt || product.product.name}
                                    className="h-full w-full object-cover object-center"
                                  />
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col">
                                  <div className="flex justify-between gap-3">
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-[#f5f5f5]">
                                      <Link
                                        to={`/product/productDetail/${product.product.slug}?productId=${product.product.id}`}
                                        onClick={() => setIsCartOpen(false)}
                                        className="line-clamp-2 hover:text-[#8b5cf6]"
                                      >
                                        {product.product.name}
                                      </Link>
                                    </h3>
                                    <p className="shrink-0 text-sm font-medium text-gray-900 dark:text-[#f5f5f5]">
                                      {currency} {formatMoney(unitPrice)}
                                    </p>
                                  </div>

                                  <p className="mt-1 line-clamp-1 text-xs text-gray-500 dark:text-[#a8a8b3]">
                                    {htmlToText(
                                      product.product?.short_description ?? ""
                                    )}
                                  </p>

                                  {isCartItemOutOfStock(product) && (
                                    <p className="mt-1 text-xs font-medium text-red-400">
                                      Out of stock — remove to checkout
                                    </p>
                                  )}

                                  <div className="mt-3 flex items-end justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 dark:text-[#a8a8b3]">
                                        Qty:
                                      </span>
                                      <div className="flex items-center">
                                        <button
                                          onClick={() => {
                                            if (product.quantity === 1) {
                                              RemoveCartProduct(product.product.id);
                                              return;
                                            }
                                            DecrementQty(product.product.id);
                                          }}
                                          type="button"
                                          className="inline-flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-gray-100 dark:border-white/10 dark:bg-[#1a1a24] dark:hover:bg-[#232329]"
                                        >
                                          <svg
                                            className="h-2.5 w-2.5 text-gray-900 dark:text-[#f5f5f5]"
                                            fill="none"
                                            viewBox="0 0 18 2"
                                          >
                                            <path
                                              stroke="currentColor"
                                              strokeLinecap="round"
                                              strokeWidth="2"
                                              d="M1 1h16"
                                            />
                                          </svg>
                                        </button>
                                        <span className="min-w-[2rem] px-2 text-center text-sm text-gray-900 dark:text-[#f5f5f5]">
                                          {product.quantity}
                                        </span>
                                        <button
                                          onClick={() => {
                                            if (isAtMaxStock) {
                                              toast.info(
                                                stockQty != null
                                                  ? cartStockLimitMessage(stockQty)
                                                  : "Unable to increase quantity for this item",
                                                {
                                                  position: "top-center",
                                                  autoClose: 2500,
                                                }
                                              );
                                              return;
                                            }
                                            IncrementQty(product.product.id);
                                          }}
                                          type="button"
                                          disabled={isAtMaxStock}
                                          className="inline-flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/10 dark:bg-[#1a1a24] dark:hover:bg-[#232329]"
                                        >
                                          <svg
                                            className="h-2.5 w-2.5 text-gray-900 dark:text-[#f5f5f5]"
                                            fill="none"
                                            viewBox="0 0 18 18"
                                          >
                                            <path
                                              stroke="currentColor"
                                              strokeLinecap="round"
                                              strokeWidth="2"
                                              d="M9 1v16M1 9h16"
                                            />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>

                                    <button
                                      onClick={() =>
                                        RemoveCartProduct(product.product.id)
                                      }
                                      type="button"
                                      className="text-xs font-medium text-[#8b5cf6] hover:text-[#a78bfa]"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="shrink-0 border-t border-gray-200 px-6 py-6 dark:border-white/10">
                      <div className="flex justify-between text-base font-medium text-gray-900 dark:text-[#f5f5f5]">
                        <p>Subtotal</p>
                        <p>
                          {currency}
                          {formatMoney(subTotal ?? 0)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 dark:text-[#a8a8b3]">
                        Shipping and taxes calculated at checkout.
                      </p>
                      {checkoutBlocked && !isEmpty && (
                        <p className="mt-2 text-sm text-red-400">
                          {getCartStockIssueMessage(cartProducts)}
                        </p>
                      )}
                      <div className="mt-6">
                        {checkoutDisabled ? (
                          <button
                            type="button"
                            disabled
                            className="flex w-full cursor-not-allowed items-center justify-center rounded-md bg-gray-400 px-6 py-3 text-sm font-medium text-white dark:bg-[#3a3a44]"
                          >
                            Checkout
                          </button>
                        ) : (
                          <Link to="/checkout" onClick={() => setIsCartOpen(false)}>
                            <button
                              type="button"
                              className="flex w-full items-center justify-center rounded-md bg-[#6A1BBE] px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#5e2d92]"
                            >
                              Checkout
                            </button>
                          </Link>
                        )}
                      </div>
                      <div className="mt-6 flex justify-center text-center text-sm text-gray-500 dark:text-[#a8a8b3]">
                        <p>
                          or{" "}
                          <button
                            type="button"
                            className="font-medium text-[#8b5cf6] transition-colors hover:text-[#a78bfa]"
                            onClick={handleContinueShopping}
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
