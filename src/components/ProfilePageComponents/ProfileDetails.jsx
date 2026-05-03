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

            <div className="w-full max-w-5xl mx-auto space-y-8 pb-20">
                {/* Header Section - Clean Modern */}
                <div className="bg-[#15161A] border border-white/5 p-10 md:p-12 rounded-[2rem] shadow-2xl flex flex-col md:flex-row items-center gap-10 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full"></div>
                    
                    <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-full blur opacity-20"></div>
                        <div className="relative w-36 h-36 md:w-44 md:h-44 overflow-hidden rounded-full border-4 border-[#0E0F13] shadow-2xl">
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

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.3em]">Official Profile</p>
                            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
                                {first_name} <span className="text-purple-500">{last_name}</span>
                            </h2>
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <span className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                Joined {new Date(profile.date_registered).getFullYear()}
                            </span>
                            <span className="px-5 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold uppercase tracking-widest text-purple-400">
                                {is_vendor ? 'Verified Vendor' : 'Customer'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Section - Clean Modern */}
                <div className="bg-[#15161A] border border-white/5 p-10 md:p-14 rounded-[2.5rem] shadow-2xl">
                    <form onSubmit={UpdateProfile} className="space-y-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                                    First Name
                                </label>
                                <input
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white font-bold outline-none focus:bg-white/10 focus:border-purple-500/50 transition-all duration-300 placeholder:text-white/10"
                                    name="first_name"
                                    type="text"
                                    placeholder="First Name"
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
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white font-bold outline-none focus:bg-white/10 focus:border-purple-500/50 transition-all duration-300 placeholder:text-white/10"
                                    name="last_name"
                                    type="text"
                                    placeholder="Last Name"
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
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white font-bold outline-none focus:bg-white/10 focus:border-purple-500/50 transition-all duration-300 placeholder:text-white/10"
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
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-1">
                                        Your Store Link
                                    </label>
                                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl py-5 px-8 group hover:border-purple-500/30 transition-all duration-300">
                                        <a
                                            href={storeUrl(profile.vendor.slug)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 text-purple-400 font-bold text-sm truncate hover:text-purple-300 transition-colors"
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

                        <div className="pt-10 flex flex-col sm:flex-row items-center gap-6">
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-12 py-5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-black rounded-2xl transition-all duration-300 uppercase tracking-widest text-xs shadow-xl shadow-purple-500/20 active:scale-95"
                            >
                                Save Changes
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="w-full sm:w-auto px-12 py-5 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white font-black rounded-2xl transition-all duration-300 uppercase tracking-widest text-xs active:scale-95"
                            >
                                Go Back
                            </button>
                        </div>
                    </form>
                </div>

                {!profile.is_vendor && (
                    <div className="bg-[#15161A] border border-purple-500/10 p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="space-y-3 text-center md:text-left">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Start Selling Premium</h3>
                            <p className="text-gray-500 text-sm font-medium">Join our elite network of vendors and reach global customers.</p>
                        </div>
                        <button
                            type="button"
                            className="px-10 py-5 bg-white text-black font-black rounded-2xl transition-all duration-300 uppercase tracking-widest text-xs hover:bg-gray-200 active:scale-95"
                            onClick={() => {}}
                        >
                            Become a Vendor
                        </button>
                    </div>
                )}
            </div>
        </>
    );

}
