import React from "react";

const ChannelsForSale = () => {
  // Hardcoded channel data
  const channels = [
    {
      id: 1,
      name: "National Geographic",
      image:
        "/new/national_geography.jpg",
    },
    {
      id: 2,
      name: "Discovery Channel",
      image:
        "/new/discovery.jpeg",
    },
    {
      id: 3,
      name: "CNN",
      image:
        "/new/cnn.png",
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0E0F13] text-black dark:text-white py-8 px-4">
      <h1 className="text-3xl font-playfair font-bold text-center text-[#B881FF] mb-8">
        Channels for sale
      </h1>
      <div className="flex flex-wrap justify-center gap-6">
        {channels.map((channel) => (
          <div
            key={channel.id}
            className="bg-white text-black rounded-lg shadow-lg overflow-hidden w-64"
          >
            <img
              src={channel.image}
              alt={channel.name}
              className="w-full h-40 object-cover"
            />
            <div className="p-2 text-center">
              <p className="text-sm font-semibold">{channel.name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChannelsForSale;
