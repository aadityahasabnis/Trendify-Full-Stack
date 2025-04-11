import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductCarousel from "./ProductCarousel";

const BestSeller = () => {
  const { products } = useContext(ShopContext);
  const [bestSeller, setBestSeller] = useState([]);

  useEffect(() => {
    const bestProduct = products.filter((item) => item.bestseller);
    setBestSeller(bestProduct.slice(0, 10));
  }, [products]);

  return (
    <ProductCarousel
      title="BEST"
      subtitle="SELLERS"
      products={bestSeller}
      itemsPerPage={5}
      showStockStatus={true}
    />
  );
};

export default BestSeller;
