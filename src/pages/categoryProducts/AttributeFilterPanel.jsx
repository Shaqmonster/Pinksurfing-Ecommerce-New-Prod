import { useState, useMemo } from "react";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import MultiRangeSlider from "multi-range-slider-react";

/**
 * Renders a single attribute filter control based on its data_type.
 * Supports: number, text, select, boolean, multi_select
 */
export default function AttributeFilterPanel({
    attr,
    uniqueValues,
    attributeFilters,
    onFilterChange,
    variant = "desktop",
    defaultOpen = false,
}) {
    const isMobile = variant === "mobile";
    const dataType = attr.data_type || "text";
    const hasOptions = attr.options && Array.isArray(attr.options) && attr.options.length > 0;

    // For multi_select / select, merge predefined options with unique values from products
    const allOptions = useMemo(() => {
        if (dataType === "select" || dataType === "multi_select") {
            const set = new Set();
            if (hasOptions) attr.options.forEach(o => set.add(String(o)));
            // Also add unique values extracted from products (already split by getUniqueAttributeValues)
            if (uniqueValues) uniqueValues.forEach(v => set.add(String(v)));
            return Array.from(set).sort();
        }
        return uniqueValues || [];
    }, [attr.options, uniqueValues, dataType, hasOptions]);

    // For number type — compute min/max from product values for the slider
    const numericRange = useMemo(() => {
        if (dataType !== "number") return { min: 0, max: 100 };
        const nums = (uniqueValues || []).map(Number).filter(n => !isNaN(n));
        if (nums.length === 0) return { min: 0, max: 100 };
        return { min: Math.floor(Math.min(...nums)), max: Math.ceil(Math.max(...nums)) };
    }, [dataType, uniqueValues]);

    // Local state for number slider to avoid re-renders on every drag tick
    const [localMin, setLocalMin] = useState(numericRange.min);
    const [localMax, setLocalMax] = useState(numericRange.max);

    // Search text for filtering long checkbox lists
    const [searchText, setSearchText] = useState("");

    // Skip if select/multi_select with zero options to display
    if ((dataType === "select" || dataType === "multi_select") && allOptions.length === 0) return null;

    // ---- Variant-based Tailwind classes ----
    const inputCls = isMobile
        ? "w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        : "w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent";

    const checkboxCls = isMobile
        ? "w-4 h-4 rounded border-gray-500 bg-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-gray-800 shrink-0"
        : "w-3.5 h-3.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 shrink-0";

    const selectedTextCls = isMobile
        ? "text-sm text-purple-400 font-medium transition-colors"
        : "text-xs text-purple-600 dark:text-purple-400 font-medium transition-colors";
    const unselectedTextCls = isMobile
        ? "text-sm text-gray-400 group-hover:text-purple-400 transition-colors"
        : "text-xs text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors";

    // -------- Render helpers --------

    /** Checkbox list — each option gets its own row */
    const renderCheckboxList = (options) => {
        // If many options, show a search box to narrow down
        const filteredOpts = searchText
            ? options.filter(o => String(o).toLowerCase().includes(searchText.toLowerCase()))
            : options;

        return (
            <div>
                {options.length > 8 && (
                    <input
                        type="text"
                        placeholder={`Search ${attr.name}...`}
                        className={`${inputCls} mb-2`}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                )}
                <div className={`${isMobile ? "space-y-2" : "space-y-1.5"} max-h-48 overflow-y-auto custom-scrollbar pr-1`}>
                    {filteredOpts.map((option, idx) => {
                        const optStr = String(option);
                        const isSelected = Array.isArray(attributeFilters[attr.name])
                            ? attributeFilters[attr.name].includes(optStr)
                            : false;
                        return (
                            <label
                                key={idx}
                                className={`flex items-center ${isMobile ? "gap-3" : "gap-2"} cursor-pointer group`}
                            >
                                <input
                                    type="checkbox"
                                    className={checkboxCls}
                                    checked={isSelected}
                                    onChange={() => onFilterChange(attr.name, optStr, "multi")}
                                />
                                <span className={isSelected ? selectedTextCls : unselectedTextCls}>
                                    {optStr}
                                </span>
                            </label>
                        );
                    })}
                    {filteredOpts.length === 0 && (
                        <p className={isMobile ? "text-sm text-gray-500" : "text-xs text-gray-400"}>
                            No matches
                        </p>
                    )}
                </div>
            </div>
        );
    };

    /** Render the filter body based on data_type */
    const renderFilterBody = () => {
        // ── number → range slider with min/max ──
        if (dataType === "number") {
            const rangeSpan = numericRange.max - numericRange.min;
            const step = rangeSpan > 1000 ? 100 : rangeSpan > 100 ? 10 : 1;

            const currentMin = attributeFilters[attr.name]?.min !== undefined && attributeFilters[attr.name]?.min !== ""
                ? Number(attributeFilters[attr.name].min)
                : numericRange.min;
            const currentMax = attributeFilters[attr.name]?.max !== undefined && attributeFilters[attr.name]?.max !== ""
                ? Number(attributeFilters[attr.name].max)
                : numericRange.max;

            return (
                <div>
                    <MultiRangeSlider
                        min={numericRange.min}
                        max={numericRange.max || 100}
                        step={step}
                        minValue={currentMin}
                        maxValue={currentMax}
                        label={false}
                        ruler={false}
                        style={{ border: "none", boxShadow: "none" }}
                        barInnerColor="#8B5CF6"
                        barRightColor={isMobile ? "#374151" : "#E5E7EB"}
                        barLeftColor={isMobile ? "#374151" : "#E5E7EB"}
                        thumbLeftColor="#8B5CF6"
                        thumbRightColor="#EC4899"
                        onInput={(e) => {
                            setLocalMin(e.minValue);
                            setLocalMax(e.maxValue);
                        }}
                        onChange={(e) => {
                            onFilterChange(attr.name, {
                                min: String(e.minValue),
                                max: String(e.maxValue),
                            }, "range");
                        }}
                    />
                    <div className="flex justify-between mt-2 gap-2">
                        {isMobile ? (
                            <>
                                <span className="px-2 py-1 bg-purple-900/50 text-purple-300 rounded-lg text-xs font-semibold">
                                    {localMin}
                                </span>
                                <span className="px-2 py-1 bg-pink-900/50 text-pink-300 rounded-lg text-xs font-semibold">
                                    {localMax}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold">
                                    {localMin}
                                </span>
                                <span className="px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg text-xs font-semibold">
                                    {localMax}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            );
        }

        // ── boolean → Yes / No toggle buttons ──
        if (dataType === "boolean") {
            const yesActive = attributeFilters[attr.name] === true;
            const noActive = attributeFilters[attr.name] === false;

            const yesBaseCls = isMobile
                ? "flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200"
                : "flex-1 px-2 py-1.5 text-xs rounded-lg font-medium transition-all duration-200";
            const noBaseCls = yesBaseCls;

            const yesCls = yesActive
                ? `${yesBaseCls} bg-green-500 text-white shadow-md`
                : `${yesBaseCls} ${isMobile ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`;
            const noCls = noActive
                ? `${noBaseCls} bg-red-500 text-white shadow-md`
                : `${noBaseCls} ${isMobile ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`;

            return (
                <div className="flex gap-2">
                    <button onClick={() => onFilterChange(attr.name, yesActive ? "" : true)} className={yesCls}>
                        Yes
                    </button>
                    <button onClick={() => onFilterChange(attr.name, noActive ? "" : false)} className={noCls}>
                        No
                    </button>
                </div>
            );
        }

        // ── select / multi_select → individual checkboxes ──
        if (dataType === "select" || dataType === "multi_select") {
            return renderCheckboxList(allOptions);
        }

        // ── text (default) → checkboxes if few unique values, else free‑text search ──
        if (uniqueValues.length > 0) {
            return renderCheckboxList(uniqueValues);
        }
        return (
            <input
                type="text"
                placeholder={`Search ${attr.name}...`}
                className={inputCls}
                value={attributeFilters[attr.name] || ""}
                onChange={(e) => onFilterChange(attr.name, e.target.value)}
            />
        );
    };

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
                            className={`${isMobile ? "w-5 h-5 text-gray-400" : "w-4 h-4 text-gray-500"} transition-transform duration-300 ${open ? "rotate-180" : ""}`}
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
                            {renderFilterBody()}
                        </Disclosure.Panel>
                    </Transition>
                </>
            )}
        </Disclosure>
    );
}
