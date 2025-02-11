import React, { useContext, useState } from "react";
import { authContext } from "../context/authContext"; // Adjust the import path accordingly
import Header from "../components/Header";
import { FaEdit, FaSave } from "react-icons/fa"; // Assuming you use FontAwesome for the edit and save icons

const ProfilePage = () => {
    const { user } = useContext(authContext);
    const [isEditingUser, setIsEditingUser] = useState(false); // State to control edit mode for user information
    const [isEditingPicture, setIsEditingPicture] = useState(false); // State to control edit mode for profile picture
    const [isEditingAddresses, setIsEditingAddresses] = useState([]); // State to control edit mode for each address
    const [editedUser, setEditedUser] = useState({ ...user }); // State to hold edited user data
    const [editedAddresses, setEditedAddresses] = useState(user?.addresses ? [...user.addresses] : []); // State to hold edited addresses

    const toggleEditUser = () => {
        setIsEditingUser((prevState) => !prevState); // Toggle edit mode for user information
    };

    const toggleEditPicture = () => {
        setIsEditingPicture((prevState) => !prevState); // Toggle edit mode for profile picture
    };

    const toggleEditAddress = (index) => {
        setIsEditingAddresses((prevState) =>
            prevState.includes(index)
                ? prevState.filter((i) => i !== index)
                : [...prevState, index]
        ); // Toggle edit mode for specific address
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedUser((prevUser) => ({
            ...prevUser,
            [name]: value,
        }));
    };

    const handleAddressChange = (index, e) => {
        const { name, value } = e.target;
        const updatedAddresses = editedAddresses.map((address, addrIndex) =>
            addrIndex === index ? { ...address, [name]: value } : address
        );
        setEditedAddresses(updatedAddresses);
    };

    return (
        <div className="bg-gray-100 dark:bg-black min-h-screen flex flex-col items-center py-8">

            <div className="mt-8 max-w-4xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                {/* Banner */}
                <div className="h-auto bg-blue-500 rounded-t-lg relative">
                    <img
                        src={
                            user.customer_profile_picture ||
                            "https://static.vecteezy.com/system/resources/thumbnails/002/292/582/small_2x/elegant-black-and-gold-banner-background-free-vector.jpg"
                        }
                        alt="Banner Picture"
                        className="w-full h-full object-cover rounded-t-lg opacity-50"
                    />
                    <div className="absolute bottom-4 left-4">
                        <img
                            src={
                                user.customer_profile_picture ||
                                "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIf4R5qPKHPNMyAqV-FjS_OTBB8pfUV29Phg&s"
                            }
                            alt="Profile Picture"
                            className="w-32 h-auto rounded-full border-4 border-white cursor-pointer"
                            onClick={toggleEditPicture}
                        />
                    </div>
                </div>

                {isEditingPicture && (
                    <div className="mt-4 flex flex-col items-center">
                        <label
                            htmlFor="profilePicture"
                            className="text-gray-900 dark:text-white mb-1"
                        >
                            Profile Picture URL
                        </label>
                        <input
                            type="text"
                            name="customer_profile_picture"
                            id="profilePicture"
                            value={editedUser.customer_profile_picture}
                            onChange={handleInputChange}
                            className="border-none outline-none py-2 px-3 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                )}

                {/* Profile Information */}
                <div className="p-4 relative">
                    <button
                        onClick={toggleEditUser}
                        className="absolute top-4 right-4 text-blue-500 cursor-pointer"
                    >
                        {isEditingUser ? <FaSave /> : <FaEdit />}
                    </button>
                    <div className="flex flex-col sm:flex-row sm:gap-4 mb-4">
                        <div className="flex flex-col mb-4 sm:mb-0 sm:w-1/2">
                            <label
                                htmlFor="firstName"
                                className="text-[13px] sm:text-[14.9px] text-gray-900 dark:text-white mb-1"
                            >
                                First Name
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                id="firstName"
                                value={editedUser.first_name}
                                onChange={handleInputChange}
                                disabled={!isEditingUser}
                                className={`border-none outline-none py-2 px-3 rounded-md ${isEditingUser
                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                        : "bg-transparent text-gray-500 dark:text-gray-400"
                                    }`}
                            />
                        </div>
                        <div className="flex flex-col sm:w-1/2">
                            <label
                                htmlFor="lastName"
                                className="text-[13px] sm:text-[14.9px] text-gray-900 dark:text-white mb-1"
                            >
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                id="lastName"
                                value={editedUser.last_name}
                                onChange={handleInputChange}
                                disabled={!isEditingUser}
                                className={`border-none outline-none py-2 px-3 rounded-md ${isEditingUser
                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                        : "bg-transparent text-gray-500 dark:text-gray-400"
                                    }`}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-4 mb-4">
                        <div className="flex flex-col mb-4 sm:mb-0 sm:w-1/2">
                            <label
                                htmlFor="email"
                                className="text-[13px] sm:text-[14.9px] text-gray-900 dark:text-white mb-1"
                            >
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                id="email"
                                value={editedUser.email}
                                onChange={handleInputChange}
                                disabled={!isEditingUser}
                                className={`border-none outline-none py-2 px-3 rounded-md ${isEditingUser
                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                        : "bg-transparent text-gray-500 dark:text-gray-400"
                                    }`}
                            />
                        </div>
                        <div className="flex flex-col sm:w-1/2">
                            <label
                                htmlFor="phone"
                                className="text-[13px] sm:text-[14.9px] text-gray-900 dark:text-white mb-1"
                            >
                                Phone
                            </label>
                            <input
                                type="tel"
                                name="customer_phone"
                                id="phone"
                                value={editedUser.customer_phone}
                                onChange={handleInputChange}
                                disabled={!isEditingUser}
                                className={`border-none outline-none py-2 px-3 rounded-md ${isEditingUser
                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                        : "bg-transparent text-gray-500 dark:text-gray-400"
                                    }`}
                            />
                        </div>
                    </div>
                    <div className="mt-8 max-w-4xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex flex-col space-y-4">
                            {editedAddresses.map((address, index) => (
                                <div
                                    key={index}
                                    className="p-4 mb-4 bg-gray-200 dark:bg-gray-700 rounded-md"
                                >
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-gray-900 dark:text-white">
                                            Address {index + 1}
                                        </h3>
                                        <button
                                            onClick={() => toggleEditAddress(index)}
                                            className="text-blue-500 cursor-pointer"
                                        >
                                            {isEditingAddresses.includes(index) ? (
                                                <FaSave />
                                            ) : (
                                                <FaEdit />
                                            )}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col mb-2">
                                            <label
                                                htmlFor={`street1-${index}`}
                                                className="text-gray-900 dark:text-white mb-1"
                                            >
                                                Street 1
                                            </label>
                                            <input
                                                type="text"
                                                name="street1"
                                                id={`street1-${index}`}
                                                value={address.street1}
                                                onChange={(e) => handleAddressChange(index, e)}
                                                disabled={!isEditingAddresses.includes(index)}
                                                className={`border py-2 px-3 rounded-md ${isEditingAddresses.includes(index)
                                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                                        : "text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex flex-col mb-2">
                                            <label
                                                htmlFor={`street2-${index}`}
                                                className="text-gray-900 dark:text-white mb-1"
                                            >
                                                Street 2
                                            </label>
                                            <input
                                                type="text"
                                                name="street2"
                                                id={`street2-${index}`}
                                                value={address.street2}
                                                onChange={(e) => handleAddressChange(index, e)}
                                                disabled={!isEditingAddresses.includes(index)}
                                                className={`border py-2 px-3 rounded-md ${isEditingAddresses.includes(index)
                                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                                        : "text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col mb-2">
                                            <label
                                                htmlFor={`city-${index}`}
                                                className="text-gray-900 dark:text-white mb-1"
                                            >
                                                City
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                id={`city-${index}`}
                                                value={address.city}
                                                onChange={(e) => handleAddressChange(index, e)}
                                                disabled={!isEditingAddresses.includes(index)}
                                                className={`border py-2 px-3 rounded-md ${isEditingAddresses.includes(index)
                                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                                        : "text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex flex-col mb-2">
                                            <label
                                                htmlFor={`state-${index}`}
                                                className="text-gray-900 dark:text-white mb-1"
                                            >
                                                State
                                            </label>
                                            <input
                                                type="text"
                                                name="state"
                                                id={`state-${index}`}
                                                value={address.state}
                                                onChange={(e) => handleAddressChange(index, e)}
                                                disabled={!isEditingAddresses.includes(index)}
                                                className={`border py-2 px-3 rounded-md ${isEditingAddresses.includes(index)
                                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                                        : "text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col mb-2">
                                            <label
                                                htmlFor={`country-${index}`}
                                                className="text-gray-900 dark:text-white mb-1"
                                            >
                                                Country
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                id={`country-${index}`}
                                                value={address.country}
                                                onChange={(e) => handleAddressChange(index, e)}
                                                disabled={!isEditingAddresses.includes(index)}
                                                className={`border py-2 px-3 rounded-md ${isEditingAddresses.includes(index)
                                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                                        : "text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                                                    }`}
                                            />
                                        </div>
                                        <div className="flex flex-col mb-2">
                                            <label
                                                htmlFor={`zip_code-${index}`}
                                                className="text-gray-900 dark:text-white mb-1"
                                            >
                                                Zip Code
                                            </label>
                                            <input
                                                type="text"
                                                name="zip_code"
                                                id={`zip_code-${index}`}
                                                value={address.zip_code}
                                                onChange={(e) => handleAddressChange(index, e)}
                                                disabled={!isEditingAddresses.includes(index)}
                                                className={`border py-2 px-3 rounded-md ${isEditingAddresses.includes(index)
                                                        ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
                                                        : "text-gray-900 dark:text-gray-400 bg-gray-100 dark:bg-gray-800"
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
