import { Dialog, Transition } from "@headlessui/react";
import { Fragment, useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
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

    const [initialData, setInitialData] = useState(null);

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
                setInitialData(response.data);
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

            <div className="w-full max-w-6xl mx-auto space-y-12 pb-32">
                {/* Header Section - Statement Glass */}
                <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-12 md:p-16 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center gap-12 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none"></div>
                    
                    <div className="relative">
                        <div className="relative w-44 h-44 md:w-52 md:h-52 overflow-hidden rounded-full border-[6px] border-white/5 shadow-2xl">
                            <img
                                src={
                                    profile.customer_profile_picture ||
                                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"
                                }
                                alt="Profile"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-6xl md:text-7xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                                {first_name} <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-purple-500/50">
                                    {last_name}
                                </span>
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <div className="px-6 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                                Joined {new Date(profile.date_registered).getFullYear()}
                            </div>
                            <div className="px-6 py-2.5 rounded-2xl bg-purple-600/20 border border-purple-500/20 text-[10px] font-black uppercase tracking-widest text-purple-300">
                                {is_vendor ? 'Official Vendor' : 'Verified Profile'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Section - Clean Minimalist */}
                <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 p-12 md:p-20 rounded-[3.5rem] shadow-2xl">
                    <form onSubmit={UpdateProfile} className="space-y-16">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">
                                    Identity / First Name
                                </label>
                                <input
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-6 px-10 text-white font-bold text-lg outline-none focus:bg-white/[0.06] focus:border-purple-500/40 transition-all duration-500 placeholder:text-white/5"
                                    name="first_name"
                                    type="text"
                                    placeholder="First Name"
                                    value={first_name}
                                    onChange={handleOnChange}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">
                                    Identity / Last Name
                                </label>
                                <input
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-6 px-10 text-white font-bold text-lg outline-none focus:bg-white/[0.06] focus:border-purple-500/40 transition-all duration-500 placeholder:text-white/5"
                                    name="last_name"
                                    type="text"
                                    placeholder="Last Name"
                                    value={last_name}
                                    onChange={handleOnChange}
                                    required
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">
                                    Secure Contact / Phone
                                </label>
                                <input
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-6 px-10 text-white font-bold text-lg outline-none focus:bg-white/[0.06] focus:border-purple-500/40 transition-all duration-500 placeholder:text-white/5"
                                    id="customer_phone"
                                    name="customer_phone"
                                    type="text"
                                    placeholder="Phone Number"
                                    value={customer_phone}
                                    onChange={handleOnChange}
                                    required
                                />
                            </div>

                            {/* Store Link Section */}
                            {profile?.vendor?.slug && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">
                                        Marketplace Presence
                                    </label>
                                    <div className="flex items-center gap-6 bg-white/[0.03] border border-white/5 rounded-2xl py-6 px-10 group hover:bg-white/[0.05] transition-all duration-500">
                                        <a
                                            href={storeUrl(profile.vendor.slug)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 text-purple-400 font-bold text-base truncate hover:text-purple-300 transition-colors"
                                        >
                                            {STOREFRONT_BASE.replace("https://", "")}/store/{profile.vendor.slug}
                                        </a>
                                        <button
                                            type="button"
                                            onClick={handleCopyStoreLink}
                                            className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                        >
                                            {copied ? <FaCheck className="w-5 h-5 text-green-500" /> : <FaCopy className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {initialData && JSON.stringify(profile) !== JSON.stringify(initialData) && (
                            <div className="pt-12 flex flex-col sm:flex-row items-center gap-8 border-t border-white/5 mt-12">
                                <motion.button
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full sm:w-auto px-16 py-6 bg-white text-black font-black rounded-2xl transition-all duration-500 uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-purple-50 active:bg-gray-200"
                                >
                                    Save Changes
                                </motion.button>
                            </div>
                        )}
                    </form>
                </div>

                {!profile.is_vendor && (
                    <div className="bg-gradient-to-r from-purple-600/10 via-transparent to-transparent border border-white/5 p-12 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="space-y-4 text-center md:text-left">
                            <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight">Elevate to Merchant Status</h3>
                            <p className="text-white/30 text-base font-medium max-w-md">Unlock specialized marketplace tools and reach our global community.</p>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            className="px-12 py-5 bg-purple-600 text-white font-black rounded-2xl transition-all duration-500 uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20"
                            onClick={() => {}}
                        >
                            Apply Now
                        </motion.button>
                    </div>
                )}
            </div>
        </>
    );

}
