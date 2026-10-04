import type { Ability, CasterType, SkillKey } from '../types'

export const ABILITIES: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

export const ABILITY_NAMES: Record<Ability, string> = {
  str: 'Сила',
  dex: 'Ловкость',
  con: 'Телосложение',
  int: 'Интеллект',
  wis: 'Мудрость',
  cha: 'Харизма',
}

export const ABILITY_SHORT: Record<Ability, string> = {
  str: 'СИЛ',
  dex: 'ЛОВ',
  con: 'ТЕЛ',
  int: 'ИНТ',
  wis: 'МДР',
  cha: 'ХАР',
}

/** Навыки в порядке и с названиями официального русского листа персонажа (PHB 2014) */
export const SKILLS: { key: SkillKey; name: string; ability: Ability }[] = [
  { key: 'acrobatics', name: 'Акробатика', ability: 'dex' },
  { key: 'athletics', name: 'Атлетика', ability: 'str' },
  { key: 'perception', name: 'Восприятие', ability: 'wis' },
  { key: 'survival', name: 'Выживание', ability: 'wis' },
  { key: 'performance', name: 'Выступление', ability: 'cha' },
  { key: 'intimidation', name: 'Запугивание', ability: 'cha' },
  { key: 'history', name: 'История', ability: 'int' },
  { key: 'sleightOfHand', name: 'Ловкость рук', ability: 'dex' },
  { key: 'arcana', name: 'Магия', ability: 'int' },
  { key: 'medicine', name: 'Медицина', ability: 'wis' },
  { key: 'deception', name: 'Обман', ability: 'cha' },
  { key: 'nature', name: 'Природа', ability: 'int' },
  { key: 'insight', name: 'Проницательность', ability: 'wis' },
  { key: 'investigation', name: 'Расследование', ability: 'int' },
  { key: 'religion', name: 'Религия', ability: 'int' },
  { key: 'stealth', name: 'Скрытность', ability: 'dex' },
  { key: 'persuasion', name: 'Убеждение', ability: 'cha' },
  { key: 'animalHandling', name: 'Уход за животными', ability: 'wis' },
]

export interface ClassTemplate {
  name: string
  hitDie: number
  saves: Ability[]
  caster: CasterType
  spellAbility?: Ability
}

/** Классы из «Книги игрока» 2014 г. (+ изобретатель из Tasha/Eberron) */
export const CLASS_TEMPLATES: ClassTemplate[] = [
  { name: 'Бард', hitDie: 8, saves: ['dex', 'cha'], caster: 'full', spellAbility: 'cha' },
  { name: 'Варвар', hitDie: 12, saves: ['str', 'con'], caster: 'none' },
  { name: 'Воин', hitDie: 10, saves: ['str', 'con'], caster: 'none' },
  { name: 'Волшебник', hitDie: 6, saves: ['int', 'wis'], caster: 'full', spellAbility: 'int' },
  { name: 'Друид', hitDie: 8, saves: ['int', 'wis'], caster: 'full', spellAbility: 'wis' },
  { name: 'Жрец', hitDie: 8, saves: ['wis', 'cha'], caster: 'full', spellAbility: 'wis' },
  { name: 'Изобретатель', hitDie: 8, saves: ['con', 'int'], caster: 'halfUp', spellAbility: 'int' },
  { name: 'Колдун', hitDie: 8, saves: ['wis', 'cha'], caster: 'pact', spellAbility: 'cha' },
  { name: 'Монах', hitDie: 8, saves: ['str', 'dex'], caster: 'none' },
  { name: 'Паладин', hitDie: 10, saves: ['wis', 'cha'], caster: 'half', spellAbility: 'cha' },
  { name: 'Плут', hitDie: 8, saves: ['dex', 'int'], caster: 'none' },
  { name: 'Следопыт', hitDie: 10, saves: ['str', 'dex'], caster: 'half', spellAbility: 'wis' },
  { name: 'Чародей', hitDie: 6, saves: ['con', 'cha'], caster: 'full', spellAbility: 'cha' },
]

export const CASTER_TYPE_NAMES: Record<CasterType, string> = {
  none: 'Не заклинатель',
  full: 'Полный заклинатель',
  half: 'Половинный (паладин, следопыт)',
  halfUp: 'Половинный, округл. вверх (изобретатель)',
  third: 'Треть (мистич. рыцарь / ловкач)',
  pact: 'Магия договора (колдун)',
}

export const RACES = [
  'Человек',
  'Дварф',
  'Эльф',
  'Полурослик',
  'Драконорождённый',
  'Гном',
  'Полуэльф',
  'Полуорк',
  'Тифлинг',
]

export const ALIGNMENTS = [
  'Законно-добрый',
  'Нейтрально-добрый',
  'Хаотично-добрый',
  'Законно-нейтральный',
  'Истинно нейтральный',
  'Хаотично-нейтральный',
  'Законно-злой',
  'Нейтрально-злой',
  'Хаотично-злой',
]

export const SPELL_SCHOOLS = [
  'Ограждение',
  'Вызов',
  'Прорицание',
  'Очарование',
  'Воплощение',
  'Иллюзия',
  'Некромантия',
  'Преобразование',
]

export const DAMAGE_TYPES = [
  'дробящий',
  'колющий',
  'рубящий',
  'кислота',
  'огонь',
  'холод',
  'электричество',
  'звук',
  'яд',
  'некротическая энергия',
  'излучение',
  'силовое поле',
  'психическая энергия',
]

/** Опыт, необходимый для каждого уровня (индекс = уровень - 1) */
export const XP_THRESHOLDS = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000,
  165000, 195000, 225000, 265000, 305000, 355000,
]

/** Ячейки заклинаний по уровню заклинателя (таблица мультикласса, PHB) */
export const SPELL_SLOT_TABLE: number[][] = [
  [],
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
]

/** Магия договора колдуна: [кол-во ячеек, уровень ячеек] */
export function pactSlots(warlockLevel: number): { max: number; level: number } {
  if (warlockLevel <= 0) return { max: 0, level: 0 }
  const max = warlockLevel === 1 ? 1 : warlockLevel <= 10 ? 2 : warlockLevel <= 16 ? 3 : 4
  const level = Math.min(5, Math.ceil(warlockLevel / 2))
  return { max, level }
}

export const SPELL_LEVEL_NAMES = [
  'Заговоры',
  '1 уровень',
  '2 уровень',
  '3 уровень',
  '4 уровень',
  '5 уровень',
  '6 уровень',
  '7 уровень',
  '8 уровень',
  '9 уровень',
]
