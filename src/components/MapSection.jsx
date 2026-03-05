import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapSection.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoibXJkb2tlcjEiLCJhIjoiY2szNGlvZHcxMDFweTNjcG4xeXRicng5ZSJ9.PAdeoloR2kVbvXM7LFO-zg';

const BRAND_COLOR = '#04882C';

// Countries to highlight
const COUNTRIES = [
  { iso: 'RU', name: 'Россия',            label: 'GETTZAP - BTAP', blob: 'xl', center: [37.6,  55.75], labelCenter: [42,   53.5] },
  { iso: 'CN', name: 'Китай',             label: 'Производство',  blob: 'xl', center: [116.4, 39.9 ], labelCenter: [121,  37.5] },
  { iso: 'TR', name: 'Турция',            label: null,            blob: 'md', center: [32.9,  39.9 ] },
  { iso: 'IN', name: 'Индия',             label: null,            blob: 'md', center: [77.2,  28.6 ] },
  { iso: 'BD', name: 'Бангладеш',         label: null,            blob: 'sm', center: [90.4,  23.7 ] },
  { iso: 'EG', name: 'Египет',            label: null,            blob: 'md', center: [31.2,  30.1 ] },
  { iso: 'DZ', name: 'Алжир',             label: null,            blob: 'md', center: [3.1,   36.7 ] },
  { iso: 'MY', name: 'Малайзия',          label: null,            blob: 'sm', center: [101.7, 3.1  ] },
  { iso: 'SG', name: 'Сингапур',          label: null,            blob: 'sm', center: [103.8, 1.4  ] },
  { iso: 'AE', name: 'ОАЭ',              label: null,            blob: 'sm', center: [54.4,  24.5 ] },
  { iso: 'SA', name: 'Саудовская Аравия', label: null,            blob: 'md', center: [46.7,  24.7 ] },
  { iso: 'IQ', name: 'Ирак',              label: null,            blob: 'sm', center: [44.4,  33.3 ] },
  { iso: 'LT', name: 'Литва',             label: null,            blob: 'sm', center: [25.3,  54.7 ] },
  { iso: 'LB', name: 'Ливан',             label: null,            blob: 'sm', center: [35.5,  33.9 ] },
  { iso: 'SY', name: 'Сирия',             label: null,            blob: 'sm', center: [36.3,  33.5 ] },
  { iso: 'KZ', name: 'Казахстан',         label: null,            blob: 'md', center: [71.4,  51.2 ] },
  { iso: 'DE', name: 'Германия',          label: 'Инженерия',    blob: 'xl', center: [13.4,  52.5 ], labelCenter: [17,   50.5] },
];

const POSITIONS_KEY = 'mapFlagPositions';
const VIEW_KEY = 'mapView';
const ATTACHED_KEY = 'mapLabelAttached';

const DEFAULT_POSITIONS = {
  "TR": [29.877717026497777, 39.74091222270255],
  "DZ": [1.5560392319007406, 30.54550715172337],
  "EG": [26.28487498388168, 26.80626039044894],
  "BD": [89.84822550324378, 24.870891286245694],
  "IN": [76.83355980584719, 25.49304885313157],
  "LT": [23.056789390102722, 56.78850444020182],
  "CN": [95.88499005318204, 38.332159455351245],
  "__info_panel__": [96.4968993145672, 63.102343808678114],
  "DE": [10.782798667234772, 53.781794140162475],
  "SA": [46.31554609717719, 26.494911681770702],
  "AE": [55.02415957928318, 24.723367602141494],
  "LB": [35.52695561186877, 35.0950166628394],
  "SG": [103.80189749887853, 1.46806856445464],
  "MY": [113.8637874251387, 3.467210969056765],
  "IQ": [45.45029696744399, 32.47116036226599],
  "KZ": [66.67362604514278, 51.29290820007543],
  "SY": [40.93968726036408, 37.51792531389995],
  "RU": [46.65568624267809, 59.205275872018234],
  "__label_RU__": [44.51673426027557, 62.70053039869356],
  "__label_DE__": [1.5893744616615777, 56.3287243069486],
  "__label_CN__": [83.06980350946509, 42.68201735212193],
};

const DEFAULT_VIEW = {
  zoom: 2.2454470953337644,
  center: [45.46943795808863, 33.779301882413066],
};

const DEFAULT_ATTACHED = {
  "RU": "RU",
  "CN": "CN",
  "DE": "DE",
};

