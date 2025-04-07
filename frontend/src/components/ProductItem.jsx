import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

const ProductItem = ({ id, image, name, price, stock, stockStatus }) => {
  const { currency, getStockStatus } = useContext(ShopContext);

  // Use provided stockStatus or calculate it
  const status = stockStatus || getStockStatus({ stock, isActive: true });

  return (
    <div className="relative">
      <Link to={`/product/${id}`} className="text-gray-700 cursor-pointer">
        <div className="overflow-hidden">
          <img
            src={image[0]}
            alt=""
            className="transition ease-in-out hover:scale-110"
          />
        </div>
        <p className="pt-3 pb-1 text-sm truncate">{name}</p>
        <p className="text-sm font-medium">
          {currency}
          {price}
        </p>
      </Link>

      {/* Stock status indicator */}
      {status?.lowStock && status?.inStock && (
        <div className="absolute top-2 right-2 bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-medium">
          {status.message}
        </div>
      )}

      {/* Only show out of stock if stock is explicitly 0 or status.inStock is explicitly false */}
      {status && status.inStock === false && (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
          <p className="bg-red-500 text-white px-3 py-1 rounded font-medium text-sm">
            Out of Stock
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductItem;
