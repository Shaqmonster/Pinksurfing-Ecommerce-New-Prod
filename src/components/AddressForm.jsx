import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useRef, useState } from "react";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { XMarkIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Country, State, City } from "country-state-city";
import { dataContext } from "../context/dataContext";

export default function AddressForm() {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { isAddressFormOpen, setIsAddressFormOpen, user } =
    useContext(authContext);
  const [cookies] = useCookies([]);
  const { handleError } = useContext(dataContext);

  const navigate = useNavigate();
  const cancelButtonRef = useRef();

  function closeModal() {
    setIsAddressFormOpen(false);
  }

  const [address, setAddress] = useState({
    name: "",
    phone: "",
    street1: "",
    street2: "",
    city: "",
    country: "",
    state: "",
    zip_code: "",
  });

  const { name, phone, street1, street2, state, city, country, zip_code } =
    address;

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    if (name === "country") {
      const countryCode = value;
      setStates(State.getStatesOfCountry(countryCode));
      setCities([]);
      setAddress((prev) => ({ ...prev, [name]: value, state: "", city: "" }));
    } else if (name === "state") {
      const selectedState = states.find((s) => s.name === value);
      if (selectedState) {
        setCities(City.getCitiesOfState(address.country, selectedState.isoCode));
      } else {
        setCities([]);
      }
      setAddress((prev) => ({ ...prev, [name]: value, city: "" }));
    } else {
      setAddress((prev) => ({ ...prev, [name]: value }));
    }
  };

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  const isFormValid = name && phone && street1 && state && city && country && zip_code;

  const AddAddress = async (e) => {
    e.preventDefault();
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    if (!user.email) {
      console.error("User email is missing.");
      return;
    }

    setSubmitting(true);
    const updatedAddress = { ...address, email: user.email };

    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/address/`,
        updatedAddress,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      )
      .then(() => {
        toast.success("Address added successfully!", { position: "top-center" });
        setAddress({
          name: "",
          phone: "",
          street1: "",
          street2: "",
          city: "",
          country: "",
          state: "",
          zip_code: "",
        });
        setTimeout(() => setIsAddressFormOpen(false), 600);
      })
      .catch((error) => {
        handleError(
          error.response?.data?.msg ||
            error.response?.data?.error ||
            "Error adding address"
        );
        console.error(error);
      })
      .finally(() => setSubmitting(false));
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1A1C1E] text-gray-900 dark:text-white px-4 py-3 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:border-[#9747FF] focus:ring-2 focus:ring-[#9747FF]/20 focus:outline-none transition-all";
  const selectClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-[#1A1C1E] text-gray-900 dark:text-white px-4 py-3 text-sm focus:border-[#9747FF] focus:ring-2 focus:ring-[#9747FF]/20 focus:outline-none transition-all appearance-none";
  const labelClass =
    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <Transition appear show={isAddressFormOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-50"
        onClose={closeModal}
        initialFocus={cancelButtonRef}
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-4 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform rounded-2xl bg-white dark:bg-[#0E0F13] shadow-2xl transition-all">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9747FF]/10">
                      <MapPinIcon className="h-5 w-5 text-[#9747FF]" />
                    </div>
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                        Add New Address
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enter your shipping details below
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={AddAddress} className="px-6 py-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={handleOnChange}
                        required
                        autoFocus
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className={labelClass}>
                        Phone <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChange={handleOnChange}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="street1" className={labelClass}>
                        Street 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="street1"
                        name="street1"
                        type="text"
                        placeholder="123 Main St"
                        value={street1}
                        onChange={handleOnChange}
                        required
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="street2" className={labelClass}>
                        Street 2
                      </label>
                      <input
                        id="street2"
                        name="street2"
                        type="text"
                        placeholder="Apt, Suite (optional)"
                        value={street2}
                        onChange={handleOnChange}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="country" className={labelClass}>
                        Country <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={country}
                        onChange={handleOnChange}
                        required
                        className={selectClass}
                      >
                        <option value="">Select Country</option>
                        {countries.map((c) => (
                          <option key={c.isoCode} value={c.isoCode}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="state" className={labelClass}>
                        State <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="state"
                        name="state"
                        value={state}
                        onChange={handleOnChange}
                        required
                        className={selectClass}
                      >
                        <option value="">Select State</option>
                        {states.map((s) => (
                          <option key={s.name} value={s.name}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className={labelClass}>
                        City <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="city"
                        name="city"
                        value={city}
                        onChange={handleOnChange}
                        required
                        className={selectClass}
                      >
                        <option value="">Select City</option>
                        {cities.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="zip_code" className={labelClass}>
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="zip_code"
                        name="zip_code"
                        type="number"
                        placeholder="12345"
                        value={zip_code}
                        onChange={handleOnChange}
                        required
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2 pb-1">
                    <button
                      type="button"
                      onClick={closeModal}
                      ref={cancelButtonRef}
                      className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid || submitting}
                      className="flex-1 rounded-lg bg-[#9747FF] px-4 py-3 text-sm font-medium text-white hover:bg-[#8533EE] disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        "Save Address"
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
