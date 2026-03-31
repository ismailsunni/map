import 'ol/ol.css'

const STADIA_KEY = import.meta.env.VITE_STADIA_API_KEY || ''
const stadiaUrl = (style, ext = 'png') =>
  `https://tiles.stadiamaps.com/tiles/${style}/{z}/{x}/{y}.${ext}${STADIA_KEY ? `?api_key=${STADIA_KEY}` : ''}`
const stadiaThumb = (style, ext = 'png') =>
  `https://tiles.stadiamaps.com/tiles/${style}/5/16/10.${ext}${STADIA_KEY ? `?api_key=${STADIA_KEY}` : ''}`

import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import { fromLonLat } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'

const BASEMAPS = [
  {
    category: 'Street',
    maps: [
      {
        id: 'osm',
        name: 'OpenStreetMap',
        provider: 'OSM',
        url: 'https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        thumb: 'https://tile.openstreetmap.org/5/16/10.png',
      },
      {
        id: 'carto-light',
        name: 'Positron',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/light_all/5/16/10.png',
      },
      {
        id: 'carto-dark',
        name: 'Dark Matter',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/dark_all/5/16/10.png',
      },
      {
        id: 'carto-voyager',
        name: 'Voyager',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/5/16/10.png',
      },
      {
        id: 'carto-light-nolabels',
        name: 'Positron No Labels',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/light_nolabels/5/16/10.png',
      },
      {
        id: 'carto-dark-nolabels',
        name: 'Dark Matter No Labels',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/dark_nolabels/5/16/10.png',
      },
    ]
  },
  {
    category: 'Terrain & Outdoors',
    maps: [
      {
        id: 'otm',
        name: 'OpenTopoMap',
        provider: 'OpenTopoMap',
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attribution: '© <a href="https://opentopomap.org">OpenTopoMap</a> | © OSM',
        thumb: 'https://a.tile.opentopomap.org/5/16/10.png',
      },
      {
        id: 'stadia-outdoors',
        name: 'Outdoors',
        provider: 'Stadia',
        url: stadiaUrl('outdoors', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: stadiaThumb('outdoors', 'png'),
      },
      {
        id: 'stadia-alidade-smooth',
        name: 'Alidade Smooth',
        provider: 'Stadia',
        url: stadiaUrl('alidade_smooth', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: stadiaThumb('alidade_smooth', 'png'),
      },
      {
        id: 'stadia-alidade-smooth-dark',
        name: 'Alidade Smooth Dark',
        provider: 'Stadia',
        url: stadiaUrl('alidade_smooth_dark', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: stadiaThumb('alidade_smooth_dark', 'png'),
      },
    ]
  },
  {
    category: 'Artistic',
    maps: [
      {
        id: 'stadia-watercolor',
        name: 'Watercolor',
        provider: 'Stadia / Stamen',
        url: stadiaUrl('stamen_watercolor', 'jpg'),
        attribution: '© <a href="https://stadiamaps.com">Stadia</a> | © <a href="https://stamen.com">Stamen</a>',
        thumb: stadiaThumb('stamen_watercolor', 'jpg'),
      },
      {
        id: 'stadia-toner',
        name: 'Toner',
        provider: 'Stadia / Stamen',
        url: stadiaUrl('stamen_toner', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia</a> | © <a href="https://stamen.com">Stamen</a>',
        thumb: stadiaThumb('stamen_toner', 'png'),
      },
      {
        id: 'stadia-toner-lite',
        name: 'Toner Lite',
        provider: 'Stadia / Stamen',
        url: stadiaUrl('stamen_toner_lite', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia</a> | © <a href="https://stamen.com">Stamen</a>',
        thumb: stadiaThumb('stamen_toner_lite', 'png'),
      },
      {
        id: 'stadia-osm-bright',
        name: 'OSM Bright',
        provider: 'Stadia',
        url: stadiaUrl('osm_bright', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: stadiaThumb('osm_bright', 'png'),
      },
    ]
  },
  {
    category: 'Satellite & Imagery',
    maps: [
      {
        id: 'esri-satellite',
        name: 'World Imagery',
        provider: 'ESRI',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© <a href="https://esri.com">Esri</a> | © Various',
        thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/5/10/16',
      },
      {
        id: 'esri-streets',
        name: 'World Street',
        provider: 'ESRI',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© <a href="https://esri.com">Esri</a>',
        thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/5/10/16',
      },
      {
        id: 'esri-natgeo',
        name: 'National Geographic',
        provider: 'ESRI',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© <a href="https://esri.com">Esri</a> | National Geographic',
        thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/5/10/16',
      },
    ]
  },
  {
    category: 'OSM Variants',
    maps: [
      {
        id: 'cyclosm',
        name: 'CyclOSM',
        provider: 'CyclOSM',
        url: 'https://{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
        attribution: '© <a href="https://www.cyclosm.org">CyclOSM</a> | © OSM contributors',
        thumb: 'https://a.tile-cyclosm.openstreetmap.fr/cyclosm/5/16/10.png',
      },
      {
        id: 'osm-humanitarian',
        name: 'Humanitarian',
        provider: 'OpenStreetMap',
        url: 'https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors | HOT',
        thumb: 'https://tile-a.openstreetmap.fr/hot/5/16/10.png',
      },
    ]
  },
]

// ── Flat list helper ──
const allBasemaps = BASEMAPS.flatMap(c => c.maps)

// ── Two OL maps sharing the same View ──
const view = new View({ center: fromLonLat([0, 20]), zoom: 2 })
const mapLeft = new Map({ target: 'map-left', view, controls: defaultControls() })
const mapRight = new Map({ target: 'map-right', view, controls: [] })

const mapLeftEl = document.getElementById('map-left')
const mapRightEl = document.getElementById('map-right')

// ── Per-map layer registries ──
const layersLeft = {}
const layersRight = {}

function getOrCreateLayer(mapInst, registry, bm) {
  if (registry[bm.id]) return registry[bm.id]
  const layer = new TileLayer({
    source: new XYZ({ url: bm.url, crossOrigin: 'anonymous' }),
    visible: false,
  })
  mapInst.addLayer(layer)
  registry[bm.id] = layer
  return layer
}

// ── State ──
let compareMode = false
let activeId = null   // left panel selection
let compareId = null  // right panel selection
let sliderX = window.innerWidth / 2

// ── CSS clip-path helpers ──
function applyClipPaths() {
  const w = window.innerWidth
  const x = sliderX
  mapLeftEl.style.clipPath = `inset(0 ${w - x}px 0 0)`
  mapRightEl.style.clipPath = `inset(0 0 0 ${x}px)`
  mapLeft.render()
  mapRight.render()
}

function clearClipPaths() {
  mapLeftEl.style.clipPath = ''
  mapRightEl.style.clipPath = ''
}

// ── Slider ──
const sliderEl = document.getElementById('compare-slider')
const sliderHandle = document.getElementById('compare-handle')

function updateSliderPosition() {
  sliderEl.style.left = sliderX + 'px'
  if (compareMode) applyClipPaths()
}

// ── Switch left basemap ──
function switchLeftBasemap(bm) {
  Object.values(layersLeft).forEach(l => l.setVisible(false))
  getOrCreateLayer(mapLeft, layersLeft, bm).setVisible(true)
  activeId = bm.id
  leftPanel.setActive(bm.id)
  document.getElementById('active-name').textContent = `${bm.name} · ${bm.provider}`
  document.getElementById('active-attribution').innerHTML = bm.attribution
  mapLeft.render()
}

// ── Switch right basemap ──
function switchRightBasemap(bm) {
  Object.values(layersRight).forEach(l => l.setVisible(false))
  getOrCreateLayer(mapRight, layersRight, bm).setVisible(true)
  compareId = bm.id
  rightPanel.setActive(bm.id)
  mapRight.render()
}

// ── Enter / exit compare mode ──
const panelRightEl = document.getElementById('panel-right')
const panelTitleEl = document.getElementById('panel-title')
const compareBtn = document.getElementById('compare-btn')

function enterCompareMode() {
  compareMode = true
  compareBtn.classList.add('active')
  panelTitleEl.textContent = '◀ Left'

  sliderX = window.innerWidth / 2
  sliderEl.style.display = ''
  updateSliderPosition()

  mapRightEl.style.display = ''
  mapRight.updateSize()

  // Pick a random basemap different from left
  const candidates = allBasemaps.filter(bm => bm.id !== activeId)
  const compareBm = candidates[Math.floor(Math.random() * candidates.length)]
  switchRightBasemap(compareBm)

  panelRightEl.style.display = ''
  applyClipPaths()
}

function exitCompareMode() {
  compareMode = false
  compareBtn.classList.remove('active')
  panelTitleEl.textContent = '🗺️ Basemap Explorer'

  sliderEl.style.display = 'none'
  clearClipPaths()

  mapRightEl.style.display = 'none'
  Object.values(layersRight).forEach(l => l.setVisible(false))
  compareId = null

  panelRightEl.style.display = 'none'
  mapLeft.render()
}

compareBtn.addEventListener('click', () => {
  if (compareMode) exitCompareMode()
  else enterCompareMode()
})

// ── Slider drag (mouse) ──
let dragging = false

sliderHandle.addEventListener('mousedown', e => {
  dragging = true
  e.preventDefault()
})

document.addEventListener('mousemove', e => {
  if (!dragging) return
  sliderX = Math.max(0, Math.min(window.innerWidth, e.clientX))
  updateSliderPosition()
})

document.addEventListener('mouseup', () => { dragging = false })

// ── Slider drag (touch) ──
sliderHandle.addEventListener('touchstart', e => {
  dragging = true
  e.preventDefault()
}, { passive: false })

document.addEventListener('touchmove', e => {
  if (!dragging) return
  sliderX = Math.max(0, Math.min(window.innerWidth, e.touches[0].clientX))
  updateSliderPosition()
  e.preventDefault()
}, { passive: false })

document.addEventListener('touchend', () => { dragging = false })

// ── Window resize ──
window.addEventListener('resize', () => {
  if (compareMode) applyClipPaths()
})

// ── Build panel body ──
function buildPanel(bodyEl, onClickBm) {
  const searchWrap = document.createElement('div')
  searchWrap.style.cssText = 'padding:0.4rem 0.2rem 0.2rem;'
  const searchInput = document.createElement('input')
  searchInput.type = 'search'
  searchInput.placeholder = 'Filter basemaps…'
  searchInput.style.cssText = 'width:100%;padding:0.35rem 0.5rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:0.75rem;outline:none;'
  searchInput.addEventListener('focus', () => { searchInput.style.borderColor = '#0ea5e9' })
  searchInput.addEventListener('blur', () => { searchInput.style.borderColor = '#e5e7eb' })
  searchWrap.appendChild(searchInput)
  bodyEl.appendChild(searchWrap)

  const noResults = document.createElement('div')
  noResults.textContent = 'No results'
  noResults.style.cssText = 'display:none;font-size:0.75rem;color:#9ca3af;text-align:center;padding:0.8rem 0;'
  bodyEl.appendChild(noResults)

  const allBtns = []
  const catGroups = []

  BASEMAPS.forEach(cat => {
    const label = document.createElement('div')
    label.className = 'cat-label'
    label.textContent = cat.category
    bodyEl.appendChild(label)

    const btns = []
    cat.maps.forEach(bm => {
      const btn = document.createElement('button')
      btn.className = 'bm-btn'
      btn.dataset.id = bm.id
      btn.innerHTML = `
        <div class="bm-thumb"><img src="${bm.thumb}" alt="" onerror="this.parentElement.style.background='#e5e7eb'" /></div>
        <div class="bm-info">
          <div class="bm-name">${bm.name}</div>
          <div class="bm-provider">${bm.provider}</div>
        </div>
        <div class="bm-check"></div>
      `
      btn.addEventListener('click', () => onClickBm(bm))
      bodyEl.appendChild(btn)
      btns.push({ btn, bm })
      allBtns.push({ btn, bm })
    })

    catGroups.push({ label, btns })
  })

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.trim().toLowerCase()
    let visibleCount = 0

    catGroups.forEach(({ label, btns }) => {
      let catVisible = 0
      btns.forEach(({ btn, bm }) => {
        const match = !q || bm.name.toLowerCase().includes(q) || bm.provider.toLowerCase().includes(q)
        btn.style.display = match ? '' : 'none'
        if (match) catVisible++
      })
      label.style.display = catVisible > 0 ? '' : 'none'
      visibleCount += catVisible
    })

    noResults.style.display = visibleCount === 0 ? '' : 'none'
  })

  function setActive(id) {
    allBtns.forEach(({ btn, bm }) => {
      btn.classList.toggle('active', bm.id === id)
    })
  }

  return { setActive }
}

// ── Initialize panels ──
const leftPanel = buildPanel(document.getElementById('panel-body'), bm => switchLeftBasemap(bm))
const rightPanel = buildPanel(document.getElementById('panel-right-body'), bm => switchRightBasemap(bm))

// ── Minimize buttons ──
document.getElementById('minimize-btn-left').addEventListener('click', () => {
  const panel = document.getElementById('panel')
  const minimized = panel.classList.toggle('minimized')
  document.getElementById('minimize-btn-left').textContent = minimized ? '+' : '–'
})

document.getElementById('minimize-btn-right').addEventListener('click', () => {
  const panel = document.getElementById('panel-right')
  const minimized = panel.classList.toggle('minimized')
  document.getElementById('minimize-btn-right').textContent = minimized ? '+' : '–'
})

// ── Default basemap ──
switchLeftBasemap(BASEMAPS[0].maps[1]) // Positron
