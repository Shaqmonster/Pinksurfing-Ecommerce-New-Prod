import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
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
    if (!user || !cookies.token) {
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
    
    if (!cookies.token) {
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
            Authorization: `Bearer ${cookies.token}`,
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
            Authorization: `Bearer ${cookies.token}`,
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
      <SearchForm />
      <div
        className={`w-full min-h-screen flex flex-col font-robotoMono ${isDarkMode ? "bg-[#0E0F13]" : "bg-white"
          }`}
      >
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
        <div className="w-full py-3 flex my-3 items-center gap-x-32 justify-between 2xl:justify-start flex-wrap px-[4.5%]">
          <div className="w-full grid grid-cols-1 my-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((item, index) => (
              <div
                onClick={() => {
                  if (item.id === 3) {
                    handleMyStoreClick();
                  } else if (item.id === 1 || item.id === 2) {
                    setCategory("shoppingMall");
                    localStorage.setItem("category", "shoppingMall");
                    localStorage.setItem("category_name", item.name);
                    navigate(`/categoryProducts`);
                  } else {
                    navigate(`/shoppingMall/all`);
                  }
                }}
                key={item.id + index}
                className=""
              >
                <div className="w-full lg:ml-12 ml-0 sm:w-[330px] lg:w-[360px] h-[260px] flex flex-col items-center gap-1 text-black dark:text-[#f5f5f5] cursor-pointer">
                  <div  className="w-full h-[85%] flex overflow-hidden p-0 items-center justify-center border border-pink-500 rounded-xl shadow-md bg-[#2d1e5f]">
                    <picture>
                      {/* Use responsive image sizes and next-gen formats */}
                      <source
                        srcSet={`${item.image}?w=480&format=webp 480w, ${item.image}?w=800&format=webp 800w, ${item.image}?w=1200&format=webp 1200w`}
                        type="image/webp"
                      />
                      <source
                        srcSet={`${item.image}?w=480 480w, ${item.image}?w=800 800w, ${item.image}?w=1200 1200w`}
                        type="image/jpeg"
                      />
                      <img
                        src={`${item.image}?w=800`}
                        className={""}
                        loading={"lazy"}
                        alt={item.name || "Descriptive image"} 
                        decoding="async"
                        fetchpriority="low"
                      />
                    </picture>
                  </div>

                  <p className="font-medium text-[18px]">{item.name}</p>
                </div>
              </div>
            ))}
          </div>


          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-4 gap-y-5 mt-5 w-full pt-[3%] text-black dark:text-[#f5f5f5]">
            {subCategories.map((item, index) => (
              <div
                className="cursor-pointer"
                key={item.id + index}
                onClick={() => {
                  setCategory(item.category.toLowerCase());
                  localStorage.setItem("category", item.category.toLowerCase());
                  localStorage.setItem("category_name", item.name);
                  navigate(`/categoryProducts`);
                }}
              >
                <div className="w-full sm:w-[150px] h-[140px] flex flex-col items-center gap-1">
                  {
                    item.id == "6" ? (
                      <a
                        className="w-[90px] sm:w-full h-[90px] sm:h-full flex items-center justify-center shadow-md rounded-md border border-pink-500 overflow-hidden bg-[#2d1e5f] group"
                      >
                        <img
                          alt="sub category image"
                          src={item.image}
                          className={`${item.extraclass} rounded-md group-hover:hidden`}
                        />
                        <img
                          src={item.image2}
                          alt="sub category image"

                          className={`${item.extraclass} rounded-md hidden group-hover:block`}
                        />
                      </a>
                    ) : (
                      <Link
                        className="w-[90px] sm:w-full h-[90px] sm:h-full flex items-center justify-center shadow-md rounded-md border border-pink-500 overflow-hidden bg-[#2d1e5f]"
                      >
                        <img
                          alt="sub category image"
                          src={item.image}
                          className={`${item.extraclass} rounded-md hover:scale-105`}
                        />
                      </Link>
                    )
                  }

                  <p className="font-medium text-[13px] text-center">{item.name}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
        <svg width="601" height="1031" viewBox="0 0 601 1031" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-[10%] left-0 z-[0] pointer-events-none hidden lg:block">
          <g filter="url(#filter0_f_1_3194)">
            <circle cx="85.5" cy="515.5" r="207.5" fill="#8B33FE" fill-opacity="0.4" />
          </g>
          <defs>
            <filter id="filter0_f_1_3194" x="-430" y="0" width="1031" height="1031" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="154" result="effect1_foregroundBlur_1_3194" />
            </filter>
          </defs>
        </svg>

        <svg width="1110" height="1195" viewBox="0 0 1110 1195" fill="none" xmlns="http://www.w3.org/2000/svg"
          className="absolute right-0 z-[0] pointer-events-none"

        >
          <g filter="url(#filter0_f_1_2273)">
            <path d="M805 597.399C805 711.567 712.099 804.117 597.5 804.117C482.901 804.117 390 711.567 390 597.399C390 483.232 482.901 390.681 597.5 390.681C712.099 390.681 805 483.232 805 597.399Z" fill="#8B33FE" fill-opacity="0.4" />
          </g>
          <defs>
            <filter id="filter0_f_1_2273" x="0" y="0.681152" width="1195" height="1193.44" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
              <feFlood flood-opacity="0" result="BackgroundImageFix" />
              <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
              <feGaussianBlur stdDeviation="195" result="effect1_foregroundBlur_1_2273" />
            </filter>
          </defs>
        </svg>
        {/* Category Product Sliders */}
        {/* {fetchedCategories.map((category, index) => (
          <div
            key={category.id}
            className="my-5 mx-5 text-black dark:text-slate-300"
          >
            <h2 className="text-2xl font-semibold mb-3 flex justify-between items-center capitalize">
              {category.name}
              <Link
                to={`/shopByStore`}
                className="px-6 py-1 border border-gray-300 text-xs rounded-lg hover:bg-gray-100 mr-10"
                style={{ background: "transparent" }}
              >
                View all
              </Link>
            </h2>
            {category.id === 1 && (
              <div>
                {storeLoading ? (
                  <div className="flex justify-center items-center">
                    <img
                      src="/loading.svg"
                      alt="loading"
                      className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
                    />
                  </div>
                ) : (
                  <Carousel responsive={responsive} itemClass="p-2">
                    {stores.map((store, storeIndex) => (
                      <div key={storeIndex} className="p-2 w-full md:w-4/5 lg:w-10/12">
                        <Link
                          className="border border-gray-300 rounded-lg w-full h-full flex flex-col items-center gap-1 overflow-hidden cursor-pointer"
                          to={`/store/${store.slug}`}
                        >
                          <img
                            src={
                              store.store_image
                                ? `${awsS3BaseUrl}${store.store_image}`
                                : "https://media-cldnry.s-nbcnews.com/image/upload/t_nbcnews-fp-1024-512,f_auto,q_auto:best/newscms/2017_26/2053956/170627-better-grocery-store-main-se-539p.jpg"
                            }
                            alt={store.store_name}
                            className="w-full h-[180px] object-cover"
                          />
                        </Link>
                        <h3 className="mt-2 text-lg font-medium text-center">
                          {store.store_name}
                        </h3>
                      </div>
                    ))}
                  </Carousel>

                )}
              </div>
            )}
            {category.id === 2 && (
              <div>
                <Carousel responsive={responsive} itemClass="p-2">
                  {getDiscountedProducts().map((product, productIndex) => (
                    <div key={productIndex} className="p-2 w-full md:w-4/5 lg:w-10/12">
                      <Link
                        to={`/product/productDetail/${product.slug}?productId=${product.id}`}
                        className="border border-gray-300 rounded-lg w-full h-full flex flex-col items-center gap-1 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={product.image1}
                          alt={product.title}
                          className="w-full h-[180px] object-cover"
                        />
                      </Link>
                      <div className="p-2 text-center">
                        <p className="font-medium text-[14px]">{product.name}</p>
                        <p className="text-[16px] font-semibold">
                          {currency}
                          {Number(product.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </Carousel>
              </div>
            )}

          </div>
        ))} */}
        <div className="bg-white dark:bg-[#0E0F13] text-black dark:text-white py-4 sm:py-6 md:py-8 lg:py-10 px-4 sm:px-6 md:px-8 lg:px-12 border border-dashed my-8 mx-4 sm:mx-8 md:mx-16 rounded-xl"
          style={{
            border: "2px dashed #D5C1EEB2",
            borderStyle: "dashed",
            borderImage: "none",
            borderWidth: "2px",
            borderRadius: "16px",
            borderImageSlice: "5",
            borderImageRepeat: "none"

          }}
        >

          {/* Header Section */}
          <h1 className="md:text-4xl text-3xl font-playfair  mx-auto text-start mb-4 text-[#B881FF] lg:px-10">
            Elevate Style With Latest Collection
          </h1>
          <p className="text-start font-roboto text-gray-800 dark:text-gray-300 mb-8 lg:px-10">
            Each piece is crafted to enhance your fashion statement.
          </p>


          {/* Tabs Section */}
          <div className="flex flex-wrap justify-start gap-4 mb-8 lg:px-10">
            {fetchedCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`sm:px-6 px-2 py-2 rounded-lg font-robotoMono sm:text-sm text-xs transition ${selectedCategory === category.id
                  ? "bg-[#B881FF] text-[#1A1C1E]"
                  : "bg-transparent border border-dashed border-[#333333] text-black  dark:text-[#B3B3B2]"
                  }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Conditional Rendering Based on Selected Tab */}
          <div className="mx-auto max-w-7xl">
            {selectedCategory === 1 && (
              <div>
                {/* First Tab: Shop By Store */}
                {storeLoading ? (
                  <div className="flex justify-center items-center">
                    <img
                      src="/loading.svg"
                      alt="loading"
                      className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stores.map((store, storeIndex) => (
                      <div
                        key={storeIndex}
                        className="p-4 w-full"
                      >
                        <Link
                          to={`/store/${store.slug}`}
                          className="border border-gray-300 rounded-lg w-full h-full flex flex-col items-center gap-1 overflow-hidden cursor-pointer"
                        >
                          <img
                            src={`${awsS3BaseUrl}${store.store_image}`                            }
                            alt={store.store_name}
                            className="w-full h-[180px] object-cover"
                          />
                        </Link>
                        <h3 className="mt-2 text-lg font-robotoMono text-center">
                          {store.store_name}
                        </h3>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedCategory === 2 && (
              <div>
                {/* Second Tab: Trending Top Sales */}
                <Carousel responsive={responsive} itemClass="p-2">
                  {getDiscountedProducts().map((product, productIndex) => (
                    <div
                      key={productIndex}
                      className="p-2 w-full md:w-4/5 lg:w-10/12"
                    >
                      <Link
                        to={`/product/productDetail/${product.slug}?productId=${product.id}`}
                        className="border border-gray-300 rounded-lg w-full h-full flex flex-col items-center gap-1 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={product.image1}
                          alt={product.title}
                          className="w-full h-[180px] object-cover"
                        />
                      </Link>
                      <div className="p-2 text-center">
                        <p className="font-medium text-[14px]">{product.name}</p>
                        <p className="text-[16px] font-semibold">
                          {product.currency}
                          {Number(product.unit_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </Carousel>
              </div>
            )}

            {/* Placeholder for third and fourth tabs */}
            {selectedCategory > 2 && (
              <div className="text-center text-gray-400">
                Coming Soon: Content for {fetchedCategories[selectedCategory - 1]?.name}
              </div>
            )}
          </div>

        </div>

      </div >
      <ChannelsForSale />

      {/* Vendor Registration Dialog */}
      <Transition appear show={isVendorDialogOpen} as={Fragment}>
        <Dialog
          as="div"
          className={`relative ${isDarkMode && "dark"} z-50`}
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center justify-between"
                  >
                    <span>Become a Vendor</span>
                    <button
                      onClick={() => setIsVendorDialogOpen(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <IoClose size={28} />
                    </button>
                  </Dialog.Title>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Please fill in the shipping related information to register as a vendor.
                  </p>

                  <form onSubmit={handleVendorRegistration} className="space-y-4">
                    {/* Store Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Store Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="store_name"
                        value={vendorFormData.store_name}
                        onChange={handleVendorFormChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Enter your store name"
                      />
                    </div>

                    {/* Website */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        name="website"
                        value={vendorFormData.website}
                        onChange={handleVendorFormChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Bio
                      </label>
                      <textarea
                        name="bio"
                        value={vendorFormData.bio}
                        onChange={handleVendorFormChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                        placeholder="Tell us about your store"
                      />
                    </div>

                    {/* Store Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Store Image
                      </label>
                      <div className="space-y-2">
                        {/* File input */}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleStoreImageChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-gray-700 dark:file:text-purple-300"
                        />
                        
                        {/* Image preview */}
                        {storeImagePreview && (
                          <div className="relative inline-block">
                            <img
                              src={storeImagePreview}
                              alt="Store preview"
                              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveStoreImage}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              <IoClose size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Shipping Address Section */}
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-4 mt-4">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        Shipping Address
                      </h4>

                      {/* Street 1 */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Street Address 1 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="street1"
                          value={vendorFormData.street1}
                          onChange={handleVendorFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Street address"
                        />
                      </div>

                      {/* Street 2 */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Street Address 2
                        </label>
                        <input
                          type="text"
                          name="street2"
                          value={vendorFormData.street2}
                          onChange={handleVendorFormChange}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>

                      {/* Country, State, City in a grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Country */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Country <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="country"
                            value={vendorFormData.country}
                            onChange={handleVendorFormChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">Select Country</option>
                            {countries.map((country) => (
                              <option key={country.isoCode} value={country.name}>
                                {country.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* State */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            State <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="state"
                            value={vendorFormData.state}
                            onChange={handleVendorFormChange}
                            required
                            disabled={!vendorFormData.country}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
                          >
                            <option value="">Select State</option>
                            {states.map((state) => (
                              <option key={state.isoCode} value={state.name}>
                                {state.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* City */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            City <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="city"
                            value={vendorFormData.city}
                            onChange={handleVendorFormChange}
                            required
                            disabled={!vendorFormData.state}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white disabled:opacity-50"
                          >
                            <option value="">Select City</option>
                            {cities.map((city) => (
                              <option key={city.name} value={city.name}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Zip Code */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Zip Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="zip_code"
                          value={vendorFormData.zip_code}
                          onChange={handleVendorFormChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
                          placeholder="Enter zip code"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setIsVendorDialogOpen(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
