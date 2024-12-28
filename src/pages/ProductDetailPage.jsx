import React, { useContext } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import Header from "../components/Header";
import axios from "axios";
import { FaCopy, FaFacebook, FaFontAwesome, FaPinterest, FaShare, FaTwitter } from "react-icons/fa";
import OrderConfirm from "../components/OrderConfirm";
import { FaHeart, FaStar, FaTruck } from "react-icons/fa";
import { dataContext } from "../context/dataContext";
import { authContext } from "../context/authContext";
import { IoClose, IoStarOutline, IoCart } from "react-icons/io5";
import shareImage from "/media/share.png";
import ProductDetailReviewSection from "../components/ProductPageComponents/ProductDetail-ReviewSection";
import YouMightAlsoLike from "../components/ProductPageComponents/YouMightAlsoLike";
import { Helmet } from "react-helmet";
import ImageZoom from "../components/ProductPageComponents/ZoomImage";
import parse from "html-react-parser";
import { data } from "autoprefixer";
import Stars from '../components/Stars'


const ProductDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cookies, removeCookie] = useCookies([]);
  const [orderConfirm, setorderConfirm] = useState(false);
  const [product, setProduct] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState("");
  const [updatedPrice, setUpdatedPrice] = useState(null);
  const attributeArrays = {};
  const [attributeArrays2, setAttributeArray2] = useState({});
  const [viewMainImg, setViewMainImg] = useState(false);
  const [productQty, setProductQty] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [loading, setLoading] = useState(false);
  const [zoomCoordinates, setZoomCoordinates] = useState({ x: 0, y: 0 });
  const searchParams = new URLSearchParams(location.search);
  const rawProductId = searchParams.get("productId");
  const [averageRating, setAverageRating] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");

  // Remove trailing slash from productId, if any
  const productId = rawProductId ? rawProductId.replace(/\/$/, "") : rawProductId;
  const { handleError, handleSuccess } = useContext(dataContext);
  const {
    setCartProducts,
    cartProducts,
    setWishlistProducts,
    wishlistProducts,
    additionalAttribute,
    setAdditionalAttribute,
  } = useContext(dataContext);
  const {
    user,
    setSingleOrderProduct,
    setIsSingleOrderFormOpen,
    setIsProfileOpen,
    currency,
  } = useContext(authContext);

  const handleCopy = () => {
    const currentURL = window.location.href;

    navigator.clipboard.writeText(currentURL).then(() => {
      toast.success("Product URL copied to clipboard", {
        position: "top-right",
      });
    });
  };
  const handleShareClick = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title,
        url: window.location.href,
      })
        .then(() => console.log('Product shared successfully!'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
      toast.error('Sharing is not supported in this browser.');
    }
  };
  useEffect(() => {
    // Remove trailing slash from URL if present
    if (location.pathname.endsWith("/")) {
      const newPath = location.pathname.slice(0, -1) + location.search;
      navigate(newPath, { replace: true });
    }
  }, [location, navigate]);

  const handleMouseMove = (e) => {
    setViewMainImg(true);
    const { left, top, width, height } = e.target.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomCoordinates({ x, y });
  };

  // fetch cart products --------------------------------------------------------
  const GetCartProducts = async () => {
    if (cookies.token) {
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
        })
        .catch((error) => {
          handleError("Unable to retrieve Cart Products")
          console.error(error);
        });
    }
  };
  const GetWishlist = async () => {
    if (cookies.token) {
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((response) => {
          setWishlistProducts(response.data.items);
        })
        .catch((error) => {
          handleError("Unable to retrieve Wishlist")
          console.error(error);
        });
    }
  };

  const AddtoCart = () => {
    const additionalPrice = Object.values(selectedAttributes).reduce(
      (total, attr) => total + (attr.additional_price || 0),
      0
    );
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL
        }/api/customer/cart/add/${productId}/`,
        {
          additional_price: additionalPrice,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        toast.success("Added to Cart", {
          position: "top-right",
        });
        GetCartProducts();
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response.data.message || error.response.data.Status || error.response.data.detail || "An error occurred", {
          position: "top-right",
        });
      });
  };
  //   remove product--------------------------------------------------------
  const RemoveWishlistProduct = async (productId) => {
    const heartElement = document.getElementById(`heart-${productId}`);
    heartElement.classList.remove("text-red-500");
    heartElement.classList.add("text-gray-400");

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/remove/${productId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      );
      GetWishlist();
      toast.success("Removed from wishlist", {
        position: "top-right",
      });
    } catch (error) {
      console.error(error);
      heartElement.classList.add("text-red-500");
      heartElement.classList.remove("text-gray-400");
      toast.error(error.response.data.message ||
        error.response.data.Status ||
        error.response.data.Err ||
        error.response.data.detail ||
        "An error occurred", {
        position: "top-right",
      });
    }
  };
  const AddtoWishlist = (productId) => {
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL
        }/api/customer/wishlist/add/${productId}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        GetWishlist();
        toast.success("Added to wishlist", {
          position: "top-right",
        });
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response.data.message || error.response.data.Status || error.response.data.detail || "An error occurred", {
          position: "top-right",
        });
      });
  };
  useEffect(() => {
    const GetProductData = async () => {
      try {
        setLoading(true);
        const productResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL
          }/api/product/product/${productId}/`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setProduct(productResponse.data.Products);
        setLoading(false);
        setActiveImage(productResponse.data.Products.image);

        productResponse.data.Products.attributes.forEach((attribute) => {
          const { name, value, additional_price } = attribute;
          if (name != "") {
            if (!attributeArrays[name]) {
              attributeArrays[name] = [];
            }
            const isValueUnique = !attributeArrays[name].some(
              (item) => item.value === value
            );
            if (isValueUnique) {
              attributeArrays[name].push({ value, additional_price });
            }
          }
        });

        setAttributeArray2(attributeArrays);

        if (cookies.token) {
          const addressId = user.addresses[0]?.id;
          const ratesResponse = await axios.get(
            `${import.meta.env.VITE_SERVER_URL
            }/api/shipping/fetch-rates/${productId}/${addressId}/`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cookies.token}`,
              },
            }
          );
          console.log("Rates:", ratesResponse.data);
        }
      } catch (error) {
        console.error(error);
      }
    };

    GetProductData();
    GetCartProducts();
    const productInCart = cartProducts.find(
      (product) => product.product.id === productId
    );

    if (productInCart) {
      setProductQty(productInCart.quantity);
    }
  }, [cookies, navigate, removeCookie]);

  useEffect(() => {
    const getProductRatings = async (productId) => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/ratings/get-ratings/${productId}/`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const ratingsReviews = response.data.ratings_reviews;
        setReviews(ratingsReviews);

        if (ratingsReviews.length > 0) {
          const totalRating = ratingsReviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          const avgRating = totalRating / ratingsReviews.length;
          console.log("Average rating:", avgRating);
          setAverageRating(avgRating);
        } else {
          setAverageRating(0);
        }
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
    };
    getProductRatings(product.id);
  }, [product.id])

  useEffect(() => {
    const getProducts = async () => {
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/product/all-products/`, {
          headers: {
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log(response.data.Products);
          setAllProducts(response.data.Products);
        })
        .catch((error) => {
          console.error(error);
        });
    };
    getProducts();
  }, []);

  const handleAttributeSelection = (name, attribute) => {
    setSelectedAttributes((prevState) => {
      if (prevState[name]?.value === attribute.value) {
        const { [name]: _, ...rest } = prevState;
        return rest;
      } else {
        return {
          ...prevState,
          [name]: attribute,
        };
      }
    });
    console.log(name, attribute);
  };

  const discountPercentage = (
    ((product.mrp -
      Object.values(selectedAttributes).reduce(
        (total, attr) => total + (attr.additional_price || 0),
        Number(product.unit_price)
      )) /
      product.mrp) *
    100
  ).toFixed(2);

  function htmlToText(html) {
    let doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  }
  const handleWishlistClick = async () => {
    if (!user) {
      toast.error("You are not Signed In", {
        position: "top-right",
      });
      sessionStorage.setItem("redirectAfterLogin", window.location.href);
      setIsProfileOpen(true);
      setTimeout(() => {
        setIsProfileOpen(false);
      }, 10000);
      return;
    }

    const isInWishlist = wishlistProducts.find((i) => i.id === product.id);
    const heartElement = document.getElementById(`heart-${product.id}`);

    heartElement.classList.add("text-red-500");
    heartElement.classList.remove("text-gray-400");

    try {
      if (isInWishlist) {
        await RemoveWishlistProduct(product.id);
      } else {
        await AddtoWishlist(product.id);
      }
    } catch (error) {
      // Revert the color if there's an error
      heartElement.classList.remove("text-red-500");
      heartElement.classList.add("text-gray-400");
      toast.error("An error occurred", {
        position: "top-right",
      });
    }
  };
  useEffect(() => {
    if (product.image1) {
      setActiveImage(product.image1);
    }
  }, [product]);

  useEffect(() => {
    // Safely get the current URL on the client-side
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);

  return (
    <>
      {orderConfirm && <OrderConfirm />}
      {product && product.meta_title && (
        <Helmet>
          <title>{product.meta_title}</title>
          {product.short_description && (
            <meta
              name="description"
              content={htmlToText(product.short_description)}
            />
          )}
          {product.tags && <meta name="keywords" content={product.tags} />}
        </Helmet>
      )}
      <section className=" pb-2 bg-white dark:bg-[#0E0F13] font-poppins min-h-screen h-max">
        {viewMainImg && (
          <ImageZoom
            imageUrl={
              activeImage ||
              product.image1 ||
              "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
            }
            x={zoomCoordinates.x}
            y={zoomCoordinates.y}
          />
        )}
        {loading ? (
          <div className=" lg:col-span-3 2xl:col-span-4 flex items-center justify-center">
            <img
              src="/loading.svg"
              alt="loading"
              className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
            />
          </div>
        ) : (
          <div className="bg-gray-100 dark:bg-[#0E0F13] dark:text-[#f5f5f5] py-1 sm:py-8 h-full">
            <div className="max-w-screen-2xl flex flex-col mx-auto px-4 sm:px-6 lg:px-10 2xl:px-24">
              <div className="flex flex-col md:flex-row -mx-4">
                <div className="md:flex-1 px-4">
                  <div className="h-fit sm:min-h-[460px] sm:h-fit rounded-lg mb-4 ">
                    <div className="p-4 border border-[#D5C1EE]">
                      <img
                        className="w-full min-h-[320px] max-h-[320px] sm:h-[87%] object-contain cursor-pointer"
                        src={
                          activeImage ||
                          product.image1
                        }
                        alt="Product Image"
                        onMouseOut={() => {
                          setViewMainImg(false);
                        }}
                        onMouseMove={handleMouseMove}
                      />
                    </div>
                    <div className="flex items-center gap-1 pt-4 border-gray-400 h-[80px] sm:h-[80px]">
                      {product.image1 && (
                        <img
                          onClick={() => setActiveImage(product.image1)}
                          className={`w-[12%] sm:w-[12%] lg:w-[12%] h-full object-contain p-2 cursor-pointer ${activeImage === product.image1
                            ? "border-[2px] border-[#8B33FE66] " // Violet border for active image
                            : "border-[2px] border-[#D5C1EE]" // White border for inactive image
                            }`}
                          src={product.image1}
                          alt="Product Image"
                        />
                      )}
                      {product.image2 && (
                        <img
                          onClick={() => setActiveImage(product.image2)}
                          className={`w-[12%] sm:w-[12%] lg:w-[12%] h-full object-contain p-2 cursor-pointer ${activeImage === product.image2
                            ? "border-[2px] border-[#8B33FE66] " // Violet border for active image
                            : "border-[2px] border-[#D5C1EE]" // White border for inactive image
                            }`}
                          src={product.image2}
                          alt="Product Image"
                        />
                      )}
                      {product.image3 && (
                        <img
                          onClick={() => setActiveImage(product.image3)}
                          className={`w-[12%] sm:w-[12%] lg:w-[12%] h-full object-contain  p-2cursor-pointer ${activeImage === product.image3
                            ? "border-[2px] border-[#8B33FE66] " // Violet border for active image
                            : "border-[2px] border-[#D5C1EE]" // White border for inactive image
                            }`}
                          src={product.image3}
                          alt="Product Image"
                        />
                      )}
                      {product.image4 && (
                        <img
                          onClick={() => setActiveImage(product.image4)}
                          className={`w-[12%] sm:w-[12%] lg:w-[12%] h-full object-contain p-2 cursor-pointer ${activeImage === product.image4
                            ? "border-[2px] border-[#8B33FE66] " // Violet border for active image
                            : "border-[2px] border-[#D5C1EE]" // White border for inactive image
                            }`}
                          src={product.image4}
                          alt="Product Image"
                        />
                      )}
                    </div>
                  </div>
                </div>
                <div className="md:flex-1 px-4 relative z-10 dark:bg-[#0E0F13] text-xs">
                  <div className="flex  gap-2 mt-2">
                    <Stars stars={averageRating} />
                    <p className="">{averageRating} Star Rating ({reviews.length} User feedback)</p>
                  </div>

                  <h2
                    className="text-[20px] font-public-sans font-[400] text-black dark:text-[#f5f5f5] leading-[28px] mb-2 sm:text-[22px] sm:leading-[30px]"
                  >
                    {product.name}

                  </h2>
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
                  <div className="flex justify-start py-2 items-center">
                    <div className="flex flex-wrap justify-between max-w-md w-full rounded-lg">
                      {/* Left Section */}
                      <div className="w-1/2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold text-black dark:text-white">Sku:</span> A264671
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold text-black dark:text-white">Brand:</span>{" "}
                          <span className="text-black dark:text-white">{product.brand_name}</span>
                        </p>
                      </div>
                      {/* Right Section */}
                      <div className="w-1/2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold text-black dark:text-white">Availability:</span>{" "}
                          {product.quantity === 0 ? (
                            <span className="text-red-500 dark:text-red-400">Out of Stock</span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">In Stock</span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold text-black dark:text-white">Category:</span>{" "}
                          <span className="text-black dark:text-white">{product.category?.name}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col mb-1 sm:mb-4">
                    <div className="flex mr-4 pt-4 items-center">
                      {/* Price */}
                      <span
                        className="text-[1.5rem] md:text-[1.7rem] 2xl:text-[1.9rem] font-semibold mr-1"
                        style={{
                          fontFamily: "Public Sans",
                          fontWeight: 600,
                          fontSize: "24px",
                          lineHeight: "32px",
                          color: "#2DA5F3",
                        }}
                      >
                        {currency}
                        {Object.values(selectedAttributes)
                          .reduce(
                            (total, attr) => total + (attr.additional_price || 0),
                            Number(product.unit_price)
                          )
                          .toFixed(2)}
                      </span>

                      {/* MRP (if discount exists) */}
                      {discountPercentage !== "0.00" && (
                        <span
                          className="text-[1.1rem] md:text-[1.3rem] 2xl:text-[1.5rem] font-semibold ml-1 line-through text-gray-400"
                          style={{
                            fontFamily: "Public Sans",
                            fontWeight: 600,
                            fontSize: "24px",
                            lineHeight: "32px",
                            color: "#f5f5f588",
                          }}
                        >
                          {currency}
                          {product.mrp}
                        </span>
                      )}

                      {/* Discount Percentage */}
                      {discountPercentage !== "0.00" && (
                        <span
                          className="label label-warning text-sm ml-1 h-4"
                          style={{
                            fontFamily: "Public Sans",
                            fontWeight: 600,
                            fontSize: "24px",
                            lineHeight: "32px",
                          }}
                        >
                          ({discountPercentage}%)
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    className={` text-[15px] ${additionalAttribute.price === 0 && "hidden"
                      }`}
                  ></p>
                  {Object.entries(attributeArrays2).map(
                    ([attributeName, values]) => (
                      <div key={attributeName} className="my-4">
                        <span className="font-bold text-gray-700  dark:text-[#f5f5f5] mb-1">
                          Select {attributeName} :
                        </span>
                        <ul>
                          {attributeName.toLowerCase() === "color" ? (
                            <div className=" flex items-center">
                              {values.map((value, index) => (
                                <button
                                  onClick={() =>
                                    handleAttributeSelection(
                                      attributeName,
                                      value
                                    )
                                  }
                                  key={index}
                                  className={`w-7 h-7 ${selectedAttributes[attributeName]?.value ===
                                    value.value
                                    ? " border-2 border-blue-400"
                                    : "border-2 border-black"
                                    } rounded-full bg-${value.value.toLowerCase()}-500   ml-2`}
                                ></button>
                              ))}
                            </div>
                          ) : (
                            <div className=" flex items-baseline">
                              {values.map((value, index) => (
                                <button
                                  key={index}
                                  onClick={() =>
                                    handleAttributeSelection(
                                      attributeName,
                                      value
                                    )
                                  }
                                  className={`text-gray-500 6 ${selectedAttributes[attributeName]?.value ===
                                    value.value
                                    ? " border border-blue-400 bg-blue-600 text-white"
                                    : "border bg-transparent border-white/30 hover:bg-gray-400 hover:text-gray-800 "
                                    }  py-2 px-4 rounded-xl font-bold mr-2`}
                                >
                                  {value.value}
                                </button>
                              ))}
                            </div>
                          )}
                        </ul>
                      </div>
                    )
                  )}
                  <div>
                    <p className="text-[12px] text-[#585454] md:text-sm flex items-center gap-2 border-t pt-[15px] mt-[15px] raleway  dark:text-[#ece9e9]">
                      {product?.short_description
                        ? parse(product.short_description)
                        : "No description available."}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center w-full py-3 sm:py-4 bg-white dark:bg-[#0E0F13] shadow-inner sm:shadow-none shadow-black/20 gap-4">
                    {/* Quantity Selector */}
                    {/* <div className="flex items-center gap-2 bg-[#D5C1EE] text-[#475156] px-4 py-2 rounded-md">
                      <button
                        onClick={() => DecrementQuantity()}
                        className="text-2xl font-bold hover:text-[#FFD814]"
                      >
                        -
                      </button>
                      <span className="text-lg px-8 font-medium">{product.quantity}</span>
                      <button
                        onClick={() => IncrementQuantity()}
                        className="text-2xl font-bold hover:text-[#FFD814]"
                      >
                        +
                      </button>
                    </div> */}

                    {/* Add to Cart Button */}
                    <div className="w-full sm:w-auto">
                      <button
                        onClick={() => {
                          if (!user) {
                            toast.error("You are not Signed In", { position: "top-right" });
                            sessionStorage.setItem("redirectAfterLogin", window.location.href);
                            setIsProfileOpen(true);
                            setTimeout(() => {
                              setIsProfileOpen(false);
                            }, 10000);
                            return;
                          }
                          AddtoCart();
                        }}
                        disabled={product.quantity === 0}
                        className="w-full sm:w-auto bg-[#9747FF] disabled:bg-gray-400 disabled:text-gray-600 text-white px-6 py-3 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-[#6A1BBE]"
                      >
                        <span>Add to Cart</span>
                        <IoCart size={20} />
                      </button>
                    </div>

                    {/* Buy Now Button */}
                    <div className="w-full sm:w-auto">
                      {product.quantity > 0 && (
                        <button
                          onClick={() => {
                            if (!user) {
                              toast.error("You are not Signed In", { position: "top-right" });
                              sessionStorage.setItem("redirectAfterLogin", window.location.href);
                              setIsProfileOpen(true);
                              setTimeout(() => {
                                setIsProfileOpen(false);
                              }, 10000);
                              return;
                            }
                            setIsSingleOrderFormOpen(true);
                            setSingleOrderProduct(product);
                            setIsProfileOpen(false);
                          }}
                          className="w-full sm:w-auto bg-transparent border-2 border-[#8A2BE2] text-[#8A2BE2] px-6 py-3 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-[#6A1BBE] hover:text-white"
                        >
                          Buy Now
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between w-full py-4 px-6 bg-[#0E0F13] text-white shadow-inner sm:shadow-none">
                    {/* Add to Wishlist */}
                    <div className="flex items-center gap-2 ">
                      <FaHeart
                        id={`heart-${product.id}`}
                        onClick={handleWishlistClick}
                        className={`cursor-pointer ${wishlistProducts.find((i) => {
                          return i.id === product.id;
                        })
                          ? "text-red-500"
                          : "text-gray-400"
                          } text-[22px] `}
                        size={15}
                      />
                      <span className="text-sm font-small">Add to Wishlist</span>
                    </div>

                    {/* Share Product */}
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-small">Share product:</span>
                      <div className="flex items-center gap-3">
                        {/* Share Icon */}
                        <button
                          className="hover:text-[#6A1BBE]"
                        >
                          <div className="">
                            <FaShare
                              className="cursor-pointer text-white text-xl"
                              onClick={handleShareClick}
                              size={15}
                            />
                          </div>
                        </button>
                        <button
                          className="hover:text-[#6A1BBE]"
                        >
                          <div className="">
                            <FaCopy
                              className="cursor-pointer text-white text-xl"
                              onClick={handleCopy}
                              size={15}
                            />
                          </div>
                        </button>
                        {/* Social Icons */}
                        <a
                          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#6A1BBE]"
                        >
                          <FaFacebook size={15} />
                        </a>

                        {/* Twitter Share */}
                        <a
                          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(
                            "Have a Look at this product on Pinksurfing"
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#6A1BBE]"
                        >
                          <FaTwitter size={15} />
                        </a>

                        {/* Pinterest Share */}
                        <a
                          href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(
                            currentUrl
                          )}&media=${encodeURIComponent(product.image1)}&description=${encodeURIComponent(product.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-[#6A1BBE]"
                        >
                          <FaPinterest size={15} />
                        </a>
                      </div>
                    </div>
                  </div>

                </div>
                {/* <div className="hidden md:block">
                  <YouMightAlsoLike
                    allProducts={allProducts}
                    productId={productId}
                    product={product}
                    currency={currency}
                  />
                </div> */}
              </div>
              <ProductDetailReviewSection reviews={reviews} product={product} />



              <div className="md:hidden">
                <YouMightAlsoLike
                  allProducts={allProducts}
                  productId={productId}
                  product={product}
                  currency={currency}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default ProductDetailPage;
