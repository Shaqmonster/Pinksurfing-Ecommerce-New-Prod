import React from "react";
import { startGoogleSignIn } from "../../utils/googleAuth";
import { authBtnGoogle } from "./authTheme";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
    <path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303C33.876 32.657 29.405 36 24 36c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.314 0 6.314 1.229 8.611 3.389l6.067-6.067C34.359 4.091 29.454 2 24 2 12.955 2 4 10.955 4 22s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
    />
    <path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.314 0 6.314 1.229 8.611 3.389l6.067-6.067C34.359 4.091 29.454 2 24 2 12.955 2 4 10.955 4 22c0 1.341.138 2.673.389 3.917L6.306 14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.382 0-9.836-3.445-11.393-8.246l-6.52 5.015C7.556 39.556 15.218 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
    />
  </svg>
);

const GoogleSignInButton = ({
  disabled = false,
  label = "Continue with Google",
  nextUrl,
}) => (
  <button
    type="button"
    disabled={disabled}
    onClick={() => startGoogleSignIn(nextUrl)}
    className={authBtnGoogle}
  >
    <GoogleIcon />
    {label}
  </button>
);

export default GoogleSignInButton;
