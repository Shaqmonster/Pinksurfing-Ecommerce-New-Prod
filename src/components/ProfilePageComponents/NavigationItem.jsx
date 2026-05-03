import * as React from "react";
import { motion } from "framer-motion";

export function NavigationItem({ icon, label, isActive, altText, tabIndex = 0 }) {
    return (
        <motion.div
            whileHover={{ x: 4 }}
            className={`
                relative flex gap-3 items-center px-4 py-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 group
                ${isActive 
                    ? "text-white bg-gradient-to-r from-purple-600 to-purple-500 shadow-lg shadow-purple-500/20" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"}
            `}
            role="button"
            tabIndex={tabIndex}
            aria-current={isActive ? "page" : undefined}
        >
            {isActive && (
                <motion.div 
                    layoutId="activeTabGlow"
                    className="absolute inset-0 bg-purple-500/10 rounded-xl blur-sm"
                />
            )}
            
            <img
                src={icon}
                alt={altText}
                className={`object-contain w-5 aspect-square relative z-10 transition-all duration-200 ${isActive ? 'brightness-110' : 'opacity-70 group-hover:opacity-100'}`}
            />
            <div className={`text-sm font-medium relative z-10 ${isActive ? 'font-semibold' : ''}`}>{label}</div>
        </motion.div>
    );
}
