import { produce } from 'immer'
import { describe, expect, it } from 'vitest'
import {
  applyDamage,
  breakConcentrationIfIncapacitated,
  castSpell,
  deathSave,
  heal,
  isStable,
  longRest,
  setTempHp,
  shortRest,
  syncSlots,
} from '../actions'
import {
  abilityCheckBonus,
  abilityMod,
  combineModes,
  computeSlots,
  conditionEffect,
  proficiencyBonus,
  passive,
  skillBonus,
  spellSaveDC,
} from '../calc'
import { parseDice, rollD20, rollExpr } from '../dice'
import { newCharacter, newClass, newResource, newSpell, normalizeCharacter } from '../factory'
import type { CasterType, Character } from '../../types'

const withClasses = (...cls: [CasterType, number][]): Character => {
  const c = newCharacter()
  c.classes = cls.map(([caster, level]) => ({ ...newClass(), caster, level }))
  return c
}

describe('базовые расчёты', () => {
  it('модификатор характеристики', () => {
    expect(abilityMod(1)).toBe(-5)
    expect(abilityMod(9)).toBe(-1)
    expect(abilityMod(10)).toBe(0)
    expect(abilityMod(15)).toBe(2)
    expect(abilityMod(20)).toBe(5)
  })

  it('бонус мастерства', () => {
    expect([1, 4, 5, 8, 9, 13, 17, 20].map(proficiencyBonus)).toEqual([2, 2, 3, 3, 4, 5, 6, 6])
  })

  it('навыки: владение, компетентность, мастер на все руки', () => {
    const c = withClasses(['full', 5]) // БМ +3
    c.abilities.dex = 16
    c.skills.stealth = 2
    c.skills.acrobatics = 1
    expect(skillBonus(c, 'stealth')).toBe(3 + 6)
    expect(skillBonus(c, 'acrobatics')).toBe(3 + 3)
    expect(skillBonus(c, 'sleightOfHand')).toBe(3)
    c.jackOfAllTrades = true
    expect(skillBonus(c, 'sleightOfHand')).toBe(3 + 1)
  })

  it('Сл заклинаний', () => {
    const c = withClasses(['full', 1])
    c.abilities.int = 16
    c.spellcasting.ability = 'int'
    expect(spellSaveDC(c)).toBe(8 + 2 + 3)
  })
})

describe('ячейки заклинаний', () => {
  it('одиночные классы', () => {
    expect(computeSlots(withClasses(['full', 1])).slots.slice(0, 2)).toEqual([2, 0])
    expect(computeSlots(withClasses(['full', 5])).slots.slice(0, 3)).toEqual([4, 3, 2])
    expect(computeSlots(withClasses(['half', 1])).slots[0]).toBe(0)
    expect(computeSlots(withClasses(['half', 5])).slots.slice(0, 2)).toEqual([4, 2])
    expect(computeSlots(withClasses(['halfUp', 1])).slots[0]).toBe(2)
    expect(computeSlots(withClasses(['third', 2])).slots[0]).toBe(0)
    expect(computeSlots(withClasses(['third', 3])).slots[0]).toBe(2)
    expect(computeSlots(withClasses(['third', 7])).slots.slice(0, 2)).toEqual([4, 2])
  })

  it('мультикласс: паладин 4 / чародей 3 = 5 уровень заклинателя', () => {
    expect(computeSlots(withClasses(['half', 4], ['full', 3])).slots.slice(0, 3)).toEqual([4, 3, 2])
  })

  it('магия договора', () => {
    const r = computeSlots(withClasses(['pact', 5], ['full', 2]))
    expect(r.pact).toEqual({ max: 2, level: 3 })
    expect(r.slots.slice(0, 2)).toEqual([3, 0])
    expect(computeSlots(withClasses(['pact', 11])).pact).toEqual({ max: 3, level: 5 })
  })
})

describe('кубики', () => {
  it('разбор выражений', () => {
    expect(parseDice('2d6+3')).toHaveLength(2)
    expect(parseDice('d20')).toEqual([{ sign: 1, count: 1, sides: 20, value: 0 }])
    expect(parseDice('1к8 - 1')).toHaveLength(2)
    expect(parseDice('2d6++3')).toBeNull()
    expect(parseDice('abc')).toBeNull()
    expect(parseDice('')).toBeNull()
  })

  it('бросок с фиксированным генератором', () => {
    const r = rollExpr('2d6+3', { rng: () => 0.99 })!
    expect(r.total).toBe(15)
    const crit = rollExpr('1d8+2', { crit: true, rng: () => 0 })!
    expect(crit.terms[0].results).toEqual([1, 1])
    expect(crit.total).toBe(4)
  })

  it('преимущество и помеха', () => {
    const seq = [0.1, 0.9]
    const rng = () => seq.shift()!
    const adv = rollD20(2, 'advantage', rng)
    expect(adv.rolls).toEqual([3, 19])
    expect(adv.total).toBe(21)
    const dis = rollD20(0, 'disadvantage', (() => {
      const s = [0.1, 0.99]
      return () => s.shift()!
    })())
    expect(dis.kept).toBe(3)
    expect(rollD20(0, 'normal', () => 0.999).crit).toBe(true)
  })

  it('объединение режимов', () => {
    expect(combineModes('advantage', 'disadvantage')).toBe('normal')
    expect(combineModes('normal', 'disadvantage')).toBe('disadvantage')
    expect(combineModes('advantage', null)).toBe('advantage')
  })
})

