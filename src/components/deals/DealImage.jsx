import React, { useState } from "react";
import NoImagePlaceholder from "../ui/NoImagePlaceholder";

const kindFor = (propertyClass = "") => {
  const c = String(propertyClass).toLowerCase();
  if (c.includes("commercial")) return "commercial";
  if (c.includes("business")) return "business";
  return "residential";
};

/**
 * Deal photo, or a clear "no photo" tile when the deal has none or the image fails to load
 * (retest P3.4: a missing image used to be a flat pink box). Fills its positioned parent.
 */
export default function DealImage({ src, propertyClass, alt = "" }) {
  const [failed, setFailed] = useState(null);
  if (src && failed !== src) {
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    );
  }
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <NoImagePlaceholder
        kind={kindFor(propertyClass)}
        label={propertyClass ? `${String(propertyClass).replace(/_/g, " ")} deal` : "Off-market deal"}
        name="Off-market deal"
        note="No photos yet"
      />
    </div>
  );
}
