# Fluppy landing

Marketing landing page for **Fluppy** — an AI assistant for running Telegram channels (Mini App + bot).

Live (GitHub Pages): **https://sh0tn1k.github.io/fluppy-landing/**

## Structure

```
docs/                 ← served by GitHub Pages (source: /docs on main)
  index.html
  css/styles.css
  js/main.js
  lottie/             ← product Lottie JSON from sh0tn1k/tma-ai (public/lottie)
  images/             ← favicon + simple Telegram brand icon
```

## Animations

Hero, How it works, Features, Built-for strip, and Socials use **Lottie** animations from the Fluppy product repo (`sh0tn1k/tma-ai` → `public/lottie/`). They are loaded via [lottie-web](https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js) and initialized lazily when scrolled into view. Without JS, layout still works (empty rounded slots).

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

## Design notes

Layout rhythm and tokens inspired by [major.bot](https://major.bot) (light Telegram-ish UI, `#007AFF` / `#FF9500`, large rounded cards). Fluppy content only — no tokenomics, no Major brand assets.
