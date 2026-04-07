import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import OrderConfirm from "./OrderConfirm";
import {
  XMarkIcon,
  MapPinIcon,
  PlusIcon,
  CheckIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import AddressForm from "./AddressForm";
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
  const [cookies, removeCookie] = useCookies([]);
  const [addresses, setAddresses] = useState([]);
  const [orderConfirm, setorderConfirm] = useState(false);
  const [addressesId, setAddressesId] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [order_id, setOrderId] = useState();
  const [loading, setLoading] = useState(false);
  const [shippingSpeed, setShippingSpeed] = useState("standard");
  const navigate = useNavigate();

  function closeModal() {
    setIsSingleOrderFormOpen(false);
  }

  const GetAddresses = async () => {
    if (!cookies.access_token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/address/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token}`,
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
    if (!cookies.access_token) {
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
          // Send the raw variant selections — the backend validates the price
          // from the DB so the price cannot be manipulated on the client side.
          selected_variants: singleOrderProduct.selected_variants || [],
          shipping_speed: shippingSpeed,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
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
        toast.error(
          error.response?.data?.Status ||
            error.response?.data?.error ||
            "An error occurred",
          { position: "top-center", autoClose: 3000 }
        );
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
            className={`${isDarkMode && "dark"} relative z-50`}
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
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 scale-95"
                  enterTo="opacity-100 translate-y-0 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 scale-100"
                  leaveTo="opacity-0 translate-y-4 scale-95"
                >
                  <Dialog.Panel className="w-full sm:max-w-md transform rounded-2xl bg-white dark:bg-[#0E0F13] shadow-2xl transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#9747FF]/10">
                          <ShoppingBagIcon className="h-[18px] w-[18px] text-[#9747FF]" />
                        </div>
                        <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                          Quick Order
                        </Dialog.Title>
                      </div>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="px-5 py-4 space-y-5">
                      {/* Product Preview */}
                      <div className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
                        <img
                          className="h-20 w-20 rounded-lg border border-gray-200 dark:border-gray-700 object-cover"
                          src={`${singleOrderProduct.image1}`}
                          alt={singleOrderProduct.name}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white capitalize truncate">
                            {singleOrderProduct.name}
                          </p>
                          <p className="text-lg font-bold text-[#9747FF] mt-1">
                            {currency}
                            {singleOrderProduct.unit_price}
                          </p>
                          {singleOrderProduct.additional_price > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              includes {currency}
                              {singleOrderProduct.additional_price} variant
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Shipping Speed — payload value: "standard" | "express" */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Shipping Speed
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {/* Standard */}
                          <button
                            type="button"
                            onClick={() => setShippingSpeed("standard")}
                            className={`rounded-xl border-2 p-3 text-left transition-all ${
                              shippingSpeed === "standard"
                                ? "border-[#9747FF] bg-[#9747FF]/10"
                                : "border-gray-200 dark:border-gray-700 hover:border-[#9747FF]/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                                shippingSpeed === "standard"
                                  ? "border-[#9747FF] bg-[#9747FF]"
                                  : "border-gray-400 dark:border-gray-500"
                              }`} />
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Standard
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pl-5">
                              Economical delivery
                            </p>
                          </button>

                          {/* Express */}
                          <button
                            type="button"
                            onClick={() => setShippingSpeed("express")}
                            className={`rounded-xl border-2 p-3 text-left transition-all ${
                              shippingSpeed === "express"
                                ? "border-[#9747FF] bg-[#9747FF]/10"
                                : "border-gray-200 dark:border-gray-700 hover:border-[#9747FF]/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                                shippingSpeed === "express"
                                  ? "border-[#9747FF] bg-[#9747FF]"
                                  : "border-gray-400 dark:border-gray-500"
                              }`} />
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Express
                              </p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pl-5">
                              Fastest available
                            </p>
                          </button>
                        </div>
                      </div>

                      {/* Address Section */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <MapPinIcon className="w-4 h-4 text-[#9747FF]" />
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Delivery Address
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsAddressFormOpen(true)}
                            className="flex items-center gap-1 text-xs font-medium text-[#9747FF] hover:text-[#8533EE] transition-colors"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add New
                          </button>
                        </div>

                        {addresses.length > 0 ? (
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {addresses.map((address, index) => {
                              const isSelected = addressesId === address.id;
                              return (
                                <div
                                  key={address.id + index + address.zip_code}
                                  onClick={() => setAddressesId(address.id)}
                                  className={`relative cursor-pointer rounded-xl p-3.5 transition-all ${
                                    isSelected
                                      ? "border-2 border-[#9747FF] bg-purple-50 dark:bg-purple-900/10"
                                      : "border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                        isSelected
                                          ? "border-[#9747FF] bg-[#9747FF]"
                                          : "border-gray-300 dark:border-gray-600"
                                      }`}
                                    >
                                      {isSelected && (
                                        <CheckIcon className="h-3 w-3 text-white" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {address.name || `Address ${index + 1}`}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                                        {address.street1}
                                        {address.street2
                                          ? `, ${address.street2}`
                                          : ""}
                                        <br />
                                        {address.city}, {address.state},{" "}
                                        {address.country} - {address.zip_code}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div
                            onClick={() => setIsAddressFormOpen(true)}
                            className="cursor-pointer rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-[#9747FF] dark:hover:border-[#9747FF] p-6 flex flex-col items-center justify-center transition-colors"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9747FF]/10 mb-2">
                              <MapPinIcon className="h-5 w-5 text-[#9747FF]" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              No address yet
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Tap to add a shipping address
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Place Order Button */}
                      <button
                        type="button"
                        onClick={PlaceSingleOrder}
                        disabled={loading || !addressesId}
                        className="w-full rounded-xl bg-[#9747FF] hover:bg-[#8533EE] disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <svg
                              className="animate-spin h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            Processing...
                          </>
                        ) : (
                          "Continue to Payment"
                        )}
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
