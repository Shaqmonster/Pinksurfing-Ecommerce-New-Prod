import React from "react";

const CSS = `
.deal-filters{margin-bottom:20px;}
.deal-cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;}
.deal-cat{padding:8px 14px;border-radius:20px;font-size:12px;font-weight:600;cursor:pointer;border:1.5px solid #2a2a33;background:#141418;color:#b0b0c0;transition:all .15s;}
.deal-cat.active,.deal-cat:hover{border-color:#f0318a;color:#f0318a;background:rgba(240,49,138,.08);}
.deal-tags{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
.deal-tag{padding:5px 10px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;border:1px solid #2a2a33;background:#1c1c22;color:#66667a;}
.deal-tag.active{border-color:#f0318a;color:#f0318a;}
.deal-sort-row{display:flex;justify-content:flex-end;align-items:center;gap:8px;}
.deal-sort-row label{font-size:12px;color:#66667a;}
.deal-sort{padding:8px 12px;border-radius:6px;border:1px solid #2a2a33;background:#141418;color:#f0f0f4;font-size:13px;}
`;

const CATEGORIES = [
  { id: "", label: "All Deals" },
  { id: "residential", label: "Residential" },
  { id: "commercial", label: "Commercial" },
  { id: "multi_family", label: "Multi-Family" },
  { id: "land", label: "Land" },
  { id: "industrial", label: "Industrial" },
  { id: "wholesale", label: "Wholesale" },
];

const SORT_OPTIONS = [
  { value: "spread_desc", label: "Highest Spread" },
  { value: "deadline_asc", label: "Deadline Soonest" },
  { value: "newest", label: "Newest" },
  { value: "asking_asc", label: "Lowest Asking" },
];

export default function DealFilterBar({
  propertyClass,
  onPropertyClassChange,
  selectedTags,
  onTagToggle,
  sort,
  onSortChange,
  availableTags = [],
}) {
  return (
    <>
      <style>{CSS}</style>
      <div className="deal-filters">
        <div className="deal-cats">
          {CATEGORIES.map((c) => (
            <button
              key={c.id || "all"}
              type="button"
              className={`deal-cat ${propertyClass === c.id ? "active" : ""}`}
              onClick={() => onPropertyClassChange(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        {availableTags.length > 0 && (
          <div className="deal-tags">
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`deal-tag ${selectedTags.includes(tag) ? "active" : ""}`}
                onClick={() => onTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
        <div className="deal-sort-row">
          <label htmlFor="deal-sort">Sort</label>
          <select
            id="deal-sort"
            className="deal-sort"
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}
