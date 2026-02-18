import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import MultiRangeSlider from "multi-range-slider-react";
import { QUICK_FILTERS } from "./constants";

export default function CategorySidebar({
    CategoryOnlyData,
    categoryFilter,
    setCategoryFilter,
    minValue,
    maximumValue,
    maxValue,
    handleSliderChange,
    filterBy,
    setFilterBy,
}) {
    return (
        <aside className="hidden lg:block space-y-4">
            {/* Subcategories */}
            <div className="glass-card p-4 rounded-xl">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                        </svg>
                    </div>
                    Subcategories
                </h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {CategoryOnlyData.filter(cat => cat && cat !== 'null' && cat !== 'undefined').map((subcategory, index) => (
                        <button
                            key={index}
                            onClick={() => setCategoryFilter(subcategory === "all" ? "all" : subcategory)}
                            className={`group w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 flex items-center justify-between ${subcategory === categoryFilter
                                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md"
                                    : "bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                                }`}
                        >
                            <span className="capitalize">{subcategory}</span>
                            {subcategory === categoryFilter && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Price Range */}
            <div className="glass-card p-4 rounded-xl">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    Price Range
                </h3>
                <div className="mt-4">
                    <MultiRangeSlider
                        min={0}
                        max={maxValue || 1000}
                        step={5}
                        minValue={minValue}
                        maxValue={maximumValue}
                        label={false}
                        ruler={false}
                        style={{ border: "none", boxShadow: "none" }}
                        barInnerColor="#8B5CF6"
                        barRightColor="#E5E7EB"
                        barLeftColor="#E5E7EB"
                        thumbLeftColor="#8B5CF6"
                        thumbRightColor="#EC4899"
                        onChange={handleSliderChange}
                    />
                    <div className="flex justify-between mt-4 gap-2">
                        <div className="flex-1 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-center">
                            <span className="text-xs text-purple-600 dark:text-purple-400">Min</span>
                            <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                                ${minValue.toLocaleString()}
                            </p>
                        </div>
                        <div className="flex-1 p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-center">
                            <span className="text-xs text-pink-600 dark:text-pink-400">Max</span>
                            <p className="text-lg font-bold text-pink-700 dark:text-pink-300">
                                ${maximumValue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Filters */}
            {QUICK_FILTERS.some(f => f.options.length > 0) && (
                <div className="glass-card p-4 rounded-xl">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        Quick Filters
                    </h3>
                    {QUICK_FILTERS.map((section) =>
                        section.options.length > 0 && (
                            <Disclosure key={section.id} as="div" className="mt-4">
                                {({ open }) => (
                                    <>
                                        <Disclosure.Button className="flex w-full items-center justify-between py-2 text-sm font-medium text-gray-900 dark:text-white">
                                            {section.name}
                                            <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
                                        </Disclosure.Button>
                                        <Disclosure.Panel className="pt-2 space-y-2">
                                            {section.options.map((option, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setFilterBy(option === filterBy ? "" : option)}
                                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm transition-all duration-300 ${option === filterBy
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                        }`}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </Disclosure.Panel>
                                    </>
                                )}
                            </Disclosure>
                        )
                    )}
                </div>
            )}
        </aside>
    );
}
