import 'ol/ol.css'
import OSM from 'ol/source/OSM'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import GeoJSON from 'ol/format/GeoJSON'
import Overlay from 'ol/Overlay'
import { fromLonLat, toLonLat } from 'ol/proj'
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style'
import * as extent from 'ol/extent'

// ── City config ──────────────────────────────────────────────
const CITIES = {
  yogyakarta: {
    name: 'Yogyakarta',
    emoji: '🏛️',
    center: [110.3695, -7.7956],
    bbox: [110.28, -7.87, 110.50, -7.70], // [west, south, east, north]
    zoom: 13,
    rpc: {
      landmarks:  'get_yogyakarta_landmarks',
      nearest:    'get_yogyakarta_nearest_vertex',
      route:      'get_yogyakarta_vertex_route',
      distances:  'get_yogyakarta_random_distances',
    },
  },
  muenchen: {
    name: 'München',
    emoji: '🏰',
    center: [11.576, 48.137],
    bbox: [11.36, 48.06, 11.78, 48.25],
    zoom: 13,
    rpc: {
      landmarks:  'get_munich_landmarks',
      nearest:    'get_munich_nearest_vertex',
      route:      'get_munich_vertex_route',
      distances:  'get_munich_random_distances',
    },
  },
}

function isInBbox(lon, lat) {
  const [w, s, e, n] = city.bbox
  return lon >= w && lon <= e && lat >= s && lat <= n
}

// Read initial city from URL hash, default to first
const CITY_IDS = Object.keys(CITIES)
let currentCityId = CITY_IDS.find(id => location.hash === `#${id}`) || CITY_IDS[0]
let city = CITIES[currentCityId]

// ── Supabase ─────────────────────────────────────────────────
const SUPABASE_URL = 'https://ygpvdkkmlyasocanvtfl.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncHZka2ttbHlhc29jYW52dGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzY0NTksImV4cCI6MjA4OTYxMjQ1OX0.Ozwt_DYrrxdljCcowhbIUaux4hal0wVoM2wft_kguUk'

