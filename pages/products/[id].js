import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import products from "../../data/products.json";
import Header from "../../components/Header";
import { useCart } from "../../lib/cart";
import { COUNTRIES, PAYPAL_EMAIL, priceInfo, round2, shippingFor } from "../../lib/pricing";
import { trackAddToCart, trackViewContent } from "../../lib/fbpixel";
import Footer from "../../components/Footer";
import YouTubeEmbed from "../../components/YouTubeEmbed";
import Testimonials from "../../components/Testimonials";

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
        // Images are numbered 1.jpg, 2.jpg, ... — anything missing hides itself.
        // Keep MAX_IMAGES at least as high as the largest folder (see the
        // "Fix Image Names" button in product_admin.py).
        const MAX_IMAGES = 20;
        const possibleImages = [];
        for (let i = 1; i <= MAX_IMAGES; i++) {
          possibleImages.push(`/pendants/${found.folder}/${i}.jpg`);
        }
        setImages(possibleImages);
        
        // Try video
        setVideos([`/pendants/${found.folder}/video.mp4`]);
      }
    }
  }, [id]);

  // Tell the pixel which piece is being viewed, so it can be retargeted later.
  useEffect(() => {
    if (product) trackViewContent(product, priceInfo(product).final);
  }, [product]);

  if (!product) {
    return <div style={pageStyle}><p>Loading...</p></div>;
  }

  const pricing = priceInfo(product);
  const shippingRate = shippingFor(selectedCountry);
  const totalPrice = round2(pricing.final + shippingRate);

  return (
    <div style={pageStyle}>
      <Head>
        <title>{product.name} | Titanium Geometry</title>
        <meta name="description" content={product.description || `${product.name} - Unique titanium pendant`} />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

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

        <div className="product-layout" style={productLayoutStyle}>
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
              {images.map((img, idx) => (
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
                <YouTubeEmbed id={product.youtubeId} title={`${product.name} video`} />
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
                {pricing.onSale ? (
                  <div style={priceStyle}>
                    <span style={salePriceStyle}>${pricing.final}</span>
                    <span style={originalPriceStyle}>${pricing.list}</span>
                    <span style={saleBadgeStyle}>SALE</span>
                    <div style={savingsStyle}>
                      You save ${(pricing.list - pricing.final).toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <p style={priceStyle}>${pricing.final}</p>
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
                  <input type="hidden" name="item_name" value={`${product.itemId ? product.itemId + ' - ' : ''}${product.name} - Titanium Geometry`} />
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

                <AddToCartButton product={product} />

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
                {/* Size leads the list, and is left out entirely when unset. */}
                {product.size && String(product.size).trim() && (
                  <li>
                    <strong>Size:</strong> {String(product.size).trim()}
                  </li>
                )}
                <li>Individually laser engraved, colored, and cut</li>
                <li>Lightweight titanium (approximately 8 grams)</li>
                <li>Anodized color - will never crack or peel</li>
                <li>Extremely durable and scratch resistant</li>
                <li>Each piece is one of a kind</li>
              </ul>

              <Testimonials title="What Buyers Say" limit={2} compact />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Add to cart, so several pieces can be bought together with one shipping charge
function AddToCartButton({ product }) {
  const { add, has } = useCart();
  const inCart = has(product.id);

  return (
    <div style={{ marginBottom: "1rem" }}>
      {inCart ? (
        <Link href="/cart" style={{ ...addToCartStyle, background: "#047857", display: "block", textAlign: "center", textDecoration: "none" }}>
          ✓ In your cart — view cart
        </Link>
      ) : (
        <button
          style={addToCartStyle}
          onClick={() => {
            add(product.id);
            trackAddToCart(product, priceInfo(product).final);
          }}
        >
          Add to Cart
        </button>
      )}
      <p style={{ fontSize: "0.8rem", color: "#6b7280", textAlign: "center", margin: "0.4rem 0 0" }}>
        Buying more than one? Add them to your cart — shipping is charged once.
      </p>
    </div>
  );
}

const addToCartStyle = {
  width: "100%",
  padding: "0.875rem",
  fontSize: "1rem",
  fontWeight: 600,
  background: "#111827",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
};

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
  const [error, setError] = useState('');

  const emailSubject = `Interest in: ${productName}`;
  const mailtoLink = `mailto:titaniumgeometry@gmail.com?subject=${encodeURIComponent(emailSubject)}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('https://formspree.io/f/mjgnrkoe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `Interest in: ${productName}`,
          productName: productName,
          type: 'pending-interest',
          email: formData.email,
          colors: formData.colors,
          size: formData.size
        })
      });
      // Formspree can return HTTP 200 with an error body, so check the body too.
      const data = await response.json().catch(() => ({}));
      if (response.ok && !data.errors) {
        setSubmitted(true);
      } else {
        throw new Error('Form failed');
      }
    } catch (err) {
      setError("Couldn't send automatically — please use \"Email Instead\" below.");
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
        <button type="submit" style={pendingButtonStyle} disabled={submitting}>
          {submitting ? "Sending…" : "Send Interest"}
        </button>
        <a href={mailtoLink} style={{...pendingButtonStyle, background: "#6b7280", textDecoration: "none", textAlign: "center"}}>
          Email Instead
        </a>
      </div>
      {error && <p style={{color: "#b91c1c", fontSize: "0.85rem", margin: 0}}>{error}</p>}
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

// Two columns on a desktop. The className matters: inline styles can't carry a
// media query, so the collapse to a single column below 768px lives with the
// global styles in _app.js and overrides the value below.
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
  objectFit: "contain",
};

const thumbnailsStyle = {
  display: "flex",
  gap: "0.5rem",
  flexWrap: "wrap",
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
  padding: "0.3rem 0.7rem",
  borderRadius: "4px",
  fontSize: "0.95rem",
  fontWeight: "bold",
  letterSpacing: "0.06em",
  verticalAlign: "middle",
};

const savingsStyle = {
  color: "#dc2626",
  fontSize: "0.95rem",
  fontWeight: 600,
  marginTop: "0.35rem",
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

