import React from "react";
import {
  IoBagHandleOutline,
  IoBriefcaseOutline,
  IoBusinessOutline,
  IoCarSportOutline,
  IoHomeOutline,
} from "react-icons/io5";

// Shown when a listing has no photo. The old fallback (/emptyCart.png, an empty-cart icon)
// read as an error, and a bare initial read as a blank tile (UAT P3.4). This shows an icon for
// the kind of listing, its category and a clear "photo coming soon" line.
const PLACEHOLDER_KIND = {
  residential: { Icon: IoHomeOutline, tint: "from-sky-900/50 to-purple-900/40" },
  commercial: { Icon: IoBusinessOutline, tint: "from-indigo-900/50 to-slate-900/40" },
  business: { Icon: IoBriefcaseOutline, tint: "from-amber-900/40 to-purple-900/40" },
  vehicle: { Icon: IoCarSportOutline, tint: "from-emerald-900/40 to-slate-900/40" },
  product: { Icon: IoBagHandleOutline, tint: "from-purple-900/50 to-pink-900/40" },
};

export function placeholderKind(product) {
  const slug = `${product?.category?.slug || ""} ${product?.subcategory?.slug || ""}`.toLowerCase();
  if (slug.includes("residential")) return "residential";
  if (slug.includes("commercial")) return "commercial";
  if (slug.includes("business")) return "business";
  if (/vehicle|car|auto|motor/.test(slug)) return "vehicle";
  return "product";
}

/**
 * Pass a product, or for other listings (e.g. off-market deals) pass kind / label / name.
 * kind: residential | commercial | business | vehicle | product.
 */
const NoImagePlaceholder = ({ product, kind, label, name: nameProp, note = "Photo coming soon" }) => {
  const name = String(nameProp ?? product?.name ?? "").trim();
  const category = label ?? (product?.subcategory?.name || product?.category?.name || "");
  const { Icon, tint } = PLACEHOLDER_KIND[kind && PLACEHOLDER_KIND[kind] ? kind : placeholderKind(product)];
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br ${tint} text-center px-3`}
      aria-label={name ? `${name} (no photo yet)` : "No photo yet"}
      role="img"
    >
      <span className="flex items-center justify-center w-12 h-12 rounded-full bg-ink/10 ring-1 ring-ink/15">
        <Icon className="text-2xl text-ink/70" aria-hidden="true" />
      </span>
      {category && (
        <span className="text-[10px] uppercase tracking-wider text-ink/55 line-clamp-1">{category}</span>
      )}
      {note && <span className="text-[10px] text-ink/40">{note}</span>}
    </div>
  );
};

export default NoImagePlaceholder;
