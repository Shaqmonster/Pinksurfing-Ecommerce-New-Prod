// SearchForm.jsx
import React, { useContext, useEffect, useRef, useState } from "react";
import { IoMenuOutline } from "react-icons/io5";
import { authContext } from "../context/authContext";
import { useNavigate } from "react-router-dom";

const SearchForm = () => {
  const {
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
    } else if(search === ""){
      inputRef.current.setCustomValidity("Please enter something to search.");
      inputRef.current.reportValidity();
    } else {
      inputRef.current.setCustomValidity(""); // Clear any custom validity message
      navigate("/search");
    }
  };

  return (
    <div
      className={`relative w-full py-3 flex sm:flex-row gap-2 sm:items-center justify-start px-[2.4%] sm:px-[2%] bg-ps-bg text-ink`}
    >
      {/* <div
        onClick={() => {
          setIsMobileCategoryOpen(isMobileCategoryOpen === true ? false : true);
        }}
        className="bg-ps-action-soft w-fit flex items-center gap-2 px-2.5 py-3 rounded-md cursor-pointer"
      >
        <IoMenuOutline className="text-ink text-[21px] sm:text-[22px] dark:text-white" />
        <p className="hidden sm:block w-max text-ink">Shop By Categories</p>
      </div> */}

      <form
        className={`flex items-start gap-5 md:w-1/3 rounded-lg bg-ps-action-soft border border-black/30 text-ink p-1`}
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Search products by name, category, subcategory..."
          className={`border-none outline-none py-1 px-2 rounded-lg w-full bg-ps-action-soft text-ink`}
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
          className={`px-2 py-1.5 rounded-md bg-ps-action-soft text-ink`}
        >
          Search
        </button>
      </form>
    </div>
  );
};

export default SearchForm;
