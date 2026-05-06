import React, { useContext } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { useCookies } from "react-cookie";
import { toast } from "react-toastify";
import Header from "../components/Header";
import axios from "axios";
import { FaCopy, FaFacebook, FaFontAwesome, FaPinterest, FaShare, FaTwitter } from "react-icons/fa";
import OrderConfirm from "../components/OrderConfirm";
import { FaHeart, FaStar, FaTruck, FaChevronDown, FaChevronUp } from "react-icons/fa";
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
import { formatMoney } from "../utils/formatMoney";


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
  // variant attributes (is_variant: true) → selectable options that can change price
  const [variantAttributeMap, setVariantAttributeMap] = useState({});
  // spec attributes (is_variant: false) → read-only informational fields
  const [specAttributeMap, setSpecAttributeMap] = useState({});
  const [viewMainImg, setViewMainImg] = useState(false);
  const [productQty, setProductQty] = useState(1);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("story");
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
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
    setIsProfileOpen,
    isProfileOpen,
    currency,
  } = useContext(authContext);

  const isOwner = user?.email === product?.vendor?.email;

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
    // Send the raw variant selections — the backend validates the price from DB.
    const selected_variants = Object.entries(selectedAttributes).map(
      ([name, attr]) => ({ name, value: attr.value })
    );
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/cart/add/${productId}/`,
        { selected_variants },
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

        const productData = productResponse.data.Products;
        setProduct(productData);
        const isOwner = user?.email === productData.vendor?.email;
        setLoading(false);
        setActiveImage(productResponse.data.Products.image);

        // Build a lookup: attribute name (lowercase) → is_variant boolean
        // from the subcategory's allowed_attributes list.
        const isVariantLookup = {};
        const allowedAttrs = productData.subcategory?.allowed_attributes || [];
        allowedAttrs.forEach((aa) => {
          if (aa.name) isVariantLookup[aa.name.toLowerCase()] = aa.is_variant;
        });

        const variantAttrs = {};
        const specAttrs = {};

        (productData.attributes || []).forEach(({ name, value, additional_price }) => {
          if (!name) return;
          const lowerName = name.toLowerCase();
          // Default to variant=true when not found (preserves existing behavior)
          const isVariant = isVariantLookup.hasOwnProperty(lowerName)
            ? isVariantLookup[lowerName]
            : true;

          const target = isVariant ? variantAttrs : specAttrs;
          if (!target[name]) target[name] = [];
          // De-duplicate by value
          if (!target[name].some((item) => item.value === value)) {
            target[name].push({ value, additional_price });
          }
        });

        setVariantAttributeMap(variantAttrs);
        setSpecAttributeMap(specAttrs);

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

  // Calculate additional price from selected attributes
  const additionalPrice = Object.values(selectedAttributes).reduce(
    (total, attr) => total + (attr.additional_price || 0),
    0
  );

  // Calculate prices with additional price added to both unit price and MRP
  const finalUnitPrice = Number(product.unit_price) + additionalPrice;
  const finalMrp = Number(product.mrp) + additionalPrice;

  const discountPercentage = (
    ((finalMrp - finalUnitPrice) / finalMrp) * 100
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
                <div className="flex flex-wrap gap-3 text-sm">
                  {product.brand_name && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                      <span className="text-gray-600 dark:text-gray-400">Brand:</span>
                      <span className="font-semibold text-purple-700 dark:text-purple-300">{product.brand_name}</span>
                    </div>
                  )}
                  {product.category?.name && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <span className="text-gray-600 dark:text-gray-400">Category:</span>
                      <span className="font-semibold text-blue-700 dark:text-blue-300">{product.category.name}</span>
                    </div>
                  )}
                </div>

                {/* Price Section */}
                <div className="relative overflow-hidden p-8 bg-white dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-2xl group">
                  {/* Decorative Glow */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-500/20 transition-all duration-700"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Premium Choice</span>
                      </div>
                      {discountPercentage !== "0.00" && Number(discountPercentage) > 0 && (
                        <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Limited Offer</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-baseline gap-4 flex-wrap">
                      <span className="text-5xl sm:text-6xl font-black tracking-tighter text-gray-900 dark:text-white">
                        {currency}{formatMoney(finalUnitPrice)}
                      </span>
                      
                      {discountPercentage !== "0.00" && Number(discountPercentage) > 0 && (
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-gray-400 line-through decoration-orange-500/50">
                            {currency}{formatMoney(finalMrp)}
                          </span>
                          <span className="text-sm font-black text-orange-500 uppercase tracking-tighter">
                            {discountPercentage}% Savings
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Inclusive of all taxes & duties
                      </p>
                      <div className="flex items-center gap-2 text-green-500">
                        <FaTruck className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Free Shipping</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 1: OPTIONS (is_variant=true) — selectable, price-affecting ── */}
                {Object.keys(variantAttributeMap).length > 0 && (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/60 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-[#9747FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                        Options
                      </p>
                      {additionalPrice > 0 && (
                        <span className="ml-auto text-xs font-semibold text-[#9747FF] bg-[#9747FF]/10 px-2 py-0.5 rounded-full">
                          +{currency}{formatMoney(additionalPrice)} selected
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-4">
                      {Object.entries(variantAttributeMap).map(([attributeName, values]) => {
                        const isColor = attributeName.toLowerCase() === "color";
                        const selectedVal = selectedAttributes[attributeName]?.value;

                        return (
                          <div key={attributeName} className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                {attributeName}
                              </span>
                              {selectedVal && (
                                <span className="text-xs text-[#9747FF] font-medium">
                                  {selectedVal}
                                  {selectedAttributes[attributeName]?.additional_price > 0 && (
                                    <span className="text-gray-400 ml-1">
                                      (+{currency}{formatMoney(selectedAttributes[attributeName].additional_price)})
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>

                            {isColor ? (
                              /* Color swatches */
                              <div className="flex flex-wrap gap-2">
                                {values.map((v, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAttributeSelection(attributeName, v)}
                                    className={`group relative w-12 h-12 rounded-xl transition-all duration-300 ${
                                      selectedVal === v.value
                                        ? "ring-4 ring-[#9747FF] ring-offset-2 scale-110"
                                        : "hover:scale-110"
                                    }`}
                                    title={v.value}
                                  >
                                    <div
                                      className="w-full h-full rounded-lg shadow-inner border border-black/10"
                                      style={{ backgroundColor: v.value.toLowerCase() }}
                                    ></div>
                                    {v.additional_price > 0 && (
                                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                                        +{currency}{formatMoney(v.additional_price)}
                                      </div>
                                    )}
                                  </button>
                                ))}
                              </div>
                            ) : (
                              /* Selectable chips */
                              <div className="flex flex-wrap gap-2">
                                {values.map((v, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => handleAttributeSelection(attributeName, v)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all duration-200 ${
                                      selectedVal === v.value
                                        ? "bg-[#9747FF] text-white border-[#9747FF] shadow-md shadow-[#9747FF]/20"
                                        : "bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-[#9747FF] hover:text-[#9747FF] dark:hover:border-[#9747FF] dark:hover:text-[#9747FF]"
                                    }`}
                                  >
                                    {v.value}
                                    {v.additional_price > 0 && (
                                      <span className={`ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                                        selectedVal === v.value
                                          ? "bg-white/20 text-white"
                                          : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                      }`}>
                                        +{currency}{formatMoney(v.additional_price)}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── SECTION 2: ACTION ZONE ── */}
                <div className="flex flex-col gap-6 py-8">
                  <div className="flex flex-col xl:flex-row gap-4">
                    {!isOwner ? (
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
                        className="flex-1 group relative px-8 py-5 bg-black dark:bg-white text-white dark:text-black font-black uppercase tracking-widest text-[10px] rounded-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                          <IoCart size={18} />
                          Add to bag
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </button>
                    ) : (
                      <div className="flex-1 px-8 py-5 bg-white/5 border border-white/10 rounded-2xl text-white/30 text-[10px] font-black uppercase tracking-widest flex items-center justify-center">
                        Your Product
                      </div>
                    )}

                    {!isOwner && product.quantity > 0 && (
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
                          setSingleOrderProduct({
                            ...product,
                            unit_price: finalUnitPrice,
                            mrp: finalMrp,
                            original_unit_price: product.unit_price,
                            original_mrp: product.mrp,
                            additional_price: additionalPrice,
                            selected_variants: Object.entries(selectedAttributes).map(
                              ([name, attr]) => ({ name, value: attr.value })
                            ),
                            quantity: productQty,
                          });
                        }}
                        className="flex-1 px-8 py-5 bg-purple-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all duration-500 hover:bg-purple-700 hover:shadow-2xl hover:shadow-purple-500/20 active:scale-95 shadow-xl"
                      >
                        Buy Now — {currency}{formatMoney(finalUnitPrice)}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-6 bg-white dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-white/5 shadow-lg">
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
                      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 group-hover:text-purple-600 transition-colors">
                        {wishlistProducts.find((i) => i.id === product.id) ? "In Wishlist" : "Save for later"}
                      </span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button onClick={handleShareClick} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl transition-all hover:scale-110 hover:bg-purple-50">
                        <FaShare className="text-gray-500" size={14} />
                      </button>
                      <button onClick={handleCopy} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl transition-all hover:scale-110 hover:bg-purple-50">
                        <FaCopy className="text-gray-600 dark:text-gray-400" size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: "🛡️", label: "Secure Pay" },
                      { icon: "🔄", label: "7 Day Return" },
                      { icon: "✨", label: "Authentic" }
                    ].map((badge, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-gray-50/50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
                        <span className="text-xl">{badge.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">{badge.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── SECTION 3: PRODUCT INFO TABS (Story & Specs) ── */}
                <div className="relative overflow-hidden bg-white dark:bg-gray-900/40 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-xl transition-all duration-500">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-100 dark:border-white/5">
                    {[
                      { id: "story", label: "Product Story", icon: "✨" },
                      { id: "specs", label: "Specifications", icon: "📋" }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-3 py-6 text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative ${
                          activeTab === tab.id 
                            ? "text-purple-600 dark:text-purple-400" 
                            : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        }`}
                      >
                        <span className="text-sm">{tab.icon}</span>
                        {tab.label}
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 animate-fadeIn"></div>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="p-8">
                    {activeTab === "story" ? (
                      <div className="animate-fadeIn">
                        {product?.short_description ? (
                          <div className="
                            text-sm text-gray-600 dark:text-gray-400 leading-relaxed
                            [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
                            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
                            [&_li]:mb-2 [&_strong]:font-black [&_strong]:text-gray-900 dark:[&_strong]:text-white
                            [&_h1]:text-2xl [&_h1]:font-black [&_h1]:tracking-tighter [&_h1]:mb-4
                            [&_h2]:text-xl [&_h2]:font-black [&_h2]:tracking-tighter [&_h2]:mb-4
                            [&_h3]:text-lg [&_h3]:font-black [&_h3]:tracking-tighter [&_h3]:mb-2
                            [&_a]:text-purple-600 [&_a]:underline transition-all
                          ">
                            {parse(product.short_description)}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic py-8 text-center">No product story available.</p>
                        )}
                      </div>
                    ) : (
                      <div className="animate-fadeIn">
                        {Object.keys(specAttributeMap).length > 0 ? (
                          <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
                            {Object.entries(specAttributeMap).map(([attrName, values]) => {
                              const displayValue = values.map((v) => v.value).join(", ");
                              const isBoolean = displayValue.toLowerCase() === "true" || displayValue.toLowerCase() === "false";
                              const isTrue = displayValue.toLowerCase() === "true";
                              
                              return (
                                <div key={attrName} className="flex flex-col gap-1.5 group">
                                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 group-hover:text-purple-500 transition-colors">
                                    {attrName}
                                  </span>
                                  
                                  <div className="flex items-center gap-3">
                                    {isBoolean ? (
                                      <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                        isTrue 
                                          ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                                          : "bg-gray-100 dark:bg-white/5 text-gray-400"
                                      }`}>
                                        <span className={`w-1 h-1 rounded-full ${isTrue ? "bg-green-500" : "bg-gray-400"}`} />
                                        {isTrue ? "Yes" : "No"}
                                      </div>
                                    ) : (
                                      <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100 leading-tight">
                                        {displayValue}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 italic py-8 text-center">No specifications available.</p>
                        )}
                      </div>
                    )}
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
