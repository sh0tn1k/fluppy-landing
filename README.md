# Fluppy landing

Marketing landing page for **Fluppy** — an AI assistant for running Telegram channels (Mini App + bot).

Live (GitHub Pages): **https://sh0tn1k.github.io/fluppy-landing/**

## Structure

```
docs/                 ← served by GitHub Pages (source: /docs on main)
  index.html
  css/styles.css
  js/main.js
  images/             ← SVG placeholders (replace with final art)
```

## Local preview

Open `docs/index.html` in a browser, or:

```bash
cd docs && python3 -m http.server 8080
```

## GitHub Pages

This repo is configured to publish from **`/docs` on `main`**.

If Pages is not enabled yet:

1. Repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: **main** / folder: **/docs**
4. Save — site appears at `https://sh0tn1k.github.io/fluppy-landing/`

Or via API:

```bash
gh api -X POST repos/sh0tn1k/fluppy-landing/pages \
  -f build_type=legacy \
  -f source[branch]=main \
  -f source[path]=/docs
```

## Placeholders

Replace files under `docs/images/` (e.g. `hero-placeholder.svg`, `feature-*.svg`) with final screenshots or illustrations. Paths are relative for project Pages.

## Design notes

Layout rhythm and tokens inspired by [major.bot](https://major.bot) (light Telegram-ish UI, `#007AFF` / `#FF9500`, large rounded cards). Fluppy content only — no tokenomics, no Major brand assets.
