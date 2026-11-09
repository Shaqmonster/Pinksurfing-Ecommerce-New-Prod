/**
 * Returns a comparator function for sorting products.
 */
export const getSortComparator = (sortMethod) => {
    switch (sortMethod) {
        case "ascName":
            return (a, b) => (a.name?.toLowerCase() > b.name?.toLowerCase() ? 1 : -1);
        case "descName":
            return (a, b) => (b.name?.toLowerCase() > a.name?.toLowerCase() ? 1 : -1);
        case "ascPrice":
            return (a, b) => (Number(a.unit_price) || 0) - (Number(b.unit_price) || 0);
        case "descPrice":
            return (a, b) => (Number(b.unit_price) || 0) - (Number(a.unit_price) || 0);
        case "date":
            return (a, b) => new Date(b.created_at) - new Date(a.created_at);
        default:
            return (a, b) => (a.id || 0) - (b.id || 0);
    }
};

/**
 * Filter products by price, subcategory, and dynamic attribute filters.
 */
export const filterProducts = (products, { minValue, maximumValue, categoryFilter, attributeFilters, sortMethod }) => {
    if (!products) return [];

    return products
        .filter((i) => {
            const price = Number(i.unit_price) || 0;
            const priceFilterResult = price >= minValue && price <= maximumValue;
            const categoryFilterReturn =
                categoryFilter === "all" ? true : i?.subcategory?.name === categoryFilter;

            // Apply dynamic attribute filters — missing attributes fail active filters (no false positives)
            let attributeFilterResult = true;
            const productAttrs = i.attributes || i.product_attributes;
            const activeFilterEntries = Object.entries(attributeFilters || {}).filter(([, filterValue]) => {
                if (filterValue === "" || filterValue === null || filterValue === undefined) return false;
                if (Array.isArray(filterValue) && filterValue.length === 0) return false;
                if (typeof filterValue === "object" && filterValue !== null && !Array.isArray(filterValue)) {
                    const hasMin = filterValue.min !== "" && filterValue.min !== undefined;
                    const hasMax = filterValue.max !== "" && filterValue.max !== undefined;
                    return hasMin || hasMax;
                }
                return true;
            });

            if (activeFilterEntries.length > 0) {
                if (!productAttrs || !Array.isArray(productAttrs)) {
                    attributeFilterResult = false;
                } else {
                    attributeFilterResult = activeFilterEntries.every(([attrName, filterValue]) => {
                        const productAttr = productAttrs.find(
                            (attr) =>
                                attr.name?.toLowerCase() === attrName.toLowerCase() ||
                                attr.name?.toLowerCase().replace(/_/g, " ") === attrName.toLowerCase().replace(/_/g, " ")
                        );

                        if (!productAttr) return false;

                        const productValue = productAttr.value;

                        if (Array.isArray(filterValue)) {
                            if (Array.isArray(productValue)) {
                                return filterValue.some((fv) =>
                                    productValue.some((pv) => String(pv).toLowerCase() === String(fv).toLowerCase())
                                );
                            }
                            const productValues = String(productValue).split(",").map((v) => v.trim().toLowerCase());
                            return filterValue.some((fv) => productValues.includes(String(fv).toLowerCase()));
                        }

                        if (typeof filterValue === "object" && filterValue !== null) {
                            const numValue = Number(productValue);
                            if (isNaN(numValue)) return false;
                            const { min, max } = filterValue;
                            const minCheck = min === "" || min === undefined ? true : numValue >= Number(min);
                            const maxCheck = max === "" || max === undefined ? true : numValue <= Number(max);
                            return minCheck && maxCheck;
                        }

                        if (typeof filterValue === "boolean") {
                            return (
                                productValue === filterValue ||
                                String(productValue).toLowerCase() === String(filterValue).toLowerCase()
                            );
                        }

                        // Quick filters like "3+" → numeric minimum
                        const plusMatch = String(filterValue).match(/^(\d+(?:\.\d+)?)\+$/);
                        if (plusMatch) {
                            const numValue = Number(productValue);
                            if (isNaN(numValue)) return false;
                            return numValue >= Number(plusMatch[1]);
                        }

                        return String(productValue).toLowerCase().includes(String(filterValue).toLowerCase());
                    });
                }
            }

            return priceFilterResult && categoryFilterReturn && attributeFilterResult;
        })
        .sort(getSortComparator(sortMethod));
};

/**
 * Generate an array of page numbers for pagination display.
 */
export const getPageNumbers = (currentPage, totalPages) => {
    const pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1);
            pages.push('...');
            for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            pages.push('...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push('...');
            pages.push(totalPages);
        }
    }
    return pages;
};

/**
 * Convert a URL slug to a readable title.
 * e.g. "residential-real-estate" → "Residential Real Estate"
 */
export const slugToTitle = (slug) => {
    if (!slug) return '';
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Format a filter value for display in Active Filters tags.
 */
export const formatFilterDisplayValue = (value) => {
    if (Array.isArray(value)) {
        return value.join(", ");
    } else if (typeof value === "object" && value !== null) {
        const parts = [];
        if (value.min) parts.push(`Min: ${value.min}`);
        if (value.max) parts.push(`Max: ${value.max}`);
        return parts.join(" - ");
    } else if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }
    return String(value);
};

/**
 * Check if a filter value is "empty" (should be skipped in display).
 */
export const isFilterEmpty = (value) => {
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === "object" && value !== null && !value.min && !value.max) return true;
    if (value === "" || value === undefined) return true;
    return false;
};
