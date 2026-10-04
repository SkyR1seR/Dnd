import type { Character } from '../types'
import { normalizeCharacter } from './factory'

const KEY = 'dnd-sheet:characters'

export function loadCharacters(): Character[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeCharacter).filter((c): c is Character => !!c)
  } catch {
    return []
  }
}

export function saveCharacters(list: Character[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* хранилище недоступно — данные останутся только в памяти */
  }
}

export function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`dnd-sheet:${key}`)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function savePref(key: string, value: unknown) {
  try {
    localStorage.setItem(`dnd-sheet:${key}`, JSON.stringify(value))
  } catch {
    /* игнорируем */
  }
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function readJsonFile(file: File): Promise<unknown> {
  return file.text().then((t) => JSON.parse(t))
}
