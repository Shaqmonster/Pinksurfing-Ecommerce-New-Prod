// SearchForm.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { IoMenuOutline } from "react-icons/io5";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";

const SearchForm = () => {
  const {
    isDarkMode,
    search,
    setSearch,
    isMobileCategoryOpen,
    setIsMobileCategoryOpen,
  } = useContext(authContext);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const pathParts = window.location.pathname.split("/");
  const lastPart = pathParts[pathParts.length - 1];

  useEffect(() => {
    if (lastPart === "search") {
      inputRef.current.focus();
    }
  }, [lastPart]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (search.trim() === "") {
      inputRef.current.setCustomValidity("Please enter something to search.");
      inputRef.current.reportValidity();
    } else {
      inputRef.current.setCustomValidity(""); // Clear any custom validity message
      navigate("/search");
    }
  };

  return (
    <div
      className={`relative w-full py-3 flex sm:flex-row gap-2 sm:items-center justify-start px-[2.4%] sm:px-[2%] ${
        isDarkMode ? "bg-black text-white" : "bg-white text-black"
      }`}
    >
      <div
        onClick={() => {
          setIsMobileCategoryOpen(isMobileCategoryOpen === true ? false : true);
        }}
        className="bg-[#2d1e5f] w-fit flex items-center gap-2 px-2.5 py-3 rounded-md cursor-pointer"
      >
        <IoMenuOutline className="text-white text-[21px] sm:text-[22px] dark:text-white" />
        <p className="hidden sm:block w-max text-white">Shop By Categories</p>
      </div>

      <form
        className={`flex items-start gap-5 md:w-1/3 rounded-lg ${
          isDarkMode
            ? "bg-[#2d1e5f] border border-black/30 text-white p-1"
            : "bg-white border border-black text-black p-1"
        }`}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Search products by name, category, subcategory..."
          className={`border-none outline-none py-1 px-2 rounded-lg w-full ${
            isDarkMode ? "bg-[#2d1e5f] text-white" : "bg-white text-black"
          }`}
          id="search"
          name="search"
          value={search}
          ref={inputRef}
          onChange={(e) => {
            setSearch(e.target.value);
            inputRef.current.setCustomValidity("");
          }}
        />

        <button
          type="submit"
          className={`px-2 py-1.5 rounded-md ${
            isDarkMode ? "bg-[#3a2e6e] text-white" : "bg-[#2d1e5f] text-white"
          }`}
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchForm;
