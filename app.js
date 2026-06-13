// ── State ─────────────────────────────────────────────────────────────────────
let map;
let aduPolygon       = null;
let aduImage         = null;
let clearancePolygon = null;
let parcelLayer      = null;
let rotMarker        = null;
let aduState         = null; // { center: L.LatLng, widthM, heightM, rotation }
let parcelFetchTimer = null;
let currentRates     = { lo: 2.50, hi: 3.50, label: null }; // $/sq ft/month

const CLEARANCE_M = 0.3048 * 4 * 2; // 4 ft each side → added to both width and height

// Extract a Leaflet LatLng from either a Leaflet mouse event or a raw touch event.
function eventLatLng(e) {
  if (e.latlng) return e.latlng;
  const orig  = e.originalEvent || e;
  const touch = (orig.touches && orig.touches[0]) || (orig.changedTouches && orig.changedTouches[0]);
  if (!touch) return null;
  const rect = map.getContainer().getBoundingClientRect();
  return map.containerPointToLatLng(L.point(touch.clientX - rect.left, touch.clientY - rect.top));
}

// ── California rental rates by county ($/sq ft/month) ────────────────────────
// Source: Zillow Rent Index + Apartment List, 2024–2025
const COUNTY_RATES = {
  // Bay Area — premium
  'San Francisco County':   { lo: 4.50, hi: 5.50 },
  'San Mateo County':       { lo: 4.00, hi: 4.80 },
  'Marin County':           { lo: 4.00, hi: 5.00 },
  'Santa Clara County':     { lo: 3.50, hi: 4.50 },
  'Alameda County':         { lo: 3.00, hi: 4.00 },
  'Napa County':            { lo: 2.80, hi: 3.60 },
  'Contra Costa County':    { lo: 2.50, hi: 3.20 },
  'Sonoma County':          { lo: 2.40, hi: 3.20 },
  'Solano County':          { lo: 2.00, hi: 2.70 },
  // Southern California
  'Los Angeles County':     { lo: 3.00, hi: 4.00 },
  'Orange County':          { lo: 2.80, hi: 3.80 },
  'San Diego County':       { lo: 3.00, hi: 4.00 },
  'Santa Barbara County':   { lo: 2.80, hi: 3.80 },
  'Ventura County':         { lo: 2.40, hi: 3.20 },
  'Riverside County':       { lo: 1.80, hi: 2.60 },
  'San Bernardino County':  { lo: 1.60, hi: 2.20 },
  // Coastal Central
  'Santa Cruz County':      { lo: 3.00, hi: 4.00 },
  'Monterey County':        { lo: 2.50, hi: 3.50 },
  'San Luis Obispo County': { lo: 2.50, hi: 3.50 },
  // Sacramento / Foothills
  'Placer County':          { lo: 2.20, hi: 3.00 },
  'El Dorado County':       { lo: 2.00, hi: 2.80 },
  'Sacramento County':      { lo: 1.80, hi: 2.50 },
  'Yolo County':            { lo: 2.00, hi: 2.80 },
  'Nevada County':          { lo: 2.00, hi: 2.80 },
  // Central Valley
  'San Joaquin County':     { lo: 1.60, hi: 2.20 },
  'Stanislaus County':      { lo: 1.50, hi: 2.10 },
  'Fresno County':          { lo: 1.40, hi: 2.00 },
  'Tulare County':          { lo: 1.20, hi: 1.70 },
  'Kings County':           { lo: 1.20, hi: 1.60 },
  'Kern County':            { lo: 1.30, hi: 1.80 },
  'Merced County':          { lo: 1.30, hi: 1.80 },
  // North Coast / Inland North
  'Mendocino County':       { lo: 1.80, hi: 2.50 },
  'Humboldt County':        { lo: 1.50, hi: 2.20 },
  'Lake County':            { lo: 1.20, hi: 1.80 },
  'Shasta County':          { lo: 1.40, hi: 2.00 },
};
const DEFAULT_RATES = { lo: 2.50, hi: 3.50 };

// ── Geo math ──────────────────────────────────────────────────────────────────
const FT_TO_M       = 0.3048;
const M_PER_LAT_DEG = 111111;