describe('состояния', () => {
  it('отравление даёт помеху на атаки и проверки', () => {
    const c = newCharacter()
    c.conditions = ['poisoned']
    expect(conditionEffect(c, { kind: 'attack' }).mode).toBe('disadvantage')
    expect(conditionEffect(c, { kind: 'check' }).mode).toBe('disadvantage')
    expect(conditionEffect(c, { kind: 'save', ability: 'con' }).mode).toBeNull()
  })

  it('паралич — автопровал спасбросков Силы и Ловкости', () => {
    const c = newCharacter()
    c.conditions = ['paralyzed']
    expect(conditionEffect(c, { kind: 'save', ability: 'dex' }).autoFail).toBe(true)
    expect(conditionEffect(c, { kind: 'save', ability: 'wis' }).autoFail).toBe(false)
  })
})

describe('хиты и отдых', () => {
  const base = () => {
    const c = withClasses(['full', 4])
    c.hp = { max: 30, current: 20, temp: 5 }
    return c
  }

  it('урон сначала снимает временные хиты', () => {
    const c = produce(base(), (d) => void applyDamage(d, 8))
    expect(c.hp).toEqual({ max: 30, current: 17, temp: 0 })
  })

  it('урон до 0 — без сознания, массивный урон — смерть', () => {
    const c = produce(base(), (d) => void applyDamage(d, 30))
    expect(c.hp.current).toBe(0)
    expect(c.conditions).toContain('unconscious')
    const dead = produce(base(), (d) => void applyDamage(d, 5 + 20 + 30))
    expect(dead.deathSaves.failures).toBe(3)
  })

  it('урон при 0 хитов — провал спасброска от смерти', () => {
    const c = produce(base(), (d) => {
      d.hp.current = 0
      d.hp.temp = 0
      applyDamage(d, 3)
    })
    expect(c.deathSaves.failures).toBe(1)
  })

  it('лечение поднимает с 0 и сбрасывает спасброски', () => {
    const c = produce(base(), (d) => {
      d.hp.current = 0
      d.deathSaves.failures = 2
      d.conditions.push('unconscious')
      heal(d, 5)
    })
    expect(c.hp.current).toBe(5)
    expect(c.deathSaves.failures).toBe(0)
    expect(c.conditions).not.toContain('unconscious')
  })

  it('концентрация: напоминание о спасброске', () => {
    const c = base()
    c.spellcasting.concentration = 'Благословение'
    let msgs: string[] = []
    produce(c, (d) => {
      msgs = applyDamage(d, 24)
    })
    expect(msgs.some((m) => m.includes('Сл 12'))).toBe(true)
  })

  it('отдых восстанавливает ресурсы', () => {
    const c = produce(base(), (d) => {
      d.resources.push({ ...newResource(), max: 2, current: 0, reset: 'short' })
      d.resources.push({ ...newResource(), max: 1, current: 0, reset: 'long' })
      d.classes[0].hitDiceUsed = 4
      syncSlots(d)
      d.spellcasting.slots[0].used = 3
      d.exhaustion = 2
    })
    const s = produce(c, (d) => void shortRest(d))
    expect(s.resources.map((r) => r.current)).toEqual([2, 0])
    const l = produce(c, (d) => void longRest(d))
    expect(l.resources.map((r) => r.current)).toEqual([2, 1])
    expect(l.hp.current).toBe(30)
    expect(l.hp.temp).toBe(0)
    expect(l.classes[0].hitDiceUsed).toBe(2)
    expect(l.spellcasting.slots[0].used).toBe(0)
    expect(l.exhaustion).toBe(1)
  })
})

describe('импорт', () => {
  it('дополняет недостающие поля', () => {
    const c = normalizeCharacter({ name: 'Тест', abilities: { str: 18 } })!
    expect(c.name).toBe('Тест')
    expect(c.abilities.str).toBe(18)
    expect(c.abilities.dex).toBe(10)
    expect(c.spellcasting.slots).toHaveLength(9)
    expect(normalizeCharacter(null)).toBeNull()
  })
})

