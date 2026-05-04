import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeftCircleIcon } from "@heroicons/react/24/outline";
import { useInAppWallet } from "../../context/inAppWalletContext";
import InAppWalletBalanceCard from "../gigs/InAppWalletBalanceCard";
import WalletTxHistoryCard from "../gigs/WalletTxHistoryCard";

const ProfileUserWallet = () => {
  const navigate = useNavigate();
  const { address } = useInAppWallet();

  return (
    <div className="min-h-screen bg-[#0E0F13] text-gray-100 py-8 px-4 font-sen">
      <div className="max-w-4xl mx-auto space-y-5">
        <h2 className="font-bold flex items-center gap-2 mb-6 text-xl sm:text-2xl md:text-3xl text-purple-400">
          <ArrowLeftCircleIcon
            onClick={() => {
              navigate("/");
            }}
            className="cursor-pointer w-6 h-6 sm:w-7 sm:h-7 text-purple-400 hover:text-purple-300 transition-colors"
          />
          MY WALLET
        </h2>

        <InAppWalletBalanceCard />
        <WalletTxHistoryCard address={address} title="My Wallet Recent Transactions" />

        <div className="rounded-xl border border-gray-700 bg-[#13131a] p-4 text-sm text-gray-300">
          <p>
            Need to create/import your in-app wallet first? Go to{" "}
            <Link className="text-purple-300 hover:text-purple-200" to="/gighub">
              GigHub wallet setup
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileUserWallet;
