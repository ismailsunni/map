# 🗺️ Map Collection

A personal gallery of interactive maps built with various mapping libraries.

**Live site:** https://ismailsunni.github.io/map/

## Maps

| Map | Library |
|-----|---------|
| [World Overview](maps/ol-world/) | OpenLayers |
| [City Explorer](maps/maplibre-city/) | MapLibre GL JS |
| [3D Globe](maps/cesium-globe/) | CesiumJS |

## Adding a Map

See [CLAUDE.md](CLAUDE.md) for full instructions.

Short version:
1. Create `maps/<id>/index.html` with your map
2. Add an entry to `maps/maps.json`
3. Push to `main`

## Tech

- No framework, no build step (by default)
- Libraries loaded via CDN per-map
- GitHub Actions → GitHub Pages
