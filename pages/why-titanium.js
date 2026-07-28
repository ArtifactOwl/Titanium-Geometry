import React from "react";
import Link from "next/link";
import Head from "next/head";
import products from "../data/products.json";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function WhyTitanium() {
  const videos = products.youtubeVideos || [];
  return (
    <div style={pageStyle}>
      <Head>
        <title>Why Titanium & How It's Made | Titanium Geometry</title>
        <meta name="description" content="Learn about titanium's exceptional properties and see how our pendants are made." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header active="/why-titanium" />

      <main style={mainStyle}>
        {/* Hero Section */}
        <section style={heroStyle}>
          <h1 style={h1Style}>
            <span style={{color: "#351c75"}}>Ti</span>
            <span style={{color: "#a61c00"}}>tan</span>
            <span style={{color: "#0000ff"}}>ium</span>
          </h1>
          <p style={heroSubStyle}>Why Titanium & How It's Made</p>
        </section>

        {/* Main hero image */}
        <div style={heroImageContainer}>
          <img 
            src="/why-titanium/hero.jpg" 
            alt="Titanium pendant showcase" 
            style={heroImageStyle}
            onError={(e) => e.target.style.display = 'none'}
          />
        </div>

        {/* Properties Section */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Exceptional Properties</h2>
          
          <div style={propertiesGrid}>
            <div style={propertyCard}>
              <span style={propertyIcon}>🏥</span>
              <h3 style={propertyTitle}>Hypoallergenic</h3>
              <p style={propertyText}>
                Titanium is one of the most <strong>hypoallergenic</strong> materials, 
                and is the standard metal used in surgical implants.
              </p>
            </div>

            <div style={propertyCard}>
              <span style={propertyIcon}>💪</span>
              <h3 style={propertyTitle}>Incredibly Durable</h3>
              <p style={propertyText}>
                Titanium is <strong>incredibly durable</strong>, and is not affected 
                by acids, salts, or almost any cleaner.
              </p>
            </div>

            <div style={propertyCard}>
              <span style={propertyIcon}>✨</span>
              <h3 style={propertyTitle}>Never Rusts or Tarnishes</h3>
              <p style={propertyText}>
                Titanium will <strong>never rust, tarnish, or corrode</strong>. The coloring 
                layer will not crack or fade in sunlight.
              </p>
            </div>

            <div style={propertyCard}>
              <span style={propertyIcon}>🏛️</span>
              <h3 style={propertyTitle}>Lasts Thousands of Years</h3>
              <p style={propertyText}>
                Of all metals, only titanium and gold exhibit near-perfect preservation. 
                Titanium keepsakes can be treasured family heirlooms for centuries.
              </p>
            </div>
          </div>
        </section>

        {/* Cleaning Section */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Cleaning & Care</h2>
          <div style={twoColumnStyle}>
            <div style={textColumnStyle}>
              <p style={paragraphStyle}>
                <strong>Cleaning can be done with most non-abrasive cleaning agents</strong>, 
                such as dish soap, rubbing alcohol, or non-abrasive brass cleaners like 
                Barkeeper's Friend. You can scrub with an old toothbrush but avoid steel wool.
              </p>
              <p style={paragraphStyle}>
                <strong>Any chemical cleaner is fine</strong> and will not harm the finish, 
                but physical abrasives could scratch it.
              </p>
              <p style={paragraphStyle}>
                <strong>Feel free to wear while bathing or swimming</strong>, as chlorine 
                will have no effect. Oils that stick to the surface may change the color 
                temporarily, but cleaning with soap will restore the original color.
              </p>
            </div>
            <div style={imageColumnStyle}>
              <img 
                src="/why-titanium/cleaning.jpg" 
                alt="Titanium cleaning" 
                style={sectionImageStyle}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          </div>
        </section>

        {/* Pendant vs Keychain */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Choose Pendant or Keychain</h2>
          <p style={centeredText}>
            <strong>All pieces can be requested as either a Pendant Necklace or Keychain.</strong>
          </p>
          <div style={imageRowStyle}>
            <img 
              src="/why-titanium/pendant.jpg" 
              alt="Pendant option" 
              style={optionImageStyle}
              onError={(e) => e.target.style.display = 'none'}
            />
            <img 
              src="/why-titanium/keychain.jpg" 
              alt="Keychain option" 
              style={optionImageStyle}
              onError={(e) => e.target.style.display = 'none'}
            />
          </div>
        </section>

        {/* Creation Process */}
        <section style={sectionStyle}>
          <h2 style={h2Style}>Creation Process</h2>
          <p style={centeredText}>
            Each piece is created individually, with several steps from beginning to end.
          </p>

          <div style={processSteps}>
            <div style={stepCard}>
              <div style={stepNumber}>1</div>
              <h3 style={stepTitle}>Digital Design</h3>
              <p style={stepText}>
                First the design is created digitally, arranging shapes and lines 
                that will become the design.
              </p>
              <img 
                src="/why-titanium/process-design.jpg" 
                alt="Digital design process" 
                style={stepImageStyle}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>

            <div style={stepCard}>
              <div style={stepNumber}>2</div>
              <h3 style={stepTitle}>Laser Engraving</h3>
              <p style={stepText}>
                A high-powered laser slowly erodes away layers of titanium to 
                create engravings deeper and deeper.
              </p>
              <img 
                src="/why-titanium/process-engrave.jpg" 
                alt="Laser engraving process" 
                style={stepImageStyle}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>

            <div style={stepCard}>
              <div style={stepNumber}>3</div>
              <h3 style={stepTitle}>Color Passes</h3>
              <p style={stepText}>
                Multiple color passes are performed by the laser to alter the surface 
                and create colors by precisely varying focus and power.
              </p>
              <img 
                src="/why-titanium/process-color.jpg" 
                alt="Color creation process" 
                style={stepImageStyle}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>

            <div style={stepCard}>
              <div style={stepNumber}>4</div>
              <h3 style={stepTitle}>Polishing</h3>
              <p style={stepText}>
                Finally, the piece is polished to bring out its full beauty.
              </p>
              <img 
                src="/why-titanium/process-polish.jpg" 
                alt="Polishing process" 
                style={stepImageStyle}
                onError={(e) => e.target.style.display = 'none'}
              />
            </div>
          </div>
        </section>

        {/* Videos Section */}
        {videos.length > 0 && (
          <section style={sectionStyle}>
            <h2 style={h2Style}>See It In Action</h2>
            <div style={videoGrid}>
              {videos.map((video, index) => (
                <div key={video.id || index} style={videoContainer}>
                  <iframe
                    style={videoStyle}
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.title || `Video ${index + 1}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                  {video.title && <p style={videoCaption}>{video.title}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section style={ctaStyle}>
          <h2 style={ctaTitle}>Ready to Own a Piece?</h2>
          <p>Browse available pendants or request a custom commission.</p>
          <div style={ctaButtons}>
            <Link href="/shop" style={btnPrimary}>Shop Now</Link>
            <Link href="/commission" style={btnOutline}>Request Commission</Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
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
  maxWidth: "1000px",
  margin: "0 auto",
  padding: "2rem",
  width: "100%",
};

const heroStyle = {
  textAlign: "center",
  marginBottom: "2rem",
};

const h1Style = {
  fontSize: "3rem",
  marginBottom: "0.5rem",
};

const heroSubStyle = {
  fontSize: "1.25rem",
  color: "#6b7280",
};

const heroImageContainer = {
  width: "100%",
  maxWidth: "600px",
  margin: "0 auto 3rem",
};

const heroImageStyle = {
  width: "100%",
  borderRadius: "12px",
};

const sectionStyle = {
  marginBottom: "4rem",
};

const h2Style = {
  fontSize: "1.75rem",
  textAlign: "center",
  marginBottom: "1.5rem",
  paddingBottom: "0.5rem",
  borderBottom: "2px solid #e5e7eb",
};

const propertiesGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1.5rem",
};

const propertyCard = {
  background: "#f9fafb",
  padding: "1.5rem",
  borderRadius: "8px",
  textAlign: "center",
};

const propertyIcon = {
  fontSize: "2.5rem",
  display: "block",
  marginBottom: "0.75rem",
};

const propertyTitle = {
  fontSize: "1.1rem",
  marginBottom: "0.5rem",
};

const propertyText = {
  color: "#4b5563",
  fontSize: "0.95rem",
  lineHeight: 1.6,
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "2rem",
  alignItems: "center",
};

const textColumnStyle = {};

const imageColumnStyle = {
  textAlign: "center",
};

const paragraphStyle = {
  marginBottom: "1rem",
  lineHeight: 1.7,
};

const sectionImageStyle = {
  maxWidth: "100%",
  borderRadius: "8px",
};

const centeredText = {
  textAlign: "center",
  marginBottom: "1.5rem",
  fontSize: "1.1rem",
};

const imageRowStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "2rem",
  flexWrap: "wrap",
};

const optionImageStyle = {
  width: "200px",
  height: "200px",
  objectFit: "cover",
  borderRadius: "8px",
};

const processSteps = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "1.5rem",
};

const stepCard = {
  background: "#f9fafb",
  padding: "1.5rem",
  borderRadius: "8px",
  textAlign: "center",
};

const stepNumber = {
  width: "40px",
  height: "40px",
  background: "#111827",
  color: "white",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.25rem",
  fontWeight: "bold",
  margin: "0 auto 1rem",
};

const stepTitle = {
  fontSize: "1.1rem",
  marginBottom: "0.5rem",
};

const stepText = {
  color: "#4b5563",
  fontSize: "0.9rem",
  lineHeight: 1.6,
  marginBottom: "1rem",
};

const stepImageStyle = {
  width: "100%",
  height: "150px",
  objectFit: "cover",
  borderRadius: "6px",
};

const videoGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "1.5rem",
};

const videoContainer = {
  textAlign: "center",
};

const videoStyle = {
  width: "100%",
  aspectRatio: "16/9",
  borderRadius: "8px",
};

const videoCaption = {
  marginTop: "0.5rem",
  color: "#6b7280",
  fontSize: "0.9rem",
};

const ctaStyle = {
  background: "#f9fafb",
  padding: "3rem 2rem",
  borderRadius: "12px",
  textAlign: "center",
};

const ctaTitle = {
  fontSize: "1.5rem",
  marginBottom: "0.5rem",
};

const ctaButtons = {
  display: "flex",
  gap: "1rem",
  justifyContent: "center",
  marginTop: "1.5rem",
  flexWrap: "wrap",
};

const btnPrimary = {
  padding: "0.75rem 1.5rem",
  background: "#111827",
  color: "white",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: 600,
};

const btnOutline = {
  padding: "0.75rem 1.5rem",
  background: "white",
  color: "#111827",
  textDecoration: "none",
  borderRadius: "6px",
  fontWeight: 600,
  border: "2px solid #111827",
};

