export const navigationItems = [
  {
    icon: "https://cdn.builder.io/api/v1/image/assets/c068411fd41a4439a16ce94f0609cbfd/7f7788b961d63d59fa45f46b66d2acd7cb34407703c4417260da35d165ce69e8?apiKey=c068411fd41a4439a16ce94f0609cbfd&",
    label: "Profile",
    altText: "Profile icon"
  },
  {
    icon: "https://cdn.builder.io/api/v1/image/assets/c068411fd41a4439a16ce94f0609cbfd/a72786292b87314fec82585e2a39272f85c961e2d8f150f3f35f9b607aad3418?apiKey=c068411fd41a4439a16ce94f0609cbfd&",
    label: "Shopping Cart",
    altText: "Shopping Cart icon"
  },
  {
    icon: "https://cdn.builder.io/api/v1/image/assets/c068411fd41a4439a16ce94f0609cbfd/39b8c40c20e0b529209744b08fe1692a55fa5225bbfa69c9ed382480d9b02823?apiKey=c068411fd41a4439a16ce94f0609cbfd&",
    label: "Wishlist",
    altText: "Wishlist icon"
  },
  {
    icon: "https://cdn.builder.io/api/v1/image/assets/c068411fd41a4439a16ce94f0609cbfd/7b3e05eaddd97eb84412e1bb37d1e60fcbee19dcb94a0808828ca0ca59546029?apiKey=c068411fd41a4439a16ce94f0609cbfd&",
    label: "Store",
    altText: "My Store"
  },
  {
    icon: "https://cdn.builder.io/api/v1/image/assets/c068411fd41a4439a16ce94f0609cbfd/503b26d08a7c2530a335a7b98a65e9fc342cea829581729b963d74162db53069?apiKey=c068411fd41a4439a16ce94f0609cbfd&",
    label: "Orders",
    isActive: true,
    altText: "My Order icon"
  },

  {
    icon: "https://cdn.builder.io/api/v1/image/assets/c068411fd41a4439a16ce94f0609cbfd/f0c6fe10706ff1475945313dccdf751c4b29bea5296270e940c6e7f0a0e93167?apiKey=c068411fd41a4439a16ce94f0609cbfd&",
    label: "Wallet",
    altText: "My Wallet icon"
  },
  {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a78bfa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'/%3E%3Cpolyline points='14 2 14 8 20 8'/%3E%3Cline x1='16' y1='13' x2='8' y2='13'/%3E%3Cline x1='16' y1='17' x2='8' y2='17'/%3E%3C/svg%3E",
    label: "My Bids",
    altText: "My Bids icon",
    route: "/my-bids"
  },
  {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23a78bfa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cline x1='22' y1='2' x2='11' y2='13'/%3E%3Cpolygon points='22 2 15 22 11 13 2 9 22 2'/%3E%3C/svg%3E",
    label: "My Offers",
    altText: "My Offers icon",
    route: "/bids/my-offers"
  },
  {
    icon: "https://cdn.builder.io/api/v1/image/assets/c068411fd41a4439a16ce94f0609cbfd/3fc4c0132983cb6b227f3de3497ad40d404bad5dca20bdc8ea57cd932cb4a535?apiKey=c068411fd41a4439a16ce94f0609cbfd&",
    label: "Log-out",
    altText: "Log-out icon",
    /** Not a profile tab — handled in ProfileSidebar via auth Logout() */
    action: "logout",
  },
];