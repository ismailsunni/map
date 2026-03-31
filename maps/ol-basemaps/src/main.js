import 'ol/ol.css'
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
        url: 'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}.png',
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: 'https://tiles.stadiamaps.com/tiles/outdoors/5/16/10.png',
      },
      {
        id: 'stadia-alidade-smooth',
        name: 'Alidade Smooth',
        provider: 'Stadia',
        url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png',
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/5/16/10.png',
      },
      {
        id: 'stadia-alidade-smooth-dark',
        name: 'Alidade Smooth Dark',
        provider: 'Stadia',
        url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/5/16/10.png',
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
        url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
        attribution: '© <a href="https://stadiamaps.com">Stadia</a> | © <a href="https://stamen.com">Stamen</a>',
        thumb: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/5/16/10.jpg',
      },
      {
        id: 'stadia-toner',
        name: 'Toner',
        provider: 'Stadia / Stamen',
        url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png',
        attribution: '© <a href="https://stadiamaps.com">Stadia</a> | © <a href="https://stamen.com">Stamen</a>',
        thumb: 'https://tiles.stadiamaps.com/tiles/stamen_toner/5/16/10.png',
      },
      {
        id: 'stadia-toner-lite',
        name: 'Toner Lite',
        provider: 'Stadia / Stamen',
        url: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}.png',
        attribution: '© <a href="https://stadiamaps.com">Stadia</a> | © <a href="https://stamen.com">Stamen</a>',
        thumb: 'https://tiles.stadiamaps.com/tiles/stamen_toner_lite/5/16/10.png',
      },
      {
        id: 'stadia-osm-bright',
        name: 'OSM Bright',
        provider: 'Stadia',
        url: 'https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png',
        attribution: '© <a href="https://stadiamaps.com">Stadia Maps</a> | © OSM',
        thumb: 'https://tiles.stadiamaps.com/tiles/osm_bright/5/16/10.png',
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
function getBmById(id) { return allBasemaps.find(b => b.id === id) }

// ── Build OL map ──
const view = new View({ center: fromLonLat([0, 20]), zoom: 2 })
const map = new Map({ target: 'map', view, controls: defaultControls() })

// ── Layer registry ──
const layers = {}
let activeId = null

function getOrCreateLayer(bm) {
  if (layers[bm.id]) return layers[bm.id]
  const src = new XYZ({ url: bm.url, crossOrigin: 'anonymous' })
  const layer = new TileLayer({ source: src, visible: false })
  map.addLayer(layer)
  layers[bm.id] = layer
  return layer
}

// ── Compare state ──
let compareMode = false
let compareId = null
let sliderX = window.innerWidth / 2

// Stored event handler refs for cleanup
let primaryPrerender = null
let primaryPostrender = null
let comparePrerender = null
let comparePostrender = null

function addClipping(layer, side) {
  const pre = (evt) => {
    const ctx = evt.context
    const size = evt.frameState.size
    const w = size[0], h = size[1]
    ctx.save()
    ctx.beginPath()
    if (side === 'left') {
      ctx.rect(0, 0, sliderX, h)
    } else {
      ctx.rect(sliderX, 0, w - sliderX, h)
    }
    ctx.clip()
  }
  const post = (evt) => { evt.context.restore() }
  layer.on('prerender', pre)
  layer.on('postrender', post)
  return { pre, post }
}

function removeClipping(layer, pre, post) {
  if (pre) layer.un('prerender', pre)
  if (post) layer.un('postrender', post)
}

function updateCompareLabel(compareName) {
  document.querySelectorAll('.bm-vs').forEach(el => {
    el.textContent = ''
    el.style.display = 'none'
  })
  if (compareName) {
    const activeBtn = document.querySelector('.bm-btn.active')
    if (activeBtn) {
      const vsEl = activeBtn.querySelector('.bm-vs')
      if (vsEl) {
        vsEl.textContent = `vs ${compareName}`
        vsEl.style.display = ''
      }
    }
  }
}

// ── Slider element ──
const sliderEl = document.getElementById('compare-slider')
const sliderHandle = document.getElementById('compare-handle')

function updateSliderPosition() {
  sliderEl.style.left = sliderX + 'px'
}

// ── Switch basemap ──
function switchBasemap(bm) {
  if (compareMode) {
    const oldPrimaryId = activeId

    // Remove clipping from old layers
    if (oldPrimaryId && layers[oldPrimaryId]) {
      removeClipping(layers[oldPrimaryId], primaryPrerender, primaryPostrender)
    }
    if (compareId && layers[compareId]) {
      removeClipping(layers[compareId], comparePrerender, comparePostrender)
      layers[compareId].setVisible(false)
    }

    // New primary = clicked basemap; new compare = old primary
    activeId = bm.id
    compareId = oldPrimaryId

    // Ensure both layers exist and are visible
    const primaryLayer = getOrCreateLayer(bm)
    primaryLayer.setVisible(true)

    const newCompareBm = getBmById(compareId)
    const compareLayer = getOrCreateLayer(newCompareBm)
    compareLayer.setVisible(true)

    // Hide all other layers
    Object.entries(layers).forEach(([id, layer]) => {
      if (id !== activeId && id !== compareId) layer.setVisible(false)
    })

    // Re-add clipping
    const { pre: pPre, post: pPost } = addClipping(primaryLayer, 'right')
    const { pre: cPre, post: cPost } = addClipping(compareLayer, 'left')
    primaryPrerender = pPre
    primaryPostrender = pPost
    comparePrerender = cPre
    comparePostrender = cPost

    // Update UI
    document.querySelectorAll('.bm-btn').forEach(b => b.classList.remove('active'))
    const btn = document.querySelector(`.bm-btn[data-id="${bm.id}"]`)
    if (btn) btn.classList.add('active')

    document.getElementById('active-name').textContent = `${bm.name} · ${bm.provider}`
    document.getElementById('active-attribution').innerHTML = bm.attribution

    updateCompareLabel(newCompareBm.name)
    map.render()
    return
  }

  // Normal mode
  Object.values(layers).forEach(l => l.setVisible(false))
  const layer = getOrCreateLayer(bm)
  layer.setVisible(true)
  activeId = bm.id

  document.querySelectorAll('.bm-btn').forEach(b => b.classList.remove('active'))
  const btn = document.querySelector(`.bm-btn[data-id="${bm.id}"]`)
  if (btn) btn.classList.add('active')

  document.getElementById('active-name').textContent = `${bm.name} · ${bm.provider}`
  document.getElementById('active-attribution').innerHTML = bm.attribution
}

// ── Enter / exit compare mode ──
function enterCompareMode() {
  compareMode = true
  compareBtn.classList.add('active')

  sliderX = (map.getSize()?.[0] ?? window.innerWidth) / 2
  sliderEl.style.display = ''
  updateSliderPosition()

  // Pick a random compare basemap different from current primary
  const candidates = allBasemaps.filter(bm => bm.id !== activeId)
  const compareBm = candidates[Math.floor(Math.random() * candidates.length)]
  compareId = compareBm.id

  const compareLayer = getOrCreateLayer(compareBm)
  compareLayer.setVisible(true)

  const primaryLayer = layers[activeId]

  const { pre: pPre, post: pPost } = addClipping(primaryLayer, 'right')
  const { pre: cPre, post: cPost } = addClipping(compareLayer, 'left')
  primaryPrerender = pPre
  primaryPostrender = pPost
  comparePrerender = cPre
  comparePostrender = cPost

  updateCompareLabel(compareBm.name)
  map.render()
}

function exitCompareMode() {
  compareMode = false
  compareBtn.classList.remove('active')
  sliderEl.style.display = 'none'

  // Remove clipping from primary
  if (activeId && layers[activeId]) {
    removeClipping(layers[activeId], primaryPrerender, primaryPostrender)
  }

  // Remove clipping and hide compare layer
  if (compareId && layers[compareId]) {
    removeClipping(layers[compareId], comparePrerender, comparePostrender)
    layers[compareId].setVisible(false)
  }

  primaryPrerender = primaryPostrender = comparePrerender = comparePostrender = null
  compareId = null

  updateCompareLabel(null)
  map.render()
}

// ── Compare button ──
const compareBtn = document.getElementById('compare-btn')
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
  const rect = document.getElementById('map').getBoundingClientRect()
  sliderX = Math.max(0, Math.min(rect.width, e.clientX - rect.left))
  updateSliderPosition()
  map.render()
})

