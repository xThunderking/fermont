import { useId, useState } from 'react'
import PublicIcon from '../../publicSite/components/PublicIcon.jsx'
import { SERVICE_ICONS, SERVICE_PALETTES } from '../../constants/websiteServices.js'

const searchable = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es-MX')

function IconPicker({ value, onChange }) {
  const id = useId()
  const [expanded, setExpanded] = useState(false)
  const [search, setSearch] = useState('')
  const selected = SERVICE_ICONS.find((icon) => icon.value === value)
  const choices = SERVICE_ICONS.filter((icon) => searchable(icon.label).includes(searchable(search.trim())))
  return (
    <fieldset className="catalog-icon-picker">
      <legend>Icono</legend>
      <button type="button" className="catalog-icon-trigger" aria-expanded={expanded} aria-controls={id}
        onClick={() => { setExpanded((previous) => !previous); setSearch('') }}>
        <span className="catalog-icon-trigger-symbol"><PublicIcon name={value} /></span>
        <span><strong>{selected?.label || 'Seleccionar icono'}</strong><small>{expanded ? 'Cerrar selector' : 'Cambiar icono'}</small></span>
        <span className="catalog-picker-arrow" aria-hidden="true">{expanded ? '−' : '+'}</span>
      </button>
      {expanded ? <div id={id} className="catalog-icon-panel">
        <input type="search" aria-label="Buscar icono" placeholder="Buscar icono" value={search} onChange={(event) => setSearch(event.target.value)} autoComplete="off" />
        <div className="catalog-icon-options">
          {choices.map((icon) => (
            <label key={icon.value} className={value === icon.value ? 'is-selected' : ''}>
              <input type="radio" name={id} value={icon.value} checked={value === icon.value} onChange={() => onChange(icon.value)} />
              <PublicIcon name={icon.value} /><span>{icon.label}</span>
              {value === icon.value ? <span className="catalog-icon-check" aria-hidden="true">✓</span> : null}
            </label>
          ))}
        </div>
        {!choices.length ? <p className="catalog-icon-empty" role="status">No se encontraron iconos.</p> : null}
      </div> : null}
    </fieldset>
  )
}

function AppearancePreview({ icon, title, caption, accent, soft }) {
  return (
    <div className="catalog-appearance-preview" style={{ '--preview-accent': accent, '--preview-soft': soft }} aria-label="Vista previa de apariencia">
      <span><PublicIcon name={icon} /></span>
      <div><strong>{title}</strong>{caption ? <p>{caption}</p> : null}</div>
    </div>
  )
}

function VisibilitySwitch({ checked, onChange }) {
  return <label className="catalog-visibility">
    <span>Visible en la web</span>
    <input type="checkbox" role="switch" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span className="catalog-switch-track" aria-hidden="true" />
  </label>
}

function FormActions({ onCancel }) {
  return <footer className="catalog-form-actions">
    <button type="button" className="main-button secondary" onClick={onCancel}>Cancelar</button>
    <button type="submit" className="main-button">Aplicar cambios</button>
  </footer>
}

