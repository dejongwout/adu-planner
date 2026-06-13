// ── State ─────────────────────────────────────────────────────────────────────
let map;
let aduPolygon       = null;
let aduImage         = null;
let clearancePolygon = null;
let parcelLayer      = null;
let rotMarker        = null;
let aduState         = null; // { center: L.LatLng, widthM, heightM, rotation }
let parcelFetchTimer = null;

const CLEARANCE_M = 0.3048 * 4 * 2; // 4 ft each side → added to both width and height

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
    html:
      `<svg class="rot-handle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44">` +
        `<circle cx="22" cy="22" r="20" fill="white"/>` +
        `<path d="M17 13.3 A10 10 0 0 1 32 22" stroke="#1d1d1f" stroke-width="2.5" fill="none" stroke-linecap="round"/>` +
        `<path d="M29 19 L32 22 L35 19" stroke="#1d1d1f" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M27 30.7 A10 10 0 0 1 12 22" stroke="#1d1d1f" stroke-width="2.5" fill="none" stroke-linecap="round"/>` +
        `<path d="M9 25 L12 22 L15 25" stroke="#1d1d1f" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `</svg>`,
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

function placeADU(latlng) {
  removeADU();

  const model   = getModel();
  const widthM  = ft2m(model.width);
  const heightM = ft2m(model.depth);
  const rot     = 0;
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

  // ── Drag polygon to move ──
  aduPolygon.on('mousedown', (e) => {
    L.DomEvent.stopPropagation(e);
    map.dragging.disable();
    let last = e.latlng;

    function onMove(ev) {
      const dlat = ev.latlng.lat - last.lat;
      const dlng = ev.latlng.lng - last.lng;
      last = ev.latlng;
      aduState.center = L.latLng(aduState.center.lat + dlat, aduState.center.lng + dlng);
      const { center: c2, widthM: w2, heightM: h2, rotation: r2 } = aduState;
      aduPolygon.setLatLngs(calcCorners(c2, w2, h2, r2));
      clearancePolygon.setLatLngs(calcCorners(c2, w2 + CLEARANCE_M, h2 + CLEARANCE_M, r2));
      rotMarker.setLatLng(handleLatLng(c2, h2, r2));
      aduImage?.setTransform(c2, r2);
      // Debounce parcel refresh while dragging
      clearTimeout(parcelFetchTimer);
      parcelFetchTimer = setTimeout(() => {
        fetchParcel(aduState.center.lat, aduState.center.lng);
      }, 800);
    }

    function onUp() {
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
      map.dragging.enable();
      // Always fetch the final drop position immediately
      clearTimeout(parcelFetchTimer);
      fetchParcel(aduState.center.lat, aduState.center.lng);
    }

    map.on('mousemove', onMove);
    map.on('mouseup', onUp);
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

// ── Parcel lookup (CA State Parcels — free, no key required) ──────────────────
async function fetchParcel(lat, lng) {
  parcelLayer?.remove();
  parcelLayer = null;

  const BASE = 'https://services2.arcgis.com/zr3KAIbsRSUyARHG/arcgis/rest/services/CA_State_Parcels/FeatureServer/0/query';
  const params = new URLSearchParams({
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

  try {
    const res     = await fetch(`${BASE}?${params}`);
    if (!res.ok) return;
    const data    = await res.json();
    const feature = data?.features?.[0];
    if (!feature) return;

    // Draw parcel boundary
    const geom  = feature.geometry;
    const rings = geom.type === 'MultiPolygon' ? geom.coordinates[0] : geom.coordinates;
    parcelLayer = L.polygon(
      rings.map(ring => ring.map(([lo, la]) => [la, lo])),
      { color: '#FFD60A', weight: 2.5, opacity: 1, fillColor: '#FFD60A', fillOpacity: 0.1, interactive: false }
    ).addTo(map);

    // Populate sidebar
    const p     = feature.properties || {};
    const areaM2 = p.Shape__Area || 0;
    const sqft  = areaM2 > 0 ? `${Math.round(areaM2 * 10.764).toLocaleString()} sq ft` : null;
    const acres = areaM2 > 0 ? `${(areaM2 / 4047).toFixed(3)} ac` : null;
    const addr  = [p.SITE_ADDR, p.SITE_CITY].filter(Boolean).join(', ') || '–';

    document.getElementById('lotAddress').textContent = addr;
    document.getElementById('lotArea').textContent    = [sqft, acres].filter(Boolean).join(' · ') || '–';
    document.getElementById('lotAPN').textContent     = p.PARCEL_APN || '–';
    document.getElementById('lotSection').hidden      = false;
  } catch (err) {
    console.warn('Parcel lookup failed:', err);
  }
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
  document.getElementById('unitW').textContent    = m.width;
  document.getElementById('unitD').textContent    = m.depth;
  document.getElementById('unitArea').textContent = m.living
    ? `${m.living} sq ft living · ${total} sq ft total`
    : `${total.toLocaleString()} sq ft footprint`;
  document.getElementById('badgeW').textContent   = `W: ${m.width} ft`;
  document.getElementById('badgeD').textContent   = `D: ${m.depth} ft`;
}

function buildModelSelect() {
  const sel = document.getElementById('modelSelect');
  ADU_MODELS.forEach(m => {
    const opt       = document.createElement('option');
    opt.value       = m.id;
    opt.textContent = `${m.name}  (${m.width} × ${m.depth} ft)`;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', () => {
    updateUnitCard();
    if (aduState) placeADU(aduState.center);
  });
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

  // Auto-detect location → fly there if user is in California
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const inCA = lat >= 32.5 && lat <= 42.0 && lng >= -124.5 && lng <= -114.1;
      if (inCA) map.setView([lat, lng], 15);
    });
  }

  map.on('click', (e) => {
    placeADU(e.latlng);
    fetchParcel(e.latlng.lat, e.latlng.lng);
  });

  buildModelSelect();
  initSearch();
  document.getElementById('btnClear').addEventListener('click', removeADU);
})();
