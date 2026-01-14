import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import products from "../../data/products.json";

// Shipping rates (USD) - US is included in base price
const SHIPPING_RATES = {
  US: 0,
  CA: 10,
  MX: 10,
  INTERNATIONAL: 20,
};

const COUNTRIES = [
  { code: "US", name: "United States", rate: SHIPPING_RATES.US },
  { code: "CA", name: "Canada", rate: SHIPPING_RATES.CA },
  { code: "MX", name: "Mexico", rate: SHIPPING_RATES.MX },
  { code: "INT", name: "── International ──", rate: null, disabled: true },
  { code: "AU", name: "Australia", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "AT", name: "Austria", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "BE", name: "Belgium", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "BR", name: "Brazil", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "DK", name: "Denmark", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "FI", name: "Finland", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "FR", name: "France", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "DE", name: "Germany", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "IE", name: "Ireland", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "IL", name: "Israel", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "IT", name: "Italy", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "JP", name: "Japan", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "NL", name: "Netherlands", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "NZ", name: "New Zealand", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "NO", name: "Norway", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "PL", name: "Poland", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "PT", name: "Portugal", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "ES", name: "Spain", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "SE", name: "Sweden", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "CH", name: "Switzerland", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "GB", name: "United Kingdom", rate: SHIPPING_RATES.INTERNATIONAL },
  { code: "OTHER", name: "Other Country (+$20)", rate: SHIPPING_RATES.INTERNATIONAL },
];

// PayPal configuration
const PAYPAL_MERCHANT_ID = "YYH6HMQ3WFT6Q";
const PAYPAL_EMAIL = "jaekle@gmail.com";

