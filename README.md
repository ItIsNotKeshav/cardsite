# Hermes Card

A design concept for a titanium rewards card, built with [Astro](https://astro.build).

- `src/pages/index.astro` assembles the page from `src/components/`.
- `src/data/card.js` holds every rate, fee, plan and benefit, so the sections and the rewards calculator agree.
- `src/scripts/main.js` runs the scroll story (GSAP + Lenis). The Three.js card in `src/scripts/card.js` loads as a separate chunk after first paint.

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
```

Vercel builds it with `npm run build` and serves `dist/` (see `vercel.json`).
