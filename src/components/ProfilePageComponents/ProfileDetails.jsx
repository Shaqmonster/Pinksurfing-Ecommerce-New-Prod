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
import { storeUrl, STOREFRONT_BASE } from "../../utils/envUrls";

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
        const url = storeUrl(profile?.vendor?.slug);
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
        });
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-[9999] flex items-center justify-center ${isLoading ? "visible" : "hidden"}`}
            >
                {isLoading && <Loader />}
            </div>

            <div className="w-full max-w-4xl mx-auto space-y-12 pb-12">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row items-center gap-8 bg-white/5 backdrop-blur-xl border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[80px] rounded-full group-hover:bg-purple-500/20 transition-all duration-700"></div>
                    
                    <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative w-32 h-32 md:w-40 md:h-40 overflow-hidden rounded-full border-4 border-[#0E0F13] shadow-2xl">
                            <img
                                src={
                                    profile.customer_profile_picture ||
                                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"
                                }
                                alt="Profile"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase">
                            {first_name} {last_name}
                        </h2>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Member since {new Date(profile.date_registered).getFullYear()}
                            </span>
                            <span className="px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-400">
                                {is_vendor ? 'Vendor' : 'Customer'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Section */}
                <div className="bg-[#0E0F13] border border-white/5 p-8 md:p-12 rounded-[2rem] shadow-2xl">
                    <form onSubmit={UpdateProfile} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                                    First Name
                                </label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder:text-white/20"
                                    name="first_name"
                                    type="text"
                                    placeholder="Enter your first name"
                                    value={first_name}
                                    onChange={handleOnChange}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                                    Last Name
                                </label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder:text-white/20"
                                    name="last_name"
                                    type="text"
                                    placeholder="Enter your last name"
                                    value={last_name}
                                    onChange={handleOnChange}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                                    Phone Number
                                </label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 placeholder:text-white/20"
                                    id="customer_phone"
                                    name="customer_phone"
                                    type="text"
                                    placeholder="Enter your phone number"
                                    value={customer_phone}
                                    onChange={handleOnChange}
                                    required
                                />
                            </div>

                            {/* Store Link Section */}
                            {profile?.vendor?.slug && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                                        Your Store Link
                                    </label>
                                    <div className="flex items-center gap-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl py-4 px-6 group transition-all duration-300 hover:border-purple-500/30">
                                        <a
                                            href={storeUrl(profile.vendor.slug)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 text-purple-400 font-bold text-sm truncate"
                                        >
                                            {STOREFRONT_BASE.replace("https://", "")}/store/{profile.vendor.slug}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={handleCopyStoreLink}
                                            className="p-2 text-gray-500 hover:text-white transition-colors"
                                        >
                                            {copied ? <FaCheck className="w-4 h-4 text-green-500" /> : <FaCopy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-10 flex flex-col sm:flex-row items-center gap-4">
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black rounded-2xl shadow-2xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] transition-all duration-300 uppercase tracking-widest text-xs"
                            >
                                Save Profile Changes
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-full sm:w-auto px-10 py-5 bg-white/5 text-gray-400 font-bold rounded-2xl hover:bg-white/10 hover:text-white transition-all duration-300 uppercase tracking-widest text-xs"
                            >
                                Go Back
                            </button>
                        </div>
                    </form>
                </div>

                {!profile.is_vendor && (
                    <div className="bg-gradient-to-r from-purple-900/20 to-transparent border border-purple-500/20 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-bold text-white">Want to start selling?</h3>
                            <p className="text-gray-500 text-sm">Join our network of vendors and reach thousands of customers.</p>
                        </div>
                        <button
                            type="button"
                            className="px-8 py-4 bg-white text-[#0E0F13] font-black rounded-xl hover:bg-gray-200 transition-all duration-300 uppercase tracking-widest text-xs"
                            onClick={() => {
                                // Implement vendor navigation
                            }}
                        >
                            Become a Vendor
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
