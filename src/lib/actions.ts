/**
 * Игровые действия над персонажем. Все функции мутируют черновик (immer draft)
 * и возвращают сообщения для журнала.
 * Ссылки на страницы — «Книга игрока» (рус., 2016), глава 9 «Сражение» и глава 10 «Использование заклинаний».
 */
import { computeSlots, effectiveMaxHp, mod, totalLevel } from './calc'
import type { Character } from '../types'

export const isDead = (c: Character) => c.deathSaves.failures >= 3
/** Три успеха — существо стабилизировано (с. 197) */
export const isStable = (c: Character) => c.hp.current === 0 && c.deathSaves.successes >= 3

/** Состояния, при которых существо недееспособно и теряет концентрацию (с. 203, 290–292) */
const INCAPACITATING = ['incapacitated', 'paralyzed', 'petrified', 'stunned', 'unconscious'] as const

export function breakConcentrationIfIncapacitated(c: Character): string[] {
  const name = c.spellcasting.concentration
  if (!name) return []
  if (isDead(c) || c.conditions.some((k) => (INCAPACITATING as readonly string[]).includes(k))) {
    c.spellcasting.concentration = ''
    return [`Концентрация на «${name}» потеряна: персонаж недееспособен`]
  }
  return []
}

/**
 * Урон (с. 197): сначала снимаются временные хиты; при 0 хитов каждый урон — провал
 * спасброска от смерти (крит — два); излишек урона не меньше максимума хитов — мгновенная смерть.
 */
export function applyDamage(c: Character, amount: number, crit = false): string[] {
  const log: string[] = []
  if (amount <= 0 || isDead(c)) return log
  let rest = amount
  if (c.hp.temp > 0) {
    const absorbed = Math.min(c.hp.temp, rest)
    c.hp.temp -= absorbed
    rest -= absorbed
    if (absorbed) log.push(`Временные хиты поглотили ${absorbed}`)
  }
  const wasDown = c.hp.current === 0
  if (wasDown && rest > 0) {
    if (rest >= effectiveMaxHp(c)) {
      c.deathSaves.failures = 3
      log.push('Урон не меньше максимума хитов — мгновенная смерть')
    } else {
      if (c.deathSaves.successes >= 3) {
        // Стабилизированное существо, получив урон, снова совершает спасброски от смерти
        c.deathSaves = { successes: 0, failures: 0 }
        log.push('Персонаж больше не стабилизирован')
      }
      const fails = crit ? 2 : 1
      c.deathSaves.failures = Math.min(3, c.deathSaves.failures + fails)
      log.push(
        crit
          ? 'Критическое попадание при 0 хитов — два провала спасброска от смерти'
          : 'Урон при 0 хитов — провал спасброска от смерти',
      )
    }
    if (isDead(c)) log.push('Персонаж погиб')
    return log
  }
  const overflow = rest - c.hp.current
  c.hp.current = Math.max(0, c.hp.current - rest)
  if (c.hp.current === 0) {
    if (overflow >= effectiveMaxHp(c)) {
      c.deathSaves.failures = 3
      log.push('Избыточный урон не меньше максимума хитов — мгновенная смерть')
    } else {
      log.push('Хиты опустились до 0 — персонаж без сознания')
      if (!c.conditions.includes('unconscious')) c.conditions.push('unconscious')
    }
    log.push(...breakConcentrationIfIncapacitated(c))
  }
  if (c.spellcasting.concentration) {
    // Сл = 10 или половина урона, если она больше (с. 203)
    const dc = Math.max(10, Math.floor(amount / 2))
    log.push(`Концентрация на «${c.spellcasting.concentration}»: спасбросок Телосложения Сл ${dc}`)
  }
  return log
}

/** Спасбросок от смерти (с. 197): 10+ — успех, 1 — два провала, 20 — 1 хит. */
export function deathSave(c: Character, roll: number): string[] {
  if (isDead(c) || c.hp.current > 0) return []
  if (roll === 20) {
    c.hp.current = 1
    c.deathSaves = { successes: 0, failures: 0 }
    c.conditions = c.conditions.filter((k) => k !== 'unconscious')
    return ['Выпало 20 — персонаж восстанавливает 1 хит и приходит в сознание']
  }
  if (roll === 1) c.deathSaves.failures = Math.min(3, c.deathSaves.failures + 2)
  else if (roll >= 10) c.deathSaves.successes = Math.min(3, c.deathSaves.successes + 1)
  else c.deathSaves.failures = Math.min(3, c.deathSaves.failures + 1)
  if (isDead(c)) return ['Три провала — персонаж погиб']
  if (c.deathSaves.successes >= 3) return ['Три успеха — персонаж стабилизирован']
  return []
}

/** Лечение (с. 197): хиты не превышают максимум, умершее существо не лечится. */
export function heal(c: Character, amount: number): string[] {
  if (amount <= 0) return []
  if (isDead(c)) return ['Умершее существо не может восстанавливать хиты']
  const wasDown = c.hp.current === 0
  c.hp.current = Math.min(effectiveMaxHp(c), c.hp.current + amount)
  if (wasDown && c.hp.current > 0) {
    c.deathSaves = { successes: 0, failures: 0 }
    c.conditions = c.conditions.filter((k) => k !== 'unconscious')
    return ['Персонаж приходит в сознание']
  }
  return []
}

/**
 * Временные хиты (с. 198) не складываются: персонаж выбирает старые или новые.
 * По умолчанию остаётся большее значение; при 0 хитов они не приводят в сознание.
 */
export function setTempHp(c: Character, amount: number): string[] {
  const next = Math.max(0, amount)
  if (c.hp.temp > next) return [`Остаются прежние ${c.hp.temp} временных хитов (больше новых)`]
  c.hp.temp = next
  return c.hp.current === 0 ? ['Временные хиты не приводят в сознание и не стабилизируют'] : []
}

export function syncSlots(c: Character) {
  if (!c.spellcasting.autoSlots) return
  const { slots, pact } = computeSlots(c)
  c.spellcasting.slots.forEach((s, i) => {
    s.max = slots[i]
    s.used = Math.min(s.used, s.max)
  })
  c.spellcasting.pact.max = pact.max
  c.spellcasting.pact.level = pact.level
  c.spellcasting.pact.used = Math.min(c.spellcasting.pact.used, pact.max)
}

export function shortRest(c: Character): string[] {
  const log = ['Короткий отдых']
  c.resources.forEach((r) => {
    if (r.reset === 'short') r.current = r.max
  })
  if (c.spellcasting.pact.used) {
    c.spellcasting.pact.used = 0
    log.push('Ячейки магии договора восстановлены')
  }
  return log
}

/**
 * Продолжительный отдых (с. 186): все хиты, половина костей хитов (минимум 1).
 * Требует хотя бы 1 хит в начале отдыха. Истощение снижается на 1, если персонаж поел и попил (с. 291).
 */
export function longRest(c: Character): string[] {
  if (c.hp.current < 1) {
    return ['Продолжительный отдых невозможен', 'Нужен хотя бы 1 хит в начале отдыха']
  }
  const log = ['Продолжительный отдых']
  c.hp.temp = 0
  c.deathSaves = { successes: 0, failures: 0 }
  c.conditions = c.conditions.filter((k) => k !== 'unconscious')
  // Восстанавливается половина от общего числа костей хитов (минимум 1)
  let toRestore = Math.max(1, Math.floor(totalLevel(c) / 2))
  // Сначала восстанавливаем самые крупные кости
  const sorted = [...c.classes].sort((a, b) => b.hitDie - a.hitDie)
  let restored = 0
  for (const cl of sorted) {
    const n = Math.min(cl.hitDiceUsed, toRestore)
    cl.hitDiceUsed -= n
    toRestore -= n
    restored += n
  }
  if (restored) log.push(`Восстановлено костей хитов: ${restored}`)
  c.spellcasting.slots.forEach((s) => (s.used = 0))
  c.spellcasting.pact.used = 0
  c.resources.forEach((r) => {
    if (r.reset !== 'none') r.current = r.max
  })
  if (c.exhaustion > 0) {
    c.exhaustion -= 1
    log.push(`Истощение снижено до ${c.exhaustion} (если персонаж ел и пил)`)
  }
  c.spellcasting.concentration = ''
  c.hp.current = effectiveMaxHp(c)
  return log
}

/** Трата кости хитов во время короткого отдыха. Возвращает вылеченное количество. */
export function spendHitDie(c: Character, classId: string, roll: number): number {
  const cl = c.classes.find((x) => x.id === classId)
  if (!cl || cl.hitDiceUsed >= cl.level) return 0
  cl.hitDiceUsed += 1
  const amount = Math.max(0, roll + mod(c, 'con'))
  heal(c, amount)
  return amount
}
