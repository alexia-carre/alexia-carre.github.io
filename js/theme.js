// ===========================================================================
// Light / dark mode
// ---------------------------------------------------------------------------
// - By default, the site follows the system setting (prefers-color-scheme).
// - The button forces a mode: we store data-theme="light|dark" on <html>,
//   and the CSS switches the color tokens accordingly.
// - The choice is remembered (localStorage) for the next visit.
//
// This file is loaded in the <head> WITHOUT "defer": it must apply the saved
// choice BEFORE the page is drawn, otherwise the page would "flash" in the
// wrong theme for a split second.
// ===========================================================================

(() => {
  const root = document.documentElement;
  const STORAGE_KEY = "theme";
  const systemDark = matchMedia("(prefers-color-scheme: dark)");

  // localStorage can be blocked (private browsing…): try/catch so nothing breaks
  const load = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };
  const save = (value) => { try { localStorage.setItem(STORAGE_KEY, value); } catch {} };

  // 1. Immediately: reapply the saved choice
  const saved = load();
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  // Theme actually displayed: the forced choice, otherwise the system's
  const current = () => root.dataset.theme || (systemDark.matches ? "dark" : "light");

  const icons = {
    // Shown in light mode: "switch to dark" → moon
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    // Shown in dark mode: "switch to light" → sun
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  };

  // 2. Once the HTML is read: create the button in the navigation bar.
  //    It only exists if JS works, which makes sense: without JS it couldn't do anything.
  document.addEventListener("DOMContentLoaded", () => {
    const nav = document.querySelector(".site-nav");
    if (!nav) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";

    const render = () => {
      const isDark = current() === "dark";
      button.innerHTML = isDark ? icons.sun : icons.moon;
      // The label describes the ACTION, for screen readers and the tooltip
      const label = isDark ? "Switch to light mode" : "Switch to dark mode";
      button.setAttribute("aria-label", label);
      button.title = label;
    };

    button.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      save(next);
      render();
    });

    // If the visitor changes their system theme while the page is open
    systemDark.addEventListener("change", render);

    render();
    nav.append(button);
  });
})();
