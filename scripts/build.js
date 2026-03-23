#!/usr/bin/env node
/**
 * Build script — assembles the full site into /dist
 *
 * Strategy:
 *   1. Build bundled maps (those with package.json + "build" script)
 *   2. Copy root index.html + assets/ into dist/
 *   3. Copy each map into dist/maps/<id>/
 *      - Bundled maps: copy their dist/ output
 *      - Plain HTML maps: copy the folder as-is
 *   4. Update maps.json paths so gallery links work correctly
 */

import { execSync }            from 'child_process'
import fs                      from 'fs'
import path                    from 'path'
import { fileURLToPath }       from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')
const DIST      = path.join(ROOT, 'dist')
const MAPS_DIR  = path.join(ROOT, 'maps')

// ── Helpers ──────────────────────────────────────────────────
function rimraf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true })
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function run(cmd, cwd) {
  console.log(`\n▶ ${cmd}${cwd ? ` (in ${path.relative(ROOT, cwd)})` : ''}`)
  execSync(cmd, { cwd, stdio: 'inherit' })
}

function isBundled(mapDir) {
  const pkgPath = path.join(mapDir, 'package.json')
  if (!fs.existsSync(pkgPath)) return false
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  return !!pkg.scripts?.build
}

// ── 1. Clean dist ─────────────────────────────────────────────
console.log('🧹 Cleaning dist/')
rimraf(DIST)
fs.mkdirSync(DIST)

// ── 2. Build bundled maps ─────────────────────────────────────
const mapIds = fs.readdirSync(MAPS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)

for (const id of mapIds) {
  const mapDir = path.join(MAPS_DIR, id)
  if (!isBundled(mapDir)) continue
  const pkg = JSON.parse(fs.readFileSync(path.join(mapDir, 'package.json'), 'utf8'))
  console.log(`\n📦 Building bundled map: ${id}`)
  run('npm install', mapDir)
  run('npm run build', mapDir)
}

// ── 3. Copy root files ────────────────────────────────────────
console.log('\n📋 Copying root files')
copyFile(path.join(ROOT, 'index.html'), path.join(DIST, 'index.html'))
if (fs.existsSync(path.join(ROOT, 'assets'))) {
  copyDir(path.join(ROOT, 'assets'), path.join(DIST, 'assets'))
}

// ── 4. Copy maps ──────────────────────────────────────────────
const mapsJson = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, 'maps.json'), 'utf8'))

for (const id of mapIds) {
  const mapDir  = path.join(MAPS_DIR, id)
  const destDir = path.join(DIST, id)

  if (isBundled(mapDir)) {
    // Copy built dist/ → dist/<id>/
    const builtDir = path.join(mapDir, 'dist')
    if (fs.existsSync(builtDir)) {
      console.log(`  📁 ${id}/ (built)`)
      copyDir(builtDir, destDir)
    }
  } else {
    // Plain HTML — copy whole folder, skip node_modules/dist
    console.log(`  📄 ${id}/ (plain HTML)`)
    fs.mkdirSync(destDir, { recursive: true })
    for (const entry of fs.readdirSync(mapDir, { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue
      const s = path.join(mapDir, entry.name)
      const d = path.join(destDir, entry.name)
      if (entry.isDirectory()) copyDir(s, d)
      else fs.copyFileSync(s, d)
    }
  }
}

// ── 5. Write updated maps.json ────────────────────────────────
// All maps now live at /<id>/index.html (no maps/ prefix, no dist/ prefix)
const updatedMaps = mapsJson.map(m => {
  const { path: _removedPath, ...rest } = m
  return rest  // strip old path overrides — all maps now at /<id>/
})

fs.writeFileSync(
  path.join(DIST, 'maps.json'),
  JSON.stringify(updatedMaps, null, 2)
)
console.log('\n  ✅ maps.json written to dist/')

console.log('\n✅ Build complete → dist/')
