// src/pages/NotFound.js
import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";

const NotFound = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-black text-center">
      <div className="flex flex-grow flex-col items-center justify-center">
        <img
          src="https://admiral.digital/wp-content/uploads/2023/08/404_page-not-found.png"
          alt="404 Not Found"
          className="w-3/4 md:w-1/2 lg:w-1/3 mb-8"
        />
        <h1 className="text-4xl font-bold mb-4 text-black dark:text-white">
          OOPS !! Page not found
        </h1>
        <p className="text-lg mb-6 text-black dark:text-white">
          Sorry, the page you are looking for does not exist.
        </p>
        <Link
          to="/"
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
