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
      
      <section className="bg-white dark:bg-[#0E0F13] font-poppins min-h-screen">
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
              <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-8">
              <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Home</Link>
              <span>/</span>
              <Link to={`/category/${product.category?.slug}`} className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                {product.category?.name}
              </Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-[540px_minmax(0,1fr)] gap-10 lg:gap-12">
              {/* Left Column - Image Gallery + Actions */}
              <div className="lg:sticky lg:top-20 self-start space-y-5">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-5">
                    {/* Vertical thumbnails for lg */}
                    <div className="hidden lg:flex flex-col gap-3 w-24">
                      {[product.image1, product.image2, product.image3, product.image4].filter(Boolean).map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setActiveImage(img)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            activeImage === img
                              ? "border-purple-600 ring-2 ring-purple-200 dark:ring-purple-900"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          <img
                            src={img}
                            alt={`View ${index + 1}`}
                            className="w-full h-full object-cover bg-gray-50 dark:bg-gray-900"
                          />
                        </button>
                      ))}
                    </div>

                    {/* Main Image */}
                    <div className="relative flex-1 rounded-[32px] overflow-hidden shadow-xl shadow-black/10 dark:shadow-purple-900/20 bg-gradient-to-br from-white/60 to-white/40 dark:from-white/10 dark:to-white/5 backdrop-blur-xl min-h-[420px]">
                      <img
                        className="w-full h-full object-contain cursor-zoom-in mix-blend-normal"
                        src={activeImage || product.image1}
                        alt={product.name}
                        onMouseOut={() => setViewMainImg(false)}
                        onMouseMove={handleMouseMove}
                      />

                      {/* Stock Badge */}
                      {product.quantity > 0 ? (
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-full">
                          In Stock
                        </div>
                      ) : (
                        <div className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                          Out of Stock
                        </div>
                      )}

                      {/* Discount Badge */}
                      {discountPercentage !== "0.00" && (
                        <div className="absolute top-4 right-4 px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                          {discountPercentage}% OFF
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile thumbnail rail */}
                  <div className="grid grid-cols-4 gap-3 lg:hidden">
                    {[product.image1, product.image2, product.image3, product.image4].filter(Boolean).map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImage(img)}
                        className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          activeImage === img
                            ? "border-purple-600 ring-2 ring-purple-200 dark:ring-purple-900"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <img
                          src={img}
                          alt={`View ${index + 1}`}
                          className="w-full h-full object-cover bg-gray-50 dark:bg-gray-900"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons below the gallery */}
                <div className="flex flex-wrap gap-3">
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
                    className="flex-1 min-w-[180px] flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-2xl transition-colors"
                  >
                    <IoCart size={20} />
                    Add to Cart
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
                      className="flex-1 min-w-[180px] px-6 py-4 bg-white/90 dark:bg-gray-900 text-purple-600 dark:text-purple-400 font-semibold rounded-2xl border-2 border-purple-600 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Buy Now
                    </button>
                  )}
                </div>
              </div>

              {/* Right Column - Product Info & Scrollable Content */}
              <div className="space-y-8 lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto pr-1">
                {/* Product Title */}
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                    {product.name}
                  </h1>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Stars stars={averageRating} />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {averageRating.toFixed(1)} ({reviews.length} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="border-y border-gray-200 dark:border-gray-800 py-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-bold text-purple-600 dark:text-purple-400">
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
                        <span className="text-xl font-medium text-gray-400 line-through">
                          {currency}{product.mrp}
                        </span>
                        <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm font-semibold rounded">
                          Save {discountPercentage}%
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Inclusive of all taxes</p>
                </div>

                {/* Product Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Brand:</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{product.brand_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Category:</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{product.category?.name}</p>
                  </div>
                </div>

                {/* Attributes Selection */}
                {Object.entries(attributeArrays2).map(([attributeName, values]) => (
                  <div key={attributeName}>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      {attributeName}:
                    </label>
                    
                    {attributeName.toLowerCase() === "color" ? (
                      <div className="flex flex-wrap gap-2">
                        {values.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => handleAttributeSelection(attributeName, value)}
                            className={`relative w-10 h-10 rounded-md border-2 transition-all ${
                              selectedAttributes[attributeName]?.value === value.value
                                ? "border-purple-600 ring-2 ring-purple-200 dark:ring-purple-900"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400"
                            }`}
                            style={{ backgroundColor: value.value }}
                            title={value.value}
                          >
                            {selectedAttributes[attributeName]?.value === value.value && (
                              <svg className="absolute inset-0 m-auto w-5 h-5 text-white drop-shadow" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {values.map((value, index) => (
                          <button
                            key={index}
                            onClick={() => handleAttributeSelection(attributeName, value)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                              selectedAttributes[attributeName]?.value === value.value
                                ? "bg-purple-600 text-white"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                          >
                            {value.value}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Wishlist and Share */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={handleWishlistClick}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                  >
                    <FaHeart
                      id={`heart-${product.id}`}
                      className={`text-lg ${
                        wishlistProducts.find((i) => i.id === product.id)
                          ? "text-red-500"
                          : "text-gray-400"
                      }`}
                    />
                    {wishlistProducts.find((i) => i.id === product.id) ? "In Wishlist" : "Add to Wishlist"}
                  </button>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Share:</span>
                    <button onClick={handleShareClick} className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      <FaShare size={14} />
                    </button>
                    <button onClick={handleCopy} className="p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                      <FaCopy size={14} />
                    </button>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <FaFacebook size={14} />
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent("Check out this product on Pinksurfing")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      <FaTwitter size={14} />
                    </a>
                    <a
                      href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(currentUrl)}&media=${encodeURIComponent(product.image1)}&description=${encodeURIComponent(product.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <FaPinterest size={14} />
                    </a>
                  </div>
                </div>

                {/* Description */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Product Description</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed prose dark:prose-invert max-w-none">
                    {product?.short_description ? parse(product.short_description) : "No description available."}
                  </div>
                </div>

                <ProductDetailReviewSection reviews={reviews} product={product} />

                <YouMightAlsoLike
                  allProducts={allProducts}
                  productId={productId}
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
