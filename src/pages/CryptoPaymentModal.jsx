import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { IoClose } from "react-icons/io5";
import { useCookies } from "react-cookie";

const CryptoPaymentModal = ({
  order_id,
  isOpen,
  onClose,
  cartProducts,
  singleOrderProduct,
  closePaymentModal,
}) => {
  const [walletAddresses, setWalletAddresses] = useState({
    eth: "",
    btc: "",
    usdt: "",
    ps: "",
  });
  const [receiverAddress, setReceiverAddress] = useState(
    "0x97b5ad3e470bc30d707bfeb57060c37d9efafab2"
  );
  const [selectedCurrency, setSelectedCurrency] = useState("eth");
  const [convertedPrice, setConvertedPrice] = useState(null);
  const [gasFee, setGasFee] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [cookies, removeCookie] = useCookies([]);

  const fetchWalletAddresses = async () => {
    if (!Cookies.get("token")) {
      navigate("/signin");
      return;
    }

    try {
      const response = await axios.get(
        "https://auth.pinksurfing.com/api/crypto/wallet/",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Cookies.get("token")}`,
          },
        }
      );

      setWalletAddresses({
        eth: response.data.data.eth_deposit,
        btc: response.data.data.btc_deposit,
        usdt: response.data.data.eth_deposit, // Adjust as needed for your data structure
        ps: response.data.data.ps_wallet,
      });
    } catch (error) {
      console.error("Failed to fetch wallet addresses", error);
      toast.error(error.response?.data?.message || "An error occurred", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const fetchConvertedPrice = async (price, symbol) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/payments/convert-price-to-crypto/`,
        {
          params: {
            price: parseFloat(price),
            symbol: symbol,
          },
        }
      );

      setConvertedPrice(response.data.converted_price);
    } catch (error) {
      console.error("Failed to convert price", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGasFee = async (orderId, chainId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/payments/pay-with-wallet/${orderId}/`,
        {
          params: {
            chain_id: chainId,
          },
        }
      );
      if (chainId === "ps") {
        setGasFee("0.03");
      } else {
        setGasFee(response.data.gas_fees.estimatedBaseFee);
      }
    } catch (error) {
      console.error("Failed to fetch gas fee", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletAddresses();
  }, []);

  useEffect(() => {
    let totalPrice = 0;
    if (singleOrderProduct) {
      console.log(singleOrderProduct);
      totalPrice =
        singleOrderProduct.additional_price > 0
          ? singleOrderProduct.additional_price
          : singleOrderProduct?.unit_price;
    } else {
      totalPrice = cartProducts.reduce(
        (total, product) =>
          total +
          (product.additional_price > 0
            ? product.additional_price
            : product.product.unit_price),
        0
      );
    }
    fetchConvertedPrice(totalPrice, selectedCurrency.toUpperCase());
  }, [selectedCurrency, cartProducts, singleOrderProduct]);

  useEffect(() => {
    if (order_id && selectedCurrency) {
      const chainId = getChainIdForCurrency(selectedCurrency);
      fetchGasFee(order_id, chainId);
    }
  }, [order_id, selectedCurrency]);

  const getChainIdForCurrency = (currency) => {
    switch (currency.toLowerCase()) {
      case "eth":
        return "1";
      case "btc":
        return "137";
      case "usdt":
        return "1";
      case "ps":
        return "ps";
      default:
        return "1";
    }
  };

  const handleSend = async () => {
    toast.info("Sending crypto...", { autoClose: 2000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success("Crypto sent successfully!");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    onClose();
  };

  const payWithEscrow = async () => {
    try {
      setLoading(true);
      toast.info("Connecting to wallet...", { autoClose: 2000 });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const response = await axios.post(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/payments/pay-with-escrow/${order_id}/`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${cookies.access_token}`,
          },
        }
      );

      if (response.data && response.data.success === true) {
        toast.success("Payment with Escrow initiated");
        await new Promise((resolve) => setTimeout(resolve, 2000));
        navigate("/orders");
      }
      onClose();
      closePaymentModal()
    } catch (error) {
      console.error("Error initiating payment with Escrow:", error);
      toast.error("Error connecting to wallet");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <img
          src="/loading.svg"
          alt="loading"
          className="w-[50px] h-[50px] sm:w-[70px] sm:h-[70px] object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 bg-black bg-opacity-40 backdrop-blur-sm flex justify-center items-center p-4 ${
        isOpen ? "" : "hidden"
      }`}
    >
      <div className="bg-[#2d1e5f] dark:bg-gray-800 w-full max-w-md rounded-lg shadow-xl overflow-hidden p-4">
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-lg text-white dark:text-gray-200 font-bold">
            Buy with Crypto
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-600 hover:text-gray-200"
          >
            <IoClose size={24} />
          </button>
        </div>
        {singleOrderProduct ? (
          <div key={singleOrderProduct._id} className="mb-4">
            <div className="flex justify-center">
              <img
                src={singleOrderProduct.image1}
                alt={singleOrderProduct.name}
                className="w-24 h-24 object-contain"
              />
            </div>
            <p className="text-sm text-gray-300 dark:text-gray-400 mb-2">
              Product Name: {singleOrderProduct.name}
            </p>
            <p className="text-sm text-gray-300 dark:text-gray-400 mb-4">
              Cost: $
              {singleOrderProduct.additional_price > 0
                ? Number(singleOrderProduct.unit_price) +
                  Number(singleOrderProduct.additional_price)
                : singleOrderProduct?.unit_price}
            </p>
          </div>
        ) : (
          cartProducts?.map((product, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-center">
                <img
                  src={product.product.image1}
                  alt={product.product.name}
                  className="w-24 h-24 object-contain"
                />
              </div>
              <p className="text-sm text-gray-300 dark:text-gray-400 mb-2">
                Product Name: {product.product.name}
              </p>
              <p className="text-sm text-gray-300 dark:text-gray-400 mb-4">
                Cost: $
                {product.additional_price > 0
                  ? Number(product.product.unit_price) +
                    Number(product.additional_price)
                  : product.product.unit_price}
              </p>
            </div>
          ))
        )}
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-gray-300 dark:text-gray-400 bg-[#342872] dark:bg-gray-700 mb-4"
        >
          <option value="eth">Ethereum (ETH)</option>
          <option value="usdt">Tether (USDT)</option>
          <option value="btc">Bitcoin (BTC)</option>
          <option value="ps">MyBiz</option>
        </select>
        <div className="mb-4">
          <p className="text-sm text-gray-300 dark:text-gray-400">
            Your Wallet Address:
          </p>
          <input
            type="text"
            value={walletAddresses[selectedCurrency.toLowerCase()] || ""}
            readOnly
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-gray-300 dark:text-gray-400 bg-[#342872] dark:bg-gray-700"
            placeholder="Your wallet address will appear here"
          />
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-300 dark:text-gray-400">
            Receiver's Wallet Address:
          </p>
          <input
            type="text"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-gray-300 dark:text-gray-400 bg-[#342872] dark:bg-gray-700"
            placeholder="Enter receiver's wallet address"
          />
        </div>
        <div className="mb-4">
          <p className="text-sm text-gray-300 dark:text-gray-400">
            Converted Price: {convertedPrice || "Loading..."}{" "}
            {selectedCurrency.toUpperCase()}
          </p>
        </div>
        <button
          onClick={handleSend}
          className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white font-medium py-3 px-4 rounded-md mb-4"
        >
          Send
        </button>
        <button
          className="w-full bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700 text-white dark:text-white font-medium py-3 px-4 rounded-md mb-4"
          onClick={payWithEscrow}
        >
          <span className="text-gray-200">Pay with Escrow</span>
        </button>
        <div className="text-sm text-gray-300 dark:text-gray-400 mb-4">
          Gas Fee Estimated:{" "}
          <span className="font-medium">{gasFee || "Loading..."}</span>
        </div>
      </div>
    </div>
  );
};

export default CryptoPaymentModal;
