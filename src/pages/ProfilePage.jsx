import * as React from "react";
import { Sidebar } from "../components/ProfileSidebar";
import OrderDetails from "../components/OrderDetails";

export default function ProfilePage() {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600&display=swap"
        rel="stylesheet"
      />
      <svg width="601" height="1031" viewBox="0 0 601 1031" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-[10%] left-0 z-[0] pointer-events-none hidden lg:block">
        <g filter="url(#filter0_f_1_3194)">
          <circle cx="85.5" cy="515.5" r="207.5" fill="#8B33FE" fill-opacity="0.4" />
        </g>
        <defs>
          <filter id="filter0_f_1_3194" x="-430" y="0" width="1031" height="1031" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="154" result="effect1_foregroundBlur_1_3194" />
          </filter>
        </defs>
      </svg>
      <div className="flex gap-10 px-72 pt-10 pb-20 min-h-screen text-sm text-gray-200 bg-[#0E0F13] max-md:px-5 max-md:py-10 max-sm:flex-col max-sm:p-5">
        <Sidebar />
        <div className="overflow-hidden flex-1 bg-[#0E0F13] rounded">
          <OrderDetails/>
        </div>
      </div>
    </>
  );
}