import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import { dataContext } from "../context/dataContext";
import { authContext } from "../context/authContext";
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
import SearchForm from "../components/Search";

export default function ShopByCategory() {
  const { shopHeading } = useContext(authContext);
  const localSubCategory = localStorage.getItem("subcategory");
  const navigate = useNavigate();
  const [cookies, removeCookie] = useCookies([]);
  const { products } = useContext(dataContext);
  const { currency, isDarkMode } = useContext(authContext);

  // useState========================================================================
  const [filterBy, setFilterBy] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [CategoryOnlyData, setCategoryOnlyData] = useState([
    { name: "All", value: "subcategory=perfumes" },
    {
      name: "Men",
      value: "attributes__name=Men&subcategory=perfumes",
      array: [
        {
          name1: "Woody & Spicy",
          value1:
            "attributes__name=Men&subcategory=perfumes&=perfumes&attributes__value=Woody & Spicy",
        },
        {
          name1: "Fresh & Citrus",
          value1:
            "attributes__name=Men&subcategory=perfumes&=perfumes&attributes__value=Fresh & Citrus",
        },
        {
          name1: "Aromatic & Herbal",
          value1:
            "attributes__name=Men&subcategory=perfumes&=perfumes&attributes__value=Aromatic & Herbal",
        },
        {
          name1: "Oriental & Amber",
          value1:
            "attributes__name=Men&subcategory=perfumes&=perfumes&attributes__value=Oriental & Amber",
        },
      ],
    },
    {
      name: "Women",
      value: "attributes__name=Women&subcategory=perfumes",
      array: [
        {
          name1: "Floral & Fruity",
          value1:
            "attributes__name=Women&subcategory=perfumes&=perfumes&attributes__value=Floral & Fruity",
        },
        {
          name1: "Sweet & Gourmand",
          value1:
            "attributes__name=Women&subcategory=perfumes&=perfumes&attributes__value=Sweet & Gourmand",
        },
        {
          name1: "Powdery & Musk",
          value1:
            "attributes__name=Women&subcategory=perfumes&=perfumes&attributes__value=Powdery & Musk",
        },
        {
          name1: "Exotic & Floral",
          value1:
            "attributes__name=Women&subcategory=perfumes&=perfumes&attributes__value=Exotic & Floral",
        },
      ],
    },
    {
      name: "Unisex",
      value: "attributes__name=Unisex&subcategory=perfumes",
      array: [
        {
          name1: "Clean & Aquatic",
          value1:
            "attributes__name=Unisex&subcategory=perfumes&=perfumes&attributes__value=Clean & Aquatic",
        },
        {
          name1: "Earthy & Green",
          value1:
            "attributes__name=Unisex&subcategory=perfumes&=perfumes&attributes__value=Earthy & Green",
        },
        {
          name1: "Modern & Minimalist",
          value1:
            "attributes__name=Unisex&subcategory=perfumes&=perfumes&attributes__value=Modern & Minimalist",
        },
        {
          name1: "Timeless Classics",
          value1:
            "attributes__name=Unisex&subcategory=perfumes&=perfumes&attributes__value=Timeless Classics",
        },
      ],
    },
  ]);
  const [subCategoryFilter, setSubCategoryFilter] = useState("");
  const [perfumeFilter, setPerfumeFilter] = useState("");
  const [ShopByCategoryProducts, setShopByCategoryProducts] =
    useState(products);
  const [uniqueAttributes, setUniqueAttributes] = useState([]);
  const [maxValue, setMaxValue] = useState("");
  const [sortMethod, setSortMethod] = useState("default");
  const [perfumeCategory1, setPerfumeCategory1] = useState("");
  const [perfumeCategory2, setPerfumeCategory2] = useState(false);
  const [loading, setLoading] = useState(false);

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
  const getUniqueData = (data, property) => {
    let newVal = data.map((curElem) => {
      return curElem[property].name;
    });
    return (newVal = ["", ...new Set(newVal)]);
  };
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

  // axios requests ===================================================================
  useEffect(() => {
    const getPerfumes = async () => {
      setLoading(true);
      axios
        .get(
          `${
            import.meta.env.VITE_SERVER_URL
          }/api/product/filter-products/?${perfumeCategory1}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          setShopByCategoryProducts(response.data);
          setLoading(false);
          // console.log(response.data);
          // setCategoryOnlyData(
          // getUniqueData(response.data.Products, "category")
          // );
          // console.log(CategoryOnlyData);
          const allAttributes = response.data.Products?.flatMap(
            (product) => product.attributes || []
          );
          setUniqueAttributes(Array.from(new Set(allAttributes)));

          // getting maximum and minimun values -----
          setMaxValue(() => {
            ShopByCategoryProducts?.reduce((max, obj) => {
              return Math.max(max, obj["unit_price"]);
            }, -Infinity);
          });
          // console.log(maxValue);
        })
        .catch((error) => {
          console.error(error);
        });
    };
    getPerfumes();
  }, [perfumeCategory1]);
  useEffect(() => {
    const getFilterProducts = async () => {
      if (filterBy === "") {
        setLoading(true);
        axios
          .get(`${import.meta.env.VITE_SERVER_URL}/api/product/all-products/`, {
            headers: {
              "Content-Type": "application/json",
            },
          })
          .then((response) => {
            setShopByCategoryProducts(response.data.Products);
            setLoading(false);
            // console.log(response.data.Products);
            // setCategoryOnlyData(
            // getUniqueData(response.data.Products, "category")
            // );
            // console.log(CategoryOnlyData);
            const allAttributes = response.data.Products?.flatMap(
              (product) => product.attributes || []
            );
            setUniqueAttributes(Array.from(new Set(allAttributes)));

            // getting maximum and minimun values -----
            setMaxValue(() => {
              ShopByCategoryProducts?.reduce((max, obj) => {
                return Math.max(max, obj["unit_price"]);
              }, -Infinity);
            });
            // console.log(maxValue);
          })
          .catch((error) => {
            console.error(error);
          });
      } else {
        setLoading(true);
        axios
          .get(
            `${
              import.meta.env.VITE_SERVER_URL
            }/api/product/filter-products/?attributes__value=${filterBy}`,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          )
          .then((response) => {
            // console.log(response.data);
            setShopByCategoryProducts(response.data);
            setLoading(false);
          })
          .catch((error) => {
            console.error(error);
          });
      }
    };
    getFilterProducts();
  }, [cookies, filterBy, navigate, removeCookie]);

  uniqueAttributes.forEach((attribute) => {
    const { name, value } = attribute;

    switch (name) {
      case "color":
        if (!colorArray.includes(value)) {
          colorArray.push(value);
        }
        break;
      case "storage":
        if (!storageArray.includes(value)) {
          storageArray.push(value);
        }
        break;
      case "size":
        if (!sizeArray.includes(value)) {
          sizeArray.push(value);
        }
        break;
      case "os" || "system":
        if (!systemArray.includes(value)) {
          systemArray.push(value);
        }
        break;

      default:
        break;
    }
  });

  return (
    <div className={`bg-white ${isDarkMode && "dark"} dark:bg-black`}>
      {/* <SearchForm /> */}
      <div>
        {/* Mobile filter dialog */}
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
                <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white dark:bg-black py-4 pb-12 shadow-xl">
                  <div className="flex items-center justify-between px-4">
                    <button
                      type="button"
                      className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white dark:bg-black p-2 text-gray-400"
                      onClick={() => setMobileFiltersOpen(false)}
                    >
                      <span className="sr-only">Close menu</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Filters */}
                  <form className="block lg:hidden px-5 py-3 text-black">
                    <h3 className="sr-only">Categories</h3>
                    <Disclosure
                      as="div"
                      className="border-b border-gray-200 py-6"
                    >
                      {({ open }) => (
                        <>
                          <h3 className="-my-3 flow-root">
                            <Disclosure.Button className="flex w-full items-center justify-between bg-white dark:bg-black py-3 text-sm text-gray-400 hover:text-gray-500">
                              <span className="font-medium text-gray-900 dark:text-white">
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
                                    onChange={() => {}}
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
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
        {/* web view  ================================================================================================================ */}
        <main className="sm:mx-auto sm:w-[97%] px-1 sm:px-4">
          <div className="flex relative items-baseline justify-between border-b dark:text-[#f5f5f5] border-gray-200 lg:pb-6 ">
            <h1 className=" font-bold text-[24px] capitalize flex items-center gap-2 sm:text-[27px] text-purple-900 dark:text-white">
              <ArrowLeftCircleIcon
                onClick={() => {
                  navigate("/");
                }}
                className=" cursor-pointer hidden lg:block w-[30px] text-[#f5f5f5] right-[2%]"
              />
              {shopHeading
                ? shopHeading
                : localSubCategory
                ? localSubCategory
                : "Shopping Mall"}
            </h1>
            <div className="flex  items-center">
              <button
                type="button"
                className=" text-gray-400 hover:text-gray-500 sm:ml-6 lg:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <span className="sr-only">Filters</span>
                <FunnelIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
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
                {(shopHeading || localSubCategory) === "perfumes" && (
                  <div>
                    <h2 className=" dark:text-purple-500">
                      Filter By Category
                    </h2>
                    <ul className=" flex flex-col">
                      {CategoryOnlyData.map((category, index) => {
                        return (
                          <div key={index}>
                            {category.name === "All" ? (
                              <p
                                onClick={() => {
                                  setPerfumeCategory1(category.value);
                                }}
                                className=" cursor-pointer"
                              >
                                {" "}
                                All
                              </p>
                            ) : (
                              <select
                                className=" bg-transparent border-none "
                                value={perfumeCategory1}
                                onChange={(e) => {
                                  setPerfumeCategory1(e.target.value);
                                  // getPerfumes();
                                }}
                              >
                                <option
                                  className=" bg-transparent text-black border-none "
                                  value={category.value}
                                >
                                  {category.name} (All)
                                </option>
                                {category.array.map((e) => {
                                  return (
                                    <option
                                      className=" bg-transparent text-black border-none "
                                      key={e.name1}
                                      value={e.value1}
                                    >
                                      {e.name1}
                                    </option>
                                  );
                                })}
                              </select>
                            )}
                          </div>
                        );
                      })}
                    </ul>
                  </div>
                )}
                <Disclosure as="div" className="border-b border-gray-200 py-6">
                  {({ open }) => (
                    <>
                      <h3 className="-my-3 flow-root">
                        <Disclosure.Button className="flex w-full items-center justify-between bg-white dark:bg-black py-3 text-sm text-gray-400 hover:text-gray-500">
                          <span className="font-medium text-gray-900 dark:text-white">
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
                              onChange={() => setSortMethod(option.value)}
                            >
                              <input
                                id={option.name}
                                name={option.name}
                                defaultValue={option.name}
                                type="checkbox"
                                checked={option.value === sortMethod}
                                onChange={() => {}}
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
                              <Disclosure.Button className="flex w-full items-center justify-between bg-white dark:bg-black py-3 text-sm text-gray-400 hover:text-gray-500">
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
                                    onChange={() => {}}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <label
                                    htmlFor="all"
                                    className="ml-3 text-sm text-gray-600 dark:text-[#f5f5f5]"
                                  >
                                    All
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
                                      onChange={() => {}}
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
              </form>
              {/* Product grid */}
              {!loading ? (
                <div className="lg:col-span-4 w-full h-full">
                  <div className="bg-white dark:bg-black w-full h-full min-h-screen">
                    <div className="w-full sm:py-0 sm:pb-10 lg:px-0 h-full">
                      <div className="grid grid-cols-2 pb-6 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-x-0.5 gap-y-1 lg:gap-x-2 lg:items-center lg:justify-start flex-wrap h-full">
                        {ShopByCategoryProducts?.filter((product) => {
                          return (
                            product?.category?.slug ===
                              (shopHeading || localSubCategory) ||
                            product?.subcategory?.slug ===
                              (shopHeading || localSubCategory)
                          );
                        })
                          .sort(handleSort(sortMethod))
                          .map((product) => {
                            return (
                              <ProductCard product={product} isCard={true} />
                            );
                          })}
                      </div>
                      {ShopByCategoryProducts?.filter((product) => {
                        return (
                          product?.category?.slug ===
                            (shopHeading || localSubCategory) ||
                          product?.subcategory?.slug ===
                            (shopHeading || localSubCategory)
                        );
                      }).length === 0 && (
                        <p className="text-gray-700 dark:text-[#f5f5f5] text-center text-base sm:text-[17px] mt-6 w-full">
                          No products available in{" "}
                          <span className="font-semibold capitalize">
                            {shopHeading}
                          </span>{" "}
                          sub category.
                        </p>
                      )}
                      {(shopHeading || localSubCategory) === "perfumes" &&
                        !ShopByCategoryProducts && (
                          <p className="text-gray-700 dark:text-[#f5f5f5] text-center text-base sm:text-[17px] mt-6 w-full">
                            No perfumes available in this sub category.
                          </p>
                        )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className=" lg:col-span-3 2xl:col-span-4 flex items-center justify-center">
                  <img
                    src="/loading.svg"
                    alt="lading"
                    className=" w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
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