describe('правила «Книги игрока» (рус.)', () => {
  const down = () => {
    const c = withClasses(['full', 4])
    c.hp = { max: 30, current: 0, temp: 0 }
    c.conditions = ['unconscious']
    return c
  }

  it('крит при 0 хитов — два провала (с. 197)', () => {
    const c = produce(down(), (d) => void applyDamage(d, 3, true))
    expect(c.deathSaves.failures).toBe(2)
  })

  it('спасброски от смерти: 20 — 1 хит, 1 — два провала, три успеха — стабилизация', () => {
    expect(produce(down(), (d) => void deathSave(d, 20)).hp.current).toBe(1)
    expect(produce(down(), (d) => void deathSave(d, 1)).deathSaves.failures).toBe(2)
    const stable = produce(down(), (d) => {
      d.deathSaves.successes = 2
      deathSave(d, 12)
    })
    expect(isStable(stable)).toBe(true)
    // Урон по стабилизированному — снова спасброски
    const hurt = produce(stable, (d) => void applyDamage(d, 2))
    expect(hurt.deathSaves).toEqual({ successes: 0, failures: 1 })
  })

  it('умерший не лечится, продолжительный отдых требует 1 хит', () => {
    const dead = produce(down(), (d) => void (d.deathSaves.failures = 3))
    expect(produce(dead, (d) => void heal(d, 10)).hp.current).toBe(0)
    expect(produce(down(), (d) => void longRest(d)).hp.current).toBe(0)
  })

  it('временные хиты не складываются (с. 198)', () => {
    const c = produce(down(), (d) => {
      d.hp.current = 10
      setTempHp(d, 10)
      setTempHp(d, 5)
    })
    expect(c.hp.temp).toBe(10)
  })

  it('недееспособность прерывает концентрацию (с. 203)', () => {
    const c = produce(withClasses(['full', 1]), (d) => {
      d.spellcasting.concentration = 'Паутина'
      d.conditions.push('stunned')
      breakConcentrationIfIncapacitated(d)
    })
    expect(c.spellcasting.concentration).toBe('')
    const ko = produce(withClasses(['full', 1]), (d) => {
      d.hp = { max: 10, current: 3, temp: 0 }
      d.spellcasting.concentration = 'Паутина'
      applyDamage(d, 5)
    })
    expect(ko.spellcasting.concentration).toBe('')
  })

  it('мастер на все руки — ко всем проверкам характеристик (с. 54)', () => {
    const c = withClasses(['full', 5])
    c.jackOfAllTrades = true
    expect(abilityCheckBonus(c, 'str')).toBe(0 + 1)
  })

  it('пассивная проверка: −5 при помехе (с. 175)', () => {
    const c = withClasses(['full', 1])
    c.abilities.wis = 14
    expect(passive(c, 'perception')).toBe(12)
    c.conditions = ['poisoned']
    expect(passive(c, 'perception')).toBe(7)
  })
})

describe('сотворение заклинаний', () => {
  const warlock = () => {
    const c = withClasses(['pact', 3])
    c.hp = { max: 22, current: 22, temp: 0 }
    syncSlots(c)
    const res = { ...newResource(), id: 'ff', name: 'Огонь фей', max: 1, current: 1, reset: 'long' as const }
    c.resources = [res]
    c.spellcasting.spells = [
      { ...newSpell(1), id: 'aga', name: 'Доспех Агатиса', tempHp: '5', tempHpUpcast: 5 },
      { ...newSpell(1), id: 'fire', name: 'Огонь фей', concentration: true, resourceId: 'ff', resourceOnly: true },
      { ...newSpell(1), id: 'fam', name: 'Поиск фамильяра', ritual: true, ritualOnly: true },
    ]
    return c
  }

  it('Доспех Агатиса ячейкой договора 2 ур. даёт 10 временных хитов', () => {
    const c = produce(warlock(), (d) => void castSpell(d, 'aga', { kind: 'pact' }, (e) => Number(e)))
    expect(c.hp.temp).toBe(10)
    expect(c.spellcasting.pact.used).toBe(1)
  })

  it('Огонь фей через ресурс не тратит ячейку и включает концентрацию', () => {
    const c = produce(warlock(), (d) => void castSpell(d, 'fire', { kind: 'resource' }))
    expect(c.resources[0].current).toBe(0)
    expect(c.spellcasting.pact.used).toBe(0)
    expect(c.spellcasting.concentration).toBe('Огонь фей')
    let again: { ok: boolean } = { ok: true }
    produce(c, (d) => void (again = castSpell(d, 'fire', { kind: 'resource' })))
    expect(again.ok).toBe(false)
    let bySlot: { ok: boolean } = { ok: true }
    produce(warlock(), (d) => void (bySlot = castSpell(d, 'fire', { kind: 'pact' })))
    expect(bySlot.ok).toBe(false)
  })

  it('ритуал «только как ритуал» не тратит ячейки и не накладывается ячейкой', () => {
    let r: { ok: boolean } = { ok: true }
    const c = produce(warlock(), (d) => void (r = castSpell(d, 'fam', { kind: 'pact' })))
    expect(r.ok).toBe(false)
    expect(c.spellcasting.pact.used).toBe(0)
    produce(warlock(), (d) => void (r = castSpell(d, 'fam', { kind: 'ritual' })))
    expect(r.ok).toBe(true)
  })
})
