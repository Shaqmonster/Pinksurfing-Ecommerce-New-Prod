import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authContext } from "../context/authContext";
import { dataContext } from "../context/dataContext";
import {
  completeGoogleSignIn,
  getGoogleSignInErrorMessage,
} from "../utils/googleAuth";

const GoogleAuthComplete = () => {
  const navigate = useNavigate();
  const { login, setIsProfileOpen } = useContext(authContext);
  const { handleError, handleSuccess } = useContext(dataContext);
  const [message, setMessage] = useState("Completing Google sign-in...");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const errorCode = params.get("sso_error");
        if (errorCode) {
          throw new Error(errorCode);
        }

        const session = await completeGoogleSignIn();
        const ok = await login(session.access, session.refresh);
        if (!ok) {
          throw new Error("google_auth_failed");
        }

        setIsProfileOpen(false);

        if (cancelled) return;
        handleSuccess("Signed in with Google");

        const redirectPath = sessionStorage.getItem("redirectAfterLogin");
        if (redirectPath) {
          sessionStorage.removeItem("redirectAfterLogin");
          window.location.href = redirectPath;
          return;
        }
        navigate("/", { replace: true });
      } catch (error) {
        if (cancelled) return;
        const code = error?.message || "google_auth_failed";
        handleError(getGoogleSignInErrorMessage(code));
        setMessage("Redirecting to sign in...");
        navigate("/signin", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [handleError, handleSuccess, login, navigate, setIsProfileOpen]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-4">
        <img src="/loading.svg" alt="Loading" className="w-16 h-16 mx-auto" />
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  );
};

export default GoogleAuthComplete;
