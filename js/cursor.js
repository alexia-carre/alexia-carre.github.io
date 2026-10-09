// ===========================================================================
// Pencil trace (all pages)
// ---------------------------------------------------------------------------
// The mouse leaves a thin pink line behind it, like a pencil stroke,
// which fades away after a moment.
// - A <canvas> covers the window: it's a surface you can draw on in JS.
// - We remember the last positions of the mouse, each with its time.
// - On each frame: we erase everything, forget the points that are too old,
//   and redraw the line through the remaining ones. The older a segment,
//   the thinner and more transparent it is → the line "dries up" from its tail.
// - The loop stops as soon as there's nothing left to draw (saves battery).
// Mouse/trackpad only (no cursor on a touchscreen), and not with "reduce motion".
// ===========================================================================

if (matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const canvas = document.createElement("canvas");
  canvas.className = "cursor-trace";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  const LIFETIME = 700;    // ms before a point disappears
  const MAX_WIDTH = 2.4;   // thickness of the line at the tip (px)
  let points = [];         // [{ x, y, t }]
  let running = false;

  // Sharp line on high-resolution screens: the canvas gets as many
  // pixels as the screen really displays (devicePixelRatio)
  const resize = () => {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const draw = () => {
    const now = performance.now();
    points = points.filter((p) => now - p.t < LIFETIME);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // The color comes from the CSS (accent 2): follows the light/dark theme
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent-2");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Segment by segment, each with its own thickness and opacity.
    // Curves through the midpoints → a smooth line, not a broken one.
    for (let i = 1; i < points.length - 1; i++) {
      const life = 1 - (now - points[i].t) / LIFETIME;   // 1 = fresh, 0 = gone
      const a = points[i - 1], b = points[i], c = points[i + 1];
      ctx.globalAlpha = life * 0.9;
      ctx.lineWidth = MAX_WIDTH * (0.35 + 0.65 * life);
      ctx.beginPath();
      ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (points.length > 0) {
      requestAnimationFrame(draw);
    } else {
      running = false;
    }
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    points.push({ x: event.clientX, y: event.clientY, t: performance.now() });
    if (!running) {
      running = true;
      requestAnimationFrame(draw);
    }
  }, { passive: true });
}
