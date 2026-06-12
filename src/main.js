import "./styles.css";

const hero = document.querySelector("[data-scroll-stage]");
const revealItems = document.querySelectorAll(".reveal");
const serviceRows = document.querySelectorAll("[data-service-row]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setMotionVars(progress) {
  if (!hero) return;

  const sceneX = (progress - 0.38) * 11;
  const sceneRotate = -12 + progress * 46;

  hero.style.setProperty("--scene-x", `${sceneX.toFixed(3)}rem`);
  hero.style.setProperty("--scene-rotate", `${sceneRotate.toFixed(3)}deg`);
}

function updateHeroProgress() {
  if (!hero) return;

  if (reduceMotion.matches) {
    hero.style.setProperty("--scroll-progress", "1");
    setMotionVars(1);
    return;
  }

  const bounds = hero.getBoundingClientRect();
  const travel = Math.max(1, bounds.height - window.innerHeight);
  const progress = clamp(-bounds.top / travel, 0, 1);

  hero.style.setProperty("--scroll-progress", progress.toFixed(4));
  setMotionVars(progress);
}

function activateServiceRow(row) {
  serviceRows.forEach((item) => item.classList.toggle("is-active", item === row));
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
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

window.addEventListener("scroll", updateHeroProgress, { passive: true });
window.addEventListener("resize", updateHeroProgress);
reduceMotion.addEventListener("change", updateHeroProgress);

updateHeroProgress();

requestAnimationFrame(() => {
  document.documentElement.classList.remove("is-booting");
});
