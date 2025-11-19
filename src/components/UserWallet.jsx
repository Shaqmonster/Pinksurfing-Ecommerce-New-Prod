import React, { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { authContext } from "../context/authContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Header from "./Header";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import CoinbaseWalletSDK from "@coinbase/wallet-sdk";

const UserOnSiteWallet = () => {
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
    console.log(cookies.access_token);
    if (!cookies.access_token) {
      navigate("/signin");
    }
    axios
      .get("https://auth.pinksurfing.com/api/crypto/wallet/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token}`,
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
    <>
      <h2 className=" font-bold flex items-center gap-0.5 mb-3 mt-5 ml-8 text-[21px] sm:text-[27px] text-purple-900 dark:text-purple-600">
        <ArrowLeftCircleIcon
          onClick={() => {
            navigate("/");
          }}
          className=" cursor-pointer block w-[27px] sm:w-[30px]  dark:text-[#f5f5f5]  top-1.5 "
        />
        USER WALLET
      </h2>
      <div className="mx-auto md:max-w-[35%] bg-gray-800 text-white p-10 rounded-lg">
        <h1 className="text-2xl font-semibold mb-8 flex justify-center">
          Bring Funds into wallet
        </h1>

        <div className="mb-4 flex">
          <label
            htmlFor="deposit-asset"
            className="block text-lg font-medium w-80"
          >
            Asset to deposit
          </label>

          <select
            id="deposit-asset"
            name="deposit-asset"
            onChange={(e) => setAsset(e.target.value)}
            className="bg-gray-700 text-white w-full p-2 rounded"
          >
            <option value="eth">ETH</option>
            <option value="btc">BTC</option>
            <option value="usdt">USDT</option>
            <option value="ps">MYBIZ</option>
            {/* Add other options here */}
          </select>
        </div>
        <div className="mb-4 flex">
          <label
            htmlFor="deposit-address"
            className="block text-lg font-medium w-80"
          >
            Deposit Address:
          </label>
          <input
            type="text"
            id="deposit-address"
            name="deposit-address"
            className="bg-gray-700 text-white w-full p-2 rounded"
            value={walletAddress}
          />
        </div>
        {/* <div className="mb-4 flex">
          <label
            htmlFor="wallet-address"
            className="block text-lg font-medium w-80"
          >
            Wallet Address:
          </label>
          <input
            type="text"
            id="wallet-address"
            name="wallet-address"
            className="bg-gray-700 text-white w-full p-2 rounded"
            value={walletAddress}
          />
        </div> */}
        <div className="mb-4 flex">
          <label
            htmlFor="deposit-amount"
            className="block text-lg font-medium w-80"
          >
            Deposit Amount:
          </label>
          <input
            type="number" // Change input type to "number"
            id="deposit-amount"
            name="deposit-amount"
            className="bg-gray-600 text-white w-full p-2 rounded"
            step="0.01" // Allow decimal values
            // value={""}
          />
        </div>
        <button className="bg-purple-700 text-white w-40 p-2 mt-7 rounded mx-auto block">
          Deposit
        </button>
        <button
          onClick={connectWallet}
          className="bg-blue-600 text-white w-64 p-2 mt-4 rounded mx-auto block hover:bg-blue-700 transition-colors duration-300"
        >
          Connect Your Existing Wallets
        </button>
      </div>
    </>
  );
};

export default UserOnSiteWallet;
