import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

/**
 * Renders a single attribute filter control based on its data type.
 * Reused in both MobileFilterDrawer and the desktop Attribute Filters dropdown.
 *
 * @param {Object} props
 * @param {Object} props.attr - Attribute definition { name, data_type, options }
 * @param {string[]} props.uniqueValues - Unique values for this attribute from products
 * @param {Object} props.attributeFilters - Current filter state
 * @param {Function} props.onFilterChange - (attrName, value, filterType) => void
 * @param {"mobile"|"desktop"} props.variant - Controls sizing/colors
 * @param {boolean} props.defaultOpen - Whether disclosure starts open
 */
export default function AttributeFilterPanel({
    attr,
    uniqueValues,
    attributeFilters,
    onFilterChange,
    variant = "desktop",
    defaultOpen = false,
}) {
    if (uniqueValues.length === 0) return null;

    const isMobile = variant === "mobile";

    // Shared class sets
    const inputCls = isMobile
        ? "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        : "w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent";

    const btnActiveCls = isMobile ? "shadow-md" : "";
    const checkboxCls = isMobile
        ? "w-4 h-4 rounded border-gray-500 bg-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-800"
        : "w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500";

    const labelTextCls = (isSelected) =>
        isMobile
            ? `text-sm transition-colors ${isSelected ? "text-purple-400 font-medium" : "text-gray-400 group-hover:text-purple-400"}`
            : `text-xs capitalize transition-colors ${isSelected ? "text-purple-600 dark:text-purple-400 font-medium" : "text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400"}`;

    return (
        <Disclosure as="div" defaultOpen={defaultOpen}>
            {({ open }) => (
                <>
                    <Disclosure.Button
                        className={
                            isMobile
                                ? "flex w-full items-center justify-between py-2.5 px-3 bg-gray-700/50 rounded-lg text-sm font-medium text-white hover:bg-gray-700 transition-colors"
                                : "flex w-full items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        }
                    >
                        <span className="capitalize">{attr.name}</span>
                        <ChevronDownIcon
                            className={`${isMobile ? "w-5 h-5" : "w-4 h-4"} text-gray-${isMobile ? "400" : "500"} transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                        />
                    </Disclosure.Button>

                    <Transition
                        enter="transition duration-100 ease-out"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition duration-75 ease-out"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                    >
                        <Disclosure.Panel className={isMobile ? "pt-3 pb-2 px-1" : "pt-2 pb-1 px-1"}>
                            {/* Number type — Range inputs */}
                            {attr.data_type === "number" && (
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        placeholder="Min"
                                        className={inputCls}
                                        value={attributeFilters[attr.name]?.min || ""}
                                        onChange={(e) => onFilterChange(attr.name, { min: e.target.value }, "range")}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Max"
                                        className={inputCls}
                                        value={attributeFilters[attr.name]?.max || ""}
                                        onChange={(e) => onFilterChange(attr.name, { max: e.target.value }, "range")}
                                    />
                                </div>
                            )}

                            {/* Boolean type — Toggle buttons */}
                            {attr.data_type === "boolean" && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            onFilterChange(attr.name, attributeFilters[attr.name] === true ? "" : true)
                                        }
                                        className={`flex-1 px-${isMobile ? 3 : 2} py-${isMobile ? 2 : 1.5} rounded-lg text-${isMobile ? "sm" : "xs"} font-medium transition-all duration-200 ${attributeFilters[attr.name] === true
                                                ? `bg-green-500 text-white ${btnActiveCls}`
                                                : isMobile
                                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                            }`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() =>
                                            onFilterChange(attr.name, attributeFilters[attr.name] === false ? "" : false)
                                        }
                                        className={`flex-1 px-${isMobile ? 3 : 2} py-${isMobile ? 2 : 1.5} rounded-lg text-${isMobile ? "sm" : "xs"} font-medium transition-all duration-200 ${attributeFilters[attr.name] === false
                                                ? `bg-red-500 text-white ${btnActiveCls}`
                                                : isMobile
                                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                            }`}
                                    >
                                        No
                                    </button>
                                </div>
                            )}

                            {/* Select type with predefined options */}
                            {attr.data_type === "select" && attr.options && attr.options.length > 0 && (
                                <div className={`space-y-${isMobile ? 2 : 1.5} max-h-32 overflow-y-auto custom-scrollbar`}>
                                    {attr.options.map((option, optIdx) => {
                                        const isSelected = Array.isArray(attributeFilters[attr.name])
                                            ? attributeFilters[attr.name].includes(option)
                                            : false;
                                        return (
                                            <label key={optIdx} className="flex items-center gap-${isMobile ? 3 : 2} cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    className={checkboxCls}
                                                    checked={isSelected}
                                                    onChange={() => onFilterChange(attr.name, option, "multi")}
                                                />
                                                <span className={labelTextCls(isSelected)}>{option}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Text type / select without predefined options / default */}
                            {(attr.data_type === "text" ||
                                attr.data_type === "select" && (!attr.options || attr.options.length === 0) ||
                                !attr.data_type) &&
                                uniqueValues.length > 0 && (
                                    <div className={`space-y-${isMobile ? 2 : 1.5} max-h-32 overflow-y-auto custom-scrollbar`}>
                                        {uniqueValues.length <= 8 ? (
                                            uniqueValues.map((value, valIdx) => {
                                                const isSelected = Array.isArray(attributeFilters[attr.name])
                                                    ? attributeFilters[attr.name].includes(value)
                                                    : false;
                                                return (
                                                    <label key={valIdx} className={`flex items-center gap-${isMobile ? 3 : 2} cursor-pointer group`}>
                                                        <input
                                                            type="checkbox"
                                                            className={checkboxCls}
                                                            checked={isSelected}
                                                            onChange={() => onFilterChange(attr.name, value, "multi")}
                                                        />
                                                        <span className={labelTextCls(isSelected)}>{value}</span>
                                                    </label>
                                                );
                                            })
                                        ) : (
                                            <input
                                                type="text"
                                                placeholder={`Search ${attr.name}...`}
                                                className={inputCls}
                                                value={attributeFilters[attr.name] || ""}
                                                onChange={(e) => onFilterChange(attr.name, e.target.value)}
                                            />
                                        )}
                                        {!isMobile && uniqueValues.length > 8 && (
                                            <p className="text-xs text-gray-400 pl-5">+{uniqueValues.length - 8} more</p>
                                        )}
                                    </div>
                                )}
                        </Disclosure.Panel>
                    </Transition>
                </>
            )}
        </Disclosure>
    );
}
