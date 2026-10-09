// ===========================================================================
// Cursor light (all pages)
// ---------------------------------------------------------------------------
// The page background reacts to the mouse: a grid of accent-colored dots
// lights up around the cursor (the text, images and cards stay in front).
// The JS only gives the mouse position (--mx, --my on <html>); the CSS
// draws the dots inside the section backgrounds (see "Cursor light" in style.css).
// Same smoothing as the logo galaxy: the light covers a share of the remaining
// distance on each frame, and the loop stops once it has caught up.
// Mouse/trackpad only (no cursor on a touchscreen), and not with "reduce motion".
// ===========================================================================

if (matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const root = document.documentElement;
  const SMOOTHING = 0.18;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0, running = false;

  const render = () => {
    currentX += (targetX - currentX) * SMOOTHING;
    currentY += (targetY - currentY) * SMOOTHING;
    root.style.setProperty("--mx", `${currentX.toFixed(1)}px`);
    root.style.setProperty("--my", `${currentY.toFixed(1)}px`);

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
    // First movement: the light appears directly under the mouse (no slide from the corner)
    if (!root.classList.contains("has-cursor-light")) {
      currentX = targetX;
      currentY = targetY;
      root.classList.add("has-cursor-light");
    }
    if (!running) {
      running = true;
      requestAnimationFrame(render);
    }
  }, { passive: true });

  // The mouse leaves the window: the light fades out
  root.addEventListener("pointerleave", () => {
    root.classList.remove("has-cursor-light");
  });
}
