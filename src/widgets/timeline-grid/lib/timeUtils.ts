export const GRID_START_HOUR = 0   // 12 AM (midnight)
export const GRID_END_HOUR = 24    // 12 AM (next day)
export const HOUR_HEIGHT = 80      // px per hour
export const TOTAL_HEIGHT = (GRID_END_HOUR - GRID_START_HOUR) * HOUR_HEIGHT // 1920px
export const BLOCK_HEIGHT = HOUR_HEIGHT  // kept for backward compat

export function hourLabel(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return '12 PM'
  return `${hour - 12} PM`
}

// Returns pixel offset from grid top for a given ISO datetime, or null if outside grid
export function isoToGridTop(iso: string): number | null {
  const d = new Date(iso)
  const hours = d.getHours() + d.getMinutes() / 60
  if (hours < GRID_START_HOUR || hours >= GRID_END_HOUR) return null
  return (hours - GRID_START_HOUR) * HOUR_HEIGHT
}

// Snaps a y pixel position (relative to grid top) to nearest 1-hour slot
export function snapToHour(y: number): { hour: number; minute: number } {
  const rawHours = GRID_START_HOUR + y / HOUR_HEIGHT
  const hour = Math.round(rawHours)
  return {
    hour: Math.min(Math.max(hour, GRID_START_HOUR), GRID_END_HOUR - 1),
    minute: 0,
  }
}

// Builds an ISO string from a base date + local hour + minute
export function slotToIso(date: Date, hour: number, minute: number): string {
  const d = new Date(date)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

// Returns YYYY-MM-DD for use with selectJobsByDate
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Returns pixel height for a job block based on its duration
export function isoToBlockHeight(startIso: string, endIso?: string): number {
  if (!endIso) return HOUR_HEIGHT
  const startMs = new Date(startIso).getTime()
  const endMs = new Date(endIso).getTime()
  const durationHours = (endMs - startMs) / 3_600_000
  if (durationHours <= 0) return HOUR_HEIGHT
  return Math.max(durationHours * HOUR_HEIGHT, 24)
}

// Returns value suitable for <input type="datetime-local">
export function toDatetimeLocalValue(iso: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const da = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${da}T${h}:${mi}`
}
