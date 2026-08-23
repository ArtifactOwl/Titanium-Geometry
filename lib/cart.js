// Cart state, kept in localStorage so it survives a refresh.
//
// Every piece is one of a kind, so a line is just a product id plus the fitting
// the buyer chose — a cord or a key ring. Carts saved before that choice
// existed are plain arrays of ids, and are read back as necklaces.

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
        return { id: entry.id, wear: normaliseWear(entry.wear) };
      }
      return null;
    })
    .filter(Boolean);
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

  const add = (id, wear = DEFAULT_WEAR) =>
    setItems((prev) =>
      prev.some((it) => it.id === id) ? prev : [...prev, { id, wear: normaliseWear(wear) }]
    );
  const remove = (id) => setItems((prev) => prev.filter((it) => it.id !== id));
  const setWear = (id, wear) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, wear: normaliseWear(wear) } : it))
    );
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
      value={{ items, ids, add, remove, setWear, wearFor, clear, has, count: items.length, loaded }}
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
      clear: () => {},
      has: () => false,
      count: 0,
      loaded: false,
    }
  );
}