async function rpc(name, params = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ── Helpers ───────────────────────────────────────────────────
function fmtDist(m) {
  if (!m || m >= 1e14) return '—'
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`
}
function fmtWalk(m) { const t = Math.round(m / 83); return t < 60 ? `${t}m` : `${Math.floor(t / 60)}h${t % 60}m` }
function fmtDrive(m) { const t = Math.round(m / 417); return t < 1 ? '<1m' : `${t}m` }
function parseGeo(raw) { return typeof raw === 'string' ? JSON.parse(raw) : raw }

// ── Basemaps ──────────────────────────────────────────────────
const BASEMAPS = {
  positron: { source: () => new XYZ({ url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', attributions: '© CARTO © OSM', crossOrigin: 'anonymous' }) },
  osm:      { source: () => new OSM() },
  topo:     { source: () => new XYZ({ url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png', attributions: '© OpenTopoMap © OSM', crossOrigin: 'anonymous' }) },
}

// ── Map ───────────────────────────────────────────────────────
const routeSource  = new VectorSource()
const markerSource = new VectorSource()
const ROUTE_COLORS = ['#2563eb', '#059669', '#7c3aed', '#b45309', '#be185d', '#0891b2']

const routeLayer = new VectorLayer({
  source: routeSource,
  style: (f) => new Style({ stroke: new Stroke({ color: f.get('color') || '#2563eb', width: 5, lineCap: 'round', lineJoin: 'round' }) }),
})

function makeNodeStyle(role, label) {
  const C = { from: { fill: '#22c55e', stroke: '#15803d', text: '#fff' }, to: { fill: '#ef4444', stroke: '#b91c1c', text: '#fff' }, tsp: { fill: '#fbbf24', stroke: '#d97706', text: '#fff' }, landmark: { fill: '#fff', stroke: '#d1d5db', text: '#6b7280' } }
  const c = C[role] || C.landmark
  const styles = [new Style({ image: new CircleStyle({ radius: label ? 14 : 6, fill: new Fill({ color: c.fill }), stroke: new Stroke({ color: c.stroke, width: 2.5 }) }) })]
  if (label) styles.push(new Style({ text: new Text({ text: label, font: 'bold 11px sans-serif', fill: new Fill({ color: c.text }), stroke: new Stroke({ color: c.stroke, width: 3 }) }) }))
  return styles
}

const markerLayer = new VectorLayer({ source: markerSource, style: (f) => makeNodeStyle(f.get('role'), f.get('label')) })

const map = new Map({
  target: 'map',
  layers: [new TileLayer({ source: BASEMAPS.positron.source() }), routeLayer, markerLayer],
  view: new View({ center: fromLonLat(city.center), zoom: city.zoom, minZoom: 10, maxZoom: 18 }),
})

const baseTileLayer = map.getLayers().item(0)

// ── Basemap switcher ──────────────────────────────────────────
document.querySelectorAll('#basemap-switcher button').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.dataset.basemap
    if (!BASEMAPS[key]) return
    baseTileLayer.setSource(BASEMAPS[key].source())
    document.querySelectorAll('#basemap-switcher button').forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
  })
})

// ── Tooltip ───────────────────────────────────────────────────
const tooltipEl = document.getElementById('tooltip')
const tooltipOverlay = new Overlay({ element: tooltipEl, positioning: 'bottom-center' })
map.addOverlay(tooltipOverlay)

map.on('pointermove', (e) => {
  const f = map.forEachFeatureAtPixel(e.pixel, f => f, { layerFilter: l => l === markerLayer })
  if (f?.get('name')) {
    tooltipEl.style.display = 'block'
    tooltipEl.textContent = f.get('name')
    tooltipOverlay.setPosition(e.coordinate)
    map.getTargetElement().style.cursor = 'pointer'
  } else {
    tooltipEl.style.display = 'none'
    map.getTargetElement().style.cursor = currentMode === 'tsp' ? 'crosshair' : ''
  }
})

// ── City switcher ─────────────────────────────────────────────
const citySwitcher = document.getElementById('city-switcher')
CITY_IDS.forEach(id => {
  const btn = document.createElement('button')
  btn.className = 'city-btn' + (id === currentCityId ? ' active' : '')
  btn.textContent = `${CITIES[id].emoji} ${CITIES[id].name}`
  btn.dataset.city = id
  btn.addEventListener('click', () => switchCity(id))
  citySwitcher.appendChild(btn)
})

function switchCity(id) {
  if (id === currentCityId) return
  currentCityId = id
  city = CITIES[id]
  location.hash = id
  document.querySelectorAll('.city-btn').forEach(b => b.classList.toggle('active', b.dataset.city === id))
  document.getElementById('city-title').textContent = `${city.emoji} ${city.name} Route`
  map.getView().animate({ center: fromLonLat(city.center), zoom: city.zoom, duration: 600 })
  resetAll()
  loadLandmarks()
}

// ── Panel minimize ────────────────────────────────────────────
const panel = document.getElementById('panel')
const minBtn = document.getElementById('minimize-btn')
let minimized = false
function toggleMinimize() { minimized = !minimized; panel.classList.toggle('minimized', minimized); minBtn.textContent = minimized ? '▲' : '▼' }
minBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMinimize() })

// ── Tabs ──────────────────────────────────────────────────────
let currentMode = 'route'
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const mode = tab.dataset.mode
    if (mode === currentMode) return
    resetAll()
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    document.querySelectorAll('.mode-section').forEach(s => s.classList.remove('active'))
    tab.classList.add('active')
    document.getElementById(`mode-${mode}`).classList.add('active')
    currentMode = mode
    if (mode === 'route') drawLandmarkMarkers()
  })
})

function resetAll() {
  routeSource.clear(); markerSource.clear()
  routeFrom = null; routeTo = null
  if (document.getElementById('from-input')) { document.getElementById('from-input').value = ''; document.getElementById('from-input').classList.remove('has-value') }
  if (document.getElementById('to-input')) { document.getElementById('to-input').value = ''; document.getElementById('to-input').classList.remove('has-value') }
  document.getElementById('rt-result').style.display = 'none'
  setStatus('rt-status', '')
  updateGoBtn()
  tspStops = []
  refreshTSPUI()
  document.getElementById('tsp-result').style.display = 'none'
  setStatus('tsp-status', '')
}

// ── Progress / Status ─────────────────────────────────────────
function setProgress(prefix, pct) { const b = document.getElementById(`${prefix}-progress`); const f = document.getElementById(`${prefix}-progress-fill`); b.classList.add('active'); f.style.width = pct + '%' }
function hideProgress(prefix) { const f = document.getElementById(`${prefix}-progress-fill`); f.style.width = '100%'; setTimeout(() => { document.getElementById(`${prefix}-progress`).classList.remove('active'); f.style.width = '0%' }, 400) }
function setStatus(id, msg, type) { const el = document.getElementById(id); el.textContent = msg; el.className = 'status' + (type ? ` ${type}` : '') }

// ── Route mode ────────────────────────────────────────────────
let landmarks = []
let routeFrom = null, routeTo = null  // { vertexId, coord, name, type: 'landmark'|'road'|'geocode' }

const fromInput = document.getElementById('from-input')
const toInput   = document.getElementById('to-input')
const fromSug   = document.getElementById('from-suggestions')
const toSug     = document.getElementById('to-suggestions')

function updateGoBtn() { document.getElementById('go-btn').disabled = !(routeFrom && routeTo) }

function setRoutePoint(which, point) {
  if (which === 'from') { routeFrom = point; fromInput.value = point ? point.name : ''; fromInput.classList.toggle('has-value', !!point) }
  else { routeTo = point; toInput.value = point ? point.name : ''; toInput.classList.toggle('has-value', !!point) }
  updateGoBtn(); drawRouteMarkers()
}

async function loadLandmarks() {
  try {
    landmarks = await rpc(city.rpc.landmarks)
    drawRouteMarkers()
    document.getElementById('city-title').textContent = `${city.emoji} ${city.name} Route`
  } catch (err) { setStatus('rt-status', 'Failed to load landmarks: ' + err.message, 'error') }
}

function drawRouteMarkers() {
  markerSource.clear()
  landmarks.forEach(lm => {
    const isFrom = routeFrom?.type === 'landmark' && routeFrom.vertexId === lm.vertex_id
    const isTo   = routeTo?.type === 'landmark' && routeTo.vertexId === lm.vertex_id
    const role = isFrom ? 'from' : isTo ? 'to' : 'landmark'
    markerSource.addFeature(new Feature({ geometry: new Point(fromLonLat([lm.lon, lm.lat])), name: lm.name, id: lm.id, role, label: role !== 'landmark' ? (role === 'from' ? 'A' : 'B') : null }))
  })
  if (routeFrom && routeFrom.type !== 'landmark') markerSource.addFeature(new Feature({ geometry: new Point(routeFrom.coord), role: 'from', label: 'A', name: routeFrom.name }))
  if (routeTo && routeTo.type !== 'landmark')     markerSource.addFeature(new Feature({ geometry: new Point(routeTo.coord), role: 'to', label: 'B', name: routeTo.name }))
}

// ── Autocomplete: landmarks + Photon geocoding ────────────────
let searchTimers = { from: null, to: null }

function setupSearch(which) {
  const input = which === 'from' ? fromInput : toInput
  const sugEl = which === 'from' ? fromSug : toSug

  input.addEventListener('input', () => {
    clearTimeout(searchTimers[which])
    const q = input.value.trim()
    if (q.length < 1) { sugEl.classList.remove('open'); return }
    // Show matching landmarks immediately
    showSuggestions(which, q)
    // Debounce Photon search
    if (q.length >= 2) {
      searchTimers[which] = setTimeout(() => photonSearch(which, q), 300)
    }
  })

  input.addEventListener('focus', () => {
    const q = input.value.trim()
    if (q.length >= 1) showSuggestions(which, q)
    else showSuggestions(which, '') // show all landmarks
  })

  sugEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.sug-item')
    if (!btn) return
    sugEl.classList.remove('open')
    const { lon, lat, name, vertexId, type } = btn.dataset
    if (type === 'landmark') {
      const lm = landmarks.find(l => l.vertex_id === +vertexId)
      setRoutePoint(which, { vertexId: +vertexId, coord: fromLonLat([lm.lon, lm.lat]), name, type: 'landmark' })
    } else {
      // Geocode result — snap to nearest road
      snapAndSetPoint(which, +lon, +lat, name)
    }
  })
}

function showSuggestions(which, query) {
  const sugEl = which === 'from' ? fromSug : toSug
  const q = query.toLowerCase()
  // Filter landmarks
  const matches = q ? landmarks.filter(lm => lm.name.toLowerCase().includes(q)).slice(0, 5) : landmarks.slice(0, 8)
  let html = ''
  if (matches.length) {
    html += '<div class="sug-label">Landmarks</div>'
    html += matches.map(lm => `<button class="sug-item landmark" data-type="landmark" data-vertex-id="${lm.vertex_id}" data-lon="${lm.lon}" data-lat="${lm.lat}" data-name="${lm.name}">
      <div class="sug-name">📍 ${lm.name}</div>
    </button>`).join('')
  }
  sugEl.innerHTML = html
  sugEl.classList.toggle('open', html.length > 0)
}

async function photonSearch(which, q) {
  const sugEl = which === 'from' ? fromSug : toSug
  try {
    const [lon, lat] = city.center
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lon}&limit=5`)
    const data = await res.json()
    if (!data.features?.length) return
    // Append geocode results below existing landmark results
    let geoHtml = '<div class="sug-label">Search results</div>'
    geoHtml += data.features.map(f => {
      const p = f.properties, coords = f.geometry.coordinates
      const name = p.name || q
      const detail = [p.street, p.city || p.county, p.country].filter(Boolean).join(', ')
      const inBounds = isInBbox(coords[0], coords[1])
      return `<button class="sug-item ${inBounds ? '' : 'out-of-bounds'}" data-type="geocode" data-lon="${coords[0]}" data-lat="${coords[1]}" data-name="${name}">
        <div class="sug-name">${name}${!inBounds ? ' ⚠' : ''}</div>
        <div class="sug-detail">${detail}</div>
      </button>`
    }).join('')
    // Keep landmark results, append geo results
    const existing = sugEl.querySelectorAll('.sug-label')
    const lastLabel = Array.from(existing).find(el => el.textContent === 'Search results')
    if (lastLabel) { /* remove old geo results */ let el = lastLabel; while (el) { const next = el.nextElementSibling; el.remove(); if (!next || next.classList.contains('sug-label')) break; el = next } lastLabel.remove() }
    sugEl.insertAdjacentHTML('beforeend', geoHtml)
    sugEl.classList.add('open')
  } catch (err) { console.warn('Photon error:', err) }
}

