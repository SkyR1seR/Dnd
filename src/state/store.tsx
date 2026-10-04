import { produce } from 'immer'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { syncSlots } from '../lib/actions'
import { newCharacter, normalizeCharacter, uid } from '../lib/factory'
import { loadCharacters, saveCharacters } from '../lib/storage'
import type { Character } from '../types'

interface Store {
  characters: Character[]
  create: () => string
  remove: (id: string) => void
  duplicate: (id: string) => string | null
  importOne: (raw: unknown) => string | null
  replace: (next: Character) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>(() => loadCharacters())

  useEffect(() => {
    saveCharacters(characters)
  }, [characters])

  // Синхронизация между вкладками браузера
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dnd-sheet:characters') setCharacters(loadCharacters())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const create = useCallback(() => {
    const c = newCharacter()
    setCharacters((list) => [...list, c])
    return c.id
  }, [])

  const remove = useCallback((id: string) => {
    setCharacters((list) => list.filter((c) => c.id !== id))
  }, [])

  const duplicate = useCallback(
    (id: string) => {
      const src = characters.find((c) => c.id === id)
      if (!src) return null
      const copy = { ...structuredClone(src), id: uid(), name: `${src.name} (копия)` }
      setCharacters((list) => [...list, copy])
      return copy.id
    },
    [characters],
  )

  const importOne = useCallback((raw: unknown) => {
    const c = normalizeCharacter(raw)
    if (!c) return null
    c.id = uid()
    setCharacters((list) => [...list, c])
    return c.id
  }, [])

  const replace = useCallback((next: Character) => {
    setCharacters((list) => list.map((c) => (c.id === next.id ? next : c)))
  }, [])

  const value = useMemo(
    () => ({ characters, create, remove, duplicate, importOne, replace }),
    [characters, create, remove, duplicate, importOne, replace],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider missing')
  return s
}

/** Текущий персонаж и функция его изменения */
export interface CharApi {
  c: Character
  /** Синхронно применяет рецепт к персонажу и возвращает его результат */
  set: <T>(recipe: (draft: Character) => T) => T
}

const CharCtx = createContext<CharApi | null>(null)

export function CharacterProvider({ id, children }: { id: string; children: ReactNode }) {
  const { characters, replace } = useStore()
  const c = characters.find((x) => x.id === id)
  // Последняя версия персонажа: несколько изменений в одном обработчике применяются по цепочке
  const latest = useRef(c)
  useEffect(() => {
    latest.current = c
  }, [c])
  const set = useCallback(
    <T,>(recipe: (d: Character) => T): T => {
      let out!: T
      if (!latest.current) return out
      const next = produce(latest.current, (d) => {
        out = recipe(d)
        syncSlots(d)
        d.updatedAt = Date.now()
      })
      latest.current = next
      replace(next)
      return out
    },
    [replace],
  )
  const value = useMemo(() => (c ? { c, set } : null), [c, set])
  if (!value) return null
  return <CharCtx.Provider value={value}>{children}</CharCtx.Provider>
}

export function useChar() {
  const v = useContext(CharCtx)
  if (!v) throw new Error('CharacterProvider missing')
  return v
}
