import { Fragment, useContext } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { authContext } from "../../context/authContext";
import { dataContext } from "../../context/dataContext";
import { FaHeart, FaHeartBroken } from "react-icons/fa";

export default function ProfileWishlist() {
    const { isWishlistOpen, isDarkMode, setIsWishlistOpen } =
        useContext(authContext);
    const { setCartProducts } = useContext(dataContext);
    const { wishlistProducts, setWishlistProducts } = useContext(dataContext);
    const { currency } = useContext(authContext);
    const navigate = useNavigate();
    const [cookies, removeCookie] = useCookies([]);
    const [subTotal, setSubTotal] = useState(0);
    const GetWishlist = async () => {
        if (!cookies.access_token) {
            navigate("/signin");
        }
        axios
            .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cookies.access_token}`,
                },
            })
            .then((response) => {
                // console.log(response.data.items);
                setWishlistProducts(response.data.items);
                // console.log(wishlistProducts);
            })
            .catch((error) => {
                console.error(error);
            });
    };

    // const additionalPrice = 2;
    // fetch cart products --------------------------------------------------------
    const GetCartProducts = async () => {
        if (!cookies.access_token) {
            navigate("/signin");
        }
        axios
            .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${cookies.access_token}`,
                },
            })
            .then((response) => {
                setCartProducts(response.data);
                // console.log(subTotal);
            })
            .catch((error) => {
                console.error(error);
            });
    };
    useEffect(() => {
        GetWishlist();
    }, [cookies, navigate, removeCookie]);
    const AddtoCart = (productId) => {
        // console.log(cookies.access_token);
        axios
            .post(
                `${import.meta.env.VITE_SERVER_URL
                }/api/customer/cart/add/${productId}/`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${cookies.access_token}`,
                    },
                }
            )
            .then((response) => {
                // console.log(response.data);
                toast.success("Added to Cart", {
                    position: "top-right",
                });
                GetCartProducts();
            })
            .catch((error) => {
                console.error(error);
                // Handle the error here
                toast.error(error.response.data.message || error.response.data.Status || error.response.data.detail || "An error occurred", {
                    position: "top-right",
                });
            });
    };
    //   remove product--------------------------------------------------------
    const RemoveWishlistProduct = (productId) => {
        // console.log(productId);
        // console.log(cookies.access_token);
        axios
            .post(
                `${import.meta.env.VITE_SERVER_URL
                }/api/customer/wishlist/remove/${productId}`,
                {},
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${cookies.access_token}`,
                    },
                }
            )
            .then((response) => {
                // console.log(response.data);
                // setWishlistProducts(response.data);
                // console.log(products);
                GetWishlist();
            })
            .catch((error) => {
                console.error(error);
                // Handle the error here
                toast.error(error.response.data.message ||
                    error.response.data.Status ||
                    error.response.data.Err ||
                    error.response.data.detail ||
                    "An error occurred", {
                    position: "top-right",
                    autoClose: 3000
                });
            });
    };

    function htmlToText(html) {
        let doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
    }

    return (
        <div className=" overflow-hidden font-sen">
            <div className=" inset-0 overflow-hidden border border-gray-500  rounded-lg">
                <div className="  inset-y-0 right-0 flex max-w-full pl-10">

                        <div className="  w-screen max-w-md">
                            <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-[#0E0F13] shadow-xl">
                                <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-6 sm:px-6">
                                    <div className="flex items-start justify-between">
                                        <div className="text-lg font-medium text-gray-900 dark:text-[#f5f5f5]">
                                            My Wishlist
                                        </div>

                                    </div>

                                    <div className=" ">
                                        <div className="flow-root ">
                                            <ul role="list" className="  pt-3 sm:pt-5">
                                                {wishlistProducts?.map((product) => {
                                                    return (
                                                        <li
                                                            key={product.id}
                                                            className="flex  py-1 sm:py-2"
                                                        >
                                                            <div className=" w-full">
                                                                <div className="flex max-w-md h-[150px] sm:h-[200px] w-full bg-white dark:bg-[#0E0F13] shadow-md pt-4 px-4 shadow-gray-500 rounded-lg overflow-hidden">
                                                                    <img
                                                                        className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200"
                                                                        src={`${product.image1}`}
                                                                    // src="https://images.unsplash.com/photo-1494726161322-5360d4d0eeae?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=334&q=80"
                                                                    />
                                                                    <div className="w-2/3 p-2 pt-0">
                                                                        <Link
                                                                            to={`/product/productDetail/${product.slug}?productId=${product.id}`}
                                                                            onClick={() => setIsWishlistOpen(false)}
                                                                        >
                                                                            <h1 className="text-gray-900 dark:text-[#f5f5f5] font-bold text-base sm:text-sm">
                                                                                {product.name.length > 17 ? `${product.name.slice(0, 17)}...` : product.name}
                                                                            </h1>
                                                                            <p className=" text-ellipsis h-[20px] dark:text-[#f5f5f5] text-[13px] sm:text-sm overflow-hidden text-gray-600">
                                                                                {htmlToText(
                                                                                    product.short_description
                                                                                ).slice(0, 10)}
                                                                                {product.short_description.length > 10
                                                                                    ? "..."
                                                                                    : ""}
                                                                            </p>
                                                                        </Link>
                                                                        <div className="flex item-center sm:mt-2">
                                                                            <svg
                                                                                className="w-4 h-4  sm:w-5 sm:h-5 fill-current text-gray-700 dark:text-[#f5f5f5]"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                                                                            </svg>
                                                                            <svg
                                                                                className="w-4 h-4  sm:w-5 sm:h-5 fill-current text-gray-700 dark:text-[#f5f5f5]"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                                                                            </svg>
                                                                            <svg
                                                                                className="w-4 h-4  sm:w-5 sm:h-5 fill-current text-gray-700 dark:text-[#f5f5f5]"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                                                                            </svg>
                                                                            <svg
                                                                                className="w-4 h-4  sm:w-5 sm:h-5 fill-current text-gray-500"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                                                                            </svg>
                                                                            <svg
                                                                                className="w-4 h-4  sm:w-5 sm:h-5 fill-current text-gray-500"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="flex flex-col item-center justify-between sm:mt-1">
                                                                            <h1 className="text-gray-700 dark:text-[#f5f5f5] font-semibold text-base sm:text-md">
                                                                                {currency}
                                                                                {product.unit_price}
                                                                            </h1>
                                                                            <div className=" w-full flex sm:gap-1 items-center sm:mt-2 ">
                                                                                <button
                                                                                    disabled={product.quantity === 0}
                                                                                    onClick={() => {
                                                                                        AddtoCart(product.id);
                                                                                    }}
                                                                                    className=" px-2 sm:px-3 disabled:bg-gray-200 dark:disabled:bg-gray-500 dark:disabled:text-gray-400 disabled:text-gray-700 py-1 sm:py-2 bg-[#FFD814]  text-black text-[10px] lg:text-[11px] font-bold uppercase rounded"
                                                                                >
                                                                                    Add to Cart
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        RemoveWishlistProduct(
                                                                                            product.id
                                                                                        );
                                                                                    }}
                                                                                    className="px-1.5 sm:px-3 py-2 text-purple-800 dark:text-[#fff] text-[11px] sm:text-[13.4px] font-semibold uppercase rounded"
                                                                                >
                                                                                    Remove
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <p
                                                                className={` ${!wishlistProducts ? "block" : "hidden"
                                                                    } w-full h-full flex items-center justify-center pt-5 top-3 left-3 z-50 text-black/80`}
                                                            >
                                                                your wishlist is empty
                                                            </p>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    </div>
                                    {wishlistProducts.length === 0 && (
                                        <div className=" w-full h-[90%] flex flex-col items-center justify-center">
                                            <FaHeart className=" text-red-500 text-[13vw] lg:text-[80px] " />
                                            <p className=" text-[16px] sm:text-[19px] dark:text-[#f5f5f5] mt-1 font-semibold">
                                                Your Wishlist is Empty
                                            </p>
                                            <button
                                                onClick={() => {
                                                    navigate("/shoppingMall/all");
                                                    setIsWishlistOpen(false);
                                                }}
                                                className=" bg-[#2d1e5f] px-3 text-sm sm:text-base py-1.5 rounded-md text-white mt-2"
                                            >
                                                Shop Now{" "}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                </div>
            </div>
        </div>
    );
}