async function snapAndSetPoint(which, lon, lat, name) {
  setStatus('rt-status', 'Snapping to road…')
  try {
    const res = await rpc(city.rpc.nearest, { lat, lon })
    const v = Array.isArray(res) ? res[0] : res
    if (!v) throw new Error('No nearby road')
    setRoutePoint(which, { vertexId: v.vertex_id, coord: fromLonLat([v.snap_lon, v.snap_lat]), name, type: 'geocode' })
    setStatus('rt-status', '')
  } catch (err) {
    setStatus('rt-status', 'Could not snap to road — try a location within the city', 'error')
  }
}

setupSearch('from')
setupSearch('to')

// Close suggestions on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('#from-field')) fromSug.classList.remove('open')
  if (!e.target.closest('#to-field')) toSug.classList.remove('open')
})

// Swap button
document.getElementById('swap-btn').addEventListener('click', () => {
  const tmp = routeFrom; routeFrom = routeTo; routeTo = tmp
  fromInput.value = routeFrom?.name || ''; fromInput.classList.toggle('has-value', !!routeFrom)
  toInput.value = routeTo?.name || ''; toInput.classList.toggle('has-value', !!routeTo)
  updateGoBtn(); drawRouteMarkers()
})

document.getElementById('go-btn').addEventListener('click', async () => {
  if (!routeFrom || !routeTo) return
  setStatus('rt-status', 'Calculating route…'); document.getElementById('go-btn').disabled = true
  document.getElementById('rt-result').style.display = 'none'; setProgress('rt', 30)
  try {
    setProgress('rt', 60)
    const [geoData, distData] = await Promise.all([
      rpc(city.rpc.route, { from_vertex_id: routeFrom.vertexId, to_vertex_id: routeTo.vertexId }),
      rpc(city.rpc.distances, { vertex_ids: [routeFrom.vertexId, routeTo.vertexId] }),
    ])
    setProgress('rt', 90)
    routeSource.clear()
    const features = new GeoJSON().readFeatures(parseGeo(geoData), { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
    features.forEach(f => f.set('color', '#2563eb'))
    routeSource.addFeatures(features)
    drawRouteMarkers()
    const ext = routeSource.getExtent()
    if (!extent.isEmpty(ext)) map.getView().fit(ext, { padding: [80, 80, 200, 80], maxZoom: 16, duration: 600 })
    const row = distData.find(d => String(d.from_vertex) === String(routeFrom.vertexId))
    const distM = row?.cost_m || 0
    document.getElementById('rt-dist').textContent = fmtDist(distM)
    document.getElementById('rt-walk').textContent = fmtWalk(distM)
    document.getElementById('rt-drive').textContent = fmtDrive(distM)
    document.getElementById('rt-result').style.display = 'block'
    setStatus('rt-status', `${routeFrom.name} → ${routeTo.name}`, 'success')
    hideProgress('rt')
  } catch (err) { setStatus('rt-status', err.message, 'error'); hideProgress('rt') }
  finally { updateGoBtn() }
})

document.getElementById('route-clear-btn').addEventListener('click', () => {
  setRoutePoint('from', null); setRoutePoint('to', null)
  routeSource.clear(); document.getElementById('rt-result').style.display = 'none'; setStatus('rt-status', '')
})

// ── TSP mode ──────────────────────────────────────────────────
let tspStops = []

function refreshTSPUI() {
  const n = tspStops.length
  document.getElementById('tsp-hint').textContent = n === 0 ? 'Click on the map to add stops (max 8)' : n < 3 ? `${n} stop${n > 1 ? 's' : ''} — add ${3 - n} more to solve` : `${n} stop${n > 1 ? 's' : ''} — ready to solve!`
  const list = document.getElementById('tsp-stops-list')
  list.innerHTML = tspStops.map((s, i) => `<div class="stop-chip" data-idx="${i}"><span>🔶 ${i + 1}. ${s.name}</span><span class="remove">×</span></div>`).join('')
  list.querySelectorAll('.stop-chip').forEach(chip => chip.addEventListener('click', () => {
    tspStops.splice(+chip.dataset.idx, 1); routeSource.clear()
    document.getElementById('tsp-result').style.display = 'none'; redrawTSPMarkers(); refreshTSPUI()
  }))
  document.getElementById('tsp-find-btn').disabled = n < 3
}

function redrawTSPMarkers() {
  markerSource.clear()
  tspStops.forEach((s, i) => markerSource.addFeature(new Feature({ geometry: new Point(s.coord), role: 'tsp', label: String(i + 1), name: s.name, tspIdx: i })))
}

document.getElementById('tsp-clear-btn').addEventListener('click', () => {
  tspStops = []; routeSource.clear(); markerSource.clear(); refreshTSPUI()
  document.getElementById('tsp-result').style.display = 'none'; setStatus('tsp-status', '')
})
document.getElementById('tsp-find-btn').addEventListener('click', runTSP)

// ── Held-Karp TSP solver ──────────────────────────────────────
function solveTSP(matrix) {
  const n = matrix.length
  if (n <= 1) return { order: [0], cost: 0 }
  if (n === 2) return { order: [0, 1], cost: matrix[0][1] + matrix[1][0] }
  const INF = 1e18
  const dp = Array.from({ length: 1 << n }, () => new Array(n).fill(INF))
  const parent = Array.from({ length: 1 << n }, () => new Array(n).fill(-1))
  dp[1][0] = 0
  for (let mask = 1; mask < (1 << n); mask++)
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u)) || dp[mask][u] === INF) continue
      for (let v = 0; v < n; v++) {
        if (mask & (1 << v)) continue
        const next = mask | (1 << v), cost = dp[mask][u] + matrix[u][v]
        if (cost < dp[next][v]) { dp[next][v] = cost; parent[next][v] = u }
      }
    }
  const full = (1 << n) - 1
  let best = INF, last = -1
  for (let u = 1; u < n; u++) { const c = dp[full][u] + matrix[u][0]; if (c < best) { best = c; last = u } }
  const order = []; let mask = full, cur = last
  while (cur !== -1) { order.push(cur); const prev = parent[mask][cur]; mask ^= (1 << cur); cur = prev }
  order.reverse()
  return { order, cost: best }
}

