import { useContext } from "react";
import { useCookies } from "react-cookie";
import { authContext } from "../context/authContext";
import { resolveAccessToken } from "../utils/authSession";

/** Single source for API auth: context → react-cookie → localStorage. */
export function useAccessToken() {
  const { authToken } = useContext(authContext);
  const [cookies] = useCookies(["access_token"]);
  return resolveAccessToken(authToken, cookies.access_token);
}

/** True when any auth source has a valid session token. */
export function useIsAuthenticated() {
  return Boolean(useAccessToken());
}
