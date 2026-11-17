import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { authContext } from "../context/authContext";

// Tab index of ProfileCartPage in ProfilePage.jsx (keep in sync with ProfileItems.js).
const PROFILE_CART_TAB = 2;

/**
 * /cart has no page of its own. Signed-in shoppers land on the full cart page (Profile > Cart)
 * so the link does what it says; guests go to sign-in first.
 */
export default function CartRoute() {
  const { authToken } = useContext(authContext);

  if (!authToken) return <Navigate to="/signin" replace />;
  return <Navigate to="/profile" replace state={{ fromTab: PROFILE_CART_TAB }} />;
}
