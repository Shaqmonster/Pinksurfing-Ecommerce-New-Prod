import { Fragment, useContext, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";

export default function CategoriesMobile() {
  const { isMobileCategoryOpen, setIsMobileCategoryOpen } = useContext(authContext);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState({});
  const [activeTab, setActiveTab] = useState({ index: 0, name: "" });
  const [openCategory, setOpenCategory] = useState(null);
  const navigate = useNavigate();
  const { searchProducts } = useContext(dataContext);
  const { setShopHeading, isDarkMode } = useContext(authContext);

  useEffect(() => {
    const GetCategories = async () => {
      try {
        // Fetch categories
        const categoryResponse = await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/api/product/categories/`,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const fetchedCategories = categoryResponse.data;
        // Sort categories alphabetically by name
        const sortedCategories = [...fetchedCategories].sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        setCategories(sortedCategories);

        // Initialize subcategories object
        const fetchedSubcategories = {};

        // Fetch subcategories for each category
        await Promise.all(
          fetchedCategories.map(async (category) => {
            const subcategoryResponse = await axios.get(
              `${import.meta.env.VITE_SERVER_URL}/api/product/subcategories/${category.slug}/`,
              {
                headers: {
                  "Content-Type": "application/json",
                },
              }
            );
            fetchedSubcategories[category.slug] = subcategoryResponse.data;
          })
        );

        setSubCategories(fetchedSubcategories);
      } catch (error) {
        console.error(error);
      }
    };

    GetCategories();
  }, []);

  const toggleCategory = (slug) => {
    setOpenCategory(openCategory === slug ? null : slug);
  };

  const closeDialog = () => {
    setIsMobileCategoryOpen(false);
    setOpenCategory(null);
  };

  const handleClickOutside = (event) => {
    if (!event.target.closest(".dropdown-button")) {
      setOpenCategory(null);
    }
  };

  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <Transition.Root show={isMobileCategoryOpen} as={Fragment}>
      <Dialog
        as="div"
        className={`relative ${isDarkMode && "dark"} top-0 left-0 z-50`}
        onClose={closeDialog}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-auto bg-white dark:bg-black dark:border-l dark:border-white/30 shadow-xl">
                    {/* Header with Close Button */}
                    <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-white/20">
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                        Shop by Categories
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={closeDialog}
                        className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden py-6">
                      <div className="flex items-start justify-between mx-3">
                        <div className="w-full border-2 border-current rounded-md dark:shadow-sm dark:shadow-white/20 overflow-hidden">
                          <div className="flex flex-col m-auto">
                            <div className="flex flex-col">
                              {categories.map((category, index) => (
                                <div key={index + category.name}>
                                  <button
                                    onClick={() => {
                                      navigate(`/category/${category.slug}`);
                                      closeDialog();
                                    }}
                                    className="dropdown-button flex items-center justify-between w-full pr-px py-3 text-[14.2px] sm:text-[14.2px] dark:text-[#f5f5f5] hover:bg-gray-200 dark:hover:bg-white/10"
                                  >
                                    <div className="flex items-center font-bold px-2">
                                      <p>{category.name}</p>
                                    </div>

                                    {/* <ChevronDownIcon
                                      className={`w-5 h-5 transform transition-transform mr-2 ${
                                        openCategory === category.slug
                                          ? "rotate-180"
                                          : "rotate-0"
                                      }`}
                                    /> */}
                                  </button>
                                  {/*
                                  {openCategory === category.slug && (
                                    <div className="flex flex-col z-50 w-full pr-px">
                                      {subCategories[category.slug]?.map((item, index) => (
                                        <div key={item.name + index}>
                                          <button
                                            onClick={() => {
                                              localStorage.setItem(
                                                "subcategory",
                                                item.slug
                                              );
                                              searchProducts(
                                                `/?subcategory=${item.slug}`,
                                                "/shopByCategory"
                                              );
                                              setShopHeading(item.slug);
                                              setIsMobileCategoryOpen(false);
                                            }}
                                            className="py-2 w-full block text-left bg-gray-100 dark:bg-white/20 dark:text-[#f5f5f5] px-2 rounded-sm hover:bg-gray-200 dark:hover:bg-white/10"
                                          >
                                            {item.name}
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )} */}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
