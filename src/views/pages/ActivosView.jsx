import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import { MAX_CONTRAINDICACIONES, normalizeContraindicaciones, TIPOS_PIEL, validateActivoPhoto } from '../../constants/activos.js'
import { listActivos, saveActivo } from '../../models/activoModel.js'

const emptyForm = () => ({
  nombre: '', categoria: '', propiedades: '', tiposPiel: [],
  contraindicaciones: [''], fotoUrl: '', fotoPath: '',
})

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
  const nameInput = useRef(null)
  const fileInput = useRef(null)
  const listRequest = useRef(0)
  const contraindicationInputs = useRef([])
  const focusNewContraindication = useRef(false)

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

  useEffect(() => {
    if (focusNewContraindication.current) {
      contraindicationInputs.current[form.contraindicaciones.length - 1]?.focus()
      focusNewContraindication.current = false
    }
  }, [form.contraindicaciones.length])

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

  const changeContraindication = (index, value) => {
    setForm((previous) => ({
      ...previous,
      contraindicaciones: previous.contraindicaciones.map((item, itemIndex) => itemIndex === index ? value : item),
    }))
    clearFeedback()
  }

  const addContraindication = () => {
    if (form.contraindicaciones.length >= MAX_CONTRAINDICACIONES) return
    focusNewContraindication.current = true
    setForm((previous) => ({ ...previous, contraindicaciones: [...previous.contraindicaciones, ''] }))
    clearFeedback()
  }

  const removeContraindication = (index) => {
    setForm((previous) => ({
      ...previous,
      contraindicaciones: previous.contraindicaciones.length === 1
        ? [''] : previous.contraindicaciones.filter((_, itemIndex) => itemIndex !== index),
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
    clearFeedback()
  }

  const clearPhoto = () => {
    setPhotoFile(null)
    setPhotoPreview('')
    setRemovePhoto(true)
    setPhotoError('')
    if (fileInput.current) fileInput.current.value = ''
    clearFeedback()
  }

  const resetForm = () => {
    setForm(emptyForm())
    setEditingId('')
    setPhotoFile(null)
    setPhotoPreview('')
    setRemovePhoto(false)
    setPhotoError('')
    setFormError('')
    if (fileInput.current) fileInput.current.value = ''
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
    resetForm()
    setEditingId(activo.id)
    setForm({
      nombre: activo.nombre,
      categoria: activo.categoria,
      propiedades: activo.propiedades,
      tiposPiel: [...activo.tiposPiel],
      contraindicaciones: contraindicaciones.length ? contraindicaciones : [''],
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
          <p className="subtitle">Inventario y registro de activos cosméticos.</p>
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
          <p className="subtitle">Los campos con * son obligatorios.</p>
          <fieldset className="activos-fields" disabled={saving}>
            <label>
              Nombre del activo
              <input ref={nameInput} name="nombre" value={form.nombre} onChange={changeField} required maxLength={150} placeholder="Ej. Niacinamida" />
            </label>
            <label>
              Categoría
              <input name="categoria" value={form.categoria} onChange={changeField} required maxLength={100} placeholder="Escribe la categoría del activo" />
            </label>
            <div className="activo-photo-field">
              <label>
                Foto del activo
                <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={choosePhoto} aria-describedby="activo-photo-help" />
              </label>
              <p id="activo-photo-help" className="subtitle">Opcional. JPG, PNG o WebP, máximo 10 MB.</p>
              {displayedPhoto ? (
                <div className="activo-photo-preview">
                  <img src={displayedPhoto} alt="Vista previa del activo" />
                  <button type="button" className="main-button secondary" onClick={clearPhoto}>Quitar foto</button>
                </div>
              ) : null}
              {photoError ? <p className="error-text" role="alert">{photoError}</p> : null}
            </div>
            <label>
              Propiedades
              <textarea name="propiedades" value={form.propiedades} onChange={changeField} required maxLength={3000} rows={3} placeholder="Describe las propiedades del activo" />
            </label>
            <fieldset className="activos-skin-fieldset" aria-describedby="activos-skin-help">
              <legend className="required-title">Tipos de piel</legend>
              <p id="activos-skin-help" className="subtitle">Selecciona uno o más tipos de piel.</p>
              <div className="activos-skin-options">
                {TIPOS_PIEL.map((tipo) => (
                  <label key={tipo}>
                    <input type="checkbox" checked={form.tiposPiel.includes(tipo)} onChange={() => toggleSkinType(tipo)} />
                    {tipo}
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="activos-contraindications">
              <legend>Contraindicaciones</legend>
              <p className="subtitle">Agrega una contraindicación por campo, si aplica.</p>
              <ol className="activo-contraindication-inputs">
                {form.contraindicaciones.map((item, index) => (
                  <li key={index}>
                    <label>
                      Contraindicación {index + 1}
                      <textarea ref={(element) => { contraindicationInputs.current[index] = element }} value={item} onChange={(event) => changeContraindication(index, event.target.value)} maxLength={3000} rows={2} placeholder="Escribe una contraindicación" />
                    </label>
                    <button type="button" className="main-button secondary" aria-label={`Quitar contraindicación ${index + 1}`} onClick={() => removeContraindication(index)}>Quitar</button>
                  </li>
                ))}
              </ol>
              <button type="button" className="main-button secondary" onClick={addContraindication} disabled={form.contraindicaciones.length >= MAX_CONTRAINDICACIONES}>Agregar otra contraindicación</button>
            </fieldset>
            <div className="activos-actions">
              <button type="submit" className="main-button">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Guardar activo'}</button>
              {editingId ? <button type="button" className="main-button secondary" onClick={() => { resetForm(); setLoading(true); setSection('inventario') }}>Cancelar edición</button> : null}
            </div>
          </fieldset>
          {formError ? <p className="error-text" role="alert">{formError}</p> : null}
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
                    {activo.fotoUrl ? <img className="activo-card-photo" src={activo.fotoUrl} alt={`Foto de ${activo.nombre}`} loading="lazy" /> : null}
                    <div className="activo-card-title"><h3>{activo.nombre}</h3><span className="activo-category">{activo.categoria}</span></div>
                    {isAdmin || activo.createdBy === currentUser?.id ? (
                      <button type="button" className="main-button secondary" onClick={() => editActivo(activo)} aria-label={`Editar ${activo.nombre}`}>Editar</button>
                    ) : null}
                  </div>
                  <dl>
                    <div><dt>Propiedades</dt><dd>{activo.propiedades}</dd></div>
                    <div><dt>Tipos de piel</dt><dd>{activo.tiposPiel.join(', ')}</dd></div>
                    <div>
                      <dt>Contraindicaciones</dt>
                      <dd>{activo.contraindicaciones.length ? <ul className="activo-contraindication-list">{activo.contraindicaciones.map((item, index) => <li key={index}>{item}</li>)}</ul> : 'Sin registro'}</dd>
                    </div>
                  </dl>
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
