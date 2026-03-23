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

// ── City config ───────────────────────────────────────────────
const CITIES = {
  yogyakarta: {
    name: 'Yogyakarta',
    emoji: '🏛️',
    center: [110.3695, -7.7956],
    bbox: [110.28, -7.87, 110.50, -7.70],
    zoom: 13,
    rpc: {
      landmarks: 'get_yogyakarta_landmarks',
      nearest:   'get_yogyakarta_nearest_vertex',
      route:     'get_yogyakarta_vertex_route',
      distances: 'get_yogyakarta_random_distances',
    },
  },
  muenchen: {
    name: 'München',
    emoji: '🏰',
    center: [11.576, 48.137],
    bbox: [11.36, 48.06, 11.78, 48.25],
    zoom: 13,
    rpc: {
      landmarks: 'get_munich_landmarks',
      nearest:   'get_munich_nearest_vertex',
      route:     'get_munich_vertex_route',
      distances: 'get_munich_random_distances',
    },
  },
}

const CITY_IDS = Object.keys(CITIES)
let currentCityId = CITY_IDS.find(id => location.hash === `#${id}`) || CITY_IDS[0]
let city = CITIES[currentCityId]

function isInBbox(lon, lat) {
  const [w, s, e, n] = city.bbox
  return lon >= w && lon <= e && lat >= s && lat <= n
}

// ── Supabase ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://ygpvdkkmlyasocanvtfl.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlncHZka2ttbHlhc29jYW52dGZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMzY0NTksImV4cCI6MjA4OTYxMjQ1OX0.Ozwt_DYrrxdljCcowhbIUaux4hal0wVoM2wft_kguUk'

