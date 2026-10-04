import { useRef, useState } from 'react'
import { sampleCharacter } from '../data/sample'
import { effectiveMaxHp, totalLevel } from '../lib/calc'
import { go } from '../lib/router'
import { downloadJson, readJsonFile } from '../lib/storage'
import { useStore } from '../state/store'
import { Modal } from './ui'

export function CharacterList() {
  const { characters, create, remove, duplicate, importOne } = useStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [toDelete, setToDelete] = useState<string | null>(null)

  const onImport = async (files: FileList | null) => {
    setError('')
    if (!files) return
    for (const f of Array.from(files)) {
      try {
        const data = await readJsonFile(f)
        const list = Array.isArray(data) ? data : [data]
        list.forEach((x) => {
          if (!importOne(x)) throw new Error()
        })
      } catch {
        setError(`Не удалось импортировать «${f.name}»: файл повреждён или имеет другой формат.`)
      }
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const sorted = [...characters].sort((a, b) => b.updatedAt - a.updatedAt)
  const victim = characters.find((c) => c.id === toDelete)

  return (
    <div className="stack">
      <div className="list-head">
        <h1>Персонажи</h1>
        <div className="row wrap">
          <button className="btn primary" onClick={() => go({ page: 'sheet', id: create() })}>
            + Новый персонаж
          </button>
          <button
            className="btn"
            onClick={() => {
              const id = importOne(sampleCharacter())
              if (id) go({ page: 'play', id })
            }}
          >
            Пример персонажа
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Импорт JSON
          </button>
          {characters.length > 0 && (
            <button className="btn ghost" onClick={() => downloadJson('dnd-characters.json', characters)}>
              Экспорт всех
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            multiple
            hidden
            onChange={(e) => onImport(e.target.files)}
          />
        </div>
      </div>
      {error && <p className="warn">{error}</p>}

      {sorted.length === 0 ? (
        <div className="card welcome">
          <h2>Добро пожаловать!</h2>
          <p>
            Это электронный лист персонажа для D&amp;D 5-й редакции (правила 2014 г.). Создайте
            персонажа и заполните лист — бонусы, спасброски, навыки и ячейки заклинаний
            рассчитываются автоматически. Затем переключитесь в <b>игровой режим</b>: там удобно
            бросать проверки и атаки, отслеживать хиты, ячейки, ресурсы, состояния и отдыхать.
          </p>
          <p className="muted">
            Все данные хранятся только в этом браузере. Используйте экспорт, чтобы сделать
            резервную копию или перенести персонажа на другое устройство.
          </p>
        </div>
      ) : (
        <div className="char-grid">
          {sorted.map((c) => {
            const classes = c.classes
              .filter((x) => x.name)
              .map((x) => `${x.name} ${x.level}`)
              .join(' / ')
            return (
              <article key={c.id} className="card char-card">
                <button className="char-main" onClick={() => go({ page: 'play', id: c.id })}>
                  <h3>{c.name || 'Без имени'}</h3>
                  <p className="muted">
                    {[c.race, classes || `Уровень ${totalLevel(c)}`].filter(Boolean).join(' · ')}
                  </p>
                  <p className="small">
                    Хиты {c.hp.current}/{effectiveMaxHp(c)} · КД {c.ac}
                  </p>
                </button>
                <div className="row wrap">
                  <button className="btn sm primary" onClick={() => go({ page: 'play', id: c.id })}>
                    Играть
                  </button>
                  <button className="btn sm" onClick={() => go({ page: 'sheet', id: c.id })}>
                    Лист
                  </button>
                  <button
                    className="btn sm ghost"
                    onClick={() => downloadJson(`${c.name || 'character'}.json`, c)}
                  >
                    Экспорт
                  </button>
                  <button className="btn sm ghost" onClick={() => duplicate(c.id)}>
                    Копия
                  </button>
                  <button className="btn sm ghost danger" onClick={() => setToDelete(c.id)}>
                    Удалить
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      )}
      {victim && (
        <Modal title="Удалить персонажа?" onClose={() => setToDelete(null)}>
          <p>
            «{victim.name}» будет удалён без возможности восстановления. Сначала можно сделать
            экспорт.
          </p>
          <div className="row end">
            <button className="btn ghost" onClick={() => setToDelete(null)}>
              Отмена
            </button>
            <button
              className="btn danger"
              onClick={() => {
                remove(victim.id)
                setToDelete(null)
              }}
            >
              Удалить
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
