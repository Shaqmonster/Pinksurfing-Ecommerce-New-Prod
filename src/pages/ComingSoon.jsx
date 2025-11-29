import React from "react";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { authContext } from "../context/authContext";
import SearchForm from "../components/Search";

export default function ComingSoon() {
    const { isDarkMode } = useContext(authContext);

    return (
        <div className={`min-h-screen ${isDarkMode ? "dark bg-[#0A0B0E]" : "bg-gradient-to-br from-slate-50 via-white to-purple-50"}`}>
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/20 dark:bg-purple-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-500/20 dark:bg-pink-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px]"></div>
            </div>

            {/* Main Content */}
            <main className="relative z-10 min-h-[80vh] flex items-center justify-center px-4 py-12">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Animated Icon */}
                    <div className="relative mb-8 inline-block">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 mx-auto relative">
                            {/* Outer ring */}
                            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30 animate-ping"></div>
                            {/* Middle ring */}
                            <div className="absolute inset-2 rounded-full border-4 border-pink-500/40"></div>
                            {/* Inner circle with icon */}
                            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/30">
                                <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                        {/* Sparkles */}
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
                        <div className="absolute -bottom-1 -left-3 w-3 h-3 bg-pink-400 rounded-full animate-pulse delay-100"></div>
                        <div className="absolute top-1/2 -right-6 w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-200"></div>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-6">
                        <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                            Coming Soon
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-white mb-4">
                        Shop by Concierge Game
                    </h2>

                    {/* Description */}
                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
                        We're crafting something extraordinary just for you! Our innovative concierge shopping experience
                        is being built to make your shopping journey more personalized and exciting than ever before.
                    </p>

                    {/* Feature Pills */}
                    <div className="flex flex-wrap justify-center gap-3 mb-10">
                        {["🎮 Gamified Shopping", "🎁 Exclusive Rewards", "✨ Personalized Picks", "🚀 Launching Soon"].map((feature, index) => (
                            <span
                                key={index}
                                className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 shadow-sm"
                            >
                                {feature}
                            </span>
                        ))}
                    </div>

                    {/* Decorative Line */}
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500"></div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/"
                            className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Home
                        </Link>
                        <Link
                            to="/shoppingMall"
                            className="px-8 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-700 dark:text-gray-300 font-semibold rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 hover:scale-105"
                        >
                            Explore Shopping Mall
                        </Link>
                    </div>

                    {/* Bottom decoration */}
                    <div className="mt-16 flex justify-center">
                        <div className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full border border-purple-500/20">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Currently in Development
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Elements */}
            <div className="fixed bottom-10 left-10 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl rotate-12 blur-sm hidden lg:block"></div>
            <div className="fixed top-32 right-20 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-sm hidden lg:block"></div>
            <div className="fixed bottom-32 right-32 w-12 h-12 bg-gradient-to-br from-pink-500/20 to-yellow-500/20 rounded-lg -rotate-12 blur-sm hidden lg:block"></div>
        </div>
    );
}
