// Sort method options
export const SORT_METHODS = [
    { name: "Newest", value: "date", icon: "🆕" },
    { name: "Price: Low to High", value: "ascPrice", icon: "💰" },
    { name: "Price: High to Low", value: "descPrice", icon: "💎" },
];

// Static filter arrays (currently empty — kept for future use)
export const QUICK_FILTERS = [
    { id: "color", name: "Color", options: [] },
    { id: "size", name: "Size", options: [] },
    { id: "storage", name: "Storage", options: [] },
    { id: "system", name: "System / OS", options: [] },
];

/**
 * Check if any attribute filters are actively applied.
 */
export const hasActiveFilters = (attributeFilters) => {
    return Object.entries(attributeFilters).some(([_, val]) => {
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "object" && val !== null) return val.min || val.max;
        return val !== "" && val !== undefined;
    });
};

/**
 * Count number of active attribute filters.
 */
export const getActiveFilterCount = (attributeFilters) => {
    return Object.entries(attributeFilters).filter(([_, val]) => {
        if (Array.isArray(val)) return val.length > 0;
        if (typeof val === "object" && val !== null) return val.min || val.max;
        return val !== "" && val !== undefined;
    }).length;
};
