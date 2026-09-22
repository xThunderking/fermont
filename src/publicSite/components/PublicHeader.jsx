import { useState } from 'react'
import { Link } from 'react-router-dom'
import bannerFermont from '../../img/banner.jpeg'
import PublicIcon from './PublicIcon.jsx'

function PublicHeader({ whatsapp }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="public-header-shell">
      <div className="public-header">
        <a className="public-brand" href="/#inicio" aria-label="Fermont, inicio" onClick={closeMenu}>
          <span className="public-brand-logo"><img src={bannerFermont} alt="" /></span>
          <span className="public-brand-copy">
            <strong>Fermont</strong>
            <small>Skin & Beauty Studio</small>
          </span>
        </a>

        <nav className={`public-nav ${isMenuOpen ? 'is-open' : ''}`} aria-label="Navegación principal">
          <a href="/#servicios" onClick={closeMenu}>Servicios</a>
          <a href="/#experiencia" onClick={closeMenu}>Experiencia</a>
          <a href="/#proceso" onClick={closeMenu}>Tu visita</a>
          <Link to="/preregistro" onClick={closeMenu}>Prerregistro</Link>
          <a href="/#contacto" onClick={closeMenu}>Contacto</a>
          <Link className="public-nav-login" to="/login" onClick={closeMenu}>Acceso del personal</Link>
        </nav>

        <div className="public-header-actions">
          <a className="public-button public-button-small public-header-cta" href={whatsapp} target="_blank" rel="noreferrer">
            Agenda tu cita
          </a>
          <button
            className="public-menu-button"
            type="button"
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <PublicIcon name={isMenuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default PublicHeader
