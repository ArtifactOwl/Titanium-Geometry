// Horizontally scrollable row of featured pieces.
//
// Touch devices get native swiping for free; on desktop you can drag with the
// mouse or use the arrow buttons. How many cards fit is set by CSS breakpoints
// (see .featured-rail in pages/_app.js) and the rest scroll into view.

import React, { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";

// How far the pointer must move before we treat it as a drag rather than a
// click — without this, a small wobble while clicking would swallow the link.
const DRAG_THRESHOLD = 6;

const OFFSET_KEY = "tg_featured_offset";

// The newest pieces hold the front of the rail on every visit. Rotating the
// whole list would keep pushing new work out of view, which defeats the point
// of featuring it.
//
// Two rather than three: five cards show on a desktop, so pinning three left
// only two changing and the rail looked static. Two pinned leaves three of the
// five turning over, which is visible.
const PINNED_NEWEST = 2;

export default function FeaturedRail({ products, rotate = true, pinned = PINNED_NEWEST }) {
  // Behind the pinned newest pieces, which one comes next changes from visit
  // to visit, so the rail doesn't look identical every time. The order is
  // rotated (not shuffled) so the sequence stays coherent and every piece
  // gets a turn.
  //
  // It happens after mount, never during render: the server has no idea which
  // visit this is, and varying the markup would break hydration.
  const [ordered, setOrdered] = useState(products);
  const rotated = useRef(false);
  const railRef = useRef(null);

  useEffect(() => {
    setOrdered(products);
    rotated.current = false;
  }, [products]);

  // How many cards a visitor can actually see, measured rather than guessed —
  // the count is set by CSS breakpoints, and measuring keeps this in step with
  // them instead of repeating the numbers here.
  const visibleCount = useCallback(() => {
    const el = railRef.current;
    const card = el && el.querySelector("[data-rail-item]");
    const width = card ? card.getBoundingClientRect().width : 0;
    if (el && width && el.clientWidth) {
      const styles = window.getComputedStyle(el);
      const gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return Math.max(1, Math.round(el.clientWidth / (width + gap)));
    }
    // Nothing measurable — a hidden tab, or a layout that hasn't settled.
    // Guessing from the window beats falling back to 1, which would collapse
    // the step and make the rail look like it never moves. Mirrors the
    // breakpoints on .featured-rail in _app.js.
    const w = typeof window === "undefined" ? 1200 : window.innerWidth;
    if (w > 1150) return 5;
    if (w > 900) return 4;
    if (w > 650) return 3;
    return 2;
  }, []);

  useEffect(() => {
    if (!rotate || rotated.current) return;
    if (!products) return;

    const head = products.slice(0, pinned);
    const tail = products.slice(pinned);
    if (tail.length < 2) return;   // nothing behind the pinned ones to rotate
    rotated.current = true;

    // Move on by however many rotating cards were on screen, so a return visit
    // shows a fresh set rather than the same ones shifted along by one. The
    // pinned pieces take up part of the view, so they come off the step.
    const step = Math.max(1, Math.min(visibleCount() - pinned, tail.length - 1));

    let offset;
    try {
      const saved = window.localStorage.getItem(OFFSET_KEY);
      offset = saved == null ? Math.floor(Math.random() * tail.length) : parseInt(saved, 10);
      if (!Number.isFinite(offset)) offset = 0;
      window.localStorage.setItem(OFFSET_KEY, String((offset + step) % tail.length));
    } catch {
      // Private browsing or blocked storage — still vary it, just don't persist.
      offset = Math.floor(Math.random() * tail.length);
    }

    const i = ((offset % tail.length) + tail.length) % tail.length;
    if (i !== 0) setOrdered([...head, ...tail.slice(i), ...tail.slice(0, i)]);
  }, [products, rotate, pinned, visibleCount]);

  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 });
  const [dragging, setDragging] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    updateArrows();
    window.addEventListener("resize", updateArrows);
    return () => window.removeEventListener("resize", updateArrows);
  }, [updateArrows, ordered]);

  const onPointerDown = (e) => {
    // Let the browser handle touch scrolling; only take over for mouse drags.
    if (e.pointerType === "touch") return;
    const el = railRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: 0 };
    setDragging(true);
    // Capture keeps the drag alive if the pointer wanders outside the rail.
    try {
      el.setPointerCapture(e.pointerId);
      drag.current.pointerId = e.pointerId;
    } catch {
      /* capture is a nicety; dragging still works without it */
    }
  };

  const onPointerMove = (e) => {
    const el = railRef.current;
    if (!el || !drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx));
    el.scrollLeft = drag.current.startScroll - dx;
  };

  const endDrag = () => {
    if (!drag.current.active) return;
    const el = railRef.current;
    if (el && drag.current.pointerId != null) {
      try {
        el.releasePointerCapture(drag.current.pointerId);
      } catch {
        /* already released */
      }
      drag.current.pointerId = null;
    }
    drag.current.active = false;
    setDragging(false);
    updateArrows();
  };

  // A drag shouldn't also open the product it finished on.
  const onClickCapture = (e) => {
    if (drag.current.moved > DRAG_THRESHOLD) {
      e.preventDefault();
      e.stopPropagation();
    }
    drag.current.moved = 0;
  };

  const scrollByCards = (direction) => {
    const el = railRef.current;
    if (!el) return;
    const card = el.querySelector("[data-rail-item]");
    const step = card ? card.getBoundingClientRect().width + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  if (!products || products.length === 0) return null;

  return (
    <div style={wrapStyle}>
      <button
        type="button"
        aria-label="Scroll featured pieces left"
        onClick={() => scrollByCards(-1)}
        disabled={!canScrollLeft}
        style={{ ...arrowStyle, left: 0, opacity: canScrollLeft ? 1 : 0, pointerEvents: canScrollLeft ? "auto" : "none" }}
      >
        ‹
      </button>

      <div
        ref={railRef}
        className={`featured-rail${dragging ? " dragging" : ""}`}
        onScroll={updateArrows}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        // Product photos sit inside links, so without this the browser starts
        // its own image/link drag and the rail never moves.
        onDragStart={(e) => e.preventDefault()}
      >
        {ordered.map((product) => (
          <div key={product.id} data-rail-item>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Scroll featured pieces right"
        onClick={() => scrollByCards(1)}
        disabled={!canScrollRight}
        style={{ ...arrowStyle, right: 0, opacity: canScrollRight ? 1 : 0, pointerEvents: canScrollRight ? "auto" : "none" }}
      >
        ›
      </button>
    </div>
  );
}

const wrapStyle = { position: "relative" };

const arrowStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 2,
  width: "2.25rem",
  height: "2.25rem",
  borderRadius: "999px",
  border: "1px solid #e5e7eb",
  background: "rgba(255,255,255,0.95)",
  color: "#111827",
  fontSize: "1.4rem",
  lineHeight: 1,
  cursor: "pointer",
  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
  transition: "opacity 0.2s",
};