export function CategoryForm({ category, onSave, onCancel }) {
  const [form, setForm] = useState(category || {
    kicker: '', title: '', description: '', icon: 'sparkles', visible: true,
    accent: SERVICE_PALETTES[0].accent, soft: SERVICE_PALETTES[0].soft,
  })
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))
  return (
    <form className="catalog-form" onSubmit={(event) => {
      event.preventDefault()
      onSave({ ...form, kicker: form.kicker.trim(), title: form.title.trim(), description: form.description.trim() })
    }}>
      <div className="catalog-form-body">
        <div className="catalog-form-layout">
          <section className="catalog-form-section" aria-label="Información de la categoría">
            <h3>Información</h3>
            <label className="catalog-field"><span>Nombre de la categoría<span className="catalog-required" aria-hidden="true">*</span></span><input required maxLength={100} value={form.kicker} onChange={(event) => set('kicker', event.target.value)} placeholder="Ej. Faciales" /></label>
            <label className="catalog-field"><span>Título en la página<span className="catalog-required" aria-hidden="true">*</span></span><input required maxLength={180} value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="Cuidado facial para tu piel" /></label>
            <label className="catalog-field">Descripción<textarea rows={5} maxLength={1500} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Presenta los cuidados de esta categoría." /></label>
          </section>
          <section className="catalog-form-section catalog-appearance-section" aria-label="Apariencia de la categoría">
            <h3>Apariencia</h3>
            <AppearancePreview icon={form.icon} title={form.kicker.trim() || 'Nueva categoría'} caption={form.title} accent={form.accent} soft={form.soft} />
            <IconPicker value={form.icon} onChange={(value) => set('icon', value)} />
            <fieldset className="catalog-palette-picker">
              <legend>Colores pastel</legend>
              <div className="catalog-palettes">
                {SERVICE_PALETTES.map((palette) => (
                  <button type="button" key={palette.name} style={{ '--swatch': palette.soft, '--ink': palette.accent }}
                    aria-pressed={form.accent === palette.accent && form.soft === palette.soft}
                    onClick={() => setForm((previous) => ({ ...previous, accent: palette.accent, soft: palette.soft }))}>
                    <span aria-hidden="true" />{palette.name}
                  </button>
                ))}
              </div>
              <details className="catalog-custom-colors"><summary>Personalizar colores</summary>
                <div className="catalog-color-fields">
                  <label>Principal<input type="color" value={form.accent} onChange={(event) => set('accent', event.target.value)} /></label>
                  <label>Fondo<input type="color" value={form.soft} onChange={(event) => set('soft', event.target.value)} /></label>
                </div>
              </details>
            </fieldset>
            <VisibilitySwitch checked={form.visible} onChange={(value) => set('visible', value)} />
          </section>
        </div>
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  )
}

export function ServiceForm({ service, categoryId, categories, onSave, onCancel }) {
  const [form, setForm] = useState({ title: '', tag: '', description: '', icon: 'sparkles', visible: true, ...service, categoryId })
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }))
  const category = categories.find((entry) => entry.id === form.categoryId)
  return (
    <form className="catalog-form" onSubmit={(event) => {
      event.preventDefault()
      onSave({ ...form, title: form.title.trim(), tag: form.tag.trim(), description: form.description.trim() })
    }}>
      <div className="catalog-form-body">
        <div className="catalog-form-layout">
          <section className="catalog-form-section" aria-label="Información del servicio">
            <h3>Información</h3>
            <label className="catalog-field"><span>Nombre del servicio<span className="catalog-required" aria-hidden="true">*</span></span><input required maxLength={150} value={form.title} onChange={(event) => set('title', event.target.value)} placeholder="Ej. Facial hidratante" /></label>
            <label className="catalog-field"><span>Categoría<span className="catalog-required" aria-hidden="true">*</span></span><select required value={form.categoryId} onChange={(event) => set('categoryId', event.target.value)}>
              {categories.map((entry) => <option value={entry.id} key={entry.id}>{entry.kicker}</option>)}
            </select></label>
            <label className="catalog-field"><span>Etiqueta <small>opcional</small></span><input maxLength={80} value={form.tag} onChange={(event) => set('tag', event.target.value)} placeholder="Ej. Hidratación" /></label>
            <label className="catalog-field"><span>Descripción<span className="catalog-required" aria-hidden="true">*</span></span><textarea required rows={5} maxLength={2000} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Describe la experiencia y el cuidado que ofrece." /></label>
          </section>
          <section className="catalog-form-section catalog-appearance-section" aria-label="Apariencia del servicio">
            <h3>Apariencia</h3>
            <AppearancePreview icon={form.icon} title={form.title.trim() || 'Nuevo servicio'} caption={form.tag || category?.kicker} accent={category?.accent || '#9a6741'} soft={category?.soft || '#f1dfd0'} />
            <IconPicker value={form.icon} onChange={(value) => set('icon', value)} />
            <VisibilitySwitch checked={form.visible} onChange={(value) => set('visible', value)} />
          </section>
        </div>
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  )
}
