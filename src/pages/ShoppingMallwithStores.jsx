import { Link } from "react-router-dom";
import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { authContext } from '../context/authContext';
import SearchForm from '../components/Search';
import StoreCard from '../components/StoreCard';
import { EmptyState } from '../components/ui';
import ErrorState from '../components/ui/ErrorState';

export default function ShoppingMallwithStores() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                setLoading(true);
                setLoadError(false);
                const response = await axios.get(
                    `${import.meta.env.VITE_SERVER_URL}/api/vendor/all-stores/`,
                    {
                        headers: { "Content-Type": "application/json" },
                    }
                );
                setStores(response.data.stores || []);
            } catch (error) {
                console.error("Error fetching stores:", error);
                setLoadError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchStores();
    }, [reloadKey]);

    return (
        <div className={`min-h-screen bg-ps-bg`}>
            {/* <SearchForm /> */}

            {/* Background SVG */}
            <svg
                className="fixed top-0 right-0 z-[0] pointer-events-none"
                width="536"
                height="1071"
                viewBox="0 0 536 1071"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <g filter="url(#filter0_f_1_3190)">
                    <circle cx="535.5" cy="535.5" r="207.5" fill="#8B33FE" fillOpacity="0.4" />
                </g>
                <defs>
                    <filter
                        id="filter0_f_1_3190"
                        x="0"
                        y="0"
                        width="1071"
                        height="1071"
                        filterUnits="userSpaceOnUse"
                        colorInterpolationFilters="sRGB"
                    >
                        <feFlood floodOpacity="0" result="BackgroundImageFix" />
                        <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                        <feGaussianBlur stdDeviation="164" result="effect1_foregroundBlur_1_3190" />
                    </filter>
                </defs>
            </svg>

            <main className="relative z-10 sm:mx-auto sm:w-[97%] px-4 sm:px-6 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="font-bold text-[28px] sm:text-[32px] text-purple-900 dark:text-white">
                        Shopping Mall - All Stores
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Browse all available stores
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        Can&apos;t find what you need?{" "}
                        <Link
                            to="/request-product"
                            className="font-semibold text-pink-600 dark:text-pink-400 hover:underline"
                        >
                            Request a product
                        </Link>{" "}
                        and vendors will send you offers.
                    </p>
                </div>

                {/* Stores Grid */}
                {loading ? (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <img
                            src="/loading.svg"
                            alt="loading"
                            className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
                        />
                    </div>
                ) : loadError ? (
                    <ErrorState
                        title="We couldn’t load the stores"
                        description="Check your connection and try again."
                        onRetry={() => setReloadKey((k) => k + 1)}
                        className="min-h-[400px]"
                    />
                ) : stores.length === 0 ? (
                    <EmptyState
                        title="No stores yet"
                        description="Stores will appear here as soon as they open."
                        className="min-h-[400px]"
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {stores.map((store, index) => (
                            <StoreCard key={store.id || index} store={store} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
