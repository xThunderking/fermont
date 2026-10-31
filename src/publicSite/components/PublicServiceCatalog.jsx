import PublicIcon from './PublicIcon.jsx'
import { publicSiteConfig } from '../siteConfig.js'

export default function PublicServiceCatalog({ categories, preview = false }) {
  const total = categories.reduce((sum, category) => sum + category.items.length, 0)
  const prefix = preview ? 'preview-' : ''
  return (
    <>
      <div className="public-services-intro" data-reveal={preview ? undefined : 'up'}>
        <article className="public-service-menu-card">
          <span className="public-service-menu-label">Menú de servicios</span>
          <strong>{total}</strong>
          <p>Opciones faciales y corporales organizadas para que encuentres fácilmente el cuidado que buscas.</p>
          <a href={publicSiteConfig.recommendationWhatsapp} target="_blank" rel="noreferrer">
            Pedir recomendación <PublicIcon name="arrow" />
          </a>
        </article>
        <div className="public-service-pills" aria-label="Categorías de servicios">
          {categories.map((category) => (
            <a className="public-service-pill" href={`#${prefix}${category.id}`} key={category.id}
              style={{ '--category-accent': category.accent, '--category-soft': category.soft }}>
              <span><PublicIcon name={category.icon} /></span>
              <div>
                <small>{category.kicker}</small>
                <strong>{category.items.length} {category.items.length === 1 ? 'opción' : 'opciones'}</strong>
              </div>
            </a>
          ))}
        </div>
      </div>
      {categories.length === 0 ? <p className="public-catalog-empty">Estamos preparando nuevas experiencias para ti. Escríbenos para conocer los servicios disponibles.</p> : null}
      <div className="public-service-catalog">
        {categories.map((category, categoryIndex) => (
          <section className="public-service-category" id={`${prefix}${category.id}`} key={category.id}
            style={{ '--category-accent': category.accent, '--category-soft': category.soft }}
            aria-labelledby={`${prefix}${category.id}-title`}>
            <div className="public-service-category-header" data-reveal={preview ? undefined : 'left'}>
              <span className="public-service-category-index">{String(categoryIndex + 1).padStart(2, '0')}</span>
              <p>{category.kicker}</p>
              <h3 id={`${prefix}${category.id}-title`}>{category.title}</h3>
              {category.description ? <p>{category.description}</p> : null}
            </div>
            <div className="public-service-list">
              {category.items.map((service, index) => (
                <article className="public-service-item" key={service.id} data-reveal={preview ? undefined : 'up'}
                  style={{ '--reveal-delay': `${Math.min(index * 45, 360)}ms` }}>
                  <div className="public-card-shine" aria-hidden="true" />
                  <div className="public-service-item-header">
                    <span className="public-service-symbol"><PublicIcon name={service.icon} /></span>
                    <span className="public-service-item-number">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  {service.tag ? <p className="public-service-tag">{service.tag}</p> : null}
                  <h4>{service.title}</h4>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
