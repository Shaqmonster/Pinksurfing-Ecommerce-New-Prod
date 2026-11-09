/**
 * Price-domain helpers for category listing filters.
 * Keeps dual-thumb range sliders readable and aligned to sale vs lease scales.
 */

const LISTING_TYPE_ALIASES = [
    "listing_type",
    "Listing Type",
    "status",
    "intent",
    "listing intent",
];

export function getProductAttrValue(product, aliases = []) {
    const attrs = product?.attributes || product?.product_attributes || [];
    if (!Array.isArray(attrs) || attrs.length === 0) return "";

    for (const name of aliases) {
        if (!name) continue;
        const norm = String(name).toLowerCase().replace(/_/g, " ");
        const attr = attrs.find(
            (a) => (a?.name || "").toLowerCase().replace(/_/g, " ") === norm
        );
        if (attr?.value !== undefined && attr?.value !== null && attr?.value !== "") {
            return String(attr.value);
        }
    }
    return "";
}

export function isLeaseLikeProduct(product) {
    const listingType = getProductAttrValue(product, LISTING_TYPE_ALIASES);
    return /lease|rent/i.test(listingType);
}

export function roundUpToStep(value, step) {
    const s = Math.max(Number(step) || 1, 1);
    const v = Math.max(Number(value) || 0, 0);
    return Math.ceil(v / s) * s;
}

export function formatFilterPrice(val) {
    const n = Number(val) || 0;
    if (n >= 1000000) {
        const m = n / 1000000;
        return `$${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
    }
    if (n >= 1000) {
        const k = n / 1000;
        return `$${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    return `$${Math.round(n).toLocaleString()}`;
}

/** Insert a space before parentheses: "Apartments(1-4)" → "Apartments (1-4)" */
export function formatSubcategoryLabel(label) {
    if (label == null) return "";
    const raw = String(label);
    if (raw.toLowerCase() === "all") return "All";
    return raw.replace(/([^\s])\(/g, "$1 (");
}

/**
 * Build a filter-friendly price domain from listing prices.
 * Selected range always starts as the full domain so both thumbs are visible.
 */
export function computePriceDomain(products = [], categorySlug = "") {
    const slug = categorySlug || "";
    const isRE = slug.includes("realestate");
    const isBusiness = slug.includes("business");

    const prices = (products || [])
        .map((p) => Number(p?.unit_price))
        .filter((n) => Number.isFinite(n) && n > 0);

    if (prices.length === 0) {
        const fallbackMax = isRE ? 1000000 : isBusiness ? 500000 : 1000;
        const step = isRE ? 5000 : isBusiness ? 1000 : 10;
        return {
            domainMin: 0,
            domainMax: fallbackMax,
            step,
            scale: isRE ? "sale" : "default",
            selectedMin: 0,
            selectedMax: fallbackMax,
        };
    }

    const listingMax = Math.max(...prices);
    let leaseCount = 0;
    let saleCount = 0;
    (products || []).forEach((p) => {
        if (isLeaseLikeProduct(p)) leaseCount += 1;
        else saleCount += 1;
    });

    const predominateLease =
        isRE &&
        (leaseCount > saleCount || (leaseCount > 0 && listingMax <= 50000));

    let scale = "default";
    if (predominateLease) scale = "lease";
    else if (isRE || isBusiness) scale = "sale";

    let step;
    if (scale === "lease") {
        if (listingMax <= 5000) step = 50;
        else if (listingMax <= 20000) step = 100;
        else step = 250;
    } else if (scale === "sale") {
        if (listingMax <= 250000) step = 5000;
        else if (listingMax <= 2000000) step = 10000;
        else step = 25000;
    } else if (listingMax <= 100) {
        step = 1;
    } else if (listingMax <= 1000) {
        step = 5;
    } else if (listingMax <= 10000) {
        step = 50;
    } else {
        step = 100;
    }

    // Pad slightly above the highest listing so the right thumb isn't jammed at the edge.
    const padded = listingMax * 1.05;
    let domainMax = roundUpToStep(padded, step);
    if (domainMax <= step) domainMax = step * 10;

    return {
        domainMin: 0,
        domainMax,
        step,
        scale,
        selectedMin: 0,
        selectedMax: domainMax,
    };
}

export function categoryShowsPriceRange(categorySlug = "") {
    const slug = categorySlug || "";
    return slug.includes("realestate") || slug.includes("business");
}
