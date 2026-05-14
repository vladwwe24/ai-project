import { describe, it, expect, beforeEach } from 'vitest'
import { storage } from '../storage'
import { STORAGE_KEYS } from '@/shared/config/storageKeys'

const KEY = STORAGE_KEYS.CUSTOMERS

interface TestItem {
  id: string
  name: string
}

function makeItem(id: string, name: string): TestItem {
  return { id, name }
}

beforeEach(() => {
  localStorage.clear()
})

describe('storage.getAll', () => {
  it('returns empty array when key does not exist', () => {
    expect(storage.getAll(KEY)).toEqual([])
  })

  it('returns parsed array when key exists', () => {
    const items = [makeItem('1', 'Alice'), makeItem('2', 'Bob')]
    localStorage.setItem(KEY, JSON.stringify(items))
    expect(storage.getAll(KEY)).toEqual(items)
  })
})

describe('storage.getById', () => {
  it('returns undefined when not found', () => {
    expect(storage.getById(KEY, 'missing')).toBeUndefined()
  })

  it('returns the matching item', () => {
    const item = makeItem('abc', 'Alice')
    localStorage.setItem(KEY, JSON.stringify([item]))
    expect(storage.getById<TestItem>(KEY, 'abc')).toEqual(item)
  })
})

describe('storage.create', () => {
  it('adds item and persists it', () => {
    const item = makeItem('1', 'Alice')
    const result = storage.create(KEY, item)
    expect(result).toEqual(item)
    expect(storage.getAll<TestItem>(KEY)).toHaveLength(1)
    expect(storage.getAll<TestItem>(KEY)[0]).toEqual(item)
  })

  it('appends to existing items', () => {
    storage.create(KEY, makeItem('1', 'Alice'))
    storage.create(KEY, makeItem('2', 'Bob'))
    expect(storage.getAll(KEY)).toHaveLength(2)
  })
})

describe('storage.update', () => {
  it('merges changes into the existing item', () => {
    storage.create(KEY, makeItem('1', 'Alice'))
    const updated = storage.update<TestItem>(KEY, '1', { name: 'Alicia' })
    expect(updated.name).toBe('Alicia')
    expect(storage.getById<TestItem>(KEY, '1')?.name).toBe('Alicia')
  })

  it('throws when id is not found', () => {
    expect(() => storage.update(KEY, 'ghost', {})).toThrow()
  })
})

describe('storage.remove', () => {
  it('removes the item by id', () => {
    storage.create(KEY, makeItem('1', 'Alice'))
    storage.create(KEY, makeItem('2', 'Bob'))
    storage.remove(KEY, '1')
    const remaining = storage.getAll<TestItem>(KEY)
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).toBe('2')
  })

  it('is a no-op for unknown ids', () => {
    storage.create(KEY, makeItem('1', 'Alice'))
    storage.remove(KEY, 'ghost')
    expect(storage.getAll(KEY)).toHaveLength(1)
  })
})
