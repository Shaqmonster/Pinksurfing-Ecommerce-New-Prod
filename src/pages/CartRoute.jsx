import { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { authContext } from "../context/authContext";

/**
 * /cart used to show "Page not found": the cart is a drawer, not a page. Open the drawer
 * and land on the homepage (or sign-in for guests) so links and bookmarks to /cart work.
 */
export default function CartRoute() {
  const { setIsCartOpen, authToken } = useContext(authContext);

  useEffect(() => {
    if (authToken) setIsCartOpen(true);
  }, [authToken, setIsCartOpen]);

  // The drawer only renders for signed-in shoppers (Header.jsx), so send guests to sign in.
  return <Navigate to={authToken ? "/" : "/signin"} replace />;
}
