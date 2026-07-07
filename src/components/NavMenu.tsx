"use client";

// Butang hamburger header — klik untuk buka menu pilih section.
// Tutup bila klik luar, tekan Escape, atau pilih link.

import { useEffect, useRef, useState } from "react";

const LINKS = [
  { href: "#top", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#pricing", label: "Pricing" },
  { href: "#work", label: "Why Us" },
  { href: "#contact", label: "Contact" },
];

export default function NavMenu() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="nav-menu">
      <button
        type="button"
        className="menu-capsule"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? "Tutup menu" : "Buka menu navigasi"}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="hamburger-icon" aria-hidden="true">
          <i></i>
          <i></i>
        </span>
      </button>
      {open && (
        <nav className="nav-menu__panel" aria-label="Navigasi section">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
