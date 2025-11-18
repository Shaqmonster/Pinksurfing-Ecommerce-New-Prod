import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import OrderConfirm from "./OrderConfirm";
import { IoClose } from "react-icons/io5";
import { PencilIcon } from "@heroicons/react/24/outline";
import AddressForm from "./AddressForm";
import { dataContext } from "../context/dataContext";
import PaymentOptionsModal from "../pages/PaymentOptionsModal";

export default function SingleOrderForm() {
  const {
    isSingleOrderFormOpen,
    currency,
    setIsSingleOrderFormOpen,
    singleOrderProduct,
    setSingleOrderProduct,
    isDarkMode,
    isAddressFormOpen,
    setIsAddressFormOpen,
  } = useContext(authContext);
  const { additionalAttribute, setAdditionalAttribute } =
    useContext(dataContext);
  const [cookies, removeCookie] = useCookies([]);
  const [addresses, setAddresses] = useState([]);
  const [orderConfirm, setorderConfirm] = useState(false);
  const [addressesId, setAddressesId] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [order_id, setOrderId] = useState();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  function closeModal() {
    setIsSingleOrderFormOpen(false);
  }
  let [profile, setProfile] = useState({
    customer_email: "",
    customer_phone: "",
    date_registered: "",
    is_verified: "",
  });

  const GetAddresses = async () => {
    if (!cookies.token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/address/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((response) => {
        const addressesArray = Array.isArray(response.data.addresses)
          ? response.data.addresses
          : Object.values(response.data.addresses).filter(
              (value) => value !== null && value !== undefined
            );

        setAddresses(addressesArray);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  const PlaceSingleOrder = async () => {
    if (!cookies.token) {
      navigate("/signin");
    }
    if (!addressesId) {
      toast.error("Select an Address");
      setIsAddressFormOpen(true);
      return;
    }
    setLoading(true);
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/create-single-order/${
          singleOrderProduct.id
        }/`,
        {
          address: addressesId,
          additional_price: additionalAttribute.price,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        setOrderId(response.data.order_id);
        setIsPaymentModalOpen(true);
        closeModal();
      })
      .catch((error) => {
        console.error(error);
        toast.error(error.response.data.Status || error.response.data.error || "An error occurred", {
          position: "top-center",
          autoClose: 3000,
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };
  useEffect(() => {
    GetAddresses();
  }, [cookies, isAddressFormOpen, navigate, removeCookie]);

  useEffect(() => {
    if (addresses.length > 0) {
      setAddressesId(addresses[0].id);
    }
  }, [addresses]);

  return (
    <>
      {orderConfirm && <OrderConfirm />}
      {isAddressFormOpen ? (
        <AddressForm />
      ) : (
        <Transition appear show={isSingleOrderFormOpen} as={Fragment}>
          <Dialog
            as="div"
            className={`${isDarkMode && "dark"} relative z-10`}
            onClose={closeModal}
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
              <div className="fixed inset-0 bg-black/25" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full sm:max-w-md transform overflow-hidden bg-white dark:bg-[#0E0F13] rounded-2xl p-4 sm:p-6 text-left align-middle shadow-xl transition-all">
                        <Dialog.Title
                          as="h3"
                          className="text-lg mb-7 flex items-center justify-between font-medium leading-6 text-gray-900 dark:text-white "
                        >
                          Select Address of Delivery
                          <IoClose
                            className=" cursor-pointer"
                            onClick={() => {
                              closeModal();
                            }}
                          />
                        </Dialog.Title>
                        <div className="mt-8 space-y-3 rounded-lg border text-black dark:text-white dark:bg-[#0E0F13] bg-white px-2 py-4 sm:px-6">
                          <div className="flex flex-row items-center rounded-lg bg-white dark:bg-[#0E0F13] sm:flex-row">
                            <img
                              className="m-2 h-24 w-28 rounded-md border object-cover object-center"
                              src={`${singleOrderProduct.image1}`}
                              // src="https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OHx8c25lYWtlcnxlbnwwfHwwfHw%3D&auto=htmlFormat&fit=crop&w=500&q=60"
                              alt=""
                            />
                            <div className="flex lg:w-full capitalize flex-col px-4 py-4">
                              <span className="font-semibold">
                                {singleOrderProduct.name}
                              </span>
                              <span className="float-right text-black dark:text-white">
                                {/* Quantity : {singleOrderProduct.quantity} */}
                              </span>
                              <p className="mt-auto text-md font-semibold">
                                {currency}
                                {additionalAttribute.price > 0
                                  ? additionalAttribute.price
                                  : singleOrderProduct.unit_price}
                              </p>
                              <p
                                className={`text-[15px] ${
                                  additionalAttribute?.price === 0 && "hidden"
                                }`}
                              >
                                {additionalAttribute.price > 0 && (
                                  <>
                                    {/* Additional Price: {currency} {additionalAttribute.price} */}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-lg flex text-gray-900  dark:text-white items-center font-medium">
                          Shipping Address{" "}
                          <PencilIcon
                            onClick={() => {
                              setIsAddressFormOpen(true);
                            }}
                            className=" ml-3 cursor-pointer w-[19px] "
                          />
                        </p>

                        <form className="mt-5 gap-6  flex flex-col overflow-y-auto border-l overflow-x-hidden border-white/90 p-1 h-[170px] justify-between">
                          {addresses?.slice().map((address, index) => {
                            return (
                              <div
                                key={address.id + index + address.zip_code}
                                className={`relative w-full h-fit ${
                                  addressesId === address.id
                                    ? "border-2 border-blue-400 rounded-md"
                                    : "border border-gray-300 rounded-md"
                                }`}
                                onClick={() => {
                                  setAddressesId(address.id);
                                }}
                              >
                                <span
                                  className={`absolute right-4 top-1/2 box-content block h-3 w-3 -translate-y-1/2 rounded-full border-8 ${
                                    addressesId === address.id
                                      ? "border-blue-400"
                                      : "border-gray-300"
                                  } bg-white dark:bg-black`}
                                ></span>
                                <label
                                  className=" border-gray-700  w-full flex cursor-pointer select-none rounded-md border p-4"
                                  htmlFor="radio_2"
                                >
                                  <div className=" sm:ml-5 flex items-center text-black dark:text-white justify-between w-[80%] overflow-hidden sm:w-[83%]">
                                    <div className=" flex flex-col">
                                      <span className="mt-2 font-semibold">
                                        Address - {index + 1}{" "}
                                      </span>
                                      <p className="text-slate-900 dark:text-white overflow-hidden overflow-ellipsis text-sm leading-6">
                                        {address.street1},{address.street2},
                                        <span className=" block">
                                          {address.city},{address.state},
                                        </span>
                                        <span className=" block">
                                          {address.country}, zip code :{" "}
                                          {address.zip_code}
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </label>
                              </div>
                            );
                          })}
                        </form>
                        <div className="mt-5 flex items-center justify-between">
                          <button
                            type="button"
                            className="w-full py-2.5 bg-[#6A1BBE] hover:bg-[#572a88] font-semibold rounded-md text-white flex items-center justify-center"
                            onClick={PlaceSingleOrder}
                            disabled={loading}
                          >
                            {loading && (
                              <img
                                src="/loading.svg"
                                alt="loading"
                                className="mr-2 w-[20px] h-[20px] sm:w-[30px] sm:h-[30px] object-contain"
                              />
                            )}
                            <span>
                              {loading
                                ? "Processing..."
                                : "Continue to Payment"}
                            </span>
                          </button>
                        </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>
      )}
      {isPaymentModalOpen && (
        <PaymentOptionsModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          order_id={order_id}
          singleOrderProduct={singleOrderProduct}
        />
      )}
    </>
  );
}
