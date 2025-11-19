import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { IoClose } from "react-icons/io5";
import { CountriesISO } from "../utils/CountriesISO";
import { Country, State, City } from "country-state-city";
import { dataContext } from "../context/dataContext";

export default function VendorDetailsForm() {
  const { isVendorFormOpen, isDarkMode, user, setUser, setIsVendorFormOpen } =
    useContext(authContext);
  const [cookies, removeCookie] = useCookies([]);
  const navigate = useNavigate();
  const [storeImage, setStoreImage] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const { handleError } = useContext(dataContext);

  function closeModal() {
    setIsVendorFormOpen(false);
  }

  function openModal() {
    setIsVendorFormOpen(true);
  }

  let [profile, setProfile] = useState({
    customer_email: "",
    customer_phone: "",
    date_registered: "",
    is_verified: "",
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

  const {
    email,
    customer_phone,
    store_name,
    website,
    bio,
    street1,
    street2,
    city,
    state,
    country,
    zip_code,
  } = profile;

  useEffect(() => {
    setCountries(Country.getAllCountries());
  }, []);

  const handleOnChange = (e) => {
    const { name, value } = e.target;

    if (name === "country") {
      setProfile((prevProfile) => ({
        ...prevProfile,
        country: value,
        state: "",
        city: "",
      }));

      const countryCode = countries.find((c) => c.isoCode === value)?.isoCode;
      if (countryCode) {
        setStates(State.getStatesOfCountry(countryCode));
        setCities([]);
      } else {
        setStates([]);
        setCities([]);
      }
    } else if (name === "state") {
      setProfile((prevProfile) => ({
        ...prevProfile,
        state: value,
        city: "",
      }));

      const stateCode = states.find((s) => s.isoCode === value)?.isoCode;
      const countryCode = profile.country;
      if (stateCode && countryCode) {
        setCities(City.getCitiesOfState(countryCode, stateCode));
      } else {
        setCities([]);
      }
    } else if (name === "city") {
      setProfile((prevProfile) => ({
        ...prevProfile,
        city: value,
      }));
    } else {
      setProfile((prevProfile) => ({
        ...prevProfile,
        [name]: value,
      }));
    }
  };

  const handleStoreFile = (e) => {
    setStoreImage(e.target.files[0]);
  };

  const handleRemoveStoreFile = () => {
    setStoreImage(null);
  };

  const GetProfile = async (e) => {
    if (!cookies.access_token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/profile/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token}`,
        },
      })
      .then((response) => {
        console.log(response.data);

        setProfile(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    GetProfile();
  }, [cookies, navigate, removeCookie]);

  const UpdateProfile = async (e) => {
    e.preventDefault();
    if (!cookies.access_token) {
      navigate("/signin");
    }

    const formData = new FormData();
    formData.append("company_name", store_name);
    formData.append("website", website);
    formData.append("bio", bio);
    formData.append("street1", street1);
    formData.append("street2", street2);
    formData.append("city", city);
    formData.append("state", state);
    formData.append("country", country);
    formData.append("zip_code", zip_code);
    if (storeImage) {
      formData.append("shop_image", storeImage);
    }

    axios
      .post(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/vendor/customer-vendor-registration/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      )
      .then((response) => {
        console.log(response);
        toast.success("You're now a vendor on Pinksurfing", {
          position: "top-center",
        });
        window.location.href = "https://vendors.pinksurfing.com/";
      })
      .catch((error) => {
        handleError(error.response.data.message || error.response.data.status || "Unable to Register as Vendor");
        console.error(error);
      });
  };

  return (
    <>
      <Transition appear show={isVendorFormOpen} as={Fragment}>
        <Dialog
          as="div"
          className={`relative ${isDarkMode && "dark"} z-10`}
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
            <div className="fixed inset-0 bg-black/30" />
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg mb-7 font-medium leading-6 text-gray-900 dark:text-[#f5f5f5]"
                  >
                    My Profile
                    {profile.is_verified ? (
                      <span className=" text-sm ml-3 text-green-400">
                        Verified
                      </span>
                    ) : (
                      <span className=" text-sm ml-3 text-red-500">
                        Not Verified
                      </span>
                    )}
                    <span className=" font-medium text-sm text-black/90 w-full block sm:inline-block -mb-3 sm:mb-0 sm:w-fit sm:ml-3 dark:text-[#f5f5f5]">
                      <span className=" text-black/60 font-normal dark:text-[#f5f5f5]">
                        Registered on:{" "}
                      </span>
                      {new Date(profile.date_registered).toDateString()}
                    </span>
                    <IoClose
                      className=" absolute top-2 right-3 cursor-pointer"
                      onClick={() => {
                        closeModal();
                      }}
                    />
                  </Dialog.Title>
                  <form onSubmit={GetProfile} className="w-full max-w-lg">
                    <div className="flex flex-wrap -mx-3 mb-6">
                      <div className="w-full  px-3 mb-6 md:mb-0">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="customer_email"
                        >
                          Email
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white dark:bg-black"
                          id="customer_email"
                          name="customer_email"
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={handleOnChange}
                          readOnly
                          required
                        />
                      </div>
                      <div className="w-full px-3">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="customer_phone"
                        >
                          Phone Number
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          name="customer_phone"
                          id="customer_phone"
                          type="number"
                          placeholder="Phone Number"
                          value={customer_phone}
                          onChange={handleOnChange}
                          readOnly
                          required
                        />
                      </div>
                      <div className="w-full px-3">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="store_name"
                        >
                          Store Name
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          name="store_name"
                          id="store_name"
                          type="name"
                          placeholder="Store Name"
                          value={store_name}
                          onChange={handleOnChange}
                          required
                        />
                      </div>

                      <div className="w-full px-3 mt-5">
                        <form action="#" className="relative">
                          <h2 className="font-medium text-gray-700 text-center dark:text-[#f5f5f5]">
                            Upload Store Image
                          </h2>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 z-50 m-0 h-full w-full cursor-pointer p-0 opacity-0 outline-none"
                              onChange={handleStoreFile}
                            />
                            <div className="flex flex-col items-center justify-center space-y-3">
                              {storeImage ? (
                                <div className="relative">
                                  <img
                                    src={URL.createObjectURL(storeImage)}
                                    alt={storeImage.name}
                                    className="h-20 w-20 object-cover rounded-md"
                                  />
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveStoreFile();
                                    }}
                                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                                  >
                                    X
                                  </button>
                                </div>
                              ) : (
                                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-white dark:border-strokedark dark:bg-boxdark">
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 16 16"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    {/* Your SVG paths for the icon */}
                                  </svg>
                                </span>
                              )}
                              <label
                                htmlFor="storeImageInput"
                                className="text-primary cursor-pointer"
                              >
                                Click to upload
                              </label>
                              {storeImage ? (
                                <p>{storeImage.name}</p>
                              ) : (
                                <>
                                  <p className="mt-1.5">
                                    SVG, PNG, JPG, or GIF
                                  </p>
                                  <p>(max, 800 X 800px)</p>
                                </>
                              )}
                            </div>
                          </div>
                        </form>
                      </div>

                      <div className="w-full px-3 mt-5">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="website"
                        >
                          Website
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          name="website"
                          id="website"
                          type="url"
                          placeholder="Website"
                          value={website}
                          onChange={handleOnChange}
                          required
                        />
                      </div>

                      <div className="w-full px-3 mt-5">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="bio"
                        >
                          Bio
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          name="bio"
                          id="bio"
                          placeholder="Bio"
                          value={bio}
                          onChange={handleOnChange}
                          required
                        />
                      </div>

                      <div className="w-full px-3 mt-5">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="street1"
                        >
                          Street 1
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          name="street1"
                          id="street1"
                          type="text"
                          placeholder="Street 1"
                          value={street1}
                          onChange={handleOnChange}
                          required
                        />
                      </div>

                      <div className="w-full px-3 mt-5">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="street2"
                        >
                          Street 2
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          name="street2"
                          id="street2"
                          type="text"
                          placeholder="Street 2"
                          value={street2}
                          onChange={handleOnChange}
                          required
                        />
                      </div>

                      <div className="w-full px-3 mt-5">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="country"
                        >
                          Country
                        </label>
                        <select
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 dark:border-gray-600 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:focus:bg-gray-400 focus:border-gray-500 dark:focus:border-gray-400 dark:focus:text-gray-700"
                          name="country"
                          id="country"
                          value={country}
                          onChange={handleOnChange}
                          required
                        >
                          <option value="" disabled>
                            Select a country
                          </option>
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

                      <div className="w-full px-3 mt-5">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="state"
                        >
                          State
                        </label>
                        <select
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:focus:bg-black focus:border-gray-500"
                          name="state"
                          id="state"
                          value={state}
                          onChange={handleOnChange}
                          placeholder="Select a state"
                          required
                        >
                          <option value="" disabled>
                            Select a state
                          </option>
                          {states.map((state) => (
                            <option key={state.isoCode} value={state.isoCode}>
                              {state.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full px-3 mt-5">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="city"
                        >
                          City
                        </label>
                        <select
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:focus:bg-black focus:border-gray-500"
                          name="city"
                          id="city"
                          value={city}
                          onChange={handleOnChange}
                          placeholder="Select a city"
                          required
                        >
                          <option value="" disabled>
                            Select a city
                          </option>
                          {cities.map((city) => (
                            <option key={city.name} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full px-3 mt-5">
                        <label
                          className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                          htmlFor="zip_code"
                        >
                          Zip Code
                        </label>
                        <input
                          className="appearance-none block w-full bg-gray-200 dark:bg-black/30 text-gray-700 dark:text-[#f5f5f5] border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-black focus:border-gray-500"
                          name="zip_code"
                          id="zip_code"
                          type="text"
                          placeholder="Zip Code"
                          value={zip_code}
                          onChange={handleOnChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center mt-4">
                      <button
                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                        onClick={UpdateProfile}
                      >
                        Save
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
}
