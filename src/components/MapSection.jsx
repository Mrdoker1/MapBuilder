import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as Flags from 'country-flag-icons/react/1x1';
import './MapSection.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoibXJkb2tlcjEiLCJhIjoiY2szNGlvZHcxMDFweTNjcG4xeXRicng5ZSJ9.PAdeoloR2kVbvXM7LFO-zg';

const BRAND_COLOR = '#04882C';

// Countries to highlight
const COUNTRIES = [
  { iso: 'RU', name: 'Россия',            label: 'Россия',       blob: 'xl', center: [97,   60  ] },
  { iso: 'CN', name: 'Китай',             label: 'Производство',  blob: 'xl', center: [104,  35  ] },
  { iso: 'TR', name: 'Турция',            label: null,            blob: 'md', center: [35,   39  ] },
  { iso: 'IN', name: 'Индия',             label: null,            blob: 'md', center: [78,   22  ] },
  { iso: 'BD', name: 'Бангладеш',         label: null,            blob: 'sm', center: [90,   24  ] },
  { iso: 'EG', name: 'Египет',            label: null,            blob: 'md', center: [30,   27  ] },
  { iso: 'DZ', name: 'Алжир',             label: null,            blob: 'md', center: [3,    28  ] },
  { iso: 'MY', name: 'Малайзия',          label: null,            blob: 'sm', center: [109,  3.5 ] },
  { iso: 'SG', name: 'Сингапур',          label: null,            blob: 'sm', center: [103.8,1.4 ] },
  { iso: 'AE', name: 'ОАЭ',              label: null,            blob: 'sm', center: [54,   24  ] },
  { iso: 'SA', name: 'Саудовская Аравия', label: null,            blob: 'md', center: [45,   24  ] },
  { iso: 'IQ', name: 'Ирак',              label: null,            blob: 'sm', center: [44,   33  ] },
  { iso: 'LT', name: 'Литва',             label: null,            blob: 'sm', center: [23.9, 55.3] },
  { iso: 'LB', name: 'Ливан',             label: null,            blob: 'sm', center: [35.9, 33.9] },
  { iso: 'SY', name: 'Сирия',             label: null,            blob: 'sm', center: [38.3, 35  ] },
  { iso: 'KZ', name: 'Казахстан',         label: null,            blob: 'md', center: [66,   48  ] },
  { iso: 'DE', name: 'Германия',          label: 'Инженерия',    blob: 'xl', center: [10,   51  ] },
];

function BlobMarker({ size }) {
  return (
    <div className={`blob blob-${size}`}>
      <div className="blob-core" />
      <div className="blob-ring" />
      <div className="blob-ring blob-ring-2" />
    </div>
  );
}

function FlagMarker({ country, settings }) {
  const FlagSvg = Flags[country.iso];
  const rounded = settings?.roundedFlags ?? true;
  const circleClass = `flag-circle${country.label ? '' : ' flag-circle--sm'}${rounded ? '' : ' flag-circle--square'}`;
  return (
    <div className="flag-marker">
      <div className={`flag-box${country.label ? '' : ' flag-box--icon'}${rounded ? '' : ' flag-box--square'}`}>
        <div className={circleClass}>
          {FlagSvg
            ? <FlagSvg className="flag-svg" />
            : <span style={{ fontSize: 13 }}>{country.iso}</span>
          }
        </div>
        {country.label && <span className="flag-label">{country.label}</span>}
      </div>
      <div className="flag-pole" />
      <div className="flag-dot" />
    </div>
  );
}

export default function MapSection({ settings }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const flagRoots = useRef([]);   // { root, country }
  const blobRoots = useRef([]);   // { root, country }

  // Re-render markers whenever settings change
  useEffect(() => {
    flagRoots.current.forEach(({ root, country }) => {
      root.render(<FlagMarker country={country} settings={settings} />);
    });
  }, [settings]);

  // Toggle blob visibility
  useEffect(() => {
    blobRoots.current.forEach(({ wrapper }) => {
      wrapper.style.display = (settings?.showBlobs ?? true) ? '' : 'none';
    });
  }, [settings?.showBlobs]);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [60, 40],
      zoom: 2.2,
      minZoom: 1.5,
      maxZoom: 7,
      projection: 'mercator',
    });

    map.current.on('load', () => {
      const m = map.current;

      // ── Country boundary source (Mapbox tileset) ──
      m.addSource('country-boundaries', {
        type: 'vector',
        url: 'mapbox://mapbox.country-boundaries-v1',
      });

      const allIsos = COUNTRIES.map((c) => c.iso);

      // Fill
      m.addLayer({
        id: 'brand-countries-fill',
        type: 'fill',
        source: 'country-boundaries',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1', ...allIsos],
        paint: {
          'fill-color': BRAND_COLOR,
          'fill-opacity': 0.45,
        },
      });

      // Stroke
      m.addLayer({
        id: 'brand-countries-line',
        type: 'line',
        source: 'country-boundaries',
        'source-layer': 'country_boundaries',
        filter: ['in', 'iso_3166_1', ...allIsos],
        paint: {
          'line-color': BRAND_COLOR,
          'line-width': 2,
          'line-opacity': 1,
        },
      });

      // ── Flag markers + blob markers ──
      for (const country of COUNTRIES) {
        // Blob — only for labeled countries
        if (country.label) {
          const wrapper = document.createElement('div');
          const root = createRoot(wrapper);
          root.render(<BlobMarker size={country.blob} />);
          blobRoots.current.push({ root, wrapper, country });
          new mapboxgl.Marker({ element: wrapper, anchor: 'center' })
            .setLngLat(country.center)
            .addTo(m);
        }

        // Flag on pole
        const wrapper = document.createElement('div');
        const root = createRoot(wrapper);
        root.render(<FlagMarker country={country} settings={settings} />);
        flagRoots.current.push({ root, wrapper, country });
        new mapboxgl.Marker({ element: wrapper, anchor: 'bottom' })
          .setLngLat(country.center)
          .addTo(m);
      }
    });

    return () => {
      map.current?.remove();
      map.current = null;
      flagRoots.current = [];
      blobRoots.current = [];
    };
  }, []);

  return (
    <section className="map-section">
      <div ref={mapContainer} className="map-container" />
    </section>
  );
}
