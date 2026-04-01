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
        description: 'The free, editable map of the world built by volunteers. Great for general purpose mapping.',
        tags: ['free', 'open source', 'street'],
        link: 'https://openstreetmap.org',
      },
      {
        id: 'carto-light',
        name: 'Positron',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/light_all/5/16/10.png',
        description: 'A clean, minimal light basemap from CARTO. Perfect for data overlays where the map should not distract.',
        tags: ['minimal', 'light', 'data viz'],
        link: 'https://carto.com/basemaps/',
      },
      {
        id: 'carto-dark',
        name: 'Dark Matter',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/dark_all/5/16/10.png',
        description: 'CARTO dark basemap. Ideal for vibrant data overlays on a dark background.',
        tags: ['dark', 'dramatic', 'data viz'],
        link: 'https://carto.com/basemaps/',
      },
      {
        id: 'carto-voyager',
        name: 'Voyager',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/5/16/10.png',
        description: 'A modern, colorful basemap with a fresh look. Good balance between style and detail.',
        tags: ['colorful', 'modern', 'street'],
        link: 'https://carto.com/basemaps/',
      },
      {
        id: 'carto-light-nolabels',
        name: 'Positron No Labels',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/light_nolabels/5/16/10.png',
        description: 'Positron without text labels. Use when you want to add your own labels or keep things clean.',
        tags: ['minimal', 'no labels', 'base layer'],
        link: 'https://carto.com/basemaps/',
      },
      {
        id: 'carto-dark-nolabels',
        name: 'Dark Matter No Labels',
        provider: 'CartoDB',
        url: 'https://{a-d}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        attribution: '© <a href="https://carto.com">CARTO</a> | © OSM',
        thumb: 'https://a.basemaps.cartocdn.com/dark_nolabels/5/16/10.png',
        description: 'Dark Matter without labels. Great base for custom label overlays.',
        tags: ['dark', 'no labels', 'base layer'],
        link: 'https://carto.com/basemaps/',
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
        description: 'Topographic map with contour lines, elevation shading, and hiking trails. Great for outdoor navigation.',
        tags: ['terrain', 'elevation', 'hiking'],
        link: 'https://opentopomap.org',
      },
      {
        id: 'stadia-outdoors',
        name: 'Outdoors',
        provider: 'Stadia',
        url: stadiaUrl('outdoors', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: stadiaThumb('outdoors', 'png'),
        description: 'Stadia Maps outdoor style with path, trail, and terrain detail. Excellent for hiking and cycling.',
        tags: ['outdoor', 'trails', 'terrain'],
        link: 'https://stadiamaps.com/tiles/outdoors/',
      },
      {
        id: 'stadia-alidade-smooth',
        name: 'Alidade Smooth',
        provider: 'Stadia',
        url: stadiaUrl('alidade_smooth', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: stadiaThumb('alidade_smooth', 'png'),
        description: 'A smooth, light style by Stadia Maps with subtle detail. Professional and clean.',
        tags: ['light', 'smooth', 'minimal'],
        link: 'https://stadiamaps.com/tiles/alidade_smooth/',
      },
      {
        id: 'stadia-alidade-smooth-dark',
        name: 'Alidade Smooth Dark',
        provider: 'Stadia',
        url: stadiaUrl('alidade_smooth_dark', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: stadiaThumb('alidade_smooth_dark', 'png'),
        description: 'Dark variant of Alidade Smooth. Sophisticated dark style for dashboards and apps.',
        tags: ['dark', 'smooth', 'professional'],
        link: 'https://stadiamaps.com/tiles/alidade_smooth_dark/',
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
        description: 'A hand-painted watercolor art style by Stamen/Stadia. Artistic and unique, originally created in 2012.',
        tags: ['artistic', 'watercolor', 'creative'],
        link: 'https://stamen.com/watercolor/',
      },
      {
        id: 'stadia-toner',
        name: 'Toner',
        provider: 'Stadia / Stamen',
        url: stadiaUrl('stamen_toner', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia</a> | © <a href="https://stamen.com">Stamen</a>',
        thumb: stadiaThumb('stamen_toner', 'png'),
        description: 'Bold black-and-white ink style by Stamen/Stadia. High contrast, graphic, and striking.',
        tags: ['artistic', 'B&W', 'high contrast'],
        link: 'https://stamen.com/toner/',
      },
      {
        id: 'stadia-toner-lite',
        name: 'Toner Lite',
        provider: 'Stadia / Stamen',
        url: stadiaUrl('stamen_toner_lite', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia</a> | © <a href="https://stamen.com">Stamen</a>',
        thumb: stadiaThumb('stamen_toner_lite', 'png'),
        description: 'Lighter version of Toner — same B&W ink style but softer, less overwhelming.',
        tags: ['artistic', 'B&W', 'subtle'],
        link: 'https://stamen.com/toner/',
      },
      {
        id: 'stadia-osm-bright',
        name: 'OSM Bright',
        provider: 'Stadia',
        url: stadiaUrl('osm_bright', 'png'),
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: stadiaThumb('osm_bright', 'png'),
        description: 'A bright, vibrant OSM-based style by Stadia Maps. Colorful and easy to read.',
        tags: ['bright', 'colorful', 'street'],
        link: 'https://stadiamaps.com/tiles/osm_bright/',
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
        description: 'High-resolution satellite and aerial imagery from ESRI. Shows real-world land cover and terrain.',
        tags: ['satellite', 'imagery', 'aerial'],
        link: 'https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9',
      },
      {
        id: 'esri-streets',
        name: 'World Street',
        provider: 'ESRI',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© <a href="https://esri.com">Esri</a>',
        thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/5/10/16',
        description: 'ESRI World Street Map. Detailed street-level mapping with rich cartographic styling.',
        tags: ['street', 'detailed', 'reference'],
        link: 'https://www.arcgis.com/home/item.html?id=3b93337983e9436f8db950e38a8629af',
      },
      {
        id: 'esri-natgeo',
        name: 'National Geographic',
        provider: 'ESRI',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© <a href="https://esri.com">Esri</a> | National Geographic',
        thumb: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/5/10/16',
        description: 'National Geographic style map by ESRI. Classic cartographic style resembling NatGeo atlas maps.',
        tags: ['classic', 'atlas', 'national geographic'],
        link: 'https://www.arcgis.com/home/item.html?id=b9b1b422198944fbbd5250b3241691b6',
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
        description: 'Cycling-focused OSM map showing bike routes, elevation, and cycle infrastructure in detail.',
        tags: ['cycling', 'bike', 'OSM'],
        link: 'https://www.cyclosm.org',
      },
      {
        id: 'osm-humanitarian',
        name: 'Humanitarian',
        provider: 'OpenStreetMap',
        url: 'https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors | HOT',
        thumb: 'https://tile-a.openstreetmap.fr/hot/5/16/10.png',
        description: 'Humanitarian map style by OpenStreetMap and HOT (Humanitarian OpenStreetMap Team). Used in disaster response.',
        tags: ['humanitarian', 'HOT', 'disaster response'],
        link: 'https://www.hotosm.org',
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
let activeId = null   // left side selection
let compareId = null  // right side selection
let sliderX = window.innerWidth / 2
let infoPanelVisible = false

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

// ── Info panel ──
const infoPanelEl = document.getElementById('info-panel')
const infoThumbEl = document.getElementById('info-thumb')
const infoNameEl = document.getElementById('info-name')
const infoProviderEl = document.getElementById('info-provider')
const infoTagsEl = document.getElementById('info-tags')
const infoDescEl = document.getElementById('info-desc')
const infoLinkEl = document.getElementById('info-link')

document.getElementById('info-close').addEventListener('click', hideInfoPanel)

function showInfoPanel(bm) {
  infoThumbEl.src = bm.thumb
  infoThumbEl.onerror = () => { infoThumbEl.parentElement.style.background = '#e5e7eb' }
  infoNameEl.textContent = bm.name
  infoProviderEl.textContent = bm.provider
  infoTagsEl.innerHTML = (bm.tags || []).map(t => `<span class="info-tag">${t}</span>`).join('')
  infoDescEl.textContent = bm.description || ''
  infoLinkEl.href = bm.link || '#'
  infoPanelEl.classList.add('visible')
  infoPanelVisible = true
}

function hideInfoPanel() {
  infoPanelEl.classList.remove('visible')
  infoPanelVisible = false
}

function toggleInfoPanel(bm) {
  if (infoPanelVisible) {
    hideInfoPanel()
  } else {
    showInfoPanel(bm)
  }
}

// ── Switch left basemap ──
function switchLeftBasemap(bm) {
  const alreadyActive = bm.id === activeId
  Object.values(layersLeft).forEach(l => l.setVisible(false))
  getOrCreateLayer(mapLeft, layersLeft, bm).setVisible(true)
  activeId = bm.id
  panel.updateActive()
  document.getElementById('active-name').textContent = `${bm.name} · ${bm.provider}`
  document.getElementById('active-attribution').innerHTML = bm.attribution
  mapLeft.render()
  if (!compareMode) {
    if (alreadyActive) toggleInfoPanel(bm)
    else showInfoPanel(bm)
  }
}

// ── Switch right basemap ──
function switchRightBasemap(bm) {
  Object.values(layersRight).forEach(l => l.setVisible(false))
  getOrCreateLayer(mapRight, layersRight, bm).setVisible(true)
  compareId = bm.id
  panel.updateActive()
  mapRight.render()
  // No info panel in compare mode
}

// ── Enter / exit compare mode ──
const compareBtn = document.getElementById('compare-btn')

function enterCompareMode() {
  compareMode = true
  compareBtn.classList.add('active')
  hideInfoPanel()
  infoPanelEl.classList.add('compare')

  sliderX = window.innerWidth / 2
  sliderEl.style.display = ''
  updateSliderPosition()

  mapRightEl.style.display = ''
  mapRight.updateSize()

  // Pick a random basemap different from left
  const candidates = allBasemaps.filter(bm => bm.id !== activeId)
  const compareBm = candidates[Math.floor(Math.random() * candidates.length)]
  Object.values(layersRight).forEach(l => l.setVisible(false))
  getOrCreateLayer(mapRight, layersRight, compareBm).setVisible(true)
  compareId = compareBm.id
  mapRight.render()

  // Show L/R buttons, hide check indicators
  document.querySelectorAll('.bm-lr').forEach(el => el.classList.add('visible'))
  document.querySelectorAll('.bm-check').forEach(el => { el.style.display = 'none' })

  panel.updateActive()
  applyClipPaths()
}

function exitCompareMode() {
  compareMode = false
  compareBtn.classList.remove('active')
  infoPanelEl.classList.remove('compare')

  sliderEl.style.display = 'none'
  clearClipPaths()

  mapRightEl.style.display = 'none'
  Object.values(layersRight).forEach(l => l.setVisible(false))
  compareId = null

  // Hide L/R buttons, show check indicators
  document.querySelectorAll('.bm-lr').forEach(el => el.classList.remove('visible'))
  document.querySelectorAll('.bm-check').forEach(el => { el.style.display = '' })

  panel.updateActive()
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
function buildPanel(bodyEl) {
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
        <div class="bm-lr">
          <button class="lr-btn lr-left" data-id="${bm.id}" title="Set as left map">L</button>
          <button class="lr-btn lr-right" data-id="${bm.id}" title="Set as right map">R</button>
        </div>
        <div class="bm-check"></div>
      `
      btn.querySelector('.lr-left').addEventListener('click', e => {
        e.stopPropagation()
        switchLeftBasemap(bm)
      })
      btn.querySelector('.lr-right').addEventListener('click', e => {
        e.stopPropagation()
        switchRightBasemap(bm)
      })
      btn.addEventListener('click', () => {
        switchLeftBasemap(bm)
      })
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

  function updateLeftActive(id) {
    allBtns.forEach(({ btn, bm }) => {
      btn.querySelector('.lr-left').classList.toggle('active', bm.id === id)
    })
  }

  function updateRightActive(id) {
    allBtns.forEach(({ btn, bm }) => {
      btn.querySelector('.lr-right').classList.toggle('active', bm.id === id)
    })
  }

  function updateActive() {
    allBtns.forEach(({ btn, bm }) => {
      btn.classList.toggle('active', bm.id === activeId)
    })
    if (compareMode) {
      updateLeftActive(activeId)
      updateRightActive(compareId)
    }
  }

  return { updateActive }
}

// ── Initialize panel ──
const panel = buildPanel(document.getElementById('panel-body'))

// ── Minimize button ──
document.getElementById('minimize-btn-left').addEventListener('click', () => {
  const p = document.getElementById('panel')
  const minimized = p.classList.toggle('minimized')
  document.getElementById('minimize-btn-left').textContent = minimized ? '+' : '–'
})

// ── Default basemap ──
switchLeftBasemap(BASEMAPS[0].maps[1]) // Positron
