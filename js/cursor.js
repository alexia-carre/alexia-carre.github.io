// ===========================================================================
// Pencil trace (all pages)
// ---------------------------------------------------------------------------
// The mouse leaves a short line behind it, like a pencil stroke (pink at
// the tip, fading into accent 1 at the tail),
// sprinkled with little doodle stars, all fading away after a moment.
// - A <canvas> covers the window: it's a surface you can draw on in JS.
// - We remember the last positions of the mouse, each with its time.
// - On each frame: we erase everything, forget what's too old, and redraw.
//   The older a segment, the thinner and more transparent it is
//   → the line "dries up" from its tail.
// - The loop stops as soon as there's nothing left to draw (saves battery).
// Mouse/trackpad only (no cursor on a touchscreen), and not with "reduce motion".
// ===========================================================================

if (matchMedia("(hover: hover)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const canvas = document.createElement("canvas");
  canvas.className = "cursor-trace";
  canvas.setAttribute("aria-hidden", "true");
  document.body.append(canvas);
  const ctx = canvas.getContext("2d");

  const LIFETIME = 380;       // ms before a point of the line disappears (= line length)
  const MAX_WIDTH = 4.6;      // thickness of the line at the tip (px)
  const SOFTNESS = 6;         // blur of the halo around the line and stars (px)
  const ROUNDING = 0.45;      // 0–1: the lower, the more the line rounds off the corners
  const STAR_EVERY = 70;      // a star every ~70 px traveled
  const STAR_LIFETIME = 750;  // stars stay a bit longer than the line

  let points = [];   // [{ x, y, t }]
  let stars = [];    // [{ x, y, t, size, angle, spin, dx, dy }]
  let smoothX = 0, smoothY = 0, distance = 0, hasPosition = false, running = false;

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

  // 4-pointed star, like the doodles: 4 tips (top, right, bottom, left)
  // joined by curves that "pinch" toward the center (control point at k)
  const drawStar = (x, y, r, angle) => {
    const k = r * 0.18;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(k, -k, r, 0);
    ctx.quadraticCurveTo(k, k, 0, r);
    ctx.quadraticCurveTo(-k, k, -r, 0);
    ctx.quadraticCurveTo(-k, -k, 0, -r);
    ctx.restore();   // the path stays drawn; fill() is called afterwards
  };

  // "#ff3d81" → [255, 61, 129]. Trick: the canvas converts any CSS color
  // into "#rrggbb" when you assign it to fillStyle.
  const toRGB = (color) => {
    ctx.fillStyle = color.trim();
    const hex = ctx.fillStyle.slice(1);
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  };

  // Color between "from" (amount 0) and "to" (amount 1)
  const mix = (from, to, amount) =>
    `rgb(${from.map((v, i) => Math.round(v + (to[i] - v) * amount)).join(",")})`;

  const draw = () => {
    const now = performance.now();
    points = points.filter((p) => now - p.t < LIFETIME);
    stars = stars.filter((s) => now - s.t < STAR_LIFETIME);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    // The colors come from the CSS: follow the light/dark theme.
    // Gradient along the line: accent 2 (pink) at the tip → accent 1 at the tail
    const css = getComputedStyle(document.documentElement);
    const head = toRGB(css.getPropertyValue("--accent-2"));
    const tail = toRGB(css.getPropertyValue("--accent"));
    ctx.fillStyle = `rgb(${head.join(",")})`;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = SOFTNESS;   // a blurred "shadow" around each shape = soft glow

    // The line: segment by segment, each with its own thickness and opacity.
    // Curves through the midpoints → a smooth line, not a broken one.
    for (let i = 1; i < points.length - 1; i++) {
      const life = 1 - (now - points[i].t) / LIFETIME;   // 1 = fresh, 0 = gone
      const a = points[i - 1], b = points[i], c = points[i + 1];
      ctx.strokeStyle = mix(tail, head, life);
      ctx.shadowColor = ctx.strokeStyle;     // soft halo of the same color
      ctx.globalAlpha = 0.15 + 0.55 * life;  // never fully opaque: a soft line, not a marker
      ctx.lineWidth = MAX_WIDTH * (0.3 + 0.7 * life);
      ctx.beginPath();
      ctx.moveTo((a.x + b.x) / 2, (a.y + b.y) / 2);
      ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2);
      ctx.stroke();
    }

    // The stars: they pop (grow quickly), drift a little, turn, then fade
    stars.forEach((s) => {
      const age = (now - s.t) / STAR_LIFETIME;            // 0 → 1
      const pop = Math.min(1, age * 5);                   // reaches full size at 20%
      ctx.globalAlpha = (1 - age) * 0.8;
      ctx.shadowColor = ctx.fillStyle;
      drawStar(s.x + s.dx * age, s.y + s.dy * age, s.size * pop, s.angle + s.spin * age);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    if (points.length > 0 || stars.length > 0) {
      requestAnimationFrame(draw);
    } else {
      running = false;
    }
  };

  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const now = performance.now();

    // Smoothed position: follows the mouse with a slight delay, which
    // rounds off the sharp turns → a softer, more "drawn" line
    if (!hasPosition) {
      smoothX = event.clientX;
      smoothY = event.clientY;
      hasPosition = true;
    }
    const prevX = smoothX, prevY = smoothY;
    smoothX += (event.clientX - smoothX) * ROUNDING;
    smoothY += (event.clientY - smoothY) * ROUNDING;
    points.push({ x: smoothX, y: smoothY, t: now });

    // Every STAR_EVERY px traveled, a little star appears next to the line
    distance += Math.hypot(smoothX - prevX, smoothY - prevY);
    if (distance > STAR_EVERY) {
      distance = 0;
      const side = Math.random() < 0.5 ? -1 : 1;
      stars.push({
        x: smoothX + side * (6 + Math.random() * 8),
        y: smoothY + (Math.random() - 0.5) * 16,
        t: now,
        size: 5.5 + Math.random() * 4,              // 5.5 to 9.5 px
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 2,            // turns a bit, one way or the other
        dx: side * (4 + Math.random() * 6),         // drifts away from the line
        dy: -4 - Math.random() * 6,                 // and rises slightly
      });
    }

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
