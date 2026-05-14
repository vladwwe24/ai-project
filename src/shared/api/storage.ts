import type { StorageKey } from '@/shared/config/storageKeys'

function getAll<T>(key: StorageKey): T[] {
  const raw = localStorage.getItem(key)
  if (!raw) return []
  return JSON.parse(raw) as T[]
}

function getById<T extends { id: string }>(key: StorageKey, id: string): T | undefined {
  return getAll<T>(key).find(item => item.id === id)
}

function create<T extends { id: string }>(key: StorageKey, item: T): T {
  const all = getAll<T>(key)
  all.push(item)
  localStorage.setItem(key, JSON.stringify(all))
  return item
}

function update<T extends { id: string }>(key: StorageKey, id: string, changes: Partial<T>): T {
  const all = getAll<T>(key)
  const index = all.findIndex(item => item.id === id)
  if (index === -1) throw new Error(`[storage] ${id} not found in "${key}"`)
  const updated = { ...all[index], ...changes }
  all[index] = updated
  localStorage.setItem(key, JSON.stringify(all))
  return updated
}

function remove(key: StorageKey, id: string): void {
  const all = getAll<{ id: string }>(key)
  localStorage.setItem(key, JSON.stringify(all.filter(item => item.id !== id)))
}

export const storage = { getAll, getById, create, update, remove }
