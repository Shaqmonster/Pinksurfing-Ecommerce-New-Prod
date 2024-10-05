// src/components/ChannelsForSale.jsx
import React, { useEffect, useState } from "react";

const ChannelsForSale = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchChannels = async () => {
      setLoading(true);
      try {
        setTimeout(() => {
          setChannels([]);  // Since you're not rendering, this can be kept empty
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  return null;  // No rendering
};

export default ChannelsForSale;