export default function ProductPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState("US");
  const [mainImage, setMainImage] = useState(0);
  
  useEffect(() => {
    if (id) {
      const found = products.products.find(p => p.id === id);
      setProduct(found);
      
      // We'll detect images/videos from the folder
      // For now, assume images are numbered 1.jpg, 2.jpg, etc.
      // and videos are 1.mp4, 2.mp4, etc.
      if (found) {
        // Try to load images 1-10
        const possibleImages = [];
        for (let i = 1; i <= 10; i++) {
          possibleImages.push(`/pendants/${found.folder}/${i}.jpg`);
        }
        setImages(possibleImages);
        
        // Try video
        setVideos([`/pendants/${found.folder}/video.mp4`]);
      }
    }
  }, [id]);

  if (!product) {
    return <div style={pageStyle}><p>Loading...</p></div>;
  }

  const shippingRate = COUNTRIES.find(c => c.code === selectedCountry)?.rate || 0;
  const totalPrice = product.price + shippingRate;

  return (
    <div style={pageStyle}>
      <Head>
        <title>{product.name} | Titanium Geometry</title>
        <meta name="description" content={product.description || `${product.name} - Unique titanium pendant`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header style={headerStyle}>
        <Link href="/">
          <img src="/titanium-geometry-full-color.svg" alt="Titanium Geometry" style={{ height: 50, cursor: 'pointer' }} />
        </Link>
        <nav style={navStyle}>
          <Link href="/" style={navLinkStyle}>Home</Link>
          <Link href="/shop" style={navLinkStyle}>Shop</Link>
          <Link href="/why-titanium" style={navLinkStyle}>Why Titanium?</Link>
          <Link href="/previous-work" style={navLinkStyle}>Previous Work</Link>
          <Link href="/commission" style={navLinkStyle}>Commissions</Link>
          <Link href="/contact" style={navLinkStyle}>Contact</Link>
        </nav>
      </header>

      <main style={mainStyle}>
        {/* Breadcrumb */}
        <nav style={breadcrumbStyle}>
          <Link href="/shop" style={breadcrumbLinkStyle}>Shop</Link>
          <span style={{margin: "0 0.5rem"}}>/</span>
          <Link href={`/shop?group=${encodeURIComponent(product.group)}`} style={breadcrumbLinkStyle}>
            {product.group}
          </Link>
          <span style={{margin: "0 0.5rem"}}>/</span>
          <span>{product.name}</span>
        </nav>

        <div style={productLayoutStyle}>
          {/* Image Gallery */}
          <div style={galleryStyle}>
            <div style={mainImageContainerStyle}>
              <ImageWithFallback 
                src={images[mainImage]} 
                alt={product.name}
                style={mainImageStyle}
              />
            </div>
            
            {/* Thumbnails */}
            <div style={thumbnailsStyle}>
              {images.slice(0, 5).map((img, idx) => (
                <ImageWithFallback
                  key={idx}
                  src={img}
                  alt={`${product.name} ${idx + 1}`}
                  style={{
                    ...thumbnailStyle,
                    border: mainImage === idx ? "2px solid #111827" : "2px solid transparent"
                  }}
                  onClick={() => setMainImage(idx)}
                />
              ))}
            </div>

            {/* Local video if exists */}
            <VideoWithFallback src={videos[0]} />
            
            {/* YouTube video if exists */}
            {product.youtubeId && (
              <div style={youtubeContainerStyle}>
                <iframe
                  style={youtubeStyle}
                  src={`https://www.youtube.com/embed/${product.youtubeId}`}
                  title={`${product.name} video`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>

          {/* Product Info */}
          <div style={infoStyle}>
            <h1 style={titleStyle}>{product.name}</h1>
            <p style={groupStyle}>{product.group}</p>
            
            {product.status === 'sold' ? (
              <div style={soldNoticeStyle}>
                <span style={soldBadgeStyle}>SOLD</span>
                <p>This piece has been sold. <Link href="/commission" style={{color: "#2563eb"}}>Request a similar piece</Link></p>
              </div>
            ) : product.status === 'pending' ? (
              <div style={pendingNoticeStyle}>
                <span style={pendingBadgeStyle}>PENDING</span>
                <p style={{marginTop: "0.5rem"}}>This piece is currently unavailable. Interested in a similar design?</p>
                <PendingContactForm productName={product.name} />
              </div>
            ) : (
              <>
                {product.salePrice && product.originalPrice ? (
                  <div style={priceStyle}>
                    <span style={salePriceStyle}>${product.salePrice}</span>
                    <span style={originalPriceStyle}>${product.originalPrice}</span>
                    <span style={saleBadgeStyle}>SALE</span>
                  </div>
                ) : (
                  <p style={priceStyle}>${product.price}</p>
                )}
                
                {product.itemId && (
                  <p style={itemIdStyle}>Item #{product.itemId}</p>
                )}
                
                {/* Shipping Selector */}
                <div style={shippingBoxStyle}>
                  <label style={labelStyle}>Ship to:</label>
                  <select 
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    style={selectStyle}
                  >
                    {COUNTRIES.map(country => (
                      <option 
                        key={country.code} 
                        value={country.code}
                        disabled={country.disabled}
                      >
                        {country.name}
                        {country.rate !== null && country.rate > 0 ? ` (+$${country.rate})` : ''}
                        {country.rate === 0 ? ' (Free shipping)' : ''}
                      </option>
                    ))}
                  </select>
                  
                  {shippingRate > 0 && (
                    <p style={shippingNoteStyle}>
                      International shipping: +${shippingRate}
                    </p>
                  )}
                  
                  <p style={totalStyle}>
                    Total: <strong>${totalPrice}</strong>
                  </p>
                </div>

                {/* PayPal Button */}
                <form 
                  action="https://www.paypal.com/cgi-bin/webscr" 
                  method="post" 
                  target="_top"
                  style={paypalFormStyle}
                >
                  <input type="hidden" name="cmd" value="_xclick" />
                  <input type="hidden" name="business" value={PAYPAL_EMAIL} />
                  <input type="hidden" name="item_name" value={`${product.name} - Titanium Geometry`} />
                  <input type="hidden" name="item_number" value={product.id} />
                  <input type="hidden" name="amount" value={totalPrice} />
                  <input type="hidden" name="currency_code" value="USD" />
                  <input type="hidden" name="no_shipping" value="2" />
                  <input type="hidden" name="return" value="https://titanium-geometry.vercel.app/success" />
                  <input type="hidden" name="cancel_return" value="https://titanium-geometry.vercel.app/shop" />
                  <input type="hidden" name="notify_url" value="https://titanium-geometry.vercel.app/api/paypal-webhook" />
                  
                  <button type="submit" style={buyButtonStyle}>
                    Buy Now - ${totalPrice}
                  </button>
                </form>
                
                <p style={secureNoteStyle}>
                  🔒 Secure checkout via PayPal. Pay with credit card or PayPal balance.
                </p>
              </>
            )}

            {/* Description */}
            <div style={descriptionStyle}>
              <h2 style={descTitleStyle}>Description</h2>
              <p>{product.description}</p>
              
              <h3 style={detailsTitleStyle}>Details</h3>
              <ul style={detailsListStyle}>
                <li>Individually laser engraved, colored, and cut</li>
                <li>Lightweight titanium (approximately 8 grams)</li>
                <li>Anodized color - will never crack or peel</li>
                <li>Extremely durable and scratch resistant</li>
                <li>Each piece is one of a kind</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <footer style={footerStyle}>
        <p>© {new Date().getFullYear()} Titanium Geometry | <a href="mailto:titaniumgeometry@gmail.com">titaniumgeometry@gmail.com</a></p>
      </footer>
    </div>
  );
}

// Helper component for images with fallback
function ImageWithFallback({ src, alt, style, onClick }) {
  const [error, setError] = useState(false);
  
  if (error) return null;
  
  return (
    <img 
      src={src} 
      alt={alt} 
      style={style}
      onClick={onClick}
      onError={() => setError(true)}
    />
  );
}

// Helper component for video with fallback
function VideoWithFallback({ src }) {
  const [error, setError] = useState(false);
  
  if (error) return null;
  
  return (
    <video 
      controls 
      style={videoStyle}
      onError={() => setError(true)}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
}

// Contact form for pending items
function PendingContactForm({ productName }) {
  const [formData, setFormData] = useState({ email: '', colors: '', size: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const emailSubject = `Interest in: ${productName}`;
  const mailtoLink = `mailto:titaniumgeometry@gmail.com?subject=${encodeURIComponent(emailSubject)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch('https://formspree.io/f/xbddlgjg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          _subject: `Interest in: ${productName}`,
          productName: productName,
          type: 'pending-interest',
          email: formData.email,
          colors: formData.colors,
          size: formData.size
        })
      });
      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error('Form failed');
      }
    } catch (error) {
      window.location.href = mailtoLink;
    }
    setSubmitting(false);
  };

  if (submitted) {
    return <p style={{color: "#059669", fontWeight: 500}}>✓ Request sent! I'll be in touch soon.</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={pendingFormStyle}>
      <input
        type="email"
        placeholder="Your email *"
        required
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        style={pendingInputStyle}
      />
      <input
        type="text"
        placeholder="Color preferences"
        value={formData.colors}
        onChange={(e) => setFormData({...formData, colors: e.target.value})}
        style={pendingInputStyle}
      />
      <input
        type="text"
        placeholder="Size preferences"
        value={formData.size}
        onChange={(e) => setFormData({...formData, size: e.target.value})}
        style={pendingInputStyle}
      />
      <div style={{display: "flex", gap: "0.5rem"}}>
        <button type="submit" style={pendingButtonStyle}>Send Interest</button>
        <a href={mailtoLink} style={{...pendingButtonStyle, background: "#6b7280", textDecoration: "none", textAlign: "center"}}>
          Email Instead
        </a>
      </div>
    </form>
  );
}

// Styles
const pageStyle = {
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "1rem 2rem",
  borderBottom: "1px solid #e5e7eb",
  flexWrap: "wrap",
  gap: "1rem",
};

const navStyle = {
  display: "flex",
  gap: "1.5rem",
  flexWrap: "wrap",
};

const navLinkStyle = {
  textDecoration: "none",
  color: "#374151",
  fontWeight: 500,
};

const mainStyle = {
  flex: 1,
  padding: "2rem",
  maxWidth: "1200px",
  margin: "0 auto",
  width: "100%",
};

const breadcrumbStyle = {
  marginBottom: "1.5rem",
  fontSize: "0.9rem",
  color: "#6b7280",
};

const breadcrumbLinkStyle = {
  color: "#2563eb",
  textDecoration: "none",
};

const productLayoutStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "3rem",
};

const galleryStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
};

const mainImageContainerStyle = {
  width: "100%",
  aspectRatio: "1",
  background: "#f3f4f6",
  borderRadius: "8px",
  overflow: "hidden",
};

const mainImageStyle = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const thumbnailsStyle = {
  display: "flex",
  gap: "0.5rem",
};

const thumbnailStyle = {
  width: "60px",
  height: "60px",
  objectFit: "cover",
  borderRadius: "4px",
  cursor: "pointer",
};

const videoStyle = {
  width: "100%",
  borderRadius: "8px",
  marginTop: "1rem",
};

const youtubeContainerStyle = {
  width: "100%",
  marginTop: "1rem",
};

const youtubeStyle = {
  width: "100%",
  aspectRatio: "16/9",
  borderRadius: "8px",
};

const infoStyle = {
  display: "flex",
  flexDirection: "column",
};

const titleStyle = {
  fontSize: "1.75rem",
  marginBottom: "0.25rem",
};

const groupStyle = {
  color: "#6b7280",
  marginBottom: "1rem",
};

const priceStyle = {
  fontSize: "1.5rem",
  fontWeight: "bold",
  marginBottom: "1.5rem",
};

const salePriceStyle = {
  color: "#dc2626",
  marginRight: "0.75rem",
};

const originalPriceStyle = {
  textDecoration: "line-through",
  color: "#9ca3af",
  fontSize: "1.1rem",
  marginRight: "0.75rem",
};

const saleBadgeStyle = {
  background: "#dc2626",
  color: "white",
  padding: "0.2rem 0.5rem",
  borderRadius: "4px",
  fontSize: "0.75rem",
  fontWeight: "bold",
  verticalAlign: "middle",
};

const itemIdStyle = {
  fontSize: "0.9rem",
  color: "#6b7280",
  marginBottom: "1rem",
  fontFamily: "monospace",
};

const soldNoticeStyle = {
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1.5rem",
};

const soldBadgeStyle = {
  background: "#ef4444",
  color: "white",
  padding: "0.25rem 0.75rem",
  borderRadius: "4px",
  fontSize: "0.85rem",
  fontWeight: "bold",
};

const pendingNoticeStyle = {
  background: "#fffbeb",
  border: "1px solid #fcd34d",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1.5rem",
};

const pendingBadgeStyle = {
  background: "#f59e0b",
  color: "white",
  padding: "0.25rem 0.75rem",
  borderRadius: "4px",
  fontSize: "0.85rem",
  fontWeight: "bold",
};

const pendingFormStyle = {
  marginTop: "1rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const pendingInputStyle = {
  padding: "0.5rem",
  border: "1px solid #d1d5db",
  borderRadius: "4px",
  fontSize: "0.9rem",
};

const pendingButtonStyle = {
  padding: "0.5rem 1rem",
  background: "#f59e0b",
  color: "white",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  fontWeight: 500,
};

const shippingBoxStyle = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  padding: "1rem",
  marginBottom: "1rem",
};

const labelStyle = {
  display: "block",
  marginBottom: "0.5rem",
  fontWeight: 500,
};

const selectStyle = {
  width: "100%",
  padding: "0.75rem",
  borderRadius: "6px",
  border: "1px solid #d1d5db",
  fontSize: "1rem",
  marginBottom: "0.5rem",
};

const shippingNoteStyle = {
  fontSize: "0.9rem",
  color: "#6b7280",
  margin: "0.5rem 0",
};

const totalStyle = {
  fontSize: "1.1rem",
  marginTop: "0.75rem",
  paddingTop: "0.75rem",
  borderTop: "1px solid #e5e7eb",
};

const paypalFormStyle = {
  marginBottom: "1rem",
};

const buyButtonStyle = {
  width: "100%",
  padding: "1rem",
  fontSize: "1.1rem",
  fontWeight: "bold",
  background: "#0070ba",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

const secureNoteStyle = {
  fontSize: "0.85rem",
  color: "#6b7280",
  textAlign: "center",
};

const descriptionStyle = {
  marginTop: "2rem",
  paddingTop: "2rem",
  borderTop: "1px solid #e5e7eb",
};

const descTitleStyle = {
  fontSize: "1.25rem",
  marginBottom: "0.75rem",
};

const detailsTitleStyle = {
  fontSize: "1rem",
  marginTop: "1.5rem",
  marginBottom: "0.5rem",
};

const detailsListStyle = {
  paddingLeft: "1.25rem",
  color: "#4b5563",
};

const footerStyle = {
  borderTop: "1px solid #e5e7eb",
  padding: "2rem",
  textAlign: "center",
  color: "#6b7280",
};
