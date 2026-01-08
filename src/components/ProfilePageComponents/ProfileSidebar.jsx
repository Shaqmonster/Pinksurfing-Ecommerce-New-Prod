import * as React from "react";
import { NavigationItem } from "./NavigationItem";
import { navigationItems } from "../../utils/ProfileItems";
import { dataContext } from "../../context/dataContext";

export function Sidebar() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [activeIndex, setActiveIndex] = React.useState(0);
    const sidebarRef = React.useRef(null);
    const {setProfileActiveIndex} = React.useContext(dataContext);
    
    // Close sidebar when clicking outside
    React.useEffect(() => {
        function handleClickOutside(event) {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const handleItemClick = (index) => {
        setActiveIndex(index);
        setIsOpen(false);
        setProfileActiveIndex(index);
        console.log(activeIndex)
    };

    // Get active item for mobile display
    const activeItem = navigationItems[activeIndex];

    return (
        <div ref={sidebarRef} className="relative z-10">
            {/* Mobile: Quick Access Icons Bar */}
            <div className="hidden max-md:block mb-3">
                <div className="flex items-center justify-between gap-2 p-2 bg-[#0E0F13] rounded-xl border border-gray-700/50">
                    {navigationItems.slice(0, 5).map((item, index) => (
                        <button
                            key={item.label}
                            onClick={() => handleItemClick(index)}
                            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                                activeIndex === index 
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30' 
                                    : 'hover:bg-white/10'
                            }`}
                        >
                            <img
                                src={item.icon}
                                alt={item.altText}
                                className="object-contain w-5 h-5"
                            />
                            <span className={`text-[10px] mt-1 truncate max-w-[50px] ${
                                activeIndex === index ? 'text-white font-semibold' : 'text-gray-400'
                            }`}>
                                {item.label.split(' ')[0]}
                            </span>
                        </button>
                    ))}
                    {/* More button */}
                    <button
                        onClick={toggleSidebar}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-[60px] ${
                            isOpen ? 'bg-white/20' : 'hover:bg-white/10'
                        }`}
                    >
                        <div className="relative">
                            <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
                        </div>
                        <span className="text-[10px] mt-1 text-gray-400">More</span>
                    </button>
                </div>
            </div>

            {/* Mobile: Expanded Menu Dropdown */}
            <div
                className={`
                    hidden max-md:block overflow-hidden transition-all duration-300 ease-in-out
                    ${isOpen ? 'max-h-[500px] opacity-100 mb-4' : 'max-h-0 opacity-0'}
                `}
            >
                <div className="bg-[#0E0F13] rounded-xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-white/10">
                        <h3 className="text-sm font-semibold text-white">All Menu Options</h3>
                        <p className="text-xs text-gray-400">Manage your account</p>
                    </div>
                    <div className="py-2">
                        {navigationItems.map((item, index) => (
                            <div key={item.label} onClick={() => handleItemClick(index)}>
                                <NavigationItem
                                    {...item}
                                    tabIndex={index + 1}
                                    isActive={activeIndex === index}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Desktop: Full Sidebar */}
            <div className="max-md:hidden">
                <div className="bg-[#0E0F13] rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden min-w-[240px] w-[264px]">
                    {/* Sidebar Header */}
                    <div className="px-5 py-4 bg-gradient-to-r  border-b border-white/10">
                        <h3 className="text-base font-bold text-white">My Account</h3>
                        <p className="text-xs text-gray-400 mt-0.5">Manage your preferences</p>
                    </div>
                    
                    {/* Navigation Items */}
                    <div className="py-2">
                        {navigationItems.map((item, index) => (
                            <div key={item.label} onClick={() => handleItemClick(index)}>
                                <NavigationItem
                                    {...item}
                                    tabIndex={index + 1}
                                    isActive={activeIndex === index}
                                />
                            </div>
                        ))}
                    </div>
                    
                </div>
            </div>
        </div>
    );
}