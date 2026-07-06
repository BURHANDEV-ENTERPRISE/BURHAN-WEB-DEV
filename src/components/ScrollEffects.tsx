"use client";

import { useEffect } from "react";

export default function ScrollEffects() {
  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>(".reveal");
    const serviceRows = document.querySelectorAll<HTMLElement>("[data-service-row]");

    function activateServiceRow(row: HTMLElement) {
      serviceRows.forEach((item) =>
        item.classList.toggle("is-active", item === row)
      );
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));

    serviceRows.forEach((row) => {
      row.addEventListener("mouseenter", () => activateServiceRow(row));
      row.addEventListener("focus", () => activateServiceRow(row));
      row.addEventListener("click", () => activateServiceRow(row));
    });

    requestAnimationFrame(() => {
      document.documentElement.classList.remove("is-booting");
    });

    return () => {
      revealObserver.disconnect();
    };
  }, []);

  return null;
}
