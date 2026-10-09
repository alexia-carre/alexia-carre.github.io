// ===========================================================================
// Cursor companion (all pages)
// ---------------------------------------------------------------------------
// A small pink star-molecule (in the style of the doodles) follows the mouse.
// Same smoothing as the logo galaxy: it covers a share of the remaining
// distance on each frame → it trails a little behind the cursor, and the
// loop stops once it has caught up.
// Mouse/trackpad only (no cursor on a touchscreen), and not with "reduce motion".
// ===========================================================================

if (matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const star = document.createElement("div");
  star.className = "cursor-star";
  star.setAttribute("aria-hidden", "true");
  // A 4-pointed star in the middle, linked to 3 small "atoms" by thin lines
  star.innerHTML = `
    <svg viewBox="0 0 40 40" fill="currentColor">
      <g stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity="0.55">
        <path d="M20 20 31 9M20 20 7 14M20 20 26 33"/>
      </g>
      <circle cx="31" cy="9" r="2.4"/>
      <circle cx="7" cy="14" r="1.8"/>
      <circle cx="26" cy="33" r="2"/>
      <path d="M20 12c.9 5.2 2.8 7.1 8 8-5.2.9-7.1 2.8-8 8-.9-5.2-2.8-7.1-8-8 5.2-.9 7.1-2.8 8-8Z"/>
    </svg>`;
  document.body.append(star);

  const SMOOTHING = 0.2;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0, running = false;

  const render = () => {
    currentX += (targetX - currentX) * SMOOTHING;
    currentY += (targetY - currentY) * SMOOTHING;
    star.style.translate = `${currentX.toFixed(1)}px ${currentY.toFixed(1)}px`;

    if (Math.abs(targetX - currentX) < 0.1 && Math.abs(targetY - currentY) < 0.1) {
      running = false;
      return;
    }
    requestAnimationFrame(render);
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    targetX = event.clientX;
    targetY = event.clientY;
    // First movement: it appears directly under the mouse (no slide from the corner)
    if (!star.classList.contains("is-visible")) {
      currentX = targetX;
      currentY = targetY;
      star.classList.add("is-visible");
    }
    // Over something clickable: the star grows a little
    star.classList.toggle("is-over-link", !!event.target.closest("a, button"));
    if (!running) {
      running = true;
      requestAnimationFrame(render);
    }
  }, { passive: true });

  // The mouse leaves the window: the star fades out
  document.documentElement.addEventListener("pointerleave", () => {
    star.classList.remove("is-visible");
  });
}
