import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext.jsx";
import { DataProvider } from "./context/dataContext.jsx";
import { InAppWalletProvider } from "./context/inAppWalletContext.jsx";
import { CookiesProvider } from "react-cookie";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import LogRocket from 'logrocket';
LogRocket.init('vdxhjc/pinksurfing-ecom');


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CookiesProvider defaultSetOptions={{ path: "/" }}>
      <BrowserRouter>
        <AuthProvider>
          <InAppWalletProvider>
            <DataProvider>
              <ToastContainer />
              <App />
            </DataProvider>
          </InAppWalletProvider>
        </AuthProvider>
      </BrowserRouter>
    </CookiesProvider>
  </React.StrictMode>
);
