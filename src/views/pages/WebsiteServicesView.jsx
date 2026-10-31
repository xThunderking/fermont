import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthController } from '../../controllers/authController.jsx'
import { getVisibleServiceCategories, moveCatalogEntry, validateServiceCategories } from '../../constants/websiteServices.js'
import { loadWebsiteServices, saveWebsiteServices } from '../../models/websiteServiceModel.js'
import PublicIcon from '../../publicSite/components/PublicIcon.jsx'
import PublicServiceCatalog from '../../publicSite/components/PublicServiceCatalog.jsx'
import CatalogDialog from '../components/CatalogDialog.jsx'
import { CategoryForm, ServiceForm } from './WebsiteServiceForms.jsx'
import './websiteServices.css'

export default function WebsiteServicesView() {
  const { currentUser } = useAuthController()
  const [categories, setCategories] = useState(null)
  const [baseline, setBaseline] = useState('')
  const [revision, setRevision] = useState(0)
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const dirty = categories !== null && JSON.stringify(categories) !== baseline
  const selected = categories?.find((category) => category.id === selectedId) || categories?.[0]
  const visibleCategories = getVisibleServiceCategories(categories || [])
  const total = (categories || []).reduce((sum, category) => sum + category.items.length, 0)
  const visibleTotal = visibleCategories.reduce((sum, category) => sum + category.items.length, 0)

  const applyLoaded = (result) => {
    setLoading(false)
    if (!result.ok) { setError(result.message); return }
    setCategories(result.categories)
    setBaseline(JSON.stringify(result.categories))
    setRevision(result.revision)
    setError('')
    setMessage('')
  }

  useEffect(() => {
    let mounted = true
    loadWebsiteServices().then((result) => { if (mounted) applyLoaded(result) })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!dirty) return
    const warn = (event) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (next) => {
    const validation = validateServiceCategories(next)
    if (validation) { setError(validation); return false }
    setCategories(next)
    setError('')
    setMessage('')
    return true
  }

  const saveCategory = (data) => {
    const category = { ...data, id: modal.category?.id || crypto.randomUUID(), items: modal.category?.items || [] }
    const next = modal.category ? categories.map((entry) => entry.id === category.id ? category : entry) : [...categories, category]
    if (update(next)) { setSelectedId(category.id); setModal(null) }
  }

  const saveService = (data) => {
    const { categoryId, ...fields } = data
    const service = { ...fields, id: modal.service?.id || crypto.randomUUID() }
    const next = categories.map((category) => {
      if (category.id === modal.categoryId && category.id === categoryId && modal.service) {
        return { ...category, items: category.items.map((entry) => entry.id === service.id ? service : entry) }
      }
      const items = category.id === modal.categoryId ? category.items.filter((entry) => entry.id !== service.id) : category.items
      return { ...category, items: category.id === categoryId ? [...items, service] : items }
    })
    if (update(next)) { setSelectedId(categoryId); setModal(null) }
  }

  const remove = () => {
    const next = modal.type === 'delete-category'
      ? categories.filter((category) => category.id !== modal.category.id)
      : categories.map((category) => category.id === modal.categoryId
        ? { ...category, items: category.items.filter((item) => item.id !== modal.service.id) } : category)
    if (update(next)) setModal(null)
  }

  const publish = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    const result = await saveWebsiteServices({ categories, revision, userId: currentUser?.id })
    setSaving(false)
    if (!result.ok) { setError(result.message); return }
    setRevision(result.revision)
    setBaseline(JSON.stringify(categories))
    setMessage('Catálogo publicado. Los cambios ya se muestran en la página web.')
  }

  const reload = async () => {
    setModal(null)
    setLoading(true)
    applyLoaded(await loadWebsiteServices())
  }

  const closeModal = () => setModal(null)

  return (
    <section className="module-screen catalog-editor" aria-busy={loading || saving}>
      <header className="catalog-editor-head">
        <div><p className="module-kicker">Página web</p><h1>Servicios</h1><p className="subtitle">Tu catálogo, a tu manera.</p></div>
        <Link className="main-button secondary" to="/app/pagina-web" onClick={(event) => {
          if (saving || (dirty && !window.confirm('Hay cambios sin publicar. ¿Quieres salir y descartarlos?'))) event.preventDefault()
        }}>Volver</Link>
      </header>

      {loading ? <p role="status">Cargando catálogo…</p> : null}
      {error ? <div className="catalog-notice catalog-notice-error" role="alert">{error}
        <button type="button" className="main-button secondary" disabled={saving} onClick={() => dirty ? setModal({ type: 'reload' }) : reload()}>Recargar catálogo</button>
      </div> : null}
      {message ? <p className="catalog-notice" role="status">{message}</p> : null}

      {categories && !loading ? <>
        <div className="catalog-summary">
          <div><strong>{total}</strong><span>servicios</span></div>
          <div><strong>{categories.length}</strong><span>categorías</span></div>
          <span className="catalog-summary-visible">{visibleTotal} visibles en la web</span>
          <button type="button" className="main-button secondary" onClick={() => setModal({ type: 'preview' })}>Vista previa</button>
        </div>
        <fieldset className="catalog-workspace" disabled={saving}>
          <aside className="catalog-sidebar" aria-label="Categorías">
            <div className="catalog-section-title"><h2>Categorías</h2><button type="button" className="catalog-add-button" disabled={categories.length >= 40} onClick={() => setModal({ type: 'category' })}>+ Nueva</button></div>
            <div className="catalog-category-tabs">
              {categories.map((category) => (
                <button type="button" key={category.id} className={`catalog-category-tab${selected?.id === category.id ? ' is-selected' : ''}`}
                  aria-pressed={selected?.id === category.id} style={{ '--category-accent': category.accent, '--category-soft': category.soft }} onClick={() => setSelectedId(category.id)}>
                  <PublicIcon name={category.icon} />
                  <span>{category.kicker}{!category.visible ? <small>Oculta</small> : null}</span>
                  <span className="catalog-count">{category.items.length}</span>
                </button>
              ))}
            </div>
            {!categories.length ? <p className="subtitle">Crea tu primera categoría.</p> : null}
          </aside>
          <div className="catalog-content">
            {selected ? <>
              <div className="catalog-category-heading" style={{ '--category-accent': selected.accent, '--category-soft': selected.soft }}>
                <div className="catalog-category-title"><PublicIcon name={selected.icon} /><div><h2>{selected.kicker}</h2><p>{selected.title}</p></div></div>
                <div className="catalog-category-actions">
                  <button type="button" className="main-button secondary" onClick={() => setModal({ type: 'category', category: selected })}>Editar categoría</button>
                  <div className="catalog-order-actions">
                    <button type="button" className="catalog-icon-button" disabled={categories[0].id === selected.id} aria-label="Subir categoría" onClick={() => update(moveCatalogEntry(categories, selected.id, -1))}>↑</button>
                    <button type="button" className="catalog-icon-button" disabled={categories.at(-1).id === selected.id} aria-label="Bajar categoría" onClick={() => update(moveCatalogEntry(categories, selected.id, 1))}>↓</button>
                    <button type="button" className="catalog-text-danger" onClick={() => setModal({ type: 'delete-category', category: selected })}>Eliminar</button>
                  </div>
                </div>
              </div>
              <div className="catalog-section-title"><h3>Servicios <span>({selected.items.length})</span></h3><button type="button" className="main-button" disabled={total >= 200} onClick={() => setModal({ type: 'service', categoryId: selected.id })}>+ Agregar servicio</button></div>
              {!selected.items.length ? <div className="catalog-empty"><PublicIcon name="sparkles" /><h3>El próximo ritual empieza aquí</h3><p>Agrega el primer servicio de esta categoría.</p></div> : null}
              <ul className="catalog-service-list">
                {selected.items.map((service, index) => (
                  <li key={service.id} className="catalog-service-row" style={{ '--category-accent': selected.accent, '--category-soft': selected.soft }}>
                    <span className="catalog-service-symbol"><PublicIcon name={service.icon} /></span>
                    <div className="catalog-service-copy"><span className="catalog-service-label">{service.tag}{!service.visible ? <small>Oculto</small> : null}</span><h3>{service.title}</h3><p>{service.description}</p></div>
                    <div className="catalog-service-actions">
                      <button type="button" className="main-button secondary" onClick={() => setModal({ type: 'service', categoryId: selected.id, service })}>Editar</button>
                      <div className="catalog-order-actions">
                        <button type="button" className="catalog-icon-button" disabled={index === 0} aria-label={`Subir ${service.title}`} onClick={() => update(categories.map((category) => category.id === selected.id ? { ...category, items: moveCatalogEntry(category.items, service.id, -1) } : category))}>↑</button>
                        <button type="button" className="catalog-icon-button" disabled={index === selected.items.length - 1} aria-label={`Bajar ${service.title}`} onClick={() => update(categories.map((category) => category.id === selected.id ? { ...category, items: moveCatalogEntry(category.items, service.id, 1) } : category))}>↓</button>
                        <button type="button" className="catalog-text-danger" onClick={() => setModal({ type: 'delete-service', categoryId: selected.id, service })}>Eliminar</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </> : <div className="catalog-empty"><h2>Un espacio para tus servicios</h2><p>Agrega una categoría para comenzar.</p></div>}
          </div>
        </fieldset>
        <footer className="catalog-publish-bar">
          <div><strong>{saving ? 'Publicando…' : dirty ? 'Cambios sin publicar' : revision === 0 ? 'Catálogo inicial' : 'Catálogo actualizado'}</strong><span>Los cambios se publican al guardar.</span></div>
          <button type="button" className="main-button" disabled={saving || (!dirty && revision > 0)} onClick={publish}>{saving ? 'Publicando…' : 'Guardar y publicar'}</button>
        </footer>
      </> : null}

      {modal?.type === 'category' ? <CatalogDialog form title={modal.category ? 'Editar categoría' : 'Nueva categoría'} onClose={closeModal}>
        {error ? <p className="catalog-form-error" role="alert">{error}</p> : null}
        <CategoryForm category={modal.category} onSave={saveCategory} onCancel={closeModal} />
      </CatalogDialog> : null}
      {modal?.type === 'service' ? <CatalogDialog form title={modal.service ? 'Editar servicio' : 'Nuevo servicio'} onClose={closeModal}>
        {error ? <p className="catalog-form-error" role="alert">{error}</p> : null}
        <ServiceForm service={modal.service} categoryId={modal.categoryId} categories={categories} onSave={saveService} onCancel={closeModal} />
      </CatalogDialog> : null}
      {modal?.type.startsWith('delete-') ? <CatalogDialog title={modal.type === 'delete-category' ? 'Eliminar categoría' : 'Eliminar servicio'} onClose={closeModal}>
        <div className="catalog-confirm-body">
          <p>{modal.type === 'delete-category' ? `Se quitará “${modal.category.kicker}” y sus ${modal.category.items.length} servicios del catálogo.` : `Se quitará “${modal.service.title}” del catálogo.`}</p>
          <p>Se aplicará al guardar y publicar.</p>
          <div className="catalog-form-actions"><button type="button" className="main-button secondary" onClick={closeModal}>Cancelar</button><button type="button" className="main-button danger" onClick={remove}>Eliminar</button></div>
        </div>
      </CatalogDialog> : null}
      {modal?.type === 'reload' ? <CatalogDialog title="Recargar catálogo" onClose={closeModal}>
        <div className="catalog-confirm-body"><p>Se descartarán tus cambios sin publicar y se cargará la última versión guardada.</p><div className="catalog-form-actions"><button type="button" className="main-button secondary" onClick={closeModal}>Cancelar</button><button type="button" className="main-button" onClick={reload}>Recargar</button></div></div>
      </CatalogDialog> : null}
      {modal?.type === 'preview' ? <CatalogDialog title="Vista previa de servicios" wide onClose={closeModal}>
        <div className="public-site catalog-public-preview"><PublicServiceCatalog categories={visibleCategories} preview /></div>
      </CatalogDialog> : null}
    </section>
  )
}
