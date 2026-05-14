import { STORAGE_KEYS } from './storageKeys'

interface AppSettings {
  defaultTaxRate: number
}

const DEFAULTS: AppSettings = {
  defaultTaxRate: 8.5,
}

export function getSettings(): AppSettings {
  const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
  if (!raw) return { ...DEFAULTS }
  return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<AppSettings>) }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings))
}
