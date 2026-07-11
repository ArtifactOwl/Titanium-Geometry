import React, { useState, useMemo, useRef, useEffect } from "react";
import Head from "next/head";

// ====== Business details ======
const BUSINESS = {
  website: "titanium-geometry.vercel.app",
  facebook: "facebook.com/titaniumgeometry",
  email: "titaniumgeometry@gmail.com",
  taxRate: 0.0635, // 6.35% Connecticut sales tax
};

const money = (n) => "$" + (Math.round(n * 100) / 100).toFixed(2);
const todayISO = () => {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
};

export default function ReceiptPage() {
  const [items, setItems] = useState([{ desc: "", price: "", qty: "1" }]);
  const [discount, setDiscount] = useState("0");
  const [discountType, setDiscountType] = useState("amount");
  const [taxExempt, setTaxExempt] = useState(false);
  const [customer, setCustomer] = useState("");
  const [recNo, setRecNo] = useState("");
  const [date, setDate] = useState("");
  const [sharing, setSharing] = useState(false);
  const [note, setNote] = useState("");
  const receiptRef = useRef(null);

  // Initialize receipt number (persisted locally) + today's date on mount
  useEffect(() => {
    const stored = parseInt(localStorage.getItem("tg_recNo") || "1000", 10);
    setRecNo(String(stored + 1));
    setDate(todayISO());
  }, []);

  const calc = useMemo(() => {
    let subtotal = 0;
    const lines = [];
    items.forEach((it) => {
      const price = parseFloat(it.price) || 0;
      const qty = parseFloat(it.qty) || 0;
      const desc = it.desc.trim();
      if (!desc && !price) return;
      const lineTotal = price * qty;
      subtotal += lineTotal;
      lines.push({ desc, price, qty, lineTotal });
    });
    const dVal = parseFloat(discount) || 0;
    let disc = discountType === "percent" ? subtotal * (dVal / 100) : dVal;
    if (disc > subtotal) disc = subtotal;
    if (disc < 0) disc = 0;
    const taxable = subtotal - disc;
    const tax = taxExempt ? 0 : taxable * BUSINESS.taxRate;
    const total = taxable + tax;
    return { lines, subtotal, disc, dVal, taxable, tax, total };
  }, [items, discount, discountType, taxExempt]);

  const updateItem = (i, key, val) =>
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: val } : it)));
  const addItem = () => setItems((prev) => [...prev, { desc: "", price: "", qty: "1" }]);
  const removeItem = (i) =>
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i)));

  const bumpRecNo = () => {
    const n = parseInt(recNo, 10);
    if (!isNaN(n)) localStorage.setItem("tg_recNo", String(n));
  };

  const newReceipt = () => {
    setItems([{ desc: "", price: "", qty: "1" }]);
    setDiscount("0");
    setDiscountType("amount");
    setTaxExempt(false);
    setCustomer("");
    setDate(todayISO());
    const stored = parseInt(localStorage.getItem("tg_recNo") || "1000", 10);
    setRecNo(String(stored + 1));
    setNote("");
  };

  const dateLabel = date
    ? new Date(date + "T00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  // Full letter-size receipt (screenshot of the styled receipt) for emailing.
  async function buildPdf() {
    const [{ default: html2canvas }, jspdfMod] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);
    const { jsPDF } = jspdfMod;
    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "pt", format: "letter" });
    const pageW = pdf.internal.pageSize.getWidth();
    const margin = 24;
    const imgW = pageW - margin * 2;
    const imgH = (canvas.height / canvas.width) * imgW;
    pdf.addImage(imgData, "PNG", margin, margin, imgW, imgH);
    return pdf;
  }

  // Small 2 x 1.18" label, drawn as crisp vector text (not a scaled image) so
  // it stays sharp on a low-res label printer. Best for up to ~3 items.
  async function buildLabelPdf() {
    const { jsPDF } = await import("jspdf");
    const W = 144, H = 85; // 2" x 1.18" in points
    const pdf = new jsPDF({ unit: "pt", format: [W, H], orientation: "landscape" });
    const m = 5;
    pdf.setTextColor(0, 0, 0);

    // Header: name + receipt meta on the left, contact on the right.
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.text("Titanium Geometry", m, m + 6);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(4.2);
    pdf.text(`Receipt #${recNo || "—"}   ${dateLabel}`, m, m + 12);
    pdf.text([BUSINESS.website, BUSINESS.facebook, BUSINESS.email], W - m, m + 2.5, {
      align: "right",
      lineHeightFactor: 1.3,
    });
    const headTop = m + 15;
    pdf.setLineWidth(0.6);
    pdf.line(m, headTop, W - m, headTop);

    // Items: pick the largest font that fits the available height.
    const lines = calc.lines.length ? calc.lines : [{ desc: "—", qty: 1, lineTotal: 0 }];
    const totalBand = 16;
    const top = headTop + 4;
    const bottom = H - totalBand;
    const rowH = (bottom - top) / lines.length;
    const fs = Math.max(7, Math.min(15, rowH * 0.6));
    const priceW = fs * 3.4; // reserve room on the right for the amount
    lines.forEach((l, i) => {
      const y = top + rowH * i + rowH / 2 + fs * 0.35;
      pdf.setFontSize(fs);
      pdf.text(money(l.lineTotal), W - m, y, { align: "right" });
      let desc = (l.qty > 1 ? l.qty + "× " : "") + (l.desc || "Item");
      const maxW = W - m * 2 - priceW;
      while (pdf.getTextWidth(desc) > maxW && desc.length > 1) desc = desc.slice(0, -2) + "…";
      pdf.text(desc, m, y);
    });

    // Total.
    pdf.setLineWidth(0.6);
    pdf.line(m, bottom, W - m, bottom);
    pdf.setFont("helvetica", "bold");
    const tf = 12;
    pdf.setFontSize(tf);
    const ty = bottom + totalBand / 2 + tf * 0.35;
    pdf.text("TOTAL", m, ty);
    pdf.text(money(calc.total), W - m, ty, { align: "right" });
    return pdf;
  }

  async function shareBuilt(makePdf, suffix) {
    setSharing(true);
    setNote("");
    try {
      const pdf = await makePdf();
      const fileName = `titaniumgeometry${recNo || "TG"}${suffix || ""}.pdf`;
      const blob = pdf.output("blob");
      const file = new File([blob], fileName, { type: "application/pdf" });
      bumpRecNo();
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Receipt ${recNo}`,
          text: `Receipt from Titanium Geometry`,
        });
      } else {
        // Fallback: download the PDF, then attach it to an email manually
        pdf.save(fileName);
        setNote(
          "Sharing isn't available here, so the PDF was downloaded. Attach it to your email manually."
        );
      }
    } catch (err) {
      if (err && err.name !== "AbortError") {
        setNote("Couldn't share the PDF: " + (err.message || err));
      }
    }
    setSharing(false);
  }

  const sharePdf = () => shareBuilt(buildPdf, "");
  const shareLabelPdf = () => shareBuilt(buildLabelPdf, "-label");

  const doPrint = () => {
    bumpRecNo();
    window.print();
  };

  return (
    <div style={pageStyle}>
      <Head>
        <title>Receipts | Titanium Geometry</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="robots" content="noindex, nofollow" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#111827" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="TG Receipts" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <style>{globalCss}</style>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* ===== Editor ===== */}
        <section className="no-print" style={editorStyle}>
          <h2 style={editorH2}>New Receipt</h2>

          <div style={row2}>
            <div style={{ flex: 1 }}>
              <label style={lblStyle}>Receipt #</label>
              <input
                style={inputStyle}
                inputMode="numeric"
                value={recNo}
                onChange={(e) => setRecNo(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lblStyle}>Date</label>
              <input
                style={inputStyle}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <label style={lblStyle}>Customer (optional)</label>
            <input
              style={inputStyle}
              placeholder="Name"
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
            />
          </div>

          <div style={itemsHead}>
            <span>Item</span>
            <span>Price</span>
            <span>Qty</span>
            <span />
          </div>
          {items.map((it, i) => (
            <div key={i} style={itemRow}>
              <input
                style={itemInput}
                placeholder="Description"
                value={it.desc}
                onChange={(e) => updateItem(i, "desc", e.target.value)}
              />
              <input
                style={itemInput}
                inputMode="decimal"
                placeholder="0.00"
                value={it.price}
                onChange={(e) => updateItem(i, "price", e.target.value)}
              />
              <input
                style={itemInput}
                inputMode="numeric"
                placeholder="1"
                value={it.qty}
                onChange={(e) => updateItem(i, "qty", e.target.value)}
              />
              <button style={rmBtn} onClick={() => removeItem(i)} title="Remove">
                ×
              </button>
            </div>
          ))}
          <button style={{ ...btn, ...btnAdd }} onClick={addItem}>
            + Add item
          </button>

          <div style={{ ...row2, marginTop: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={lblStyle}>Discount</label>
              <input
                style={inputStyle}
                inputMode="decimal"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lblStyle}>Discount type</label>
              <select
                style={inputStyle}
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
              >
                <option value="amount">$ off</option>
                <option value="percent">% off</option>
              </select>
            </div>
          </div>

          <label style={checkRowStyle}>
            <input
              type="checkbox"
              checked={taxExempt}
              onChange={(e) => setTaxExempt(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            Tax exempt (no sales tax)
          </label>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <button style={{ ...btn, ...btnNew, flex: "1 1 30%" }} onClick={newReceipt}>
              New
            </button>
            <button style={{ ...btn, ...btnPrint, flex: "1 1 30%" }} onClick={doPrint}>
              Print
            </button>
            <button
              style={{ ...btn, ...btnShare, flex: "1 1 100%", opacity: sharing ? 0.6 : 1 }}
              onClick={sharePdf}
              disabled={sharing}
            >
              {sharing ? "Preparing…" : "Share PDF"}
            </button>
            <button
              style={{ ...btn, ...btnLabel, flex: "1 1 100%", opacity: sharing ? 0.6 : 1 }}
              onClick={shareLabelPdf}
              disabled={sharing}
            >
              {sharing ? "Preparing…" : "Label PDF (small 2×1.18″ label)"}
            </button>
          </div>
          {note && <p style={noteStyle}>{note}</p>}
        </section>

        {/* ===== Receipt (printable / shareable) ===== */}
        <section className="receipt" ref={receiptRef} style={receiptStyle}>
          <div style={rHead}>
            <img className="r-logo" src="/receipt-logo.png" alt="Titanium Geometry" style={rLogo} crossOrigin="anonymous" />
            <div className="r-contact" style={rContact}>
              {BUSINESS.website}
              <br />
              {BUSINESS.facebook}
              <br />
              {BUSINESS.email}
            </div>
          </div>

          <div className="r-meta" style={rMeta}>
            <div>
              <span style={metaLbl}>Receipt&nbsp;#</span> {recNo || "—"}
            </div>
            <div>
              <span style={metaLbl}>Date</span> {dateLabel}
            </div>
          </div>
          {customer.trim() && (
            <div className="r-meta" style={rMeta}>
              <div>
                <span style={metaLbl}>Customer</span> {customer.trim()}
              </div>
            </div>
          )}

          <table className="lines" style={linesTable}>
            <thead>
              <tr>
                <th style={thL}>Item</th>
                <th style={thR}>Price</th>
                <th style={thR}>Qty</th>
                <th style={thR}>Total</th>
              </tr>
            </thead>
            <tbody>
              {calc.lines.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ color: "#9ca3af", padding: "12px 0" }}>
                    No items yet
                  </td>
                </tr>
              ) : (
                calc.lines.map((l, i) => (
                  <tr key={i}>
                    <td style={tdL}>{l.desc || "—"}</td>
                    <td style={tdR}>{money(l.price)}</td>
                    <td style={tdR}>{l.qty}</td>
                    <td style={tdR}>{money(l.lineTotal)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="totals" style={totalsBox}>
            <div style={tRow}>
              <span>Subtotal</span>
              <span>{money(calc.subtotal)}</span>
            </div>
            {calc.disc > 0 && (
              <div style={tRow}>
                <span>
                  Discount{discountType === "percent" ? ` (${calc.dVal}%)` : ""}
                </span>
                <span style={{ color: "#dc2626" }}>−{money(calc.disc)}</span>
              </div>
            )}
            <div style={tRow}>
              <span>{taxExempt ? "Sales Tax (exempt)" : "Sales Tax (6.35%)"}</span>
              <span>{money(calc.tax)}</span>
            </div>
            <div className="grand" style={{ ...tRow, ...grandRow }}>
              <span>Total</span>
              <span>{money(calc.total)}</span>
            </div>
          </div>

          <div className="r-foot" style={rFoot}>
            <strong>Thank you!</strong>
            <br />
            Each piece is one of a kind.
          </div>
        </section>

        <p className="no-print" style={hintStyle}>
          Tip: use your browser menu → “Add to Home Screen” to launch this like an app.
        </p>
        <p className="no-print" style={hintStyle}>
          Heading somewhere with no signal?{" "}
          <a href="/receipt-offline.html" download="titaniumgeometry-receipts.html" style={{ color: "#0070ba" }}>
            Save an offline copy
          </a>{" "}
          — a single file that works with no internet.
        </p>
      </div>
    </div>
  );
}

/* ===== print + base CSS (media queries can't be inline) ===== */
const globalCss = `
  @media print {
    body { background: #fff !important; }
    .no-print { display: none !important; }
    .receipt { border: none !important; border-radius: 0 !important; box-shadow: none !important; }
  }
`;

/* ===== styles ===== */
const pageStyle = {
  fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  background: "#f3f4f6",
  color: "#111827",
  minHeight: "100vh",
  padding: 12,
};
const editorStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 16,
  marginBottom: 16,
};
const editorH2 = {
  fontSize: "1rem",
  margin: "0 0 12px",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#6b7280",
};
const row2 = { display: "flex", gap: 10 };
const lblStyle = { display: "block", fontSize: "0.8rem", color: "#6b7280", marginBottom: 4 };
const checkRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 14,
  fontSize: "0.95rem",
  cursor: "pointer",
};
const inputStyle = {
  width: "100%",
  padding: 12,
  fontSize: "1rem",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#fff",
  color: "#111827",
};
const itemsHead = {
  display: "grid",
  gridTemplateColumns: "1fr 84px 54px 32px",
  gap: 8,
  fontSize: "0.7rem",
  color: "#6b7280",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  margin: "16px 0 6px",
  padding: "0 2px",
};
const itemRow = {
  display: "grid",
  gridTemplateColumns: "1fr 84px 54px 32px",
  gap: 8,
  alignItems: "center",
  marginBottom: 8,
};
const itemInput = {
  padding: 10,
  fontSize: "0.95rem",
  border: "1px solid #d1d5db",
  borderRadius: 8,
  width: "100%",
  boxSizing: "border-box",
};
const rmBtn = {
  border: "none",
  background: "#fee2e2",
  color: "#dc2626",
  borderRadius: 8,
  height: 40,
  fontSize: "1.2rem",
  cursor: "pointer",
};
const btn = {
  padding: "12px 16px",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  borderRadius: 8,
  border: "none",
};
const btnAdd = { background: "#eef2ff", color: "#3730a3", marginTop: 4, width: "100%" };
const btnNew = { background: "#f3f4f6", color: "#111827", border: "1px solid #e5e7eb" };
const btnPrint = { background: "#e5e7eb", color: "#111827" };
const btnShare = { background: "#0070ba", color: "#fff" };
const btnLabel = { background: "#047857", color: "#fff" };
const noteStyle = { fontSize: "0.85rem", color: "#b45309", marginTop: 10 };

const receiptStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 24,
  color: "#000",
};
const rHead = {
  textAlign: "center",
  borderBottom: "2px solid #000",
  paddingBottom: 14,
  marginBottom: 14,
};
const rLogo = { width: 180, maxWidth: "70%", height: "auto", margin: "0 auto 8px", display: "block" };
const rContact = { fontSize: "0.78rem", color: "#374151", lineHeight: 1.5 };
const rMeta = {
  display: "flex",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 4,
  fontSize: "0.82rem",
  marginBottom: 12,
};
const metaLbl = { color: "#6b7280" };
const linesTable = { width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" };
const thBase = {
  borderBottom: "1px solid #000",
  padding: "6px 0",
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "#374151",
};
const thL = { ...thBase, textAlign: "left" };
const thR = { ...thBase, textAlign: "right" };
const tdBase = { padding: "7px 0", borderBottom: "1px solid #e5e7eb", verticalAlign: "top" };
const tdL = { ...tdBase, textAlign: "left" };
const tdR = { ...tdBase, textAlign: "right" };
const totalsBox = { marginTop: 12, marginLeft: "auto", width: "100%", maxWidth: 260, fontSize: "0.9rem" };
const tRow = { display: "flex", justifyContent: "space-between", padding: "4px 0" };
const grandRow = {
  borderTop: "2px solid #000",
  marginTop: 6,
  paddingTop: 8,
  fontSize: "1.15rem",
  fontWeight: 700,
};
const rFoot = {
  textAlign: "center",
  marginTop: 18,
  paddingTop: 12,
  borderTop: "1px dashed #9ca3af",
  fontSize: "0.82rem",
  color: "#374151",
};
const hintStyle = { fontSize: "0.75rem", color: "#6b7280", textAlign: "center", marginTop: 10 };
