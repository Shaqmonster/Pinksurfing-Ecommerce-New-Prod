import React from "react";
import { Link } from "react-router-dom";

const YouMightAlsoLike = ({ allProducts, productId, product, currency }) => {
  if (!allProducts || allProducts.length <= 1) {
    return null;
  }

  return (
    <div className="h-[full] col-span-2 lg:block">
      <h4 className="raleway text-[14px] font-[600] text-[#000] dark:text-white mb-3 ">
        You might also like
      </h4>
      <div className="w-[220px] h-full flex flex-col gap-5 ">
        {allProducts
          ?.filter((product) => product.id !== productId)
          .slice(0, 3)
          .map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-2 p-2 border rounded-lg shadow-sm"
            >
              <Link
                to={`/product/productDetail/${product.slug}?productId=${product.id}`}
                className=" flex gap-2 raleway"
              >
                <img
                  className=" h-[60px] w-[60px] "
                  src={
                    product.image1 ||
                    "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
                  }
                  alt="product-img"
                />
                <div className=" flex flex-col">
                <p className="text-xs font-[500] mt-2 mb-1 text-[#5a5858] dark:text-gray-400">
                {product.name.length > 17 ? `${product.name.slice(0, 17)}...` : product.name}
              </p>
                  <div className=" flex ">
         
                    <p className="font-[600] text-xs dark:text-gray-400 text-[#000]">
                      {currency} <span>{product.mrp}</span>
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          ))}
      </div>
    </div>
  );
};

export default YouMightAlsoLike;