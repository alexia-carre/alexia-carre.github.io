// ===========================================================================
// Cursor light (all pages)
// ---------------------------------------------------------------------------
// A soft halo in the accent color follows the mouse, like a flashlight
// on the page. Same principle as the logo galaxy: the halo covers a share
// of the remaining distance on each frame (smoothing), and the loop stops
// once it has caught up with the mouse.
// Mouse/trackpad only (no cursor on a touchscreen), and not with "reduce motion".
// pointer-events: none (CSS) → the halo never blocks a click.
// ===========================================================================

if (matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.append(glow);

  const SMOOTHING = 0.18;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0, running = false;

  const render = () => {
    currentX += (targetX - currentX) * SMOOTHING;
    currentY += (targetY - currentY) * SMOOTHING;
    glow.style.translate = `${currentX.toFixed(1)}px ${currentY.toFixed(1)}px`;

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
    // First movement: the halo appears directly under the mouse (no slide from the corner)
    if (!glow.classList.contains("is-visible")) {
      currentX = targetX;
      currentY = targetY;
      glow.classList.add("is-visible");
    }
    if (!running) {
      running = true;
      requestAnimationFrame(render);
    }
  }, { passive: true });

  // The mouse leaves the window: the halo fades out
  document.documentElement.addEventListener("pointerleave", () => {
    glow.classList.remove("is-visible");
  });
}