async function runTSP() {
  if (tspStops.length < 3) return
  document.getElementById('tsp-find-btn').disabled = true
  setStatus('tsp-status', 'Computing distances…'); document.getElementById('tsp-result').style.display = 'none'; setProgress('tsp', 20)
  try {
    const n = tspStops.length, vids = tspStops.map(s => s.vertex_id)
    const distances = await rpc(city.rpc.distances, { vertex_ids: vids })
    setProgress('tsp', 45)
    const matrix = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity))
    distances.forEach(d => { const i = tspStops.findIndex(s => s.vertex_id === d.from_vertex); const j = tspStops.findIndex(s => s.vertex_id === d.to_vertex); if (i >= 0 && j >= 0) matrix[i][j] = d.cost_m })
    setStatus('tsp-status', 'Solving TSP…'); setProgress('tsp', 55)
    const { order, cost } = solveTSP(matrix)
    const loop = [...order, order[0]]; routeSource.clear()
    for (let k = 0; k < loop.length - 1; k++) {
      setProgress('tsp', 55 + ((k + 1) / (loop.length - 1)) * 42)
      setStatus('tsp-status', `Drawing segment ${k + 1}/${loop.length - 1}…`)
      try {
        const geoData = await rpc(city.rpc.route, { from_vertex_id: vids[loop[k]], to_vertex_id: vids[loop[k + 1]] })
        const features = new GeoJSON().readFeatures(parseGeo(geoData), { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
        features.forEach(f => f.set('color', ROUTE_COLORS[k % ROUTE_COLORS.length]))
        routeSource.addFeatures(features)
      } catch (e) { console.warn('Segment failed', e) }
    }
    redrawTSPMarkers()
    const ext = routeSource.getExtent(); if (!extent.isEmpty(ext)) map.getView().fit(ext, { padding: [80, 80, 200, 80], maxZoom: 15, duration: 600 })
    document.getElementById('tsp-dist').textContent = fmtDist(cost)
    document.getElementById('tsp-stops-count').textContent = `${n} stops`
    document.getElementById('tsp-result').style.display = 'block'
    setStatus('tsp-status', 'Order: ' + order.map(i => `${i + 1}`).join(' → ') + ' → 1', 'success')
    hideProgress('tsp')
  } catch (err) { setStatus('tsp-status', err.message, 'error'); hideProgress('tsp') }
  finally { document.getElementById('tsp-find-btn').disabled = false; refreshTSPUI() }
}

