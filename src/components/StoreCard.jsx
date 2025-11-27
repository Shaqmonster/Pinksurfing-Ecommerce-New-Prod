import React from 'react';
import { Link } from 'react-router-dom';

const StoreCard = ({ store }) => {
    const awsS3BaseUrl = "https://pinksurfing-ecom.s3.us-east-2.amazonaws.com/";

    const storeImage = store.store_image
        ? `${awsS3BaseUrl}${store.store_image}`
        : "https://media-cldnry.s-nbcnews.com/image/upload/t_nbcnews-fp-1024-512,f_auto,q_auto:best/newscms/2017_26/2053956/170627-better-grocery-store-main-se-539p.jpg";

    return (
        <Link to={`/store/${store.slug}`} className="block group">
            <div className="relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl">
                {/* Background Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 rounded-2xl opacity-0 group-hover:opacity-75 blur-xl transition-all duration-500 group-hover:duration-200 animate-gradient-xy"></div>

                {/* Card Container */}
                <div className="relative bg-white/10 dark:bg-white/5 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl overflow-hidden shadow-lg">
                    {/* Image Container */}
                    <div className="relative h-[200px] overflow-hidden">
                        <img
                            src={storeImage}
                            alt={store.store_name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>

                        {/* Floating Shine Effect */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </div>

                        {/* Store Badge */}
                        <div className="absolute top-3 right-3">
                            <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                                <span className="text-white text-xs font-medium">Store</span>
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="relative p-5">
                        {/* Glass Effect Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 dark:from-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm"></div>

                        {/* Content */}
                        <div className="relative z-10">
                            {/* Store Name */}
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">
                                {store.store_name}
                            </h3>

                            {/* Decorative Line */}
                            <div className="flex justify-center mb-3">
                                <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent group-hover:w-20 transition-all duration-500"></div>
                            </div>

                            {/* Visit Store Button */}
                            <div className="flex justify-center">
                                <div className="px-4 py-2 bg-gradient-to-r from-purple-600/80 to-pink-600/80 hover:from-purple-600 hover:to-pink-600 text-white text-sm font-medium rounded-full backdrop-blur-sm border border-white/20 shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all duration-300 transform group-hover:-translate-y-0.5">
                                    <span className="flex items-center gap-2">
                                        Visit Store
                                        <svg
                                            className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Glow */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"></div>
                </div>
            </div>
        </Link>
    );
};

export default StoreCard;
