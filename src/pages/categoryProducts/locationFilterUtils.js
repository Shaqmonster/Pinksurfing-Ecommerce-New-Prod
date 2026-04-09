/**
 * Zip / postal-based radius filtering for category listings.
 * Uses zippopotam.us (no API key) for postal → lat/lng, with optional Nominatim fallback.
 */

const ZIP_ATTR_NAMES = new Set([
    "zip code",
    "zip",
    "postal code",
    "postcode",
    "pin code",
    "pincode",
    "zipcode",
]);

const COUNTRY_ALIASES = {
    "united states": "us",
    usa: "us",
    us: "us",
    america: "us",
    india: "in",
    in: "in",
    "united kingdom": "gb",
    uk: "gb",
    gb: "gb",
    england: "gb",
    canada: "ca",
    ca: "ca",
    australia: "au",
    au: "au",
};

/** @param {string} raw */
export function normalizeZipDigits(raw) {
    if (raw == null || raw === "") return "";
    return String(raw).replace(/\s+/g, "").trim();
}

/** US ZIP+4 → 5-digit base for APIs. */
export function normalizeZipForCountry(iso2, zipDigits) {
    const z = normalizeZipDigits(zipDigits);
    if (!z) return "";
    if (iso2 === "us" && /^\d{9}$/.test(z)) return z.slice(0, 5);
    return z;
}

/**
 * Map human-readable country from product attributes to zippopotam ISO2 code.
 * @param {string|undefined} raw
 */
export function countryHintToIso2(raw) {
    if (!raw || typeof raw !== "string") return null;
    const k = raw.trim().toLowerCase();
    if (COUNTRY_ALIASES[k]) return COUNTRY_ALIASES[k];
    if (/^[a-z]{2}$/i.test(k)) return k.toLowerCase();
    return null;
}

/**
 * Guess country ISO2 from zip shape when Country attribute is missing.
 * @param {string} digits
 */
export function inferCountryFromZipShape(digits) {
    const d = normalizeZipDigits(digits);
    if (/^\d{5}(-\d{4})?$/.test(d)) return "us";
    if (/^\d{6}$/.test(d)) return "in";
    if (/^[a-z]{1,2}\d[a-z\d]?\s?\d[a-z]{2}$/i.test(d)) return "gb";
    return "us";
}

/**
 * @param {{ name?: string, value?: string }[]} attrs
 * @returns {{ zip: string|null, countryIso2: string|null }}
 */
export function extractZipAndCountryFromAttributes(attrs) {
    if (!Array.isArray(attrs)) return { zip: null, countryIso2: null };
    let zip = null;
    let countryRaw = null;
    for (const a of attrs) {
        const name = (a.name || "").trim().toLowerCase();
        if (name === "country") {
            countryRaw = a.value;
        }
        if (ZIP_ATTR_NAMES.has(name) || ZIP_ATTR_NAMES.has(name.replace(/\s+/g, " "))) {
            zip = a.value != null ? String(a.value) : null;
        }
    }
    for (const a of attrs) {
        const name = (a.name || "").trim().toLowerCase();
        if (!zip && (name.includes("zip") || name.includes("postal") || name.includes("pin"))) {
            zip = a.value != null ? String(a.value) : null;
        }
    }
    let digits = zip ? normalizeZipDigits(zip) : "";
    let countryIso2 = countryHintToIso2(countryRaw);
    if (!countryIso2 && digits) {
        countryIso2 = inferCountryFromZipShape(digits);
    }
    if (digits && countryIso2) {
        digits = normalizeZipForCountry(countryIso2, digits);
    }
    return { zip: digits || null, countryIso2 };
}

/**
 * @param {object} product
 * @returns {string|null} cache key "iso2|zip"
 */
export function getProductZipCacheKey(product) {
    const attrs = product.attributes || product.product_attributes;
    const { zip, countryIso2 } = extractZipAndCountryFromAttributes(attrs || []);
    if (!zip || !countryIso2) return null;
    return `${countryIso2}|${zip}`;
}

/**
 * Haversine distance in miles.
 */
export function haversineMiles(lat1, lon1, lat2, lon2) {
    const R = 3958.7613; // Earth radius in miles
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * @param {string} iso2
 * @param {string} zipNormalized
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
export async function geocodeZipZippopotam(iso2, zipNormalized) {
    if (!iso2 || !zipNormalized) return null;
    try {
        const res = await fetch(`https://api.zippopotam.us/${iso2}/${encodeURIComponent(zipNormalized)}`);
        if (!res.ok) return null;
        const data = await res.json();
        const place = data.places?.[0];
        if (!place) return null;
        return {
            lat: parseFloat(place.latitude),
            lng: parseFloat(place.longitude),
        };
    } catch {
        return null;
    }
}

/**
 * Open-Meteo geocoding (browser-friendly CORS) as fallback when zippopotam misses.
 * @param {string} iso2
 * @param {string} zipNormalized
 */
export async function geocodeZipOpenMeteo(iso2, zipNormalized) {
    try {
        const params = new URLSearchParams({
            name: zipNormalized,
            count: "1",
            language: "en",
            format: "json",
        });
        if (iso2) params.set("country", iso2.toUpperCase());
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
        if (!res.ok) return null;
        const data = await res.json();
        const hit = data.results?.[0];
        if (!hit) return null;
        return { lat: hit.latitude, lng: hit.longitude };
    } catch {
        return null;
    }
}

export async function geocodeZipWithFallback(iso2, zipNormalized) {
    let coords = await geocodeZipZippopotam(iso2, zipNormalized);
    if (coords) return coords;
    await new Promise((r) => setTimeout(r, 250));
    coords = await geocodeZipOpenMeteo(iso2, zipNormalized);
    return coords;
}

/**
 * Collect unique cache keys from products.
 * @param {object[]} products
 * @returns {string[]}
 */
export function collectUniqueZipKeysFromProducts(products) {
    const set = new Set();
    if (!products) return [];
    for (const p of products) {
        const k = getProductZipCacheKey(p);
        if (k) set.add(k);
    }
    return Array.from(set);
}

/**
 * Build lat/lng map for all keys (sequential to respect Nominatim rate limits if fallback runs).
 * @param {string[]} keys
 * @param {(done: number, total: number) => void} [onProgress]
 */
export async function buildZipCoordMap(keys, onProgress) {
    /** @type {Record<string, { lat: number, lng: number } | null>} */
    const map = {};
    const total = keys.length;
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const pipe = key.indexOf("|");
        const iso2 = pipe >= 0 ? key.slice(0, pipe) : "";
        const zip = pipe >= 0 ? key.slice(pipe + 1) : "";
        if (!iso2 || !zip) {
            map[key] = null;
            onProgress?.(i + 1, total);
            continue;
        }
        const coords = await geocodeZipWithFallback(iso2, zip);
        map[key] = coords;
        onProgress?.(i + 1, total);
        await new Promise((r) => setTimeout(r, 40));
    }
    return map;
}

/**
 * @param {object} product
 * @param {{ lat: number, lng: number }} anchor
 * @param {number} radiusMiles
 * @param {Record<string, { lat: number, lng: number } | null>} zipCoordMap
 * @param {boolean} includeWithoutZip
 */
export function productMatchesRadius(product, anchor, radiusMiles, zipCoordMap, includeWithoutZip) {
    const key = getProductZipCacheKey(product);
    if (!key) {
        return includeWithoutZip;
    }
    const coords = zipCoordMap[key];
    if (!coords) {
        return false;
    }
    const d = haversineMiles(anchor.lat, anchor.lng, coords.lat, coords.lng);
    return d <= radiusMiles;
}
