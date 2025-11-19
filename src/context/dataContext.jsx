import { createContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import axios from "axios";
import { authContext } from "./authContext";
import { toast } from "react-toastify";

export const dataContext = createContext();

export const DataProvider = ({ children }) => {
  const navigate = useNavigate();
  const [cookies, removeCookie] = useCookies([]);
  const { search,setUser,Logout } = useContext(authContext);

  // UseStates -------------------------------------------------------------------
  let [searchedProducts, setSearchedProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [shopName, setShopName] = useState([]);
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [additionalAttribute, setAdditionalAttribute] = useState({
    value: "",
    price: 0,
  });
  // toast functions ------------------------------------------------------------
  const [profileActiveIndex, setProfileActiveIndex] = useState(0);
  useEffect(()=>{
    if(profileActiveIndex === 6){
        Logout();     
    }
  },[profileActiveIndex])
  const handleError = (err) => {
    console.error("Error occurred",err);
    toast.error(err, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  }
  const handleSuccess = (msg) => {
    console.log("success",msg);
    toast.success(msg, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  }


    
  // search products ------------------------------------------------------------
  const searchProducts = async (subLink, address) => {
    axios
      .get(
        `${import.meta.env.VITE_SERVER_URL}/api/product/filter-products${subLink}`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      )
      .then((response) => {
        navigate(address);
        // console.log(response.data);
        setProducts(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // fetch products by shop_name
// fetch products by shop_name
const getVendorProducts = async (shaqshop) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_SERVER_URL}/api/product/vendor-products/${shaqshop}/`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token}`,
        },
      }
    );
    console.log(response.data); // Log the response data
    setProducts(response.data);
  } catch (error) {
    console.error(error);
  }
};

  // fetch All products --------------------------------------------------------
  const getAllProducts = async () => {
    axios
      .get(`${import.meta.env.VITE_SERVER_URL}/api/product/all-products/`, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        setProducts(response.data.Products);
      })
      .catch((error) => {
        console.error(error);
      });
  };
  return (
    <dataContext.Provider
      value={{
        handleError,
        handleSuccess,
        products,
        setProducts,
        cartProducts,
        shopName,
        setShopName,
        wishlistProducts,
        setWishlistProducts,
        setCartProducts,
        additionalAttribute,
        setAdditionalAttribute,
        getAllProducts,
        searchedProducts,
        setSearchedProducts,
        searchProducts,
        getVendorProducts,
        profileActiveIndex,
        setProfileActiveIndex,
      }}
    >
      {children}
    </dataContext.Provider>
  );
};
