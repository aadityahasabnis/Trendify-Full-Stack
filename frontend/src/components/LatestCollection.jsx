import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductCarousel from "./ProductCarousel";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  //   console.log(products);
  const [latestProducts, setLatestProduct] = useState([]);

  useEffect(() => {
    // Sort products by createdAt date in descending order (newest first)
    const sortedProducts = [...products].sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    setLatestProduct(sortedProducts.slice(0, 10));
  }, [products])

  return (
    <ProductCarousel
      title="LATEST"
      subtitle="COLLECTIONS"
      products={latestProducts}
      itemsPerPage={5}
      showStockStatus={true}
    />
  );
};

export default LatestCollection;
