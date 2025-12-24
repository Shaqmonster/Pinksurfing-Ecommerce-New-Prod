import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { motion } from "framer-motion";
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


const responsive = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 4 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 2 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};


const Home = () => {
  const navigate = useNavigate();
  const [cookies] = useCookies([]);
  const { setCategory, isDarkMode, user, currency } = useContext(authContext);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeLoading, setStoreLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(1); // Default to 'Buyer's Choice'
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
    if (selectedCategory === 3) return products; // Buyer's Choice shows all products
    return products.slice(0, 4); // Other categories display limited items
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


  const fetchedCategories = [
    { id: 1, name: "Shop By Store" },
    { id: 2, name: "Trending Top Sales" },
    { id: 3, name: "Buyer's Choice" },
    { id: 4, name: "Pinksurfing finds" },
  ];
  const awsS3BaseUrl =
    "https://pinksurfing-ecom.s3.us-east-2.amazonaws.com/";

  // Initialize countries on component mount
  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  // Handle My Store click
  const handleMyStoreClick = () => {
    // Check if user is logged in
    if (!user || !cookies.access_token) {
      toast.info("Please sign in to access your store");
      navigate("/signin");
      return;
    }

    // Check if user is already a vendor
    const isVendor = user.is_vendor || localStorage.getItem("user.vendorAccess") === "true";

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

      const countryCode = countries.find((c) => c.name === value)?.isoCode;
      if (countryCode) {
        setStates(State.getStatesOfCountry(countryCode));
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

      const stateCode = states.find((s) => s.name === value)?.isoCode;
      const countryCode = countries.find((c) => c.name === vendorFormData.country)?.isoCode;
      if (stateCode && countryCode) {
        setCities(City.getCitiesOfState(countryCode, stateCode));
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

    if (!cookies.access_token) {
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
            Authorization: `Bearer ${cookies.access_token}`,
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

      // Close dialog
      setIsVendorDialogOpen(false);

      // Redirect to vendor login after a short delay
      setTimeout(() => {
        window.open("https://vendors.pinksurfing.com", "_blank");
      }, 2000);

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
        setStores(storesResponse.data.stores);
        console.log(storesResponse.data.stores);
      } catch (error) {
        console.error(error);
      } finally {
        setStoreLoading(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const productsResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/product/all-products/`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );
        console.log(productsResponse.data.Products);
        setProducts(productsResponse.data.Products);
      } catch (error) {
        console.error(error);
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
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      )
      .then((response) => {
        navigate(address);
        setProducts(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const calculateDiscount = (mrp, unitPrice) => {
    const numericMrp = Number(mrp);
    const numericUnitPrice = Number(unitPrice);
    if (isNaN(numericMrp) || isNaN(numericUnitPrice) || numericMrp === 0) {
      return 0;
    }
    return ((numericMrp - numericUnitPrice) / numericMrp) * 100;
  };

  const getDiscountedProducts = () => {
    return products.filter(
      (product) => calculateDiscount(product.mrp, product.unit_price) > 5
    );
  };

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
      {/* Main Container */}
      <div className="w-full min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#13131a] to-[#0a0a0f] relative overflow-hidden">

        {/* Simple Static Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-600/20 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-600/20 rounded-full blur-[100px]"></div>
        </div>

        {/* Hero Section - Main Categories */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-12 pt-8 pb-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                Discover Amazing Deals
              </span>
            </h1>
            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Shop from thousands of products across multiple categories
            </p>
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
                      onClick={() => {
                        if (item.id === 3) {
                          handleMyStoreClick();
                        } else if (item.id === 2) {
                          navigate(`/coming-soon`);
                        } else if (item.id === 1) {
                          navigate(`/shoppingMall`);
                        } else {
                          navigate(`/shoppingMall`);
                        }
                      }}
                      className="group cursor-pointer"
                    >
                      <div className="rounded-2xl overflow-hidden h-[350px] relative border border-white/10">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                          <h3 className="text-white text-2xl font-bold mb-2">{item.name}</h3>
                          <div className="flex items-center text-purple-300">
                            <span className="text-sm font-semibold">Explore Now</span>
                            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
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
                onClick={() => {
                  if (item.id === 3) {
                    handleMyStoreClick();
                  } else if (item.id === 2) {
                    navigate(`/coming-soon`);
                  } else {
                    navigate(`/shoppingMall`);
                  }
                }}
                className="group cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
              >
                <div className="rounded-2xl overflow-hidden h-[260px] sm:h-[280px] relative border border-white/10 hover:border-purple-500/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
                    <h3 className="text-white text-lg sm:text-xl font-bold mb-1">{item.name}</h3>
                    <div className="flex items-center text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-sm font-medium">Explore Now</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sub Categories Section */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-12 py-10 bg-white/5 border-y border-white/10">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
              <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Browse by Category
              </span>
            </h2>

            {/* Mobile: Grid Layout */}
            <div className="block md:hidden">
              <div className="grid grid-cols-3 gap-4">
                {subCategories.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      console.log(item.id);
                      if (item.id == 5) {
                        console.log("Gigs Pro");
                        window.location.href = "https://gighub.pinksurfing.com/";
                      } else {
                        setCategory(item.category.toLowerCase());
                        localStorage.setItem("category", item.category.toLowerCase());
                        localStorage.setItem("category_name", item.name);
                        navigate(`/categoryProducts`);
                      }
                    }}
                    className="cursor-pointer group"
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 mb-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-white/10 flex items-center justify-center overflow-hidden group-hover:border-purple-500/50 transition-colors">
                        <img
                          src={item.image}
                          alt={item.name}
                          className={`w-full h-full object-contain p-2 ${item.extraclass || ''}`}
                          loading="lazy"
                        />
                      </div>
                      <span className="text-gray-300 text-xs text-center font-medium line-clamp-2">
                        {item.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Desktop: Grid Layout */}
            <div className="hidden md:grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {subCategories.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setCategory(item.category.toLowerCase());
                    localStorage.setItem("category", item.category.toLowerCase());
                    localStorage.setItem("category_name", item.name);
                    navigate(`/categoryProducts`);
                  }}
                  className="cursor-pointer group hover:-translate-y-1 transition-transform duration-200"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-full aspect-square mb-2 rounded-xl overflow-hidden border border-white/10 group-hover:border-purple-500/50 transition-colors bg-[#1a1a24]/50 flex items-center justify-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className={`w-full h-full object-contain p-2 ${item.extraclass || ''}`}
                        loading="lazy"
                      />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-300 text-center group-hover:text-purple-300 transition-colors">
                      {item.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="relative z-10 px-4 sm:px-6 lg:px-12 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  Elevate Style With Latest Collection
                </span>
              </h2>
              <p className="text-gray-400 text-base max-w-2xl mx-auto">
                Each piece is crafted to enhance your fashion statement.
              </p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8">
              {fetchedCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${selectedCategory === category.id
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                    : "bg-white/5 border border-white/10 text-gray-300 hover:border-purple-500/50"
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div>
              {/* Shop By Store */}
              {selectedCategory === 1 && (
                <div>
                  {storeLoading ? (
                    <div className="flex justify-center items-center py-16">
                      <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {stores.slice(0, 6).map((store, storeIndex) => (
                        <StoreCard key={storeIndex} store={store} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Trending Top Sales */}
              {selectedCategory === 2 && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {getDiscountedProducts().slice(0, 8).map((product, productIndex) => (
                    <ProductCard key={productIndex} product={product} isCard={true} />
                  ))}
                </div>
              )}

              {/* Buyer's Choice */}
              {selectedCategory === 3 && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.slice(0, 8).map((product, productIndex) => (
                    <ProductCard key={productIndex} product={product} isCard={true} />
                  ))}
                </div>
              )}

              {/* Pinksurfing Finds */}
              {selectedCategory === 4 && (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.slice(0, 4).map((product, productIndex) => (
                    <ProductCard key={productIndex} product={product} isCard={true} />
                  ))}
                </div>
              )}
            </div>

            {/* View All Button */}
            {(selectedCategory === 1 || selectedCategory === 3) && (
              <div className="text-center mt-10">
                <Link
                  to={selectedCategory === 1 ? "/shoppingMall" : "/shoppingMall"}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-colors duration-200 shadow-lg"
                >
                  <span>View All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            )}
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
                                <option key={country.isoCode} value={country.name} className="bg-[#1a1a24]">
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
                                <option key={state.isoCode} value={state.name} className="bg-[#1a1a24]">
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
