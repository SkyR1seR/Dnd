import type { RollMode } from '../types'

export interface DiceTerm {
  sign: 1 | -1
  count: number
  sides: number // 0 — константа
  value: number
}

export interface RolledTerm extends DiceTerm {
  results: number[]
}

export interface RollResult {
  expr: string
  terms: RolledTerm[]
  total: number
}

export type Rng = () => number

export const rollDie = (sides: number, rng: Rng = Math.random) => Math.floor(rng() * sides) + 1

/** Разбирает выражения вида "2d6+1d4+3", "d20-1", "1к8+2" */
export function parseDice(input: string): DiceTerm[] | null {
  const expr = input.replace(/\s+/g, '').toLowerCase().replace(/[кд]/g, 'd')
  if (!expr) return null
  const re = /([+-]?)(\d*d\d+|\d+)/gy
  const terms: DiceTerm[] = []
  let m: RegExpExecArray | null
  let pos = 0
  while ((m = re.exec(expr))) {
    if (m.index !== pos) return null
    pos = re.lastIndex
    const sign = m[1] === '-' ? -1 : 1
    if (!m[1] && terms.length > 0) return null
    const body = m[2]
    if (body.includes('d')) {
      const [c, s] = body.split('d')
      const count = c === '' ? 1 : parseInt(c, 10)
      const sides = parseInt(s, 10)
      if (count < 1 || count > 100 || sides < 1 || sides > 1000) return null
      terms.push({ sign, count, sides, value: 0 })
    } else {
      terms.push({ sign, count: 0, sides: 0, value: parseInt(body, 10) })
    }
  }
  if (pos !== expr.length || terms.length === 0) return null
  return terms
}

export function rollExpr(input: string, opts: { crit?: boolean; rng?: Rng } = {}): RollResult | null {
  const terms = parseDice(input)
  if (!terms) return null
  const rng = opts.rng ?? Math.random
  const rolled: RolledTerm[] = terms.map((t) => {
    if (!t.sides) return { ...t, results: [] }
    const count = opts.crit ? t.count * 2 : t.count
    const results = Array.from({ length: count }, () => rollDie(t.sides, rng))
    return { ...t, count, results, value: results.reduce((a, b) => a + b, 0) }
  })
  const total = rolled.reduce((s, t) => s + t.sign * t.value, 0)
  return { expr: input, terms: rolled, total }
}

export function describeRoll(r: RollResult) {
  return r.terms
    .map((t, i) => {
      const sign = t.sign < 0 ? '−' : i > 0 ? '+' : ''
      if (!t.sides) return `${sign}${t.value}`
      return `${sign}${t.count}d${t.sides}[${t.results.join(',')}]`
    })
    .join(' ')
}

export interface D20Result {
  mode: RollMode
  rolls: number[]
  kept: number
  modifier: number
  total: number
  crit: boolean
  fumble: boolean
}

export function rollD20(modifier: number, mode: RollMode, rng: Rng = Math.random): D20Result {
  const a = rollDie(20, rng)
  const rolls = mode === 'normal' ? [a] : [a, rollDie(20, rng)]
  const kept =
    mode === 'advantage' ? Math.max(...rolls) : mode === 'disadvantage' ? Math.min(...rolls) : a
  return {
    mode,
    rolls,
    kept,
    modifier,
    total: kept + modifier,
    crit: kept === 20,
    fumble: kept === 1,
  }
}
