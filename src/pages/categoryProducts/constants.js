/** Category URL slugs (`/category/:slug`) that support zip/radius "Fetch by location" in the sidebar. */
export const LOCATION_FILTER_CATEGORY_SLUGS = [
    "cars",
    "residential-realestate",
    "commercial-realestate",
    "business-for-sale",
    "business4sale",
];

/** Radius options (miles), aligned with common marketplace patterns. */
export const LOCATION_RADIUS_MILES_OPTIONS = [10, 25, 50, 75, 100, 150, 200, 300, 500];

// Sort method options
export const SORT_METHODS = [
    { name: "Newest", value: "date", icon: "🆕" },
    { name: "Price: Low to High", value: "ascPrice", icon: "💰" },
    { name: "Price: High to Low", value: "descPrice", icon: "💎" },
];

// Static filter arrays for Real Estate & Business
export const QUICK_FILTERS = [
    {
        id: "bedrooms",
        name: "Beds",
        options: ["1+", "2+", "3+", "4+", "5+"],
        categoryMatch: ["residential-realestate"]
    },
    {
        id: "bathrooms",
        name: "Baths",
        options: ["1+", "1.5+", "2+", "3+"],
        categoryMatch: ["residential-realestate"]
    },
    {
        id: "propertyType",
        name: "Property Type",
        options: ["Single Family Home", "Condos", "Townhouses", "Apartments", "Land & Lots"],
        categoryMatch: ["residential-realestate"]
    },
    {
        id: "industry",
        name: "Industry",
        options: ["SaaS / Tech", "E-commerce", "Retail", "Healthcare", "Food & Beverage", "Manufacturing"],
        categoryMatch: ["business-for-sale", "business4sale"]
    }
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
