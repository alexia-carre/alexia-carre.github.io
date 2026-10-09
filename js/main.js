// Does the visitor want reduced animations? (system setting, accessibility)
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
// Does the device have a mouse/trackpad that can "hover" over elements?
const canHover = matchMedia("(hover: hover)").matches;


// ===========================================================================
// Galaxy: mouse parallax on the logos (home page)
// ---------------------------------------------------------------------------
// 1. On each mouse movement, we compute where it is relative to the
//    center of the screen: from -1 (left/top) to +1 (right/bottom).
// 2. Each logo should move by that value × its depth (data-depth),
//    in the opposite direction from the mouse → depth effect.
// 3. Rather than jumping straight to the target, the logo covers 8% of the
//    remaining distance on every frame: that's what makes the movement smooth.
// ===========================================================================

const logos = [...document.querySelectorAll(".logo-grid img[data-depth]")];

if (logos.length && canHover && !reduceMotion) {
  let targetX = 0, targetY = 0;   // where the mouse is (-1 → 1)
  let currentX = 0, currentY = 0; // where the animation is
  let running = false;

  const SMOOTHING = 0.08;

  const animate = () => {
    currentX += (targetX - currentX) * SMOOTHING;
    currentY += (targetY - currentY) * SMOOTHING;

    logos.forEach((logo) => {
      const depth = Number(logo.dataset.depth);
      logo.style.setProperty("--px", `${(-currentX * depth).toFixed(2)}px`);
      logo.style.setProperty("--py", `${(-currentY * depth).toFixed(2)}px`);
    });

    // Target reached (to within a hair)? Stop the loop to save battery.
    if (Math.abs(targetX - currentX) < 0.001 && Math.abs(targetY - currentY) < 0.001) {
      running = false;
      return;
    }
    // requestAnimationFrame: "call me again on the next frame" (~60 times/second)
    requestAnimationFrame(animate);
  };

  window.addEventListener("pointermove", (event) => {
    targetX = (event.clientX / window.innerWidth) * 2 - 1;
    targetY = (event.clientY / window.innerHeight) * 2 - 1;
    if (!running) {
      running = true;
      requestAnimationFrame(animate);
    }
  }, { passive: true });
}


// ===========================================================================
// Facade windows on touchscreens (home page)
// ---------------------------------------------------------------------------
// No hover on a phone: the window opens on its own when it passes
// through the middle of the screen. IntersectionObserver tells the browser
// "notify me when this element enters/leaves this zone", which is far more
// efficient than computing positions on every scroll.
// ===========================================================================

const windows = document.querySelectorAll(".window");

if (windows.length && !canHover) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-open", entry.isIntersecting);
    });
  }, {
    // Shrinks the detection zone to a horizontal band in the middle of the screen
    rootMargin: "-35% 0px -35% 0px",
  });

  windows.forEach((w) => observer.observe(w));
}


// ===========================================================================
// Rolling numbers, odometer-style (key figures + case studies)
// ---------------------------------------------------------------------------
// The number stays written in the HTML (e.g. "80%"): without JS or with
// "reduce motion", it's displayed as is. Otherwise we replace each digit
// with a strip 0→9 (twice) that scrolls behind a window 1em tall, and we
// shift it to the target digit when the number becomes visible.
// Screen readers read a hidden copy of the final value, not the animation.
// ===========================================================================

const rollingNumbers = [...document.querySelectorAll(".stat__value, .case__stats strong")]
  .filter((el) => /\d/.test(el.textContent));   // "∞" has no digit: we leave it alone

if (rollingNumbers.length && !reduceMotion) {
  const roll = (el) => {
    el.querySelectorAll(".odo__strip").forEach((strip, i) => {
      strip.style.transitionDelay = `${i * 90}ms`;               // digits stop one after the other
      strip.style.transform = `translateY(-${10 + Number(strip.dataset.digit)}em)`;
    });
  };

  rollingNumbers.forEach((el) => {
    const finalText = el.textContent.trim();
    el.textContent = "";

    // Final value for screen readers
    const readable = document.createElement("span");
    readable.className = "visually-hidden";
    readable.textContent = finalText;

    // Visual version: one span per character
    const odo = document.createElement("span");
    odo.className = "odo";
    odo.setAttribute("aria-hidden", "true");
    for (const char of finalText) {
      if (/\d/.test(char)) {
        const digit = document.createElement("span");
        digit.className = "odo__digit";
        const strip = document.createElement("span");
        strip.className = "odo__strip";
        strip.dataset.digit = char;
        for (let n = 0; n < 20; n++) {                            // 0→9, twice
          const s = document.createElement("span");
          s.textContent = n % 10;
          strip.append(s);
        }
        digit.append(strip);
        odo.append(digit);
      } else {
        const c = document.createElement("span");
        c.className = "odo__char";
        c.textContent = char;
        odo.append(c);
      }
    }
    el.append(readable, odo);
  });

  // Starts once the number is at least half visible, then we stop watching it
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      roll(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.5 });

  rollingNumbers.forEach((el) => observer.observe(el));
}


// ===========================================================================
// Facade cards: same height (home page)
// ---------------------------------------------------------------------------
// Each card sits inside ITS OWN window: CSS can't align them with one
// another. So we measure the tallest one and give its height to all of them
// (via the --window-card-height variable). Recalculated if the width changes
// (text wrapping onto more or fewer lines) and once the font has loaded.
// ===========================================================================

const windowList = document.querySelector(".windows");
const windowCards = [...document.querySelectorAll(".window__card")];