async function rpc(name, params = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
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
function fmtWalk(m)  { const t = Math.round(m / 83);  return t < 60 ? `${t}m` : `${Math.floor(t/60)}h${t%60}m` }
function fmtDrive(m) { const t = Math.round(m / 417); return t < 1 ? '<1m' : `${t}m` }
function parseGeo(raw) { return typeof raw === 'string' ? JSON.parse(raw) : raw }

// ── Color palette for locations ───────────────────────────────
const COLORS = [
  { letter: 'A', hex: '#22c55e' },
  { letter: 'B', hex: '#3b82f6' },
  { letter: 'C', hex: '#8b5cf6' },
  { letter: 'D', hex: '#f59e0b' },
  { letter: 'E', hex: '#ec4899' },
  { letter: 'F', hex: '#06b6d4' },
  { letter: 'G', hex: '#ef4444' },
  { letter: 'H', hex: '#84cc16' },
]

// ── State ─────────────────────────────────────────────────────
let locations = []  // { name, vertexId, coord, letter, color }
let landmarks = []
let searchTimer = null
let currentSugEl = null  // active suggestions dropdown element

// ── Basemaps ──────────────────────────────────────────────────
const BASEMAPS = {
  positron: { source: () => new XYZ({ url: 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', attributions: '© CARTO © OSM', crossOrigin: 'anonymous' }) },
  osm:      { source: () => new OSM() },
  topo:     { source: () => new XYZ({ url: 'https://tile.opentopomap.org/{z}/{x}/{y}.png', attributions: '© OpenTopoMap © OSM', crossOrigin: 'anonymous' }) },
}

// ── Map ───────────────────────────────────────────────────────
const routeSource  = new VectorSource()
const markerSource = new VectorSource()

const routeLayer = new VectorLayer({
  source: routeSource,
  style: (f) => new Style({
    stroke: new Stroke({ color: f.get('color') || '#2563eb', width: 5, lineCap: 'round', lineJoin: 'round' }),
  }),
})

const markerLayer = new VectorLayer({
  source: markerSource,
  style: (f) => {
    const role = f.get('role')
    if (role === 'location') {
      return [
        new Style({ image: new CircleStyle({ radius: 14, fill: new Fill({ color: f.get('color') }), stroke: new Stroke({ color: '#fff', width: 2.5 }) }) }),
        new Style({ text: new Text({ text: f.get('letter'), font: 'bold 11px sans-serif', fill: new Fill({ color: '#fff' }) }) }),
      ]
    }
    if (role === 'geo') {
      return new Style({ image: new CircleStyle({ radius: 8, fill: new Fill({ color: '#3b82f6' }), stroke: new Stroke({ color: '#fff', width: 3 }) }) })
    }
    // landmark (unselected)
    return new Style({ image: new CircleStyle({ radius: 6, fill: new Fill({ color: '#fff' }), stroke: new Stroke({ color: '#d1d5db', width: 2 }) }) })
  },
})

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
    map.getTargetElement().style.cursor = locations.length < 8 ? 'crosshair' : ''
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
  clearAll()
  loadLandmarks()
}

// ── Panel minimize ────────────────────────────────────────────
const panel = document.getElementById('panel')
const minBtn = document.getElementById('minimize-btn')
let minimized = false
function toggleMinimize() {
  minimized = !minimized
  panel.classList.toggle('minimized', minimized)
  minBtn.textContent = minimized ? '▲' : '▼'
}
minBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMinimize() })

// ── Location management ───────────────────────────────────────
function addLocation(loc) {
  if (locations.length >= 8) return
  const idx = locations.length
  locations.push({ ...loc, letter: COLORS[idx].letter, color: COLORS[idx].hex })
  routeSource.clear()
  hideResult()
  renderLocList()
  // Focus new search input
  const inp = document.querySelector('.loc-search-row input')
  if (inp) inp.focus()
}

function removeLocation(i) {
  locations.splice(i, 1)
  reassignColors()
  routeSource.clear()
  hideResult()
  renderLocList()
}

function moveLocation(i, dir) {
  const j = i + dir
  if (j < 0 || j >= locations.length) return
  ;[locations[i], locations[j]] = [locations[j], locations[i]]
  reassignColors()
  routeSource.clear()
  hideResult()
  renderLocList()
}

function reassignColors() {
  locations.forEach((loc, idx) => {
    loc.letter = COLORS[idx].letter
    loc.color  = COLORS[idx].hex
  })
}

function clearAll() {
  locations = []
  routeSource.clear()
  hideResult()
  setStatus('')
  renderLocList()
}

// ── Render location list ──────────────────────────────────────
function renderLocList() {
  const listEl = document.getElementById('loc-list')
  listEl.innerHTML = ''
  const showArrows = locations.length >= 3

  locations.forEach((loc, i) => {
    const row = document.createElement('div')
    row.className = 'loc-row'

    // Arrow buttons or spacer
    if (showArrows) {
      const arrowsEl = document.createElement('div')
      arrowsEl.className = 'loc-arrows'
      const up = document.createElement('button')
      up.className = 'arr-up'; up.textContent = '▲'; up.title = 'Move up'
      if (i === 0) up.disabled = true
      up.addEventListener('click', () => moveLocation(i, -1))
      const dn = document.createElement('button')
      dn.className = 'arr-down'; dn.textContent = '▼'; dn.title = 'Move down'
      if (i === locations.length - 1) dn.disabled = true
      dn.addEventListener('click', () => moveLocation(i, 1))
      arrowsEl.append(up, dn)
      row.appendChild(arrowsEl)
    } else {
      const spacer = document.createElement('div')
      spacer.className = 'loc-arrows-spacer'
      row.appendChild(spacer)
    }

    const dot = document.createElement('span')
    dot.className = 'loc-dot'
    dot.style.background = loc.color
    dot.textContent = loc.letter
    row.appendChild(dot)

    const nameEl = document.createElement('span')
    nameEl.className = 'loc-name'
    nameEl.textContent = loc.name
    nameEl.title = loc.name
    row.appendChild(nameEl)

    const removeBtn = document.createElement('button')
    removeBtn.className = 'loc-remove'
    removeBtn.textContent = '✕'
    removeBtn.title = 'Remove'
    removeBtn.addEventListener('click', () => removeLocation(i))
    row.appendChild(removeBtn)

    listEl.appendChild(row)
  })

  // Empty search row (if < 8 locations)
  if (locations.length < 8) {
    const idx = locations.length
    const { letter, hex: color } = COLORS[idx]

    const row = document.createElement('div')
    row.className = 'loc-row loc-search-row'

    const spacer = document.createElement('div')
    spacer.className = 'loc-arrows-spacer'
    row.appendChild(spacer)

    const dot = document.createElement('span')
    dot.className = 'loc-dot loc-dot-empty'
    dot.style.background = color
    dot.textContent = letter
    row.appendChild(dot)

    const searchWrap = document.createElement('div')
    searchWrap.className = 'search-field'

    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = idx === 0 ? 'Search start or click map…' : 'Add stop or click map…'
    input.autocomplete = 'off'

    const sugEl = document.createElement('div')
    sugEl.className = 'suggestions'

    searchWrap.append(input, sugEl)
    row.appendChild(searchWrap)
    listEl.appendChild(row)

    setupSearchInput(input, sugEl)
    currentSugEl = sugEl
  } else {
    currentSugEl = null
  }

  updateActionButtons()
  drawMarkers()
}

// ── Search input setup ────────────────────────────────────────
let pendingGeoResults = []

function setupSearchInput(input, sugEl) {
  input.addEventListener('input', () => {
    clearTimeout(searchTimer)
    pendingGeoResults = []
    const q = input.value.trim()
    if (!q) { sugEl.classList.remove('open'); return }
    renderSuggestions(sugEl, q)
    if (q.length >= 2) {
      searchTimer = setTimeout(() => photonSearch(sugEl, q), 300)
    }
  })

  input.addEventListener('focus', () => {
    const q = input.value.trim()
    renderSuggestions(sugEl, q)
  })

  sugEl.addEventListener('mousedown', (e) => {
    // Prevent blur before click fires
    e.preventDefault()
  })

  sugEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.sug-item')
    if (!btn) return
    sugEl.classList.remove('open')
    input.value = ''
    const { lon, lat, name, vertexId, type } = btn.dataset
    if (type === 'landmark') {
      const lm = landmarks.find(l => l.vertex_id === +vertexId)
      if (lm) addLocation({ name, vertexId: +vertexId, coord: fromLonLat([lm.lon, lm.lat]) })
    } else {
      snapAndAddLocation(+lon, +lat, name)
    }
  })

  input.addEventListener('blur', () => {
    setTimeout(() => sugEl.classList.remove('open'), 150)
  })
}

