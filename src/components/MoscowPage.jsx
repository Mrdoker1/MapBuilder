import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapSection.css';
import './MoscowPage.css';

mapboxgl.accessToken =
  'pk.eyJ1IjoibXJkb2tlcjEiLCJhIjoiY2szNGlvZHcxMDFweTNjcG4xeXRicng5ZSJ9.PAdeoloR2kVbvXM7LFO-zg';

// г. Москва, Каширский проезд, дом 21, стр. 2
const OFFICE_LNG_LAT = [37.6473, 55.6503];

const POLE_H = 70;
const FLAG_W = 76;
const FLAG_H = 52;

function buildOfficeFlagEl(poleColor, poleWidth, labelOpacity) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'width:1px;height:1px;overflow:visible;position:relative;display:block;';

  const inner = document.createElement('div');
  inner.style.cssText = `width:14px;height:${POLE_H}px;position:absolute;left:-7px;bottom:0;overflow:visible;`;

  // Pole — reuses .flagpole-stem from MapSection.css
  const stem = document.createElement('div');
  stem.className = 'flagpole-stem';
  stem.style.height = `${POLE_H}px`;
  if (poleColor) stem.style.background = poleColor;
  if (poleWidth) stem.style.width = `${poleWidth}px`;

  // BTAP flag image
  const fabric = document.createElement('img');
  fabric.src = '/MapBuilder/btap-flag.png';
  fabric.draggable = false;
  fabric.style.cssText = [
    'position:absolute',
    'left:2px',
    'top:-5px',
    `width:${FLAG_W}px`,
    `height:${FLAG_H}px`,
    'object-fit:contain',
    'z-index:1',
    'display:block',
  ].join(';');

  // Label panel — reuses .label-panel / .label-panel__text from MapSection.css
  // Center label on flag: flag center Y = -5 + FLAG_H/2 ≈ 21 → top = 21 - ~14 = 10
  const labelWrap = document.createElement('div');
  labelWrap.className = 'label-panel';
  labelWrap.style.cssText = 'position:absolute;right:11px;top:-1px;';
  labelWrap.style.background = `rgba(255,255,255,${labelOpacity ?? 0.8})`;

  const span = document.createElement('span');
  span.className = 'label-panel__text';
  span.textContent = 'Главный офис';
  labelWrap.appendChild(span);

  inner.append(stem, fabric, labelWrap);
  wrapper.appendChild(inner);
  return wrapper;
}

export default function MoscowPage({ settings }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  // Live-update pole color
  useEffect(() => {
    if (!mapContainer.current) return;
    const color = settings?.poleColor || '#4a4a4a';
    mapContainer.current.querySelectorAll('.flagpole-stem').forEach((el) => {
      el.style.background = color;
    });
  }, [settings?.poleColor]);

  // Live-update pole width
  useEffect(() => {
    if (!mapContainer.current) return;
    const width = settings?.poleWidth ?? 3;
    mapContainer.current.querySelectorAll('.flagpole-stem').forEach((el) => {
      el.style.width = `${width}px`;
    });
  }, [settings?.poleWidth]);

  // Live-update label panel opacity
  useEffect(() => {
    if (!mapContainer.current) return;
    const opacity = settings?.labelOpacity ?? 0.8;
    mapContainer.current.querySelectorAll('.label-panel').forEach((el) => {
      el.style.background = `rgba(255,255,255,${opacity})`;
    });
  }, [settings?.labelOpacity]);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: OFFICE_LNG_LAT,
      zoom: 14.5,
      minZoom: 10,
      maxZoom: 18,
      projection: 'mercator',
    });

    map.current.on('load', () => {
      const flagEl = buildOfficeFlagEl(
        settings?.poleColor,
        settings?.poleWidth,
        settings?.labelOpacity,
      );
      new mapboxgl.Marker({ element: flagEl, anchor: 'center' })
        .setLngLat(OFFICE_LNG_LAT)
        .addTo(map.current);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <section className="moscow-page">
      <div ref={mapContainer} className="moscow-map-container" />
      <div className="map-lock-overlay" style={{ pointerEvents: settings?.zoomLocked ? 'all' : 'none' }} />
    </section>
  );
}
