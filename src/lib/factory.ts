import { SKILLS } from '../data/rules'
import type {
  Attack,
  Character,
  ClassEntry,
  Feature,
  Item,
  ProfLevel,
  Resource,
  SkillKey,
  Spell,
} from '../types'

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const newClass = (): ClassEntry => ({
  id: uid(),
  name: '',
  subclass: '',
  level: 1,
  hitDie: 8,
  caster: 'none',
  hitDiceUsed: 0,
})

export const newAttack = (): Attack => ({
  id: uid(),
  name: 'Новая атака',
  ability: 'str',
  proficient: true,
  attackBonus: 0,
  damage: '1d6',
  addAbilityToDamage: true,
  damageType: '',
  notes: '',
})

export const newSpell = (level = 0): Spell => ({
  id: uid(),
  name: 'Новое заклинание',
  level,
  school: '',
  prepared: true,
  alwaysPrepared: false,
  castingTime: '1 действие',
  range: '',
  components: '',
  duration: 'Мгновенная',
  concentration: false,
  ritual: false,
  attackRoll: false,
  save: '',
  damage: '',
  description: '',
})

export const newResource = (): Resource => ({
  id: uid(),
  name: 'Ресурс',
  max: 1,
  current: 1,
  reset: 'long',
})

export const newItem = (): Item => ({
  id: uid(),
  name: 'Предмет',
  qty: 1,
  weight: 0,
  equipped: false,
  notes: '',
})

export const newFeature = (): Feature => ({
  id: uid(),
  name: 'Умение',
  source: '',
  description: '',
})

export function newCharacter(): Character {
  const now = Date.now()
  return {
    id: uid(),
    version: 1,
    createdAt: now,
    updatedAt: now,
    name: 'Новый персонаж',
    playerName: '',
    race: '',
    background: '',
    alignment: '',
    xp: 0,
    classes: [newClass()],
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    saveProf: { str: false, dex: false, con: false, int: false, wis: false, cha: false },
    skills: Object.fromEntries(SKILLS.map((s) => [s.key, 0])) as Record<SkillKey, ProfLevel>,
    jackOfAllTrades: false,
    ac: 10,
    initiativeBonus: 0,
    speed: 30,
    hp: { max: 8, current: 8, temp: 0 },
    deathSaves: { successes: 0, failures: 0 },
    inspiration: false,
    conditions: [],
    exhaustion: 0,
    attacks: [],
    spellcasting: {
      ability: '',
      autoSlots: true,
      slots: Array.from({ length: 9 }, () => ({ max: 0, used: 0 })),
      pact: { max: 0, used: 0, level: 0 },
      spells: [],
      concentration: '',
    },
    resources: [],
    items: [],
    currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    features: [],
    proficiencies: '',
    languages: '',
    personality: {
      traits: '',
      ideals: '',
      bonds: '',
      flaws: '',
      appearance: '',
      backstory: '',
    },
    notes: '',
  }
}

/** Дополняет загруженного персонажа недостающими полями (для импорта и старых сохранений) */
export function normalizeCharacter(raw: unknown): Character | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Partial<Character>
  const base = newCharacter()
  const c: Character = {
    ...base,
    ...r,
    abilities: { ...base.abilities, ...r.abilities },
    saveProf: { ...base.saveProf, ...r.saveProf },
    skills: { ...base.skills, ...r.skills },
    hp: { ...base.hp, ...r.hp },
    deathSaves: { ...base.deathSaves, ...r.deathSaves },
    currency: { ...base.currency, ...r.currency },
    personality: { ...base.personality, ...r.personality },
    spellcasting: {
      ...base.spellcasting,
      ...r.spellcasting,
      pact: { ...base.spellcasting.pact, ...r.spellcasting?.pact },
      slots: base.spellcasting.slots.map((s, i) => ({ ...s, ...r.spellcasting?.slots?.[i] })),
      spells: (r.spellcasting?.spells ?? []).map((s) => ({ ...newSpell(), ...s })),
    },
    classes: (r.classes?.length ? r.classes : base.classes).map((cl) => ({ ...newClass(), ...cl })),
    attacks: (r.attacks ?? []).map((a) => ({ ...newAttack(), ...a })),
    resources: (r.resources ?? []).map((x) => ({ ...newResource(), ...x })),
    items: (r.items ?? []).map((x) => ({ ...newItem(), ...x })),
    features: (r.features ?? []).map((x) => ({ ...newFeature(), ...x })),
    conditions: Array.isArray(r.conditions) ? r.conditions : [],
    version: 1,
  }
  if (typeof c.id !== 'string' || !c.id) c.id = uid()
  return c
}
