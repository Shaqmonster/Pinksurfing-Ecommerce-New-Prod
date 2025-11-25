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
    if (cookies.access_token) {
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/cart/view/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
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
    if (cookies.access_token) {
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/wishlist/view/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
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
            Authorization: `Bearer ${cookies.access_token}`,
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
            Authorization: `Bearer ${cookies.access_token}`,
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
            Authorization: `Bearer ${cookies.access_token}`,
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
        console.log(productResponse.data);
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

        if (cookies.access_token) {
          const addressId = user.addresses[0]?.id;
          const ratesResponse = await axios.get(
            `${import.meta.env.VITE_SERVER_URL
            }/api/shipping/fetch-rates/${productId}/${addressId}/`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cookies.access_token}`,
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
      
      <section className="relative pb-8 bg-gradient-to-br from-white via-purple-50/30 to-white dark:from-[#0A0B0E] dark:via-[#1a1020] dark:to-[#0A0B0E] font-poppins min-h-screen overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

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
          <div className="min-h-screen flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-6 animate-fadeIn">
              <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Home</Link>
              <span>/</span>
              <Link to={`/category/${product.category?.slug}`} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {product.category?.name}
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16">
              {/* Left Column - Image Gallery */}
              <div className="space-y-4 animate-slideInLeft">
                {/* Main Image */}
                <div className="relative group bg-white dark:bg-gray-900/50 rounded-2xl overflow-hidden shadow-2xl border border-purple-100 dark:border-purple-900/30 backdrop-blur-sm">
                  <div className="aspect-square flex items-center justify-center p-8 bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-900/50 dark:to-purple-950/30">
                    <img
                      className="w-full h-full object-contain cursor-crosshair transition-transform duration-500 group-hover:scale-105"
                      src={activeImage || product.image1}
                      alt={product.name}
                      onMouseOut={() => setViewMainImg(false)}
                      onMouseMove={handleMouseMove}
                    />
                  </div>
                  
                  {/* Image Overlay Icons */}
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button className="p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                  </div>

                  {/* Stock Badge */}
                  {product.quantity > 0 ? (
                    <div className="absolute top-4 left-4 px-4 py-2 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg animate-bounce">
                      In Stock
                    </div>
                  ) : (
                    <div className="absolute top-4 left-4 px-4 py-2 bg-red-500 text-white text-xs font-semibold rounded-full shadow-lg">
                      Out of Stock
                    </div>
                  )}

                  {/* Discount Badge */}
                  {discountPercentage !== "0.00" && (
                    <div className="absolute bottom-4 left-4 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full shadow-lg">
                      {discountPercentage}% OFF
                    </div>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                <div className="grid grid-cols-4 gap-3">
                  {[product.image1, product.image2, product.image3, product.image4].filter(Boolean).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(img)}
                      className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                        activeImage === img
                          ? "ring-4 ring-purple-500 shadow-xl scale-105"
                          : "ring-2 ring-gray-200 dark:ring-gray-700 hover:ring-purple-300 dark:hover:ring-purple-700"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Product view ${index + 1}`}
                        className="w-full h-full object-cover bg-white dark:bg-gray-900"
                      />
                      {activeImage === img && (
                        <div className="absolute inset-0 bg-purple-500/20 backdrop-blur-[1px]"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column - Product Info */}
              <div className="space-y-6 animate-slideInRight">
                {/* Rating and Reviews */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Stars stars={averageRating} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {averageRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>

                {/* Product Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                  {product.name}
                </h1>

                {/* Brand and Category */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <span className="text-gray-600 dark:text-gray-400">Brand:</span>
                    <span className="font-semibold text-purple-700 dark:text-purple-300">{product.brand_name}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-300">{product.category?.name}</span>
                  </div>
                </div>

                {/* Price Section */}
                <div className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 rounded-2xl border border-purple-200 dark:border-purple-800/30 shadow-lg">
                  <div className="flex items-baseline gap-4 flex-wrap">
                    <span className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      {currency}
                      {Object.values(selectedAttributes)
                        .reduce(
                          (total, attr) => total + (attr.additional_price || 0),
                          Number(product.unit_price)
                        )
                        .toFixed(2)}
                    </span>
                    
                    {discountPercentage !== "0.00" && (
                      <>
                        <span className="text-2xl font-semibold text-gray-400 line-through">
                          {currency}{product.mrp}
                        </span>
                        <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold rounded-full">
                          Save {discountPercentage}%
                        </span>
                      </>
                    )}
                  </div>
                  
                  <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                    Inclusive of all taxes
                  </p>
                </div>

                {/* Attributes Selection */}
                {Object.entries(attributeArrays2).map(([attributeName, values]) => (
                  <div key={attributeName} className="space-y-3">
                    <label className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                      Select {attributeName}
                    </label>
                    
                    {attributeName.toLowerCase() === "color" ? (
                      <div className="flex flex-wrap gap-3">
                        {values.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => handleAttributeSelection(attributeName, value)}
                            className={`relative w-12 h-12 rounded-full transition-all duration-300 ${
                              selectedAttributes[attributeName]?.value === value.value
                                ? "ring-4 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900 scale-110"
                                : "ring-2 ring-gray-300 dark:ring-gray-600 hover:scale-105"
                            }`}
                            style={{ backgroundColor: value.value }}
                            title={value.value}
                          >
                            {selectedAttributes[attributeName]?.value === value.value && (
                              <svg className="absolute inset-0 m-auto w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {values.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => handleAttributeSelection(attributeName, value)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                              selectedAttributes[attributeName]?.value === value.value
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:scale-105"
                            }`}
                          >
                            {value.value}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Description */}
                <div className="p-6 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Product Description</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed prose dark:prose-invert max-w-none">
                    {product?.short_description ? parse(product.short_description) : "No description available."}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => {
                      if (!user) {
                        toast.error("You are not Signed In", { position: "top-right" });
                        sessionStorage.setItem("redirectAfterLogin", window.location.href);
                        setIsProfileOpen(true);
                        setTimeout(() => setIsProfileOpen(false), 10000);
                        return;
                      }
                      AddtoCart();
                    }}
                    disabled={product.quantity === 0}
                    className="flex-1 group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                      <IoCart size={24} />
                      Add to Cart
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  </button>

                  {product.quantity > 0 && (
                    <button
                      onClick={() => {
                        if (!user) {
                          toast.error("You are not Signed In", { position: "top-right" });
                          sessionStorage.setItem("redirectAfterLogin", window.location.href);
                          setIsProfileOpen(true);
                          setTimeout(() => setIsProfileOpen(false), 10000);
                          return;
                        }
                        setIsSingleOrderFormOpen(true);
                        setSingleOrderProduct(product);
                        setIsProfileOpen(false);
                      }}
                      className="flex-1 px-8 py-4 bg-white dark:bg-gray-900 text-purple-600 dark:text-purple-400 font-bold rounded-xl border-2 border-purple-600 dark:border-purple-500 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 dark:hover:text-white transition-all duration-300 hover:shadow-2xl hover:scale-105"
                    >
                      Buy Now
                    </button>
                  )}
                </div>

                {/* Wishlist and Share */}
                <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-gray-900/50 dark:to-purple-950/30 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <button
                    onClick={handleWishlistClick}
                    className="flex items-center gap-3 group"
                  >
                    <FaHeart
                      id={`heart-${product.id}`}
                      className={`transition-all duration-300 text-2xl group-hover:scale-125 ${
                        wishlistProducts.find((i) => i.id === product.id)
                          ? "text-red-500 animate-pulse"
                          : "text-gray-400 group-hover:text-red-400"
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {wishlistProducts.find((i) => i.id === product.id) ? "In Wishlist" : "Add to Wishlist"}
                    </span>
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Share:</span>
                    <div className="flex items-center gap-2">
                      <button onClick={handleShareClick} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110">
                        <FaShare className="text-gray-600 dark:text-gray-400 hover:text-purple-600" size={16} />
                      </button>
                      <button onClick={handleCopy} className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110">
                        <FaCopy className="text-gray-600 dark:text-gray-400 hover:text-purple-600" size={16} />
                      </button>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110"
                      >
                        <FaFacebook className="text-gray-600 dark:text-gray-400 hover:text-blue-600" size={16} />
                      </a>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent("Check out this product on Pinksurfing")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110"
                      >
                        <FaTwitter className="text-gray-600 dark:text-gray-400 hover:text-blue-400" size={16} />
                      </a>
                      <a
                        href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&media=${encodeURIComponent(product.image1)}&description=${encodeURIComponent(product.name)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-full transition-all duration-300 hover:scale-110"
                      >
                        <FaPinterest className="text-gray-600 dark:text-gray-400 hover:text-red-600" size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews and Recommendations */}
            <div className="mt-16 space-y-12">
              <ProductDetailReviewSection reviews={reviews} product={product} />
              <YouMightAlsoLike
                allProducts={allProducts}
                productId={productId}
                product={product}
                currency={currency}
              />
            </div>
          </div>
        )}
      </section>

      <style jsx>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out;
        }

        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out;
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </>
  );
};

export default ProductDetailPage;
