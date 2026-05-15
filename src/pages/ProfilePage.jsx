import * as React from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "../components/ProfilePageComponents/ProfileSidebar";
import { dataContext } from "../context/dataContext";
import ProfileDetails from "../components/ProfilePageComponents/ProfileDetails";
import ProfileCartPage from "../components/ProfilePageComponents/ProfileCartPage";
import ProfileWishlist from "../components/ProfilePageComponents/ProfileWishlist";
import ProfileMyStore from "../components/ProfilePageComponents/ProfileMyStore";
import ProfileUserWallet from "../components/ProfilePageComponents/ProfileUserWallet";
import AllOrders from "../components/ProfilePageComponents/AllOrders";

export default function ProfilePage() {
  const location = useLocation();
  const { profileActiveIndex, setProfileActiveIndex } = React.useContext(dataContext);

  React.useEffect(() => {
    // Restore tab from navigation state or default to Profile (0)
    const fromTab = location.state?.fromTab;
    setProfileActiveIndex(typeof fromTab === "number" ? fromTab : 0);
    
    // Reset history state to ensure refresh defaults to tab 0
    window.history.replaceState({}, document.title);
  }, [location.state, setProfileActiveIndex]);

  const profileComponents = {
    0: <ProfileDetails />,
    1: <ProfileCartPage />,
    2: <ProfileWishlist />,
    3: <ProfileMyStore />,
    4: <AllOrders />,
    5: <ProfileUserWallet />
  };

  return (
    <div className="relative min-h-screen bg-[#0E0F13] overflow-hidden selection:bg-purple-500/30">
      {/* Required Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;600&display=swap"
        rel="stylesheet"
      />

      {/* Premium Background Atmosphere (Merged from dev branch) */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-pink-900/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-900/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-8 lg:gap-16 px-6 md:px-12 lg:px-20 pt-16 pb-32 min-h-screen text-gray-200">
        {/* Sidebar Container */}
        <div className="sidebar-container flex-shrink-0 lg:sticky lg:top-16 self-start">
          <Sidebar />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0 transition-all duration-700 ease-in-out">
          {profileComponents[profileActiveIndex] || null}
        </div>
      </div>
    </div>
  );
}