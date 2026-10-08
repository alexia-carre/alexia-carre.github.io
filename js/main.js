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
