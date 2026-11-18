import { useEffect, useState } from "react";
import { getGigCategories } from "../api/gigs";
import { JOB_CATEGORIES } from "../constants/jobCategories";

const FALLBACK = {
  categories: JOB_CATEGORIES,
  slugByName: {},
};

const STORE_KEY = "ps-job-categories-v1";

function readStored() {
  try {
    const raw = sessionStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.categories ? parsed : null;
  } catch {
    return null;
  }
}

// Paint the last known list at once (this tab), then refresh it from the server.
let cached = typeof window !== "undefined" ? readStored() : null;
let refreshed = false;

/**
 * Jobs use the same categories as GigHub gigs (/api/gigs/categories/), so a job and a gig in
 * the same field share one category. Returns { categories: { name: [subcategory names] },
 * slugByName: { name: slug } }. Falls back to the built-in list if the request fails.
 */
export function useJobCategories() {
  const [state, setState] = useState(cached || FALLBACK);

  useEffect(() => {
    if (refreshed) return undefined;
    let cancelled = false;
    getGigCategories()
      .then((res) => {
        const list = res.data?.results ?? res.data ?? [];
        if (!Array.isArray(list) || list.length === 0) return;
        const categories = {};
        const slugByName = {};
        list.forEach((c) => {
          if (!c?.name) return;
          categories[c.name] = (c.subcategories || [])
            .filter((s) => s?.is_active !== false)
            .map((s) => s.name);
          slugByName[c.name] = c.slug;
        });
        cached = { categories, slugByName };
        refreshed = true;
        try {
          sessionStorage.setItem(STORE_KEY, JSON.stringify(cached));
        } catch {
          /* storage unavailable */
        }
        if (!cancelled) setState(cached);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
