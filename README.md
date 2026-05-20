# Chicago Breslov Website

The source for [chicagobreslov.org](https://chicagobreslov.org), hosted on **GitHub Pages** with a minimal **Jekyll** build.

## Background

This site was ported from Weebly. The original Weebly export was converted to a self-contained static site and is now maintained here as plain HTML/CSS.

## Tech Stack

- **Jekyll** — minimal build (no layouts/templates used; Jekyll is only invoked for GitHub Pages compatibility)
- **GitHub Pages** — hosting and deployment; pushes to `main` deploy automatically
- **Weebly Birdseye theme** — custom theme CSS/JS carried over from the original Weebly export
- **jQuery 1.8.3** + **Hammer.js** — interactivity (touch gestures, mobile nav)
- **Hebcal widget** — Jewish calendar / upcoming events on the front page
- **GiveButter** — donation widget embedded on select pages

## Structure

```
index.html              # Home page (includes Hebcal widget)
bookstore.html
contact-us.html
heal.html
likutei-moharan.html
previous-events.html
rsvp.html
tikkun.html
torah4tuvia.html
tzaddik.html
files/
  main_style.css        # Primary custom stylesheet
  theme/files/
    custom.js           # All custom JS (birdseyeController pattern)
    manifest.json       # Theme configuration
    plugins.js          # Hammer.js v2.0.4
uploads/1/              # Uploaded images and media
```

## Local Development

Jekyll is required only to mirror GitHub Pages behavior locally.

```bash
bundle install
bundle exec jekyll serve
```

Then open `http://localhost:4000`.

Since there are no layouts or Liquid templates, you can also open any `.html` file directly in a browser without running Jekyll.

## Deployment

Push to `main` — GitHub Pages builds and deploys automatically.
