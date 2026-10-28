import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import { CATEGORIAS_ACTIVOS, normalizeCategorias, normalizeContraindicaciones, normalizePropiedades, TIPOS_PIEL, validateActivoPhoto } from '../../constants/activos.js'
import { listActivos, saveActivo } from '../../models/activoModel.js'
import ActivoCategorySelect, { ActivoSkinSelect } from './ActivoCategorySelect.jsx'

const emptyForm = () => ({
  nombre: '', categoria: [], propiedades: '', tiposPiel: [],
  contraindicaciones: '', fotoUrl: '', fotoPath: '',
})

function ActivoCardPhoto({ src, name }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="activo-card-media">
      {src && !failed ? (
        <img className="activo-card-photo" src={src} alt={`Foto de ${name}`} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <div className="activo-card-placeholder">
          <svg viewBox="0 0 64 80" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M25 25V13a7 7 0 0 1 14 0v12M22 25h20v10H22zM22 35l-5 9v24a6 6 0 0 0 6 6h18a6 6 0 0 0 6-6V44l-5-9M17 49h30M32 52v15" />
            <path d="M53 12v10m-5-5h10M8 32v8m-4-4h8" strokeLinecap="round" />
          </svg>
          <span>Sin fotografía</span>
        </div>
      )}
    </div>
  )
}