function loadPositions() {
  try {
    const saved = JSON.parse(localStorage.getItem(POSITIONS_KEY) || 'null');
    return saved ?? DEFAULT_POSITIONS;
  } catch { return DEFAULT_POSITIONS; }
}

function savePosition(iso, lngLat) {
  const all = loadPositions();
  all[iso] = [lngLat.lng, lngLat.lat];
  localStorage.setItem(POSITIONS_KEY, JSON.stringify(all));
}

function loadView() {
  try {
    return JSON.parse(localStorage.getItem(VIEW_KEY) || 'null') ?? DEFAULT_VIEW;
  } catch { return DEFAULT_VIEW; }
}

function saveView(map) {
  const view = { zoom: map.getZoom(), center: map.getCenter().toArray() };
  localStorage.setItem(VIEW_KEY, JSON.stringify(view));
}

function loadAttached() {
  try {
    return JSON.parse(localStorage.getItem(ATTACHED_KEY) || 'null') ?? DEFAULT_ATTACHED;
  } catch { return DEFAULT_ATTACHED; }
}

function saveAttached(state) {
  localStorage.setItem(ATTACHED_KEY, JSON.stringify(state));
}

function appleEmojiUrl(iso) {
  const hex = [...iso.toUpperCase()]
    .map(c => (0x1F1E6 + c.charCodeAt(0) - 65).toString(16))
    .join('-');
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/${hex}.png`;
}

/**
 * Build flagpole marker element.
 * The Mapbox anchor element is 1×1px with overflow:visible and anchor:'center',
 * exactly like the working text panels. The geo-coordinate = pole base point.
 * The visual flag is rendered via position:absolute going upward from that point.
 */
function buildFlagEl(country) {
  const large = !!country.label;
  const poleH = large ? 54 : 40;
  const flagW = large ? 44 : 32;
  const flagH = large ? 44 : 32;

  // 1×1 anchor — anchor:'center' maps geo-coord to this pixel exactly
  const wrapper = document.createElement('div');
  wrapper.className = 'flag-marker-wrapper';
  wrapper.dataset.name = country.name;
  wrapper.style.cssText = 'width:1px;height:1px;overflow:visible;position:relative;display:block;';

  // Visual container positioned so its bottom-centre aligns with the 1×1 anchor
  const inner = document.createElement('div');
  inner.className = 'flag-marker';
  inner.style.cssText = `width:14px;height:${poleH}px;position:absolute;left:-7px;bottom:0;overflow:visible;`;

  const ball = document.createElement('div');
  ball.className = 'flagpole-ball';

  const stem = document.createElement('div');
  stem.className = 'flagpole-stem';
  stem.style.height = `${poleH}px`;

  const img = document.createElement('img');
  img.className = 'flagpole-flag';
  img.src = appleEmojiUrl(country.iso);
  img.width = flagW;
  img.height = flagH;
  img.draggable = false;

  inner.append(ball, stem, img);
  wrapper.appendChild(inner);
  return { wrapper };
}

function LabelPanel({ text }) {
  return (
    <div className="label-panel">
      <span className="label-panel__text">{text}</span>
    </div>
  );
}

// Synchronous DOM build — Mapbox measures correct size immediately on marker creation
function buildLabelEl(text) {
  const lw = document.createElement('div');
  const panel = document.createElement('div');
  panel.className = 'label-panel';
  const span = document.createElement('span');
  span.className = 'label-panel__text';
  span.textContent = text;
  panel.appendChild(span);
  lw.appendChild(panel);
  return lw;
}

function InfoPanel({ title, subtitle }) {
  return (
    <div className="info-panel">
      <div className="info-panel__title">{title}</div>
      <div className="info-panel__subtitle">{subtitle}</div>
    </div>
  );
}

export default function MapSection({ settings }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);

  // Apply zoom + drag lock
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const locked = settings?.zoomLocked;
    // re-enable native interactions always (overlay handles blocking)
    m.scrollZoom.enable();
    m.doubleClickZoom.enable();
    m.touchZoomRotate.enable();
    m.dragPan.enable();
    m.keyboard.enable();
    markersRef.current.forEach(marker => marker.setDraggable(!locked));
  }, [settings?.zoomLocked]);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: loadView()?.center ?? [60, 40],
      zoom:   loadView()?.zoom   ?? 2.2,
      minZoom: 1.5,
      maxZoom: 7,
      projection: 'mercator',
    });

    // Single SVG overlay for the snap line (shared across all label drags)
    const svgNS = 'http://www.w3.org/2000/svg';
    const svgOverlay = document.createElementNS(svgNS, 'svg');
    svgOverlay.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;overflow:visible;';
    mapContainer.current.appendChild(svgOverlay);
    const snapLine = document.createElementNS(svgNS, 'line');
    snapLine.setAttribute('stroke', '#04882C');
    snapLine.setAttribute('stroke-width', '2');
    snapLine.setAttribute('stroke-dasharray', '8 5');
    snapLine.setAttribute('stroke-linecap', 'round');
    snapLine.setAttribute('opacity', '0.85');
    snapLine.style.display = 'none';
    svgOverlay.appendChild(snapLine);

    // Never disable native interactions — overlay handles blocking

    map.current.on('moveend', () => saveView(map.current));

    map.current.on('load', async () => {
      const m = map.current;

      const allIsos = new Set(COUNTRIES.map((c) => c.iso));

      // ── GeoJSON source from geo-countries (one polygon per country) ──
      const geoRes = await fetch(
        'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
      );
      const geoData = await geoRes.json();
      const filtered = {
        type: 'FeatureCollection',
        features: geoData.features.filter((f) => allIsos.has(f.properties['ISO_A2'])),
      };

      m.addSource('country-boundaries', {
        type: 'geojson',
        data: filtered,
      });

      // Fill only — borders are drawn by the base map tiles, no jagged GeoJSON outline
      m.addLayer({
        id: 'brand-countries-fill',
        type: 'fill',
        source: 'country-boundaries',
        paint: {
          'fill-color': BRAND_COLOR,
          'fill-opacity': 0.35,
          'fill-antialias': true,
        },
      });

      // Stroke
      m.addLayer({
        id: 'brand-countries-line',
        type: 'line',
        source: 'country-boundaries',
        paint: {
          'line-color': BRAND_COLOR,
          'line-width': 1.5,
          'line-opacity': 0.9,
        },
      });

      // ── Info panel over Russia ──
      {
        const PANEL_KEY = '__info_panel__';
        const savedPos = loadPositions();
        const panelCenter = savedPos[PANEL_KEY] || [60, 57];
        const wrapper = document.createElement('div');
        const root = createRoot(wrapper);
        root.render(
          <InfoPanel
            title="Gettzap LLC - Россия"
            subtitle="Эксклюзивный дистрибьютер на территории Российской Федерации"
          />
        );
        const panelMarker = new mapboxgl.Marker({ element: wrapper, anchor: 'center', draggable: !settings?.zoomLocked })
          .setLngLat(panelCenter)
          .addTo(m);
        markersRef.current.push(panelMarker);
        panelMarker.on('dragend', () => savePosition(PANEL_KEY, panelMarker.getLngLat()));
      }

      // ── Flag markers ──
      const savedPos = loadPositions();

      const SNAP_THRESHOLD_PX = 120;
      const ATTACH_GAP_PX = 8;

      // flagMarkersMap: iso → marker
      const flagMarkersMap = {};
      // labelMarkersMap: labelIso → { marker, el }
      const labelMarkersMap = {};
      // attachedTo: labelIso → flagIso | null
      const attachedTo = {};

      function getFlagPoleH(flagIso) {
        return COUNTRIES.find(c => c.iso === flagIso)?.label ? 54 : 40;
      }

      // Compute where label center should be relative to a flag (in geo coords)
      function syncAttachedLabel(labelIso) {
        const flagIso = attachedTo[labelIso];
        if (!flagIso || !flagMarkersMap[flagIso] || !labelMarkersMap[labelIso]) return;
        const { marker: lm, el } = labelMarkersMap[labelIso];
        const fp = m.project(flagMarkersMap[flagIso].getLngLat());
        const poleH = getFlagPoleH(flagIso);
        const labelW = el.offsetWidth;
        lm.setLngLat(m.unproject({
          x: fp.x - labelW / 2 - ATTACH_GAP_PX,
          y: fp.y - poleH / 2,
        }));
      }

      function attachLabelToFlag(labelIso, flagIso) {
        attachedTo[labelIso] = flagIso;
        syncAttachedLabel(labelIso);
        saveAttached(attachedTo);
      }

      // Keep attached labels in place every frame (handles flag drag + map pan)
      m.on('render', () => {
        for (const labelIso of Object.keys(attachedTo)) {
          if (attachedTo[labelIso]) syncAttachedLabel(labelIso);
        }
      });

      for (const country of COUNTRIES) {
        const center = savedPos[country.iso] || country.center;

        // Flag on pole — draggable
        const { wrapper } = buildFlagEl(country);
        const flagMarker = new mapboxgl.Marker({
          element: wrapper,
          anchor: 'center',
          draggable: !settings?.zoomLocked,
        })
          .setLngLat(center)
          .addTo(m);
        markersRef.current.push(flagMarker);
        flagMarkersMap[country.iso] = flagMarker;

        flagMarker.on('dragstart', () => {
          wrapper.classList.add('is-dragging');
        });
        flagMarker.on('drag', () => {
          // Sync any label attached to this flag in real-time
          for (const [labelIso, flagIso] of Object.entries(attachedTo)) {
            if (flagIso === country.iso) syncAttachedLabel(labelIso);
          }
        });
        flagMarker.on('dragend', () => {
          wrapper.classList.remove('is-dragging');
          savePosition(country.iso, flagMarker.getLngLat());
          // Final sync after drag ends
          for (const [labelIso, flagIso] of Object.entries(attachedTo)) {
            if (flagIso === country.iso) syncAttachedLabel(labelIso);
          }
        });

        // Label panel
        if (country.label) {
          const labelKey = `__label_${country.iso}__`;
          const labelPos = savedPos[labelKey] || country.labelCenter || country.center;
          const lw = buildLabelEl(country.label);
          const labelMarker = new mapboxgl.Marker({
            element: lw,
            anchor: 'center',
            draggable: !settings?.zoomLocked,
          })
            .setLngLat(labelPos)
            .addTo(m);
          markersRef.current.push(labelMarker);
          labelMarkersMap[country.iso] = { marker: labelMarker, el: lw };
          attachedTo[country.iso] = null; // free by default

          labelMarker.on('drag', () => {
            // Find nearest flag within 2×threshold and draw line to it
            const lp = m.project(labelMarker.getLngLat());
            let nearest = null, nearestDist = Infinity;
            for (const [fiso, fm] of Object.entries(flagMarkersMap)) {
              const fp = m.project(fm.getLngLat());
              const d = Math.hypot(lp.x - fp.x, lp.y - fp.y);
              if (d < SNAP_THRESHOLD_PX * 2 && d < nearestDist) {
                nearestDist = d; nearest = { iso: fiso, fp };
              }
            }
            if (nearest) {
              snapLine.style.display = '';
              snapLine.setAttribute('x1', String(lp.x));
              snapLine.setAttribute('y1', String(lp.y));
              snapLine.setAttribute('x2', String(nearest.fp.x));
              snapLine.setAttribute('y2', String(nearest.fp.y));
            } else {
              snapLine.style.display = 'none';
            }
          });

          labelMarker.on('dragstart', () => {
            attachedTo[country.iso] = null; // free the label
            saveAttached(attachedTo);
            snapLine.style.display = 'none';
          });

          labelMarker.on('dragend', () => {
            snapLine.style.display = 'none';
            // Find nearest flag within threshold
            const lp = m.project(labelMarker.getLngLat());
            let nearest = null, nearestDist = Infinity;
            for (const [fiso, fm] of Object.entries(flagMarkersMap)) {
              const fp = m.project(fm.getLngLat());
              const d = Math.hypot(lp.x - fp.x, lp.y - fp.y);
              if (d < SNAP_THRESHOLD_PX && d < nearestDist) {
                nearestDist = d; nearest = fiso;
              }
            }
            if (nearest) {
              attachLabelToFlag(country.iso, nearest);
            } else {
              saveAttached(attachedTo);
            }
            savePosition(labelKey, labelMarker.getLngLat());
          });
        }
      }

      // Restore saved attachment state after all markers are ready
      const savedAttached = loadAttached();
      for (const [labelIso, flagIso] of Object.entries(savedAttached)) {
        if (flagIso && flagMarkersMap[flagIso] && labelMarkersMap[labelIso]) {
          attachLabelToFlag(labelIso, flagIso);
        }
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      markersRef.current = [];
    };;
  }, []);

  return (
    <section className="map-section">
      <div ref={mapContainer} className="map-container" />
      {/* Transparent overlay — blocks all pointer events in presentation mode */}
      <div className="map-lock-overlay" style={{ pointerEvents: settings?.zoomLocked ? 'all' : 'none' }} />
    </section>
  );
}