function ft2m(ft) { return ft * FT_TO_M; }
function lngDegsPerMeter(lat) { return 1 / (M_PER_LAT_DEG * Math.cos(lat * Math.PI / 180)); }

// Meters per pixel at a given zoom level and latitude (Web Mercator).
function metersPerPixel(lat, zoom) {
  return (40075016.686 / Math.pow(2, zoom + 8)) * Math.cos(lat * Math.PI / 180);
}

// 4 Leaflet [lat, lng] corners for a rectangle.
// rot = compass bearing in radians (0 = north, CW positive).
function calcCorners(center, widthM, heightM, rot) {
  const lat  = center.lat;
  const lng  = center.lng;
  const latD = 1 / M_PER_LAT_DEG;
  const lngD = lngDegsPerMeter(lat);
  const hw   = widthM  / 2;
  const hh   = heightM / 2;
  const cos  = Math.cos(rot);
  const sin  = Math.sin(rot);
  return [[-hw, hh], [hw, hh], [hw, -hh], [-hw, -hh]].map(([x, y]) => [
    lat + (-x * sin + y * cos) * latD,
    lng + ( x * cos + y * sin) * lngD,
  ]);
}

// ↺ rotation handle position (above top edge of ADU).
function handleLatLng(center, heightM, rot) {
  const dist = heightM / 2 + ft2m(20);
  return L.latLng(
    center.lat + dist * Math.cos(rot) / M_PER_LAT_DEG,
    center.lng + dist * Math.sin(rot) * lngDegsPerMeter(center.lat),
  );
}

// ── Floor plan image overlay ──────────────────────────────────────────────────
// Custom Leaflet layer that places a top-down floor plan image on the map,
// scaled to real-world meters and rotated with the ADU.
const FloorplanLayer = L.Layer.extend({
  initialize(center, widthM, heightM, rotation, imageUrl) {
    this.center   = center;
    this.widthM   = widthM;
    this.heightM  = heightM;
    this.rotation = rotation;
    this.imageUrl = imageUrl;
  },

  onAdd(map) {
    this._map = map;
    const img = this._img = document.createElement('img');
    img.src       = this.imageUrl;
    img.draggable = false;
    Object.assign(img.style, {
      position:        'absolute',
      transformOrigin: 'center center',
      userSelect:      'none',
      pointerEvents:   'none', // drag events handled by polygon on top
      borderRadius:    '2px',
    });
    map.getPanes().floorplanPane.appendChild(img);
    map.on('viewreset zoom', this._reposition, this);
    this._reposition();
  },

  onRemove(map) {
    this._img.remove();
    map.off('viewreset zoom', this._reposition, this);
  },

  // Update center + rotation without recreating the layer.
  setTransform(center, rotation) {
    this.center   = center;
    this.rotation = rotation;
    this._reposition();
  },

  _reposition() {
    const map = this._map;
    const c   = this.center;
    const mpp = metersPerPixel(c.lat, map.getZoom());
    const pw  = this.widthM  / mpp;
    const ph  = this.heightM / mpp;
    const pt  = map.latLngToLayerPoint(c);
    const s   = this._img.style;
    s.width     = `${pw}px`;
    s.height    = `${ph}px`;
    s.left      = `${pt.x - pw / 2}px`;
    s.top       = `${pt.y - ph / 2}px`;
    s.transform = `rotate(${this.rotation}rad)`;
  },
});

// ── Rotation handle icon ──────────────────────────────────────────────────────
// Two ~120° arcs (upper + lower) with arrowheads showing CW rotation.
// Arc radius 10, circle radius 20, center (22,22).
// Arc 1: upper-left (17,13.3) → right (32,22) CW — arrowhead points down at right.
// Arc 2: lower-right (27,30.7) → left (12,22) CW — arrowhead points up at left.
function makeRotIcon() {
  return L.divIcon({
    className: '',
    html: `<div class="rot-handle">↺</div>`,
    iconSize:   [44, 44],
    iconAnchor: [22, 22],
  });
}

