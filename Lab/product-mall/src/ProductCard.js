import React from "react";

function ProductCard({ product }) {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>

      {product.inStock ? (
        <p style={{ color: "green" }}>In Stock</p>
      ) : (
        <p style={{ color: "red" }}>Out of Stock</p>
      )}

      <button disabled={!product.inStock}>
        {product.inStock ? "Buy Now" : "Not Available"}
      </button>
    </div>
  );
}

export default ProductCard;s