// src/pages/NotFound.js
import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-center">
      <div className="flex flex-grow flex-col items-center justify-center px-4">
        <img
          src="/logo.jpg"
          alt="PinkSurfing"
          className="w-32 h-32 md:w-40 md:h-40 object-contain mb-8 rounded-2xl opacity-90"
        />
        <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
          OOPS !! Page not found
        </h1>
        <p className="text-lg mb-6 text-black dark:text-white">
          Sorry, the page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center min-h-[44px] px-6 py-2 rounded-xl bg-[var(--ps-primary)] text-white font-semibold hover:bg-[var(--ps-purple-dark)] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
