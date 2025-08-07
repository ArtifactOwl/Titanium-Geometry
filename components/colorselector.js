// Save as components/ColorSelector.js

import React, { useState, useEffect } from "react";

const colors = [
  "Black",
  "Aged Steel",
  "Aged Bronze",
  "Aged Brass",
  "Aged Gold",
  "Yellow Gold",
  "Copper",
  "Rose Gold",
  "Steel",
  "Silver",
];

export default function ColorSelector({ onColorChange, defaultColor = colors[0] }) {
  const [selectedColor, setSelectedColor] = useState(defaultColor);
  useEffect(() => {
    if (onColorChange) {
      onColorChange(selectedColor);
    }
  }, [selectedColor, onColorChange]);

  return (
    <div style={{ marginBottom: "2rem" }}>
      <label htmlFor="color-select" style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
        Choose Necklace Color:
      </label>

      <select
        id="color-select"
        value={selectedColor}
        onChange={(e) => setSelectedColor(e.target.value)}
        style={{ padding: "0.5rem", fontSize: "1rem", marginBottom: "1rem" }}
      >
        {colors.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>

      <div>
        <a href="/images/necklace-color-chart.jpg" target="_blank" rel="noopener noreferrer">
          <img
            src="/images/necklace-color-chart.jpg"
            alt="Color chart for necklace finishes"
            style={{
              width: "200px",
              height: "auto",
              borderRadius: "6px",
              border: "1px solid #ccc",
              cursor: "zoom-in",
            }}
          />
        </a>
        <p style={{ fontSize: "0.85rem", color: "#555" }}>
          Click image to view full-size color chart
        </p>
      </div>
    </div>
  );
}
