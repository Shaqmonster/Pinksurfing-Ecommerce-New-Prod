import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { authContext } from "../../context/authContext";
import { useNavigate } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { toast } from "react-toastify";
import { IoClose } from "react-icons/io5";
import Loader from "../Loader";
import { FaEdit, FaCopy, FaCheck } from 'react-icons/fa';

export default function ProfileDetails() {
    const [isEditing, setIsEditing] = useState(false);
    const [copied, setCopied] = useState(false);

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


    const [formData, setFormData] = useState({
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        customer_phone: profile?.customer_phone || "",
    });

    const handleEdit = () => setIsEditing(true);
    const handleSave = (e) => {
        e.preventDefault();
        UpdateProfile(formData);
        setIsEditing(false);
    };

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
                setProfile(response.data);
                console.log(response.data);
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
                        Authorization: `Bearer ${cookies.access_token}`,
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



    const toggleEdit = () => {
        setIsEditing(!isEditing);
    };

    const handleCopyStoreLink = () => {
        const storeUrl = `https://pinksurfing.com/store/${profile?.vendor?.slug}`;
        navigator.clipboard.writeText(storeUrl).then(() => {
            setCopied(true);
            setTimeout(() => {
                setCopied(false);
            }, 3000);
        });
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-[9999] flex items-center justify-center ${isLoading ? "visible" : "hidden"}`}
            >
                {isLoading && <Loader />}
            </div>

            <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 sm:p-6 font-sen border border-gray-500  rounded-lg  ">
                <div className="w-full  mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white text-center ">My Profile</h2>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    <span className="font-normal">Registered on: </span>
                    <span className="font-medium">{new Date(profile.date_registered).toDateString()}</span>
                </div>

                <div className="flex items-center justify-center w-full mb-8">
                    <div className="relative w-24 h-24 overflow-hidden rounded-full border-2 border-gray-200 dark:border-gray-700 shadow-md">
                        <img
                            src={
                                profile.customer_profile_picture ||
                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"
                            }
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <form onSubmit={UpdateProfile} className="w-full space-y-6">
                    <div className="flex flex-col w-full">
                        <label
                            className="block text-xs font-bold uppercase text-center tracking-wider text-gray-700 dark:text-gray-300 mb-2"
                            htmlFor="first_name"
                        >
                            First Name
                        </label>
                        <input
                            className="w-full sm:w-3/4 mx-auto appearance-none bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                            name="first_name"
                            id="first_name"
                            type="text"
                            placeholder="First Name"
                            value={first_name}
                            onChange={handleOnChange}
                            required
                        />
                    </div>

                    <div className="flex flex-col w-full">
                        <label
                            className="block text-xs font-bold uppercase text-center tracking-wider text-gray-700 dark:text-gray-300 mb-2"
                            htmlFor="last_name"
                        >
                            Last Name
                        </label>
                        <input
                            className="w-full sm:w-3/4 mx-auto appearance-none bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                            name="last_name"
                            id="last_name"
                            type="text"
                            placeholder="Last Name"
                            value={last_name}
                            onChange={handleOnChange}
                            required
                        />
                    </div>

                    <div className="flex flex-col w-full">
                        <label
                            className="block text-xs font-bold uppercase text-center tracking-wider text-gray-700 dark:text-gray-300 mb-2"
                            htmlFor="customer_phone"
                        >
                            Phone Number
                        </label>
                        <input
                            className="w-full sm:w-3/4 mx-auto appearance-none bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition duration-200"
                            id="customer_phone"
                            name="customer_phone"
                            type="text"
                            placeholder="Phone Number"
                            value={customer_phone}
                            onChange={handleOnChange}
                            required
                        />
                    </div>

                    {/* Store Link - Only show if vendor slug exists */}
                    {profile?.vendor?.slug && (
                        <div className="flex flex-col w-full">
                            <label
                                className="block text-xs font-bold uppercase text-center tracking-wider text-gray-700 dark:text-gray-300 mb-2"
                            >
                                Your Store Link
                            </label>
                            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">
                                You can use this as a clickable link to your store.
                            </p>
                            <div className="w-full sm:w-3/4 mx-auto flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-3 px-4">
                                <a
                                    href={`https://pinksurfing.com/store/${profile.vendor.slug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium text-sm break-all transition duration-200"
                                >
                                    pinksurfing.com/store/{profile.vendor.slug}
                                </a>
                                <button
                                    type="button"
                                    onClick={handleCopyStoreLink}
                                    className="flex-shrink-0 p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition duration-200"
                                    title={copied ? "Copied!" : "Copy to clipboard"}
                                >
                                    {copied ? (
                                        <FaCheck className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <FaCopy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                        <button
                            type="submit"
                            className="w-full sm:w-auto bg-gradient-to-r from-[#6D00FB] to-[#9747FF] hover:from-[#5C00D6] hover:to-[#8639E8] text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:-translate-y-1"
                        >
                            Save Changes
                        </button>
                        <button
                            type="button"
                            className="w-full sm:w-auto bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:-translate-y-1"
                            onClick={toggleEdit}
                        >
                            Cancel
                        </button>
                    </div>
                </form>

                {!profile.is_vendor && (
                    <div className="w-full mt-8">
                        <button
                            type="button"
                            className="w-full sm:w-3/4 mx-auto bg-gradient-to-r from-[#6D00FB] to-[#9747FF] hover:from-[#5C00D6] hover:to-[#8639E8] text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:-translate-y-1 flex items-center justify-center"
                            onClick={() => {
                                // You'll need to implement this function
                                // setIsVendorFormOpen(true);
                                // setIsProfilePopupOpen(false);
                            }}
                        >
                            <span>Become a vendor</span>
                        </button>
                    </div>
                )}
            </div>

        </>
    );
}
