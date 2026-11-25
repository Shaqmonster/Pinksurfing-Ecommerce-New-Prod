import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { ethers } from "ethers";
import Web3Modal from "web3modal";
import { motion } from "framer-motion";
import { 
  ArrowLeftCircleIcon, 
  WalletIcon, 
  ArrowDownTrayIcon, 
  ShareIcon 
} from "@heroicons/react/24/outline";

// Contexts
import { authContext } from "../../context/authContext";
import { useInAppWallet } from "../../context/inAppWalletContext";

// Components
import InAppWalletBalanceCard from "../gigs/InAppWalletBalanceCard";
import WalletTxHistoryCard from "../gigs/WalletTxHistoryCard";
import { useAccessToken } from "../../hooks/useAccessToken";

const ProfileUserWallet = () => {
  const accessToken = useAccessToken();
  const navigate = useNavigate();
  const [cookies] = useCookies(["access_token"]);
  const { address } = useInAppWallet();

  // Legacy/Manual Deposit States
  const [walletAddress, setWalletAddress] = useState("");
  const [asset, setAsset] = useState("eth");

  // Web3 Connection Logic
  async function connectWallet() {
    try {
      const web3Modal = new Web3Modal({ cacheProvider: false });
      const instance = await web3Modal.connect();
      // ethers v6: BrowserProvider (ethers.providers.Web3Provider is v5-only)
      const provider = new ethers.BrowserProvider(instance);
      console.log("Connected to:", provider);
    } catch (error) {
      console.error("Wallet connection failed", error);
    }
  }

  // Fetch Manual Deposit Addresses
  const getDepositAddress = async () => {
    if (!accessToken) return;
    try {
      const res = await axios.get("https://auth.pinksurfing.com/api/crypto/wallet/", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = res.data.data;
      if (asset === "eth") setWalletAddress(data.eth_deposit);
      else if (asset === "btc") setWalletAddress(data.btc_deposit);
      else if (asset === "usdt") setWalletAddress(data.eth_deposit);
      else if (asset === "ps") setWalletAddress(data.ps_wallet);
    } catch (error) {
      console.error("Error fetching deposit address", error);
    }
  };

  useEffect(() => {
    getDepositAddress();
  }, [accessToken, asset]);

  return (
    <div className="min-h-screen bg-ps-bg text-ps-fg2 py-8 px-4 font-sen">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <ArrowLeftCircleIcon
            onClick={() => navigate("/")}
            className="cursor-pointer w-8 h-8 text-purple-400 hover:text-purple-300 transition-colors"
          />
          <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">MY WALLET</h2>
        </div>

        {/* New Modular Cards */}
        <InAppWalletBalanceCard />
        
        {/* Manual Inbound Protocol (Merged from dev) */}
        <div className="bg-ps-surface border border-ink/5 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <h3 className="text-xl font-black text-ink uppercase tracking-tighter mb-8 border-b border-ink/5 pb-4">
            Manual Deposit Protocol
          </h3>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/30">Asset</label>
                <select
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full bg-ink/[0.03] border border-ink/5 rounded-xl py-3 px-4 text-ink outline-none focus:border-purple-500/40"
                >
                  <option value="eth">ETH (Ethereum)</option>
                  <option value="btc">BTC (Bitcoin)</option>
                  <option value="usdt">USDT (Tether)</option>
                  <option value="ps">MYBIZ (Native)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink/30">Receiving Address</label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={walletAddress}
                    className="w-full bg-ink/[0.03] border border-ink/5 rounded-xl py-3 px-4 text-sm text-ps-meta"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(walletAddress)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-ink/40 hover:text-ink"
                  >
                    <ShareIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={connectWallet}
                className="flex-1 py-4 bg-transparent border border-ink/10 hover:border-ink/30 text-ink font-bold rounded-xl flex items-center justify-center gap-3 transition-all"
              >
                <WalletIcon className="w-5 h-5 text-purple-400" />
                Connect Web3
              </motion.button>
            </div>
          </div>
        </div>

        <WalletTxHistoryCard address={address} title="Recent Transactions" />

        <div className="rounded-xl border border-ps-border bg-ps-surface p-4 text-sm text-ps-fg2">
          <p>
            Need to setup your wallet? Go to{" "}
            <Link className="text-purple-300 hover:text-purple-200 underline" to="/gighub">
              GigHub setup
            </Link>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileUserWallet;