import { useState, useEffect, useRef } from 'react';
import { MantineProvider, Modal, Switch, Stack, Text, Divider, Badge, Select, Button } from '@mantine/core';
import '@mantine/core/styles.css';
import MapSection from './components/MapSection';

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
  zoomLocked: true,
  showBlobs: false,
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
  const importInputRef = useRef(null);

  function exportConfig() {
    const data = {
      settings: JSON.parse(localStorage.getItem('mapSettings') || '{}'),
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
        if (data.settings)  localStorage.setItem('mapSettings',      JSON.stringify(data.settings));
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

  return (
    <MantineProvider>
      <MapSection settings={settings} />

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        closeOnEscape={false}
        title={<Text fw={700} size="lg" c="white">Настройки карты</Text>}
        centered
        overlayProps={{ backgroundOpacity: 0.4, blur: 4 }}
        styles={{
          root: { zIndex: 9999 },
          content: { background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)' },
          header: { background: '#0f1117', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 },
          close: { color: '#aaa' },
        }}
      >
        <Stack gap="md" py="xs">
          <Badge color="green" variant="light" size="sm" w="fit-content">
            Шрифт
          </Badge>

          <Select
            label="Шрифт интерфейса"
            description="Google Fonts или кастомный Neo Sans Pro"
            data={FONT_OPTIONS}
            value={settings.font}
            onChange={(val) => setSettings((p) => ({ ...p, font: val }))}
            searchable
            maxDropdownHeight={260}
            styles={{
              label: { color: '#e0e0e0', fontWeight: 600, marginBottom: 4 },
              description: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginBottom: 6 },
              input: { background: '#1a1d27', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' },
              dropdown: { background: '#1a1d27', border: '1px solid rgba(255,255,255,0.12)' },
              option: { color: '#e0e0e0', '&[data-selected]': { background: '#04882C' }, '&[data-hovered]': { background: 'rgba(255,255,255,0.07)' } },
            }}
          />

          <Divider color="rgba(255,255,255,0.08)" />

          <Badge color="green" variant="light" size="sm" w="fit-content">
            Флаги стран
          </Badge>

          <Switch
            label="Круглые флаги"
            description="Отображать флаги в круглом контейнере"
            checked={settings.roundedFlags}
            onChange={() => toggle('roundedFlags')}
            color="green"
            styles={{
              label: { color: '#e0e0e0', fontWeight: 600 },
              description: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
            }}
          />

          <Divider color="rgba(255,255,255,0.08)" />

          <Badge color="green" variant="light" size="sm" w="fit-content">
            Навигация
          </Badge>

          <Switch
            label="Режим презентации"
            description="Блокирует зум, перемещение карты и перетаскивание флагов"
            checked={settings.zoomLocked}
            onChange={() => toggle('zoomLocked')}
            color="green"
            styles={{
              label: { color: '#e0e0e0', fontWeight: 600 },
              description: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },
            }}
          />
        </Stack>

        <Divider mt="lg" mb="sm" color="rgba(255,255,255,0.08)" />

        <Badge color="blue" variant="light" size="sm" w="fit-content" mb="xs">
          Конфигурация
        </Badge>

        <Stack gap="xs">
          <Button
            variant="light"
            color="green"
            size="xs"
            fullWidth
            onClick={exportConfig}
          >
            Экспортировать настройки (JSON)
          </Button>

          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={importConfig}
          />
          <Button
            variant="light"
            color="blue"
            size="xs"
            fullWidth
            onClick={() => importInputRef.current?.click()}
          >
            Импортировать настройки
          </Button>

          <Button
            variant="subtle"
            color="red"
            size="xs"
            fullWidth
            onClick={() => { localStorage.removeItem('mapFlagPositions'); localStorage.removeItem('mapView'); localStorage.removeItem('mapLabelAttached'); window.location.reload(); }}
          >
            Сбросить позиции флагов
          </Button>
        </Stack>
        <Text size="xs" c="dimmed" ta="center">
          Нажмите{' '}
          <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4, color: '#fff' }}>
            ESC
          </kbd>{' '}
          чтобы закрыть
        </Text>
      </Modal>
    </MantineProvider>
  );
}
