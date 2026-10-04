/**
 * Игровые действия над персонажем. Все функции мутируют черновик (immer draft)
 * и возвращают сообщения для журнала.
 */
import { computeSlots, effectiveMaxHp, mod, totalLevel } from './calc'
import type { Character } from '../types'

export function applyDamage(c: Character, amount: number): string[] {
  const log: string[] = []
  if (amount <= 0) return log
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
      c.deathSaves.failures = Math.min(3, c.deathSaves.failures + 1)
      log.push('Урон при 0 хитов — провал спасброска от смерти')
    }
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
  }
  if (c.spellcasting.concentration && amount > 0) {
    const dc = Math.max(10, Math.floor(amount / 2))
    log.push(`Концентрация на «${c.spellcasting.concentration}»: спасбросок Телосложения Сл ${dc}`)
  }
  return log
}

export function heal(c: Character, amount: number): string[] {
  if (amount <= 0) return []
  const wasDown = c.hp.current === 0
  c.hp.current = Math.min(effectiveMaxHp(c), c.hp.current + amount)
  if (wasDown && c.hp.current > 0) {
    c.deathSaves = { successes: 0, failures: 0 }
    c.conditions = c.conditions.filter((k) => k !== 'unconscious')
    return ['Персонаж приходит в сознание']
  }
  return []
}

export function setTempHp(c: Character, amount: number) {
  // Временные хиты не складываются — берётся большее значение
  c.hp.temp = Math.max(c.hp.temp, Math.max(0, amount))
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

export function longRest(c: Character): string[] {
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
    log.push(`Истощение снижено до ${c.exhaustion}`)
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
