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
    zoom: 13,
    rpc: {
      landmarks:  'get_munich_landmarks',
      nearest:    'get_munich_nearest_vertex',
      route:      'get_munich_vertex_route',
      distances:  'get_munich_random_distances',
    },
  },
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
  document.getElementById('from-select').value = ''
  document.getElementById('to-select').value = ''
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
let routeFrom = null, routeTo = null, pickingFor = null

function updateGoBtn() { document.getElementById('go-btn').disabled = !(routeFrom && routeTo) }

function updatePickBtns() {
  ;['from', 'to'].forEach(w => {
    const btn = document.getElementById(`${w}-pick-btn`)
    const point = w === 'from' ? routeFrom : routeTo
    const sel = document.getElementById(`${w}-select`)
    if (sel.value !== '') btn.textContent = `📍 Click map to set ${w === 'from' ? 'start' : 'end'} instead`
    else if (point?.type === 'road') btn.textContent = `✅ Road point set — click to change`
    else btn.textContent = `📍 Click map to set ${w === 'from' ? 'start' : 'end'}`
    btn.classList.toggle('active', pickingFor === w)
  })
}

function setPickingFor(which) {
  pickingFor = pickingFor === which ? null : which
  map.getTargetElement().style.cursor = pickingFor ? 'crosshair' : ''
  if (pickingFor) setStatus('rt-status', `Click on the map to set the ${which === 'from' ? 'start' : 'end'} point`)
  else if (document.getElementById('rt-status').textContent.startsWith('Click')) setStatus('rt-status', '')
  updatePickBtns()
}

document.getElementById('from-pick-btn').addEventListener('click', () => setPickingFor('from'))
document.getElementById('to-pick-btn').addEventListener('click', () => setPickingFor('to'))

async function loadLandmarks() {
  try {
    landmarks = await rpc(city.rpc.landmarks)
    const base = '<option value="">— choose or click map —</option>'
    const opts = landmarks.map(lm => `<option value="${lm.id}">${lm.name}</option>`).join('')
    document.getElementById('from-select').innerHTML = base + opts
    document.getElementById('to-select').innerHTML = base + opts
    drawLandmarkMarkers()
    document.getElementById('city-title').textContent = `${city.emoji} ${city.name} Route`
  } catch (err) { setStatus('rt-status', 'Failed to load landmarks: ' + err.message, 'error') }
}

function drawLandmarkMarkers() {
  markerSource.clear()
  const fromId = +document.getElementById('from-select').value
  const toId = +document.getElementById('to-select').value
  landmarks.forEach(lm => {
    const role = lm.id === fromId ? 'from' : lm.id === toId ? 'to' : 'landmark'
    markerSource.addFeature(new Feature({ geometry: new Point(fromLonLat([lm.lon, lm.lat])), name: lm.name, id: lm.id, role, label: role !== 'landmark' ? (role === 'from' ? 'A' : 'B') : null }))
  })
  if (routeFrom?.type === 'road') markerSource.addFeature(new Feature({ geometry: new Point(routeFrom.coord), role: 'from', label: 'A', name: 'Start' }))
  if (routeTo?.type === 'road') markerSource.addFeature(new Feature({ geometry: new Point(routeTo.coord), role: 'to', label: 'B', name: 'End' }))
}

function setEndpoint(which, val) {
  const lm = landmarks.find(l => l.id === +val)
  const point = val ? { vertexId: lm.vertex_id, coord: fromLonLat([lm.lon, lm.lat]), name: lm.name, type: 'landmark' } : null
  if (which === 'from') routeFrom = point; else routeTo = point
  updatePickBtns(); updateGoBtn(); drawLandmarkMarkers()
}
document.getElementById('from-select').addEventListener('change', (e) => setEndpoint('from', e.target.value))
document.getElementById('to-select').addEventListener('change', (e) => setEndpoint('to', e.target.value))

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
    drawLandmarkMarkers()
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
  routeFrom = null; routeTo = null; setPickingFor(null)
  document.getElementById('from-select').value = ''; document.getElementById('to-select').value = ''
  routeSource.clear(); document.getElementById('rt-result').style.display = 'none'; setStatus('rt-status', '')
  updatePickBtns(); updateGoBtn(); drawLandmarkMarkers()
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
    if (pickingFor) {
      const [lon, lat] = toLonLat(e.coordinate); const which = pickingFor; setPickingFor(null)
      setStatus('rt-status', 'Snapping to road…')
      try {
        const res = await rpc(city.rpc.nearest, { lat, lon }); const v = Array.isArray(res) ? res[0] : res
        if (!v) throw new Error('No nearby road found')
        const snapCoord = fromLonLat([v.snap_lon, v.snap_lat])
        if (which === 'from') { document.getElementById('from-select').value = ''; routeFrom = { vertexId: v.vertex_id, coord: snapCoord, name: 'Map point', type: 'road' } }
        else { document.getElementById('to-select').value = ''; routeTo = { vertexId: v.vertex_id, coord: snapCoord, name: 'Map point', type: 'road' } }
        updatePickBtns(); updateGoBtn(); drawLandmarkMarkers()
        setStatus('rt-status', `${which === 'from' ? 'Start' : 'End'} point snapped to road ✓`)
      } catch (err) { setStatus('rt-status', err.message, 'error') }
      return
    }
    const f = map.forEachFeatureAtPixel(e.pixel, f => f, { layerFilter: l => l === markerLayer })
    if (f?.get('id')) {
      const id = f.get('id')
      if (!routeFrom) { document.getElementById('from-select').value = id; document.getElementById('from-select').dispatchEvent(new Event('change')) }
      else if (!routeTo) { document.getElementById('to-select').value = id; document.getElementById('to-select').dispatchEvent(new Event('change')) }
    }
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

// ── Init ──────────────────────────────────────────────────────
loadLandmarks()