function renderSuggestions(sugEl, q) {
  const ql = q.toLowerCase()
  const matches = ql
    ? landmarks.filter(lm => lm.name.toLowerCase().includes(ql)).slice(0, 5)
    : landmarks.slice(0, 8)

  let html = ''
  if (matches.length) {
    html += '<div class="sug-label">Landmarks</div>'
    html += matches.map(lm =>
      `<button class="sug-item" data-type="landmark" data-vertex-id="${lm.vertex_id}" data-name="${lm.name}">
        <div class="sug-name">📍 ${lm.name}</div>
      </button>`
    ).join('')
  }
  if (pendingGeoResults.length) {
    html += '<div class="sug-label">Search results</div>'
    html += pendingGeoResults.map(r =>
      `<button class="sug-item ${r.inBounds ? '' : 'out-of-bounds'}" data-type="geocode" data-lon="${r.lon}" data-lat="${r.lat}" data-name="${r.name}">
        <div class="sug-name">${r.name}${r.inBounds ? '' : ' ⚠'}</div>
        <div class="sug-detail">${r.detail}</div>
      </button>`
    ).join('')
  }

  sugEl.innerHTML = html
  sugEl.classList.toggle('open', html.length > 0)
}

async function photonSearch(sugEl, q) {
  try {
    const [lon, lat] = city.center
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lon}&limit=5`)
    const data = await res.json()
    pendingGeoResults = (data.features || []).map(f => {
      const p = f.properties, coords = f.geometry.coordinates
      return {
        name:     p.name || q,
        detail:   [p.street, p.city || p.county, p.country].filter(Boolean).join(', '),
        lon:      coords[0],
        lat:      coords[1],
        inBounds: isInBbox(coords[0], coords[1]),
      }
    })
    // Only update if this sugEl is still in the DOM
    if (document.contains(sugEl)) renderSuggestions(sugEl, q)
  } catch (err) { console.warn('Photon error:', err) }
}

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.loc-search-row') && currentSugEl) {
    currentSugEl.classList.remove('open')
  }
})

// ── Snap geocode result to nearest road ───────────────────────
async function snapAndAddLocation(lon, lat, name) {
  setStatus('Snapping to road…')
  try {
    const res = await rpc(city.rpc.nearest, { lat, lon })
    const v = Array.isArray(res) ? res[0] : res
    if (!v) throw new Error('No nearby road found')
    addLocation({ name, vertexId: v.vertex_id, coord: fromLonLat([v.snap_lon, v.snap_lat]) })
    setStatus('')
  } catch (err) {
    setStatus('Could not snap to road — try a location within the city', 'error')
  }
}

// ── Action buttons ────────────────────────────────────────────
function updateActionButtons() {
  const area = document.getElementById('action-area')
  area.innerHTML = ''
  const n = locations.length
  if (n < 2) return

  const btnRow = document.createElement('div')
  btnRow.className = 'btn-row'

  if (n >= 3) {
    const tspBtn = document.createElement('button')
    tspBtn.className = 'btn btn-tsp'
    tspBtn.textContent = 'Solve TSP'
    tspBtn.addEventListener('click', routeWithTSP)
    btnRow.appendChild(tspBtn)
  }

  const routeBtn = document.createElement('button')
  routeBtn.className = 'btn btn-primary'
  routeBtn.textContent = 'Find Route →'
  routeBtn.addEventListener('click', routeInOrder)
  btnRow.appendChild(routeBtn)

  area.appendChild(btnRow)

  const clearBtn = document.createElement('button')
  clearBtn.className = 'btn btn-ghost'
  clearBtn.textContent = 'Clear all'
  clearBtn.addEventListener('click', clearAll)
  area.appendChild(clearBtn)
}

// ── Draw map markers ──────────────────────────────────────────
let geoMarker = null

function drawMarkers() {
  // Preserve geo marker if it exists
  const hadGeo = geoMarker && markerSource.hasFeature(geoMarker)
  markerSource.clear()

  // Unselected landmark markers
  const selectedIds = new Set(locations.map(l => l.vertexId))
  landmarks.forEach(lm => {
    if (!selectedIds.has(lm.vertex_id)) {
      markerSource.addFeature(new Feature({
        geometry: new Point(fromLonLat([lm.lon, lm.lat])),
        name: lm.name, id: lm.id, role: 'landmark',
      }))
    }
  })

  // Location pins (colored + lettered)
  locations.forEach(loc => {
    markerSource.addFeature(new Feature({
      geometry: new Point(loc.coord),
      name: loc.name, role: 'location', letter: loc.letter, color: loc.color,
    }))
  })

  // Re-add geo marker
  if (hadGeo) markerSource.addFeature(geoMarker)
}

// ── Load landmarks ────────────────────────────────────────────
async function loadLandmarks() {
  try {
    landmarks = await rpc(city.rpc.landmarks)
    drawMarkers()
    document.getElementById('city-title').textContent = `${city.emoji} ${city.name} Route`
  } catch (err) {
    setStatus('Failed to load landmarks: ' + err.message, 'error')
  }
}

// ── Held-Karp TSP solver ──────────────────────────────────────
function solveTSP(matrix) {
  const n = matrix.length
  if (n <= 1) return { order: [0], cost: 0 }
  if (n === 2) return { order: [0, 1], cost: matrix[0][1] + matrix[1][0] }
  const INF = 1e18
  const dp     = Array.from({ length: 1 << n }, () => new Array(n).fill(INF))
  const parent = Array.from({ length: 1 << n }, () => new Array(n).fill(-1))
  dp[1][0] = 0
  for (let mask = 1; mask < (1 << n); mask++) {
    for (let u = 0; u < n; u++) {
      if (!(mask & (1 << u)) || dp[mask][u] === INF) continue
      for (let v = 0; v < n; v++) {
        if (mask & (1 << v)) continue
        const next = mask | (1 << v)
        const cost = dp[mask][u] + matrix[u][v]
        if (cost < dp[next][v]) { dp[next][v] = cost; parent[next][v] = u }
      }
    }
  }
  const full = (1 << n) - 1
  let best = INF, last = -1
  for (let u = 1; u < n; u++) {
    const c = dp[full][u] + matrix[u][0]
    if (c < best) { best = c; last = u }
  }
  const order = []; let mask = full, cur = last
  while (cur !== -1) { order.push(cur); const prev = parent[mask][cur]; mask ^= (1 << cur); cur = prev }
  order.reverse()
  return { order, cost: best }
}

// ── Route: in listed order ────────────────────────────────────
async function routeInOrder() {
  if (locations.length < 2) return
  setBtnsDisabled(true)
  setStatus('Fetching distances…')
  hideResult()
  routeSource.clear()
  setProgress(15)

  try {
    const vids = locations.map(l => l.vertexId)
    const distances = await rpc(city.rpc.distances, { vertex_ids: vids })
    setProgress(30)

    let totalDist = 0
    for (let i = 0; i < locations.length - 1; i++) {
      setProgress(30 + ((i + 1) / (locations.length - 1)) * 65)
      setStatus(`Routing segment ${i + 1}/${locations.length - 1}…`)
      const from = locations[i], to = locations[i + 1]
      const geoData = await rpc(city.rpc.route, { from_vertex_id: from.vertexId, to_vertex_id: to.vertexId })
      const features = new GeoJSON().readFeatures(parseGeo(geoData), { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
      features.forEach(f => f.set('color', from.color))
      routeSource.addFeatures(features)
      // Sum distance from matrix
      const d = distances.find(d => String(d.from_vertex) === String(from.vertexId) && String(d.to_vertex) === String(to.vertexId))
      if (d) totalDist += d.cost_m || 0
    }

    fitRoute()
    showResult(totalDist)
    setStatus(locations.map(l => l.letter).join(' → '), 'success')
    hideProgress()
  } catch (err) {
    setStatus(err.message, 'error')
    hideProgress()
  } finally {
    setBtnsDisabled(false)
  }
}

// ── Route: TSP optimal order ──────────────────────────────────
async function routeWithTSP() {
  if (locations.length < 3) return
  setBtnsDisabled(true)
  setStatus('Computing distances…')
  hideResult()
  routeSource.clear()
  setProgress(10)

  try {
    const vids = locations.map(l => l.vertexId)
    const distances = await rpc(city.rpc.distances, { vertex_ids: vids })
    setProgress(30)

    // Build cost matrix
    const n = locations.length
    const matrix = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => i === j ? 0 : Infinity)
    )
    distances.forEach(d => {
      const i = locations.findIndex(l => String(l.vertexId) === String(d.from_vertex))
      const j = locations.findIndex(l => String(l.vertexId) === String(d.to_vertex))
      if (i >= 0 && j >= 0) matrix[i][j] = d.cost_m
    })

    setStatus('Solving TSP…')
    setProgress(45)
    const { order, cost } = solveTSP(matrix)

    // Reorder locations
    locations = order.map(i => locations[i])
    reassignColors()
    renderLocList()

    // Route loop: order[0]→order[1]→...→order[n-1]→order[0]
    const loop = [...Array(locations.length).keys(), 0]
    for (let k = 0; k < loop.length - 1; k++) {
      setProgress(45 + ((k + 1) / (loop.length - 1)) * 50)
      setStatus(`Drawing segment ${k + 1}/${loop.length - 1}…`)
      const from = locations[loop[k]], to = locations[loop[k + 1]]
      try {
        const geoData = await rpc(city.rpc.route, { from_vertex_id: from.vertexId, to_vertex_id: to.vertexId })
        const features = new GeoJSON().readFeatures(parseGeo(geoData), { dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' })
        features.forEach(f => f.set('color', from.color))
        routeSource.addFeatures(features)
      } catch (e) { console.warn('Segment failed', e) }
    }

    fitRoute()
    showResult(cost)
    setStatus(`TSP order: ${locations.map(l => l.letter).join(' → ')} → ${locations[0].letter}`, 'success')
    hideProgress()
  } catch (err) {
    setStatus(err.message, 'error')
    hideProgress()
  } finally {
    setBtnsDisabled(false)
  }
}

// ── Map click ─────────────────────────────────────────────────
map.on('click', async (e) => {
  if (locations.length >= 8) return

  // Check landmark feature
  const f = map.forEachFeatureAtPixel(e.pixel, f => f, { layerFilter: l => l === markerLayer })
  if (f?.get('id')) {
    const lm = landmarks.find(l => l.id === f.get('id'))
    if (lm && !locations.find(loc => loc.vertexId === lm.vertex_id)) {
      addLocation({ name: lm.name, vertexId: lm.vertex_id, coord: fromLonLat([lm.lon, lm.lat]) })
    }
    return
  }
  // Skip clicks on existing location pins
  if (f?.get('role') === 'location') return

  // Click on map → snap to road
  const [lon, lat] = toLonLat(e.coordinate)
  const coordLabel = `${lat.toFixed(4)}, ${lon.toFixed(4)}`
  setStatus('Snapping to road…')
  try {
    const res = await rpc(city.rpc.nearest, { lat, lon })
    const v = Array.isArray(res) ? res[0] : res
    if (!v) throw new Error('No nearby road found')
    // Use closest landmark name if nearby
    const nearLm = [...landmarks].sort((a, b) => Math.hypot(a.lon - lon, a.lat - lat) - Math.hypot(b.lon - lon, b.lat - lat))[0]
    const name = nearLm && Math.hypot(nearLm.lon - lon, nearLm.lat - lat) < 0.008 ? nearLm.name : coordLabel
    addLocation({ name, vertexId: v.vertex_id, coord: fromLonLat([v.snap_lon, v.snap_lat]) })
    setStatus('')
  } catch (err) {
    setStatus(err.message, 'error')
  }
})

// ── Geolocation ───────────────────────────────────────────────
const geoBtn = document.getElementById('geo-btn')

geoBtn.addEventListener('click', () => {
  if (!navigator.geolocation) { geoBtn.textContent = '✕'; return }
  geoBtn.textContent = '…'
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { longitude: lon, latitude: lat } = pos.coords
      const coord = fromLonLat([lon, lat])
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
    () => { geoBtn.textContent = '📍' },
    { enableHighAccuracy: true, timeout: 10000 }
  )
})

// ── UI helpers ────────────────────────────────────────────────
function setStatus(msg, type) {
  const el = document.getElementById('status')
  el.textContent = msg
  el.className = 'status' + (type ? ` ${type}` : '')
}

function setProgress(pct) {
  const bar = document.getElementById('progress')
  const fill = document.getElementById('progress-fill')
  bar.classList.add('active')
  fill.style.width = pct + '%'
}

function hideProgress() {
  const fill = document.getElementById('progress-fill')
  fill.style.width = '100%'
  setTimeout(() => {
    document.getElementById('progress').classList.remove('active')
    fill.style.width = '0%'
  }, 400)
}

function showResult(distM) {
  document.getElementById('res-dist').textContent = fmtDist(distM)
  document.getElementById('res-walk').textContent = fmtWalk(distM)
  document.getElementById('res-drive').textContent = fmtDrive(distM)
  document.getElementById('result-card').style.display = 'block'
}

function hideResult() {
  document.getElementById('result-card').style.display = 'none'
}

function setBtnsDisabled(disabled) {
  document.querySelectorAll('#action-area .btn').forEach(b => b.disabled = disabled)
}

function fitRoute() {
  const ext = routeSource.getExtent()
  if (!extent.isEmpty(ext)) map.getView().fit(ext, { padding: [80, 80, 200, 80], maxZoom: 16, duration: 600 })
}

// ── Init ──────────────────────────────────────────────────────
renderLocList()
loadLandmarks()
