import { Link } from 'react-router-dom'
import logoFermont from '../img/LOGOFERMONT3.png'
import bannerFermont from '../img/banner.jpeg'
import { publicSiteConfig, services } from './siteConfig.js'
import './publicSite.css'

function PublicHome() {
  return (
    <div className="public-site">
      <header className="public-header">
        <a className="public-brand" href="#inicio" aria-label="Fermont, inicio">
          <img src={logoFermont} alt="" />
          <span>Fermont</span>
        </a>

        <nav className="public-nav" aria-label="Navegación principal">
          <a href="#servicios">Servicios</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
        </nav>

        <a className="public-button public-button-small" href={publicSiteConfig.whatsapp} target="_blank" rel="noreferrer">
          Agenda tu cita
        </a>
      </header>

      <main>
        <section className="public-hero" id="inicio">
          <div className="public-hero-copy">
            <p className="public-eyebrow">Cabina de cuidado facial y corporal</p>
            <h1>Tu piel merece un cuidado pensado para ti.</h1>
            <p className="public-lead">
              Un espacio de calma, atención profesional y tratamientos personalizados para ayudarte a sentirte bien en tu piel.
            </p>
            <div className="public-actions">
              <a className="public-button" href={publicSiteConfig.whatsapp} target="_blank" rel="noreferrer">Agendar por WhatsApp</a>
              <a className="public-text-link" href="#servicios">Conoce los servicios <span aria-hidden="true">→</span></a>
            </div>
          </div>
          <div className="public-hero-visual">
            <img src={bannerFermont} alt="Fermont Skin & Beauty Studio, belleza que se siente" />
          </div>
        </section>

        <section className="public-section public-services" id="servicios">
          <div className="public-section-heading">
            <p className="public-eyebrow">Nuestros servicios</p>
            <h2>Cuidado que comienza por escucharte</h2>
            <p>Cada experiencia parte de una valoración y se adapta a lo que tu piel necesita.</p>
          </div>
          <div className="public-service-grid">
            {services.map((service) => (
              <article className="public-service-card" key={service.title}>
                <span>{service.number}</span>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-section public-about" id="nosotros">
          <div className="public-about-mark">FM</div>
          <div>
            <p className="public-eyebrow">La experiencia Fermont</p>
            <h2>Un momento dedicado por completo a ti</h2>
            <p>Trabajamos con atención cercana, protocolos cuidadosos y recomendaciones honestas. Queremos que cada visita sea una pausa para cuidarte.</p>
            <ul>
              <li>Atención personalizada</li>
              <li>Espacio cómodo y privado</li>
              <li>Seguimiento de tu evolución</li>
            </ul>
          </div>
        </section>

        <section className="public-contact" id="contacto">
          <div>
            <p className="public-eyebrow">Agenda tu momento</p>
            <h2>¿Lista para comenzar?</h2>
            <p>{publicSiteConfig.schedule}</p>
            <p>{publicSiteConfig.address}</p>
          </div>
          <div className="public-contact-actions">
            <a className="public-button public-button-light" href={publicSiteConfig.whatsapp} target="_blank" rel="noreferrer">Escríbenos por WhatsApp</a>
            <div className="public-socials">
              <a href={publicSiteConfig.instagram} target="_blank" rel="noreferrer">Instagram</a>
              <a href={publicSiteConfig.facebook} target="_blank" rel="noreferrer">Facebook</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="public-footer">
        <span>© {new Date().getFullYear()} Fermont</span>
        <span>Cabina de cuidado facial y corporal</span>
        <Link to="/login">Acceso del personal</Link>
      </footer>
    </div>
  )
}

export default PublicHome
