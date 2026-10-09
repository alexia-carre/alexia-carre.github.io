// ===========================================================================
// Neon trace (all pages)
// ---------------------------------------------------------------------------
// The mouse leaves a short "cyberpunk" neon line behind it: pink at the tip,
// fading into accent 1 at the tail, with a glowing halo, a bright core,
// and a slight color split (like a glitching screen).
// - A <canvas> covers the window: it's a surface you can draw on in JS.
// - We remember the last positions of the mouse, each with its time.
// - On each frame: we erase everything, forget the points that are too old,
//   and redraw. The older a segment, the thinner and more transparent it is.
// - The loop stops as soon as there's nothing left to draw (saves battery).
// Mouse/trackpad only (no cursor on a touchscreen), and not with "reduce motion".
// ===========================================================================

if (matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const canvas = document.createElement("canvas");
  canvas.className = "cursor-trace";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  const LIFETIME = 320;   // ms before a point of the line disappears (= line length)
  const MAX_WIDTH = 3;    // thickness of the line at the tip (px)
  const GLOW = 12;        // blur of the neon halo (px)
  const SPLIT = 2;        // offset of the color split (px)
  const ROUNDING = 0.6;   // 0–1: the higher, the more the line sticks to the mouse (sharper)

  let points = [];        // [{ x, y, t }]
  let smoothX = 0, smoothY = 0, hasPosition = false, running = false;

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

  // "#ff3d81" → [255, 61, 129]. Trick: the canvas converts any CSS color
  // into "#rrggbb" when you assign it to fillStyle.
  const toRGB = (color) => {
    ctx.fillStyle = color.trim();
    const hex = ctx.fillStyle.slice(1);
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  };

  const rgb = (c) => `rgb(${c.join(",")})`;

  // Color between "from" (amount 0) and "to" (amount 1)
  const mix = (from, to, amount) => rgb(from.map((v, i) => Math.round(v + (to[i] - v) * amount)));

  // Draws the whole line once, with a given offset, color, width and opacity
  // (called several times per frame: the color split, the neon halo, the bright core)
  const strokeLine = (now, { dx = 0, color, width, alpha, glow = 0 }) => {
    ctx.shadowBlur = glow;
    for (let i = 1; i < points.length - 1; i++) {
      const life = 1 - (now - points[i].t) / LIFETIME;   // 1 = fresh, 0 = gone
      const a = points[i - 1], b = points[i], c = points[i + 1];
      ctx.strokeStyle = color(life);
      ctx.shadowColor = ctx.strokeStyle;
      ctx.globalAlpha = alpha * life;
      ctx.lineWidth = width * (0.3 + 0.7 * life);
      // Curves through the midpoints → a smooth line, not a broken one
      ctx.beginPath();
      ctx.moveTo((a.x + b.x) / 2 + dx, (a.y + b.y) / 2);
      ctx.quadraticCurveTo(b.x + dx, b.y, (b.x + c.x) / 2 + dx, (b.y + c.y) / 2);
      ctx.stroke();
    }
  };

  const draw = () => {
    const now = performance.now();
    points = points.filter((p) => now - p.t < LIFETIME);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // The colors come from the CSS: follow the light/dark theme
    const css = getComputedStyle(document.documentElement);
    const head = toRGB(css.getPropertyValue("--accent-2"));
    const tail = toRGB(css.getPropertyValue("--accent"));
    const bg = toRGB(css.getPropertyValue("--bg"));
    const isDark = bg[0] + bg[1] + bg[2] < 384;

    // Dark mode: the colors ADD UP like light ("lighter") → real neon effect.
    // Light mode: normal mode (adding light on a light background would be invisible).
    ctx.globalCompositeOperation = isDark ? "lighter" : "source-over";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 1. Color split: two thin copies, offset left (pink) and right (accent 1)
    strokeLine(now, { dx: -SPLIT, color: () => rgb(head), width: MAX_WIDTH * 0.5, alpha: 0.45 });
    strokeLine(now, { dx: SPLIT, color: () => rgb(tail), width: MAX_WIDTH * 0.5, alpha: 0.45 });
    // 2. Neon halo: the gradient line (accent 1 at the tail → pink at the tip), blurred
    strokeLine(now, { color: (life) => mix(tail, head, life), width: MAX_WIDTH, alpha: 0.9, glow: GLOW });
    // 3. Bright core: a thin, almost white line in the middle (dark mode only)
    if (isDark) {
      strokeLine(now, { color: (life) => mix([255, 255, 255], head, 1 - life * 0.6), width: MAX_WIDTH * 0.35, alpha: 0.9 });
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = "source-over";

    if (points.length > 0) {
      requestAnimationFrame(draw);
    } else {
      running = false;
    }
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;

    // Smoothed position: follows the mouse with a slight delay
    if (!hasPosition) {
      smoothX = event.clientX;
      smoothY = event.clientY;
      hasPosition = true;
    }
    smoothX += (event.clientX - smoothX) * ROUNDING;
    smoothY += (event.clientY - smoothY) * ROUNDING;
    points.push({ x: smoothX, y: smoothY, t: performance.now() });

    if (!running) {
      running = true;
      requestAnimationFrame(draw);
    }
  }, { passive: true });

  // The mouse leaves the window: the next line starts fresh where it comes back
  document.documentElement.addEventListener("pointerleave", () => {
    hasPosition = false;
  });
}
