import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/** Calm not-found page: say what happened, then help the person carry on. */
const NotFound = () => {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const search = (e) => {
    e.preventDefault();
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-ps-bg px-4 py-16 text-center">
      <p className="text-sm font-medium text-ps-meta mb-3">Page not found</p>
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink mb-3">
        This page isn’t here anymore
      </h1>
      <p className="max-w-md text-ps-fg2 mb-8">
        The link may be old, or the page has moved. Try a search, or head back to the shop.
      </p>
      <form onSubmit={search} role="search" className="flex w-full max-w-md gap-2 mb-4">
        <label htmlFor="nf-search" className="sr-only">
          Search the marketplace
        </label>
        <input
          id="nf-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search products and stores"
          className="flex-1 min-h-[48px] rounded-xl border border-ps-border bg-ps-surface px-4 text-ink placeholder-ps-meta outline-none focus:ring-2 focus:ring-ps-focus"
        />
        <button type="submit" className="min-h-[48px] rounded-xl bg-ps-action px-5 font-semibold text-white">
          Search
        </button>
      </form>
      <Link to="/" className="min-h-[44px] leading-[44px] text-sm text-ps-fg2 hover:text-ink">
        Go to the home page
      </Link>
    </div>
  );
};

export default NotFound;
