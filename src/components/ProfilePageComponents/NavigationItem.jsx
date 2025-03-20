import * as React from "react";

export function NavigationItem({ icon, label, isActive, altText, tabIndex = 0 }) {
    const baseClasses = "flex gap-3 items-center px-6 py-2.5 w-full duration-[0.2s] transition-[background-color]";
    const activeClasses = isActive ? "font-semibold text-white bg-purple-500" : "text-gray-200 no-underline hover:bg-gray-800";

    return (
        <div
            className={`${baseClasses} ${activeClasses} cursor-pointer`}
            role="button"
            tabIndex={tabIndex}
            aria-current={isActive ? "page" : undefined}
        >
            <img
                src={icon}
                alt={altText}
                className="object-contain w-5 aspect-square"
            />
            <div>{label}</div>
        </div>
    );
}
