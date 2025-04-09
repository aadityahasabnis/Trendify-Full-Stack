import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const ProductItem = ({ id, image, name, price, stock, stockStatus, bestseller, isActive }) => {
  const navigate = useNavigate();
  const { getStockStatus } = useContext(ShopContext);

  // Get stock status from props or calculate it with both stock and isActive
  const status = stockStatus || getStockStatus({ stock, isActive });

  return (
    <div className="relative group">
      <div
        className="cursor-pointer"
        onClick={() => navigate(`/product/${id}`)}
      >
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={image}
            alt={name}
            className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
          />

          {/* Bestseller Badge */}
          {bestseller && (
            <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              🔥 BESTSELLER
            </div>
          )}

          {/* Stock Status Indicator */}
          {status && (
            <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${!status.inStock
              ? 'bg-red-100 text-red-700'
              : status.lowStock
                ? 'bg-orange-100 text-orange-700'
                : 'bg-green-100 text-green-700'
              }`}>
              {status.message}
            </div>
          )}
        </div>

        <div className="mt-2">
          <h3 className="text-sm font-medium text-gray-900 truncate">{name}</h3>
          <p className="mt-1 text-sm text-gray-500">₹{price}</p>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
