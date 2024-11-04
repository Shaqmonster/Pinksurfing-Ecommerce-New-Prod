import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useRef, useState } from "react";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { IoCloseOutline } from "react-icons/io5";
import { Country, State, City } from "country-state-city";
import { dataContext } from "../context/dataContext";

export default function AddressForm() {
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const { isAddressFormOpen, setIsAddressFormOpen, user } =
    useContext(authContext);
  const [cookies, removeCookie] = useCookies([]);
  const {handleError , handleSuccess} = useContext(dataContext);

  const navigate = useNavigate();
  const cancelButtonRef = useRef();
  function closeModal() {
    setIsAddressFormOpen(false);
  }

  function openModal() {
    setIsAddressFormOpen(true);
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
      setAddress((prevAddress) => ({
        ...prevAddress,
        [name]: value,
        state: "",
        city: "",
      }));
    } else if (name === "state") {
      const selectedState = states.find((state) => state.name === value);
      if (selectedState) {
        setCities(
          City.getCitiesOfState(address.country, selectedState.isoCode)
        );
      } else {
        setCities([]);
      }
      setAddress((prevAddress) => ({
        ...prevAddress,
        [name]: value,
        city: "",
      }));
    } else {
      setAddress((prevAddress) => ({
        ...prevAddress,
        [name]: value,
      }));
    }
  };

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  const AddAddress = async (e) => {
    e.preventDefault();
    if (!cookies.token) {
      navigate("/signin");
    }
    if (!user.email) {
      console.error("User email is missing.");
      return;
    }

    const updatedAddress = {
      ...address,
      email: user.email,
    };
    console.log(updatedAddress);
    axios
      .post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/address/`,
        updatedAddress,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      )
      .then((response) => {
        console.log(response.data);
        toast.success("Address Added", { position: "top-center" });
        setTimeout(() => {
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
          setIsAddressFormOpen(false);
        }, 1000);
      })
      .catch((error) => {
        handleError(error.response.data.msg || error.response.data.error || "Error adding address");
        console.error(error);
      });
  };

  const CreateAndVerifyAddress = async (e) => {
    e.preventDefault();

    const apiKey = import.meta.env.VITE_EASYPOST_APIKEY;
    console.log(user);
    const response = await fetch(
      "https://api.easypost.com/v2/addresses/create_and_verify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${btoa(`${apiKey}:`)}`,
        },
        body: JSON.stringify({
          address: {
            street1: address.street1,
            street2: address.street2,
            city: address.city,
            state: address.state,
            zip: address.zip_code,
            country: address.country,
            email: user.email,
            phone: user.phone,
          },
        }),
      }
    );

    const data = await response.json();
    if (response.ok) {
      console.log("Address verified successfully:", data);
    } else {
      handleError('Error verifying address')
      console.error("Error verifying address:", data);
    }
  };

  return (
    <>
      <Transition appear show={isAddressFormOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => {}}
          open={isAddressFormOpen}
          initialFocus={cancelButtonRef}
          static
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
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-black p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg mb-7 flex items-center justify-between font-medium leading-6 text-gray-900"
                  >
                    Add New Address
                    <button
                      type="button"
                      className="overflow-hidden"
                      onClick={closeModal}
                    >
                      <IoCloseOutline className=" text-[23px] cursor-pointer" />
                    </button>
                  </Dialog.Title>
                  <form onSubmit={AddAddress} className="w-full max-w-lg">
                    <div className="flex flex-wrap -mx-3 mb-6">
                      <div className="w-full px-3">
                        <label
                          className="block uppercase tracking-wide text-black text-xs font-bold mb-2"
                          htmlFor="name"
                        >
                          Name
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Name"
                          value={name}
                          onChange={handleOnChange}
                          required
                          autoFocus
                        />
                      </div>
                      <div className="w-full px-3">
                        <label
                          className="block uppercase tracking-wide text-black text-xs font-bold mb-2"
                          htmlFor="phone"
                        >
                          Phone
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          id="phone"
                          name="phone"
                          type="text"
                          placeholder="10-digit mobile number"
                          value={phone}
                          onChange={handleOnChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap -mx-3 mb-6">
                      <div className="w-full md:w-1/2 px-3 mb-6 md:mb-0">
                        <label
                          className="block uppercase tracking-wide text-black text-xs font-bold mb-2"
                          htmlFor="street1"
                        >
                          Steet 1
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white dark:bg-black"
                          id="street1"
                          name="street1"
                          type="text"
                          placeholder="Street 1"
                          value={street1}
                          onChange={handleOnChange}
                          required
                        />
                      </div>
                      <div className="w-full md:w-1/2 px-3">
                        <label
                          className="block uppercase tracking-wide text-black text-xs font-bold mb-2"
                          htmlFor="street2"
                        >
                          Street 2
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          name="street2"
                          id="street2"
                          type="text"
                          placeholder="Street 2"
                          value={street2}
                          onChange={handleOnChange}
                        />
                      </div>
                    </div>
                    <div className="flex  -mx-3 mb-6">
                      <div className="w-full px-3">
                        <label
                          className="block uppercase tracking-wide text-black text-xs font-bold mb-2"
                          htmlFor="country"
                        >
                          Country
                        </label>
                        <div className="relative">
                          <select
                            className="block appearance-none w-full bg-gray-200 border border-gray-200 text-black py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                            id="country"
                            name="country"
                            value={country}
                            onChange={handleOnChange}
                            required
                          >
                            <option value="">Select Country</option>
                            {countries.map((country) => (
                              <option
                                key={country.isoCode}
                                value={country.isoCode}
                              >
                                {country.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="w-full px-3">
                        <label
                          className="block uppercase tracking-wide text-black text-xs font-bold mb-2"
                          htmlFor="state"
                        >
                          State
                        </label>
                        <select
                          className="block appearance-none w-full bg-gray-200 border border-gray-200 text-black py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          id="state"
                          name="state"
                          value={state}
                          onChange={handleOnChange}
                          required
                        >
                          <option value="">Select State</option>
                          {states.map((state) => (
                            <option key={state.name} value={state.name}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex -mx-3 mb-2">
                      <div className="w-full px-3">
                        <label
                          className="block uppercase tracking-wide text-black text-xs font-bold mb-2"
                          htmlFor="city"
                        >
                          City
                        </label>
                        <select
                          className="block appearance-none w-full bg-gray-200 border border-gray-200 text-black py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          id="city"
                          name="city"
                          value={city}
                          onChange={handleOnChange}
                          required
                        >
                          <option value="">Select City</option>
                          {cities.map((city) => (
                            <option key={city.name} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="w-full px-3">
                        <label
                          className="block uppercase tracking-wide text-black text-xs font-bold mb-2"
                          htmlFor="zip_code"
                        >
                          Zip
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 text-black border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          id="zip_code"
                          name="zip_code"
                          type="number"
                          placeholder="Zip Code"
                          value={zip_code}
                          onChange={handleOnChange}
                          required
                        />
                      </div>
                    </div>
                    <button
                      disabled={
                        !name ||
                        !phone ||
                        !street1 ||
                        !state ||
                        !city ||
                        !country ||
                        !zip_code
                      }
                      className=" w-full flex items-center justify-center disabled:bg-gray-500 bg-[#2d1e5f] text-white py-3 rounded-lg mt-6"
                    >
                      {" "}
                      Add
                    </button>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
