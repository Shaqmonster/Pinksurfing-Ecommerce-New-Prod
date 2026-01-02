import { useContext, useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import ProductCard from "../components/ProductCard";
import { dataContext } from "../context/dataContext";
import { Fragment } from "react";
import { Dialog, Disclosure, Menu, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ChevronDownIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/20/solid";
import { authContext } from "../context/authContext";
import MultiRangeSlider from "multi-range-slider-react";
import { AiOutlineBars } from "react-icons/ai";
import { HiMiniSquares2X2 } from "react-icons/hi2";
import SearchForm from "../components/Search";

export default function CategoryProducts() {
  const { category } = useParams();
  const navigate = useNavigate();
  const [cookies, removeCookie] = useCookies([]);
  const { products } = useContext(dataContext);
  const { currency, isDarkMode } = useContext(authContext);

  // State Management
  const [filterBy, setFilterBy] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [CategoryOnlyData, setCategoryOnlyData] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [shoppingProduct, setShoppingProducts] = useState(products);
  const [uniqueAttributes, setUniqueAttributes] = useState([]);
  const [maxValue, setMaxValue] = useState(1000);
  const [sortMethod, setSortMethod] = useState("default");
  const [sortName, setSortName] = useState("Newest");
  const [loading, setLoading] = useState(false);
  const [minValue, setMinValue] = useState(0);
  const [maximumValue, setMaximumValue] = useState(20000);
  const [isCard, setIsCard] = useState(true);
  const [subcategories, setSubcategories] = useState([]);
  const title = localStorage.getItem('category_name');
  const categorySlug = localStorage.getItem('category');

  // Real Estate Specific Logic
  const isResidentialRealEstate = categorySlug === 'residential-real-estate' || title?.toLowerCase().includes('residential real estate');
  const isCommercialRealEstate = categorySlug === 'commercial-real-estate' || title?.toLowerCase().includes('commercial real estate');
  const isRealEstate = isResidentialRealEstate || isCommercialRealEstate;

  // Residential Real Estate Filters
  const [residentialFilters, setResidentialFilters] = useState({
    // Price filters
    min_price: "",
    max_price: "",
    // Listing date filters
    created_within_days: "",
    created_after_days: "",
    // Price per sqft
    price_per_sqft_min: "",
    price_per_sqft_max: "",
    // Bedroom/Bathroom
    bedrooms_min: "",
    bedrooms_max: "",
    bathrooms_min: "",
    bathrooms_max: "",
    // Property size
    sqft_min: "",
    sqft_max: "",
    // Lot size
    lot_size_min: "",
    lot_size_max: "",
    // Year built (min only)
    year_built_min: "",
    // Amenities (checkboxes)
    is_waterfront: false,
    has_garage: false,
    is_single_story: false,
    has_pool: false,
    // Listing status
    listing_status: ""
  });

  // Commercial Real Estate Filters
  const [commercialFilters, setCommercialFilters] = useState({
    units_min: "",
    units_max: "",
    sqft_min: "",
    sqft_max: "",
    lot_size_min: "",
    lot_size_max: "",
    year_built_min: "",
    listing_status: "",
    created_within_days: ""
  });

  const [residentialSubcats, setResidentialSubcats] = useState([]);
  const [commercialSubcats, setCommercialSubcats] = useState([]);
  const [realEstateLoading, setRealEstateLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Filter Arrays
  const colorArray = [];
  const storageArray = [];
  const sizeArray = [];
  const systemArray = [];

  const filters = [
    { id: "color", name: "Color", options: colorArray },
    { id: "size", name: "Size", options: sizeArray },
    { id: "storage", name: "Storage", options: storageArray },
    { id: "system", name: "System / OS", options: systemArray },
  ];

  const sortMethods = [
    { name: "Newest", value: "date", icon: "🆕" },
    { name: "Price: Low to High", value: "ascPrice", icon: "💰" },
    { name: "Price: High to Low", value: "descPrice", icon: "💎" },
    // { name: "Name: A to Z", value: "ascName", icon: "🔤" },
    // { name: "Name: Z to A", value: "descName", icon: "🔠" },
  ];

  const handleSort = (sortMethod) => {
    switch (sortMethod) {
      case "ascName":
        return (a, b) => (a.name?.toLowerCase() > b.name?.toLowerCase() ? 1 : -1);
      case "descName":
        return (a, b) => (b.name?.toLowerCase() > a.name?.toLowerCase() ? 1 : -1);
      case "ascPrice":
        return (a, b) => (Number(a.unit_price) || 0) - (Number(b.unit_price) || 0);
      case "descPrice":
        return (a, b) => (Number(b.unit_price) || 0) - (Number(a.unit_price) || 0);
      case "date":
        return (a, b) => new Date(b.created_at) - new Date(a.created_at);
      default:
        return (a, b) => (a.id || 0) - (b.id || 0);
    }
  };

  // Filtered and sorted products using useMemo
  const filteredProducts = useMemo(() => {
    if (!shoppingProduct) return [];

    // For Real Estate, server does the filtering, so we mostly pass through, unless we want to do client-side sorting
    if (isRealEstate) {
      return shoppingProduct.sort(handleSort(sortMethod));
    }

    return shoppingProduct
      .filter((i) => {
        const price = Number(i.unit_price) || 0;
        const priceFilterResult = price >= minValue && price <= maximumValue;
        const categoryFilterReturn =
          categoryFilter === "all" ? true : i?.subcategory?.name === categoryFilter;
        return priceFilterResult && categoryFilterReturn;
      })
      .sort(handleSort(sortMethod));
  }, [shoppingProduct, minValue, maximumValue, categoryFilter, sortMethod, isRealEstate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, minValue, maximumValue, sortMethod, filterBy]);

  // Fetch products
  useEffect(() => {
    const getFilterProducts = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/product/subcategories/${categorySlug}/`,
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        let subcategoriesData = response.data;
        subcategoriesData = subcategoriesData.sort((a, b) => a.name.localeCompare(b.name));
        setSubcategories(subcategoriesData);
        setCategoryOnlyData(["all", ...subcategoriesData.map(subcat => subcat.name)]);

        const res = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/product/category-products/${categorySlug}/`,
          { headers: { "Content-Type": "application/json" } }
        );

        const allProducts = res.data;
        const sortedProducts = allProducts.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setShoppingProducts(sortedProducts);

        const prices = allProducts.map((product) => parseFloat(product.unit_price));
        if (prices.length > 0) {
          setMinValue(Math.min(...prices));
          setMaximumValue(Math.max(...prices));
          setMaxValue(Math.max(...prices));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    setCategoryFilter("all");

    if (isRealEstate) {
      // Real Estate Specific Initialization
      const fetchRealEstateSubcats = async () => {
        try {
          if (isResidentialRealEstate) {
            const resSub = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/product/subcategories/residential-real-estate/`);
            setResidentialSubcats(resSub.data.sort((a, b) => a.name.localeCompare(b.name)));
            setSubcategories(resSub.data.sort((a, b) => a.name.localeCompare(b.name)));
            setCategoryOnlyData(["all", ...resSub.data.map(subcat => subcat.name)]);
          } else if (isCommercialRealEstate) {
            const commSub = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/product/subcategories/commercial-real-estate/`);
            setCommercialSubcats(commSub.data.sort((a, b) => a.name.localeCompare(b.name)));
            setSubcategories(commSub.data.sort((a, b) => a.name.localeCompare(b.name)));
            setCategoryOnlyData(["all", ...commSub.data.map(subcat => subcat.name)]);
          }
        } catch (e) {
          console.error("Error fetching RE subcats", e);
        }
      };
      fetchRealEstateSubcats();
      // Initial fetch handled by the effect below watching filters
    } else {
      getFilterProducts();
    }
  }, [categorySlug, isRealEstate]);

  // Real Estate Fetch Logic
  useEffect(() => {
    if (!isRealEstate) return;

    const fetchFilteredRealEstate = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();

        // Base Category/Subcategory
        if (categoryFilter !== 'all') {
          // Find the slug for the selected subcategory name
          const subcatList = isResidentialRealEstate ? residentialSubcats : commercialSubcats;
          const sub = subcatList.find(s => s.name === categoryFilter);
          if (sub) {
            params.append('subcategory_slug', sub.slug);
          }
        } else {
          params.append('category_slug', categorySlug);
        }

        if (isResidentialRealEstate) {
          // Apply Residential Filters
          // Price
          if (residentialFilters.min_price) params.append('min_price', residentialFilters.min_price);
          if (residentialFilters.max_price) params.append('max_price', residentialFilters.max_price);
          
          // Listing date filters
          if (residentialFilters.created_within_days) params.append('created_within_days', residentialFilters.created_within_days);
          if (residentialFilters.created_after_days) params.append('created_after_days', residentialFilters.created_after_days);
          
          // Price per sqft
          if (residentialFilters.price_per_sqft_min) params.append('price_per_sqft_min', residentialFilters.price_per_sqft_min);
          if (residentialFilters.price_per_sqft_max) params.append('price_per_sqft_max', residentialFilters.price_per_sqft_max);
          
          // Bedrooms
          if (residentialFilters.bedrooms_min) params.append('bedrooms_min', residentialFilters.bedrooms_min);
          if (residentialFilters.bedrooms_max) params.append('bedrooms_max', residentialFilters.bedrooms_max);
          
          // Bathrooms
          if (residentialFilters.bathrooms_min) params.append('bathrooms_min', residentialFilters.bathrooms_min);
          if (residentialFilters.bathrooms_max) params.append('bathrooms_max', residentialFilters.bathrooms_max);
          
          // Property size (sqft)
          if (residentialFilters.sqft_min) params.append('sqft_min', residentialFilters.sqft_min);
          if (residentialFilters.sqft_max) params.append('sqft_max', residentialFilters.sqft_max);
          
          // Lot size
          if (residentialFilters.lot_size_min) params.append('lot_size_min', residentialFilters.lot_size_min);
          if (residentialFilters.lot_size_max) params.append('lot_size_max', residentialFilters.lot_size_max);
          
          // Year built (min only)
          if (residentialFilters.year_built_min) params.append('year_built_min', residentialFilters.year_built_min);
          
          // Amenities (checkboxes - only add if true)
          if (residentialFilters.is_waterfront) params.append('is_waterfront', 'true');
          if (residentialFilters.has_garage) params.append('has_garage', 'true');
          if (residentialFilters.is_single_story) params.append('is_single_story', 'true');
          if (residentialFilters.has_pool) params.append('has_pool', 'true');
          
          // Listing status
          if (residentialFilters.listing_status) params.append('listing_status', residentialFilters.listing_status);

        } else if (isCommercialRealEstate) {
          // Apply Commercial Filters
          if (commercialFilters.units_min) params.append('units_min', commercialFilters.units_min);
          if (commercialFilters.units_max) params.append('units_max', commercialFilters.units_max);
          if (commercialFilters.sqft_min) params.append('sqft_min', commercialFilters.sqft_min);
          if (commercialFilters.sqft_max) params.append('sqft_max', commercialFilters.sqft_max);
          if (commercialFilters.lot_size_min) params.append('lot_size_min', commercialFilters.lot_size_min);
          if (commercialFilters.lot_size_max) params.append('lot_size_max', commercialFilters.lot_size_max);
          if (commercialFilters.year_built_min) params.append('year_built_min', commercialFilters.year_built_min);
          if (commercialFilters.listing_status) params.append('listing_status', commercialFilters.listing_status);
          if (commercialFilters.created_within_days) params.append('created_within_days', commercialFilters.created_within_days);
        }

        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/products/filter?${params.toString()}`);
        setShoppingProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch filtered RE products", error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchFilteredRealEstate();
    }, 500); // Debounce

    return () => clearTimeout(timeoutId);

  }, [isRealEstate, isResidentialRealEstate, isCommercialRealEstate, categoryFilter, residentialFilters, commercialFilters, categorySlug, residentialSubcats, commercialSubcats]);

  // Get max price
  useEffect(() => {
    if (shoppingProduct && shoppingProduct.length > 0) {
      const prices = shoppingProduct.map((p) => Number(p.unit_price) || 0);
      const max = Math.max(...prices);
      if (max > 0) {
        setMaxValue(max);
        setMaximumValue(max);
      }
    }
  }, [shoppingProduct]);

  const handleSliderChange = (e) => {
    setMinValue(Number(e.minValue));
    setMaximumValue(Number(e.maxValue));
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "dark bg-[#0A0B0E]" : "bg-gradient-to-br from-slate-50 via-white to-purple-50"}`}>
      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px]"></div>
      </div>

      {/* Mobile Filter Dialog */}
      <Transition.Root show={mobileFiltersOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setMobileFiltersOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto bg-gray-900 shadow-2xl border-l border-purple-500/20">
                {/* Mobile Filter Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FunnelIcon className="w-6 h-6" />
                    Filters
                  </h2>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-4 space-y-6">
                  {/* Subcategories */}
                  <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      Subcategories
                    </h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {CategoryOnlyData.filter(cat => cat && cat !== 'null' && cat !== 'undefined').map((subcategory, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCategoryFilter(subcategory === "all" ? "all" : subcategory);
                            setMobileFiltersOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 ${subcategory === categoryFilter
                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Sort */}
                  <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Sort By
                    </h3>
                    <div className="space-y-2">
                      {sortMethods.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortMethod(option.value);
                            setSortName(option.name);
                            setMobileFiltersOpen(false);
                          }}
                          className={`w-full px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 flex items-center gap-2 ${option.value === sortMethod
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            }`}
                        >
                          <span>{option.icon}</span>
                          {option.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Price Range
                    </h3>
                    <MultiRangeSlider
                      min={0}
                      max={maxValue || 1000}
                      step={5}
                      minValue={minValue}
                      maxValue={maximumValue}
                      label={false}
                      ruler={false}
                      style={{ border: "none", boxShadow: "none" }}
                      barInnerColor="#8B5CF6"
                      barRightColor="#374151"
                      barLeftColor="#374151"
                      thumbLeftColor="#8B5CF6"
                      thumbRightColor="#EC4899"
                      onChange={handleSliderChange}
                    />
                    <div className="flex justify-between mt-4">
                      <span className="px-3 py-1.5 bg-purple-900/50 text-purple-300 rounded-lg text-sm font-semibold">
                        ${minValue}
                      </span>
                      <span className="px-3 py-1.5 bg-pink-900/50 text-pink-300 rounded-lg text-sm font-semibold">
                        ${maximumValue}
                      </span>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Home</Link>
            <ChevronRightIcon className="w-4 h-4" />
            <span className="text-purple-600 dark:text-purple-400 font-medium capitalize">{title}</span>
          </nav>

          {/* Category Header Card */}
          <div className="glass-card relative p-4 sm:p-5 rounded-2xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg sm:text-xl">{title?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent capitalize">
                    {title}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {filteredProducts.length} products
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                {/* View Toggle */}
                <div className="flex items-center p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                  <button
                    onClick={() => setIsCard(true)}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${isCard
                      ? "bg-white dark:bg-gray-700 text-purple-600 shadow-md"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    title="Grid View"
                  >
                    <HiMiniSquares2X2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setIsCard(false)}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${!isCard
                      ? "bg-white dark:bg-gray-700 text-purple-600 shadow-md"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      }`}
                    title="List View"
                  >
                    <AiOutlineBars className="w-5 h-5" />
                  </button>
                </div>

                {/* Sort Dropdown - Desktop */}
                <Menu as="div" className="relative hidden md:block">
                  <Menu.Button className="group flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sortName}</span>
                    <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </Menu.Button>
                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 scale-95 -translate-y-2"
                    enterTo="opacity-100 scale-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 scale-100 translate-y-0"
                    leaveTo="opacity-0 scale-95 -translate-y-2"
                  >
                    <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right glass-card rounded-2xl shadow-xl p-2 z-50">
                      {sortMethods.map((option) => (
                        <Menu.Item key={option.value}>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                setSortMethod(option.value);
                                setSortName(option.name);
                              }}
                              className={`${active || option.value === sortMethod
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                : "text-gray-700 dark:text-gray-300"
                                } flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200`}
                            >
                              <span className="text-lg">{option.icon}</span>
                              {option.name}
                            </button>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>

                {/* Mobile Filter Button */}
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                >
                  <FunnelIcon className="w-5 h-5" />
                  <span>Filters</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block space-y-4">
            {/* Subcategories */}
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                </div>
                Subcategories
              </h3>

              {!isRealEstate ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {CategoryOnlyData.filter(cat => cat && cat !== 'null' && cat !== 'undefined').map((subcategory, index) => (
                    <button
                      key={index}
                      onClick={() => setCategoryFilter(subcategory === "all" ? "all" : subcategory)}
                      className={`group w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 flex items-center justify-between ${subcategory === categoryFilter
                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                        : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                      <span className="capitalize">{subcategory}</span>
                      {subcategory === categoryFilter && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  <button
                    onClick={() => setCategoryFilter("all")}
                    className={`w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 ${categoryFilter === "all"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                      : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    All {isResidentialRealEstate ? 'Residential' : 'Commercial'} Properties
                  </button>

                  {/* Subcategories for the selected real estate type */}
                  <div className="space-y-1 mt-2">
                    {(isResidentialRealEstate ? residentialSubcats : commercialSubcats).map((sub, idx) => (
                      <button
                        key={`subcat-${idx}`}
                        onClick={() => setCategoryFilter(sub.name)}
                        className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-colors ${categoryFilter === sub.name
                          ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Price Range - Show only for non-real estate categories */}
            {!isRealEstate && (
            <div className="glass-card p-4 rounded-xl">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Price Range
              </h3>
              <div className="mt-4">
                <MultiRangeSlider
                  min={0}
                  max={maxValue || 1000}
                  step={5}
                  minValue={minValue}
                  maxValue={maximumValue}
                  label={false}
                  ruler={false}
                  style={{ border: "none", boxShadow: "none" }}
                  barInnerColor="#8B5CF6"
                  barRightColor="#E5E7EB"
                  barLeftColor="#E5E7EB"
                  thumbLeftColor="#8B5CF6"
                  thumbRightColor="#EC4899"
                  onChange={handleSliderChange}
                />
                <div className="flex justify-between mt-4 gap-2">
                  <div className="flex-1 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-center">
                    <span className="text-xs text-purple-600 dark:text-purple-400">Min</span>
                    <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      ${minValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex-1 p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-center">
                    <span className="text-xs text-pink-600 dark:text-pink-400">Max</span>
                    <p className="text-lg font-bold text-pink-700 dark:text-pink-300">
                      ${maximumValue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Real Estate Specific Filters */}
            {isResidentialRealEstate && (
              <div className="space-y-4">
                {/* Price Range */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Price
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min ($)"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={residentialFilters.min_price}
                      onChange={e => setResidentialFilters({ ...residentialFilters, min_price: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max ($)"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={residentialFilters.max_price}
                      onChange={e => setResidentialFilters({ ...residentialFilters, max_price: e.target.value })}
                    />
                  </div>
                </div>

                {/* Listing Date Filters */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Listing Date
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Listed Within</label>
                      <select
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                        value={residentialFilters.created_within_days}
                        onChange={e => setResidentialFilters({ ...residentialFilters, created_within_days: e.target.value })}
                      >
                        <option value="">Any Time</option>
                        <option value="1">Last 24 Hours</option>
                        <option value="3">Last 3 Days</option>
                        <option value="7">Last 7 Days</option>
                        <option value="14">Last 14 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="60">Last 60 Days</option>
                        <option value="90">Last 90 Days</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Listed After (days ago)</label>
                      <input
                        type="number"
                        placeholder="e.g. 7"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                        value={residentialFilters.created_after_days}
                        onChange={e => setResidentialFilters({ ...residentialFilters, created_after_days: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Price Per Square Feet */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Price per Sq Ft
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min ($/sqft)"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={residentialFilters.price_per_sqft_min}
                      onChange={e => setResidentialFilters({ ...residentialFilters, price_per_sqft_min: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max ($/sqft)"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={residentialFilters.price_per_sqft_max}
                      onChange={e => setResidentialFilters({ ...residentialFilters, price_per_sqft_max: e.target.value })}
                    />
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                    Bedrooms & Bathrooms
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Bedrooms</label>
                      <div className="flex gap-2">
                        <select
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                          value={residentialFilters.bedrooms_min}
                          onChange={e => setResidentialFilters({ ...residentialFilters, bedrooms_min: e.target.value })}
                        >
                          <option value="">Min</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n}>{n}+</option>)}
                        </select>
                        <select
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                          value={residentialFilters.bedrooms_max}
                          onChange={e => setResidentialFilters({ ...residentialFilters, bedrooms_max: e.target.value })}
                        >
                          <option value="">Max</option>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 10].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Bathrooms</label>
                      <div className="flex gap-2">
                        <select
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                          value={residentialFilters.bathrooms_min}
                          onChange={e => setResidentialFilters({ ...residentialFilters, bathrooms_min: e.target.value })}
                        >
                          <option value="">Min</option>
                          {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6].map(n => <option key={n} value={n}>{n}+</option>)}
                        </select>
                        <select
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                          value={residentialFilters.bathrooms_max}
                          onChange={e => setResidentialFilters({ ...residentialFilters, bathrooms_max: e.target.value })}
                        >
                          <option value="">Max</option>
                          {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 8].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Property Size */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                    Property Size (Sq Ft)
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={residentialFilters.sqft_min}
                      onChange={e => setResidentialFilters({ ...residentialFilters, sqft_min: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={residentialFilters.sqft_max}
                      onChange={e => setResidentialFilters({ ...residentialFilters, sqft_max: e.target.value })}
                    />
                  </div>
                </div>

                {/* Lot Size */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    Lot Size (Sq Ft)
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={residentialFilters.lot_size_min}
                      onChange={e => setResidentialFilters({ ...residentialFilters, lot_size_min: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={residentialFilters.lot_size_max}
                      onChange={e => setResidentialFilters({ ...residentialFilters, lot_size_max: e.target.value })}
                    />
                  </div>
                </div>

                {/* Year Built */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Year Built
                  </h3>
                  <input
                    type="number"
                    placeholder="Built after (e.g. 2000)"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    value={residentialFilters.year_built_min}
                    onChange={e => setResidentialFilters({ ...residentialFilters, year_built_min: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Properties built in this year or later</p>
                </div>

                {/* Property Features */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                    Property Features
                  </h3>
                  <div className="space-y-3">
                    {[
                      { id: 'is_waterfront', label: 'Waterfront Property' },
                      { id: 'has_garage', label: 'Has Garage' },
                      { id: 'is_single_story', label: 'Single Story / Ranch Style' },
                      { id: 'has_pool', label: 'Has Pool' },
                    ].map(item => (
                      <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 transition-all"
                          checked={residentialFilters[item.id]}
                          onChange={e => setResidentialFilters({ ...residentialFilters, [item.id]: e.target.checked })}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Listing Status */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Listing Status
                  </h3>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    value={residentialFilters.listing_status}
                    onChange={e => setResidentialFilters({ ...residentialFilters, listing_status: e.target.value })}
                  >
                    <option value="">Any Status</option>
                    <option value="For Sale">For Sale</option>
                    <option value="For Rent">For Rent</option>
                    <option value="Pending">Pending</option>
                    <option value="New Construction">New Construction</option>
                    <option value="Foreclosure">Foreclosure / Bank Owned</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={() => setResidentialFilters({
                    min_price: "", max_price: "",
                    created_within_days: "", created_after_days: "",
                    price_per_sqft_min: "", price_per_sqft_max: "",
                    bedrooms_min: "", bedrooms_max: "",
                    bathrooms_min: "", bathrooms_max: "",
                    sqft_min: "", sqft_max: "",
                    lot_size_min: "", lot_size_max: "",
                    year_built_min: "",
                    is_waterfront: false, has_garage: false,
                    is_single_story: false, has_pool: false,
                    listing_status: ""
                  })}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Commercial Real Estate Specific Filters */}
            {isCommercialRealEstate && (
              <div className="space-y-4">
                {/* Units */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Number of Units
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min Units"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={commercialFilters.units_min}
                      onChange={e => setCommercialFilters({ ...commercialFilters, units_min: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max Units"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={commercialFilters.units_max}
                      onChange={e => setCommercialFilters({ ...commercialFilters, units_max: e.target.value })}
                    />
                  </div>
                </div>

                {/* Square Feet */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Square Feet
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={commercialFilters.sqft_min}
                      onChange={e => setCommercialFilters({ ...commercialFilters, sqft_min: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={commercialFilters.sqft_max}
                      onChange={e => setCommercialFilters({ ...commercialFilters, sqft_max: e.target.value })}
                    />
                  </div>
                </div>

                {/* Lot Size */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Lot Size (Sq Ft)
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={commercialFilters.lot_size_min}
                      onChange={e => setCommercialFilters({ ...commercialFilters, lot_size_min: e.target.value })}
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                      value={commercialFilters.lot_size_max}
                      onChange={e => setCommercialFilters({ ...commercialFilters, lot_size_max: e.target.value })}
                    />
                  </div>
                </div>

                {/* Year Built */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Year Built (Min)
                  </h3>
                  <input
                    type="number"
                    placeholder="Year (e.g. 2000)"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    value={commercialFilters.year_built_min}
                    onChange={e => setCommercialFilters({ ...commercialFilters, year_built_min: e.target.value })}
                  />
                </div>

                {/* Listing Status */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Listing Status
                  </h3>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    value={commercialFilters.listing_status}
                    onChange={e => setCommercialFilters({ ...commercialFilters, listing_status: e.target.value })}
                  >
                    <option value="">Any Status</option>
                    <option value="For Sale">For Sale</option>
                    <option value="For Rent">For Rent</option>
                    <option value="New Construction">New Construction</option>
                    <option value="Pending">Pending</option>
                    <option value="Foreclosure">Foreclosure</option>
                  </select>
                </div>

                {/* Listed Within */}
                <div className="glass-card p-4 rounded-xl">
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                    Listed Within
                  </h3>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
                    value={commercialFilters.created_within_days}
                    onChange={e => setCommercialFilters({ ...commercialFilters, created_within_days: e.target.value })}
                  >
                    <option value="">Any Time</option>
                    <option value="1">Last 24 Hours</option>
                    <option value="3">Last 3 Days</option>
                    <option value="7">Last 7 Days</option>
                    <option value="30">Last 30 Days</option>
                  </select>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={() => setCommercialFilters({
                    units_min: "", units_max: "",
                    sqft_min: "", sqft_max: "",
                    lot_size_min: "", lot_size_max: "",
                    year_built_min: "",
                    listing_status: "",
                    created_within_days: ""
                  })}
                  className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Quick Filters */}
            {filters.some(f => f.options.length > 0) && (
              <div className="glass-card p-4 rounded-xl">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  Quick Filters
                </h3>
                {filters.map((section) => (
                  section.options.length > 0 && (
                    <Disclosure key={section.id} as="div" className="mt-4">
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full items-center justify-between py-2 text-sm font-medium text-gray-900 dark:text-white">
                            {section.name}
                            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                          </Disclosure.Button>
                          <Disclosure.Panel className="pt-2 space-y-2">
                            {section.options.map((option, idx) => (
                              <button
                                key={idx}
                                onClick={() => setFilterBy(option === filterBy ? "" : option)}
                                className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-all duration-300 ${option === filterBy
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  }`}
                              >
                                {option}
                              </button>
                            ))}
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  )
                ))}
              </div>
            )}
          </aside>

          {/* Products Section */}
          <div className="lg:col-span-4 xl:col-span-5">
            {loading ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center min-h-[500px] glass-card rounded-3xl">
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
                  <div className="w-24 h-24 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">✨</span>
                  </div>
                </div>
                <p className="mt-6 text-lg text-gray-500 dark:text-gray-400">Loading amazing products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center min-h-[500px] glass-card rounded-3xl p-8">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mb-6">
                  <span className="text-6xl">📦</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Products Found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                  We couldn't find any products matching your criteria. Try adjusting your filters.
                </p>
                <button
                  onClick={() => {
                    setCategoryFilter("all");
                    setFilterBy("");
                    setMinValue(0);
                    setMaximumValue(maxValue);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                {/* Products Info Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-bold text-purple-600 dark:text-purple-400">{startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}</span> of <span className="font-bold text-gray-900 dark:text-white">{filteredProducts.length}</span> products
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                      <option value={8}>8</option>
                      <option value={12}>12</option>
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                    </select>
                  </div>
                </div>

                {/* Products Grid */}
                <div className={`grid gap-4 sm:gap-6 ${isCard
                  ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1 sm:grid-cols-2"
                  }`}>
                  {currentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} isCard={isCard} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-col items-center gap-6">
                    {/* Pagination Controls */}
                    <div className="flex items-center gap-2 p-2 glass-card rounded-2xl">
                      {/* Previous */}
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                      >
                        <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {getPageNumbers().map((page, index) => (
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="w-10 h-12 flex items-center justify-center text-gray-400 dark:text-gray-500">
                              •••
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => goToPage(page)}
                              className={`relative w-12 h-12 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden ${currentPage === page
                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-110"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                            >
                              <span className="relative">{page}</span>
                            </button>
                          )
                        ))}
                      </div>

                      {/* Next */}
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                      >
                        <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    {/* Page Jump */}
                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>Jump to page:</span>
                      <input
                        type="number"
                        min={1}
                        max={totalPages}
                        value={currentPage}
                        onChange={(e) => {
                          const page = parseInt(e.target.value);
                          if (page >= 1 && page <= totalPages) goToPage(page);
                        }}
                        className="w-16 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <span>of <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span></span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Styles */}
      <style jsx>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .dark .glass-card {
          background: rgba(17, 24, 39, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8B5CF6, #EC4899);
          border-radius: 20px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7C3AED, #DB2777);
        }
      `}</style>
    </div>
  );
}
