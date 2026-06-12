import "./styles.css";

const hero = document.querySelector("[data-scroll-stage]");
const frameLabel = document.querySelector("[data-frame-label]");
const revealItems = document.querySelectorAll(".reveal");
const serviceRows = document.querySelectorAll("[data-service-row]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const frameNames = ["Scope", "Design", "Build", "Polish", "Launch", "Care"];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setActiveFrame(frame) {
  if (!hero) return;

  hero.dataset.frame = String(frame);
  if (frameLabel) {
    frameLabel.textContent = frameNames[frame] ?? frameNames[0];
  }
}

function setMotionVars(progress) {
  if (!hero) return;

  const wordShift = -58 * progress;
  const wordAltShift = 22 * progress;
  const sceneX = (progress - 0.38) * 11;
  const sceneY = Math.sin(progress * Math.PI) * -1.45;
  const sceneRotate = -12 + progress * 46;
  const coreRotate = progress * -28;
  const cursorX = progress * 16;
  const cursorY = progress * 9;

  hero.style.setProperty("--word-shift", `${wordShift.toFixed(3)}rem`);
  hero.style.setProperty("--word-alt-shift", `${wordAltShift.toFixed(3)}rem`);
  hero.style.setProperty("--scene-x", `${sceneX.toFixed(3)}rem`);
  hero.style.setProperty("--scene-y", `${sceneY.toFixed(3)}rem`);
  hero.style.setProperty("--scene-rotate", `${sceneRotate.toFixed(3)}deg`);
  hero.style.setProperty("--core-rotate", `${coreRotate.toFixed(3)}deg`);
  hero.style.setProperty("--cursor-x", `${cursorX.toFixed(3)}rem`);
  hero.style.setProperty("--cursor-y", `${cursorY.toFixed(3)}rem`);
}

function updateHeroProgress() {
  if (!hero) return;

  if (reduceMotion.matches) {
    hero.style.setProperty("--scroll-progress", "1");
    setMotionVars(1);
    setActiveFrame(frameNames.length - 1);
    return;
  }

  const bounds = hero.getBoundingClientRect();
  const travel = Math.max(1, bounds.height - window.innerHeight);
  const progress = clamp(-bounds.top / travel, 0, 1);
  const frame = Math.min(frameNames.length - 1, Math.floor(progress * frameNames.length));

  hero.style.setProperty("--scroll-progress", progress.toFixed(4));
  setMotionVars(progress);
  setActiveFrame(frame);
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
