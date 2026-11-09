import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion, LayoutGroup } from "framer-motion";
import { PS_MOTION } from "../lib/motion-tokens";
import {
  IoStorefrontOutline,
  IoTrendingUpOutline,
  IoStarOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import SearchForm from "../components/Search";
import { categories, subCategories } from "../utils/Categories";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import ChannelsForSale from "../components/ChannelsForSale";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { IoClose } from "react-icons/io5";
import { Country, State, City } from "country-state-city";
import ProductCard from "../components/ProductCard";
import StoreCard from "../components/StoreCard";
import PageSEO from "../components/PageSEO";
import MediaImage from "../components/ui/MediaImage";
import Skeleton, { ProductCardSkeleton } from "../components/ui/Skeleton";
import { HOME_FAQ, HOME_META, homeJsonLd } from "../constants/homeSeo";
import { useAccessToken } from "../hooks/useAccessToken";
import {
  fetchDiscountedProducts,
  fetchHomeFeaturedProducts,
} from "../api/catalogProducts";


const responsive = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 4 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};


const Home = () => {
  const accessToken = useAccessToken();
  const navigate = useNavigate();
  const [cookies] = useCookies([]);
  const { setCategory, isDarkMode, user, currency } = useContext(authContext);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [discountedProducts, setDiscountedProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [categoryCarouselIndex, setCategoryCarouselIndex] = useState(0);
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [vendorFormData, setVendorFormData] = useState({
    store_name: "",
    website: "",
    bio: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    country: "",
    zip_code: "",
  });
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeImage, setStoreImage] = useState(null);
  const [storeImagePreview, setStoreImagePreview] = useState(null);

  const getFilteredCards = () => {
    if (selectedCategory === 3) return featuredProducts;
    return (featuredProducts || []).slice(0, 4);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === categories.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? categories.length - 1 : prevIndex - 1
    );
  };


  const reducedMotion = useReducedMotion();
  const fetchedCategories = [
    { id: 1, name: "Stores", Icon: IoStorefrontOutline },
    { id: 2, name: "Trending", Icon: IoTrendingUpOutline },
    { id: 3, name: "Buyer's choice", Icon: IoStarOutline },
    { id: 4, name: "PinkSurfing finds", Icon: IoSparklesOutline },
  ];
  const tabTransition = reducedMotion
    ? { duration: 0 }
    : { duration: PS_MOTION.duration.fast, ease: PS_MOTION.easing.standard };

  // Initialize countries on component mount
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  const handleComingSoonClick = (item) => {
    toast.info(`${item.name} is coming soon!`, {
      position: "top-right",
      autoClose: 2200,
    });
  };

  const handleCategoryCardClick = (item) => {
    if (item.coming_soon) {
      handleComingSoonClick(item);
      return;
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  // Handle My Store click
  const handleMyStoreClick = () => {
    // Check if user is logged in
    if (!accessToken) {
      toast.info("Please sign in to access your store");
      navigate("/signin");
      return;
    }

    // Check if user is already a vendor
    const isVendor = user?.is_vendor || localStorage.getItem("user.vendorAccess") === "true";

    if (isVendor) {
      window.open("https://vendors.pinksurfing.com", "_blank");
    } else {
      // Show vendor registration dialog
      setIsVendorDialogOpen(true);
    }
  };

  // Handle vendor form change
  const handleVendorFormChange = (e) => {
    const { name, value } = e.target;

    if (name === "country") {
      setVendorFormData((prev) => ({
        ...prev,
        country: value,
        state: "",
        city: "",
      }));

      if (value) {
        setStates(State.getStatesOfCountry(value));
        setCities([]);
      } else {
        setStates([]);
        setCities([]);
      }
    } else if (name === "state") {
      setVendorFormData((prev) => ({
        ...prev,
        state: value,
        city: "",
      }));

      const countryCode = vendorFormData.country;
      if (value && countryCode) {
        setCities(City.getCitiesOfState(countryCode, value));
      } else {
        setCities([]);
      }
    } else {
      setVendorFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle store image upload
  const handleStoreImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStoreImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setStoreImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove store image
  const handleRemoveStoreImage = () => {
    setStoreImage(null);
    setStoreImagePreview(null);
  };

  // Submit vendor registration
  const handleVendorRegistration = async (e) => {
    e.preventDefault();

    if (!accessToken) {
      toast.error("Please sign in first");
      navigate("/signin");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("company_name", vendorFormData.store_name);
    formData.append("website", vendorFormData.website);
    formData.append("bio", vendorFormData.bio);
    formData.append("street1", vendorFormData.street1);
    formData.append("street2", vendorFormData.street2);
    formData.append("city", vendorFormData.city);
    formData.append("state", vendorFormData.state);
    formData.append("country", vendorFormData.country);
    formData.append("zip_code", vendorFormData.zip_code);

    // Add store image if selected
    if (storeImage) {
      formData.append("shop_image", storeImage);
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/vendor/customer-vendor-registration/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Vendor registration response:", response.data);

      // Update localStorage
      localStorage.setItem("vendorAccess", "true");

      toast.success("Congratulations! You're now a vendor on Pinksurfing", {
        position: "top-center",
        autoClose: 3000,
      });

      if (response.data?.address_warning) {
        toast.warn(response.data.address_warning, {
          position: "top-center",
          autoClose: 6000,
        });
      }

      // Close dialog
      setIsVendorDialogOpen(false);

      if (response.data?.kyc_required) {
        const returnUrl = encodeURIComponent("https://vendors.pinksurfing.com/");
        setTimeout(() => {
          window.location.href = `${window.location.origin}/identity/verify?returnUrl=${returnUrl}`;
        }, 800);
      } else {
        setTimeout(() => {
          window.open("https://vendors.pinksurfing.com", "_blank");
        }, 2000);
      }

    } catch (error) {
      console.error("Vendor registration error:", error);
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.status ||
        "Unable to register as vendor. Please try again.",
        {
          position: "top-center",
          autoClose: 3000,
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setStoreLoading(true);
        const storesResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/vendor/all-stores/`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        setStores(storesResponse.data.stores || []);
        console.log(storesResponse.data.stores);
      } catch (error) {
        console.error(error);
      } finally {
        setStoreLoading(false);
      }
    };

    const fetchProducts = async () => {
      setCatalogLoading(true);
      try {
        const [featured, discounted] = await Promise.all([
          fetchHomeFeaturedProducts(12),
          fetchDiscountedProducts(5),
        ]);
        setFeaturedProducts(featured);
        setDiscountedProducts(discounted);
      } catch (error) {
        console.error(error);
      } finally {
        setCatalogLoading(false);
      }
    };

    fetchStores();
    fetchProducts();
  }, []);

  const searchProducts = async (subLink, address) => {
    axios
      .get(
        `${import.meta.env.VITE_SERVER_URL
        }/api/product/filter-products${subLink}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )
      .then((response) => {
        navigate(address);
        setFeaturedProducts(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const getDiscountedProducts = () => discountedProducts;

  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 3000 },
      items: 5,
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  return (
    <>
      <PageSEO
        title={HOME_META.title}
        description={HOME_META.description}
        path="/"
        ogTitle={HOME_META.ogTitle}
        ogDescription={HOME_META.ogDescription}
        jsonLd={homeJsonLd}
      />
      {/* Main Container */}
      <div className="w-full min-h-screen bg-[var(--ps-bg)] relative overflow-hidden">

        {/* Hero Section - Main Categories */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-12 pt-6 pb-8">
          <div className="text-center mb-8 max-w-3xl mx-auto">
            <div className="flex justify-center mb-4">
              <img src="/brand/logo.jpeg" alt="" className="w-14 h-14 rounded-2xl object-cover ring-1 ring-[var(--ps-brd)]" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-white tracking-tight">
              PinkSurfing
            </h1>
            <p className="text-[var(--ps-muted)] text-sm sm:text-base max-w-2xl mx-auto">
              Shop products, sell from your store, find gigs, or close deals — one marketplace.
            </p>
            <div className="mt-5 flex flex-wrap justify-center items-center gap-2">
              <Link
                to="/bids"
                className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[14px] border border-[var(--ps-brd)] text-[var(--ps-muted)] text-sm font-medium hover:text-white"
              >
                Bids
              </Link>
              <button
                type="button"
                onClick={handleMyStoreClick}
                className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[14px] border border-[var(--ps-brd)] text-[var(--ps-muted)] text-sm font-medium hover:text-white"
              >
                Sell
              </button>
              <Link
                to="/gighub"
                className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[14px] border border-[var(--ps-brd)] text-[var(--ps-muted)] text-sm font-medium hover:text-white"
              >
                Gigs
              </Link>
              <Link
                to="/deals"
                className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[14px] border border-[var(--ps-brd)] text-[var(--ps-muted)] text-sm font-medium hover:text-white"
              >
                Deals
              </Link>
            </div>
          </div>

          {/* Main Category Cards - Mobile Carousel */}
          <div className="block md:hidden max-w-7xl mx-auto relative">
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{ transform: `translateX(-${categoryCarouselIndex * 100}%)` }}
              >
                {categories.map((item) => (
                  <div
                    key={item.id}
                    className="min-w-full px-2"
                  >
                    <div
                      onClick={() => handleCategoryCardClick(item)}
                      className={`group ${item.coming_soon ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="rounded-2xl overflow-hidden h-[220px] relative border border-[var(--ps-brd)] bg-[var(--ps-card)]">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 pointer-events-none" />
                        <MediaImage
                          src={item.image}
                          alt={`${item.name} on PinkSurfing marketplace`}
                          className="absolute inset-0 w-full h-full object-cover"
                          skeletonClassName="absolute inset-0"
                          loading="eager"
                        />
                        {item.coming_soon && (
                          <div className="absolute inset-0 z-[15] flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
                            <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-bold text-white tracking-wide">
                              Coming soon
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                          <h3 className="text-white text-2xl font-bold mb-2">{item.name}</h3>
                          {!item.coming_soon && (
                            <div className="flex items-center text-purple-300">
                              <span className="text-sm font-semibold">Explore Now</span>
                              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {categories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCategoryCarouselIndex(index)}
                  className={`transition-all duration-300 rounded-full ${categoryCarouselIndex === index
                    ? "w-8 h-3 bg-gradient-to-r from-purple-500 to-pink-500"
                    : "w-3 h-3 bg-white/30 hover:bg-white/50"
                    }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={() => setCategoryCarouselIndex((prev) => (prev > 0 ? prev - 1 : categories.length - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full p-3 transition-all z-10"
              aria-label="Previous slide"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCategoryCarouselIndex((prev) => (prev < categories.length - 1 ? prev + 1 : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-md hover:bg-white/20 rounded-full p-3 transition-all z-10"
              aria-label="Next slide"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Main Category Cards - Desktop Grid */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6 max-w-7xl mx-auto">
            {categories.map((item) => (
              <div
                key={item.id}
                onClick={() => handleCategoryCardClick(item)}
                className={`group transform transition-transform duration-200 ${
                  item.coming_soon
                    ? "cursor-default"
                    : "cursor-pointer hover:-translate-y-1"
                }`}
              >
                <div className={`rounded-2xl overflow-hidden h-[200px] sm:h-[220px] relative border border-[var(--ps-brd)] bg-[var(--ps-card)] transition-colors ${item.coming_soon ? "" : "hover:border-white/25"}`}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent z-10 pointer-events-none" />
                  <MediaImage
                    src={item.image}
                    alt={`${item.name} on PinkSurfing marketplace`}
                    className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${item.coming_soon ? "" : "group-hover:scale-[1.04]"}`}
                    skeletonClassName="absolute inset-0"
                    loading="eager"
                  />
                  {item.coming_soon && (
                    <div className="absolute inset-0 z-[15] flex items-center justify-center bg-black/45">
                      <span className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-xs font-semibold text-white">
                        Coming soon
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                    <h3 className="text-white text-lg sm:text-xl font-semibold mb-1 tracking-tight">{item.name}</h3>
                    {!item.coming_soon && (
                      <span className="text-sm font-medium text-pink-200/90">Explore</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Browse by Category */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-12 py-10 sm:py-12 bg-white/5 border-y border-white/10 overflow-hidden">
          <div className="relative max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Browse by Category
              </span>
            </h2>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Explore businesses for sale, real estate, vehicles, perfumes, electronics, and more on the PinkSurfing marketplace.
            </p>

            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-5 justify-items-stretch"
              role="list"
            >
              {subCategories.map((item, index) => {
                const imgSrc = item.image || item.image2;
                const isSoon = Boolean(item.coming_soon);
                const handleClick = () => {
                  if (isSoon) {
                    toast.info("This category is coming soon!", { position: "top-right", autoClose: 2200 });
                    return;
                  }
                  setCategory(String(item.category).toLowerCase());
                  navigate(`/category/${String(item.category).toLowerCase()}`);
                };

                return (
                  <motion.div
                    key={item.id}
                    role="listitem"
                    initial={reducedMotion ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.22, delay: Math.min(index * 0.05, 0.3) }}
                    className={`min-w-0 ${isSoon ? "opacity-90" : ""}`}
                  >
                    <button
                      type="button"
                      onClick={handleClick}
                      className={`
                        group w-full text-left rounded-2xl overflow-hidden
                        border border-[var(--ps-brd)] bg-[var(--ps-card)]
                        transition-colors
                        hover:border-white/25 hover:-translate-y-1
                        focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ps-cyan)]
                        ${isSoon ? "cursor-default" : "cursor-pointer active:scale-[0.98]"}
                      `}
                    >
                      <div className="relative aspect-[4/5] sm:aspect-square w-full overflow-hidden">
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-[#0e0f13] via-[#0e0f13]/30 to-transparent z-[1] pointer-events-none"
                          aria-hidden
                        />
                        <MediaImage
                          src={imgSrc}
                          alt={`${item.name} category on PinkSurfing`}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          skeletonClassName="absolute inset-0"
                          loading="lazy"
                        />
                        {isSoon && (
                          <div className="absolute inset-0 z-[3] flex items-center justify-center bg-black/45 backdrop-blur-[2px]">
                            <span className="px-2 py-1 rounded-lg bg-white/10 border border-white/20 text-[10px] sm:text-xs font-bold text-white tracking-wide">
                              Coming soon
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 z-[4] p-3 sm:p-3.5 pt-10 bg-gradient-to-t from-black via-black/70 to-transparent">
                          <h3 className="text-xs sm:text-sm font-semibold text-white text-center leading-snug line-clamp-2 drop-shadow-lg group-hover:text-pink-100 transition-colors">
                            {item.name}
                          </h3>
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-12 py-12">
          <div className="max-w-7xl mx-auto">

            <LayoutGroup>
              <div
                className="relative flex flex-wrap justify-center gap-1 sm:gap-2 mb-8 p-1 rounded-2xl bg-[var(--ps-surf)]/60 border border-[var(--ps-brd)] max-w-3xl mx-auto"
                role="tablist"
                aria-label="Featured collections"
              >
                {fetchedCategories.map((category) => {
                  const active = selectedCategory === category.id;
                  const Icon = category.Icon;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`relative z-10 flex items-center gap-2 min-h-[44px] px-3 sm:px-4 rounded-xl text-sm font-medium transition-colors ${
                        active ? "text-white" : "text-[var(--ps-muted)] hover:text-white"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="home-tab-pill"
                          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[var(--ps-primary)] to-[var(--ps-purple-dark)]"
                          transition={tabTransition}
                        />
                      )}
                      <span className="relative z-10 inline-flex items-center gap-2">
                        <Icon className="text-base" aria-hidden="true" />
                        <span className="hidden sm:inline">{category.name}</span>
                        <span className="sm:hidden">{category.name.split(" ")[0]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>

            <div className="relative min-h-[280px]">
              <AnimatePresence mode="sync" initial={false}>
                <motion.div
                  key={selectedCategory}
                  role="tabpanel"
                  initial={reducedMotion ? false : { opacity: 0.35 }}
                  animate={{ opacity: 1 }}
                  exit={reducedMotion ? undefined : { opacity: 0 }}
                  transition={tabTransition}
                >
                  {selectedCategory === 1 && (
                    storeLoading ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="rounded-2xl border border-[var(--ps-brd)] overflow-hidden">
                            <Skeleton className="h-[160px] w-full" rounded="none" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(stores || []).slice(0, 6).map((store, storeIndex) => (
                          <StoreCard key={store?.id || storeIndex} store={store} />
                        ))}
                      </div>
                    )
                  )}
                  {selectedCategory === 2 && (
                    catalogLoading ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <ProductCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {(getDiscountedProducts() || []).slice(0, 8).map((product) => (
                          <ProductCard key={product.id} product={product} isCard={true} />
                        ))}
                      </div>
                    )
                  )}
                  {selectedCategory === 3 && (
                    catalogLoading ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <ProductCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {(featuredProducts || []).slice(0, 8).map((product) => (
                          <ProductCard key={product.id} product={product} isCard={true} />
                        ))}
                      </div>
                    )
                  )}
                  {selectedCategory === 4 && (
                    catalogLoading ? (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <ProductCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {(featuredProducts || []).slice(0, 4).map((product) => (
                          <ProductCard key={product.id} product={product} isCard={true} />
                        ))}
                      </div>
                    )
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </section>
      </div>

      {/* <ChannelsForSale /> */}

      {/* Vendor Registration Dialog */}
      <Transition appear show={isVendorDialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsVendorDialogOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-3xl glass bg-[#1a1a24] border border-purple-500/30 p-8 text-left align-middle shadow-2xl shadow-purple-500/20 transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-bold mb-2 flex items-center justify-between"
                  >
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Become a Vendor
                    </span>
                    <button
                      onClick={() => setIsVendorDialogOpen(false)}
                      className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                    >
                      <IoClose size={24} />
                    </button>
                  </Dialog.Title>

                  <p className="text-sm text-gray-400 mb-6">
                    Please fill in the shipping related information to register as a vendor.
                  </p>

                  <form onSubmit={handleVendorRegistration} className="space-y-5">
                    {/* Store Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Store Name <span className="text-pink-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="store_name"
                        value={vendorFormData.store_name}
                        onChange={handleVendorFormChange}
                        required
                        className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/5 text-white placeholder-gray-500 transition-all"
                        placeholder="Enter your store name"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={vendorFormData.website}
                        onChange={handleVendorFormChange}
                        className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/5 text-white placeholder-gray-500 transition-all"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={vendorFormData.bio}
                        onChange={handleVendorFormChange}
                        rows="3"
                        className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/5 text-white placeholder-gray-500 transition-all resize-none"
                        placeholder="Tell us about your store"
                      />
                    </div>

                    {/* Store Image Upload */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Store Image
                      </label>
                      <div className="space-y-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStoreImageChange}
                          className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 bg-white/5 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-500 file:to-pink-500 file:text-white hover:file:from-purple-600 hover:file:to-pink-600 file:cursor-pointer transition-all"
                        />

                        {storeImagePreview && (
                          <div className="relative inline-block">
                            <img
                              src={storeImagePreview}
                              alt="Store preview"
                              className="w-28 h-28 object-cover rounded-xl border-2 border-purple-500/30"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveStoreImage}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-colors"
                              title="Remove image"
                            >
                              <IoClose size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipping Address Section */}
                    <div className="border-t border-white/10 pt-6 mt-6">
                      <h4 className="text-lg font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Shipping Address
                      </h4>

                      <div className="space-y-4">
                        {/* Street 1 */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Street Address 1 <span className="text-pink-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="street1"
                            value={vendorFormData.street1}
                            onChange={handleVendorFormChange}
                            required
                            className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/5 text-white placeholder-gray-500 transition-all"
                            placeholder="Street address"
                          />
                        </div>

                        {/* Street 2 */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Street Address 2
                          </label>
                          <input
                            type="text"
                            name="street2"
                            value={vendorFormData.street2}
                            onChange={handleVendorFormChange}
                            className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/5 text-white placeholder-gray-500 transition-all"
                            placeholder="Apartment, suite, etc. (optional)"
                          />
                        </div>

                        {/* Country, State, City Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Country */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                              Country <span className="text-pink-500">*</span>
                            </label>
                            <select
                              name="country"
                              value={vendorFormData.country}
                              onChange={handleVendorFormChange}
                              required
                              className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/5 text-white transition-all cursor-pointer"
                            >
                              <option value="" className="bg-[#1a1a24]">Select Country</option>
                              {countries.map((country) => (
                                <option key={country.isoCode} value={country.isoCode} className="bg-[#1a1a24]">
                                  {country.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* State */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                              State <span className="text-pink-500">*</span>
                            </label>
                            <select
                              name="state"
                              value={vendorFormData.state}
                              onChange={handleVendorFormChange}
                              required
                              disabled={!vendorFormData.country}
                              className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/5 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="" className="bg-[#1a1a24]">Select State</option>
                              {states.map((state) => (
                                <option key={state.isoCode} value={state.isoCode} className="bg-[#1a1a24]">
                                  {state.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* City */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">
                              City <span className="text-pink-500">*</span>
                            </label>
                            <select
                              name="city"
                              value={vendorFormData.city}
                              onChange={handleVendorFormChange}
                              required
                              disabled={!vendorFormData.state}
                              className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/5 text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="" className="bg-[#1a1a24]">Select City</option>
                              {cities.map((city) => (
                                <option key={city.name} value={city.name} className="bg-[#1a1a24]">
                                  {city.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Zip Code */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-300 mb-2">
                            Zip Code <span className="text-pink-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="zip_code"
                            value={vendorFormData.zip_code}
                            onChange={handleVendorFormChange}
                            required
                            className="w-full px-4 py-3 glass border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/5 text-white placeholder-gray-500 transition-all"
                            placeholder="Enter zip code"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-6">
                      <button
                        type="button"
                        onClick={() => setIsVendorDialogOpen(false)}
                        className="flex-1 px-5 py-2.5 border border-white/20 rounded-xl text-gray-300 hover:bg-white/10 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold shadow-lg"
                      >
                        {isSubmitting ? "Registering..." : "Register as Vendor"}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};

export default Home;
