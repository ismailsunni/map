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

1. **Create the folder:** `maps/<your-map-id>/`
2. **Write `index.html`:**
   - Load whatever mapping library you want (CDN or local bundle)
   - Include a `← Gallery` back button: `<a class="back-btn" href="../../index.html">← Gallery</a>`
   - Load `../../assets/gallery.css` for the shared back-button style
3. **Register it in `maps/maps.json`:**
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
4. **(Optional)** Add a `thumb.png` (16:9 screenshot) inside the map folder for the gallery card.
5. Push to `main` — GitHub Actions handles the rest.

## Per-Map Builds (Optional)

If a map needs a build step (e.g., Vite, Webpack), add a step in `.github/workflows/deploy.yml`
under the commented-out section. The final output should be inside the map folder so the static
upload picks it up.

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
