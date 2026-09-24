/**
 * Lexora — Ambient Background Motion Controller
 * Injects floating gradient orbs and a mouse-following glow into the page.
 * 
 * Features:
 *   - 3 slow-drifting blurred orbs (CSS-animated, GPU-accelerated)
 *   - Subtle mouse-following radial glow using requestAnimationFrame
 *   - Respects prefers-reduced-motion (skips injection entirely)
 *   - Zero impact on layout, content, or interactivity (pointer-events: none)
 *
 * Usage: Include this script on any page after custom.css is loaded.
 *        It self-initializes on DOMContentLoaded.
 */

(function () {
  "use strict";

  // ---- Bail out if user prefers reduced motion ----
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motionQuery.matches) return;

  function init() {
    // ---- Prevent double-initialization ----
    if (document.querySelector(".lexora-ambient")) return;

    // ---- Create ambient container ----
    const container = document.createElement("div");
    container.className = "lexora-ambient";
    container.setAttribute("aria-hidden", "true");

    // ---- Create 4 floating orbs for rich multi-color ambient depth ----
    for (let i = 1; i <= 3; i++) {
      const orb = document.createElement("div");
      orb.className = `ambient-orb ambient-orb--${i}`;
      container.appendChild(orb);
    }

    // ---- Inject before first child of body ----
    document.body.insertBefore(container, document.body.firstChild);

    // ---- Mouse-following spotlight glow ----
    const glow = document.createElement("div");
    glow.className = "ambient-mouse-glow";
    glow.setAttribute("aria-hidden", "true");
    document.body.appendChild(glow);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let glowX = mouseX;
    let glowY = mouseY;
    let isMouseInside = false;
    let rafId = null;

    // Smooth lerp factor
    const LERP = 0.08;

    function updateGlow() {
      glowX += (mouseX - glowX) * LERP;
      glowY += (mouseY - glowY) * LERP;

      glow.style.transform = `translate3d(${Math.round(glowX)}px, ${Math.round(glowY)}px, 0) translate(-50%, -50%)`;

      rafId = requestAnimationFrame(updateGlow);
    }

    document.addEventListener("mousemove", function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;

      if (!isMouseInside) {
        isMouseInside = true;
        glow.classList.add("active");
        if (!rafId) rafId = requestAnimationFrame(updateGlow);
      }
    }, { passive: true });

    document.addEventListener("mouseleave", function () {
      isMouseInside = false;
      glow.classList.remove("active");
    });

    // Start the animation loop
    rafId = requestAnimationFrame(updateGlow);

    // ---- Card-level cursor spotlight effect ----
    document.addEventListener("mousemove", function (e) {
      const cards = document.querySelectorAll(".bento-card, .glass-card");
      cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        if (
          e.clientX >= rect.left - 50 &&
          e.clientX <= rect.right + 50 &&
          e.clientY >= rect.top - 50 &&
          e.clientY <= rect.bottom + 50
        ) {
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty("--mouse-x", `${x}px`);
          card.style.setProperty("--mouse-y", `${y}px`);
        }
      });
    }, { passive: true });

    // ---- Cleanup on reduced-motion change at runtime ----
    motionQuery.addEventListener("change", function (e) {
      if (e.matches) {
        if (rafId) cancelAnimationFrame(rafId);
        container.remove();
        glow.remove();
      }
    });
  }

  // ---- Initialize when DOM is ready ----
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
