import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { combineModes, conditionEffect } from '../lib/calc'
import type { RollContext } from '../lib/calc'
import { rollD20, rollExpr } from '../lib/dice'
import type { D20Result, RollResult } from '../lib/dice'
import { uid } from '../lib/factory'
import { loadPref, savePref } from '../lib/storage'
import type { RollMode } from '../types'
import { useChar } from './store'

export interface LogEntry {
  id: string
  time: number
  label: string
  d20?: D20Result
  dice?: RollResult
  crit?: boolean
  autoFail?: boolean
  notes?: string[]
  /** Кнопка-продолжение: бросок урона после атаки */
  followUp?: { label: string; expr: string; crit: boolean }
}

interface RollApi {
  log: LogEntry[]
  last: LogEntry | null
  mode: RollMode
  setMode: (m: RollMode) => void
  d20: (label: string, modifier: number, ctx: RollContext, extra?: Partial<LogEntry>) => LogEntry
  dice: (label: string, expr: string, crit?: boolean) => LogEntry | null
  note: (label: string, notes?: string[]) => void
  clear: () => void
  dismiss: () => void
}

const Ctx = createContext<RollApi | null>(null)
const MAX_LOG = 100

export function RollProvider({ children }: { children: ReactNode }) {
  const { c } = useChar()
  const logKey = `log:${c.id}`
  const [log, setLog] = useState<LogEntry[]>(() => loadPref<LogEntry[]>(logKey, []))
  const [last, setLast] = useState<LogEntry | null>(null)
  const [mode, setMode] = useState<RollMode>('normal')

  useEffect(() => savePref(logKey, log), [log, logKey])

  const push = useCallback((e: LogEntry) => {
    setLog((l) => [e, ...l].slice(0, MAX_LOG))
    setLast(e)
  }, [])

  const d20 = useCallback(
    (label: string, modifier: number, ctx: RollContext, extra: Partial<LogEntry> = {}) => {
      const eff = conditionEffect(c, ctx)
      const finalMode = combineModes(mode, eff.mode)
      const r = rollD20(modifier, finalMode)
      const entry: LogEntry = {
        id: uid(),
        time: Date.now(),
        label,
        d20: r,
        autoFail: eff.autoFail,
        ...extra,
        notes: [...eff.notes, ...(extra.notes ?? [])],
      }
      if (entry.followUp) entry.followUp = { ...entry.followUp, crit: r.crit }
      push(entry)
      // Режим преимущества/помехи действует на один бросок
      setMode('normal')
      return entry
    },
    [c, mode, push],
  )

  const dice = useCallback(
    (label: string, expr: string, crit = false) => {
      const r = rollExpr(expr, { crit })
      if (!r) return null
      const entry: LogEntry = { id: uid(), time: Date.now(), label, dice: r, crit }
      push(entry)
      return entry
    },
    [push],
  )

  const note = useCallback(
    (label: string, notes?: string[]) => push({ id: uid(), time: Date.now(), label, notes }),
    [push],
  )

  const clear = useCallback(() => setLog([]), [])
  const dismiss = useCallback(() => setLast(null), [])

  const value = useMemo(
    () => ({ log, last, mode, setMode, d20, dice, note, clear, dismiss }),
    [log, last, mode, d20, dice, note, clear, dismiss],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useRolls() {
  const v = useContext(Ctx)
  if (!v) throw new Error('RollProvider missing')
  return v
}
