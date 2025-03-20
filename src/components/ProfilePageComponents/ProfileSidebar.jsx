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
            {/* Mobile dropdown toggle */}
            <div
                className="hidden max-md:flex items-center justify-between px-4 py-3 bg-[#0E0F13] border border-gray-700 rounded-lg cursor-pointer"
                onClick={toggleSidebar}
            >
                <div className="flex items-center gap-3">
                    {activeItem && (
                        <>
                            <img
                                src={activeItem.icon}
                                alt={activeItem.altText}
                                className="object-contain w-5 aspect-square"
                            />
                            <div className="text-white font-medium">{activeItem.label}</div>
                        </>
                    )}
                </div>
                <svg
                    className={`w-5 h-5 text-white transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {/* Full sidebar (desktop) / Dropdown menu (mobile) */}
            <div
                className={`
          flex flex-col px-0 py-4 bg-[#0E0F13] rounded border border-gray-700 border-solid shadow-2xl 
          min-w-[240px] w-[264px] max-md:w-full max-md:absolute max-md:left-0 max-md:right-0 max-md:mt-1
          ${isOpen ? 'max-md:block' : 'max-md:hidden'}
        `}
            >
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
    );
}