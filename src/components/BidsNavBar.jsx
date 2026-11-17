import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IoHome,
  IoStorefrontOutline,
  IoAddCircleOutline,
  IoReceiptOutline,
  IoPaperPlaneOutline,
} from "react-icons/io5";

// GigHub jobs (freelance work). Product requests ("bids") live in the Shopping Mall instead.
const NAV_ITEMS = [
  { to: "/gigs", label: "GigHub", Icon: IoHome },
  { to: "/gigs/jobs", label: "Find Jobs", Icon: IoStorefrontOutline },
  { to: "/gigs/jobs/post", label: "Post a Job", Icon: IoAddCircleOutline },
  { to: "/gigs/jobs/mine", label: "My Jobs", Icon: IoReceiptOutline },
  { to: "/gigs/jobs/proposals", label: "My Proposals", Icon: IoPaperPlaneOutline },
];

const BidsNavBar = () => {
  const { pathname } = useLocation();

  return (
    <div className="bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2 -mx-1">
          {NAV_ITEMS.map(({ to, label, Icon }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  active
                    ? "bg-gradient-to-r from-purple-600/20 to-pink-500/20 text-pink-400 border border-pink-500/30"
                    : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                }`}
              >
                <Icon className={`text-sm ${active ? "text-pink-400" : ""}`} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default BidsNavBar;
