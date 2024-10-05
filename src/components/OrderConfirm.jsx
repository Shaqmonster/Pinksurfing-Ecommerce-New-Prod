import { CheckBadgeIcon } from "@heroicons/react/24/outline";
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OrderConfirm = () => {
  const navigate = useNavigate();
  useEffect(() => {
    setTimeout(() => {
      navigate("/");
    }, 1500);
  }, []);

  return (
    <div className=" fixed top-0 left-0 w-full h-screen dark:bg-black flex items-center justify-center z-50">
      <div className=" w-[95%] sm:w-[500px] h-[300px] flex flex-col text-center justify-center items-center bg-white dark:bg-gray-900 dark:border dark:border-white/80  rounded-md">
        <CheckBadgeIcon className=" text-purple-700 dark:text-purple-500 w-[104px] mb-1" />
        <h2 className=" font-bold text-black/80 dark:text-[#f5f5f5] text-[27px]">
          Order Placed Successfully!!
        </h2>
        <p className=" font-medium text-black/70 dark:text-[#f5f5f5] mt-1 text-[16.2px]">
          Thank You for shoping at PinkSurfing :) <br></br>
          A confirmation mail has been sent to you.
        </p>
      </div>
    </div>
  );
};

export default OrderConfirm;
