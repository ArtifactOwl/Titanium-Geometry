
import React from "react";
import Link from "next/link";

export default function ProductIndex() {
  const products = [
    {
      title: "DMT Molecule Titanium Pendant - Purple & Red",
      slug: "dmtpr"
    },
    {
      title: "Fire Twist Pendant (Red-Gold Titanium)",
      slug: "fire-twist"
    },
    {
      title: "Spiral Drop (Blue)",
      slug: "spiral-drop"
    }
  ];

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Available Pendants</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {products.map((product) => (
          <li key={product.slug} style={{ marginBottom: "1rem" }}>
            <Link href={`/products/${product.slug}`} style={{ fontSize: "18px", color: "blue", textDecoration: "underline" }}>
              {product.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
