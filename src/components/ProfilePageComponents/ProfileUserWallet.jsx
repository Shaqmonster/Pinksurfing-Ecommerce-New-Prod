import React, { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { authContext } from "../../context/authContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "../Header";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

const ProfileUserWallet = () => {
  const { isUserWalletOpen, isDarkMode, setIsUserWalletOpen } =
    useContext(authContext);

  const [cookies, removeCookie] = useCookies([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [asset, setAsset] = useState("eth");

  const navigate = useNavigate();

  const providerOptions = {
    // coinbasewallet: {
    //   package: CoinbaseWalletSDK,
    //   options: {
    //     appName: "Pinksurfing"
    //   }
    // }
  };

  async function connectWallet() {
    try {
      let web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions,
      });
      const web3ModalInstance = await web3Modal.connect();
      const web3ModalProvider = new ethers.providers.Web3Provider(
        web3ModalInstance
      );
      console.log(web3ModalProvider);
    } catch (error) {
      console.log(error);
    }
  }

  const GetWalletAddress = async () => {
    console.log(cookies.token);
    if (!cookies.token) {
      navigate("/signin");
    }
    axios
      .get("https://auth.pinksurfing.com/api/crypto/wallet/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((response) => {
        console.log("yaham");
        console.log(response.data);
        if (asset === "eth") setWalletAddress(response.data.data.eth_deposit);
        else if (asset === "btc")
          setWalletAddress(response.data.data.btc_deposit);
        else if (asset === "usdt")
          setWalletAddress(response.data.data.eth_deposit);
        else if (asset === "ps") setWalletAddress(response.data.data.ps_wallet);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    GetWalletAddress();
  }, [cookies, asset, removeCookie]);

  return (
    <div className="min-h-screen bg-[#0E0F13] text-gray-100 py-8 px-4 font-sen">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-bold flex items-center gap-2 mb-6 text-xl sm:text-2xl md:text-3xl text-purple-400">
          <ArrowLeftCircleIcon
            onClick={() => {
              navigate("/");
            }}
            className="cursor-pointer w-6 h-6 sm:w-7 sm:h-7 text-purple-400 hover:text-purple-300 transition-colors"
          />
          USER WALLET
        </h2>

        <div className="bg-[#0E0F13] rounded-xl shadow-lg p-6 sm:p-8 md:p-10 border border-gray-700">
          <h1 className="text-xl sm:text-2xl font-semibold mb-8 text-center text-purple-300">
            Bring Funds into Wallet
          </h1>

          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label
                htmlFor="deposit-asset"
                className="text-base sm:text-lg font-medium text-gray-300 sm:w-1/3"
              >
                Asset to deposit
              </label>

              <select
                id="deposit-asset"
                name="deposit-asset"
                onChange={(e) => setAsset(e.target.value)}
                className="bg-gray-700 text-gray-200 w-full sm:w-2/3 p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 focus:outline-none transition-all"
              >
                <option value="eth">ETH</option>
                <option value="btc">BTC</option>
                <option value="usdt">USDT</option>
                <option value="ps">MYBIZ</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label
                htmlFor="deposit-address"
                className="text-base sm:text-lg font-medium text-gray-300 sm:w-1/3"
              >
                Deposit Address:
              </label>

              <div className="relative w-full sm:w-2/3">
                <input
                  type="text"
                  id="deposit-address"
                  name="deposit-address"
                  className="bg-gray-700 text-gray-200 w-full p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 focus:outline-none transition-all pr-10"
                  value={walletAddress}
                  readOnly
                />
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-purple-400 transition-colors"
                  title="Copy address"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label
                htmlFor="deposit-amount"
                className="text-base sm:text-lg font-medium text-gray-300 sm:w-1/3"
              >
                Deposit Amount:
              </label>

              <input
                type="number"
                id="deposit-amount"
                name="deposit-amount"
                className="bg-gray-700 text-gray-200 w-full sm:w-2/3 p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:ring focus:ring-purple-500/20 focus:outline-none transition-all"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="flex flex-col mt-8 space-y-4">
              <button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white py-3 px-6 rounded-lg font-medium shadow-lg hover:shadow-purple-500/20 transition-all mx-auto w-full sm:w-48">
                Deposit
              </button>

              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white py-3 px-6 rounded-lg font-medium shadow-lg hover:shadow-blue-500/20 transition-all mx-auto w-full sm:w-64"
              >
                Connect Existing Wallets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUserWallet;
