import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import { dataContext } from "../context/dataContext";
import { Fragment } from "react";
import { Dialog, Disclosure, Menu, Transition } from "@headlessui/react";
import { ArrowLeftCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import {
    ChevronDownIcon,
    FunnelIcon,
    MinusIcon,
    PlusIcon,
    Squares2X2Icon,
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
    const { currency, isDarkMode, isProfilePopupOpen } = useContext(authContext);
    // useState========================================================================
    const [filterBy, setFilterBy] = useState("");
    const [priceFilter, setPriceFilter] = useState("");
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [CategoryOnlyData, setCategoryOnlyData] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [shoppingProduct, setShoppingProducts] = useState(products);
    const [uniqueAttributes, setUniqueAttributes] = useState([]);
    const [sortMethod, setSortMethod] = useState("default");
    const [sortName, setSortName] = useState("Sort By Newest");
    const [loading, setLoading] = useState(false);
    const [minValue, setMinValue] = useState(0);
    const [maximumValue, setMaximumValue] = useState(0);
    const [isCard, setIsCard] = useState(true);
    const [subcategories, setSubcategories] = useState([]);
    const title = localStorage.getItem('category_name');
    const [filteredProducts, setFilteredProducts] = useState([]); // State to store filtered products
    // Arrays==========================================================================
    const colorArray = [];
    const storageArray = [];
    const sizeArray = [];
    const systemArray = [];

    // filters ========================================================================
    const filters = [
        {
            id: "color",
            name: "Color",
            options: colorArray,
        },
        {
            id: "size",
            name: "Size",
            options: sizeArray,
        },
        {
            id: "storage",
            name: "Storage",
            options: storageArray,
        },
        {
            id: "system",
            name: "System / OS",
            options: systemArray,
        },
    ];
    const sortMethods = [
        { name: "Newest", value: "date" },
        { name: "Price: Low to High", value: "ascPrice" },
        { name: "Price: High to Low", value: "descPrice" },
        { name: "Name: a to z", value: "ascName" },
        { name: "Name: z to a", value: "descName" },
    ];


    const handleSort = (sortMethod) => {
        switch (sortMethod) {
            case "ascName":
                return (a, b) => (a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1);
            case "descName":
                return (a, b) => (b.name.toLowerCase() > a.name.toLowerCase() ? 1 : -1);
            case "ascPrice":
                return (a, b) => a.unit_price - b.unit_price;
            case "descPrice":
                return (a, b) => b.unit_price - a.unit_price;
            case "date":
                return (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
            // Add more cases for other sorting methods if needed
            default:
                return (a, b) => a.id - b.id; // Default sorting
        }
    };
    const categorySlug = localStorage.getItem('category');
    // axios requests ===================================================================
    useEffect(() => {
        const getFilterProducts = async () => {
            setLoading(true);
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/product/subcategories/${categorySlug}/`,
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                let subcategories = response.data;
                subcategories = subcategories.sort((a, b) => a.name.localeCompare(b.name));
                console.log("subcategories", subcategories);
                setSubcategories(subcategories);
                setCategoryOnlyData(["all", ...subcategories.map(subcat => subcat.name)]);
                let allProducts = [];
                const res = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/product/category-products/${categorySlug}/`, {
                    headers: { "Content-Type": "application/json'" },
                })
                allProducts = res.data;
                console.log("allProducts", allProducts);
                const sortedProducts = allProducts.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                setShoppingProducts(sortedProducts);
                setLoading(false);


                const prices = allProducts.map((product) => parseFloat(product.unit_price));
                console.log("prices", prices);
                if (prices.length > 0) {
                    setMinValue(Math.min(...prices));
                    setMaximumValue(Math.max(...prices));
                }
            } catch (error) {
                console.error(error);
                setLoading(false);
            }
        };
        setCategoryFilter("all");
        getFilterProducts();
    }, [categorySlug]);

    useEffect(() => {
        setCategoryFilter("all");
    }, [])
    const handleSliderChange = (e) => {
        setMinValue(Number(e.minValue));
        setMaximumValue(Number(e.maxValue));
    };

    // Function to handle category filter changes and update products accordingly
    useEffect(() => {
        const filterProducts = () => {
            const filtered = shoppingProduct
                ?.filter((product) => {
                    // Price filter logic
                    const priceFilter =
                        product.unit_price >= minValue && product.unit_price <= maximumValue;

                    // Category filter logic
                    if (categoryFilter === "all") {
                        return priceFilter; // If "all" is selected, return all products within price range
                    }

                    // If a specific category is selected, filter by subcategory name
                    const categoryFilterReturn = product?.subcategory?.name === categoryFilter;
                    return priceFilter && categoryFilterReturn; // Return true if both filters match
                })
                .sort(handleSort(sortMethod));
            setFilteredProducts(filtered);
        };

        filterProducts();
    }, [categoryFilter, shoppingProduct, minValue, maximumValue, sortMethod]); // Re-run the effect when any dependency changes

    return (
        <div className={`bg-white ${isDarkMode && "dark"} dark:bg-[#101017] dark:text-[#f5f5f5]`}
            style={{
                fontFamily: "Public Sans",
            }}
        >
            <SearchForm />
            <div>
                {/* Mobile filter dialog ===================================================================================================== */}
                <Transition.Root show={mobileFiltersOpen} as={Fragment}>
                    <Dialog
                        as="div"
                        className="relative z-40 lg:hidden"
                        onClose={setMobileFiltersOpen}
                    >
                        <Transition.Child
                            as={Fragment}
                            enter="transition-opacity ease-linear duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="transition-opacity ease-linear duration-300"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-black bg-opacity-25" />
                        </Transition.Child>

                        <div className="fixed inset-0 z-40 flex">
                            <Transition.Child
                                as={Fragment}
                                enter="transition ease-in-out duration-300 transform"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transition ease-in-out duration-300 transform"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white dark:bg-[#101017] py-4 pb-12 shadow-xl">
                                    <div className="flex items-center justify-between px-4">
                                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                                            Filters
                                        </h2>
                                        <button
                                            type="button"
                                            className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white dark:bg-[#101017] p-2 text-gray-400"
                                            onClick={() => setMobileFiltersOpen(false)}
                                        >
                                            <span className="sr-only">Close menu</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>

                                    <div></div>
                                    {/* Filters */}
                                    <form className="block lg:hidden px-5 py-3 text-black">
                                        <h3 className="sr-only">Categories</h3>
                                        <div>
                                            <h2 className=" dark:text-purple-500 pb-2 text-[#363F4D] plus-jakarta text-[13px] md:text-[14.5px] 2xl:text-[16px]">
                                                CATEGORY
                                            </h2>
                                            <ul className=" flex flex-col">
                                                {CategoryOnlyData.map((category, index) => {
                                                    return (
                                                        <div key={index}>
                                                            {category && (
                                                                <div
                                                                    onClick={() => {
                                                                        if (category === "all") {
                                                                            setCategoryFilter("all");
                                                                        } else {
                                                                            setCategoryFilter(category);
                                                                        }
                                                                    }}
                                                                    className="flex items-center mb-1"
                                                                >
                                                                    <input
                                                                        id={category}
                                                                        name={category}
                                                                        value={category}
                                                                        checked={category === categoryFilter}
                                                                        onChange={() => {
                                                                            if (category === "all") {
                                                                                setCategoryFilter("all");
                                                                            } else {
                                                                                setCategoryFilter(category);
                                                                            }
                                                                        }}
                                                                        type="checkbox"
                                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <label
                                                                        htmlFor={category}
                                                                        className="ml-3 text-[15.5px] mb-1 text-gray-600 dark:text-[#f5f5f5]"
                                                                    >
                                                                        {category}
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                        <Disclosure
                                            as="div"
                                            className="border-b border-gray-200 py-6"
                                        >
                                            {({ open }) => (
                                                <>
                                                    <h3 className="-my-3 flow-root">
                                                        <Disclosure.Button className="flex w-full items-center justify-between bg-white dark:bg-[#101017] py-3 text-sm text-gray-400 hover:text-gray-500">
                                                            <span className="font-medium text-gray-900 dark:text-purple-600">
                                                                Sort By
                                                            </span>
                                                            <span className="ml-6 flex items-center">
                                                                {open ? (
                                                                    <MinusIcon
                                                                        className="h-5 w-5"
                                                                        aria-hidden="true"
                                                                    />
                                                                ) : (
                                                                    <PlusIcon
                                                                        className="h-5 w-5"
                                                                        aria-hidden="true"
                                                                    />
                                                                )}
                                                            </span>
                                                        </Disclosure.Button>
                                                    </h3>
                                                    <Disclosure.Panel className="pt-6">
                                                        <div className="space-y-4">
                                                            {sortMethods.map((option, optionIdx) => (
                                                                <div
                                                                    key={optionIdx}
                                                                    className="flex items-center cursor-pointer"
                                                                    onChange={() => {
                                                                        setSortMethod(option.value);
                                                                        setMobileFiltersOpen(false);
                                                                    }}
                                                                >
                                                                    <input
                                                                        id={option.name}
                                                                        name={option.name}
                                                                        defaultValue={option.name}
                                                                        type="checkbox"
                                                                        checked={option.value === sortMethod}
                                                                        onChange={() => { }}
                                                                        className="h-4 w-4 rounded border-gray-300 cursor-pointer text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <label
                                                                        htmlFor={option.name}
                                                                        className="ml-3 text-sm text-gray-600 cursor-pointer dark:text-[#f5f5f5]"
                                                                    >
                                                                        {option.name}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </Disclosure.Panel>
                                                </>
                                            )}
                                        </Disclosure>

                                        <div className="mt-6">
                                            <h2 className="dark:text-purple-500 mb-4 plus-jakarta text-[13px] md:text-[14.5px] 2xl:text-[16px]"
                                                style={{
                                                    fontFamily: "Public Sans",
                                                }}
                                            >
                                                PRICE RANGE
                                            </h2>
                                            <MultiRangeSlider
                                                min={0}
                                                max={maximumValue}
                                                step={5}
                                                minValue={minValue}
                                                maxValue={maximumValue}
                                                label={false}
                                                ruler={false}
                                                style={{
                                                    border: "none",
                                                    outline: "none",
                                                    boxShadow: "none",
                                                }}
                                                barInnerColor="#FA8232"
                                                barRightColor="#000"
                                                barLeftColor="#000"
                                                thumbLeftColor="#FA8232"
                                                thumbRightColor="#FA8232"
                                                onInput={(e) => handleSliderChange(e)}
                                            />
                                            <div className="flex justify-between mt-2 text-black dark:text-white">
                                                <span>{`$${minValue}`}</span>
                                                <span>{`$${maximumValue}`}</span>
                                            </div>
                                        </div>

                                        {/* ---------------------------------------------------------- */}

                                        {filters.map((section, index) => (
                                            <div key={section.id || index}>
                                                {section.options.length !== 0 && (
                                                    <Disclosure
                                                        as="div"
                                                        className="border-b border-gray-200 py-6"
                                                    >
                                                        {({ open }) => (
                                                            <>
                                                                <h3 className="-my-3 flow-root">
                                                                    <Disclosure.Button className="flex w-full items-center justify-between bg-white dark:bg-[#101017] py-3 text-sm text-gray-400 hover:text-gray-500">
                                                                        <span className="font-medium text-gray-900 dark:text-purple-600">
                                                                            {section.name}
                                                                        </span>
                                                                        <span className="ml-6 flex items-center">
                                                                            {open ? (
                                                                                <MinusIcon
                                                                                    className="h-5 w-5"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            ) : (
                                                                                <PlusIcon
                                                                                    className="h-5 w-5"
                                                                                    aria-hidden="true"
                                                                                />
                                                                            )}
                                                                        </span>
                                                                    </Disclosure.Button>
                                                                </h3>
                                                                <Disclosure.Panel className="pt-6">
                                                                    <div className="space-y-4">
                                                                        <div
                                                                            className="flex items-center"
                                                                            onClick={() => {
                                                                                setFilterBy("");
                                                                                setMobileFiltersOpen(false);
                                                                            }}
                                                                        >
                                                                            <input
                                                                                id="all"
                                                                                name="all"
                                                                                defaultValue="all"
                                                                                type="checkbox"
                                                                                checked={" " === filterBy}
                                                                                onChange={() => { }}
                                                                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                            />
                                                                            <label
                                                                                htmlFor="all"
                                                                                className="ml-3 text-sm text-gray-600 dark:text-[#f5f5f5]"
                                                                            >
                                                                                all
                                                                            </label>
                                                                        </div>
                                                                        {section.options.map(
                                                                            (option, optionIdx) => (
                                                                                <div
                                                                                    key={optionIdx}
                                                                                    className="flex items-center"
                                                                                    onClick={() => {
                                                                                        setFilterBy(option);
                                                                                        setMobileFiltersOpen(false);
                                                                                    }}
                                                                                >
                                                                                    <input
                                                                                        id={option}
                                                                                        name={option}
                                                                                        defaultValue={option}
                                                                                        type="checkbox"
                                                                                        checked={option === filterBy}
                                                                                        onChange={() => { }}
                                                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                                    />
                                                                                    <label
                                                                                        htmlFor={option}
                                                                                        className="ml-3 text-sm text-gray-600 dark:text-[#f5f5f5]"
                                                                                    >
                                                                                        {option}
                                                                                    </label>
                                                                                </div>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                </Disclosure.Panel>
                                                            </>
                                                        )}
                                                    </Disclosure>
                                                )}
                                            </div>
                                        ))}
                                    </form>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </Dialog>
                </Transition.Root>
                {/* web view  ================================================================================================================ */}
                <main className="sm:mx-auto sm:w-[97%] px-1 sm:px-4">
                    <div className="flex relative items-center justify-between border-b dark:text-[#f5f5f5] border-gray-200 lg:pb-6 py-4 px-4">
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-[24px] text-black dark:text-white sm:text-[27px]">
                                {title}
                            </h1>
                            <div className="flex items-center gap-2">
                                <HiMiniSquares2X2
                                    onClick={() => setIsCard(true)}
                                    className={`text-[19px] cursor-pointer ${isCard ? "text-[#FA8232]" : ""
                                        }`}
                                />
                                <AiOutlineBars
                                    onClick={() => setIsCard(false)}
                                    className={`text-[19px] cursor-pointer ${!isCard ? "text-[#FA8232]" : ""
                                        }`}
                                />
                            </div>
                        </div>
                        <Disclosure as="div" className="absolute right-0 mx-auto hidden lg:block ">
                            {({ open }) => (
                                <>
                                    <h3 className="-my-3 flow-root">
                                        <Disclosure.Button className="flex items-center justify-between bg-white dark:bg-[#101017] dark:text-[#f5f5f5] py-3 text-sm text-gray-400 hover:text-gray-500">
                                            <span className="font-medium text-gray-900 dark:text-white">Sort by:</span>
                                            <select
                                            className="ml-2 bg-transparent border border-gray-300 dark:border-gray-700 rounded-md py-1 px-2  focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={sortMethod}
                                                onChange={(e) => {
                                                    setSortMethod(e.target.value);
                                                    const selectedOption = sortMethods.find(option => option.value === e.target.value);
                                                    setSortName(selectedOption?.name || "");
                                                }}
                                            >
                                                {sortMethods.map((option, index) => (
                                                    <option key={index} value={option.value} className="text-black bg:text-white">
                                                        {option.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </Disclosure.Button>
                                    </h3>
                                </>
                            )}
                        </Disclosure>


                        <button
                            type="button"
                            className="lg:hidden text-gray-400 hover:text-gray-500"
                            onClick={() => setMobileFiltersOpen(true)}
                        >
                            <FunnelIcon className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>

                    <section
                        aria-labelledby="products-heading"
                        className=" min-h-screen pb-20 pt-6"
                    >
                        <h2 id="products-heading" className="sr-only">
                            Products
                        </h2>

                        <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-4 2xl:grid-cols-5">
                            <form className="hidden lg:block dark:text-[#f5f5f5]">
                                <h3 className="sr-only">Categories</h3>
                                <div>
                                    <h2 className=" dark:text-white pb-2 font-[700] text-[#363F4D] plus-jakarta text-[13px] md:text-[14.5px] 2xl:text-[16px]">
                                        CATEGORY{" "}
                                    </h2>
                                    <ul className=" flex flex-col">
                                        {CategoryOnlyData.map((category, index) => {
                                            return (
                                                <div key={index}>
                                                    {category && (
                                                        <div
                                                            onClick={() => {
                                                                if (category === "all") {
                                                                    setCategoryFilter("all");
                                                                } else {
                                                                    setCategoryFilter(category);
                                                                }
                                                            }}
                                                            className="flex items-center mb-1"
                                                        >
                                                            <input
                                                                id={category}
                                                                name={category}
                                                                value={category}
                                                                checked={category === categoryFilter}
                                                                onChange={() => {
                                                                    if (category === "all") {
                                                                        setCategoryFilter("all");
                                                                    } else {
                                                                        setCategoryFilter(category);
                                                                    }
                                                                }}
                                                                type="radio"
                                                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                            <label
                                                                htmlFor={category}
                                                                className="ml-3 text-[15.5px] mb-1 text-gray-600 dark:text-[#f5f5f5]"
                                                            >
                                                                {category}
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                    </ul>
                                </div>

                                {/* ---------------------------------------------------------- */}

                                {filters.map((section, index) => (
                                    <div key={section.id || index}>
                                        {section.options.length !== 0 && (
                                            <Disclosure
                                                as="div"
                                                className="border-b border-gray-200 py-6"
                                                defaultOpen
                                            >
                                                {({ open }) => (
                                                    <>
                                                        <h3 className="-my-3 flow-root">
                                                            <Disclosure.Button className="flex w-full items-center justify-between bg-white dark:bg-[#101017] dark:text-[#f5f5f5] py-3 text-sm text-gray-400 hover:text-gray-500">
                                                                <span className="font-medium text-gray-900 dark:text-purple-600">
                                                                    {section.name}
                                                                </span>
                                                                <span className="ml-6 flex items-center">
                                                                    {open ? (
                                                                        <MinusIcon
                                                                            className="h-5 w-5"
                                                                            aria-hidden="true"
                                                                        />
                                                                    ) : (
                                                                        <PlusIcon
                                                                            className="h-5 w-5"
                                                                            aria-hidden="true"
                                                                        />
                                                                    )}
                                                                </span>
                                                            </Disclosure.Button>
                                                        </h3>
                                                        <Disclosure.Panel className="pt-6">
                                                            <div className="space-y-4">
                                                                <div
                                                                    className="flex items-center"
                                                                    onClick={() => {
                                                                        setFilterBy("");
                                                                    }}
                                                                >
                                                                    <input
                                                                        id="all"
                                                                        name="all"
                                                                        defaultValue="all"
                                                                        type="checkbox"
                                                                        checked={"" === filterBy}
                                                                        onChange={() => { }}
                                                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                    />
                                                                    <label
                                                                        htmlFor="all"
                                                                        className="ml-3 text-sm text-gray-600 dark:text-[#f5f5f5]"
                                                                    >
                                                                        all
                                                                    </label>
                                                                </div>
                                                                {section.options.map((option, optionIdx) => (
                                                                    <div
                                                                        key={optionIdx}
                                                                        className="flex items-center"
                                                                        onClick={() => {
                                                                            setFilterBy(option);
                                                                        }}
                                                                    >
                                                                        <input
                                                                            id={option}
                                                                            name={option}
                                                                            defaultValue={option}
                                                                            type="checkbox"
                                                                            checked={option === filterBy}
                                                                            onChange={() => { }}
                                                                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                        />
                                                                        <label
                                                                            htmlFor={option}
                                                                            className="ml-3 text-sm text-gray-600 dark:text-[#f5f5f5]"
                                                                        >
                                                                            {option}
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </Disclosure.Panel>
                                                    </>
                                                )}
                                            </Disclosure>
                                        )}
                                    </div>
                                ))}
                                <div className="mt-6">
                                    <h2 className="dark:text-white mb-4 font-[700] text-[#363F4D] plus-jakarta text-[13px] md:text-[14.5px] 2xl:text-[16px]">
                                        PRICE RANGE
                                    </h2>
                                    <MultiRangeSlider
                                        min={0}
                                        max={maximumValue}
                                        step={5}
                                        minValue={minValue}
                                        maxValue={maximumValue}
                                        label={false}
                                        ruler={false}
                                        style={{
                                            border: "none",
                                            outline: "none",
                                            boxShadow: "none",
                                        }}
                                        barInnerColor="#FA8232"
                                        barRightColor="#000"
                                        barLeftColor="#000"
                                        thumbLeftColor="#FA8232"
                                        thumbRightColor="#FA8232"
                                        onInput={(e) => handleSliderChange(e)}
                                    />
                                    <div className="flex justify-between mt-2 text-[#4d5c73]">
                                        <span>{`$${minValue}`}</span>
                                        <span>{`$${maximumValue}`}</span>
                                    </div>
                                </div>
                            </form>
                            <svg width="601" height="1031" viewBox="0 0 601 1031" fill="none" xmlns="http://www.w3.org/2000/svg"
                                className="md:absolute fixed top-1/3 left-0 z-[0] pointer-events-none overflow-hidden"

                            >
                                <g filter="url(#filter0_f_1_3636)">
                                    <circle cx="85.5" cy="515.5" r="207.5" fill="#8B33FE" fill-opacity="0.4" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_1_3636" x="-430" y="0" width="1031" height="1031" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="154" result="effect1_foregroundBlur_1_3636" />
                                    </filter>
                                </defs>
                            </svg>

                            <svg width="636" height="1071" viewBox="0 0 636 1071" fill="none" xmlns="http://www.w3.org/2000/svg"
                                className="fixed top-0 right-0 z-[0] pointer-events-none overflow-hidden"

                            >
                                <g filter="url(#filter0_f_1_3632)">
                                    <path d="M743.5 535.5C743.5 650.099 650.599 743 536 743C421.401 743 328.5 650.099 328.5 535.5C328.5 420.901 421.401 328 536 328C650.599 328 743.5 420.901 743.5 535.5Z" fill="#8B33FE" fill-opacity="0.4" />
                                </g>
                                <defs>
                                    <filter id="filter0_f_1_3632" x="0.5" y="0" width="1071" height="1071" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                                        <feFlood flood-opacity="0" result="BackgroundImageFix" />
                                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                                        <feGaussianBlur stdDeviation="164" result="effect1_foregroundBlur_1_3632" />
                                    </filter>
                                </defs>
                            </svg>

                            {!loading ? (
                                <div className="lg:col-span-3 2xl:col-span-4 p-4">
                                    <div className="bg-white dark:bg-[#101017] dark:text-[#f5f5f5]">
                                        <div className="w-full sm:py-0 sm:pb-10 lg:px-0">
                                            <div
                                                className={`grid pb-6 ${isCard
                                                    ? "lg:grid-cols-3 sm:grid-cols-2 grid-cols-2 2xl:grid-cols-4"
                                                    : "2xl:grid-cols-2 lg:grid-cols-2 sm:grid-cols-2 grid-cols-1"
                                                    } gap-x-3 gap-y-3 lg:gap-x-5 lg:items-center lg:justify-start flex-wrap`}
                                            >
                                                {filteredProducts.map((product, index) => (
                                                    <ProductCard
                                                        key={index}
                                                        product={product}
                                                        isCard={isCard}
                                                    />
                                                ))}
                                            </div>

                                            {shoppingProduct?.length === 0 && (
                                                <div className="w-full h-full text-center">
                                                    <p className="dark:text-[#f5f5f5]">
                                                        No Products Available
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="lg:col-span-3 2xl:col-span-4 flex items-center justify-center">
                                    <img
                                        src="/loading.svg"
                                        alt="loading"
                                        className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
                                    />
                                </div>
                            )}

                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