// ── ADU placement ─────────────────────────────────────────────────────────────
function getModel() {
  const id = document.getElementById('modelSelect').value;
  return ADU_MODELS.find(m => m.id === id) || ADU_MODELS[0];
}

function removeADU() {
  aduPolygon?.remove();
  aduImage?.remove();
  clearancePolygon?.remove();
  rotMarker?.remove();
  aduPolygon = aduImage = clearancePolygon = rotMarker = aduState = null;
  document.getElementById('btnClear').hidden = true;
}

function placeADU(latlng, rotation = 0) {
  removeADU();

  const model   = getModel();
  const widthM  = ft2m(model.width);
  const heightM = ft2m(model.depth);
  const rot     = rotation;
  const center  = L.latLng(latlng.lat, latlng.lng);
  const hasImg  = !!model.imageUrl;

  aduState = { center, widthM, heightM, rotation: rot };

  // Floor plan image (below the polygon so polygon handles drag)
  if (hasImg) {
    aduImage = new FloorplanLayer(center, widthM, heightM, rot, model.imageUrl).addTo(map);
  }

  // 4 ft clearance guideline
  clearancePolygon = L.polygon(calcCorners(center, widthM + CLEARANCE_M, heightM + CLEARANCE_M, rot), {
    color:       '#FFD60A',
    weight:      1.5,
    opacity:     0.85,
    dashArray:   '7 5',
    fillColor:   '#FFD60A',
    fillOpacity: 0.07,
    interactive: false,
  }).addTo(map);

  // Outline polygon — filled (invisible fill) when image shown, filled blue otherwise
  aduPolygon = L.polygon(calcCorners(center, widthM, heightM, rot), {
    color:       '#0071e3',
    weight:      0,
    opacity:     0,
    fillColor:   '#0071e3',
    fillOpacity: hasImg ? 0.01 : 0.28, // 0.01 = invisible but still hit-testable
    className:   'adu-poly',
  }).addTo(map);

  // Rotation handle
  rotMarker = L.marker(handleLatLng(center, heightM, rot), {
    icon:         makeRotIcon(),
    draggable:    true,
    title:        'Drag to rotate',
    zIndexOffset: 100,
  }).addTo(map);

  // ── Drag polygon to move (mouse + touch) ──
  aduPolygon.on('mousedown touchstart', (e) => {
    L.DomEvent.stopPropagation(e);
    const orig = e.originalEvent || e;
    if (orig.preventDefault) orig.preventDefault();
    map.dragging.disable();

    let last = eventLatLng(e);
    if (!last) { map.dragging.enable(); return; }

    function move(latlng) {
      const dlat = latlng.lat - last.lat;
      const dlng = latlng.lng - last.lng;
      last = latlng;
      aduState.center = L.latLng(aduState.center.lat + dlat, aduState.center.lng + dlng);
      const { center: c2, widthM: w2, heightM: h2, rotation: r2 } = aduState;
      aduPolygon.setLatLngs(calcCorners(c2, w2, h2, r2));
      clearancePolygon.setLatLngs(calcCorners(c2, w2 + CLEARANCE_M, h2 + CLEARANCE_M, r2));
      rotMarker.setLatLng(handleLatLng(c2, h2, r2));
      aduImage?.setTransform(c2, r2);
      clearTimeout(parcelFetchTimer);
      parcelFetchTimer = setTimeout(() => fetchParcel(aduState.center.lat, aduState.center.lng), 800);
    }

    function onMouseMove(ev) { move(ev.latlng); }
    function onTouchMove(ev) {
      ev.preventDefault();
      const ll = eventLatLng(ev);
      if (ll) move(ll);
    }

    function onUp() {
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onUp);
      map.dragging.enable();
      clearTimeout(parcelFetchTimer);
      fetchParcel(aduState.center.lat, aduState.center.lng);
    }

    map.on('mousemove', onMouseMove);
    map.on('mouseup', onUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onUp);
  });

  aduPolygon.on('click', L.DomEvent.stopPropagation);

  // ── Drag rotation handle to rotate ──
  rotMarker.on('drag', (e) => {
    const pos   = e.latlng;
    const c     = aduState.center;
    const dy    = (pos.lat - c.lat) * M_PER_LAT_DEG;
    const dx    = (pos.lng - c.lng) / lngDegsPerMeter(c.lat);
    const angle = Math.atan2(dx, dy);
    aduState.rotation = angle;
    aduPolygon.setLatLngs(calcCorners(c, aduState.widthM, aduState.heightM, angle));
    clearancePolygon.setLatLngs(calcCorners(c, aduState.widthM + CLEARANCE_M, aduState.heightM + CLEARANCE_M, angle));
    aduImage?.setTransform(c, angle);
    // Don't call rotMarker.setLatLng here — it fights Leaflet's drag state and causes snap-back
  });

  // Snap handle to the correct orbit position once drag is released
  rotMarker.on('dragend', () => {
    rotMarker.setLatLng(handleLatLng(aduState.center, aduState.heightM, aduState.rotation));
  });

  document.getElementById('toast').classList.add('hidden');
  document.getElementById('btnClear').hidden = false;
}

