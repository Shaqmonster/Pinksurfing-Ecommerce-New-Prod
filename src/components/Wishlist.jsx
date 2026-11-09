import { Fragment, useContext, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { FaHeart } from "react-icons/fa";
import { formatMoney } from "../utils/formatMoney";
import { isOutOfStock } from "../utils/cartStock";
import { useAccessToken } from "../hooks/useAccessToken";
import MediaImage from "./ui/MediaImage";

export default function Wishlist() {
  const accessToken = useAccessToken();
  const { isWishlistOpen, setIsWishlistOpen, currency } = useContext(authContext);
  const { setCartProducts, wishlistProducts, setWishlistProducts } =
    useContext(dataContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const GetWishlist = async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setWishlistProducts(response.data.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  useEffect(() => {
    if (!isWishlistOpen || !accessToken) return;
    GetWishlist();
  }, [isWishlistOpen, accessToken]);

  const AddtoCart = (productId) => {
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/add/${productId}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then(() => {
        toast.success("Added to Cart", { position: "top-right" });
        GetCartProducts();
      })
      .catch((error) => {
        console.error(error);
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.Status ||
            error.response?.data?.detail ||
            "An error occurred",
          { position: "top-right" }
        );
      });
  };

  const RemoveWishlistProduct = (productId) => {
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/remove/${productId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then(() => GetWishlist())
      .catch((error) => {
        console.error(error);
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.Status ||
            error.response?.data?.Err ||
            error.response?.data?.detail ||
            "An error occurred",
          { position: "top-right", autoClose: 3000 }
        );
      });
  };

  function htmlToText(html) {
    const doc = new DOMParser().parseFromString(html || "", "text/html");
    return doc.body.textContent || "";
  }

  const isEmpty = !loading && (!wishlistProducts || wishlistProducts.length === 0);

  return (
    <Transition.Root show={isWishlistOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={setIsWishlistOpen}>
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
                        Wishlist
                      </Dialog.Title>
                      <button
                        type="button"
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[var(--ps-muted)] hover:text-white hover:bg-[var(--ps-surf)]"
                        onClick={() => setIsWishlistOpen(false)}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4">
                      {loading ? (
                        <ul className="space-y-3" aria-busy="true">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <li key={i} className="flex gap-3">
                              <div className="ps-skeleton h-20 w-20 rounded-xl shrink-0" />
                              <div className="flex-1 space-y-2 py-1">
                                <div className="ps-skeleton h-4 w-3/4 rounded" />
                                <div className="ps-skeleton h-3 w-1/2 rounded" />
                                <div className="ps-skeleton h-8 w-32 rounded-lg" />
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : isEmpty ? (
                        <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-center px-4">
                          <FaHeart className="text-[var(--ps-dim)] text-4xl mb-3" />
                          <p className="text-base font-semibold text-white">Wishlist is empty</p>
                          <p className="mt-1 text-sm text-[var(--ps-muted)]">
                            Save products you love and find them here later.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              navigate("/shoppingMall");
                              setIsWishlistOpen(false);
                            }}
                            className="mt-5 min-h-[44px] px-5 rounded-[14px] bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-sm font-semibold text-white"
                          >
                            Browse shopping mall
                          </button>
                        </div>
                      ) : (
                        <ul role="list" className="divide-y divide-[var(--ps-brd)]">
                          {wishlistProducts.map((product) => (
                            <li key={product.id} className="flex gap-3 py-4">
                              <MediaImage
                                src={product.image1}
                                alt={product.name}
                                className="h-20 w-20 object-cover rounded-xl"
                                skeletonClassName="h-20 w-20 rounded-xl shrink-0 border border-[var(--ps-brd)]"
                                loading="lazy"
                              />
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <Link
                                  to={`/product/productDetail/${product.slug}?productId=${product.id}`}
                                  onClick={() => setIsWishlistOpen(false)}
                                  className="block"
                                >
                                  <h3 className="text-sm font-medium text-white line-clamp-2 hover:text-[var(--ps-purple-light)]">
                                    {product.name}
                                  </h3>
                                  <p className="text-xs text-[var(--ps-muted)] line-clamp-1 mt-0.5">
                                    {htmlToText(product.short_description)}
                                  </p>
                                </Link>
                                <p className="text-sm font-semibold text-white">
                                  {currency}
                                  {formatMoney(product.unit_price)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    disabled={isOutOfStock(product)}
                                    onClick={() => AddtoCart(product.id)}
                                    className="min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)] text-xs font-semibold text-white disabled:opacity-40"
                                  >
                                    Add to cart
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => RemoveWishlistProduct(product.id)}
                                    className="min-h-[40px] px-3 rounded-xl text-xs font-medium text-[var(--ps-muted)] hover:text-white"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
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
