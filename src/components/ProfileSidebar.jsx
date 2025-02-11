import * as React from "react";
import { NavigationItem } from "./NavigationItem";
import { navigationItems } from "../utils/ProfileItems";

export function Sidebar() {
    return (
        <div className="flex flex-col px-0 py-4 bg-[#0E0F13] rounded border border-gray-200 border-solid shadow-2xl min-w-[240px] w-[264px] max-md:w-60 max-sm:w-full">
            {navigationItems.map((item, index) => (
                <NavigationItem
                    key={item.label}
                    {...item}
                    tabIndex={index + 1}
                />
            ))}
        </div>
    );
}