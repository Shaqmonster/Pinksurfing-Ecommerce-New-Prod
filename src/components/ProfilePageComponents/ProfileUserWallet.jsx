import React, { useContext, useEffect, useState } from "react";
import { useCookies } from "react-cookie";
import { authContext } from "../../context/authContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeftCircleIcon, WalletIcon, ArrowDownTrayIcon, ShareIcon } from "@heroicons/react/24/outline";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { motion } from "framer-motion";

const ProfileUserWallet = () => {
  const { isUserWalletOpen, isDarkMode, setIsUserWalletOpen } = useContext(authContext);
  const [cookies, removeCookie] = useCookies([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [asset, setAsset] = useState("eth");
  const navigate = useNavigate();

  const providerOptions = {};

  async function connectWallet() {
    try {
      let web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions,
      });
      const web3ModalInstance = await web3Modal.connect();
      const web3ModalProvider = new ethers.providers.Web3Provider(web3ModalInstance);
      console.log(web3ModalProvider);
    } catch (error) {
      console.log(error);
    }
  }

  const GetWalletAddress = async () => {
    if (!cookies.access_token) {
      navigate("/signin");
      return;
    }
    axios
      .get("https://auth.pinksurfing.com/api/crypto/wallet/", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.access_token}`,
        },
      })
      .then((response) => {
        if (asset === "eth") setWalletAddress(response.data.data.eth_deposit);
        else if (asset === "btc") setWalletAddress(response.data.data.btc_deposit);
        else if (asset === "usdt") setWalletAddress(response.data.data.eth_deposit);
        else if (asset === "ps") setWalletAddress(response.data.data.ps_wallet);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    GetWalletAddress();
  }, [cookies, asset]);

  return (
    <div className="font-sen">
      <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-8 relative z-10">
            <div className="flex items-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.1, x: -5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => navigate("/")}
                    className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white hover:bg-white/10 transition-all"
                >
                    <ArrowLeftCircleIcon className="w-6 h-6" />
                </motion.button>
                <div className="space-y-1">
                    <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em]">Financial Hub</p>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase">User Wallet</h2>
                </div>
            </div>
            <div className="hidden md:flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl">
                <WalletIcon className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-black text-white tracking-widest uppercase">
                    Secure Asset Management
                </span>
            </div>
        </div>

        <div className="max-w-4xl mx-auto space-y-12 relative z-10 pb-12">
            <div className="bg-white/[0.03] border border-white/5 p-10 md:p-14 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-600/10 transition-all duration-700"></div>
                
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-10 border-b border-white/5 pb-6">
                    Inbound Transfer Protocol
                </h3>

                <div className="space-y-10">
                    {/* Asset Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">
                            Deployment Asset
                        </label>
                        <div className="relative group">
                            <select
                                onChange={(e) => setAsset(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-6 px-10 text-white font-black text-lg outline-none appearance-none focus:bg-white/[0.06] focus:border-purple-500/40 transition-all duration-500 cursor-pointer"
                            >
                                <option value="eth" className="bg-[#0E0F13]">ETH (Ethereum)</option>
                                <option value="btc" className="bg-[#0E0F13]">BTC (Bitcoin)</option>
                                <option value="usdt" className="bg-[#0E0F13]">USDT (Tether)</option>
                                <option value="ps" className="bg-[#0E0F13]">MYBIZ (Native)</option>
                            </select>
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-purple-400 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Deposit Address */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">
                            Secure Receiving Address
                        </label>
                        <div className="relative group">
                            <input
                                type="text"
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-6 px-10 text-white font-bold text-lg outline-none pr-32 transition-all duration-500"
                                value={walletAddress}
                                readOnly
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(walletAddress);
                                        // add toast here if needed
                                    }}
                                    className="p-4 bg-white/5 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                                    title="Copy to Clipboard"
                                >
                                    <ShareIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2">
                            Initialization Amount
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-6 px-10 text-white font-black text-lg outline-none focus:bg-white/[0.06] focus:border-purple-500/40 transition-all duration-500 placeholder:text-white/5"
                                step="0.01"
                                placeholder="0.00"
                            />
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest uppercase">
                                {asset}
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex flex-col sm:flex-row items-center gap-6">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full sm:flex-1 py-6 bg-white text-black font-black rounded-2xl transition-all duration-500 uppercase tracking-[0.2em] text-xs shadow-2xl flex items-center justify-center gap-4 hover:bg-purple-50"
                        >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                            Initiate Deposit
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={connectWallet}
                            className="w-full sm:flex-1 py-6 bg-transparent border border-white/10 hover:border-white/30 text-white/40 hover:text-white font-black rounded-2xl transition-all duration-500 uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4"
                        >
                            <WalletIcon className="w-4 h-4" />
                            Connect Web3 Entity
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileUserWallet;
