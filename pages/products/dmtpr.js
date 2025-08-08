import React, { useState } from "react";
import ColorSelector from "../../components/ColorSelector";
const imgStyle = {
  width: "100%",
  maxWidth: "400px",
  height: "auto",         // ✅ Keeps the natural aspect ratio
  borderRadius: "8px",
  cursor: "zoom-in",
  display: "block",
  marginBottom: "1rem",
};

export default function dmtpr() {

  const [selectedColor, setSelectedColor] = useState("");
  return (
    <div style={{ padding: "2rem" }}>
      <h1>DMT (DiMethylTryptamine) Molecule Pendant</h1>
      <p>$75.00</p>

      {/* Image Gallery */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>

      <a href="/pendants/dmtpr1.jpg" target="_blank" rel="noopener noreferrer">
         <img src="/pendants/dmtpr1.jpg" alt="Pendant 1" style={imgStyle} />
      </a>
      <a href="/pendants/dmtpr2.jpg" target="_blank" rel="noopener noreferrer">
        <img src="/pendants/dmtpr2.jpg" alt="Pendant 2" style={imgStyle} />
      </a>
      <a href="/pendants/dmtpr3.jpg" target="_blank" rel="noopener noreferrer">
         <img src="/pendants/dmtpr3.jpg" alt="Pendant 1" style={imgStyle} />
      </a>
      <a href="/pendants/dmtpr4.jpg" target="_blank" rel="noopener noreferrer">
        <img src="/pendants/dmtpr4.jpg" alt="Pendant 2" style={imgStyle} />
      </a>
      <a href="/pendants/dmtpr5.jpg" target="_blank" rel="noopener noreferrer">
         <img src="/pendants/dmtpr5.jpg" alt="Pendant 1" style={imgStyle} />
      </a>

      </div>

      <iframe
  width="640"
  height="360"
  src="https://www.youtube.com/embed/IuMOX-favng"
  title="YouTube video player"
  frameBorder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
></iframe>

        <p>
        A completely original design, based on the chemical structure of DMT (DiMethylTryptamine), which is a powerful hallucinogen and the only one found naturally in the human brain.  
        The design faithfully represents the chemical structure of DMT, showing all atoms, electrons and bonds, while simultaneously not relying on standard scientific chemical notation.
        Instead, all subatomic particles are depicted in an artistic way while remaining scientifically accurate.  Geometric designs consistent with the psychedelic experience are incorporated to
        strike a balance between aesthetics and scientific accuracy.
         </p>

          <p>
        5cm (2 inches) wide and weighing approximately 8 grams with 2 pendant holes and an included necklace of your color choice.  Individually laser engraved, laser colored, and laser cut.  Each piece is one of a kind, and each is lightweight and extremely durable.
        The annodized color layer is also far more resilient than any other type of coloring, and will never crack or peel.  The titanium metal and the annodized color layer 
        are very resistant to scratching, and will look like new after years of wear.
      </p>

      
      <ColorSelector onColorChange={(color) => setSelectedColor(color)} />

      {/* Stripe Buy Button */}
      <form action="https://buy.stripe.com/test_4gw4jL9cY8m9eF23cc" method="POST">
        <button type="submit" style={buttonStyle}>
          Buy with Stripe
        </button>
      </form>

      {/* PayPal Buy Button */}
      <form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top" style={{ marginTop: "1rem" }}>
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value="YOUR_PAYPAL_BUTTON_ID" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_US/i/btn/btn_buynow_LG.gif"
          name="submit"
          alt="PayPal - The safer, easier way to pay online!"
        />
      </form>
    </div>
  );
}

const buttonStyle = {
  backgroundColor: "#635BFF",
  color: "white",
  padding: "0.75rem 1.5rem",
  fontSize: "16px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};
