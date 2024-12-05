import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { IoClose } from "react-icons/io5";
import Loader from "./Loader";
export default function ProfilePopup() {
  const {
    isProfilePopupOpen,
    isDarkMode,
    setIsProfilePopupOpen,
    setIsVendorFormOpen,
  } = useContext(authContext);
  const [cookies, removeCookie] = useCookies([]);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  function closeModal() {
    setIsProfilePopupOpen(false);
  }

  let [profile, setProfile] = useState({
    customer_phone: "",
    customer_profile_picture: null,
    date_registered: "",
    email: "",
    first_name: "",
    id: "",
    is_active: true,
    last_name: "",
    addresses: [],
    is_vendor: false,
  });

  const {
    customer_phone,
    customer_profile_picture,
    date_registered,
    email,
    first_name,
    id,
    is_active,
    last_name,
    addresses,
    is_vendor,
  } = profile;

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value,
    });
  };

  const handleAddressChange = (e, index) => {
    const { name, value } = e.target;
    const updatedAddresses = addresses.map((address, i) =>
      i === index ? { ...address, [name]: value } : address
    );
    setProfile({ ...profile, addresses: updatedAddresses });
  };

  const addAddressField = () => {
    setProfile({
      ...profile,
      addresses: [
        ...addresses,
        {
          street1: "",
          street2: "",
          city: "",
          state: "",
          country: "",
          zip_code: "",
        },
      ],
    });
  };

  const removeAddressField = (index) => {
    const updatedAddresses = addresses.filter((_, i) => i !== index);
    setProfile({ ...profile, addresses: updatedAddresses });
  };

  const GetProfile = async () => {
    if (!cookies.token) {
      navigate("/signin");
    }
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/customer/profile/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((response) => {
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
    if (!cookies.token) {
      navigate("/signin");
      return;
    }
    try {
      setIsLoading(true); // Start loader
      console.log(profile);

      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/customer/update-profile/`,
        {
          customer_phone,
          customer_profile_picture,
          first_name,
          last_name,
          // addresses,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Profile updated successfully", {
          position: "top-center",
        });
        GetProfile();
      }
    } catch (error) {
      console.error(error);
      toast.error(
        "Failed to update profile. Please fill the details correctly.",
        {
          position: "top-center",
        }
      );
    } finally {
      setIsLoading(false); // Stop loader
    }
  };

  return (
    <>
<div
  className={`fixed inset-0 z-[9999] flex items-center justify-center ${isLoading ? "visible" : "hidden"}`}
>
  {isLoading && <Loader />}
</div>

      <Transition appear show={isProfilePopupOpen} as={Fragment}>
        <Dialog
          as="div"
          className={`relative ${isDarkMode && "dark"} z-0`}
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-[#0e0a1a] p-6 text-left align-middle shadow-xl transition-all relative">
                  <Dialog.Title
                    as="h3"
                    className="text-lg mb-7 font-medium leading-6 text-gray-900 dark:text-[#f5f5f5]"
                  >
                    My Profile
                    <span className="font-medium text-sm text-black/90 w-full block sm:inline-block -mb-3 sm:mb-0 sm:w-fit sm:ml-3 dark:text-[#f5f5f5]">
                      <span className="text-black/60 font-normal dark:text-[#f5f5f5]">
                        Registered on:{" "}
                      </span>
                      {new Date(profile.date_registered).toDateString()}
                    </span>
                    <IoClose
                      className="absolute top-2 right-3 cursor-pointer"
                      onClick={closeModal}
                    />
                  </Dialog.Title>
                  <div className="flex justify-center mb-6">
                    <img
                      src={
                        customer_profile_picture ||
                        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"
                      }
                      alt="Profile"
                      className="w-24 h-24 rounded-full mb-4"
                    />
                  </div>
                  <form onSubmit={UpdateProfile} className="w-full max-w-lg">
                    <div className="w-full px-3 mb-6">
                      <label
                        className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                        htmlFor="first_name"
                      >
                        First Name
                      </label>
                      <input
                        className="appearance-none block w-full bg-gray-200 dark:bg-[#FFFFFF0D] text-gray-700 dark:text-[#f5f5f5] rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-gray-900 focus:border-gray-500 border-none"
                        name="first_name"
                        id="first_name"
                        type="text"
                        placeholder="First Name"
                        value={first_name}
                        onChange={handleOnChange}
                        required
                      />
                    </div>
                    <div className="w-full px-3 mb-6">
                      <label
                        className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                        htmlFor="last_name"
                      >
                        Last Name
                      </label>
                      <input
                        className="appearance-none block w-full bg-gray-200 dark:bg-[#FFFFFF0D] text-gray-700 dark:text-[#f5f5f5] rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-gray-900 focus:border-gray-500 border-none"
                        name="last_name"
                        id="last_name"
                        type="text"
                        placeholder="Last Name"
                        value={last_name}
                        onChange={handleOnChange}
                        required
                      />
                    </div>
                    <div className="w-full px-3 mb-6">
                      <label
                        className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                        htmlFor="customer_phone"
                      >
                        Phone Number
                      </label>
                      <input
                        className="appearance-none block w-full bg-gray-200 dark:bg-[#FFFFFF0D] text-gray-700 dark:text-[#f5f5f5] rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-gray-900 focus:border-gray-500 border-none"
                        id="customer_phone"
                        name="customer_phone"
                        type="text"
                        placeholder="Phone Number"
                        value={customer_phone}
                        onChange={handleOnChange}
                        required
                      />
                    </div>
                    {/* <div className="w-full px-3 mb-6">
                      {addresses.map((address, index) => (
                        <div key={index} className="rounded-lg p-3 mb-3">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold">
                              Address {index + 1}
                            </label>
                            {index > 0 && (
                              <button
                                type="button"
                                className="text-red-600 ml-2"
                                onClick={() => removeAddressField(index)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <div className="w-full mb-3">
                            <label
                              className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                              htmlFor={`street1_${index}`}
                            >
                              Street Address 1
                            </label>
                            <input
                              className="appearance-none block w-full bg-gray-200 dark:bg-[#FFFFFF0D] text-gray-700 dark:text-[#f5f5f5] rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-gray-900 focus:border-gray-500 border-none"
                              id={`street1_${index}`}
                              name="street1"
                              type="text"
                              placeholder="Street Address 1"
                              value={address.street1}
                              onChange={(e) => handleAddressChange(e, index)}
                              required
                            />
                          </div>
                          <div className="w-full mb-3">
                            <label
                              className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                              htmlFor={`street2_${index}`}
                            >
                              Street Address 2
                            </label>
                            <input
                              className="appearance-none block w-full bg-gray-200 dark:bg-[#FFFFFF0D] text-gray-700 dark:text-[#f5f5f5] rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-gray-900 focus:border-gray-500 border-none"
                              id={`street2_${index}`}
                              name="street2"
                              type="text"
                              placeholder="Street Address 2"
                              value={address.street2}
                              onChange={(e) => handleAddressChange(e, index)}
                              required
                            />
                          </div>
                          <div className="w-full mb-3">
                            <label
                              className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                              htmlFor={`city_${index}`}
                            >
                              City
                            </label>
                            <input
                              className="appearance-none block w-full bg-gray-200 dark:bg-[#FFFFFF0D] text-gray-700 dark:text-[#f5f5f5] rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-gray-900 focus:border-gray-500 border-none"
                              id={`city_${index}`}
                              name="city"
                              type="text"
                              placeholder="City"
                              value={address.city}
                              onChange={(e) => handleAddressChange(e, index)}
                              required
                            />
                          </div>
                          <div className="w-full mb-3">
                            <label
                              className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                              htmlFor={`state_${index}`}
                            >
                              State
                            </label>
                            <input
                              className="appearance-none block w-full bg-gray-200 dark:bg-[#FFFFFF0D] text-gray-700 dark:text-[#f5f5f5] rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-gray-900 focus:border-gray-500 border-none"
                              id={`state_${index}`}
                              name="state"
                              type="text"
                              placeholder="State"
                              value={address.state}
                              onChange={(e) => handleAddressChange(e, index)}
                              required
                            />
                          </div>
                          <div className="w-full mb-3">
                            <label
                              className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                              htmlFor={`country_${index}`}
                            >
                              Country
                            </label>
                            <input
                              className="appearance-none block w-full bg-gray-200 dark:bg-[#FFFFFF0D] text-gray-700 dark:text-[#f5f5f5] rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-gray-900 focus:border-gray-500 border-none"
                              id={`country_${index}`}
                              name="country"
                              type="text"
                              placeholder="Country"
                              value={address.country}
                              onChange={(e) => handleAddressChange(e, index)}
                              required
                            />
                          </div>
                          <div className="w-full mb-3">
                            <label
                              className="block uppercase tracking-wide text-gray-700 dark:text-[#f5f5f5] text-xs font-bold mb-2"
                              htmlFor={`zip_code_${index}`}
                            >
                              ZIP Code
                            </label>
                            <input
                              className="appearance-none block w-full bg-gray-200 dark:bg-[#FFFFFF0D] text-gray-700 dark:text-[#f5f5f5] rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white dark:bg-gray-900 focus:border-gray-500 border-none"
                              id={`zip_code_${index}`}
                              name="zip_code"
                              type="text"
                              placeholder="ZIP Code"
                              value={address.zip_code}
                              onChange={(e) => handleAddressChange(e, index)}
                              required
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="bg-gradient-to-r from-[#6D00FB] to-[#9747FF] text-white font-bold py-2 px-4 rounded"
                        onClick={addAddressField}
                      >
                        Add New Address
                      </button>
                    </div> */}
                    <div className="flex items-center justify-between">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-[#6D00FB] to-[#9747FF] text-white font-bold py-2 px-4 rounded"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className="bg-gradient-to-r from-[#6D00FB] to-[#9747FF] text-white font-bold py-2 px-4 rounded"
                        onClick={closeModal}
                      >
                        Cancel
                      </button>
                    </div>
                    {!is_vendor && (
                      <div className="w-full mt-4">
                        <button
                          type="button"
                          className="bg-gradient-to-r from-[#6D00FB] to-[#9747FF] text-white font-bold py-2 px-4 rounded w-full"
                          onClick={() => {
                            setIsVendorFormOpen(true);
                            setIsProfilePopupOpen(false);
                          }}
                        >
                          Become a vendor
                        </button>
                      </div>
                    )}
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
