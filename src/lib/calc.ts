import { SKILLS, SPELL_SLOT_TABLE, XP_THRESHOLDS, pactSlots } from '../data/rules'
import type { Ability, Attack, Character, RollMode, SkillKey } from '../types'

export const abilityMod = (score: number) => Math.floor((score - 10) / 2)

export const fmtMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

export const totalLevel = (c: Character) =>
  Math.max(1, c.classes.reduce((s, cl) => s + (cl.level || 0), 0))

export const proficiencyBonus = (level: number) => 2 + Math.floor((Math.max(1, level) - 1) / 4)

export const pb = (c: Character) => proficiencyBonus(totalLevel(c))

export const mod = (c: Character, a: Ability) => abilityMod(c.abilities[a])

export const saveBonus = (c: Character, a: Ability) => mod(c, a) + (c.saveProf[a] ? pb(c) : 0)

export function skillBonus(c: Character, key: SkillKey) {
  const skill = SKILLS.find((s) => s.key === key)!
  const lvl = c.skills[key]
  const prof = pb(c)
  let bonus = mod(c, skill.ability)
  if (lvl === 2) bonus += prof * 2
  else if (lvl === 1) bonus += prof
  else if (c.jackOfAllTrades) bonus += Math.floor(prof / 2)
  return bonus
}

export const passive = (c: Character, key: SkillKey) => 10 + skillBonus(c, key)

export const initiative = (c: Character) =>
  mod(c, 'dex') + c.initiativeBonus + (c.jackOfAllTrades ? Math.floor(pb(c) / 2) : 0)

export function spellAbility(c: Character): Ability | null {
  return c.spellcasting.ability || null
}

export function spellSaveDC(c: Character) {
  const a = spellAbility(c)
  return a ? 8 + pb(c) + mod(c, a) : null
}

export function spellAttack(c: Character) {
  const a = spellAbility(c)
  return a ? pb(c) + mod(c, a) : null
}

export function attackAbility(c: Character, atk: Attack): Ability | null {
  if (atk.ability === 'none') return null
  if (atk.ability === 'spell') return spellAbility(c)
  return atk.ability
}

export function attackToHit(c: Character, atk: Attack) {
  const a = attackAbility(c, atk)
  return (a ? mod(c, a) : 0) + (atk.proficient ? pb(c) : 0) + atk.attackBonus
}

export function attackDamageExpr(c: Character, atk: Attack) {
  const a = attackAbility(c, atk)
  const m = atk.addAbilityToDamage && a ? mod(c, a) : 0
  const base = atk.damage.trim() || '0'
  if (!m) return base
  return `${base}${m >= 0 ? '+' : ''}${m}`
}

export function effectiveMaxHp(c: Character) {
  return c.exhaustion >= 4 ? Math.floor(c.hp.max / 2) : c.hp.max
}

export function effectiveSpeed(c: Character) {
  if (c.exhaustion >= 5) return 0
  if (c.conditions.includes('grappled') || c.conditions.includes('restrained')) return 0
  return c.exhaustion >= 2 ? Math.floor(c.speed / 2) : c.speed
}

export function levelFromXp(xp: number) {
  let lvl = 1
  XP_THRESHOLDS.forEach((t, i) => {
    if (xp >= t) lvl = i + 1
  })
  return lvl
}

/** Автоматический расчёт ячеек заклинаний по классам (PHB, гл. 6 «Мультиклассирование») */
export function computeSlots(c: Character): { slots: number[]; pact: { max: number; level: number } } {
  const casters = c.classes.filter((cl) => cl.caster !== 'none' && cl.caster !== 'pact')
  let casterLevel = 0
  if (casters.length === 1) {
    const cl = casters[0]
    const L = cl.level
    if (cl.caster === 'full') casterLevel = L
    else if (cl.caster === 'half') casterLevel = L >= 2 ? Math.ceil(L / 2) : 0
    else if (cl.caster === 'halfUp') casterLevel = Math.ceil(L / 2)
    else if (cl.caster === 'third') casterLevel = L >= 3 ? Math.ceil(L / 3) : 0
  } else {
    for (const cl of casters) {
      if (cl.caster === 'full') casterLevel += cl.level
      else if (cl.caster === 'half') casterLevel += Math.floor(cl.level / 2)
      else if (cl.caster === 'halfUp') casterLevel += Math.ceil(cl.level / 2)
      else if (cl.caster === 'third') casterLevel += Math.floor(cl.level / 3)
    }
  }
  casterLevel = Math.min(20, casterLevel)
  const row = SPELL_SLOT_TABLE[casterLevel]
  const slots = Array.from({ length: 9 }, (_, i) => row[i] ?? 0)
  const warlockLevel = c.classes
    .filter((cl) => cl.caster === 'pact')
    .reduce((s, cl) => s + cl.level, 0)
  return { slots, pact: pactSlots(warlockLevel) }
}

export interface RollContext {
  kind: 'check' | 'save' | 'attack' | 'init' | 'death' | 'plain'
  ability?: Ability
}

export interface ConditionEffect {
  mode: RollMode | null
  autoFail: boolean
  notes: string[]
}

/** Как состояния и истощение влияют на бросок d20 */
export function conditionEffect(c: Character, ctx: RollContext): ConditionEffect {
  let adv = false
  let dis = false
  let autoFail = false
  const notes: string[] = []
  const has = (k: Character['conditions'][number]) => c.conditions.includes(k)
  const addDis = (note: string) => {
    dis = true
    notes.push(note)
  }
  const addAdv = (note: string) => {
    adv = true
    notes.push(note)
  }

  if (ctx.kind === 'check' || ctx.kind === 'init') {
    if (c.exhaustion >= 1) addDis('Истощение: помеха на проверки')
    if (has('poisoned')) addDis('Отравлен: помеха на проверки')
    if (has('frightened')) addDis('Испуган: помеха (если источник виден)')
  }
  if (ctx.kind === 'attack') {
    if (c.exhaustion >= 3) addDis('Истощение: помеха на атаки')
    if (has('poisoned')) addDis('Отравлен: помеха на атаки')
    if (has('frightened')) addDis('Испуган: помеха (если источник виден)')
    if (has('blinded')) addDis('Ослеплён: помеха на атаки')
    if (has('prone')) addDis('Сбит с ног: помеха на атаки')
    if (has('restrained')) addDis('Опутан: помеха на атаки')
    if (has('invisible')) addAdv('Невидим: преимущество на атаки')
  }
  if (ctx.kind === 'save') {
    if (c.exhaustion >= 3) addDis('Истощение: помеха на спасброски')
    if (ctx.ability === 'dex' && has('restrained')) addDis('Опутан: помеха на спасброски Ловкости')
    if (
      (ctx.ability === 'str' || ctx.ability === 'dex') &&
      (has('paralyzed') || has('stunned') || has('unconscious') || has('petrified'))
    ) {
      autoFail = true
      notes.push('Автоматический провал спасброска Силы/Ловкости')
    }
  }
  const mode: RollMode | null = adv && dis ? 'normal' : adv ? 'advantage' : dis ? 'disadvantage' : null
  return { mode, autoFail, notes }
}

/** Объединяет выбранный игроком режим с эффектами состояний */
export function combineModes(a: RollMode, b: RollMode | null): RollMode {
  if (!b || b === 'normal') return a
  if (a === 'normal') return b
  return a === b ? a : 'normal'
}
