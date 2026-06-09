import { Disclosure } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { getElectronicsSubMeta } from "../../constants/electronicsSubcategories";

/**
 * Collapsible multi-select subcategory filter for Electronics.
 * Empty selection = show all products.
 */
export default function ElectronicsSubcategoryFilter({
  subcategories = [],
  selectedSlugs = [],
  onToggle,
  onClear,
  variant = "desktop",
}) {
  const isMobile = variant === "mobile";

  const panel = (
    <div className={`space-y-1 max-h-[420px] overflow-y-auto custom-scrollbar pr-1 ${isMobile ? "pt-2" : ""}`}>
      {subcategories.map((sub) => {
        const slug = sub.slug || sub.id;
        const checked = selectedSlugs.includes(slug);
        const meta = getElectronicsSubMeta(slug);

        return (
          <label
            key={slug}
            className={`flex items-start gap-3 w-full px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
              checked
                ? isMobile
                  ? "bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/40"
                  : "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700/50"
                : isMobile
                  ? "bg-gray-700/50 hover:bg-gray-700 border border-transparent"
                  : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(slug)}
              className="mt-1 w-4 h-4 rounded border-gray-400 text-purple-600 focus:ring-purple-500 shrink-0"
            />
            <span className="flex-1 min-w-0">
              <span
                className={`block text-sm font-medium ${
                  checked
                    ? "text-purple-700 dark:text-purple-300"
                    : isMobile
                      ? "text-gray-200"
                      : "text-gray-800 dark:text-gray-200"
                }`}
              >
                <span className="mr-1.5" aria-hidden>
                  {meta.icon}
                </span>
                {sub.name}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );

  if (isMobile) {
    return (
      <div className="bg-gray-800 p-4 rounded-2xl border border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full" />
            Subcategories
          </h3>
          {selectedSlugs.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-purple-300 hover:text-white font-medium"
            >
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-2">Select one or more — leave empty to show all</p>
        {panel}
      </div>
    );
  }

  return (
    <div className="glass-card p-4 rounded-xl">
      <Disclosure defaultOpen>
        {({ open }) => (
          <>
            <div className="flex items-center justify-between gap-2 mb-1">
              <Disclosure.Button className="flex flex-1 items-center justify-between py-1 text-left">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  Subcategories
                  {selectedSlugs.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                      {selectedSlugs.length}
                    </span>
                  )}
                </h3>
                <ChevronDownIcon
                  className={`w-5 h-5 text-gray-500 transition-transform duration-300 shrink-0 ${open ? "rotate-180" : ""}`}
                />
              </Disclosure.Button>
              {selectedSlugs.length > 0 && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 pl-10">
              Select one or more — all products show when none selected
            </p>
            <Disclosure.Panel>{panel}</Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
}
