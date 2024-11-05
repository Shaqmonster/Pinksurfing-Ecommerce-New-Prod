import React from "react";
import { Link } from "react-router-dom";

const YouMightAlsoLike = ({ allProducts, productId, product, currency }) => {
  if (!allProducts || allProducts.length <= 1) {
    return null;
  }

  const calculateDiscount = (mrp, unitPrice) => {
    const numericMrp = Number(mrp);
    const numericUnitPrice = Number(unitPrice);
    if (isNaN(numericMrp) || isNaN(numericUnitPrice) || numericMrp === 0) {
      return 0;
    }
    return ((numericMrp - numericUnitPrice) / numericMrp) * 100;
  };

  return (
    <div className="h-[full] col-span-2 lg:block">
      <h4 className="raleway text-[14px] font-[600] text-[#000] dark:text-white mb-3 ">
        You might also like
      </h4>
      <div className="w-[220px] h-full flex flex-col gap-5 ">
        {allProducts
          ?.filter((product) => product.id !== productId)
          .slice(0, 3)
          .map((product) => {
            const discountPercentage = calculateDiscount(
              product.mrp,
              product.unit_price
            ).toFixed(2);

            return (
              <div
                key={product.id}
                className="flex items-center gap-2 p-2 border rounded-lg shadow-sm"
              >
                <Link
                  to={`/product/productDetail/${product.slug}?productId=${product.id}`}
                  className="flex gap-2 raleway"
                >
                  <img
                    className="h-[60px] w-[60px]"
                    src={
                      product.image1 ||
                      "https://w7.pngwing.com/pngs/1008/139/png-transparent-cosmetics-advertising-cosmetics-advertising-beauty-others.png"
                    }
                    alt="product-img"
                  />
                  <div className="flex flex-col">
                    <p className="text-xs font-[500] mt-2 mb-1 text-[#5a5858] dark:text-gray-400">
                      {product.name.length > 17
                        ? `${product.name.slice(0, 17)}...`
                        : product.name}
                    </p>
                    <div className="flex">
                      <p className="font-[600] text-xs dark:text-gray-400 text-[#000]">
                        {currency} <span>{Number(product.unit_price).toFixed(2)}</span>
                      </p>
                      {discountPercentage > 0 && (
                        <>
                          <span className="ml-1 line-through text-xs text-gray-400">
                            {currency}{Number(product.mrp).toFixed(2)}
                          </span>
                          <span className="text-xs text-red-500 ml-1">
                            ({discountPercentage}% off)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default YouMightAlsoLike;
