import React, { useEffect, useState } from "react";
import "./utils/setupAxiosAuth.js";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext.jsx";
import { ThemeProvider, useTheme } from "./context/themeContext.jsx";
import { DataProvider } from "./context/dataContext.jsx";
import { CookiesProvider } from "react-cookie";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LogRocket from "logrocket";
import { SHOW_CRYPTO_WALLET } from "./config/featureFlags.js";

LogRocket.init("vdxhjc/pinksurfing-ecom");

function AppProviders({ children }) {
  const [WalletProvider, setWalletProvider] = useState(null);

  useEffect(() => {
    if (!SHOW_CRYPTO_WALLET) return undefined;
    let cancelled = false;
    import("./context/inAppWalletContext.jsx").then((mod) => {
      if (!cancelled) setWalletProvider(() => mod.InAppWalletProvider);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!SHOW_CRYPTO_WALLET || !WalletProvider) {
    return children;
  }
  return <WalletProvider>{children}</WalletProvider>;
}

function ThemedToasts() {
  const { resolvedTheme } = useTheme();
  return <ToastContainer theme={resolvedTheme} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CookiesProvider defaultSetOptions={{ path: "/" }}>
      <BrowserRouter>
        <ThemeProvider>
        <AuthProvider>
          <AppProviders>
            <DataProvider>
              <ThemedToasts />
              <App />
            </DataProvider>
          </AppProviders>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </CookiesProvider>
  </React.StrictMode>
);
