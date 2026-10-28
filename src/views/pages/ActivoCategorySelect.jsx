import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CATEGORIAS_ACTIVOS, TIPOS_PIEL } from '../../constants/activos.js'

const ICONS = [
  'M12 3c-2 4-6 7-6 11a6 6 0 0 0 12 0c0-4-4-7-6-11Z M9 14a3 3 0 0 0 3 3',
  'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z',
  'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
  'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z m-4 9 3 3 5-6',
  'M12 20S3 14 3 8a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 12-9 12Z',
  'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-6 0v6',
  'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z M12 8v8m-4-4h8',
  'M5 11a7 7 0 0 1 14 0v9H5Z M8 11V8a4 4 0 0 1 8 0v3',
  'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9 M12 7v5l-3 3',
  'M4 20C3 8 12 4 21 4c0 11-6 17-14 14 M4 20l11-11',
  'M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5 M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5',
  'm4 17 8-13 8 13Z M4 21h16M9 14h6',
  'M4 7h16M4 12h16M4 17h16M8 4v6m8-1v6m-8-1v6',
  'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z M9 9l6 6m0-6-6 6',
  'M4 8h10a3 3 0 1 0-3-3 M4 12h15a3 3 0 1 1-3 3 M4 16h5',
  'M3 11a9 9 0 0 1 18 0H3Z M12 11v8a2 2 0 0 0 4 0 M12 2V1',
  'M5 16 12 9l7 7M5 9l7-7 7 7M12 9v13',
  'm12 3 2 7 7 2-7 2-2 7-2-7-7-2 7-2Z M20 3v4m-2-2h4',
]

function ActivoMultiSelect({ title, trigger, removeLabel, options, icons, value, onToggle, disabled }) {
  const id = useId()
  const dialog = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    return () => {
      element.close()
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  return (
    <div className="activo-category-field">
      <div className="activo-field-heading">
        <span id={`${id}-label`} className="required-title">{title}</span>
        {value.length ? <span className="activo-selection-count" role="status">{value.length} seleccionadas</span> : null}
      </div>
      <button type="button" className="activo-selector-trigger" aria-haspopup="dialog" aria-controls={`${id}-dialog`} onClick={() => setOpen(true)} disabled={disabled}>
        <span>{trigger}</span><span aria-hidden="true">＋</span>
      </button>
      {value.length ? (
        <ul className="activo-selected-categories" aria-labelledby={`${id}-label`}>
          {value.map((option) => <li key={option}><button type="button" onClick={() => onToggle(option)} aria-label={`${removeLabel} ${option}`} disabled={disabled}>{option}<span aria-hidden="true">×</span></button></li>)}
        </ul>
      ) : null}
      {createPortal(
        <dialog ref={dialog} id={`${id}-dialog`} className="activo-selection-dialog" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); setOpen(false) }} onClose={() => setOpen(false)} onClick={(event) => {
          if (event.target !== event.currentTarget) return
          const rect = event.currentTarget.getBoundingClientRect()
          if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) setOpen(false)
        }}>
          <div className="activo-dialog-panel">
            <header className="activo-dialog-header">
              <div><p className="activo-dialog-kicker">Ficha del activo</p><h2 id={`${id}-title`}>{title}</h2></div>
              <button type="button" className="activo-dialog-close" aria-label={`Cerrar ${title.toLocaleLowerCase('es-MX')}`} onClick={() => setOpen(false)}>×</button>
              <p id={`${id}-description`}>Selecciona una o varias.</p>
            </header>
            <div className="activo-category-options" role="group" aria-label={title}>
              {options.map((option, index) => (
                <label className="activo-category-option" key={option}>
                  <input type="checkbox" checked={value.includes(option)} onChange={() => onToggle(option)} disabled={disabled} />
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icons[index]} /></svg>
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <footer className="activo-dialog-footer">
              <span role="status">{value.length} seleccionadas</span>
              <button type="button" className="main-button" onClick={() => setOpen(false)}>Listo</button>
            </footer>
          </div>
        </dialog>, document.body,
      )}
    </div>
  )
}

export default function ActivoCategorySelect(props) {
  return <ActivoMultiSelect {...props} title="Categorías" trigger="Seleccionar categorías" removeLabel="Quitar categoría" options={CATEGORIAS_ACTIVOS} icons={ICONS} />
}

export function ActivoSkinSelect(props) {
  return <ActivoMultiSelect {...props} title="Tipos de piel" trigger="Seleccionar tipos de piel" removeLabel="Quitar tipo de piel" options={TIPOS_PIEL} icons={[ICONS[0], ICONS[9], ICONS[5], ICONS[6], ICONS[4]]} />
}
