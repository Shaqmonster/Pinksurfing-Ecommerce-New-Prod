import { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import Header from "../components/Header";
import { Fragment } from "react";
import { Dialog, Disclosure, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FunnelIcon, MinusIcon, PlusIcon } from "@heroicons/react/20/solid";
import { authContext } from "../context/authContext";
import SearchForm from "../components/Search";

export default function ShopByStore() {
  const navigate = useNavigate();
  const [cookies, removeCookie] = useCookies([]);
  const { isDarkMode } = useContext(authContext);

  // useState========================================================================
  const [stores, setStores] = useState([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [sortMethod, setSortMethod] = useState("default");
  const [sortName, setSortName] = useState("Sort By Newest");
  const [loading, setLoading] = useState(false);
  const awsS3BaseUrl =
    "https://pinksurfing-ecom.s3.us-east-2.amazonaws.com/";

  const sortMethods = [
    { name: "Newest", value: "date" },
    { name: "Name: a to z", value: "ascName" },
    { name: "Name: z to a", value: "descName" },
  ];

  const handleSort = (sortMethod) => {
    switch (sortMethod) {
      case "ascName":
        return (a, b) =>
          a.store_name.toLowerCase() > b.store_name.toLowerCase() ? 1 : -1;
      case "descName":
        return (a, b) =>
          b.store_name.toLowerCase() > a.store_name.toLowerCase() ? 1 : -1;
      case "date":
        return (a, b) => new Date(a.createdAt) - new Date(b.createdAt);
      default:
        return (a, b) => a.id - b.id;
    }
  };

  // axios requests ===================================================================
  useEffect(() => {
    const getFilterStores = async () => {
      setLoading(true);
      axios
        .get(`${import.meta.env.VITE_SERVER_URL}/api/vendor/all-stores/`, {
          headers: { "Content-Type": "application/json" },
        })
        .then((response) => {
          console.log(response.data.stores);
          setStores(response.data.stores);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
        });
    };
    getFilterStores();
  }, [cookies, navigate, removeCookie]);

  return (
    <div className={`bg-white ${isDarkMode && "dark"} dark:bg-black`}>

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
                <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white dark:bg-black py-4 pb-12 shadow-xl">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Filters
                    </h2>
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
                    <Disclosure
                      as="div"
                      className="border-b border-gray-200 py-6"
                    >
                      {({ open }) => (
                        <>
                          <h3 className="-my-3 flow-root">
                            <Disclosure.Button className="flex w-full items-center justify-between bg-white dark:bg-black py-3 text-sm text-gray-400 hover:text-gray-500">
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
          <div className="flex relative items-center justify-between border-b dark:text-[#f5f5f5] border-gray-200 lg:pb-6 py-4 px-4">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-[24px] text-purple-900 dark:text-white sm:text-[27px]">
                Store
              </h1>
            </div>

            <Disclosure as="div" className="relative mx-auto hidden lg:block">
              {({ open }) => (
                <>
                  <h3 className="-my-3 flow-root">
                    <Disclosure.Button className="flex items-center justify-between bg-white dark:bg-black py-3 text-sm text-gray-400 hover:text-gray-500">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Sort By: {sortName}
                      </span>
                      <span className="ml-6 flex items-center">
                        {open ? (
                          <MinusIcon className="h-5 w-5" aria-hidden="true" />
                        ) : (
                          <PlusIcon className="h-5 w-5" aria-hidden="true" />
                        )}
                      </span>
                    </Disclosure.Button>
                  </h3>
                  <Disclosure.Panel className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-lg z-10">
                    <div className="space-y-4 p-4">
                      {sortMethods.map((option, optionIdx) => (
                        <div
                          key={optionIdx}
                          className="flex items-center cursor-pointer"
                          onClick={() => {
                            setSortMethod(option.value);
                            setSortName(`${option.name}`);
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
              Stores
            </h2>

            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3 2xl:grid-cols-3">
              {!loading ? (
                <div className="lg:col-span-3 2xl:col-span-4">
                  <div className="bg-white dark:bg-black">
                    <div className=" w-full  sm:py-0 sm:pb-10  lg:px-0">
                      <div
                        className={`grid pb-6 lg:grid-cols-3 sm:grid-cols-2 grid-cols-2 2xl:grid-cols-4 gap-x-3 gap-y-3 lg:gap-x-5 lg:items-center lg:justify-start flex-wrap`}
                      >
                        {stores
                          .sort(handleSort(sortMethod))
                          .map((store, storeIndex) => {
                            return (
                              <div key={storeIndex} className="p-2">
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
                                    className="h-40 w-full object-cover"
                                  />
                                  <h3 className="mt-2 text-lg font-medium">
                                    {store.store_name}
                                  </h3>
                                </Link>
                              </div>
                            );
                          })}
                      </div>
                      {stores?.length === 0 && (
                        <div className=" w-full h-full text-center">
                          <p className=" dark:text-[#f5f5f5]">
                            No Stores Available
                          </p>
                        </div>
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
