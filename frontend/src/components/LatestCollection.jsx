import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductCarousel from "./ProductCarousel";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);
  //   console.log(products);
  const [latestProducts, setLatestProduct] = useState([]);

  useEffect(() => {
    setLatestProduct(products.slice(0, 10));
  }, [products])

  return (
    <ProductCarousel
      title="LATEST"
      subtitle="COLLECTIONS"
      products={latestProducts}
      itemsPerPage={5}
    />
  );
};

export default LatestCollection;
