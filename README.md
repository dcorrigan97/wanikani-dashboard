# WaniKani Dashboard

A single-page dashboard for your WaniKani data: SRS progress, review accuracy
breakdown, a streak/activity heatmap, and level progression timing.

## How it works

- Static React app (Vite). No backend.
- You paste your WaniKani API v2 token once into the browser; it's stored in
  `localStorage` and sent only to `api.wanikani.com`, direct from your browser.
- Subjects (kanji/vocab/radicals — ~10k items) are cached in `localStorage`
  after the first load and updated incrementally via `updated_after`, since
  they rarely change. Everything else refetches on demand.
- Reviews history is the slowest call (paginated, could be thousands of
  records for high-level users) — that's what powers the streak heatmap.

## Local development

```bash
npm install
npm run dev
```

## Deploying to GitHub Pages

1. Push this project to a new GitHub repo.
2. `npm install -g gh-pages` (or rely on the local devDependency already in
   `package.json`).
3. Run:
   ```bash
   npm run build
   npm run deploy
   ```
   This builds to `dist/` and pushes it to a `gh-pages` branch via the
   `gh-pages` package.
4. In the repo's Settings → Pages, set the source to the `gh-pages` branch.
5. Your dashboard will be live at `https://<username>.github.io/<repo-name>/`.

`vite.config.js` uses `base: './'` (relative paths) so it works out of the
box on a project page without editing the config. If you ever see a blank
page after deploying, hardcode `base: '/<repo-name>/'` instead and rebuild.

## Notes / known trade-offs

- No backend means your API token lives in browser localStorage — fine for a
  single-user tool only you load, not something to share publicly.
- The "Trickiest Items" table only counts items with 4+ reviews, to avoid
  noise from one-off misses.
- "Full resync" clears the subjects cache and refetches everything; use it if
  data ever looks stale or wrong.
