import React from 'react';

const ImageZoom = ({ imageUrl, x, y }) => {
  const zoomStyle = {
    backgroundImage: `url(${imageUrl})`,
    backgroundPosition: `${x}% ${y}%`,
    backgroundSize: '200%',
  };

  return (
    <div
      className="hidden md:block fixed right-[8%] top-[55%] transform -translate-y-1/2 w-[47%] h-[77vh] bg-no-repeat bg-cover border border-white z-50"
      style={zoomStyle}
    />
  );
};

export default ImageZoom;
