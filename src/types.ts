export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'

export type SkillKey =
  | 'acrobatics'
  | 'animalHandling'
  | 'arcana'
  | 'athletics'
  | 'deception'
  | 'history'
  | 'insight'
  | 'intimidation'
  | 'investigation'
  | 'medicine'
  | 'nature'
  | 'perception'
  | 'performance'
  | 'persuasion'
  | 'religion'
  | 'sleightOfHand'
  | 'stealth'
  | 'survival'

/** 0 — нет владения, 1 — владение, 2 — компетентность */
export type ProfLevel = 0 | 1 | 2

export type CasterType = 'none' | 'full' | 'half' | 'halfUp' | 'third' | 'pact'

export type ConditionKey =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious'

export interface ClassEntry {
  id: string
  name: string
  subclass: string
  level: number
  hitDie: number
  caster: CasterType
  hitDiceUsed: number
}

export interface Attack {
  id: string
  name: string
  /** 'spell' — использовать базовую характеристику заклинаний */
  ability: Ability | 'spell' | 'none'
  proficient: boolean
  attackBonus: number
  damage: string
  addAbilityToDamage: boolean
  damageType: string
  notes: string
}

export interface Spell {
  id: string
  name: string
  level: number
  school: string
  prepared: boolean
  alwaysPrepared: boolean
  castingTime: string
  range: string
  components: string
  duration: string
  concentration: boolean
  ritual: boolean
  /** Что делает заклинание при сотворении */
  attackRoll: boolean
  save: Ability | ''
  damage: string
  description: string
}

export interface SlotState {
  max: number
  used: number
}

export interface Resource {
  id: string
  name: string
  max: number
  current: number
  reset: 'short' | 'long' | 'none'
}

export interface Item {
  id: string
  name: string
  qty: number
  weight: number
  equipped: boolean
  notes: string
}

export interface Feature {
  id: string
  name: string
  source: string
  description: string
}

export interface Character {
  id: string
  version: 1
  createdAt: number
  updatedAt: number

  name: string
  playerName: string
  race: string
  background: string
  alignment: string
  xp: number
  classes: ClassEntry[]

  abilities: Record<Ability, number>
  saveProf: Record<Ability, boolean>
  skills: Record<SkillKey, ProfLevel>
  jackOfAllTrades: boolean

  ac: number
  initiativeBonus: number
  speed: number
  hp: { max: number; current: number; temp: number }
  deathSaves: { successes: number; failures: number }
  inspiration: boolean
  conditions: ConditionKey[]
  exhaustion: number

  attacks: Attack[]

  spellcasting: {
    /** Класс заклинателя (заголовок 3-й страницы листа) */
    className: string
    ability: Ability | ''
    autoSlots: boolean
    slots: SlotState[] // 9 уровней
    pact: SlotState & { level: number }
    spells: Spell[]
    concentration: string
  }

  resources: Resource[]
  items: Item[]
  currency: { cp: number; sp: number; ep: number; gp: number; pp: number }
  features: Feature[]

  proficiencies: string
  languages: string

  /** Внешние данные (2-я страница листа) */
  details: {
    age: string
    height: string
    weight: string
    eyes: string
    skin: string
    hair: string
  }
  personality: {
    traits: string
    ideals: string
    bonds: string
    flaws: string
    appearance: string
    backstory: string
    allies: string
    treasure: string
  }
  notes: string
}

export type RollMode = 'normal' | 'advantage' | 'disadvantage'
