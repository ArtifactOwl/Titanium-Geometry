import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import productData from "../data/products.json";
import Header from "../components/Header";
import { useCart } from "../lib/cart";
import { parseCartQuery } from "../lib/cartLink";
import { trackInitiateCheckout } from "../lib/fbpixel";
import Footer from "../components/Footer";
import {
  AUTO_PROMOS,
  COUNTRIES,
  PAYPAL_EMAIL,
  SITE_URL,
  cartTotals,
  effectivePrice,
  findCoupon,
  money,
  priceInfo,
  promoUnlocked,
} from "../lib/pricing";

const CONTACT_EMAIL = "titaniumgeometry@gmail.com";

export default function CartPage() {
  const router = useRouter();
  const { ids, add, remove, clear, loaded } = useCart();
  const [country, setCountry] = useState("US");
  const [codeInput, setCodeInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");

  // Fill the cart from the URL. Used both for our own quote links and as the
  // Meta (Facebook/Instagram) checkout URL, so it accepts the shapes either can
  // send — see docs/facebook-checkout-url.md.
  //
  //   /cart?add=G0001,G0002&code=SAVE20            (our quote links)
  //   /cart?products=G0001:1,G0002:1&coupon=X      (Meta style, id:quantity)
  //
  // Quantity is parsed but ignored: every piece is one of a kind.
  useEffect(() => {
    if (!router.isReady || !loaded) return;
    const { ids, code, hadParams } = parseCartQuery(router.query, productData.products);
    ids.forEach(add);
    if (code) {
      setCodeInput(code);
      setAppliedCode(code);
    }
    if (hadParams) {
      router.replace("/cart", undefined, { shallow: true });
    }
    // asPath is in the deps so this also works when the URL changes without a
    // full page load; once the params are stripped it becomes a no-op.
  }, [router.isReady, loaded, router.asPath]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resolve ids to products, splitting out anything no longer purchasable.
  const { items, unavailable } = useMemo(() => {
    const items = [];
    const unavailable = [];
    ids.forEach((id) => {
      const p = productData.products.find((x) => x.id === id);
      if (!p) return; // product was deleted
      if ((p.status || "available") === "available") items.push(p);
      else unavailable.push(p);
    });
    return { items, unavailable };
  }, [ids]);

  const coupon = appliedCode ? findCoupon(appliedCode) : null;
  const totals = cartTotals(items, country, coupon);

  const applyCode = (e) => {
    e.preventDefault();
    setAppliedCode(codeInput.trim().toUpperCase());
  };
  const clearCode = () => {
    setCodeInput("");
    setAppliedCode("");
  };

  const codeMissing = appliedCode && !coupon;

  return (
    <div style={pageStyle}>
      <Head>
        <title>Cart | Titanium Geometry</title>
        <meta name="robots" content="noindex" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main style={mainStyle}>
        <h1 style={h1Style}>Your Cart</h1>

        {!loaded ? (
          <p style={{ color: "#6b7280" }}>Loading…</p>
        ) : items.length === 0 && unavailable.length === 0 ? (
          <div style={emptyStyle}>
            <p>Your cart is empty.</p>
            <Link href="/shop" style={btnPrimaryStyle}>
              Browse Pieces
            </Link>
          </div>
        ) : (
          <div style={layoutStyle}>
            {/* Items */}
            <div>
              {items.map((p) => (
                <div key={p.id} style={rowStyle}>
                  <img src={`/pendants/${p.folder}/1.jpg`} alt={p.name} style={thumbStyle} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/products/${p.id}`} style={itemNameStyle}>
                      {p.name}
                    </Link>
                    <p style={metaStyle}>
                      {p.group}
                      {p.itemId ? ` · Item #${p.itemId}` : ""}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={priceStyle}>
                      {priceInfo(p).onSale ? (
                        <>
                          <span style={{ color: "#dc2626" }}>{money(priceInfo(p).final)}</span>{" "}
                          <span style={wasStyle}>{money(priceInfo(p).list)}</span>
                        </>
                      ) : (
                        money(priceInfo(p).final)
                      )}
                    </div>
                    <button style={removeBtnStyle} onClick={() => remove(p.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              {unavailable.length > 0 && (
                <div style={soldNoticeStyle}>
                  <strong>No longer available</strong>
                  <p style={{ margin: "0.5rem 0" }}>
                    These sold before checkout, so they&apos;ve been left out of your total:
                  </p>
                  {unavailable.map((p) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.25rem 0" }}>
                      <span>
                        {p.name} {p.itemId ? `(#${p.itemId})` : ""}
                      </span>
                      <button style={removeBtnStyle} onClick={() => remove(p.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {items.length > 0 && (
                <button style={clearBtnStyle} onClick={clear}>
                  Empty cart
                </button>
              )}
            </div>

            {/* Summary */}
            <aside style={summaryStyle}>
              <h2 style={summaryTitleStyle}>Order Summary</h2>

              <label style={labelStyle}>Ship to:</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} style={selectStyle}>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code} disabled={c.disabled}>
                    {c.name}
                    {c.rate != null && c.rate > 0 ? ` (+$${c.rate})` : ""}
                    {c.rate === 0 ? " (Free shipping)" : ""}
                  </option>
                ))}
              </select>
              <p style={shipNoteStyle}>Flat shipping — any number of pieces.</p>

              {/* Automatic offers. Applied without a code; never stacked. */}
              {AUTO_PROMOS.length > 0 && (
                <div style={promoBoxStyle}>
                  <div style={promoTitleStyle}>Automatic offers</div>
                  {AUTO_PROMOS.map((p) => {
                    const unlocked = promoUnlocked(p, totals.subtotal);
                    const applied = totals.appliedPromo && totals.appliedPromo.id === p.id;
                    return (
                      <div
                        key={p.id}
                        style={{ ...promoRowStyle, color: unlocked ? "#065f46" : "#6b7280" }}
                      >
                        <span aria-hidden="true">{unlocked ? "✓" : "○"}</span>
                        <span>
                          {p.description}
                          {applied && <strong> — applied</strong>}
                        </span>
                      </div>
                    );
                  })}
                  {totals.nextUp && (
                    <p style={promoNudgeStyle}>
                      Add {money(totals.nextUp.remaining)} more to get{" "}
                      {totals.nextUp.promo.label.toLowerCase()}.
                    </p>
                  )}
                  <p style={promoFineStyle}>
                    One offer per order — you automatically get whichever saves you more.
                    Not combinable with a coupon code.
                  </p>
                </div>
              )}

              {/* Coupon */}
              <form onSubmit={applyCode} style={{ margin: "1rem 0" }}>
                <label style={labelStyle}>Coupon code:</label>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    style={{ ...selectStyle, marginBottom: 0 }}
                  />
                  <button type="submit" style={applyBtnStyle}>
                    Apply
                  </button>
                </div>
                {codeMissing && <p style={errorTextStyle}>That code wasn&apos;t recognised.</p>}
                {coupon && !totals.couponValid && <p style={errorTextStyle}>{totals.couponReason}</p>}
                {totals.couponApplied && coupon && (
                  <p style={okTextStyle}>
                    {coupon.code} applied{coupon.description ? ` — ${coupon.description}` : ""}.{" "}
                    <button type="button" onClick={clearCode} style={linkBtnStyle}>
                      remove
                    </button>
                  </p>
                )}
                {totals.couponOutdone && coupon && (
                  <p style={noteTextStyle}>
                    {coupon.code} is valid, but the automatic offer above saves you at least as
                    much — and only one offer applies per order, so you&apos;re getting the better
                    one.{" "}
                    <button type="button" onClick={clearCode} style={linkBtnStyle}>
                      remove
                    </button>
                  </p>
                )}
              </form>

              <div style={totalRowStyle}>
                <span>Subtotal ({items.length} {items.length === 1 ? "piece" : "pieces"})</span>
                <span>{money(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div style={totalRowStyle}>
                  <span>
                    {totals.appliedPromo
                      ? totals.appliedPromo.label
                      : `Coupon ${coupon ? coupon.code : ""}`}
                  </span>
                  <span style={{ color: "#dc2626" }}>−{money(totals.discount)}</span>
                </div>
              )}
              <div style={totalRowStyle}>
                <span>Shipping</span>
                <span>
                  {totals.shippingWaived && totals.baseShipping > 0 ? (
                    <>
                      <span style={wasStyle}>{money(totals.baseShipping)}</span>{" "}
                      <span style={{ color: "#047857", fontWeight: 600 }}>Free</span>
                    </>
                  ) : totals.shipping === 0 ? (
                    "Free"
                  ) : (
                    money(totals.shipping)
                  )}
                </span>
              </div>
              <div style={grandTotalStyle}>
                <span>Total</span>
                <span>{money(totals.total)}</span>
              </div>

              {items.length > 0 && (
                <PayPalCartForm items={items} totals={totals} coupon={totals.couponApplied ? coupon : null} />
              )}
              {items.length > 0 && <SaveCart items={items} />}
              <p style={secureNoteStyle}>🔒 Secure checkout via PayPal.</p>
              <p style={secureNoteStyle}>
                <Link href="/returns" style={{ color: "#2563eb" }}>
                  30-day returns
                </Link>{" "}
                — return shipping $5 US / $20 international.
              </p>
              <p style={secureNoteStyle}>
                Questions? <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: "#2563eb" }}>{CONTACT_EMAIL}</a>
              </p>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

/**
 * Ways to keep a cart beyond this browser.
 *
 * The cart itself lives in localStorage, which is per-device and which Safari
 * clears after about a week of not visiting. Both buttons below hand the buyer
 * a plain /cart?add=… link — the same format our quote links use — so they can
 * reopen the exact cart anywhere, on any device, whenever they like.
 */
function SaveCart({ items }) {
  const [copied, setCopied] = useState(false);

  const url = useMemo(
    () => `${SITE_URL}/cart?add=${items.map((p) => p.itemId || p.id).join(",")}`,
    [items]
  );

  const mailto = useMemo(() => {
    const lines = items.map(
      (p) => `  • ${p.name}${p.itemId ? ` (#${p.itemId})` : ""} — ${money(effectivePrice(p))}`
    );
    const body = [
      "Here's the cart I put together at Titanium Geometry:",
      "",
      ...lines,
      "",
      "Open it again any time — this link fills the cart back in:",
      url,
      "",
      "Every piece is one of a kind, so it's first come, first served.",
    ].join("\n");
    return `mailto:?subject=${encodeURIComponent(
      "My Titanium Geometry cart"
    )}&body=${encodeURIComponent(body)}`;
  }, [items, url]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers, or a page not served over https.
      const field = document.createElement("textarea");
      field.value = url;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        document.execCommand("copy");
      } catch {
        /* nothing else to try — the buyer can still use the email button */
      }
      document.body.removeChild(field);
    }
    setCopied(true);
  };

  // Any change to the cart invalidates the copied link, so drop the confirmation.
  useEffect(() => setCopied(false), [url]);

  return (
    <div style={saveBoxStyle}>
      <div style={saveTitleStyle}>Not ready yet?</div>
      <p style={saveNoteStyle}>
        Save your cart so you can pick it up later, or on another device.
      </p>
      <div style={saveActionsStyle}>
        <button type="button" onClick={copyLink} style={saveBtnStyle}>
          {copied ? "✓ Link copied" : "🔗 Copy cart link"}
        </button>
        <a href={mailto} style={saveBtnStyle}>
          ✉️ Email it to me
        </a>
      </div>
    </div>
  );
}

/**
 * PayPal Payments Standard "cart upload": one POST carrying every line item,
 * a single shipping charge (handling_cart) and any coupon (discount_amount_cart).
 */
function PayPalCartForm({ items, totals, coupon }) {
  return (
    <form
      action="https://www.paypal.com/cgi-bin/webscr"
      method="post"
      target="_top"
      onSubmit={() => trackInitiateCheckout(items, totals.total)}
    >
      <input type="hidden" name="cmd" value="_cart" />
      <input type="hidden" name="upload" value="1" />
      <input type="hidden" name="business" value={PAYPAL_EMAIL} />
      <input type="hidden" name="currency_code" value="USD" />

      {items.map((p, i) => (
        <React.Fragment key={p.id}>
          <input
            type="hidden"
            name={`item_name_${i + 1}`}
            value={`${p.itemId ? p.itemId + " - " : ""}${p.name}`}
          />
          <input type="hidden" name={`item_number_${i + 1}`} value={p.id} />
          <input type="hidden" name={`amount_${i + 1}`} value={effectivePrice(p).toFixed(2)} />
          <input type="hidden" name={`quantity_${i + 1}`} value="1" />
        </React.Fragment>
      ))}

      {totals.shipping > 0 && (
        <input type="hidden" name="handling_cart" value={totals.shipping.toFixed(2)} />
      )}
      {totals.discount > 0 && (
        <input type="hidden" name="discount_amount_cart" value={totals.discount.toFixed(2)} />
      )}
      {/* Recorded on the PayPal notification so the order can be reconciled. */}
      {(coupon || totals.appliedPromo) && (
        <input
          type="hidden"
          name="custom"
          value={coupon ? `coupon:${coupon.code}` : `promo:${totals.appliedPromo.id}`}
        />
      )}

      <input type="hidden" name="no_shipping" value="2" />
      <input type="hidden" name="return" value={`${SITE_URL}/success`} />
      <input type="hidden" name="cancel_return" value={`${SITE_URL}/cart`} />

      <button type="submit" style={checkoutBtnStyle}>
        Check Out — {money(totals.total)}
      </button>
    </form>
  );
}

/* ===== styles ===== */
const pageStyle = {
  fontFamily: "'Segoe UI', system-ui, sans-serif",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
};
const mainStyle = { flex: 1, padding: "2rem", maxWidth: "1100px", margin: "0 auto", width: "100%" };
const h1Style = { fontSize: "1.75rem", marginBottom: "1.5rem" };
const layoutStyle = { display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" };
const rowStyle = {
  display: "flex",
  gap: "1rem",
  alignItems: "center",
  padding: "1rem 0",
  borderBottom: "1px solid #e5e7eb",
};
const thumbStyle = { width: 72, height: 72, objectFit: "cover", borderRadius: 6, background: "#f3f4f6" };
const itemNameStyle = { fontWeight: 600, color: "#111827", textDecoration: "none" };
const metaStyle = { color: "#6b7280", fontSize: "0.85rem", margin: "0.25rem 0 0" };
const priceStyle = { fontWeight: 700 };
const wasStyle = { textDecoration: "line-through", color: "#9ca3af", fontWeight: 400, fontSize: "0.85rem" };
const removeBtnStyle = {
  background: "none",
  border: "none",
  color: "#dc2626",
  cursor: "pointer",
  fontSize: "0.85rem",
  padding: "0.25rem 0",
};
const clearBtnStyle = {
  marginTop: "1rem",
  background: "none",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  padding: "0.5rem 0.9rem",
  cursor: "pointer",
  color: "#374151",
};
const soldNoticeStyle = {
  marginTop: "1rem",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: "1rem",
  color: "#7f1d1d",
};
const summaryStyle = { background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "1.25rem" };
const summaryTitleStyle = { margin: "0 0 1rem", fontSize: "1.1rem" };
const labelStyle = { display: "block", fontWeight: 500, marginBottom: "0.35rem", fontSize: "0.9rem" };
const selectStyle = {
  width: "100%",
  padding: "0.6rem",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: "0.95rem",
  marginBottom: "0.5rem",
  background: "#fff",
};
const shipNoteStyle = { fontSize: "0.8rem", color: "#6b7280", margin: "0 0 0.5rem" };
const applyBtnStyle = {
  padding: "0.6rem 0.9rem",
  border: "none",
  borderRadius: 6,
  background: "#374151",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};
const promoBoxStyle = {
  background: "#f0fdf4",
  border: "1px solid #bbf7d0",
  borderRadius: 6,
  padding: "0.7rem 0.8rem",
  margin: "0.75rem 0 0",
};
const promoTitleStyle = {
  fontWeight: 700,
  fontSize: "0.85rem",
  marginBottom: "0.4rem",
  color: "#065f46",
};
const promoRowStyle = {
  display: "flex",
  gap: "0.45rem",
  alignItems: "flex-start",
  fontSize: "0.85rem",
  lineHeight: 1.4,
  padding: "0.12rem 0",
};
const promoNudgeStyle = {
  margin: "0.5rem 0 0",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#065f46",
};
const promoFineStyle = { margin: "0.45rem 0 0", fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.4 };
const errorTextStyle = { color: "#b91c1c", fontSize: "0.85rem", margin: "0.5rem 0 0" };
const noteTextStyle = { color: "#374151", fontSize: "0.85rem", margin: "0.5rem 0 0", lineHeight: 1.45 };
const okTextStyle = { color: "#047857", fontSize: "0.85rem", margin: "0.5rem 0 0" };
const linkBtnStyle = {
  background: "none",
  border: "none",
  color: "#2563eb",
  cursor: "pointer",
  padding: 0,
  fontSize: "0.85rem",
  textDecoration: "underline",
};
const totalRowStyle = { display: "flex", justifyContent: "space-between", padding: "0.3rem 0", fontSize: "0.95rem" };
const grandTotalStyle = {
  display: "flex",
  justifyContent: "space-between",
  padding: "0.75rem 0 1rem",
  marginTop: "0.5rem",
  borderTop: "2px solid #111827",
  fontSize: "1.15rem",
  fontWeight: 700,
};
const checkoutBtnStyle = {
  width: "100%",
  padding: "0.9rem",
  fontSize: "1rem",
  fontWeight: 700,
  background: "#0070ba",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
const saveBoxStyle = {
  marginTop: "1rem",
  paddingTop: "1rem",
  borderTop: "1px solid #e5e7eb",
};
const saveTitleStyle = { fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.2rem" };
const saveNoteStyle = { fontSize: "0.8rem", color: "#6b7280", margin: "0 0 0.6rem", lineHeight: 1.4 };
const saveActionsStyle = { display: "flex", gap: "0.5rem", flexWrap: "wrap" };
const saveBtnStyle = {
  flex: "1 1 130px",
  padding: "0.55rem 0.6rem",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  background: "#fff",
  color: "#374151",
  fontSize: "0.82rem",
  fontWeight: 500,
  cursor: "pointer",
  textAlign: "center",
  textDecoration: "none",
  whiteSpace: "nowrap",
};
const secureNoteStyle = { fontSize: "0.8rem", color: "#6b7280", textAlign: "center", margin: "0.5rem 0 0" };
const emptyStyle = { textAlign: "center", padding: "3rem 1rem", color: "#374151" };
const btnPrimaryStyle = {
  display: "inline-block",
  marginTop: "1rem",
  padding: "0.75rem 1.5rem",
  background: "#111827",
  color: "#fff",
  textDecoration: "none",
  borderRadius: 6,
};
