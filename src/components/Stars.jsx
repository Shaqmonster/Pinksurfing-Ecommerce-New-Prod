import { FaStar } from "react-icons/fa";
import { IoStarOutline } from "react-icons/io5";
import React from "react";




const Stars = ({ stars }) => {
    const ratingStars = Array.from({ length: 7 }, (elem, index) => {
        return (
            <div key={index}>
                {stars >= index + 1 ? (
                    <FaStar className=" dark:text-[#9747FF] text-[#9747FF]" />
                ) : (
                    <IoStarOutline className="text-black dark:text-white dark:[#9747FF] " />
                )}
            </div>
        );
    });
    return <div className=" flex items-center gap-0.5">{ratingStars}</div>;
};

export default Stars;