if (windowList && windowCards.length) {
  const equalizeCards = () => {
    // 1. Return to natural height to measure the real content…
    windowList.style.removeProperty("--window-card-height");
    // 2. …find the tallest card…
    const tallest = Math.max(...windowCards.map((card) => card.offsetHeight));
    // 3. …and apply its height to all of them.
    windowList.style.setProperty("--window-card-height", `${tallest}px`);
  };

  // ResizeObserver: notified whenever the list's size changes (window,
  // phone rotation, zoom…). We only recalculate if the WIDTH changed:
  // adjusting the heights changes the height of the list, which would
  // otherwise trigger the observer again in a loop.
  let lastWidth = 0;
  new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);
    if (width === lastWidth) return;
    lastWidth = width;
    equalizeCards();
  }).observe(windowList);

  // The web font can load after the script: we measure again once it's ready
  document.fonts?.ready.then(equalizeCards);
}


// ===========================================================================
// Business card that flips over (home page)
// ---------------------------------------------------------------------------
// - Without JS, both faces are shown one below the other (see CSS).
// - With JS, we enable the .is-interactive mode (faces superimposed, 3D).
// - Click ANYWHERE on the card = flip it… except on a link
//   ("Get to know me", LinkedIn), which must keep working.
// - "inert" makes the hidden face unreachable: neither Tab nor screen readers
//   land on links you can't see.
// ===========================================================================

document.querySelectorAll("[data-bizcard]").forEach((card) => {
  const front = card.querySelector(".bizcard__face--front");
  const back = card.querySelector(".bizcard__face--back");
  const buttons = card.querySelectorAll(".bizcard__flip");

  card.classList.add("is-interactive");
  buttons.forEach((button) => { button.hidden = false; });

  const setFlipped = (flipped, moveFocus) => {
    card.classList.toggle("is-flipped", flipped);
    front.inert = flipped;
    back.inert = !flipped;
    // Keyboard: focus follows onto the visible face
    if (moveFocus) (flipped ? back : front).querySelector(".bizcard__flip").focus();
  };

  card.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;            // a link: let it work
    const fromKeyboard = event.detail === 0;          // Enter/Space on the button
    setFlipped(!card.classList.contains("is-flipped"), fromKeyboard);
  });

  setFlipped(false, false);

  // --- Parallax: the card tilts toward the mouse (the doodles, "printed" on it, follow) ---
  // Same principle as the logo galaxy: we compute a target (-1 → 1), then
  // approach it a bit more on each frame (smoothing), and the loop
  // stops once the card has settled. Mouse only, and not with "reduce motion".
  if (!canHover || reduceMotion) return;

  const MAX_TILT = 8;        // max tilt, in degrees
  const SMOOTHING = 0.12;
  let targetX = 0, targetY = 0, currentX = 0, currentY = 0, running = false;

  const render = () => {
    currentX += (targetX - currentX) * SMOOTHING;
    currentY += (targetY - currentY) * SMOOTHING;

    card.style.setProperty("--tilt-y", `${(currentX * MAX_TILT).toFixed(2)}deg`);
    card.style.setProperty("--tilt-x", `${(-currentY * MAX_TILT).toFixed(2)}deg`);
    // Sheen: position of the light, in % of the card
    card.style.setProperty("--gx", `${((currentX + 1) * 50).toFixed(1)}%`);
    card.style.setProperty("--gy", `${((currentY + 1) * 50).toFixed(1)}%`);

    if (Math.abs(targetX - currentX) < 0.001 && Math.abs(targetY - currentY) < 0.001) {
      running = false;
      return;
    }
    requestAnimationFrame(render);
  };

  const start = () => {
    if (!running) { running = true; requestAnimationFrame(render); }
  };

  card.addEventListener("pointermove", (event) => {
    const box = card.getBoundingClientRect();
    targetX = ((event.clientX - box.left) / box.width) * 2 - 1;
    targetY = ((event.clientY - box.top) / box.height) * 2 - 1;
    card.classList.add("is-tilting");
    start();
  });

  // Mouse leaves the card: it gently returns to flat
  card.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    card.classList.remove("is-tilting");
    start();
  });
});


// ===========================================================================
// Photo carousel (About page)
// ---------------------------------------------------------------------------
// "Progressive enhancement" principle: the HTML/CSS already work without
// JavaScript (horizontal swipe/scroll). This script only ADDS the
// arrows and dots. If JS fails to load, nothing is broken.
// ===========================================================================

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".carousel__track");
  const slides = [...track.children];

  // Scrolls to slide n (wrapping from last to first and vice versa)
  const goTo = (n) => {
    const index = (n + slides.length) % slides.length;
    track.scrollTo({ left: slides[index].offsetLeft });
  };

  const current = () => Math.round(track.scrollLeft / track.clientWidth);

  // --- Arrows ---
  const arrow = (direction, label, icon) => {
    const button = document.createElement("button");
    button.className = `carousel__arrow carousel__arrow--${direction}`;
    button.setAttribute("aria-label", label);
    button.innerHTML = `<img src="assets/images/deco/${icon}" alt="" width="40" height="40">`;
    button.addEventListener("click", () => goTo(current() + (direction === "next" ? 1 : -1)));
    carousel.append(button);
  };
  arrow("prev", "Previous photo", "arrow-left.svg");
  arrow("next", "Next photo", "arrow-right.svg");

  // --- Dots ---
  const dots = document.createElement("div");
  dots.className = "carousel__dots";
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "carousel__dot";
    dot.setAttribute("aria-label", `Photo ${i + 1} of ${slides.length}`);
    dot.addEventListener("click", () => goTo(i));
    dots.append(dot);
  });
  carousel.append(dots);

  // Highlights the dot of the visible slide (after a click OR a swipe)
  const update = () => {
    [...dots.children].forEach((dot, i) => dot.setAttribute("aria-current", i === current()));
  };
  track.addEventListener("scroll", update, { passive: true });
  update();
});
