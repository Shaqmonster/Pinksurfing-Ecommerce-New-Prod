import React from "react";

const OrderDetails = () => {
    return (
        <div className="min-h-screen bg-[#0E0F13] border border-[#E4E7E9] rounded text-white px-4 md:px-4 lg:px-4">
            <div className="flex border-b border-[#E4E7E9] w-full p-2">
                <p className="s">Order Details</p>
                <div className="flex-1"></div>
                <button className=" text-[#FA8232]  rounded">
                    Download Invoice
                </button>
            </div>
            <div className="max-w-5xl mx-auto bg-[#0E0F13]   rounded-2xl shadow-lg p-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border border-[#9747FF] p-4">
                    <div>
                        <p className="text-gray-400">#96459761</p>
                        <p className="text-sm text-gray-500 mt-1">
                            4 Products • Order Placed on 17 Jan, 2021 at 7:32 PM
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <h2 className="text-3xl font-bold text-orange-400">$1199.00</h2>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <h3 className="text-gray-400 text-sm">Order expected arrival 23 Jan, 2021</h3>
                    <div className="flex items-center mt-4">
                        <div className="flex-1 flex items-center gap-4">
                            <div className="bg-orange-400 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold">
                                ✓
                            </div>
                            <div className="h-1 flex-1 bg-orange-400"></div>
                        </div>
                        <div className="flex-1 flex items-center gap-4">
                            <div className="bg-orange-400 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold">
                                ✓
                            </div>
                            <div className="h-1 flex-1 bg-orange-400"></div>
                        </div>
                        <div className="flex-1 flex items-center gap-4">
                            <div className="bg-orange-400 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold">
                                ✓
                            </div>
                            <div className="h-1 flex-1 bg-gray-600"></div>
                        </div>
                        <div className="bg-gray-600 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold">
                            ✓
                        </div>
                    </div>
                </div>

                {/* Product List */}
                <div className="mt-6">
                    <h3 className="text-xl font-bold">Product(s)</h3>
                    <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img
                                    src="https://via.placeholder.com/50"
                                    alt="Smartphone"
                                    className="h-16 w-16 object-cover rounded-lg"
                                />
                                <div>
                                    <h4 className="font-bold">Google Pixel 6 Pro - 5G Android Phone</h4>
                                    <p className="text-gray-500 text-sm">Unlocked Smartphone with Advanced Pixel Camera</p>
                                </div>
                            </div>
                            <div>
                                <p className="font-bold">$899</p>
                                <p className="text-sm text-gray-500">Quantity: 1</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img
                                    src="https://via.placeholder.com/50"
                                    alt="Case"
                                    className="h-16 w-16 object-cover rounded-lg"
                                />
                                <div>
                                    <h4 className="font-bold">Tech21 Evo Clear for Google Pixel 6 Pro</h4>
                                    <p className="text-gray-500 text-sm">
                                        Crystal Clear Phone Case with 12ft Multi-Drop Protection
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="font-bold">$39</p>
                                <p className="text-sm text-gray-500">Quantity: 1</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Billing and Shipping Address */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-xl font-bold">Billing Address</h3>
                        <p className="mt-2 text-sm">
                            Kevin Gilbert<br />
                            East Tejturi Bazar, Word No. 04, Road No. 13/A, House no. 1320/C, Flat No. 5D, Dhaka-1200, Bangladesh<br />
                            Phone Number: +1-202-555-0118
                        </p>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Shipping Address</h3>
                        <p className="mt-2 text-sm">
                            Kevin Gilbert<br />
                            East Tejturi Bazar, Word No. 04, Road No. 13/A, House no. 1320/C, Flat No. 5D, Dhaka-1200, Bangladesh<br />
                            Phone Number: +1-202-555-0118
                        </p>
                    </div>
                </div>

                {/* Order Notes */}
                <div className="mt-6">
                    <h3 className="text-xl font-bold">Order Notes</h3>
                    <p className="mt-2 text-sm text-gray-400">
                        Donec ac vehicula turpis. Aenean sagittis est eu arcu ornare, eget venenatis purus
                        lobortis. Aliquam erat volutpat. Aliquam magna odio.
                    </p>
                </div>

                {/* Leave a Rating */}
                <div className="mt-8 flex justify-end">
                    <button className="px-6 py-2 bg-orange-500 hover:bg-orange-600 rounded-full text-white font-bold">
                        Leave a Rating
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
