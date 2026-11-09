import { Fragment, useContext, useMemo, useState } from "react";
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
import MediaImage from "./ui/MediaImage";
import {
  cartBlocksCheckout,
  cartStockLimitMessage,
  getCartItemStockQty,
  getCartStockIssueMessage,
  isCartItemAtMaxStock,
  isCartItemOutOfStock,
} from "../utils/cartStock";

export default function Cart() {
  const { isCartOpen, setIsCartOpen, currency } = useContext(authContext);
  const { setCartProducts, cartProducts } = useContext(dataContext);
  const navigate = useNavigate();
  const accessToken = useAccessToken();
  const [loading, setLoading] = useState(true);
  const checkoutBlocked = useMemo(
    () => cartBlocksCheckout(cartProducts),
    [cartProducts]
  );
  const isEmpty = !loading && !cartProducts?.length;

  const GetCartProducts = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  const checkoutDisabled = isEmpty || checkoutBlocked || loading;

  return (
    <Transition.Root show={isCartOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsCartOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-out duration-250"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-[var(--ps-bg)] border-l border-[var(--ps-brd)] shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-[var(--ps-brd)] px-5 py-4">
                      <Dialog.Title className="text-base font-semibold text-white">
                        Cart
                      </Dialog.Title>
                      <button
                        type="button"
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[var(--ps-muted)] hover:text-white hover:bg-[var(--ps-surf)]"
                        onClick={() => setIsCartOpen(false)}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      {loading ? (
                        <ul className="flex-1 space-y-3 overflow-y-auto px-5 py-4" aria-busy="true">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <li key={i} className="flex gap-3">
                              <div className="ps-skeleton h-20 w-20 rounded-xl shrink-0" />
                              <div className="flex-1 space-y-2 py-1">
                                <div className="ps-skeleton h-4 w-3/4 rounded" />
                                <div className="ps-skeleton h-3 w-1/2 rounded" />
                                <div className="ps-skeleton h-8 w-28 rounded-lg" />
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : isEmpty ? (
                        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
                          <img
                            className="w-[50%] max-w-[180px] object-contain opacity-80 mb-4"
                            src="/cartEmpty.svg"
                            alt=""
                          />
                          <p className="text-base font-semibold text-white">Your cart is empty</p>
                          <p className="mt-1 text-sm text-[var(--ps-muted)]">
                            Add items from the shopping mall to check out.
                          </p>
                          <button
                            type="button"
                            onClick={handleContinueShopping}
                            className="mt-5 min-h-[44px] px-5 rounded-[14px] bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-sm font-semibold text-white"
                          >
                            Browse shopping mall
                          </button>
                        </div>
                      ) : (
                        <ul role="list" className="flex-1 divide-y divide-[var(--ps-brd)] overflow-y-auto px-5">
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
                                className="flex gap-3 py-4"
                              >
                                <MediaImage
                                  src={product.product.image1}
                                  alt={product.product.imageAlt || product.product.name}
                                  className="h-20 w-20 object-cover rounded-xl"
                                  skeletonClassName="h-20 w-20 rounded-xl shrink-0 border border-[var(--ps-brd)]"
                                  loading="lazy"
                                />

                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                  <div className="flex justify-between gap-3">
                                    <h3 className="text-sm font-medium text-white">
                                      <Link
                                        to={`/product/productDetail/${product.product.slug}?productId=${product.product.id}`}
                                        onClick={() => setIsCartOpen(false)}
                                        className="line-clamp-2 hover:text-[var(--ps-purple-light)]"
                                      >
                                        {product.product.name}
                                      </Link>
                                    </h3>
                                    <p className="shrink-0 text-sm font-semibold text-white">
                                      {currency}
                                      {formatMoney(unitPrice)}
                                    </p>
                                  </div>

                                  <p className="line-clamp-1 text-xs text-[var(--ps-muted)]">
                                    {htmlToText(product.product?.short_description ?? "")}
                                  </p>

                                  {isCartItemOutOfStock(product) && (
                                    <p className="text-xs font-medium text-red-400">
                                      Out of stock — remove to checkout
                                    </p>
                                  )}

                                  <div className="mt-2 flex items-center justify-between gap-2">
                                    <div className="inline-flex items-center rounded-xl border border-[var(--ps-brd)] bg-[var(--ps-surf)]">
                                      <button
                                        onClick={() => {
                                          if (product.quantity === 1) {
                                            RemoveCartProduct(product.product.id);
                                            return;
                                          }
                                          DecrementQty(product.product.id);
                                        }}
                                        type="button"
                                        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center text-white"
                                        aria-label="Decrease quantity"
                                      >
                                        −
                                      </button>
                                      <span className="min-w-[2rem] text-center text-sm text-white">
                                        {product.quantity}
                                      </span>
                                      <button
                                        onClick={() => {
                                          if (isAtMaxStock) {
                                            toast.info(
                                              stockQty != null
                                                ? cartStockLimitMessage(stockQty)
                                                : "Unable to increase quantity for this item",
                                              { position: "top-center", autoClose: 2500 }
                                            );
                                            return;
                                          }
                                          IncrementQty(product.product.id);
                                        }}
                                        type="button"
                                        disabled={isAtMaxStock}
                                        className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center text-white disabled:opacity-30"
                                        aria-label="Increase quantity"
                                      >
                                        +
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => RemoveCartProduct(product.product.id)}
                                      type="button"
                                      className="text-xs font-medium text-[var(--ps-purple-light)] hover:text-white"
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

                    <div className="shrink-0 border-t border-[var(--ps-brd)] px-5 py-5 space-y-3">
                      <div className="flex justify-between text-sm font-medium text-white">
                        <p>Subtotal</p>
                        <p>
                          {currency}
                          {formatMoney(subTotal ?? 0)}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--ps-muted)]">
                        Shipping and taxes calculated at checkout.
                      </p>
                      {checkoutBlocked && !isEmpty && (
                        <p className="text-sm text-red-400">
                          {getCartStockIssueMessage(cartProducts)}
                        </p>
                      )}
                      {checkoutDisabled ? (
                        <button
                          type="button"
                          disabled
                          className="flex w-full min-h-[48px] cursor-not-allowed items-center justify-center rounded-[14px] bg-[var(--ps-surf)] text-sm font-semibold text-[var(--ps-dim)]"
                        >
                          Checkout
                        </button>
                      ) : (
                        <Link
                          to="/checkout"
                          onClick={() => setIsCartOpen(false)}
                          className="flex w-full min-h-[48px] items-center justify-center rounded-[14px] bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-sm font-semibold text-white"
                        >
                          Checkout
                        </Link>
                      )}
                      <button
                        type="button"
                        className="w-full text-center text-sm text-[var(--ps-muted)] hover:text-white"
                        onClick={handleContinueShopping}
                      >
                        Continue shopping
                      </button>
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
