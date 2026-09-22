import { Link } from 'react-router-dom'
import bannerFermont from '../img/banner.jpeg'
import PublicHeader from './components/PublicHeader.jsx'
import PublicIcon from './components/PublicIcon.jsx'
import useScrollReveal from './hooks/useScrollReveal.js'
import {
  careSteps,
  experienceValues,
  frequentlyAskedQuestions,
  publicSiteConfig,
  serviceCategories,
} from './siteConfig.js'
import './publicSite.css'

const trustMessages = ['Imagen', 'Cuidado', 'Confianza', 'Atención personalizada', 'Belleza que se siente']

function PublicHome() {
  useScrollReveal()
  const totalServices = serviceCategories.reduce((total, category) => total + category.items.length, 0)

  return (
    <div className="public-site">
      <a className="public-skip-link" href="#contenido">Saltar al contenido</a>
      <div className="public-scroll-progress" aria-hidden="true" />
      <PublicHeader whatsapp={publicSiteConfig.whatsapp} />

      <main id="contenido">
        <section className="public-hero" id="inicio">
          <div className="public-hero-ambient public-hero-ambient-one" aria-hidden="true" />
          <div className="public-hero-ambient public-hero-ambient-two" aria-hidden="true" />

          <div className="public-hero-copy" data-reveal="left">
            <p className="public-eyebrow"><span /> Cosmetología facial y corporal</p>
            <h1>El cuidado que tu piel <em>merece sentir.</em></h1>
            <p className="public-lead">
              Una experiencia creada para reconectar contigo, cuidar tu piel y regalarte un momento de calma con atención completamente personalizada.
            </p>

            <div className="public-actions">
              <a className="public-button public-button-primary" href={publicSiteConfig.whatsapp} target="_blank" rel="noreferrer">
                <PublicIcon name="whatsapp" />
                Agendar mi cita
                <PublicIcon name="arrow" className="public-button-arrow" />
              </a>
              <a className="public-button public-button-secondary public-treatments-button" href="#servicios">
                Explorar tratamientos
                <span className="public-treatments-button-icon" aria-hidden="true">
                  <PublicIcon name="arrow" />
                </span>
              </a>
              <Link className="public-text-link" to="/preregistro">
                Hacer mi prerregistro <PublicIcon name="arrow" />
              </Link>
            </div>

            <div className="public-hero-proof" aria-label="Características de la atención">
              <div>
                <strong>01</strong>
                <span>Valoración<br />personalizada</span>
              </div>
              <div>
                <strong>1:1</strong>
                <span>Atención<br />individual</span>
              </div>
              <div>
                <PublicIcon name="heart" />
                <span>Cuidado<br />con intención</span>
              </div>
            </div>
          </div>

          <div className="public-hero-art" data-reveal="scale">
            <div className="public-hero-orbit public-orbit-one" aria-hidden="true" />
            <div className="public-hero-orbit public-orbit-two" aria-hidden="true" />
            <span className="public-hero-star public-star-one" aria-hidden="true">✦</span>
            <span className="public-hero-star public-star-two" aria-hidden="true">✧</span>

            <div className="public-hero-frame">
              <div className="public-frame-corner public-frame-corner-top" aria-hidden="true" />
              <img src={bannerFermont} alt="Fermont Skin & Beauty Studio, belleza que se siente" />
              <div className="public-frame-corner public-frame-corner-bottom" aria-hidden="true" />
            </div>

            <div className="public-floating-note public-floating-note-top">
              <span><PublicIcon name="sparkles" /></span>
              <div><small>Tu momento</small><strong>de bienestar</strong></div>
            </div>
            <div className="public-floating-note public-floating-note-bottom">
              <span className="public-pulse-dot" />
              <div><small>Agenda abierta</small><strong>Previa cita</strong></div>
            </div>
          </div>

          <a className="public-scroll-hint" href="#servicios" aria-label="Desplazarse a servicios">
            <span>Descubre</span><i aria-hidden="true" />
          </a>
        </section>

        <div className="public-trust-strip" aria-label="Valores de Fermont">
          <div className="public-trust-track">
            {[...trustMessages, ...trustMessages].map((message, index) => (
              <span key={`${message}-${index}`} aria-hidden={index >= trustMessages.length ? 'true' : undefined}>
                {message}<i>✦</i>
              </span>
            ))}
          </div>
        </div>

        <section className="public-section public-services" id="servicios">
          <div className="public-section-heading public-heading-split" data-reveal="up">
            <div>
              <p className="public-eyebrow"><span /> Servicios Fermont</p>
              <h2>Rituales creados alrededor de <em>tu piel.</em></h2>
            </div>
            <p>Antes de recomendar, escuchamos. Cada experiencia comienza conociéndote y se adapta a lo que tú necesitas.</p>
          </div>

          <div className="public-services-intro" data-reveal="up">
            <article className="public-service-menu-card">
              <span className="public-service-menu-label">Menú de servicios</span>
              <strong>{totalServices}</strong>
              <p>Opciones faciales y corporales organizadas para que encuentres rápido lo que tu piel o tu cuerpo necesita.</p>
              <a href={publicSiteConfig.recommendationWhatsapp} target="_blank" rel="noreferrer">
                Pedir recomendación <PublicIcon name="arrow" />
              </a>
            </article>

            <div className="public-service-pills" aria-label="Categorías de servicios">
              {serviceCategories.map((category) => (
                <a
                  className="public-service-pill"
                  href={`#${category.id}`}
                  key={category.id}
                  style={{ '--category-accent': category.accent, '--category-soft': category.soft }}
                >
                  <span><PublicIcon name={category.icon} /></span>
                  <div>
                    <small>{category.kicker}</small>
                    <strong>{category.items.length} opciones</strong>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="public-service-catalog">
            {serviceCategories.map((category, categoryIndex) => (
              <section
                className="public-service-category"
                id={category.id}
                key={category.id}
                style={{ '--category-accent': category.accent, '--category-soft': category.soft }}
                aria-labelledby={`${category.id}-title`}
              >
                <div className="public-service-category-header" data-reveal="left">
                  <span className="public-service-category-index">{String(categoryIndex + 1).padStart(2, '0')}</span>
                  <p>{category.kicker}</p>
                  <h3 id={`${category.id}-title`}>{category.title}</h3>
                  <p>{category.description}</p>
                </div>

                <div className="public-service-list">
                  {category.items.map((service, index) => (
                    <article
                      className="public-service-item"
                      key={service.title}
                      data-reveal="up"
                      style={{ '--reveal-delay': `${Math.min(index * 45, 360)}ms` }}
                    >
                      <div className="public-card-shine" aria-hidden="true" />
                      <div className="public-service-item-header">
                        <span className="public-service-symbol"><PublicIcon name={service.icon} /></span>
                        <span className="public-service-item-number">{String(index + 1).padStart(2, '0')}</span>
                      </div>
                      <p className="public-service-tag">{service.tag}</p>
                      <h4>{service.title}</h4>
                      <p>{service.description}</p>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="public-services-note" data-reveal="up">
            <span><PublicIcon name="heart" /></span>
            <p>Cada servicio se personaliza de acuerdo con las características y necesidades de tu piel. Productos y aparatología pueden variar después de la valoración.</p>
            <a href={publicSiteConfig.whatsapp} target="_blank" rel="noreferrer">
              Agendar valoración <PublicIcon name="arrow" />
            </a>
          </div>
        </section>

        <section className="public-experience" id="experiencia">
          <span className="public-experience-word" aria-hidden="true">FERMONT</span>
          <div className="public-experience-inner">
            <div className="public-experience-copy" data-reveal="left">
              <p className="public-eyebrow public-eyebrow-light"><span /> La experiencia Fermont</p>
              <h2>Más que un tratamiento, <em>un espacio para ti.</em></h2>
              <p className="public-experience-lead">Queremos que cada visita se sienta como una pausa: cálida, privada y cuidadosamente preparada.</p>

              <div className="public-value-list">
                {experienceValues.map((value, index) => (
                  <article key={value.title} style={{ '--reveal-delay': `${index * 90}ms` }} data-reveal="left">
                    <span><PublicIcon name={value.icon} /></span>
                    <div><h3>{value.title}</h3><p>{value.description}</p></div>
                  </article>
                ))}
              </div>
            </div>

            <div className="public-experience-art" data-reveal="scale" aria-hidden="true">
              <div className="public-art-ring public-art-ring-outer" />
              <div className="public-art-ring public-art-ring-inner" />
              <div className="public-art-monogram"><span>F</span><span>M</span></div>
              <span className="public-art-leaf public-art-leaf-one" />
              <span className="public-art-leaf public-art-leaf-two" />
              <span className="public-art-leaf public-art-leaf-three" />
              <span className="public-art-sparkle">✦</span>
              <p>Belleza que se siente</p>
            </div>
          </div>
        </section>

        <section className="public-section public-process" id="proceso">
          <div className="public-section-heading public-heading-centered" data-reveal="up">
            <p className="public-eyebrow"><span /> Así comienza tu experiencia</p>
            <h2>Tu cuidado, <em>paso a paso.</em></h2>
            <p>Un proceso sencillo y cercano para que sepas qué esperar desde el primer momento.</p>
          </div>

          <div className="public-process-grid">
            <div className="public-process-line" aria-hidden="true" />
            {careSteps.map((step, index) => (
              <article key={step.title} data-reveal="up" style={{ '--reveal-delay': `${index * 110}ms` }}>
                <span>{step.number}</span>
                <div className="public-process-dot"><i /></div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-manifesto">
          <div className="public-manifesto-orb" aria-hidden="true" />
          <span className="public-manifesto-star public-manifesto-star-one" aria-hidden="true">✦</span>
          <span className="public-manifesto-star public-manifesto-star-two" aria-hidden="true">✧</span>
          <div data-reveal="scale">
            <p>No se trata de cambiar quién eres.</p>
            <h2>Se trata de sentirte bien en <em>tu propia piel.</em></h2>
            <a className="public-button public-button-primary" href={publicSiteConfig.whatsapp} target="_blank" rel="noreferrer">
              Quiero regalarme este momento <PublicIcon name="arrow" />
            </a>
          </div>
        </section>

        <section className="public-section public-information" id="contacto">
          <div className="public-faq" data-reveal="left">
            <p className="public-eyebrow"><span /> Preguntas frecuentes</p>
            <h2>Antes de tu <em>primera visita.</em></h2>
            <div className="public-faq-list">
              {frequentlyAskedQuestions.map((item, index) => (
                <details key={item.question} open={index === 0}>
                  <summary>{item.question}<span aria-hidden="true" /></summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </div>

          <aside className="public-contact-card" data-reveal="right">
            <div className="public-contact-glow" aria-hidden="true" />
            <p className="public-eyebrow public-eyebrow-light"><span /> Agenda tu momento</p>
            <h2>¿Lista para comenzar?</h2>
            <p className="public-contact-intro">Escríbenos y con gusto encontraremos el tratamiento y el horario ideal para ti.</p>

            <div className="public-contact-details">
              <div><span><PublicIcon name="clock" /></span><p><small>Horario</small>{publicSiteConfig.schedule}</p></div>
              <a
                className="public-contact-location"
                href={publicSiteConfig.location}
                target="_blank"
                rel="noreferrer"
                aria-label="Abrir la ubicación de Fermont en Google Maps"
              >
                <span><PublicIcon name="pin" /></span>
                <p><small>Ubicación</small>Abrir en Google Maps</p>
                <PublicIcon name="arrow" />
              </a>
            </div>

            <a className="public-button public-button-light public-contact-button" href={publicSiteConfig.whatsapp} target="_blank" rel="noreferrer">
              <PublicIcon name="whatsapp" /> Escríbenos por WhatsApp <PublicIcon name="arrow" />
            </a>

            <div className="public-socials">
              <span>Síguenos</span>
              <a href={publicSiteConfig.instagram} target="_blank" rel="noreferrer" aria-label="Fermont en Instagram"><PublicIcon name="instagram" /></a>
              <a href={publicSiteConfig.tiktok} target="_blank" rel="noreferrer" aria-label="Fermont en TikTok"><PublicIcon name="tiktok" /></a>
            </div>
          </aside>
        </section>
      </main>

      <footer className="public-footer">
        <a className="public-footer-brand" href="#inicio">
          <strong>Fermont</strong><span>Skin & Beauty Studio</span>
        </a>
        <p>Imagen · Cuidado · Confianza</p>
        <div>
          <span>© {new Date().getFullYear()} Fermont</span>
          <Link to="/login">Acceso del personal</Link>
        </div>
      </footer>

      <a className="public-whatsapp-float" href={publicSiteConfig.whatsapp} target="_blank" rel="noreferrer" aria-label="Agendar una cita por WhatsApp">
        <span className="public-whatsapp-ring" aria-hidden="true" />
        <PublicIcon name="whatsapp" />
        <span>Agenda tu cita</span>
      </a>
    </div>
  )
}

export default PublicHome
