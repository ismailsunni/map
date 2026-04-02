# 🗺️ Map Collection

A personal gallery of interactive maps built with various mapping libraries.

**Live site:** https://ismailsunni.id/map/

## Maps

| Map | Library |
|-----|---------|
| [World Overview](maps/ol-world/) | OpenLayers |
| [City Explorer](maps/maplibre-city/) | MapLibre GL JS |
| [3D Globe](maps/cesium-globe/) | CesiumJS |

## Adding a Map

See [CLAUDE.md](CLAUDE.md) for full instructions. Three options:

| Option | When to use |
|--------|-------------|
| Plain HTML | CDN-only map, no build step |
| npm/Vite | Map needs a build step (`package.json` with `"build"` script) |
| Git submodule | Map lives in its own repository |

**Submodule quick start:**
```bash
git submodule add https://github.com/<user>/<repo> maps/<id>
git commit -m "add: <name> as submodule"
git push
```
The build script auto-detects `package.json` and builds it. GH Actions fetches submodules automatically.

## Tech

- GitHub Actions → GitHub Pages
- `scripts/build.js` — auto-detects plain HTML vs npm-built maps
- Libraries loaded via CDN (plain maps) or bundled via Vite (npm maps)
- Git submodules supported for external map repos
