import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import { ChevronDownIcon, FunnelIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { Link } from "react-router-dom";
import { HiMiniSquares2X2 } from "react-icons/hi2";
import { AiOutlineBars } from "react-icons/ai";
import AttributeFilterPanel from "./AttributeFilterPanel";
import { SORT_METHODS, hasActiveFilters, getActiveFilterCount } from "./constants";

export default function CategoryHeader({
    title,
    filteredProducts,
    isCard,
    setIsCard,
    sortMethod,
    setSortMethod,
    sortName,
    setSortName,
    allowedAttributes,
    attributeFilters,
    onFilterChange,
    clearAttributeFilters,
    getUniqueAttributeValues,
    setMobileFiltersOpen,
}) {
    const activeCount = getActiveFilterCount(attributeFilters);

    return (
        <div className="mb-5">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <Link to="/" className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors">Home</Link>
                <ChevronRightIcon className="w-4 h-4" />
                <span className="text-purple-600 dark:text-purple-400 font-medium capitalize">{title}</span>
            </nav>

            {/* Category Header Card */}
            <div className="glass-card relative p-4 sm:p-5 rounded-2xl z-[60]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg sm:text-xl">{title?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent capitalize">
                                {title}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                {filteredProducts.length} products
                            </p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* View Toggle */}
                        <div className="flex items-center p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
                            <button
                                onClick={() => setIsCard(true)}
                                className={`p-2.5 rounded-lg transition-all duration-300 ${isCard
                                    ? "bg-white dark:bg-gray-700 text-purple-600 shadow-md"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                title="Grid View"
                            >
                                <HiMiniSquares2X2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setIsCard(false)}
                                className={`p-2.5 rounded-lg transition-all duration-300 ${!isCard
                                    ? "bg-white dark:bg-gray-700 text-purple-600 shadow-md"
                                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                title="List View"
                            >
                                <AiOutlineBars className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Sort Dropdown — Desktop */}
                        <Menu as="div" className="relative hidden md:block">
                            <Menu.Button className="group flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sortName}</span>
                                <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-200"
                                enterFrom="opacity-0 scale-95 -translate-y-2"
                                enterTo="opacity-100 scale-100 translate-y-0"
                                leave="transition ease-in duration-150"
                                leaveFrom="opacity-100 scale-100 translate-y-0"
                                leaveTo="opacity-0 scale-95 -translate-y-2"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right glass-card rounded-2xl shadow-xl p-2 z-50">
                                    {SORT_METHODS.map((option) => (
                                        <Menu.Item key={option.value}>
                                            {({ active }) => (
                                                <button
                                                    onClick={() => {
                                                        setSortMethod(option.value);
                                                        setSortName(option.name);
                                                    }}
                                                    className={`${active || option.value === sortMethod
                                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                                        : "text-gray-700 dark:text-gray-300"
                                                        } flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200`}
                                                >
                                                    <span className="text-lg">{option.icon}</span>
                                                    {option.name}
                                                </button>
                                            )}
                                        </Menu.Item>
                                    ))}
                                </Menu.Items>
                            </Transition>
                        </Menu>

                        {/* Attribute Filters Dropdown — Desktop */}
                        <Menu as="div" className="relative hidden md:block" style={{ zIndex: 9999 }}>
                            <Menu.Button className="group relative flex items-center gap-2 px-4 py-2.5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-300 shadow-sm hover:shadow-md">
                                <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-500 group-hover:text-purple-500 transition-colors" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters</span>
                                <ChevronDownIcon className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
                                {activeCount > 0 && (
                                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                                        {activeCount}
                                    </span>
                                )}
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-200"
                                enterFrom="opacity-0 scale-95 -translate-y-2"
                                enterTo="opacity-100 scale-100 translate-y-0"
                                leave="transition ease-in duration-150"
                                leaveFrom="opacity-100 scale-100 translate-y-0"
                                leaveTo="opacity-0 scale-95 -translate-y-2"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-72 sm:w-80 origin-top-right bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-4 z-[9999] max-h-[70vh] overflow-y-auto custom-scrollbar border border-gray-200 dark:border-gray-700">
                                    {allowedAttributes.length > 0 ? (
                                        <>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Filter by Attributes</h3>
                                                {hasActiveFilters(attributeFilters) && (
                                                    <button
                                                        onClick={clearAttributeFilters}
                                                        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                                                    >
                                                        Clear All
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                {allowedAttributes.map((attr, idx) => (
                                                    <AttributeFilterPanel
                                                        key={`header-${attr.name}-${idx}`}
                                                        attr={attr}
                                                        uniqueValues={getUniqueAttributeValues(attr.name, attr.data_type)}
                                                        attributeFilters={attributeFilters}
                                                        onFilterChange={onFilterChange}
                                                        variant="desktop"
                                                        defaultOpen={idx < 2}
                                                    />
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-6 text-center">
                                            <AdjustmentsHorizontalIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                            <p className="text-sm text-gray-500 dark:text-gray-400">No attribute filters available</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Products in this category don&apos;t have filterable attributes</p>
                                        </div>
                                    )}
                                </Menu.Items>
                            </Transition>
                        </Menu>

                        {/* Mobile Filter Button */}
                        <button
                            onClick={() => setMobileFiltersOpen(true)}
                            className="lg:hidden relative flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                        >
                            <FunnelIcon className="w-5 h-5" />
                            <span>Filters</span>
                            {activeCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 text-gray-900 text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                                    {activeCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
