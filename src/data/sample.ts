import { syncSlots } from '../lib/actions'
import { newAttack, newCharacter, newClass, newFeature, newItem, newResource, newSpell } from '../lib/factory'
import type { Character } from '../types'

/** Готовый персонаж для знакомства с приложением: эльфийка-волшебница 3 уровня */
export function sampleCharacter(): Character {
  const c = newCharacter()
  c.name = 'Лиара Звёздный Шёпот'
  c.race = 'Высший эльф'
  c.background = 'Мудрец'
  c.alignment = 'Нейтрально-добрый'
  c.xp = 900
  c.classes = [
    { ...newClass(), name: 'Волшебник', subclass: 'Школа Воплощения', level: 3, hitDie: 6, caster: 'full' },
  ]
  c.abilities = { str: 8, dex: 14, con: 14, int: 17, wis: 12, cha: 10 }
  c.saveProf.int = true
  c.saveProf.wis = true
  c.skills.arcana = 1
  c.skills.history = 1
  c.skills.investigation = 1
  c.skills.perception = 1
  c.ac = 12
  c.speed = 30
  c.hp = { max: 17, current: 17, temp: 0 }
  c.proficiencies = 'Кинжалы, дротики, пращи, боевые посохи, лёгкие арбалеты; длинные мечи, короткие мечи, короткие и длинные луки (эльф)'
  c.languages = 'Общий, Эльфийский, Драконий, Дварфский'
  c.attacks = [
    { ...newAttack(), name: 'Боевой посох', ability: 'str', damage: '1d6', damageType: 'дробящий', notes: 'Универсальное (1d8)' },
    { ...newAttack(), name: 'Кинжал', ability: 'dex', damage: '1d4', damageType: 'колющий', notes: 'Фехтовальное, метательное (20/60)' },
    { ...newAttack(), name: 'Огненный снаряд', ability: 'spell', damage: '1d10', addAbilityToDamage: false, damageType: 'огонь', notes: 'Заговор, 120 фт' },
  ]
  c.spellcasting.ability = 'int'
  c.spellcasting.spells = [
    { ...newSpell(0), name: 'Огненный снаряд', school: 'Воплощение', range: '120 футов', components: 'В, С', attackRoll: true, damage: '1d10', description: 'Дальнобойная атака заклинанием. При попадании цель получает 1d10 урона огнём. Горючие предметы воспламеняются.' },
    { ...newSpell(0), name: 'Свет', school: 'Воплощение', range: 'Касание', components: 'В, М', duration: '1 час', description: 'Предмет испускает яркий свет в радиусе 20 футов и тусклый ещё на 20 футов.' },
    { ...newSpell(0), name: 'Волшебная рука', school: 'Вызов', range: '30 футов', components: 'В, С', duration: '1 минута', description: 'Призрачная парящая рука может манипулировать предметами весом до 10 фунтов.' },
    { ...newSpell(1), name: 'Волшебная стрела', school: 'Воплощение', range: '120 футов', components: 'В, С', damage: '3d4+3', description: 'Три светящихся дротика, каждый наносит 1d4+1 урона силовым полем. Попадают автоматически. +1 дротик за каждый уровень ячейки выше 1.' },
    { ...newSpell(1), name: 'Щит', school: 'Ограждение', castingTime: '1 реакция', range: 'На себя', components: 'В, С', duration: '1 раунд', description: '+5 к КД до начала вашего следующего хода, включая спровоцировавшую атаку. Иммунитет к волшебной стреле.' },
    { ...newSpell(1), name: 'Обнаружение магии', school: 'Прорицание', range: 'На себя', components: 'В, С', duration: '10 минут', concentration: true, ritual: true, description: 'Вы чувствуете присутствие магии в пределах 30 футов.' },
    { ...newSpell(2), name: 'Паутина', school: 'Вызов', range: '60 футов', components: 'В, С, М', duration: '1 час', concentration: true, save: 'dex', description: 'Куб 20 футов из липкой паутины. Существа, провалившие спасбросок Ловкости, становятся опутанными.' },
    { ...newSpell(1), name: 'Огненные ладони', school: 'Воплощение', range: 'На себя (конус 15 фт)', components: 'В, С', save: 'dex', damage: '3d6', description: 'Каждое существо в конусе совершает спасбросок Ловкости: 3d6 урона огнём при провале, половина при успехе.', prepared: false },
  ]
  c.resources = [{ ...newResource(), name: 'Магическое восстановление', max: 1, current: 1, reset: 'long' }]
  c.items = [
    { ...newItem(), name: 'Книга заклинаний', weight: 3, equipped: true },
    { ...newItem(), name: 'Боевой посох', weight: 4, equipped: true },
    { ...newItem(), name: 'Кинжал', qty: 2, weight: 1 },
    { ...newItem(), name: 'Мешочек с компонентами', weight: 2, equipped: true },
    { ...newItem(), name: 'Набор учёного', weight: 10 },
  ]
  c.currency.gp = 15
  c.features = [
    { ...newFeature(), name: 'Тёмное зрение', source: 'Эльф', description: 'Видите в тусклом свете в пределах 60 футов как при ярком, а в темноте — как при тусклом.' },
    { ...newFeature(), name: 'Наследие фей', source: 'Эльф', description: 'Преимущество на спасброски от очарования, магия не может вас усыпить.' },
    { ...newFeature(), name: 'Магическое восстановление', source: 'Волшебник', description: 'Раз в день после короткого отдыха восстановите ячейки суммарным уровнем до половины уровня волшебника (округл. вверх).' },
    { ...newFeature(), name: 'Мастер воплощения', source: 'Школа Воплощения', description: 'Время и золото на копирование заклинаний воплощения уменьшены вдвое. Можете защитить союзников от своих заклинаний воплощения.' },
  ]
  c.personality.traits = 'Я использую многосложные слова, чтобы казаться образованнее.'
  c.personality.ideals = 'Знание. Путь к силе и самосовершенствованию лежит через знание.'
  c.personality.bonds = 'Я ищу утерянный том своего наставника.'
  c.personality.flaws = 'Я легко отвлекаюсь на любую загадку.'
  syncSlots(c)
  return c
}
