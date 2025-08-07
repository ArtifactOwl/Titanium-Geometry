import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "2rem" }}>
      

      <main style={{ marginTop: "3rem", textAlign: "center" }}>
        <h1>Titanium Pendant Necklaces</h1>
        <p>Unique titanium pendants, keychain fobs, and tools with unique precision engraving, cutting, and coloring.</p>

        <h2 style={{ marginTop: "2rem" }}>Sample Designs</h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
          <img src="/orbitals.jpg" alt="Sample 1" style={{ width: "250px", height: "250px" }} />
          <img src="/selection.jpg" alt="Sample 2" style={{ width: "250px", height: "250px" }} />
          <img src="/dmtmolecule.jpg" alt="Sample 3" style={{ width: "250px", height: "250px" }} />
        </div>
      </main>
    </div>
  );
}