function ActivosView() {
  const navigate = useNavigate()
  const { currentUser, isAdmin } = useAuthController()
  const [section, setSection] = useState('inventario')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [removePhoto, setRemovePhoto] = useState(false)
  const [activos, setActivos] = useState([])
  const [search, setSearch] = useState('')
  const [cursor, setCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [listError, setListError] = useState('')
  const [success, setSuccess] = useState('')
  const [revision, setRevision] = useState(0)
  const [legacyClassification, setLegacyClassification] = useState('')
  const nameInput = useRef(null)
  const fileInput = useRef(null)
  const cameraInput = useRef(null)
  const listRequest = useRef(0)

  useEffect(() => {
    if (section !== 'inventario') return
    let active = true
    const request = ++listRequest.current
    const load = async () => {
      setLoading(true)
      setLoadingMore(false)
      setListError('')
      const result = await listActivos({ search })
      if (!active || request !== listRequest.current) return

      if (result.ok) {
        setActivos(result.activos)
        setCursor(result.cursor)
        setHasMore(result.hasMore)
      } else {
        setActivos([])
        setHasMore(false)
        setListError(result.message)
      }
      setLoading(false)
    }
    const timer = setTimeout(load, 250)
    return () => {
      active = false
      clearTimeout(timer)
      listRequest.current += 1
    }
  }, [section, search, revision])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  useEffect(() => {
    if (section === 'registro' && editingId) nameInput.current?.focus()
  }, [section, editingId])

  const clearFeedback = () => {
    setFormError('')
    setSuccess('')
  }

  const changeField = (event) => {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
    clearFeedback()
  }

  const toggleSkinType = (tipo) => {
    setForm((previous) => ({
      ...previous,
      tiposPiel: previous.tiposPiel.includes(tipo)
        ? previous.tiposPiel.filter((value) => value !== tipo)
        : [...previous.tiposPiel, tipo],
    }))
    clearFeedback()
  }

  const toggleCategory = (categoria) => {
    setForm((previous) => ({
      ...previous,
      categoria: previous.categoria.includes(categoria)
        ? previous.categoria.filter((value) => value !== categoria)
        : [...previous.categoria, categoria],
    }))
    clearFeedback()
  }

  const choosePhoto = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const result = validateActivoPhoto(file)
    if (!result.ok) {
      setPhotoError(result.message)
      event.target.value = ''
      return
    }
    setPhotoError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
    setRemovePhoto(false)
    event.target.value = ''
    clearFeedback()
  }

  const clearPhoto = () => {
    setPhotoFile(null)
    setPhotoPreview('')
    setRemovePhoto(true)
    setPhotoError('')
    if (fileInput.current) fileInput.current.value = ''
    if (cameraInput.current) cameraInput.current.value = ''
    clearFeedback()
  }

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId('')
    setLegacyClassification('')
    setPhotoFile(null)
    setPhotoPreview('')
    setRemovePhoto(false)
    setPhotoError('')
    setFormError('')
    if (fileInput.current) fileInput.current.value = ''
    if (cameraInput.current) cameraInput.current.value = ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    clearFeedback()
    const result = await saveActivo({ userId: currentUser?.id, activoId: editingId, data: form, photoFile, removePhoto })
    setSaving(false)
    if (!result.ok) {
      setFormError(result.message)
      return
    }

    resetForm()
    setSuccess(result.message)
    setLoading(true)
    setSearch('')
    setRevision((previous) => previous + 1)
    setSection('inventario')
  }

  const editActivo = (activo) => {
    const contraindicaciones = normalizeContraindicaciones(activo.contraindicaciones)
    const categorias = normalizeCategorias(activo.categoria)
    const previousValues = [...categorias.filter((value) => !CATEGORIAS_ACTIVOS.includes(value)), ...activo.tiposPiel.filter((value) => !TIPOS_PIEL.includes(value))]
    resetForm()
    setLegacyClassification(previousValues.length ? `Clasificación anterior: ${previousValues.join(', ')}. Selecciona las opciones del nuevo catálogo antes de guardar.` : '')
    setEditingId(activo.id)
    setForm({
      nombre: activo.nombre,
      categoria: categorias.filter((value) => CATEGORIAS_ACTIVOS.includes(value)),
      propiedades: normalizePropiedades(activo.propiedades).join('\n'),
      tiposPiel: activo.tiposPiel.filter((value) => TIPOS_PIEL.includes(value)),
      contraindicaciones: contraindicaciones.join('\n'),
      fotoUrl: activo.fotoUrl || '',
      fotoPath: activo.fotoPath || '',
    })
    setSuccess('')
    setSection('registro')
  }

  const loadMore = async () => {
    if (loading || loadingMore || !cursor) return
    const request = listRequest.current
    setLoadingMore(true)
    setListError('')
    const result = await listActivos({ search, cursor })
    if (request !== listRequest.current) return
    if (result.ok) {
      setActivos((previous) => [...previous, ...result.activos])
      setCursor(result.cursor)
      setHasMore(result.hasMore)
    } else {
      setListError(result.message)
    }
    setLoadingMore(false)
  }

  const displayedPhoto = photoFile ? photoPreview : removePhoto ? '' : form.fotoUrl

  const switchSection = (nextSection) => {
    if (nextSection === section || saving) return
    if (nextSection === 'inventario') setLoading(true)
    setSection(nextSection)
  }

  return (
    <section className="module-screen activos-screen">
      <div className="module-screen-head">
        <button type="button" className="main-button secondary" onClick={() => navigate('/app')} disabled={saving}>
          Regresar al menú principal
        </button>
        <div>
          <h1>Activos</h1>
        </div>
      </div>

      <nav className="activos-navigation" aria-label="Secciones de Activos">
        <button type="button" className={`main-button ${section === 'inventario' ? '' : 'secondary'}`} aria-pressed={section === 'inventario'} onClick={() => switchSection('inventario')} disabled={saving}>Inventario</button>
        <button type="button" className={`main-button ${section === 'registro' ? '' : 'secondary'}`} aria-pressed={section === 'registro'} onClick={() => switchSection('registro')} disabled={saving}>Registro</button>
      </nav>

      {success ? <p className="success-text" role="status">{success}</p> : null}

      {section === 'registro' ? (
        <form className="activos-form" onSubmit={handleSubmit} aria-labelledby="activos-form-title">
          <h2 id="activos-form-title">{editingId ? 'Editar activo cosmético' : 'Nuevo activo cosmético'}</h2>
          <fieldset className="activos-fields" disabled={saving}>
            <section className="activo-form-section" aria-labelledby="activo-basics-title">
              <div className="activo-section-heading"><span aria-hidden="true">01</span><h3 id="activo-basics-title">Conoce el activo</h3></div>
              <div className="activo-basics-grid">
              <div className="activo-basics-text">
            <label>
              <span className="required-title">Nombre del activo</span>
              <input ref={nameInput} name="nombre" value={form.nombre} onChange={changeField} required maxLength={150} placeholder="Ej. Niacinamida" />
            </label>
            <label>
              <span className="required-title">Propiedades</span>
              <textarea name="propiedades" value={form.propiedades} onChange={changeField} required maxLength={3000} rows={4} aria-describedby="activo-propiedades-help" placeholder={'Hidrata la piel.\nRefuerza la barrera cutánea.'} />
              <span id="activo-propiedades-help" className="activo-input-hint">Una por renglón.</span>
            </label>
              </div>
            <div className="activo-photo-field">
              <span className="activo-photo-label" id="activo-photo-label">Foto del activo</span>
              <input ref={fileInput} id="activo-gallery-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} aria-label="Elegir foto de la galería" aria-describedby="activo-photo-help" hidden />
              <input ref={cameraInput} id="activo-camera-input" type="file" accept="image/*" capture="environment" onChange={choosePhoto} aria-label="Tomar foto del activo" aria-describedby="activo-photo-help" hidden />
              <div className="activo-photo-picker" role="group" aria-labelledby="activo-photo-label">
                <div className="activo-photo-preview">
                  {displayedPhoto ? (
                    <img src={displayedPhoto} alt="Vista previa del activo" />
                  ) : (
                    <div className="activo-photo-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <path d="M8 6 9.5 3h5L16 6h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                      <span>Foto del activo</span>
                    </div>
                  )}
                </div>
                <div className="activo-photo-controls">
                  <button type="button" className="main-button secondary" onClick={() => cameraInput.current?.click()}>Tomar foto</button>
                  <button type="button" className="main-button secondary" onClick={() => fileInput.current?.click()}>Elegir de la galería</button>
                  {displayedPhoto ? <button type="button" className="main-button secondary" onClick={clearPhoto}>Quitar foto</button> : null}
                </div>
              </div>
              <p id="activo-photo-help" className="activo-input-hint">Opcional · JPG, PNG o WebP · 10 MB</p>
              {photoError ? <p className="error-text" role="alert">{photoError}</p> : null}
            </div>
              </div>
            </section>
            <section className="activo-form-section" aria-labelledby="activo-classification-title">
              <div className="activo-section-heading"><span aria-hidden="true">02</span><h3 id="activo-classification-title">Clasifica sus beneficios</h3></div>
              {legacyClassification ? <p className="activo-legacy-notice" role="status">{legacyClassification}</p> : null}
              <ActivoCategorySelect value={form.categoria} onToggle={toggleCategory} disabled={saving} />
              <ActivoSkinSelect value={form.tiposPiel} onToggle={toggleSkinType} disabled={saving} />
            </section>
            <section className="activo-form-section" aria-labelledby="activo-safety-title">
              <div className="activo-section-heading"><span aria-hidden="true">03</span><h3 id="activo-safety-title">Cuidados y precauciones</h3></div>
              <div className="activo-field-heading"><label htmlFor="activo-contraindicaciones">Contraindicaciones</label><span className="activo-input-hint">Opcional</span></div>
              <div className="activo-text-field">
                <textarea id="activo-contraindicaciones" name="contraindicaciones" value={form.contraindicaciones} onChange={changeField} maxLength={10019} rows={4} aria-describedby="activo-contraindicaciones-help" placeholder={'Evitar en caso de alergia al ingrediente.\nNo aplicar sobre piel irritada.'} />
                <p id="activo-contraindicaciones-help" className="activo-input-hint">Una por renglón.</p>
              </div>
            </section>
            {formError ? <p className="error-text" role="alert">{formError}</p> : null}
            <div className="activos-actions">
              <button type="submit" className="main-button">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar activo'}</button>
              {editingId ? <button type="button" className="main-button secondary" onClick={() => { resetForm(); setLoading(true); setSection('inventario') }}>Cancelar edición</button> : null}
            </div>
          </fieldset>
        </form>
      ) : (
        <section className="activos-registry" aria-labelledby="activos-registry-title" aria-busy={loading || loadingMore}>
          <h2 id="activos-registry-title">Inventario de activos</h2>
          <label>
            Buscar por nombre
            <input type="search" value={search} onChange={(event) => { setLoading(true); setSearch(event.target.value) }} placeholder="Escribe el inicio del nombre" />
          </label>
          {listError ? (
            <div className="activos-feedback">
              <p className="error-text" role="alert">{listError}</p>
              <button type="button" className="main-button secondary" onClick={() => { setLoading(true); setRevision((previous) => previous + 1) }}>Reintentar carga</button>
            </div>
          ) : null}
          {loading ? <p className="subtitle" role="status">Cargando activos...</p> : null}
          {!loading && !listError && activos.length === 0 ? (
            <p className="subtitle">{search.trim() ? 'No se encontraron activos con ese nombre.' : 'Aún no hay activos registrados.'}</p>
          ) : null}
          {!loading ? (
            <ul className="activos-list">
              {activos.map((activo) => (
                <li key={activo.id} className="activo-card">
                  <div className="activo-card-heading">
                    <ActivoCardPhoto key={activo.fotoUrl || 'sin-foto'} src={activo.fotoUrl} name={activo.nombre} />
                    <div className="activo-card-title">
                      <span className="activo-card-eyebrow">Activo cosmético</span>
                      <h3>{activo.nombre}</h3>
                      <ul className="activo-card-categories" aria-label="Categorías del activo">
                        {normalizeCategorias(activo.categoria).map((categoria) => <li key={categoria} className="activo-category">{categoria}</li>)}
                      </ul>
                    </div>
                  </div>
                  <dl className="activo-card-details">
                    <div><dt>Propiedades</dt><dd><ul className="activo-properties-list">{normalizePropiedades(activo.propiedades).map((item, index) => <li key={index}>{item}</li>)}</ul></dd></div>
                    <div>
                      <dt>Tipos de piel</dt>
                      <dd>
                        <ul className="activo-skin-tags" aria-label="Tipos de piel compatibles">
                          {activo.tiposPiel.map((tipo) => <li key={tipo}>{tipo}</li>)}
                        </ul>
                      </dd>
                    </div>
                    <div>
                      <dt>Contraindicaciones</dt>
                      <dd>{activo.contraindicaciones.length ? <ul className="activo-contraindication-list">{activo.contraindicaciones.map((item, index) => <li key={index}>{item}</li>)}</ul> : 'Sin registro'}</dd>
                    </div>
                  </dl>
                  {isAdmin || activo.createdBy === currentUser?.id ? (
                    <div className="activo-card-footer">
                      <button type="button" className="activo-edit-button" onClick={() => editActivo(activo)} aria-label={`Editar ${activo.nombre}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                          <path d="m15 5 4 4M4 20l4-1 12-12a2.8 2.8 0 0 0-4-4L4 15l-1 6z" strokeLinejoin="round" />
                        </svg>
                        Editar ficha
                      </button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {!loading && hasMore ? (
            <button type="button" className="main-button secondary" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Cargando...' : 'Cargar más activos'}
            </button>
          ) : null}
        </section>
      )}
    </section>
  )
}

export default ActivosView
