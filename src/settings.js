const STORAGE_KEY = 'neon-vectors:settings';

const DEFAULTS = {
  volume: 0.8,
  sfx: true,
  music: true,
  muted: false,
  vibrate: true,
  quality: 'high',
};

export const settings = { ...DEFAULTS };

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (typeof parsed.volume === 'number') settings.volume = clamp(parsed.volume, 0, 1);
    if (typeof parsed.sfx === 'boolean') settings.sfx = parsed.sfx;
    if (typeof parsed.music === 'boolean') settings.music = parsed.music;
    if (typeof parsed.muted === 'boolean') settings.muted = parsed.muted;
    if (typeof parsed.vibrate === 'boolean') settings.vibrate = parsed.vibrate;
    if (parsed.quality === 'low' || parsed.quality === 'high') settings.quality = parsed.quality;
  } catch {
    /* 忽略损坏的本地配置 */
  }
}

export function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* 忽略存储失败 */
  }
}

export function resetSettings() {
  Object.assign(settings, DEFAULTS);
  saveSettings();
}

export function isLowQuality() {
  return settings.quality === 'low';
}

export function vibrate(pattern) {
  if (!settings.vibrate) return;
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  navigator.vibrate(pattern);
}

loadSettings();
