import { XMarkIcon } from "@heroicons/react/24/outline";
import ProductCard from "../../components/ProductCard";
import Pagination from "./Pagination";
import { hasActiveFilters, getActiveFilterCount } from "./constants";
import { formatFilterDisplayValue, isFilterEmpty } from "./utils";

export default function ProductsSection({
    loading,
    filteredProducts,
    currentProducts,
    isCard,
    attributeFilters,
    clearAttributeFilters,
    removeAttributeFilter,
    clearAllFilters,
    startIndex,
    endIndex,
    itemsPerPage,
    setItemsPerPage,
    setCurrentPage,
    currentPage,
    totalPages,
    goToPage,
}) {
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] glass-card rounded-3xl">
                <div className="relative">
                    <div className="w-24 h-24 border-4 border-purple-200 dark:border-purple-900 rounded-full"></div>
                    <div className="w-24 h-24 border-4 border-purple-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl">✨</span>
                    </div>
                </div>
                <p className="mt-6 text-lg text-gray-500 dark:text-gray-400">Loading amazing products...</p>
            </div>
        );
    }

    if (filteredProducts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] glass-card rounded-3xl p-8">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mb-6">
                    <span className="text-6xl">📦</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Products Found</h3>
                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
                    We couldn&apos;t find any products matching your criteria. Try adjusting your filters.
                </p>
                <button
                    onClick={clearAllFilters}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105"
                >
                    Clear All Filters
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Active Attribute Filters Tags */}
            {hasActiveFilters(attributeFilters) && (
                <div className="mb-4 p-3 glass-card rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Filters:</span>
                        <button
                            onClick={clearAttributeFilters}
                            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium"
                        >
                            Clear All
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(attributeFilters).map(([attrName, value]) => {
                            if (isFilterEmpty(value)) return null;

                            return (
                                <span
                                    key={attrName}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full"
                                >
                                    <span className="capitalize">{attrName}:</span>
                                    <span className="font-semibold">{formatFilterDisplayValue(value)}</span>
                                    <button
                                        onClick={() => removeAttributeFilter(attrName)}
                                        className="ml-1 p-0.5 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                                    >
                                        <XMarkIcon className="w-3 h-3" />
                                    </button>
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Products Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing{" "}
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                        {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-gray-900 dark:text-white">
                        {filteredProducts.length}
                    </span>{" "}
                    products
                </p>
                <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Show:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    >
                        <option value={8}>8</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                        <option value={48}>48</option>
                    </select>
                </div>
            </div>

            {/* Products Grid */}
            <div
                className={`grid gap-4 sm:gap-6 ${isCard
                        ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "grid-cols-1 sm:grid-cols-2"
                    }`}
            >
                {currentProducts.map((product) => (
                    <ProductCard key={product.id} product={product} isCard={isCard} />
                ))}
            </div>

            {/* Pagination */}
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                goToPage={goToPage}
            />
        </>
    );
}
