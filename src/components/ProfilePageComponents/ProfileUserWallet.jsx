import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";

import { useInAppWallet } from "../../context/inAppWalletContext";
import InAppWalletBalanceCard from "../gigs/InAppWalletBalanceCard";
import InAppWalletSetupBanner from "../gigs/InAppWalletSetupBanner";
import WalletTxHistoryCard from "../gigs/WalletTxHistoryCard";

const ProfileUserWallet = () => {
  const navigate = useNavigate();
  const { address } = useInAppWallet();

  return (
    <div className="min-h-screen bg-[#0E0F13] text-gray-100 py-8 px-4 font-sen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <ArrowLeftCircleIcon
            onClick={() => navigate("/")}
            className="cursor-pointer w-8 h-8 text-purple-400 hover:text-purple-300 transition-colors"
          />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">My Wallet</h2>
            <p className="text-white/45 text-sm mt-1">GigHub in-app wallet · local Anvil testnet</p>
          </div>
        </div>

        <InAppWalletSetupBanner />

        <InAppWalletBalanceCard inlineFunding />

        <WalletTxHistoryCard address={address} title="Recent on-chain transactions" />

        <div className="rounded-xl border border-white/10 bg-[#13131a] p-4 text-sm text-gray-300">
          <p>
            Browse gigs on{" "}
            <Link className="text-purple-300 hover:text-purple-200 underline" to="/gighub">
              GigHub
            </Link>
            . Escrow checkout uses your in-app wallet on Anvil (chain 31337).
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileUserWallet;
