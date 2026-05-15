import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";

const VisitPaymentReturn = () => {
  const [params] = useSearchParams();
  const visitId = params.get("visit_id");
  const slug = params.get("slug");

  const productLink = useMemo(() => {
    if (slug) return `/product/productDetail/${encodeURIComponent(slug)}`;
    return "/";
  }, [slug]);

  return (
    <>
      <div className="min-h-[60vh] flex items-center justify-center px-4 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-md w-full rounded-3xl border border-purple-500/20 bg-white dark:bg-gray-900 p-10 text-center shadow-xl shadow-purple-500/10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-2xl font-black">
            ✓
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
            Payment received
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
            Your visit request{visitId ? ` (${String(visitId).slice(0, 8)}…)` : ""}{" "}
            is being confirmed. The listing agent has been emailed with your details.
            You can return to the listing to track status or reschedule.
          </p>
          <Link
            to={productLink}
            className="inline-flex items-center justify-center w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm uppercase tracking-widest transition-colors"
          >
            Back to listing
          </Link>
        </div>
      </div>
    </>
  );
};

export default VisitPaymentReturn;
