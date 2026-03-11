import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FunnelIcon } from "@heroicons/react/20/solid";
import MultiRangeSlider from "multi-range-slider-react";
import AttributeFilterPanel from "./AttributeFilterPanel";
import { SORT_METHODS, hasActiveFilters } from "./constants";

export default function MobileFilterDrawer({
    open,
    onClose,
    CategoryOnlyData,
    categoryFilter,
    setCategoryFilter,
    sortMethod,
    setSortMethod,
    setSortName,
    minValue,
    maximumValue,
    maxValue,
    handleSliderChange,
    allowedAttributes,
    attributeFilters,
    onFilterChange,
    clearAttributeFilters,
    getUniqueAttributeValues,
}) {
    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="transition-opacity ease-linear duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition-opacity ease-linear duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 z-50 flex">
                    <Transition.Child
                        as={Fragment}
                        enter="transition ease-in-out duration-300 transform"
                        enterFrom="translate-x-full"
                        enterTo="translate-x-0"
                        leave="transition ease-in-out duration-300 transform"
                        leaveFrom="translate-x-0"
                        leaveTo="translate-x-full"
                    >
                        <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-sm flex-col overflow-y-auto bg-gray-900 shadow-2xl border-l border-purple-500/20">
                            {/* Header */}
                            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-pink-600">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <FunnelIcon className="w-6 h-6" />
                                    Filters
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300"
                                >
                                    <XMarkIcon className="h-6 w-6" />
                                </button>
                            </div>

                            <div className="p-4 space-y-6">
                                {/* Subcategories */}
                                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                        Subcategories
                                    </h3>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {CategoryOnlyData.filter(cat => cat && cat !== 'null' && cat !== 'undefined').map((subcategory, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setCategoryFilter(subcategory === "all" ? "all" : subcategory);
                                                    onClose();
                                                }}
                                                className={`w-full px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 ${subcategory === categoryFilter
                                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                    }`}
                                            >
                                                {subcategory}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Sort */}
                                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                        Sort By
                                    </h3>
                                    <div className="space-y-2">
                                        {SORT_METHODS.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    setSortMethod(option.value);
                                                    setSortName(option.name);
                                                    onClose();
                                                }}
                                                className={`w-full px-4 py-2.5 rounded-xl text-left text-sm font-medium transition-all duration-200 flex items-center gap-2 ${option.value === sortMethod
                                                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                    }`}
                                            >
                                                <span>{option.icon}</span>
                                                {option.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
                                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                        Price Range
                                    </h3>
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
                                        barRightColor="#374151"
                                        barLeftColor="#374151"
                                        thumbLeftColor="#8B5CF6"
                                        thumbRightColor="#EC4899"
                                        onChange={handleSliderChange}
                                    />
                                    <div className="flex justify-between mt-4">
                                        <span className="px-3 py-1.5 bg-purple-900/50 text-purple-300 rounded-lg text-sm font-semibold">
                                            ${minValue}
                                        </span>
                                        <span className="px-3 py-1.5 bg-pink-900/50 text-pink-300 rounded-lg text-sm font-semibold">
                                            ${maximumValue}
                                        </span>
                                    </div>
                                </div>

                                {/* Dynamic Attribute Filters */}
                                {allowedAttributes.length > 0 && (
                                    <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700 z-100">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                                Filter by Attributes
                                            </h3>
                                            {hasActiveFilters(attributeFilters) && (
                                                <button
                                                    onClick={clearAttributeFilters}
                                                    className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                                            {allowedAttributes.map((attr, idx) => (
                                                <AttributeFilterPanel
                                                    key={`mobile-${attr.name}-${idx}`}
                                                    attr={attr}
                                                    uniqueValues={getUniqueAttributeValues(attr.name, attr.data_type)}
                                                    attributeFilters={attributeFilters}
                                                    onFilterChange={onFilterChange}
                                                    variant="mobile"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
