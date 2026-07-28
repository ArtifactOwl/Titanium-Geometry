// Cart state, kept in localStorage so it survives a refresh.
// Every piece is one of a kind, so the cart is simply a list of product ids.

import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "tg_cart";
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [ids, setIds] = useState([]);
  const [loaded, setLoaded] = useState(false);

  // Read once on mount (localStorage isn't available during server render).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) setIds(parsed.filter((x) => typeof x === "string"));
    } catch {
      /* ignore unreadable storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* storage full or blocked — the cart just won't persist */
    }
  }, [ids, loaded]);

  const add = (id) => setIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const remove = (id) => setIds((prev) => prev.filter((x) => x !== id));
  const clear = () => setIds([]);
  const has = (id) => ids.includes(id);

  return (
    <CartContext.Provider value={{ ids, add, remove, clear, has, count: ids.length, loaded }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  // Render-safe fallback if a page is ever used outside the provider.
  return ctx || { ids: [], add: () => {}, remove: () => {}, clear: () => {}, has: () => false, count: 0, loaded: false };
}
