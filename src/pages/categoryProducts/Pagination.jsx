import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { getPageNumbers } from "./utils";

export default function Pagination({ currentPage, totalPages, goToPage }) {
    if (totalPages <= 1) return null;

    const pages = getPageNumbers(currentPage, totalPages);

    return (
        <div className="mt-12 flex flex-col items-center gap-6">
            {/* Pagination Controls */}
            <div className="flex items-center gap-2 p-2 glass-card rounded-2xl">
                {/* Previous */}
                <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                >
                    <ChevronLeftIcon className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                    {pages.map((page, index) =>
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="w-10 h-12 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                •••
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`relative w-12 h-12 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden ${currentPage === page
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-110"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                <span className="relative">{page}</span>
                            </button>
                        )
                    )}
                </div>

                {/* Next */}
                <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="group flex items-center justify-center w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-300"
                >
                    <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* Page Jump */}
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <span>Jump to page:</span>
                <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                        const page = parseInt(e.target.value);
                        if (page >= 1 && page <= totalPages) goToPage(page);
                    }}
                    className="w-16 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-center font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <span>of <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span></span>
            </div>
        </div>
    );
}
