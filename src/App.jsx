import { useState, useEffect, useRef } from 'react';
import { MantineProvider, Modal, Switch, Stack, Text, Divider, Badge, Select, Button } from '@mantine/core';
import '@mantine/core/styles.css';
import MapSection from './components/MapSection';
import MoscowPage from './components/MoscowPage';

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito',
  'Oswald',
  'Source Sans 3',
  'PT Sans',
  'Ubuntu',
  'Playfair Display',
  'Merriweather',
  'Mulish',
];

const FONT_OPTIONS = [
  { value: 'Neo Sans Pro', label: 'Neo Sans Pro (custom)' },
  ...GOOGLE_FONTS.map((f) => ({ value: f, label: f })),
];

const DEFAULT_SETTINGS = {
  roundedFlags: false,
  font: 'Neo Sans Pro',
  zoomLocked: false,
  showBlobs: false,
  poleColor: '#4a4a4a',
  poleWidth: 3,
  labelOpacity: 0.8,
  showCountryList: true,
  countryFillColor: '#008528',
  countryFillOpacity: 0.25,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('mapSettings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function loadGoogleFont(family) {
  const id = `gfont-${family.replace(/\s+/g, '-')}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export default function App() {
  const [settings, setSettings] = useState(loadSettings);
  const [opened, setOpened] = useState(false);
  const [hash, setHash] = useState(window.location.hash);
  const importInputRef = useRef(null);

  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  function exportConfig() {
    const data = {
      settings,
      positions: JSON.parse(localStorage.getItem('mapFlagPositions') || '{}'),
      view: JSON.parse(localStorage.getItem('mapView') || 'null'),
      attached: JSON.parse(localStorage.getItem('mapLabelAttached') || '{}'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importConfig(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.settings)  {
          const merged = { ...DEFAULT_SETTINGS, ...data.settings };
          localStorage.setItem('mapSettings', JSON.stringify(merged));
        }
        if (data.positions) localStorage.setItem('mapFlagPositions', JSON.stringify(data.positions));
        if (data.view)      localStorage.setItem('mapView',          JSON.stringify(data.view));
        if (data.attached)  localStorage.setItem('mapLabelAttached', JSON.stringify(data.attached));
        window.location.reload();
      } catch { alert('Неверный формат файла'); }
    };
    reader.readAsText(file);
  }

  // Persist settings to localStorage on every change
  useEffect(() => {
    localStorage.setItem('mapSettings', JSON.stringify(settings));
  }, [settings]);

  // Apply font CSS variable whenever font changes
  useEffect(() => {
    const family = settings.font;
    if (family !== 'Neo Sans Pro') loadGoogleFont(family);
    document.documentElement.style.setProperty('--app-font', `'${family}', system-ui, sans-serif`);
  }, [settings.font]);

  // Open/close settings on ESC
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') setOpened((o) => !o);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const toggle = (key) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const isMoscow = hash === '#/moscow';

  return (
    <MantineProvider>
      {isMoscow ? <MoscowPage settings={settings} /> : <MapSection settings={settings} />}

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        closeOnEscape={false}
        title={<Text fw={700} size="lg" c="white">Настройки карты</Text>}
        centered
        size="md"
        overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
        styles={{
          root: { zIndex: 9999 },
          content: { background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)' },
          header: { background: '#0f1117', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 8 },
          body: { paddingTop: 10, paddingBottom: 12 },
          close: { color: '#aaa' },
        }}
      >
        <Stack gap="xs">
          {/* Шрифт */}
          <Select
            label="Шрифт"
            data={FONT_OPTIONS}
            value={settings.font}
            onChange={(val) => setSettings((p) => ({ ...p, font: val }))}
            searchable
            size="xs"
            maxDropdownHeight={220}
            styles={{
              label: { color: '#aaa', fontSize: 11, marginBottom: 3 },
              input: { background: '#1a1d27', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 13 },
              dropdown: { background: '#1a1d27', border: '1px solid rgba(255,255,255,0.12)' },
              option: { color: '#e0e0e0', '&[data-selected]': { background: '#04882C' }, '&[data-hovered]': { background: 'rgba(255,255,255,0.07)' } },
            }}
          />

          <Divider color="rgba(255,255,255,0.08)" />

          {/* Флаги стран */}
          <Text size="xs" c="rgba(255,255,255,0.4)" tt="uppercase" fw={600} lts={1}>Флаги стран</Text>

          <Switch
            label="Панель со списком стран"
            checked={settings.showCountryList ?? true}
            onChange={() => toggle('showCountryList')}
            color="green"
            size="sm"
            styles={{ label: { color: '#e0e0e0', fontSize: 13 } }}
          />

          {/* Цвет + толщина флагштока в одну строку */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Text size="xs" c="#aaa">Флагшток</Text>
              <input
                type="color"
                value={settings.poleColor ?? '#444444'}
                onChange={(e) => setSettings((p) => ({ ...p, poleColor: e.target.value }))}
                style={{ width: 30, height: 26, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <Text size="xs" c="#aaa" style={{ whiteSpace: 'nowrap' }}>Толщина</Text>
              <input
                type="range" min={1} max={6} step={0.5}
                value={settings.poleWidth ?? 2}
                onChange={(e) => setSettings((p) => ({ ...p, poleWidth: parseFloat(e.target.value) }))}
                style={{ flex: 1, accentColor: '#04882C' }}
              />
              <Text size="xs" c="#aaa" style={{ minWidth: 28 }}>{settings.poleWidth ?? 2}px</Text>
            </div>
          </div>

          {/* Прозрачность */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Text size="xs" c="#aaa" style={{ whiteSpace: 'nowrap' }}>Прозрачность плашек</Text>
            <input
              type="range" min={0} max={1} step={0.05}
              value={settings.labelOpacity ?? 0.6}
              onChange={(e) => setSettings((p) => ({ ...p, labelOpacity: parseFloat(e.target.value) }))}
              style={{ flex: 1, accentColor: '#04882C' }}
            />
            <Text size="xs" c="#aaa" style={{ minWidth: 34 }}>{Math.round((settings.labelOpacity ?? 0.6) * 100)}%</Text>
          </div>

          <Divider color="rgba(255,255,255,0.08)" />

          {/* Страны на карте */}
          <Text size="xs" c="rgba(255,255,255,0.4)" tt="uppercase" fw={600} lts={1}>Страны</Text>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <Text size="xs" c="#aaa">Цвет</Text>
              <input
                type="color"
                value={settings.countryFillColor ?? '#04882C'}
                onChange={(e) => setSettings((p) => ({ ...p, countryFillColor: e.target.value }))}
                style={{ width: 30, height: 26, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
              <Text size="xs" c="#aaa" style={{ whiteSpace: 'nowrap' }}>Прозрачность</Text>
              <input
                type="range" min={0} max={1} step={0.05}
                value={settings.countryFillOpacity ?? 0.35}
                onChange={(e) => setSettings((p) => ({ ...p, countryFillOpacity: parseFloat(e.target.value) }))}
                style={{ flex: 1, accentColor: '#04882C' }}
              />
              <Text size="xs" c="#aaa" style={{ minWidth: 34 }}>{Math.round((settings.countryFillOpacity ?? 0.35) * 100)}%</Text>
            </div>
          </div>

          <Divider color="rgba(255,255,255,0.08)" />

          {/* Навигация */}
          <Switch
            label="Режим презентации"
            description="Блокирует зум, перемещение и перетаскивание"
            checked={settings.zoomLocked}
            onChange={() => toggle('zoomLocked')}
            color="green"
            size="sm"
            styles={{
              label: { color: '#e0e0e0', fontSize: 13 },
              description: { color: 'rgba(255,255,255,0.35)', fontSize: 11 },
            }}
          />

          <Divider color="rgba(255,255,255,0.08)" />

          {/* Конфигурация */}
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="light" color="green" size="xs" style={{ flex: 1 }} onClick={exportConfig}>
              Экспорт JSON
            </Button>
            <Button variant="light" color="blue" size="xs" style={{ flex: 1 }} onClick={() => importInputRef.current?.click()}>
              Импорт JSON
            </Button>
            <Button variant="subtle" color="red" size="xs" style={{ flex: 1 }}
              onClick={() => { localStorage.removeItem('mapFlagPositions'); localStorage.removeItem('mapView'); localStorage.removeItem('mapLabelAttached'); window.location.reload(); }}>
              Сбросить
            </Button>
          </div>

          <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={importConfig} />
        </Stack>
      </Modal>
    </MantineProvider>
  );
}