// ── Parcel lookup + rental rate (both run in parallel) ────────────────────────
async function fetchParcel(lat, lng) {
  parcelLayer?.remove();
  parcelLayer = null;

  const PARCEL_URL = 'https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CA_State_Parcels/FeatureServer/0/query';
  const parcelParams = new URLSearchParams({
    geometry:            `${lng},${lat}`,
    geometryType:        'esriGeometryPoint',
    inSR:                '4326',
    spatialRel:          'esriSpatialRelIntersects',
    outFields:           'PARCEL_APN,SITE_CITY,SITE_ADDR,Shape__Area',
    outSR:               '4326',
    maxAllowableOffset:  '0',
    f:                   'geojson',
    resultRecordCount:   '1',
  });

  const [parcelResult, geoResult] = await Promise.allSettled([
    fetch(`${PARCEL_URL}?${parcelParams}`).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`).then(r => r.json()),
  ]);

  // Update rental rates from reverse geocode
  if (geoResult.status === 'fulfilled') {
    const county = geoResult.value?.address?.county || '';
    currentRates = { ...(COUNTY_RATES[county] || DEFAULT_RATES), label: county.replace(' County', '') };
    updateRentalDisplay();
  }

  // Draw parcel boundary + sidebar
  if (parcelResult.status !== 'fulfilled') return;
  const feature = parcelResult.value?.features?.[0];
  if (!feature) return;

  const geom  = feature.geometry;
  const rings = geom.type === 'MultiPolygon' ? geom.coordinates[0] : geom.coordinates;
  parcelLayer = L.polygon(
    rings.map(ring => ring.map(([lo, la]) => [la, lo])),
    { color: '#FFD60A', weight: 2.5, opacity: 1, fillColor: '#FFD60A', fillOpacity: 0.1, interactive: false }
  ).addTo(map);

  const p      = feature.properties || {};
  const areaM2 = p.Shape__Area || 0;
  const sqft   = areaM2 > 0 ? `${Math.round(areaM2 * 10.764).toLocaleString()} sq ft` : null;
  const acres  = areaM2 > 0 ? `${(areaM2 / 4047).toFixed(3)} ac` : null;
  const addr   = [p.SITE_ADDR, p.SITE_CITY].filter(Boolean).join(', ') || '–';

  document.getElementById('lotAddress').textContent = addr;
  document.getElementById('lotArea').textContent    = [sqft, acres].filter(Boolean).join(' · ') || '–';
  document.getElementById('lotAPN').textContent     = p.PARCEL_APN || '–';
  document.getElementById('lotSection').hidden      = false;
}

// ── Address search (Nominatim) ────────────────────────────────────────────────
let searchTimer;

function initSearch() {
  const input  = document.getElementById('addressSearch');
  const listEl = document.getElementById('suggestions');

  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (q.length < 3) { listEl.hidden = true; return; }
    searchTimer = setTimeout(() => fetchSuggestions(q, listEl), 350);
  });

  document.addEventListener('click', (e) => {
    if (!input.parentElement.contains(e.target)) listEl.hidden = true;
  });
}

async function fetchSuggestions(query, listEl) {
  const params = new URLSearchParams({
    q: query, format: 'json', limit: 5, countrycodes: 'us',
    viewbox: '-124.5,42.0,-114.1,32.5', bounded: 0,
  });
  try {
    const res     = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
    const results = await res.json();
    renderSuggestions(results, listEl);
  } catch { listEl.hidden = true; }
}

function renderSuggestions(results, listEl) {
  listEl.innerHTML = '';
  if (!results.length) { listEl.hidden = true; return; }
  results.forEach(r => {
    const li = document.createElement('li');
    li.textContent = r.display_name;
    li.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
      document.getElementById('addressSearch').value = r.display_name;
      listEl.hidden = true;
      map.setView([lat, lon], 19);
      fetchParcel(lat, lon);
    });
    listEl.appendChild(li);
  });
  listEl.hidden = false;
}

// ── UI ────────────────────────────────────────────────────────────────────────
function updateUnitCard() {
  const m     = getModel();
  const total = m.width * m.depth;
  const fpEl = document.getElementById('unitFloorplan');
  if (m.imageUrl) {
    fpEl.src    = m.imageUrl;
    fpEl.hidden = false;
  } else {
    fpEl.hidden = true;
    fpEl.src    = '';
  }

  document.getElementById('unitArea').textContent = m.living
    ? `${m.living} sq ft living · ${total} sq ft total`
    : `${total.toLocaleString()} sq ft footprint`;
  document.getElementById('badgeW').textContent   = `W: ${m.width} ft`;
  document.getElementById('badgeD').textContent   = `D: ${m.depth} ft`;

  updateRentalDisplay();
}

function updateRentalDisplay() {
  const locLabel = currentRates.label ? `${currentRates.label} County market` : 'California avg';

  // Update desktop unit card
  const m = getModel();
  if (m.living) {
    const lo = Math.round(m.living * currentRates.lo / 50) * 50;
    const hi = Math.round(m.living * currentRates.hi / 50) * 50;
    document.getElementById('unitRental').textContent     = `$${lo.toLocaleString()} – $${hi.toLocaleString()} / mo`;
    document.getElementById('rentalLocation').textContent = locLabel;
    document.getElementById('rentalRow').hidden           = false;
  } else {
    document.getElementById('rentalRow').hidden = true;
  }

  // Update all mobile slider slides
  ADU_MODELS.forEach(model => {
    const slide = document.querySelector(`.slider-slide[data-id="${model.id}"]`);
    if (!slide || !model.living) return;
    const lo = Math.round(model.living * currentRates.lo / 50) * 50;
    const hi = Math.round(model.living * currentRates.hi / 50) * 50;
    const rv = slide.querySelector('.slider-rental-val');
    const rl = slide.querySelector('.slider-rental-loc');
    if (rv) rv.textContent = `$${lo.toLocaleString()} – $${hi.toLocaleString()} / mo`;
    if (rl) rl.textContent = locLabel;
  });
}

function selectModel(id) {
  const savedCenter   = aduState?.center;
  const savedRotation = aduState?.rotation ?? 0;
  document.getElementById('modelSelect').value = id;
  // Sync desktop carousel cards (hidden on mobile but keep in sync)
  document.querySelectorAll('.carousel-card').forEach(c =>
    c.classList.toggle('active', c.dataset.id === id)
  );
  // Scroll mobile slider to the matching slide
  const slide = document.querySelector(`.slider-slide[data-id="${id}"]`);
  if (slide) slide.parentElement.scrollTo({ left: slide.offsetLeft - 18, behavior: 'smooth' });
  updateUnitCard();
  if (savedCenter) placeADU(savedCenter, savedRotation);
}

function buildModelSelect() {
  const sel    = document.getElementById('modelSelect');
  const slider = document.getElementById('unitSlider');

  ADU_MODELS.forEach((m, i) => {
    // Desktop dropdown option
    const opt       = document.createElement('option');
    opt.value       = m.id;
    opt.textContent = `${m.name}  (${m.width} × ${m.depth} ft)`;
    sel.appendChild(opt);

    // Mobile full-info slide
    const slide = document.createElement('div');
    slide.className  = 'slider-slide' + (i === 0 ? ' active' : '');
    slide.dataset.id = m.id;
    const total      = m.width * m.depth;
    const areaText   = m.living ? `${m.living} sq ft living · ${total} sq ft total` : `${total} sq ft footprint`;
    slide.innerHTML  =
      `<div class="slider-body">` +
        `<div class="slider-name">${m.name}</div>` +
        `<div class="slider-area">${areaText}</div>` +
        `<div class="slider-badges">` +
          `<span class="badge">W: ${m.width} ft</span>` +
          `<span class="badge">D: ${m.depth} ft</span>` +
        `</div>` +
        (m.living
          ? `<div class="slider-rental">` +
              `<span class="rental-label">est. rental income</span>` +
              `<span class="slider-rental-val">–</span>` +
              `<span class="slider-rental-loc">California avg</span>` +
            `</div>`
          : '') +
      `</div>`;
    slider.appendChild(slide);
  });

  // Detect swipe → change model via debounced scroll (reliable on iOS Safari)
  let snapTimer;
  slider.addEventListener('scroll', () => {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => {
      const firstSlide = slider.querySelector('.slider-slide');
      if (!firstSlide) return;
      const slideW = firstSlide.offsetWidth;
      const gap    = 10;
      const idx    = Math.min(
        Math.round(slider.scrollLeft / (slideW + gap)),
        ADU_MODELS.length - 1
      );
      const id = ADU_MODELS[idx]?.id;
      if (!id) return;
      slider.querySelectorAll('.slider-slide').forEach(s =>
        s.classList.toggle('active', s.dataset.id === id)
      );
      if (id !== sel.value) {
        const savedCenter   = aduState?.center;
        const savedRotation = aduState?.rotation ?? 0;
        sel.value = id;
        updateUnitCard();
        if (savedCenter) placeADU(savedCenter, savedRotation);
      }
    }, 80);
  }, { passive: true });

  sel.addEventListener('change', () => selectModel(sel.value));
  updateUnitCard();
}

// ── Map init ──────────────────────────────────────────────────────────────────
(function init() {
  map = L.map('map', {
    center: [38.1, -122.5],
    zoom:   11,
    zoomControl: false,
  });

  // Custom pane for floor plan image — sits below the vector overlay pane (z 400)
  map.createPane('floorplanPane');
  map.getPane('floorplanPane').style.zIndex       = 399;
  map.getPane('floorplanPane').style.pointerEvents = 'none';

  // Satellite imagery (Esri — free, no key)
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 23, maxNativeZoom: 19,
      attribution: 'Imagery &copy; <a href="https://www.esri.com">Esri</a>',
    }
  ).addTo(map);

  // Labels on top of satellite
  L.tileLayer(
    'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    { maxZoom: 23, maxNativeZoom: 19 }
  ).addTo(map);

  // Auto-detect location → fly there and populate address if user is in California
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const inCA = lat >= 32.5 && lat <= 42.0 && lng >= -124.5 && lng <= -114.1;
      if (!inCA) return;
      map.setView([lat, lng], 16);
      try {
        const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        const addr = data?.display_name || '';
        if (addr) document.getElementById('addressSearch').value = addr;
      } catch { /* silent */ }
    });
  }

  map.on('click', (e) => {
    placeADU(e.latlng);
    fetchParcel(e.latlng.lat, e.latlng.lng);
  });

  buildModelSelect();
  initSearch();
  document.getElementById('btnClear').addEventListener('click', removeADU);

  // Re-measure after layout settles (important on iOS where fixed elements
  // may resize after the initial paint behind the Dynamic Island)
  requestAnimationFrame(() => requestAnimationFrame(() => {
    map.invalidateSize();
    syncSheetHeight();
  }));

  function syncSheetHeight() {
    if (window.innerWidth > 768) return;
    const h = document.querySelector('.sidebar')?.offsetHeight ?? 300;
    document.documentElement.style.setProperty('--sheet-h', h + 'px');
  }
  window.addEventListener('resize', syncSheetHeight);
})();
