# Alexia Carré · Portfolio

Personal portfolio, migrated from Framer to a static site in plain HTML/CSS,
hosted for free on GitHub Pages.

## Structure

```
index.html              Home page
mywork.html             List of projects
myskills.html           Skills + testimonial
about.html              About me (+ photo carousel)
resume.html             Resume
fire_safety.html        Case study
data_tagging.html       Case study
cookbook.html           Case study
404.html                "Page not found" page (used automatically by GitHub Pages)
css/style.css           All the styles. Colors/sizes are in :root at the top
js/main.js              Carousel on the About page
assets/images/          Images, sorted by purpose
assets/alexia-carre-resume.png   Downloadable resume
```

## Editing the site

- **Change some text**: open the `.html` file and edit it directly.
- **Change a color everywhere**: edit the variable in `:root` at the top of `css/style.css`.
- **Add a project**: copy `cookbook.html`, rename it, change the content,
  then add a card in `mywork.html` (and a window in `index.html`).
- **Replace an image**: put the new file in `assets/images/…` with the same name,
  or change the `src="…"` in the HTML. Before adding a photo, resize it (≤ 2000 px wide).

## Previewing locally

```bash
node .claude/serve.js
```

Then open http://localhost:8080.

## Publishing

Every `git push` to the `main` branch automatically updates the site on GitHub Pages
(about 1 minute).

```bash
git add .
git commit -m "Describe the change"
git push
```

## Credits

AI-generated background and windows. Stickmans from [Paulalee](https://www.flaticon.com/fr/auteurs/paulalee).