document.addEventListener('mouseup', () => { dragging = false })

// ── Slider drag (touch) ──
sliderHandle.addEventListener('touchstart', e => {
  dragging = true
  e.preventDefault()
}, { passive: false })

document.addEventListener('touchmove', e => {
  if (!dragging) return
  const rect = document.getElementById('map').getBoundingClientRect()
  const touch = e.touches[0]
  sliderX = Math.max(0, Math.min(rect.width, touch.clientX - rect.left))
  updateSliderPosition()
  map.render()
  e.preventDefault()
}, { passive: false })

document.addEventListener('touchend', () => { dragging = false })

// ── Build panel ──
const panelBody = document.getElementById('panel-body')

// Search input
const searchWrap = document.createElement('div')
searchWrap.style.cssText = 'padding:0.4rem 0.2rem 0.2rem;'
const searchInput = document.createElement('input')
searchInput.type = 'search'
searchInput.placeholder = 'Filter basemaps…'
searchInput.id = 'bm-search'
searchInput.style.cssText = 'width:100%;padding:0.35rem 0.5rem;border:1.5px solid #e5e7eb;border-radius:8px;font-size:0.75rem;outline:none;'
searchInput.addEventListener('focus', () => { searchInput.style.borderColor = '#0ea5e9' })
searchInput.addEventListener('blur', () => { searchInput.style.borderColor = '#e5e7eb' })
searchWrap.appendChild(searchInput)
panelBody.appendChild(searchWrap)

const noResults = document.createElement('div')
noResults.id = 'no-results'
noResults.textContent = 'No results'
noResults.style.cssText = 'display:none;font-size:0.75rem;color:#9ca3af;text-align:center;padding:0.8rem 0;'
panelBody.appendChild(noResults)

// Category + button elements stored for filtering
const catGroups = []

BASEMAPS.forEach(cat => {
  const label = document.createElement('div')
  label.className = 'cat-label'
  label.textContent = cat.category
  panelBody.appendChild(label)

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
        <div class="bm-vs" style="display:none"></div>
      </div>
      <div class="bm-check"></div>
    `
    btn.addEventListener('click', () => switchBasemap(bm))
    panelBody.appendChild(btn)
    btns.push({ btn, bm })
  })

  catGroups.push({ label, btns })
})

// ── Search filter ──
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

// ── Minimize ──
const minimizeBtn = document.getElementById('minimize-btn')
const panel = document.getElementById('panel')
minimizeBtn.addEventListener('click', () => {
  const minimized = panel.classList.toggle('minimized')
  minimizeBtn.textContent = minimized ? '+' : '–'
})

// ── Default basemap ──
switchBasemap(BASEMAPS[0].maps[1]) // Positron
