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
                    layoutId="activeTabBackground"
                    className="absolute inset-0 bg-white/[0.08] backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
                />
            )}
            
            <div className="relative z-10 flex items-center gap-4 w-full">
                <img
                    src={icon}
                    alt={altText}
                    className={`object-contain w-5 h-5 transition-all duration-500 ${isActive ? 'brightness-200 scale-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'opacity-40 group-hover:opacity-100'}`}
                />
                <div className={`text-[13px] font-bold tracking-tight transition-all duration-500 ${isActive ? 'text-white translate-x-1' : 'text-white/40 group-hover:text-white/80'}`}>
                    {label}
                </div>
            </div>
        </motion.div>
    );
}
