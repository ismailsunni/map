# CLAUDE.md — Map Collection

## What is this?

A personal gallery of interactive maps, each demonstrating a different mapping library or technique.
Hosted on GitHub Pages via GitHub Actions.

## Project Structure

```
map/
├── index.html              # Gallery page — reads maps/maps.json dynamically
├── assets/
│   └── gallery.css         # Shared styles (dark theme, cards, back button)
├── maps/
│   ├── maps.json           # Master list of all maps (metadata)
│   └── <map-id>/
│       └── index.html      # Self-contained map page (loads its own lib via CDN)
└── .github/
    └── workflows/
        └── deploy.yml      # Push to main → auto-deploy to GitHub Pages
```

## Adding a New Map

### Option A — Plain HTML (CDN-based)
1. Create `maps/<your-map-id>/index.html`
   - Load your mapping library via CDN
   - Back button: `<a class="back-btn" href="../index.html">← Gallery</a>` *(note: `../`, not `../../`)*
2. Register in `maps/maps.json` (see format below)
3. Push to `main` — done.

### Option B — Vite/npm build (package.json)
1. Create `maps/<your-map-id>/` with a `package.json` that has a `"build"` script outputting to `dist/`
2. The root build script (`scripts/build.js`) **auto-detects** `package.json` and runs `npm install && npm run build` — no extra config needed
3. Register in `maps/maps.json`
4. Push to `main` — done.

### Option C — External repo as Git submodule (with package.json)
This lets you maintain a map in its own repository and include it in the gallery.

**Requirements for the external repo:**
- Must have `package.json` with a `"build"` script that outputs to `dist/`
- Back button in `index.html` must use `../index.html` (one level up, since the gallery flattens paths)
- Should not hardcode absolute paths

**Steps to add:**
```bash
# 1. Add the submodule
cd /path/to/map
git submodule add https://github.com/<user>/<repo> maps/<id>
git commit -m "add: <name> as submodule"
git push
```

The GitHub Actions workflow already fetches submodules (`submodules: true` in checkout step).
The build script will detect `package.json` and build it automatically.

**The external repo can also deploy itself independently.**
Add this workflow to the external repo (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm install
      - run: npm run build
        env:
          # Pass any secrets the map needs
          VITE_STADIA_API_KEY: ${{ secrets.VITE_STADIA_API_KEY }}
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - uses: actions/deploy-pages@v4
        id: deployment
```

This means the map deploys to **two places**:
- `<user>.github.io/<repo>/` — standalone, from the map's own repo
- `ismailsunni.id/map/<id>/` — as part of the gallery, via submodule

**Important:** The map's `index.html` back button path differs between standalone and gallery.
To handle both, use a relative `../index.html` — in standalone mode this 404s gracefully,
or conditionally hide the back button when not in the gallery context.

**Updating a submodule to latest:**
```bash
cd maps/<id> && git pull origin main && cd ../..
git add maps/<id> && git commit -m "update: <name> submodule" && git push
```

### maps.json entry format
```json
{
  "id": "your-map-id",
  "title": "Your Map Title",
  "description": "What does this map show?",
  "library": "LibraryName",
  "libraryColor": "#hexcolor",
  "thumbnail": "thumb.png",
  "tags": ["tag1", "tag2"]
}
```

Add a `thumb.png` (640×360px) inside the map folder for the gallery card thumbnail.

## Mapping Libraries Used

| Map | Library | Notes |
|-----|---------|-------|
| `ol-world` | [OpenLayers](https://openlayers.org/) v10 | OSM raster tiles |
| `maplibre-city` | [MapLibre GL JS](https://maplibre.org/) v4 | Vector tiles, OpenFreeMap style |
| `cesium-globe` | [CesiumJS](https://cesium.com/) v1.122 | 3D globe, OSM imagery |

## Cesium Token

The Cesium globe works without a token for basic OSM imagery. For Cesium Ion assets
(terrain, imagery packs), set your token in `maps/cesium-globe/index.html`:

```js
Cesium.Ion.defaultAccessToken = 'YOUR_TOKEN_HERE';
```

Get a free token at https://cesium.com/ion/tokens

## Deployment

- **Auto:** Push to `main` triggers `deploy.yml`
- **Manual:** GitHub → Actions → "Deploy to GitHub Pages" → Run workflow
- **Pages config:** Repo Settings → Pages → Source: `GitHub Actions`

## Design Decisions

- **No monorepo tooling:** Each map is a plain HTML file. No shared bundler, no nx/turborepo.
- **CDN-first:** Libraries loaded from CDN unless a map specifically needs a build step.
- **Self-contained maps:** Each `maps/<id>/index.html` is a standalone file — works independently.
- **Dark theme:** The gallery uses a dark UI so maps (which are colorful) pop visually.
- **maps.json as the single source of truth:** Gallery renders from this file, so adding a map = one JSON entry + one folder.