// ── Map click dispatcher ──────────────────────────────────────
map.on('click', async (e) => {
  if (currentMode === 'route') {
    // Check if clicking a landmark
    const f = map.forEachFeatureAtPixel(e.pixel, f => f, { layerFilter: l => l === markerLayer })
    if (f?.get('id')) {
      const lm = landmarks.find(l => l.id === f.get('id'))
      if (lm) {
        const which = !routeFrom ? 'from' : !routeTo ? 'to' : 'from'
        setRoutePoint(which, { vertexId: lm.vertex_id, coord: fromLonLat([lm.lon, lm.lat]), name: lm.name, type: 'landmark' })
      }
      return
    }
    // Click empty map → snap to road
    const [lon, lat] = toLonLat(e.coordinate)
    const which = !routeFrom ? 'from' : 'to'
    snapAndSetPoint(which, lon, lat, `${lat.toFixed(4)}, ${lon.toFixed(4)}`)
  } else if (currentMode === 'tsp') {
    const f = map.forEachFeatureAtPixel(e.pixel, f => f, { layerFilter: l => l === markerLayer })
    if (f?.get('role') === 'tsp') { tspStops.splice(f.get('tspIdx'), 1); routeSource.clear(); document.getElementById('tsp-result').style.display = 'none'; redrawTSPMarkers(); refreshTSPUI(); return }
    if (tspStops.length >= 8) { setStatus('tsp-status', 'Maximum 8 stops.', 'error'); return }
    const [lon, lat] = toLonLat(e.coordinate); setStatus('tsp-status', 'Snapping to road…')
    try {
      const res = await rpc(city.rpc.nearest, { lat, lon }); const v = Array.isArray(res) ? res[0] : res
      if (!v) throw new Error('No nearby road found')
      const nearLm = [...landmarks].sort((a, b) => Math.hypot(a.lon - lon, a.lat - lat) - Math.hypot(b.lon - lon, b.lat - lat))[0]
      const name = nearLm && Math.hypot(nearLm.lon - lon, nearLm.lat - lat) < 0.008 ? nearLm.name : `${lat.toFixed(4)}, ${lon.toFixed(4)}`
      tspStops.push({ vertex_id: v.vertex_id, coord: fromLonLat([v.snap_lon, v.snap_lat]), name })
      routeSource.clear(); document.getElementById('tsp-result').style.display = 'none'; redrawTSPMarkers(); refreshTSPUI()
      setStatus('tsp-status', `Stop ${tspStops.length} added`)
    } catch (err) { setStatus('tsp-status', err.message, 'error') }
  }
})

