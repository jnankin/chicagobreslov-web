# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static website for Chicago Breslov, exported from Weebly and hosted on GitHub Pages. The site uses **Jekyll** as a build system — GitHub Pages runs Jekyll automatically on push, so there is no separate build step required locally. There are no automated tests or package manager.

## Architecture

The site uses a custom Weebly theme called **Birdseye** with jQuery 1.8.3 and Hammer.js for interactivity. All external scripts and stylesheets are loaded from Weebly's CDN (`cdn11.editmysite.com`, `cdn2.editmysite.com`).

**Jekyll structure:**
- `_config.yml` — Jekyll config (site title, excluded files)
- `_layouts/default.html` — shared HTML shell (head, scripts, body wrapper) with Liquid tags
- `_includes/header.html` — site header and navigation
- `_includes/footer.html` — mobile nav, scripts, footer
- Each page uses front matter (`layout`, `title`, `description`, `page_id`, etc.)

**Key files:**
- `files/main_style.css` — primary custom stylesheet (322 lines)
- `files/theme/files/custom.js` — all custom JS; uses a `birdseyeController` object pattern with jQuery plugin extensions on `$.fn`
- `files/theme/files/manifest.json` — theme configuration (responsive toggles, color variations, custom options)
- `files/theme/files/plugins.js` — Hammer.js v2.0.4 (touch gestures)

**Pages:** `index.html`, `bookstore.html`, `contact-us.html`, `heal.html`, `likutei-moharan.html`, `menu.html`, `previous-events.html`, `rsvp.html`, `tikkun.html`, `torah4tuvia.html`, `tzaddik.html`

**Uploaded content** lives under `uploads/1/`.

## Theme Features (manifest.json)

The theme supports body-class toggles via CSS:
- `full-width-body` — removes max-width constraint
- `header-overlay` — adds gradient overlay on header
- `alt-nav` — contrast navigation styling

Light/dark color variations are also supported.

## Third-Party Integrations

- **GiveButter** (`widgets.givebutter.com`) — donation widget embedded on some pages
- **FancyBox** — image lightbox (loaded from Weebly CDN)
- Weebly RPC API used for customer account management (built into Weebly-generated HTML)

## Responsive Breakpoints

- `992px` — mobile navigation threshold (hamburger menu activates)
- `767px` — desktop typography sizing
