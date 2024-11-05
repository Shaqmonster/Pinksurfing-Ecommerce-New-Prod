import React, { useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { MdClose } from "react-icons/md";
import { FaCreditCard, FaWallet } from "react-icons/fa";
import CryptoPaymentModal from "./CryptoPaymentModal";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PaymentOptionsModal = ({
  isOpen,
  onClose,
  order_id,
  cartProducts,
  singleOrderProduct,
}) => {
  const [cookies, removeCookie] = useCookies([]);
  const navigate = useNavigate();
  const [cryptoModalOpen, setCryptoModalOpen] = useState(false);

  const createPaymentLink = async () => {
    if (!cookies.token) {
      navigate("/signin");
      return;
    }

    try {
      const response = await axios.post(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/payments/create-payment-link/${order_id}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.token}`,
          },
        }
      );

      const paymentLink = response.data.payment_link.url;
      console.log("Payment link created:", paymentLink);

      // window.location.href = paymentLink;
      window.open(paymentLink, "_blank");
      onClose();
    } catch (error) {
      console.error("Error creating payment link:", error);
    }
  };

  const openCryptoModal = () => {
    setCryptoModalOpen(true);
  };

  const closeCryptoModal = () => {
    setCryptoModalOpen(false);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl overflow-hidden p-4 relative">
        <MdClose
          className="text-gray-500 absolute top-4 right-4 cursor-pointer"
          size={24}
          onClick={onClose}
        />
        <div className="flex flex-col items-center space-y-3">
          {" "}
          {/* Reduced space between elements */}
          <h2 className="text-lg text-black dark:text-white font-bold">
            Choose Payment Method
          </h2>
          <button
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg flex items-center justify-center"
            onClick={createPaymentLink} target="_blank"
          >
            <FaCreditCard className="mr-2" /> Pay with Credit/Debit Card
          </button>
          <button
            className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg flex items-center justify-center"
            onClick={openCryptoModal}
          >
            <FaWallet className="mr-2" /> Pay with Wallet
          </button>
          <CryptoPaymentModal
            order_id={order_id}
            isOpen={cryptoModalOpen}
            onClose={closeCryptoModal}
            cartProducts={cartProducts}
            singleOrderProduct={singleOrderProduct}
            closePaymentModal={onClose}
          />
          <p className="text-gray-500 text-sm">
            Choose your preferred payment method above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentOptionsModal;
