import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import './CatalogDialog.css'

export default function CatalogDialog({ title, children, onClose, wide = false, form = false }) {
  const dialog = useRef(null)
  const titleId = useId()
  useEffect(() => {
    const element = dialog.current
    const overflow = document.body.style.overflow
    const rootOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const viewport = window.visualViewport
    const updateViewport = () => {
      element.style.setProperty('--catalog-viewport-height', `${viewport?.height || window.innerHeight}px`)
      element.style.setProperty('--catalog-viewport-top', `${viewport?.offsetTop || 0}px`)
    }
    updateViewport()
    viewport?.addEventListener('resize', updateViewport)
    viewport?.addEventListener('scroll', updateViewport)
    window.addEventListener('resize', updateViewport)
    if (!element.open) element.showModal()
    return () => {
      if (element.open) element.close()
      document.body.style.overflow = overflow
      document.documentElement.style.overflow = rootOverflow
      viewport?.removeEventListener('resize', updateViewport)
      viewport?.removeEventListener('scroll', updateViewport)
      window.removeEventListener('resize', updateViewport)
    }
  }, [])
  return createPortal(
    <dialog ref={dialog} className={`catalog-dialog${wide ? ' catalog-dialog-wide' : ''}${form ? ' catalog-dialog-form' : ''}`}
      aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); onClose() }} onClose={(event) => {
        // StrictMode can reopen the dialog before a cleanup's queued close event arrives.
        // Only a dialog that is still closed should dismiss the editor state.
        if (!event.currentTarget.open) onClose()
      }}>
      <div className="catalog-dialog-shell">
        <header className="catalog-dialog-head">
          <div><p>Catálogo web</p><h2 id={titleId}>{title}</h2></div>
          <button type="button" className="catalog-icon-button" onClick={onClose} aria-label="Cerrar ventana">×</button>
        </header>
        <div className="catalog-dialog-content">{children}</div>
      </div>
    </dialog>, document.body,
  )
}
