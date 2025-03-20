import React from "react";

const OrderDetails = () => {
    return (
        <div className="flex-1 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button className="mr-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-lg font-medium">ORDER DETAILS</h1>
                </div>
                <div className="flex items-center">
                    <span className="text-yellow-500 mr-2">Leave a Rating</span>
                    <button className="bg-yellow-500 text-black rounded-full w-6 h-6 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Order Info Card */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold">#96459761</h2>
                        <p className="text-sm text-gray-400">4 Products • Order Placed on 17 Jun, 2021 at 7:30 PM</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-blue-400">$1199.00</p>
                    </div>
                </div>
                <p className="text-sm text-gray-400 mb-4">Order exported on 29 Jun, 2021</p>

                {/* Order Progress */}
                <div className="relative pt-4 pb-8">
                    <div className="h-1 bg-gray-600 rounded-full mb-4">
                        <div className="h-1 bg-orange-500 rounded-full w-3/4"></div>
                    </div>
                    <div className="flex justify-between">
                        <div className="flex flex-col items-center">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mb-2">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-400">Order Placed</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mb-2">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-400">Packaging</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center mb-2">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-400">On the Road</span>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center mb-2">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <span className="text-xs text-gray-400">Delivered</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Activity */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Order Activity</h2>
                <div className="space-y-4">
                    <div className="flex items-start">
                        <div className="bg-green-100 w-8 h-8 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm">Your order has been delivered. Thank you for shopping at Olizee!</p>
                            <p className="text-xs text-gray-500">23 Jun, 2021 at 7:53 PM</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="bg-green-100 w-8 h-8 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm">Our delivery man Hans Nick has picked up your order for delivery.</p>
                            <p className="text-xs text-gray-500">23 Jun, 2021 at 2:05 PM</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="bg-green-100 w-8 h-8 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm">Your order has reached at our city hub.</p>
                            <p className="text-xs text-gray-500">22 Jun, 2021 at 8:20 AM</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="bg-green-100 w-8 h-8 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm">Your order is on the way to city hub.</p>
                            <p className="text-xs text-gray-500">21 Jun, 2021 at 5:42 AM</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="bg-green-100 w-8 h-8 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm">Your order is successfully verified.</p>
                            <p className="text-xs text-gray-500">20 Jun, 2021 at 7:30 PM</p>
                        </div>
                    </div>

                    <div className="flex items-start">
                        <div className="bg-green-100 w-8 h-8 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm">Your order has been confirmed.</p>
                            <p className="text-xs text-gray-500">19 Jun, 2021 at 3:21 PM</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product List */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Product (02)</h2>
                <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-900">
                            <tr>
                                <th className="py-3 px-4 text-left text-sm font-semibold">PRODUCTS</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">PRICE</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">QUANTITY</th>
                                <th className="py-3 px-4 text-left text-sm font-semibold">SUB TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-gray-700">
                                <td className="py-4 px-4">
                                    <div className="flex items-center">
                                        <img src="/api/placeholder/60/60" alt="Product" className="w-12 h-12 object-cover rounded mr-4" />
                                        <div>
                                            <p className="font-medium">Google Pixel 6 Pro - 5G Android Phone - Unlocked Smartphone with Advanced Pixel Camera</p>
                                            <p className="text-gray-400 text-sm">ELECTRONICS</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">$899</td>
                                <td className="py-4 px-4">x1</td>
                                <td className="py-4 px-4">$899</td>
                            </tr>
                            <tr>
                                <td className="py-4 px-4">
                                    <div className="flex items-center">
                                        <img src="/api/placeholder/60/60" alt="Product" className="w-12 h-12 object-cover rounded mr-4" />
                                        <div>
                                            <p className="font-medium">PZOZ Eco Clear for Google Pixel 6 Pro - Crystal Clear Phone Case with Soft Mode</p>
                                            <p className="text-gray-400 text-sm">ACCESSORIES</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-4">$30</td>
                                <td className="py-4 px-4">x1</td>
                                <td className="py-4 px-4">$30</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Billing and Shipping */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Billing Address</h2>
                    <div className="mb-4">
                        <p className="font-medium">Kevin Gilbert</p>
                        <p className="text-sm text-gray-400">House #14, Street #14, Sector A, Road #07, Dhaka-1216, House #14, Street #14, Sector A, Road #07, Dhaka-1216, Bangladesh</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-sm font-medium">Phone Number: <span className="text-gray-400">+880-1956-1918</span></p>
                    </div>
                    <div>
                        <p className="text-sm font-medium">Email: <span className="text-gray-400">kevin.g@gmail.com</span></p>
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
                    <div className="mb-4">
                        <p className="font-medium">Kevin Gilbert</p>
                        <p className="text-sm text-gray-400">House #14, Street #14, Sector A, Road #07, Dhaka-1216, House #14, Street #14, Sector A, Road #07, Dhaka-1216, Bangladesh</p>
                    </div>
                    <div className="mb-4">
                        <p className="text-sm font-medium">Phone Number: <span className="text-gray-400">+880-1956-1918</span></p>
                    </div>
                    <div>
                        <p className="text-sm font-medium">Email: <span className="text-gray-400">kevin.g@gmail.com</span></p>
                    </div>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                    <h2 className="text-lg font-semibold mb-4">Order Notes</h2>
                    <p className="text-sm text-gray-400">Dolor sit, amet consectetur adipisicing elit. Hic, quae necessi tatibus! Aliquam erat voluptae. Adipisci qui molestiae. Aliquam erat volutpat.</p>
                </div>
            </div>
        </div>
    );
};

export default OrderDetails;
