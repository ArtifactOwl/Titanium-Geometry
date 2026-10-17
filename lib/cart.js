// Cart state, kept in localStorage so it survives a refresh.
//
// Every piece is one of a kind, so a line is just a product id plus the fitting
// the buyer chose — a cord or a key ring. Carts saved before that choice
// existed are plain arrays of ids, and are read back as necklaces. A bundle's
// line also carries `fittings`, one choice per wearable piece in it.

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_WEAR, normaliseWear } from "./wear";

const STORAGE_KEY = "tg_cart";
const CartContext = createContext(null);

/** Accept both the old shape (["id", …]) and the current one. */
function parseStored(raw) {
  let parsed;
  try {
    parsed = raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((entry) => {
      if (typeof entry === "string") return { id: entry, wear: DEFAULT_WEAR };
      if (entry && typeof entry.id === "string") {
        const line = { id: entry.id, wear: normaliseWear(entry.wear) };
        const fittings = cleanFittings(entry.fittings);
        if (fittings) line.fittings = fittings;
        return line;
      }
      return null;
    })
    .filter(Boolean);
}

/** Keep only known choices; null when there are none worth storing. */
function cleanFittings(value) {
  if (!value || typeof value !== "object") return null;
  const out = {};
  Object.keys(value).forEach((id) => {
    out[id] = normaliseWear(value[id]);
  });
  return Object.keys(out).length ? out : null;
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Read once on mount (localStorage isn't available during server render).
  useEffect(() => {
    try {
      setItems(parseStored(localStorage.getItem(STORAGE_KEY)));
    } catch {
      /* ignore unreadable storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or blocked — the cart just won't persist */
    }
  }, [items, loaded]);

  const add = (id, wear = DEFAULT_WEAR, fittings = null) =>
    setItems((prev) => {
      if (prev.some((it) => it.id === id)) return prev;
      const line = { id, wear: normaliseWear(wear) };
      const clean = cleanFittings(fittings);
      if (clean) line.fittings = clean;
      return [...prev, line];
    });
  const remove = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const setWear = (id, wear) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, wear: normaliseWear(wear) } : it))
    );
  // One piece's choice within a bundle line.
  const setFitting = (id, pieceId, wear) =>
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, fittings: { ...(it.fittings || {}), [pieceId]: normaliseWear(wear) } }
          : it
      )
    );
  const fittingsFor = (id) => {
    const found = items.find((it) => it.id === id);
    return (found && found.fittings) || {};
  };
  const clear = () => setItems([]);
  const has = (id) => items.some((it) => it.id === id);
  const wearFor = (id) => {
    const found = items.find((it) => it.id === id);
    return found ? found.wear : DEFAULT_WEAR;
  };

  // `ids` is kept so anything only needing the contents doesn't have to care
  // about fittings.
  const ids = items.map((it) => it.id);

  return (
    <CartContext.Provider
      value={{
        items, ids, add, remove, setWear, wearFor, setFitting, fittingsFor,
        clear, has, count: items.length, loaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  // Render-safe fallback if a page is ever used outside the provider.
  return (
    ctx || {
      items: [],
      ids: [],
      add: () => {},
      remove: () => {},
      setWear: () => {},
      wearFor: () => DEFAULT_WEAR,
      setFitting: () => {},
      fittingsFor: () => ({}),
      clear: () => {},
      has: () => false,
      count: 0,
      loaded: false,
    }
  );
}