// ── Geolocation ───────────────────────────────────────────────
const geoBtn = document.getElementById('geo-btn')
let geoMarker = null

geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { geoBtn.textContent = '✕'; return }
  geoBtn.textContent = '...'
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { longitude: lon, latitude: lat, accuracy } = pos.coords
      const coord = fromLonLat([lon, lat])

      // Remove old marker
      if (geoMarker) { try { markerSource.removeFeature(geoMarker) } catch {} }

      geoMarker = new Feature({ geometry: new Point(coord), role: 'geo', name: 'Your location' })
      geoMarker.setStyle(new Style({
        image: new CircleStyle({ radius: 8, fill: new Fill({ color: '#3b82f6' }), stroke: new Stroke({ color: '#fff', width: 3 }) }),
      }))
      markerSource.addFeature(geoMarker)

      map.getView().animate({ center: coord, zoom: 16, duration: 600 })
      geoBtn.textContent = '📍'

      if (!isInBbox(lon, lat)) {
        geoBtn.style.borderColor = '#fca5a5'
        setTimeout(() => { geoBtn.style.borderColor = '#e5e7eb' }, 3000)
      }
    },
    (err) => {
      console.warn('Geolocation error:', err)
      geoBtn.textContent = '📍'
    },
    { enableHighAccuracy: true, timeout: 10000 }
  )
})

// ── Init ──────────────────────────────────────────────────────
loadLandmarks()
