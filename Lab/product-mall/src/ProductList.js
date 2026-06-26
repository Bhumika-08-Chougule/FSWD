import React from "react";
import ProductCard from "./ProductCard";
import products from "./data";

function ProductList() {
  return (
    <div>
      <h2>Product Mall</h2>

      {products.map((item) => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}

export default ProductList;