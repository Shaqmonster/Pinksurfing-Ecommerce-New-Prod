import React, { useContext } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import ProductDetailPage from "./pages/ProductDetailPage";
import "react-toastify/dist/ReactToastify.css";
import Cart from "./components/Cart";
import Wishlist from "./components/Wishlist";
import { authContext } from "./context/authContext";
import Checkout from "./pages/Checkout";
import Orders from "./components/Orders";
import CategoriesMobile from "./components/CategoriesMobile";
import SearchPage from "./pages/SearchPage";
import Shop from "./pages/Shop";
import VendorDetailsForm from "./components/VendorDetailsForm";
import ShopByCategory from "./pages/ShopByCategory";
import Filter from "./pages/FilterPage";
import SingleOrderForm from "./components/SingleOrderForm";
import ForgotPassword from "./pages/ForgotPassword";
import SubCategories from "./pages/SubCategories";
import Summary from "./pages/Summary";
import Payment from "./components/Payment";
import Completion from "./components/Completion";
import OrderConfirm from "./components/OrderConfirm";
import OrderFailed from "./components/OrderFailed";
import ShoppingMallNew from "./pages/ShoppingMallNew";
import UserOnSiteWallet from "./components/UserWallet";
import ProfilePage from "./pages/ProfilePage";
import ShopByStore from "./pages/ShopByStore";
import StoreProducts from "./pages/StoreProducts";
import NotFound from "./pages/404Page";
import ScrollToTop from "./components/ScrollToTop";
import Contact from "./pages/ContactUs";
import Footer from "./components/Footer";
import Header from "./components/Header";
import CategoryProducts from "./pages/CategoryProducts";

function App() {
  const {
    isCartOpen,
    isDarkMode,
    openDrawer,
    isWishlistOpen,
    isVendorFormOpen,
    isSingleOrderFormOpen,
    isMobileCategoryOpen,
  } = useContext(authContext);

  const location = useLocation();
  const hideHeaderFooter =
    location.pathname === "/signup" || location.pathname === "/signin" || location.pathname === "/forgotPassword";

  return (
    <main className={`${isDarkMode && "dark"} `}>
      <ScrollToTop />
      {!hideHeaderFooter && <Header />}
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/shoppingMall/:category" element={<ShoppingMallNew />} />
        <Route path="/shopByCategory" element={<ShopByCategory />} />
        <Route path="/shopByStore" element={<ShopByStore />} />
        <Route path="/store/:slug" element={<StoreProducts />} />
        <Route path="/subCategories" element={<SubCategories />} />
        <Route path="/categoryProducts" element={<CategoryProducts />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/summary/:orderId" element={<Summary />} />
        <Route path="/forgotPassword" element={<ForgotPassword />} />
        <Route
          path="/product/productDetail/:slug"
          element={<ProductDetailPage />}
        />
        <Route path="/success" element={<OrderConfirm />} />
        <Route path="/payment_failed" element={<OrderFailed />} />
        <Route path="/completion" element={<Completion />} />
        <Route path="/userwallet" element={<UserOnSiteWallet />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!hideHeaderFooter && <Footer />}
    </main>
  );
}

export default App;
