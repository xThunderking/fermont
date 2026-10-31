import { Link } from 'react-router-dom'

const pages = [
  {
    title: 'Página principal',
    description: 'Conoce la presentación, experiencia y servicios de Fermont.',
    href: '/',
    label: 'Abrir página',
  },
  {
    title: 'Prerregistro',
    description: 'Comparte el formulario para que una persona pueda iniciar su prerregistro.',
    href: '/preregistro',
    label: 'Abrir formulario',
  },
  {
    title: 'Aviso de privacidad',
    description: 'Consulta el aviso integral publicado en el sitio.',
    href: '/aviso-privacidad',
    label: 'Ver aviso',
  },
]

function WebsiteView() {
  return (
    <section className="module-screen website-screen">
      <div className="module-screen-head">
        <div>
          <p className="module-kicker">FERMONT · SITIO PÚBLICO</p>
          <h1>Página web</h1>
          <p className="subtitle">Administra el contenido y consulta tu sitio público.</p>
        </div>
        <Link className="main-button secondary" to="/app">Volver al menú</Link>
      </div>

      <section className="website-services-entry">
        <div><p className="module-kicker">Contenido del sitio</p><h2>Servicios</h2><p>Categorías y tratamientos de tu página web.</p></div>
        <Link className="main-button" to="/app/pagina-web/servicios">Administrar servicios →</Link>
      </section>

      <div className="website-page-grid">
        {pages.map((page) => (
          <article className="website-page-card" key={page.href}>
            <div className="website-page-card-mark" aria-hidden="true">F</div>
            <div>
              <h2>{page.title}</h2>
              <p>{page.description}</p>
            </div>
            <a className="main-button" href={page.href} target="_blank" rel="noreferrer">
              {page.label}
            </a>
          </article>
        ))}
      </div>
    </section>
  )
}

export default WebsiteView
