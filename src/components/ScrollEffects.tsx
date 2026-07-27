"use client";

import { useEffect } from "react";

export default function ScrollEffects() {
  useEffect(() => {
    const revealItems = document.querySelectorAll<HTMLElement>(".reveal");
    const serviceRows = document.querySelectorAll<HTMLElement>("[data-service-row]");

    // Header tersembunyi merentasi hero + section video; muncul sebaik
    // section "Our Services" sampai ke atas viewport (bukan sekadar lepas hero)
    const topShell = document.querySelector<HTMLElement>(".top-shell");
    const servicesSection = document.getElementById("services");
    let onHeaderScroll: (() => void) | undefined;
    if (topShell && servicesSection) {
      onHeaderScroll = () => {
        const rect = servicesSection.getBoundingClientRect();
        topShell.classList.toggle("is-hidden", rect.top > 0);
      };
      window.addEventListener("scroll", onHeaderScroll, { passive: true });
      onHeaderScroll();
    }

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
      if (onHeaderScroll) window.removeEventListener("scroll", onHeaderScroll);
    };
  }, []);

  return null;
}
